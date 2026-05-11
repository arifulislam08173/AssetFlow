import { DataTypes, Model, Optional } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database";
import { env } from "../config/env";

type Creation<T, K extends keyof T> = Optional<T, K>;

export class Company extends Model { declare id: string; declare name: string; declare code: string; declare contactPerson: string | null; declare email: string | null; declare phone: string | null; declare address: string | null; declare website: string | null; declare industry: string | null; declare status: string; }
Company.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(180), allowNull: false },
  code: { type: DataTypes.STRING(50), unique: true, allowNull: false },
  contactPerson: { type: DataTypes.STRING(140), field: "contact_person" },
  email: { type: DataTypes.STRING(160), validate: { isEmail: true } },
  phone: { type: DataTypes.STRING(50) },
  address: { type: DataTypes.TEXT },
  website: { type: DataTypes.STRING(180) },
  industry: { type: DataTypes.STRING(120) },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
}, { sequelize, tableName: "companies" });


export class Role extends Model { declare id: string; declare name: string; declare description: string | null; declare permissions: string[]; }
Role.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(80), unique: true, allowNull: false },
  description: { type: DataTypes.STRING(255) },
  permissions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, { sequelize, tableName: "roles" });

interface UserAttrs { id: string; name: string; email: string; passwordHash: string; roleId: string; permissions?: string[]; status: string; lastLoginAt?: Date | null; }
export class User extends Model<UserAttrs, Creation<UserAttrs, "id" | "status" | "lastLoginAt">> { declare id: string; declare name: string; declare email: string; declare passwordHash: string; declare roleId: string; declare permissions: string[]; declare status: string; declare lastLoginAt: Date | null; async validatePassword(password: string) { return bcrypt.compare(password, this.passwordHash); } }
User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(120), allowNull: false },
  email: { type: DataTypes.STRING(160), allowNull: false, unique: true, validate: { isEmail: true } },
  passwordHash: { type: DataTypes.STRING(255), allowNull: false, field: "password_hash" },
  roleId: { type: DataTypes.UUID, allowNull: false, field: "role_id" },
  permissions: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
  lastLoginAt: { type: DataTypes.DATE, field: "last_login_at" },
}, { sequelize, tableName: "users", defaultScope: { attributes: { exclude: ["passwordHash"] } }, scopes: { withPassword: { attributes: { include: ["passwordHash"] } } } });

export class RefreshToken extends Model { declare id: string; declare userId: string; declare tokenHash: string; declare expiresAt: Date; declare revokedAt: Date | null; }
RefreshToken.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false, field: "user_id" },
  tokenHash: { type: DataTypes.STRING(255), allowNull: false, field: "token_hash" },
  expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
  revokedAt: { type: DataTypes.DATE, field: "revoked_at" },
}, { sequelize, tableName: "refresh_tokens" });

export class Department extends Model { declare id: string; declare name: string; }
Department.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, name: { type: DataTypes.STRING(100), unique: true, allowNull: false } }, { sequelize, tableName: "departments" });

export class Location extends Model { declare id: string; declare name: string; declare address: string | null; }
Location.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, name: { type: DataTypes.STRING(120), unique: true, allowNull: false }, address: { type: DataTypes.STRING(255) } }, { sequelize, tableName: "locations" });

export class Employee extends Model { declare id: string; declare employeeCode: string; declare name: string; declare email: string; declare phone: string | null; declare designation: string; declare departmentId: string; declare locationId: string; declare joiningDate: Date; declare status: string; declare clearanceStatus: string; }
Employee.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeCode: { type: DataTypes.STRING(50), unique: true, allowNull: false, field: "employee_code" },
  name: { type: DataTypes.STRING(140), allowNull: false },
  email: { type: DataTypes.STRING(160), unique: true, allowNull: false },
  phone: { type: DataTypes.STRING(40) },
  designation: { type: DataTypes.STRING(120), allowNull: false },
  departmentId: { type: DataTypes.UUID, allowNull: false, field: "department_id" },
  locationId: { type: DataTypes.UUID, allowNull: false, field: "location_id" },
  joiningDate: { type: DataTypes.DATEONLY, allowNull: false, field: "joining_date" },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
  clearanceStatus: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Clear" , field: "clearance_status"},
}, { sequelize, tableName: "employees" });

