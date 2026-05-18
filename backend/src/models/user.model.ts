import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database";

type Creation<T, K extends keyof T> = Optional<T, K>;
interface UserAttrs {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  roleId: string;
  permissions?: string[];
  status: string;
  lastLoginAt?: Date | null;
}

export class User extends Model<UserAttrs, Creation<UserAttrs, "id" | "status" | "lastLoginAt">> {
  declare id: string;
  declare name: string;
  declare email: string;
  declare passwordHash: string;
  declare roleId: string;
  declare permissions: string[];
  declare status: string;
  declare lastLoginAt: Date | null;
  async validatePassword(password: string) {
    return bcrypt.compare(password, this.passwordHash);
  }
}
User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    passwordHash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password_hash",
    },
    roleId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "role_id",
    },
    permissions: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Active",
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      field: "last_login_at",
    },
  },
  {
    sequelize,
    tableName: "users",
    defaultScope: { attributes: { exclude: ["passwordHash"] } },
    scopes: { withPassword: { attributes: { include: ["passwordHash"] } } },
  },
);
