import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config/database";

export class EmployeeCompany extends Model {
  declare id: string;
  declare employeeId: string;
  declare companyId: string;
}
EmployeeCompany.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    employeeId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "employee_id",
    },
    companyId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "company_id",
    },
  },
  {
    sequelize,
    tableName: "employee_companies",
    indexes: [{ unique: true, fields: ["employee_id", "company_id"] }],
  },
);