export class EmployeeCompany extends Model { declare id: string; declare employeeId: string; declare companyId: string; }
EmployeeCompany.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  employeeId: { type: DataTypes.UUID, allowNull: false, field: "employee_id" },
  companyId: { type: DataTypes.UUID, allowNull: false, field: "company_id" },
}, { sequelize, tableName: "employee_companies", indexes: [{ unique: true, fields: ["employee_id", "company_id"] }] });

export class Vendor extends Model { declare id: string; declare companyId: string | null; declare name: string; declare contactPerson: string | null; declare phone: string | null; declare email: string | null; declare address: string | null; declare status: string; }
Vendor.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, field: "company_id" },
  name: { type: DataTypes.STRING(160), unique: true, allowNull: false },
  contactPerson: { type: DataTypes.STRING(120), field: "contact_person" },
  phone: { type: DataTypes.STRING(40) },
  email: { type: DataTypes.STRING(160) },
  address: { type: DataTypes.STRING(255) },
  status: { type: DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
}, { sequelize, tableName: "vendors" });

export class AssetCategory extends Model { declare id: string; declare name: string; declare usefulLifeYears: number; declare depreciationMethod: string; }
AssetCategory.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, field: "company_id" },
  name: { type: DataTypes.STRING(100), unique: true, allowNull: false },
  usefulLifeYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: "useful_life_years" },
  depreciationMethod: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Straight Line", field: "depreciation_method" },
}, { sequelize, tableName: "asset_categories" });

export class Asset extends Model { declare id: string; declare companyId: string | null; declare assetCode: string; declare name: string; declare categoryId: string; declare brand: string | null; declare model: string | null; declare serialNumber: string; declare assetTag: string | null; declare purchaseDate: Date; declare purchasePrice: number; declare currentValue: number; declare salvageValue: number; declare usefulLifeYears: number; declare depreciationMethod: string; declare vendorId: string | null; declare locationId: string; declare assignedEmployeeId: string | null; declare status: string; declare condition: string; declare warrantyExpiry: Date | null; declare notes: string | null; }
Asset.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  companyId: { type: DataTypes.UUID, field: "company_id" },
  assetCode: { type: DataTypes.STRING(60), unique: true, allowNull: false, field: "asset_code" },
  name: { type: DataTypes.STRING(160), allowNull: false },
  categoryId: { type: DataTypes.UUID, allowNull: false, field: "category_id" },
  brand: { type: DataTypes.STRING(100) },
  model: { type: DataTypes.STRING(120) },
  serialNumber: { type: DataTypes.STRING(160), unique: true, allowNull: false, field: "serial_number" },
  assetTag: { type: DataTypes.STRING(120), field: "asset_tag" },
  purchaseDate: { type: DataTypes.DATEONLY, allowNull: false, field: "purchase_date" },
  purchasePrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "purchase_price" },
  currentValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "current_value" },
  salvageValue: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "salvage_value" },
  usefulLifeYears: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: "useful_life_years" },
  depreciationMethod: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "Straight Line", field: "depreciation_method" },
  vendorId: { type: DataTypes.UUID, field: "vendor_id" },
  locationId: { type: DataTypes.UUID, allowNull: false, field: "location_id" },
  assignedEmployeeId: { type: DataTypes.UUID, field: "assigned_employee_id" },
  status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Available" },
  condition: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "New" },
  warrantyExpiry: { type: DataTypes.DATEONLY, field: "warranty_expiry" },
  notes: { type: DataTypes.TEXT },
}, { sequelize, tableName: "assets", paranoid: true });

export class Purchase extends Model { declare id: string; declare companyId: string | null; declare invoiceNumber: string; declare vendorId: string; declare purchaseDate: Date; declare totalAmount: number; declare paymentStatus: string; }
Purchase.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, companyId: { type: DataTypes.UUID, field: "company_id" }, invoiceNumber: { type: DataTypes.STRING(100), unique: true, allowNull: false, field: "invoice_number" }, vendorId: { type: DataTypes.UUID, allowNull: false, field: "vendor_id" }, purchaseDate: { type: DataTypes.DATEONLY, allowNull: false, field: "purchase_date" }, totalAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "total_amount" }, paymentStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Paid", field: "payment_status" } }, { sequelize, tableName: "purchases" });

