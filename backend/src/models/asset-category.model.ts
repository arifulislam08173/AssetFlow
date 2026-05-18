import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class AssetCategory extends Model {
  declare id: string;
  declare name: string;
  declare usefulLifeYears: number;
  declare depreciationMethod: string;
}
AssetCategory.init(
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
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: "asset_categories",
  },
);
