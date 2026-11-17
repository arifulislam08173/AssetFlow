import { addListQuery } from "../utils/list-query";
import { Router } from "express";
import { pdfMoney, sendPdfReport } from "../utils/pdf-report";
import { z } from "zod";
import { Asset, RepairTicket, Vendor } from "../models";
import { created, ok } from "../utils/api-response";
import { ApiError } from "../utils/errors";
import { getPagination, getPagingMeta } from "../utils/pagination";
import { writeAudit } from "../services/audit.service";

export const repairRoutes = Router();
const schema = z.object({
  ticketCode: z.string().min(2),
  assetId: z.string().uuid(),
  problem: z.string().min(2),
  repairVendorId: z.string().uuid().optional().nullable(),
  repairCost: z.number().nonnegative().default(0),
  status: z.string().default("Open"),
});

async function repairWithDetails(id: string) {
  return RepairTicket.findByPk(id, { include: [Asset, Vendor] });
}

repairRoutes.get("/", async (req, res, next) => {
  try {
    const { page, limit, offset } = getPagination(req);
    const where: any = {};
    addListQuery(where, req, { search: ["ticketCode", "problem", "$Asset.assetCode$", "$Asset.name$", "$Vendor.name$"], exact: ["status", "repairVendorId"], date: "reportedAt", dateOnly: false });
    const include: any[] = [{ model: Asset }, { model: Vendor }];
    if (req.query.companyId) {
      include[0].where = { companyId: req.query.companyId };
      include[0].required = true;
    }
    const { rows, count } = await RepairTicket.findAndCountAll({
      where,
      subQuery: false,
      include,
      distinct: true,
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });
    ok(res, "Repair tickets fetched successfully", rows, getPagingMeta(count, page, limit));
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.post("/", async (req, res, next) => {
  try {
    const body = schema.parse(req.body);
    const ticket = await RepairTicket.create(body as any);
    await Asset.update({ status: "In Repair" }, { where: { id: ticket.assetId } });
    await writeAudit(req, {
      action: "Created",
      module: "Repairs",
      recordId: ticket.id,
      afterSnapshot: ticket.toJSON(),
    });
    created(res, "Repair ticket created successfully", ticket);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.get("/:id", async (req, res, next) => {
  try {
    const item = await repairWithDetails(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    ok(res, "Repair ticket fetched successfully", item);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.patch("/:id", async (req, res, next) => {
  try {
    const item = await RepairTicket.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    const before = item.toJSON();
    const body = schema.partial().parse(req.body);
    await item.update(body);
    if (body.status && ["Completed", "Returned", "Cancelled"].includes(body.status)) {
      await Asset.update({ status: "Available" }, { where: { id: item.assetId } });
    }
    else if (body.status) {
      await Asset.update({ status: "In Repair" }, { where: { id: item.assetId } });
    }
    await writeAudit(req, {
      action: "Updated",
      module: "Repairs",
      recordId: item.id,
      beforeSnapshot: before,
      afterSnapshot: item.toJSON(),
    });
    ok(res, "Repair ticket updated successfully", item);
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.delete("/:id", async (req, res, next) => {
  try {
    const item = await RepairTicket.findByPk(req.params.id);
    if (!item)
      throw new ApiError(404, "Repair ticket not found");
    const before = item.toJSON();
    await item.destroy();
    await writeAudit(req, {
      action: "Deleted",
      module: "Repairs",
      recordId: req.params.id,
      beforeSnapshot: before,
    });
    ok(res, "Repair ticket deleted successfully");
  }
  catch (e) {
    next(e);
  }
});

repairRoutes.get("/:id/pdf", async (req, res, next) => {
  try {
    const item: any = await repairWithDetails(req.params.id);
    if (!item) throw new ApiError(404, "Repair ticket not found");
    const asset = item.Asset || {};
    const vendor = item.Vendor || {};
    sendPdfReport(res, {
      title: "Asset Repair / Upgrade Record", filename: `repair-${item.ticketCode}.pdf`,
      subtitle: "Maintenance ticket and cost details",
      details: [
        ["Ticket", item.ticketCode], ["Status", item.status],
        ["Asset Code", asset.assetCode], ["Asset", asset.name],
        ["Serial", asset.serialNumber], ["Repair Vendor", vendor.name],
        ["Reported", item.reportedAt], ["Repair Cost", pdfMoney(item.repairCost)],
        ["Problem / Work Description", item.problem],
      ],
      sections: [],
    });
  } catch (error) { next(error); }
});
