import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Asset extends Model {
  declare id: string;
  declare companyId: string | null;
  declare assetCode: string;
  declare name: string;
  declare categoryId: string;
  declare brand: string | null;
  declare model: string | null;
  declare serialNumber: string;
  declare assetTag: string | null;
  declare purchaseDate: Date;
  declare purchasePrice: number;
  declare currentValue: number;
  declare salvageValue: number;
  declare usefulLifeYears: number;
  declare depreciationMethod: string;
  declare vendorId: string | null;
  declare locationId: string;
  declare assignedEmployeeId: string | null;
  declare status: string;
  declare condition: string;
  declare warrantyExpiry: Date | null;
  declare notes: string | null;
}
Asset.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    companyId: {
      type: DataTypes.UUID,
      field: "company_id",
    },
    assetCode: {
      type: DataTypes.STRING(60),
      unique: true,
      allowNull: false,
      field: "asset_code",
    },
    name: {
      type: DataTypes.STRING(160),
      allowNull: false,
    },
    categoryId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "category_id",
    },
    brand: {
      type: DataTypes.STRING(100),
    },
    model: {
      type: DataTypes.STRING(120),
    },
    serialNumber: {
      type: DataTypes.STRING(160),
      unique: true,
      allowNull: false,
      field: "serial_number",
    },
    assetTag: {
      type: DataTypes.STRING(120),
      field: "asset_tag",
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "purchase_date",
    },
    purchasePrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "purchase_price",
    },
    currentValue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "current_value",
    },
    salvageValue: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "salvage_value",
    },
    usefulLifeYears: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5,
      field: "useful_life_years",
    },
    depreciationMethod: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: "Straight Line",
      field: "depreciation_method",
    },
    vendorId: {
      type: DataTypes.UUID,
      field: "vendor_id",
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "location_id",
    },
    assignedEmployeeId: {
      type: DataTypes.UUID,
      field: "assigned_employee_id",
    },
    status: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Available",
    },
    condition: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "New",
    },
    warrantyExpiry: {
      type: DataTypes.DATEONLY,
      field: "warranty_expiry",
    },
    notes: {
      type: DataTypes.TEXT,
    },
  },
  {
    sequelize,
    tableName: "assets",
    paranoid: true,
  },
);
