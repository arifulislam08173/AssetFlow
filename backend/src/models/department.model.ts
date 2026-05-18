import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Department extends Model {
  declare id: string;
  declare name: string;
}
Department.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(100),
      unique: true,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "departments",
  },
);
