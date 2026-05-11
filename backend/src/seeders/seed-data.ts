import { Op } from "sequelize";
import { Asset, AssetCategory, Company, Department, Employee, Location, Role, User, Vendor, Purchase, RepairTicket, AuditLog, hashPassword } from "../models";
import { calculateStraightLineValue } from "../utils/depreciation";

export async function seedDatabase() {
  const [defaultCompany] = await Company.findOrCreate({ where: { code: "ASSETFLOW" }, defaults: { name: "AssetFlow Demo Company", code: "ASSETFLOW", contactPerson: "System Admin", email: "admin@assetflow.com", phone: "+8801700000000", address: "Dhaka, Bangladesh", website: "https://assetflow.local", industry: "Technology", status: "Active" } as any });
  const [pranCompany] = await Company.findOrCreate({ where: { code: "PRAN" }, defaults: { name: "PRAN Group", code: "PRAN", contactPerson: "Admin", email: "it@pran.local", phone: "+8801711111111", address: "Dhaka, Bangladesh", industry: "Manufacturing", status: "Active" } as any });
  const [rflCompany] = await Company.findOrCreate({ where: { code: "RFL" }, defaults: { name: "RFL Group", code: "RFL", contactPerson: "Admin", email: "it@rfl.local", phone: "+8801722222222", address: "Dhaka, Bangladesh", industry: "Retail", status: "Active" } as any });
  const [superAdminRole] = await Role.findOrCreate({ where: { name: "Super Admin" }, defaults: { description: "SaaS owner with full platform access", permissions: ["*"] } as any });
  await Role.findOrCreate({ where: { name: "Company Admin" }, defaults: { description: "Company-level admin with full access inside one company", permissions: ["companies.view", "users.*", "roles.*", "assets.*", "categories.*", "employees.*", "vendors.*", "purchases.*", "assignments.*", "returns.*", "repairs.*", "scanner.use", "finance.*", "reports.*", "audit_logs.view", "settings.*"] } as any });
  await Role.findOrCreate({ where: { name: "IT" }, defaults: { description: "IT team role for asset operations, QR scanner, repair and handover", permissions: ["dashboard.view", "assets.*", "categories.*", "employees.view", "vendors.view", "assignments.*", "returns.*", "repairs.*", "scanner.use", "reports.view", "reports.export"] } as any });
  await Role.findOrCreate({ where: { name: "Asset Manager" }, defaults: { description: "Operational asset inventory manager", permissions: ["dashboard.view", "assets.*", "categories.*", "employees.view", "vendors.view", "purchases.view", "assignments.*", "returns.*", "repairs.*", "scanner.use", "reports.view", "reports.export"] } as any });
  await Role.findOrCreate({ where: { name: "HR Manager" }, defaults: { description: "Employee and clearance manager", permissions: ["dashboard.view", "employees.*", "assets.view", "assignments.view", "returns.*", "reports.view", "reports.export"] } as any });
  await Role.findOrCreate({ where: { name: "Finance Manager" }, defaults: { description: "Purchase, depreciation and finance reporting", permissions: ["dashboard.view", "assets.view", "vendors.view", "purchases.*", "repairs.view", "finance.*", "reports.*", "audit_logs.view"] } as any });
  await Role.findOrCreate({ where: { name: "Auditor" }, defaults: { description: "Read-only audit and reporting access", permissions: ["dashboard.view", "assets.view", "employees.view", "vendors.view", "purchases.view", "assignments.view", "returns.view", "repairs.view", "finance.view", "reports.view", "reports.export", "audit_logs.view"] } as any });
  await Role.findOrCreate({ where: { name: "Viewer" }, defaults: { description: "Limited read-only access", permissions: ["dashboard.view", "assets.view", "employees.view", "vendors.view", "reports.view"] } as any });

  const [admin] = await User.findOrCreate({
    where: { email: "admin@assetflow.com" },
    defaults: { name: "AssetFlow Super Admin", email: "admin@assetflow.com", passwordHash: await hashPassword("password"), roleId: superAdminRole.id, status: "Active" } as any,
  });

  const departmentNames = ["IT", "HR", "Finance", "Sales", "Operations", "Admin"];
  const departments = await Promise.all(departmentNames.map((name) => Department.findOrCreate({ where: { name } }).then(([x]) => x)));
  const locations = await Promise.all(["Dhaka Head Office", "Chittagong Branch", "Sylhet Branch", "Remote"].map((name) => Location.findOrCreate({ where: { name }, defaults: { address: `${name}, Bangladesh` } as any }).then(([x]) => x)));
  const vendors = await Promise.all([
    ["ABC Computer Ltd.", "Mr. Rahman"], ["TechWorld Bangladesh", "Ms. Jahan"], ["Global IT Source", "Mr. Karim"]
  ].map(([name, contactPerson]) => Vendor.findOrCreate({ where: { name }, defaults: { companyId: defaultCompany.id, contactPerson, phone: "+8801700000000", email: `${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com`, address: "Dhaka", status: "Active" } as any }).then(([x]) => x)));
  const categories = await Promise.all([
    ["Laptop", 5], ["Desktop", 5], ["Monitor", 5], ["Mouse", 2], ["Keyboard", 2], ["HDMI Cable", 1], ["Printer", 5], ["Router", 3], ["Furniture", 7]
  ].map(([name, usefulLifeYears]) => AssetCategory.findOrCreate({ where: { name: String(name) }, defaults: { companyId: defaultCompany.id, usefulLifeYears: Number(usefulLifeYears), depreciationMethod: "Straight Line" } as any }).then(([x]) => x)));

  const employeeSeeds = [
    ["EMP-1001", "Rahim Ahmed", "rahim@assetflow.local", "IT Manager", 0, 0],
    ["EMP-1002", "Nusrat Jahan", "nusrat@assetflow.local", "HR Executive", 1, 0],
    ["EMP-1003", "Tanvir Hasan", "tanvir@assetflow.local", "Finance Officer", 2, 1],
    ["EMP-1004", "Farhana Akter", "farhana@assetflow.local", "Sales Lead", 3, 2],
    ["EMP-1005", "Arif Chowdhury", "arif@assetflow.local", "Operations Executive", 4, 0],
  ];
  const employees = [];
  for (const [employeeCode, name, email, designation, depIndex, locIndex] of employeeSeeds) {
    const [employee] = await Employee.findOrCreate({ where: { employeeCode: String(employeeCode) }, defaults: { name, email, designation, departmentId: departments[Number(depIndex)].id, locationId: locations[Number(locIndex)].id, joiningDate: "2024-01-10", status: "Active", clearanceStatus: "Clear" } as any });
    await (employee as any).setCompanies([defaultCompany.id, Number(depIndex) === 3 ? pranCompany.id : defaultCompany.id].filter((v, i, a) => a.indexOf(v) === i));
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
    const category = categories.find((c) => c.name === catName)!;
    const purchaseDate = "2024-02-15";
    await Asset.findOrCreate({
      where: { assetCode: String(assetCode) },
      defaults: { companyId: defaultCompany.id, name, categoryId: category.id, brand, model, serialNumber, assetTag: assetCode, purchaseDate, purchasePrice: Number(price), currentValue: calculateStraightLineValue({ purchasePrice: Number(price), usefulLifeYears: category.usefulLifeYears, purchaseDate }), salvageValue: 0, usefulLifeYears: category.usefulLifeYears, depreciationMethod: "Straight Line", vendorId: vendors[0].id, locationId: locations[0].id, assignedEmployeeId: empIndex === null ? null : employees[Number(empIndex)].id, status, condition: "Good", warrantyExpiry: "2027-02-15", notes: "Seeded demo asset" } as any,
    });
  }

  const [purchase] = await Purchase.findOrCreate({ where: { invoiceNumber: "INV-2026-001" }, defaults: { companyId: defaultCompany.id, vendorId: vendors[0].id, purchaseDate: "2026-01-02", totalAmount: 400000, paymentStatus: "Paid" } as any });
  const printer = await Asset.findOne({ where: { assetCode: "PRN-0001" } });
  if (printer) await RepairTicket.findOrCreate({ where: { ticketCode: "RPR-0001" }, defaults: { assetId: printer.id, problem: "Paper jam and roller issue", repairVendorId: vendors[1].id, repairCost: 2500, status: "Under Repair" } as any });

  await AuditLog.findOrCreate({ where: { action: "Seeded", module: "System", recordId: admin.id }, defaults: { userId: admin.id, userName: admin.name, ipAddress: "127.0.0.1", device: "Seeder", afterSnapshot: { purchaseId: purchase.id } } as any });
  return { adminEmail: admin.email };
}
