import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Location extends Model {
  declare id: string;
  declare name: string;
  declare address: string | null;
}
Location.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      unique: true,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING(255),
    },
  },
  {
    sequelize,
    tableName: "locations",
  },
);
