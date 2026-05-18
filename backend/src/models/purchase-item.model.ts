import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class PurchaseItem extends Model {
  declare id: string;
  declare purchaseId: string;
  declare assetId: string | null;
  declare productName: string;
  declare quantity: number;
  declare unitPrice: number;
}
PurchaseItem.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    purchaseId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "purchase_id",
    },
    assetId: {
      type: DataTypes.UUID,
      field: "asset_id",
    },
    productName: {
      type: DataTypes.STRING(160),
      allowNull: false,
      field: "product_name",
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    unitPrice: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "unit_price",
    },
  },
  {
    sequelize,
    tableName: "purchase_items",
  },
);