export class PurchaseItem extends Model { declare id: string; declare purchaseId: string; declare assetId: string | null; declare productName: string; declare quantity: number; declare unitPrice: number; }
PurchaseItem.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, purchaseId: { type: DataTypes.UUID, allowNull: false, field: "purchase_id" }, assetId: { type: DataTypes.UUID, field: "asset_id" }, productName: { type: DataTypes.STRING(160), allowNull: false, field: "product_name" }, quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 }, unitPrice: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "unit_price" } }, { sequelize, tableName: "purchase_items" });

export class AssetAssignment extends Model { declare id: string; declare assetId: string; declare employeeId: string; declare assignedById: string; declare assignedAt: Date; declare conditionAtAssign: string; declare notes: string | null; declare returnedAt: Date | null; }
AssetAssignment.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, assetId: { type: DataTypes.UUID, allowNull: false, field: "asset_id" }, employeeId: { type: DataTypes.UUID, allowNull: false, field: "employee_id" }, assignedById: { type: DataTypes.UUID, allowNull: false, field: "assigned_by_id" }, assignedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "assigned_at" }, conditionAtAssign: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Good", field: "condition_at_assign" }, notes: { type: DataTypes.TEXT }, returnedAt: { type: DataTypes.DATE, field: "returned_at" } }, { sequelize, tableName: "asset_assignments" });

export class AssetReturn extends Model { declare id: string; declare assignmentId: string; declare assetId: string; declare employeeId: string; declare receivedById: string; declare returnStatus: string; declare returnCondition: string; declare penaltyAmount: number; declare notes: string | null; }
AssetReturn.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, assignmentId: { type: DataTypes.UUID, allowNull: false, field: "assignment_id" }, assetId: { type: DataTypes.UUID, allowNull: false, field: "asset_id" }, employeeId: { type: DataTypes.UUID, allowNull: false, field: "employee_id" }, receivedById: { type: DataTypes.UUID, allowNull: false, field: "received_by_id" }, returnStatus: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Returned", field: "return_status" }, returnCondition: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Good", field: "return_condition" }, penaltyAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "penalty_amount" }, notes: { type: DataTypes.TEXT } }, { sequelize, tableName: "asset_returns" });

export class RepairTicket extends Model { declare id: string; declare ticketCode: string; declare assetId: string; declare problem: string; declare repairVendorId: string | null; declare repairCost: number; declare status: string; declare reportedAt: Date; }
RepairTicket.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, ticketCode: { type: DataTypes.STRING(60), unique: true, allowNull: false, field: "ticket_code" }, assetId: { type: DataTypes.UUID, allowNull: false, field: "asset_id" }, problem: { type: DataTypes.TEXT, allowNull: false }, repairVendorId: { type: DataTypes.UUID, field: "repair_vendor_id" }, repairCost: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "repair_cost" }, status: { type: DataTypes.STRING(40), allowNull: false, defaultValue: "Open" }, reportedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: "reported_at" } }, { sequelize, tableName: "repair_tickets" });

export class AuditLog extends Model { declare id: string; declare userId: string | null; declare userName: string | null; declare action: string; declare module: string; declare recordId: string | null; declare ipAddress: string | null; declare device: string | null; declare beforeSnapshot: object | null; declare afterSnapshot: object | null; }
AuditLog.init({ id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true }, userId: { type: DataTypes.UUID, field: "user_id" }, userName: { type: DataTypes.STRING(140), field: "user_name" }, action: { type: DataTypes.STRING(60), allowNull: false }, module: { type: DataTypes.STRING(80), allowNull: false }, recordId: { type: DataTypes.STRING(120), field: "record_id" }, ipAddress: { type: DataTypes.STRING(80), field: "ip_address" }, device: { type: DataTypes.STRING(255) }, beforeSnapshot: { type: DataTypes.JSONB, field: "before_snapshot" }, afterSnapshot: { type: DataTypes.JSONB, field: "after_snapshot" } }, { sequelize, tableName: "audit_logs" });

