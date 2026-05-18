export { Company } from "./company.model";
export { Role } from "./role.model";
export { User } from "./user.model";
export { RefreshToken } from "./refresh-token.model";
export { Department } from "./department.model";
export { Location } from "./location.model";
export { Employee } from "./employee.model";
export { EmployeeCompany } from "./employee-company.model";
export { Vendor } from "./vendor.model";
export { AssetCategory } from "./asset-category.model";
export { Asset } from "./asset.model";
export { Purchase } from "./purchase.model";
export { PurchaseItem } from "./purchase-item.model";
export { AssetAssignment } from "./asset-assignment.model";
export { AssetReturn } from "./asset-return.model";
export { RepairTicket } from "./repair-ticket.model";
export { AuditLog } from "./audit-log.model";
export { hashPassword } from "./password.util";
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
import { AuditLog } from "./audit-log.model";
import { setupModelAssociations } from "./associations";

setupModelAssociations();

export const models = {
  Company,
  Role,
  User,
  RefreshToken,
  Department,
  Location,
  Employee,
  EmployeeCompany,
  Vendor,
  AssetCategory,
  Asset,
  Purchase,
  PurchaseItem,
  AssetAssignment,
  AssetReturn,
  RepairTicket,
  AuditLog,
};
