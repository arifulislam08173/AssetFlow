import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Purchase extends Model {
  declare id: string;
  declare companyId: string | null;
  declare invoiceNumber: string;
  declare vendorId: string;
  declare purchaseDate: Date;
  declare totalAmount: number;
  declare paymentStatus: string;
}
Purchase.init(
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
    invoiceNumber: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
      field: "invoice_number",
    },
    vendorId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "vendor_id",
    },
    purchaseDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "purchase_date",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_amount",
    },
    paymentStatus: {
      type: DataTypes.STRING(40),
      allowNull: false,
      defaultValue: "Paid",
      field: "payment_status",
    },
  },
  {
    sequelize,
    tableName: "purchases",
  },
);
