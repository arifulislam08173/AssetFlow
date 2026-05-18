import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class AssetAssignment extends Model {
  declare id: string;
  declare assetId: string;
  declare employeeId: string;
  declare assignedById: string;
  declare assignedAt: Date;
  declare conditionAtAssign: string;
  declare notes: string | null;
  declare returnedAt: Date | null;
}
AssetAssignment.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assetId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "asset_id",
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
    },
    assignedById: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "assigned_by_id",
    },
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "assigned_at",
    },
    conditionAtAssign: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Good",
      field: "condition_at_assign",
    },
    notes: {
      type: DataTypes.TEXT,
    },
    returnedAt: {
      type: DataTypes.DATE,
      field: "returned_at",
    },
  },
  {
    sequelize,
    tableName: "asset_assignments",
  },
);
