import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class AuditLog extends Model {
  declare id: string;
  declare userId: string | null;
  declare userName: string | null;
  declare action: string;
  declare module: string;
  declare recordId: string | null;
  declare ipAddress: string | null;
  declare device: string | null;
  declare beforeSnapshot: object | null;
  declare afterSnapshot: object | null;
}
AuditLog.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      field: "user_id",
    },
    userName: {
      type: DataTypes.STRING(140),
      field: "user_name",
    },
    action: {
      type: DataTypes.STRING(60),
      allowNull: false,
    },
    module: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    recordId: {
      type: DataTypes.STRING(120),
      field: "record_id",
    },
    ipAddress: {
      type: DataTypes.STRING(80),
      field: "ip_address",
    },
    device: {
      type: DataTypes.STRING(255),
    },
    beforeSnapshot: {
      type: DataTypes.JSONB,
      field: "before_snapshot",
    },
    afterSnapshot: {
      type: DataTypes.JSONB,
      field: "after_snapshot",
    },
  },
  {
    sequelize,
    tableName: "audit_logs",
  },
);
