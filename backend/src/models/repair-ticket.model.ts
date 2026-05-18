import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class RepairTicket extends Model {
  declare id: string;
  declare ticketCode: string;
  declare assetId: string;
  declare problem: string;
  declare repairVendorId: string | null;
  declare repairCost: number;
  declare status: string;
  declare reportedAt: Date;
}
RepairTicket.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    ticketCode: {
      type: DataTypes.STRING(60),
      unique: true,
      allowNull: false,
      field: "ticket_code",
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "asset_id",
    },
    problem: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    repairVendorId: {
      type: DataTypes.UUID,
      field: "repair_vendor_id",
    },
    repairCost: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "repair_cost",
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Open",
    },
    reportedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "reported_at",
    },
  },
  {
    sequelize,
    tableName: "repair_tickets",
  },
);
