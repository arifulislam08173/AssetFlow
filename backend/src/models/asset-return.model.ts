import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class AssetReturn extends Model {
  declare id: string;
  declare assignmentId: string;
  declare assetId: string;
  declare employeeId: string;
  declare receivedById: string;
  declare returnStatus: string;
  declare returnCondition: string;
  declare penaltyAmount: number;
  declare notes: string | null;
}
AssetReturn.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    assignmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "assignment_id",
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
    receivedById: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "received_by_id",
    },
    returnStatus: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Returned",
      field: "return_status",
    },
    returnCondition: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Good",
      field: "return_condition",
    },
    penaltyAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "penalty_amount",
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    tableName: "asset_returns",
  },
);
