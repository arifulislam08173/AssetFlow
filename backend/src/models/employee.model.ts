import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class Employee extends Model {
  declare id: string;
  declare employeeCode: string;
  declare name: string;
  declare email: string;
  declare phone: string | null;
  declare designation: string;
  declare departmentId: string;
  declare locationId: string;
  declare joiningDate: Date;
  declare status: string;
  declare clearanceStatus: string;
}
Employee.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeCode: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false,
      field: "employee_code",
    },
    name: {
      type: DataTypes.STRING(140),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(160),
      unique: true,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(40),
    },
    designation: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "department_id",
    },
    locationId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "location_id",
    },
    joiningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "joining_date",
    },
    status: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Active",
    },
    clearanceStatus: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: "Clear",
      field: "clearance_status",
    },
  },
  {
    sequelize,
    tableName: "employees",
  },
);
