import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Vendor extends Model {
  declare id: string;
  declare companyId: string | null;
  declare name: string;
  declare contactPerson: string | null;
  declare phone: string | null;
  declare email: string | null;
  declare address: string | null;
  declare status: string;
}
Vendor.init(
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
      type: DataTypes.STRING(160),
      unique: true,
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING(120),
      field: "contact_person",
    },
    phone: {
      type: DataTypes.STRING(40),
    },
    email: {
      type: DataTypes.STRING(160),
    },
    address: {
      type: DataTypes.STRING(255),
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Active",
    },
  },
  {
    sequelize,
    tableName: "vendors",
  },
);
