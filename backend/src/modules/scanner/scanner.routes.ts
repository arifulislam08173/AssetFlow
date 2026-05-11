import { Router } from "express";
import { Op } from "sequelize";
import { Asset, AssetCategory, Employee, Location, Vendor } from "../../models";
import { ok } from "../../utils/api-response";
import { ApiError } from "../../utils/errors";
export const scannerRoutes = Router();
scannerRoutes.get("/search", async(req,res,next)=>{ try { const q=String(req.query.q||"").trim(); if(!q) throw new ApiError(400,"Search query is required"); const asset=await Asset.findOne({ where:{ [Op.or]:[{assetCode:q},{serialNumber:q},{assetTag:q},{assetCode:{[Op.iLike]:`%${q}%`}},{serialNumber:{[Op.iLike]:`%${q}%`}},{assetTag:{[Op.iLike]:`%${q}%`}}] }, include:[{model:AssetCategory,as:"category"},{model:Vendor,as:"vendor"},{model:Location,as:"location"},{model:Employee,as:"assignedEmployee"}] }); if(!asset) throw new ApiError(404,"Asset not found"); ok(res,"Asset found", asset); } catch(e){ next(e); } });
