"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.models = exports.AuditLog = exports.RepairTicket = exports.AssetReturn = exports.AssetAssignment = exports.PurchaseItem = exports.Purchase = exports.Asset = exports.AssetCategory = exports.Vendor = exports.Employee = exports.Location = exports.Department = exports.RefreshToken = exports.User = exports.Role = void 0;
exports.hashPassword = hashPassword;
const sequelize_1 = require("sequelize");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const database_1 = require("../config/database");
const env_1 = require("../config/env");
class Role extends sequelize_1.Model {
}
exports.Role = Role;
Role.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(80), unique: true, allowNull: false },
    description: { type: sequelize_1.DataTypes.STRING(255) },
    permissions: { type: sequelize_1.DataTypes.JSONB, allowNull: false, defaultValue: [] },
}, { sequelize: database_1.sequelize, tableName: "roles" });
class User extends sequelize_1.Model {
    async validatePassword(password) { return bcryptjs_1.default.compare(password, this.passwordHash); }
}
exports.User = User;
User.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    email: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    passwordHash: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        field: "password_hash",
    },
    roleId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: true,
        field: "role_id",
    },
    status: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
        defaultValue: "Active",
    },
    lastLoginAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: true,
        field: "last_login_at",
    },
}, {
    sequelize: database_1.sequelize,
    tableName: "users",
    defaultScope: {
        attributes: {
            exclude: ["passwordHash"],
        },
    },
    scopes: {
        withPassword: {
            attributes: {
                include: ["passwordHash"],
            },
        },
    },
});
class RefreshToken extends sequelize_1.Model {
}
exports.RefreshToken = RefreshToken;
RefreshToken.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    userId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "user_id" },
    tokenHash: { type: sequelize_1.DataTypes.STRING(255), allowNull: false, field: "token_hash" },
    expiresAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, field: "expires_at" },
    revokedAt: { type: sequelize_1.DataTypes.DATE, field: "revoked_at" },
}, { sequelize: database_1.sequelize, tableName: "refresh_tokens" });
class Department extends sequelize_1.Model {
}
exports.Department = Department;
Department.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, name: { type: sequelize_1.DataTypes.STRING(100), unique: true, allowNull: false } }, { sequelize: database_1.sequelize, tableName: "departments" });
class Location extends sequelize_1.Model {
}
exports.Location = Location;
Location.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, name: { type: sequelize_1.DataTypes.STRING(120), unique: true, allowNull: false }, address: { type: sequelize_1.DataTypes.STRING(255) } }, { sequelize: database_1.sequelize, tableName: "locations" });
class Employee extends sequelize_1.Model {
}
exports.Employee = Employee;
Employee.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    employeeCode: { type: sequelize_1.DataTypes.STRING(50), unique: true, allowNull: false, field: "employee_code" },
    name: { type: sequelize_1.DataTypes.STRING(140), allowNull: false },
    email: { type: sequelize_1.DataTypes.STRING(160), unique: true, allowNull: false },
    phone: { type: sequelize_1.DataTypes.STRING(40) },
    designation: { type: sequelize_1.DataTypes.STRING(120), allowNull: false },
    departmentId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "department_id" },
    locationId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "location_id" },
    joiningDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, field: "joining_date" },
    status: { type: sequelize_1.DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
    clearanceStatus: { type: sequelize_1.DataTypes.STRING(30), allowNull: false, defaultValue: "Clear", field: "clearance_status" },
}, { sequelize: database_1.sequelize, tableName: "employees" });
class Vendor extends sequelize_1.Model {
}
exports.Vendor = Vendor;
Vendor.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(160), unique: true, allowNull: false },
    contactPerson: { type: sequelize_1.DataTypes.STRING(120), field: "contact_person" },
    phone: { type: sequelize_1.DataTypes.STRING(40) },
    email: { type: sequelize_1.DataTypes.STRING(160) },
    address: { type: sequelize_1.DataTypes.STRING(255) },
    status: { type: sequelize_1.DataTypes.STRING(30), allowNull: false, defaultValue: "Active" },
}, { sequelize: database_1.sequelize, tableName: "vendors" });
class AssetCategory extends sequelize_1.Model {
}
exports.AssetCategory = AssetCategory;
AssetCategory.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    name: { type: sequelize_1.DataTypes.STRING(100), unique: true, allowNull: false },
    usefulLifeYears: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: "useful_life_years" },
    depreciationMethod: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: "Straight Line", field: "depreciation_method" },
}, { sequelize: database_1.sequelize, tableName: "asset_categories" });
class Asset extends sequelize_1.Model {
}
exports.Asset = Asset;
Asset.init({
    id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true },
    assetCode: { type: sequelize_1.DataTypes.STRING(60), unique: true, allowNull: false, field: "asset_code" },
    name: { type: sequelize_1.DataTypes.STRING(160), allowNull: false },
    categoryId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "category_id" },
    brand: { type: sequelize_1.DataTypes.STRING(100) },
    model: { type: sequelize_1.DataTypes.STRING(120) },
    serialNumber: { type: sequelize_1.DataTypes.STRING(160), unique: true, allowNull: false, field: "serial_number" },
    assetTag: { type: sequelize_1.DataTypes.STRING(120), field: "asset_tag" },
    purchaseDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, field: "purchase_date" },
    purchasePrice: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "purchase_price" },
    currentValue: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "current_value" },
    salvageValue: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "salvage_value" },
    usefulLifeYears: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 5, field: "useful_life_years" },
    depreciationMethod: { type: sequelize_1.DataTypes.STRING(50), allowNull: false, defaultValue: "Straight Line", field: "depreciation_method" },
    vendorId: { type: sequelize_1.DataTypes.UUID, field: "vendor_id" },
    locationId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "location_id" },
    assignedEmployeeId: { type: sequelize_1.DataTypes.UUID, field: "assigned_employee_id" },
    status: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Available" },
    condition: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "New" },
    warrantyExpiry: { type: sequelize_1.DataTypes.DATEONLY, field: "warranty_expiry" },
    notes: { type: sequelize_1.DataTypes.TEXT },
}, { sequelize: database_1.sequelize, tableName: "assets", paranoid: true });
class Purchase extends sequelize_1.Model {
}
exports.Purchase = Purchase;
Purchase.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, invoiceNumber: { type: sequelize_1.DataTypes.STRING(100), unique: true, allowNull: false, field: "invoice_number" }, vendorId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "vendor_id" }, purchaseDate: { type: sequelize_1.DataTypes.DATEONLY, allowNull: false, field: "purchase_date" }, totalAmount: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "total_amount" }, paymentStatus: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Paid", field: "payment_status" } }, { sequelize: database_1.sequelize, tableName: "purchases" });
class PurchaseItem extends sequelize_1.Model {
}
exports.PurchaseItem = PurchaseItem;
PurchaseItem.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, purchaseId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "purchase_id" }, assetId: { type: sequelize_1.DataTypes.UUID, field: "asset_id" }, productName: { type: sequelize_1.DataTypes.STRING(160), allowNull: false, field: "product_name" }, quantity: { type: sequelize_1.DataTypes.INTEGER, allowNull: false, defaultValue: 1 }, unitPrice: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "unit_price" } }, { sequelize: database_1.sequelize, tableName: "purchase_items" });
class AssetAssignment extends sequelize_1.Model {
}
exports.AssetAssignment = AssetAssignment;
AssetAssignment.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, assetId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "asset_id" }, employeeId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "employee_id" }, assignedById: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "assigned_by_id" }, assignedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, field: "assigned_at" }, conditionAtAssign: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Good", field: "condition_at_assign" }, notes: { type: sequelize_1.DataTypes.TEXT }, returnedAt: { type: sequelize_1.DataTypes.DATE, field: "returned_at" } }, { sequelize: database_1.sequelize, tableName: "asset_assignments" });
class AssetReturn extends sequelize_1.Model {
}
exports.AssetReturn = AssetReturn;
AssetReturn.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, assignmentId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "assignment_id" }, assetId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "asset_id" }, employeeId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "employee_id" }, receivedById: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "received_by_id" }, returnStatus: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Returned", field: "return_status" }, returnCondition: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Good", field: "return_condition" }, penaltyAmount: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "penalty_amount" }, notes: { type: sequelize_1.DataTypes.TEXT } }, { sequelize: database_1.sequelize, tableName: "asset_returns" });
class RepairTicket extends sequelize_1.Model {
}
exports.RepairTicket = RepairTicket;
RepairTicket.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, ticketCode: { type: sequelize_1.DataTypes.STRING(60), unique: true, allowNull: false, field: "ticket_code" }, assetId: { type: sequelize_1.DataTypes.UUID, allowNull: false, field: "asset_id" }, problem: { type: sequelize_1.DataTypes.TEXT, allowNull: false }, repairVendorId: { type: sequelize_1.DataTypes.UUID, field: "repair_vendor_id" }, repairCost: { type: sequelize_1.DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0, field: "repair_cost" }, status: { type: sequelize_1.DataTypes.STRING(40), allowNull: false, defaultValue: "Open" }, reportedAt: { type: sequelize_1.DataTypes.DATE, allowNull: false, defaultValue: sequelize_1.DataTypes.NOW, field: "reported_at" } }, { sequelize: database_1.sequelize, tableName: "repair_tickets" });
class AuditLog extends sequelize_1.Model {
}
exports.AuditLog = AuditLog;
AuditLog.init({ id: { type: sequelize_1.DataTypes.UUID, defaultValue: sequelize_1.DataTypes.UUIDV4, primaryKey: true }, userId: { type: sequelize_1.DataTypes.UUID, field: "user_id" }, userName: { type: sequelize_1.DataTypes.STRING(140), field: "user_name" }, action: { type: sequelize_1.DataTypes.STRING(60), allowNull: false }, module: { type: sequelize_1.DataTypes.STRING(80), allowNull: false }, recordId: { type: sequelize_1.DataTypes.STRING(120), field: "record_id" }, ipAddress: { type: sequelize_1.DataTypes.STRING(80), field: "ip_address" }, device: { type: sequelize_1.DataTypes.STRING(255) }, beforeSnapshot: { type: sequelize_1.DataTypes.JSONB, field: "before_snapshot" }, afterSnapshot: { type: sequelize_1.DataTypes.JSONB, field: "after_snapshot" } }, { sequelize: database_1.sequelize, tableName: "audit_logs" });
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
async function hashPassword(password) { return bcryptjs_1.default.hash(password, env_1.env.bcryptSaltRounds); }
exports.models = { Role, User, RefreshToken, Department, Location, Employee, Vendor, AssetCategory, Asset, Purchase, PurchaseItem, AssetAssignment, AssetReturn, RepairTicket, AuditLog };
