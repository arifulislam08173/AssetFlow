import { Company } from "./company.model";
import { Role } from "./role.model";
import { User } from "./user.model";
import { RefreshToken } from "./refresh-token.model";
import { Department } from "./department.model";
import { Location } from "./location.model";
import { Employee } from "./employee.model";
import { EmployeeCompany } from "./employee-company.model";
import { Vendor } from "./vendor.model";
import { AssetCategory } from "./asset-category.model";
import { Asset } from "./asset.model";
import { Purchase } from "./purchase.model";
import { PurchaseItem } from "./purchase-item.model";
import { AssetAssignment } from "./asset-assignment.model";
import { AssetReturn } from "./asset-return.model";
import { RepairTicket } from "./repair-ticket.model";

export function setupModelAssociations() {
  Company.hasMany(Vendor, { foreignKey: "companyId" });
  Vendor.belongsTo(Company, { foreignKey: "companyId", as: "company" });
  Company.hasMany(AssetCategory, { foreignKey: "companyId" });
  AssetCategory.belongsTo(Company, { foreignKey: "companyId", as: "company" });
  Company.hasMany(Asset, { foreignKey: "companyId" });
  Asset.belongsTo(Company, { foreignKey: "companyId", as: "company" });
  Company.hasMany(Purchase, { foreignKey: "companyId" });
  Purchase.belongsTo(Company, { foreignKey: "companyId", as: "company" });
  Employee.belongsToMany(Company,
    {
      through: EmployeeCompany,
      foreignKey: "employeeId",
      otherKey: "companyId",
      as: "companies"
    });
  Company.belongsToMany(Employee,
    {
      through: EmployeeCompany,
      foreignKey: "companyId",
      otherKey: "employeeId",
      as: "employees"
    });
  Employee.hasMany(EmployeeCompany, { foreignKey: "employeeId" });
  EmployeeCompany.belongsTo(Employee, { foreignKey: "employeeId" });
  Company.hasMany(EmployeeCompany, { foreignKey: "companyId" });
  EmployeeCompany.belongsTo(Company, { foreignKey: "companyId" });
  Role.hasMany(User, { foreignKey: "roleId" });
  User.belongsTo(Role, { foreignKey: "roleId" });
  User.hasMany(RefreshToken, { foreignKey: "userId" });
  RefreshToken.belongsTo(User, { foreignKey: "userId" });
  Department.hasMany(Employee, { foreignKey: "departmentId" });
  Employee.belongsTo(Department, { foreignKey: "departmentId" });
  Location.hasMany(Employee, { foreignKey: "locationId" });
  Employee.belongsTo(Location, { foreignKey: "locationId" });
  AssetCategory.hasMany(Asset, { foreignKey: "categoryId" });
  Asset.belongsTo(AssetCategory, { foreignKey: "categoryId", as: "category" });
  Vendor.hasMany(Asset, { foreignKey: "vendorId" });
  Asset.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });
  Location.hasMany(Asset, { foreignKey: "locationId" });
  Asset.belongsTo(Location, { foreignKey: "locationId", as: "location" });
  Employee.hasMany(Asset, { foreignKey: "assignedEmployeeId" });
  Asset.belongsTo(Employee, { foreignKey: "assignedEmployeeId", as: "assignedEmployee" });
  Vendor.hasMany(Purchase, { foreignKey: "vendorId" });
  Purchase.belongsTo(Vendor, { foreignKey: "vendorId" });
  Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId" });
  PurchaseItem.belongsTo(Purchase, { foreignKey: "purchaseId" });
  Asset.hasMany(AssetAssignment, { foreignKey: "assetId" });
  AssetAssignment.belongsTo(Asset, { foreignKey: "assetId" });
  Employee.hasMany(AssetAssignment, { foreignKey: "employeeId" });
  AssetAssignment.belongsTo(Employee, { foreignKey: "employeeId" });
  AssetAssignment.hasMany(AssetReturn, { foreignKey: "assignmentId" });
  AssetReturn.belongsTo(AssetAssignment, { foreignKey: "assignmentId" });
  Asset.hasMany(AssetReturn, { foreignKey: "assetId" });
  AssetReturn.belongsTo(Asset, { foreignKey: "assetId" });
  Employee.hasMany(AssetReturn, { foreignKey: "employeeId" });
  AssetReturn.belongsTo(Employee, { foreignKey: "employeeId" });
  Asset.hasMany(RepairTicket, { foreignKey: "assetId" });
  RepairTicket.belongsTo(Asset, { foreignKey: "assetId" });
  Vendor.hasMany(RepairTicket, { foreignKey: "repairVendorId" });
  RepairTicket.belongsTo(Vendor, { foreignKey: "repairVendorId" });
}
