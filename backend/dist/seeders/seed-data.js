"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDatabase = seedDatabase;
const models_1 = require("../models");
const depreciation_1 = require("../utils/depreciation");
async function seedDatabase() {
    const [superAdminRole] = await models_1.Role.findOrCreate({ where: { name: "Super Admin" }, defaults: { description: "Full system access", permissions: ["*"] } });
    await models_1.Role.findOrCreate({ where: { name: "Company Admin" }, defaults: { description: "Company administration", permissions: ["assets:*", "employees:*", "reports:view"] } });
    await models_1.Role.findOrCreate({ where: { name: "IT/Admin User" }, defaults: { description: "Asset operations", permissions: ["assets:*", "employees:view", "repairs:*"] } });
    await models_1.Role.findOrCreate({ where: { name: "HR User" }, defaults: { description: "Employee clearance", permissions: ["employees:*", "assets:view"] } });
    await models_1.Role.findOrCreate({ where: { name: "Finance User" }, defaults: { description: "Finance reports", permissions: ["reports:view", "finance:view"] } });
    await models_1.Role.findOrCreate({ where: { name: "Auditor/Viewer" }, defaults: { description: "Read only audit access", permissions: ["reports:view", "audit:view"] } });
    const [admin] = await models_1.User.findOrCreate({
        where: { email: "admin@assetflow.com" },
        defaults: { name: "AssetFlow Super Admin", email: "admin@assetflow.com", passwordHash: await (0, models_1.hashPassword)("password"), roleId: superAdminRole.id, status: "Active" },
    });
    const departmentNames = ["IT", "HR", "Finance", "Sales", "Operations", "Admin"];
    const departments = await Promise.all(departmentNames.map((name) => models_1.Department.findOrCreate({ where: { name } }).then(([x]) => x)));
    const locations = await Promise.all(["Dhaka Head Office", "Chittagong Branch", "Sylhet Branch", "Remote"].map((name) => models_1.Location.findOrCreate({ where: { name }, defaults: { address: `${name}, Bangladesh` } }).then(([x]) => x)));
    const vendors = await Promise.all([
        ["ABC Computer Ltd.", "Mr. Rahman"], ["TechWorld Bangladesh", "Ms. Jahan"], ["Global IT Source", "Mr. Karim"]
    ].map(([name, contactPerson]) => models_1.Vendor.findOrCreate({ where: { name }, defaults: { contactPerson, phone: "+8801700000000", email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com`, address: "Dhaka", status: "Active" } }).then(([x]) => x)));
    const categories = await Promise.all([
        ["Laptop", 5], ["Desktop", 5], ["Monitor", 5], ["Mouse", 2], ["Keyboard", 2], ["HDMI Cable", 1], ["Printer", 5], ["Router", 3], ["Furniture", 7]
    ].map(([name, usefulLifeYears]) => models_1.AssetCategory.findOrCreate({ where: { name: String(name) }, defaults: { usefulLifeYears: Number(usefulLifeYears), depreciationMethod: "Straight Line" } }).then(([x]) => x)));
    const employeeSeeds = [
        ["EMP-1001", "Rahim Ahmed", "rahim@assetflow.local", "IT Manager", 0, 0],
        ["EMP-1002", "Nusrat Jahan", "nusrat@assetflow.local", "HR Executive", 1, 0],
        ["EMP-1003", "Tanvir Hasan", "tanvir@assetflow.local", "Finance Officer", 2, 1],
        ["EMP-1004", "Farhana Akter", "farhana@assetflow.local", "Sales Lead", 3, 2],
        ["EMP-1005", "Arif Chowdhury", "arif@assetflow.local", "Operations Executive", 4, 0],
    ];
    const employees = [];
    for (const [employeeCode, name, email, designation, depIndex, locIndex] of employeeSeeds) {
        const [employee] = await models_1.Employee.findOrCreate({ where: { employeeCode: String(employeeCode) }, defaults: { name, email, designation, departmentId: departments[Number(depIndex)].id, locationId: locations[Number(locIndex)].id, joiningDate: "2024-01-10", status: "Active", clearanceStatus: "Clear" } });
        employees.push(employee);
    }
    const assetSeeds = [
        ["LAP-0001", "Dell Latitude 5420", "Laptop", "Dell", "Latitude 5420", "DL5420-AF-001", 80000, "Assigned", 0],
        ["LAP-0002", "HP EliteBook 840", "Laptop", "HP", "EliteBook 840", "HP840-AF-002", 92000, "Available", null],
        ["MON-0001", "HP 24 inch Monitor", "Monitor", "HP", "E24 G4", "HPMON-AF-001", 22000, "Assigned", 0],
        ["MOU-0001", "Logitech Mouse", "Mouse", "Logitech", "M90", "LGM90-AF-001", 700, "Assigned", 1],
        ["KEY-0001", "Dell Keyboard", "Keyboard", "Dell", "KB216", "DLKB-AF-001", 1200, "Available", null],
        ["CAB-0001", "HDMI Cable", "HDMI Cable", "Ugreen", "2M", "HDMI-AF-001", 550, "Available", null],
        ["PRN-0001", "Canon Printer", "Printer", "Canon", "LBP2900", "CAN-AF-001", 18000, "In Repair", null],
        ["RTR-0001", "MikroTik Router", "Router", "MikroTik", "RB750", "MT-AF-001", 6500, "Available", null],
    ];
    for (const [assetCode, name, catName, brand, model, serialNumber, price, status, empIndex] of assetSeeds) {
        const category = categories.find((c) => c.name === catName);
        const purchaseDate = "2024-02-15";
        await models_1.Asset.findOrCreate({
            where: { assetCode: String(assetCode) },
            defaults: { name, categoryId: category.id, brand, model, serialNumber, assetTag: assetCode, purchaseDate, purchasePrice: Number(price), currentValue: (0, depreciation_1.calculateStraightLineValue)({ purchasePrice: Number(price), usefulLifeYears: category.usefulLifeYears, purchaseDate }), salvageValue: 0, usefulLifeYears: category.usefulLifeYears, depreciationMethod: "Straight Line", vendorId: vendors[0].id, locationId: locations[0].id, assignedEmployeeId: empIndex === null ? null : employees[Number(empIndex)].id, status, condition: "Good", warrantyExpiry: "2027-02-15", notes: "Seeded demo asset" },
        });
    }
    const [purchase] = await models_1.Purchase.findOrCreate({ where: { invoiceNumber: "INV-2026-001" }, defaults: { vendorId: vendors[0].id, purchaseDate: "2026-01-02", totalAmount: 400000, paymentStatus: "Paid" } });
    const printer = await models_1.Asset.findOne({ where: { assetCode: "PRN-0001" } });
    if (printer)
        await models_1.RepairTicket.findOrCreate({ where: { ticketCode: "RPR-0001" }, defaults: { assetId: printer.id, problem: "Paper jam and roller issue", repairVendorId: vendors[1].id, repairCost: 2500, status: "Under Repair" } });
    await models_1.AuditLog.findOrCreate({ where: { action: "Seeded", module: "System", recordId: admin.id }, defaults: { userId: admin.id, userName: admin.name, ipAddress: "127.0.0.1", device: "Seeder", afterSnapshot: { purchaseId: purchase.id } } });
    return { adminEmail: admin.email };
}
