import {
  Asset,
  AssetCategory,
  AuditLog,
  Company,
  Department,
  Employee,
  Location,
  Purchase,
  RepairTicket,
  Role,
  User,
  Vendor,
  hashPassword,
} from "../models";
import { calculateAutoSalvageValue } from "../services/asset-calculation.service";
import { calculateStraightLineValue } from "../utils/depreciation";

type RoleSeed = {
  name: string;
  description: string;
  permissions: string[];
};

type EmployeeSeed = {
  employeeCode: string;
  name: string;
  email: string;
  designation: string;
  departmentIndex: number;
  locationIndex: number;
  companyIndex: number;
};

type AssetSeed = {
  assetCode: string;
  name: string;
  categoryName: string;
  brand: string;
  model: string;
  serialNumber: string;
  purchasePrice: number;
  condition: string;
  status: string;
  employeeIndex: number | null;
};

const DEMO_PASSWORD = "password";
const PURCHASE_DATE = "2024-02-15";
const WARRANTY_EXPIRY = "2027-02-15";

const roleSeeds: RoleSeed[] = [
  {
    name: "Asset Manager",
    description: "Manage assets, assignments, returns and repairs",
    permissions: [
      "dashboard.view",
      "assets.*",
      "employees.view",
      "vendors.view",
      "assignments.*",
      "returns.*",
      "repairs.*",
      "reports.view",
    ],
  },
  {
    name: "Viewer",
    description: "Read-only business user",
    permissions: [
      "dashboard.view",
      "assets.view",
      "employees.view",
      "vendors.view",
      "reports.view",
    ],
  },
];

const employeeSeeds: EmployeeSeed[] = [
  {
    employeeCode: "EMP-1001",
    name: "Rahim Ahmed",
    email: "rahim@assetflow.local",
    designation: "IT Manager",
    departmentIndex: 0,
    locationIndex: 0,
    companyIndex: 0,
  },
  {
    employeeCode: "EMP-1002",
    name: "Nusrat Jahan",
    email: "nusrat@assetflow.local",
    designation: "HR Executive",
    departmentIndex: 1,
    locationIndex: 0,
    companyIndex: 0,
  },
  {
    employeeCode: "EMP-1003",
    name: "Tanvir Hasan",
    email: "tanvir@assetflow.local",
    designation: "Finance Officer",
    departmentIndex: 2,
    locationIndex: 1,
    companyIndex: 1,
  },
];

const assetSeeds: AssetSeed[] = [
  {
    assetCode: "LAP-0001",
    name: "Dell Latitude 5420",
    categoryName: "Laptop",
    brand: "Dell",
    model: "Latitude 5420",
    serialNumber: "DL5420-AF-001",
    purchasePrice: 80_000,
    condition: "Good",
    status: "Assigned",
    employeeIndex: 0,
  },
  {
    assetCode: "MON-0001",
    name: "HP 24 inch Monitor",
    categoryName: "Monitor",
    brand: "HP",
    model: "E24 G4",
    serialNumber: "HPMON-AF-001",
    purchasePrice: 22_000,
    condition: "Good",
    status: "Available",
    employeeIndex: null,
  },
  {
    assetCode: "PRN-0001",
    name: "Canon Printer",
    categoryName: "Printer",
    brand: "Canon",
    model: "LBP2900",
    serialNumber: "CAN-AF-001",
    purchasePrice: 18_000,
    condition: "Fair",
    status: "In Repair",
    employeeIndex: null,
  },
];

function vendorEmail(name: string) {
  return `${name.toLowerCase().replace(/[^a-z]/g, "")}@example.com`;
}

async function seedCompanies() {
  const companySeeds = [
    {
      name: "AssetFlow Demo Company",
      code: "ASSETFLOW",
      email: "admin@assetflow.com",
      industry: "Technology",
    },
    {
      name: "PRAN Group",
      code: "PRAN",
      email: "it@pran.local",
      industry: "Manufacturing",
    },
  ];

  return Promise.all(
    companySeeds.map(async (item) => {
      const [company] = await Company.findOrCreate({
        where: { code: item.code },
        defaults: {
          ...item,
          contactPerson: "System Admin",
          phone: "+8801700000000",
          address: "Dhaka, Bangladesh",
          status: "Active",
        } as any,
      });

      return company;
    }),
  );
}

async function seedRoles() {
  const [superAdminRole] = await Role.findOrCreate({
    where: { name: "Super Admin" },
    defaults: {
      description: "Full platform access",
      permissions: ["*"],
    } as any,
  });

  await Promise.all(
    roleSeeds.map((role) =>
      Role.findOrCreate({
        where: { name: role.name },
        defaults: role as any,
      }),
    ),
  );

  return superAdminRole;
}

async function seedAdminUser(roleId: string) {
  const [admin] = await User.findOrCreate({
    where: { email: "admin@assetflow.com" },
    defaults: {
      name: "AssetFlow Super Admin",
      email: "admin@assetflow.com",
      passwordHash: await hashPassword(DEMO_PASSWORD),
      roleId,
      status: "Active",
    } as any,
  });

  return admin;
}

async function seedDepartments() {
  const names = ["IT", "HR", "Finance"];

  return Promise.all(
    names.map(async (name) => {
      const [department] = await Department.findOrCreate({ where: { name } });
      return department;
    }),
  );
}

async function seedLocations() {
  const names = ["Dhaka Head Office", "Chittagong Branch"];

  return Promise.all(
    names.map(async (name) => {
      const [location] = await Location.findOrCreate({
        where: { name },
        defaults: { address: `${name}, Bangladesh` } as any,
      });

      return location;
    }),
  );
}

