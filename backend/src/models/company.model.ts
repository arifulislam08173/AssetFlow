import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Company extends Model {
  declare id: string;
  declare name: string;
  declare code: string;
  declare contactPerson: string | null;
  declare email: string | null;
  declare phone: string | null;
  declare address: string | null;
  declare website: string | null;
  declare industry: string | null;
  declare status: string;
}
Company.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(180),
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING(140),
      field: "contact_person",
    },
    email: {
      type: DataTypes.STRING(160),
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING(50),
    },
    address: {
      type: DataTypes.TEXT,
    },
    website: {
      type: DataTypes.STRING(180),
    },
    industry: {
      type: DataTypes.STRING(120),
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Active",
    },
  },
  {
    sequelize,
    tableName: "companies",
  },
);