Company.hasMany(Vendor, { foreignKey: "companyId" }); Vendor.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Company.hasMany(AssetCategory, { foreignKey: "companyId" }); AssetCategory.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Company.hasMany(Asset, { foreignKey: "companyId" }); Asset.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Company.hasMany(Purchase, { foreignKey: "companyId" }); Purchase.belongsTo(Company, { foreignKey: "companyId", as: "company" });
Employee.belongsToMany(Company, { through: EmployeeCompany, foreignKey: "employeeId", otherKey: "companyId", as: "companies" });
Company.belongsToMany(Employee, { through: EmployeeCompany, foreignKey: "companyId", otherKey: "employeeId", as: "employees" });
Employee.hasMany(EmployeeCompany, { foreignKey: "employeeId" }); EmployeeCompany.belongsTo(Employee, { foreignKey: "employeeId" });
Company.hasMany(EmployeeCompany, { foreignKey: "companyId" }); EmployeeCompany.belongsTo(Company, { foreignKey: "companyId" });

Role.hasMany(User, { foreignKey: "roleId" }); User.belongsTo(Role, { foreignKey: "roleId" });
User.hasMany(RefreshToken, { foreignKey: "userId" }); RefreshToken.belongsTo(User, { foreignKey: "userId" });
Department.hasMany(Employee, { foreignKey: "departmentId" }); Employee.belongsTo(Department, { foreignKey: "departmentId" });
Location.hasMany(Employee, { foreignKey: "locationId" }); Employee.belongsTo(Location, { foreignKey: "locationId" });
AssetCategory.hasMany(Asset, { foreignKey: "categoryId" }); Asset.belongsTo(AssetCategory, { foreignKey: "categoryId", as: "category" });
Vendor.hasMany(Asset, { foreignKey: "vendorId" }); Asset.belongsTo(Vendor, { foreignKey: "vendorId", as: "vendor" });
Location.hasMany(Asset, { foreignKey: "locationId" }); Asset.belongsTo(Location, { foreignKey: "locationId", as: "location" });
Employee.hasMany(Asset, { foreignKey: "assignedEmployeeId" }); Asset.belongsTo(Employee, { foreignKey: "assignedEmployeeId", as: "assignedEmployee" });
Vendor.hasMany(Purchase, { foreignKey: "vendorId" }); Purchase.belongsTo(Vendor, { foreignKey: "vendorId" });
Purchase.hasMany(PurchaseItem, { foreignKey: "purchaseId" }); PurchaseItem.belongsTo(Purchase, { foreignKey: "purchaseId" });
Asset.hasMany(AssetAssignment, { foreignKey: "assetId" }); AssetAssignment.belongsTo(Asset, { foreignKey: "assetId" });
Employee.hasMany(AssetAssignment, { foreignKey: "employeeId" }); AssetAssignment.belongsTo(Employee, { foreignKey: "employeeId" });
AssetAssignment.hasMany(AssetReturn, { foreignKey: "assignmentId" }); AssetReturn.belongsTo(AssetAssignment, { foreignKey: "assignmentId" });
Asset.hasMany(AssetReturn, { foreignKey: "assetId" }); AssetReturn.belongsTo(Asset, { foreignKey: "assetId" });
Employee.hasMany(AssetReturn, { foreignKey: "employeeId" }); AssetReturn.belongsTo(Employee, { foreignKey: "employeeId" });
Asset.hasMany(RepairTicket, { foreignKey: "assetId" }); RepairTicket.belongsTo(Asset, { foreignKey: "assetId" });
Vendor.hasMany(RepairTicket, { foreignKey: "repairVendorId" }); RepairTicket.belongsTo(Vendor, { foreignKey: "repairVendorId" });

export async function hashPassword(password: string) { return bcrypt.hash(password, env.bcryptSaltRounds); }
export const models = { Company, Role, User, RefreshToken, Department, Location, Employee, EmployeeCompany, Vendor, AssetCategory, Asset, Purchase, PurchaseItem, AssetAssignment, AssetReturn, RepairTicket, AuditLog };