async function seedVendors(companyId: string) {
  const vendorSeeds = ["ABC Computer Ltd.", "TechWorld Bangladesh"];

  return Promise.all(
    vendorSeeds.map(async (name) => {
      const [vendor] = await Vendor.findOrCreate({
        where: { name },
        defaults: {
          companyId,
          contactPerson: "Vendor Contact",
          phone: "+8801700000000",
          email: vendorEmail(name),
          address: "Dhaka",
          status: "Active",
        } as any,
      });

      return vendor;
    }),
  );
}

async function seedCategories(companyId: string) {
  const categorySeeds = [
    { name: "Laptop", usefulLifeYears: 5 },
    { name: "Monitor", usefulLifeYears: 5 },
    { name: "Printer", usefulLifeYears: 5 },
  ];

  return Promise.all(
    categorySeeds.map(async (item) => {
      const [category] = await AssetCategory.findOrCreate({
        where: { name: item.name },
        defaults: {
          companyId,
          usefulLifeYears: item.usefulLifeYears,
          depreciationMethod: "Straight Line",
        } as any,
      });

      return category;
    }),
  );
}

async function seedEmployees(input: {
  companies: Company[];
  departments: Department[];
  locations: Location[];
}) {
  const employees = [];

  for (const item of employeeSeeds) {
    const [employee] = await Employee.findOrCreate({
      where: { employeeCode: item.employeeCode },
      defaults: {
        name: item.name,
        email: item.email,
        designation: item.designation,
        departmentId: input.departments[item.departmentIndex].id,
        locationId: input.locations[item.locationIndex].id,
        joiningDate: "2024-01-10",
        status: "Active",
        clearanceStatus: "Clear",
      } as any,
    });

    await (employee as any).setCompanies([
      input.companies[item.companyIndex].id,
    ]);

    employees.push(employee);
  }

  return employees;
}

async function seedAssets(input: {
  companyId: string;
  categories: AssetCategory[];
  vendors: Vendor[];
  locations: Location[];
  employees: Employee[];
}) {
  for (const item of assetSeeds) {
    const category = input.categories.find(
      (category) => category.name === item.categoryName,
    );

    if (!category) continue;

    const salvageValue = calculateAutoSalvageValue(
      item.purchasePrice,
      item.condition,
    );

    const currentValue = calculateStraightLineValue({
      purchasePrice: item.purchasePrice,
      salvageValue,
      usefulLifeYears: category.usefulLifeYears,
      purchaseDate: PURCHASE_DATE,
    });

    await Asset.findOrCreate({
      where: { assetCode: item.assetCode },
      defaults: {
        companyId: input.companyId,
        name: item.name,
        categoryId: category.id,
        brand: item.brand,
        model: item.model,
        serialNumber: item.serialNumber,
        assetTag: item.assetCode,
        purchaseDate: PURCHASE_DATE,
        purchasePrice: item.purchasePrice,
        currentValue,
        salvageValue,
        usefulLifeYears: category.usefulLifeYears,
        depreciationMethod: "Straight Line",
        vendorId: input.vendors[0].id,
        locationId: input.locations[0].id,
        assignedEmployeeId:
          item.employeeIndex === null
            ? null
            : input.employees[item.employeeIndex].id,
        status: item.status,
        condition: item.condition,
        warrantyExpiry: WARRANTY_EXPIRY,
        notes: "Seeded demo asset",
      } as any,
    });
  }
}

async function seedPurchase(input: {
  companyId: string;
  vendorId: string;
}) {
  const [purchase] = await Purchase.findOrCreate({
    where: { invoiceNumber: "INV-2026-001" },
    defaults: {
      companyId: input.companyId,
      vendorId: input.vendorId,
      purchaseDate: "2026-01-02",
      totalAmount: 120_000,
      paymentStatus: "Paid",
    } as any,
  });

  return purchase;
}

async function seedRepairTicket(vendorId: string) {
  const printer = await Asset.findOne({
    where: { assetCode: "PRN-0001" },
  });

  if (!printer) return null;

  const [repairTicket] = await RepairTicket.findOrCreate({
    where: { ticketCode: "RPR-0001" },
    defaults: {
      assetId: printer.id,
      problem: "Paper jam issue",
      repairVendorId: vendorId,
      repairCost: 2_500,
      status: "Under Repair",
    } as any,
  });

  return repairTicket;
}

async function seedSystemAudit(input: {
  adminId: string;
  adminName: string;
  purchaseId: string;
}) {
  await AuditLog.findOrCreate({
    where: {
      action: "Seeded",
      module: "System",
      recordId: input.adminId,
    },
    defaults: {
      userId: input.adminId,
      userName: input.adminName,
      ipAddress: "127.0.0.1",
      device: "Seeder",
      afterSnapshot: {
        purchaseId: input.purchaseId,
      },
    } as any,
  });
}

export async function seedDatabase() {
  const companies = await seedCompanies();
  const superAdminRole = await seedRoles();
  const admin = await seedAdminUser(superAdminRole.id);
  const departments = await seedDepartments();
  const locations = await seedLocations();
  const vendors = await seedVendors(companies[0].id);
  const categories = await seedCategories(companies[0].id);

  const employees = await seedEmployees({
    companies,
    departments,
    locations,
  });

  await seedAssets({
    companyId: companies[0].id,
    categories,
    vendors,
    locations,
    employees,
  });

  const purchase = await seedPurchase({
    companyId: companies[0].id,
    vendorId: vendors[0].id,
  });

  await seedRepairTicket(vendors[1].id);

  await seedSystemAudit({
    adminId: admin.id,
    adminName: admin.name,
    purchaseId: purchase.id,
  });

  return {
    adminEmail: admin.email,
    adminPassword: DEMO_PASSWORD,
  };
}
