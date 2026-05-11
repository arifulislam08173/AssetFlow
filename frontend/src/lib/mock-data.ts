export type AssetStatus =
  | "Available"
  | "Assigned"
  | "Returned"
  | "In Repair"
  | "Damaged"
  | "Lost"
  | "Disposed"
  | "Reserved"
  | "Pending Approval";

export interface Asset {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial: string;
  tag: string;
  status: AssetStatus;
  assignedTo?: string;
  location: string;
  purchasePrice: number;
  currentValue: number;
  purchaseDate: string;
  warrantyExpiry: string;
  vendor: string;
  condition: string;
  depreciationMethod: string;
  usefulLife: number;
  salvageValue: number;
  notes?: string;
}

export interface Employee {
  id: string;
  name: string;
  department: string;
  designation: string;
  email: string;
  phone: string;
  location: string;
  joiningDate: string;
  status: "Active" | "Resigned" | "Terminated" | "Inactive";
  assignedCount: number;
  clearanceStatus: "Pending" | "In Progress" | "Cleared" | "N/A";
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  totalAssets: number;
  totalValue: number;
  status: "Active" | "Inactive";
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  vendor: string;
  date: string;
  totalItems: number;
  totalAmount: number;
  paymentStatus: "Paid" | "Partial" | "Unpaid";
  attachment: boolean;
}

export interface RepairTicket {
  id: string;
  assetId: string;
  assetName: string;
  problem: string;
  reportedBy: string;
  vendor: string;
  cost: number;
  status: "Open" | "Sent to Vendor" | "Under Repair" | "Repaired" | "Returned" | "Cancelled";
  reportedDate: string;
  expectedReturn: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: "Created" | "Updated" | "Deleted" | "Assigned" | "Returned" | "Approved" | "Rejected" | "Login" | "Logout";
  module: string;
  recordId: string;
  ip: string;
  device: string;
}

export interface Notification {
  id: string;
  type: "warranty" | "return" | "repair" | "stock" | "clearance" | "approval";
  title: string;
  message: string;
  date: string;
  read: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: "Active" | "Inactive";
  lastLogin: string;
}

export const departments = ["IT", "HR", "Finance", "Sales", "Operations", "Admin"];
export const locations = ["Dhaka Head Office", "Chittagong Branch", "Sylhet Branch", "Remote"];
export const categories = ["Laptop", "Desktop", "Monitor", "Keyboard", "Mouse", "Cable", "Printer", "Phone", "Furniture", "Networking"];
export const conditions = ["New", "Good", "Fair", "Poor", "Damaged"];
export const depreciationMethods = ["Straight Line", "Declining Balance", "Manual Value", "No Depreciation"];
export const roles = ["Super Admin", "Company Admin", "IT/Admin User", "HR User", "Finance User", "Auditor/Viewer"];

export const employees: Employee[] = [
  { id: "EMP-001", name: "Arif Hossain", department: "IT", designation: "Senior Engineer", email: "arif@company.com", phone: "+8801711000001", location: "Dhaka Head Office", joiningDate: "2021-04-12", status: "Active", assignedCount: 4, clearanceStatus: "N/A" },
  { id: "EMP-002", name: "Nusrat Jahan", department: "HR", designation: "HR Manager", email: "nusrat@company.com", phone: "+8801711000002", location: "Dhaka Head Office", joiningDate: "2020-01-08", status: "Active", assignedCount: 2, clearanceStatus: "N/A" },
  { id: "EMP-003", name: "Rakib Ahmed", department: "Finance", designation: "Accountant", email: "rakib@company.com", phone: "+8801711000003", location: "Chittagong Branch", joiningDate: "2022-07-19", status: "Active", assignedCount: 3, clearanceStatus: "N/A" },
  { id: "EMP-004", name: "Sumaiya Khan", department: "Sales", designation: "Sales Lead", email: "sumaiya@company.com", phone: "+8801711000004", location: "Dhaka Head Office", joiningDate: "2019-11-02", status: "Active", assignedCount: 2, clearanceStatus: "N/A" },
  { id: "EMP-005", name: "Tanvir Islam", department: "Operations", designation: "Ops Specialist", email: "tanvir@company.com", phone: "+8801711000005", location: "Sylhet Branch", joiningDate: "2023-02-15", status: "Active", assignedCount: 1, clearanceStatus: "N/A" },
  { id: "EMP-006", name: "Maliha Rahman", department: "IT", designation: "DevOps Engineer", email: "maliha@company.com", phone: "+8801711000006", location: "Remote", joiningDate: "2022-09-01", status: "Active", assignedCount: 3, clearanceStatus: "N/A" },
  { id: "EMP-007", name: "Sajid Karim", department: "Admin", designation: "Office Admin", email: "sajid@company.com", phone: "+8801711000007", location: "Dhaka Head Office", joiningDate: "2018-06-22", status: "Active", assignedCount: 2, clearanceStatus: "N/A" },
  { id: "EMP-008", name: "Tania Akter", department: "Finance", designation: "Finance Lead", email: "tania@company.com", phone: "+8801711000008", location: "Dhaka Head Office", joiningDate: "2017-03-10", status: "Active", assignedCount: 1, clearanceStatus: "N/A" },
  { id: "EMP-009", name: "Hasan Mahmud", department: "Sales", designation: "Account Executive", email: "hasan@company.com", phone: "+8801711000009", location: "Chittagong Branch", joiningDate: "2024-01-20", status: "Resigned", assignedCount: 2, clearanceStatus: "In Progress" },
  { id: "EMP-010", name: "Farzana Sultana", department: "HR", designation: "HR Executive", email: "farzana@company.com", phone: "+8801711000010", location: "Dhaka Head Office", joiningDate: "2023-05-05", status: "Active", assignedCount: 1, clearanceStatus: "N/A" },
];

export const vendors: Vendor[] = [
  { id: "VND-001", name: "TechWorld BD", contactPerson: "Mr. Karim", phone: "+8801911100001", email: "sales@techworld.com.bd", address: "Motijheel, Dhaka", totalAssets: 12, totalValue: 1450000, status: "Active" },
  { id: "VND-002", name: "Smart Computers", contactPerson: "Mrs. Lima", phone: "+8801911100002", email: "info@smartcomp.com", address: "Agrabad, Chittagong", totalAssets: 8, totalValue: 980000, status: "Active" },
  { id: "VND-003", name: "Office Solutions Ltd", contactPerson: "Mr. Sabbir", phone: "+8801911100003", email: "contact@officesol.com", address: "Gulshan, Dhaka", totalAssets: 6, totalValue: 540000, status: "Active" },
  { id: "VND-004", name: "Global IT Traders", contactPerson: "Mr. Imran", phone: "+8801911100004", email: "hello@globalit.com", address: "Dhanmondi, Dhaka", totalAssets: 4, totalValue: 320000, status: "Active" },
  { id: "VND-005", name: "PrintMaster", contactPerson: "Mr. Hossain", phone: "+8801911100005", email: "support@printmaster.com", address: "Sylhet", totalAssets: 3, totalValue: 210000, status: "Inactive" },
];

const assetSeed: Array<Partial<Asset> & { name: string; category: string; brand: string; model: string; purchasePrice: number }> = [
  { name: "Dell Latitude 5420", category: "Laptop", brand: "Dell", model: "Latitude 5420", purchasePrice: 95000 },
  { name: "HP EliteDesk 800 G6", category: "Desktop", brand: "HP", model: "EliteDesk 800", purchasePrice: 78000 },
  { name: "HP 24\" Monitor", category: "Monitor", brand: "HP", model: "P24h G4", purchasePrice: 22000 },
  { name: "Logitech MX Master 3", category: "Mouse", brand: "Logitech", model: "MX Master 3", purchasePrice: 8500 },
  { name: "Dell KB216 Keyboard", category: "Keyboard", brand: "Dell", model: "KB216", purchasePrice: 1500 },
  { name: "HDMI Cable 2m", category: "Cable", brand: "Generic", model: "HDMI-2M", purchasePrice: 350 },
  { name: "VGA Cable 1.5m", category: "Cable", brand: "Generic", model: "VGA-15", purchasePrice: 250 },
  { name: "Canon PIXMA G3010", category: "Printer", brand: "Canon", model: "PIXMA G3010", purchasePrice: 18500 },
  { name: "MikroTik hEX Router", category: "Networking", brand: "MikroTik", model: "RB750Gr3", purchasePrice: 7500 },
  { name: "iPhone 13 Pro", category: "Phone", brand: "Apple", model: "iPhone 13 Pro", purchasePrice: 110000 },
  { name: "Lenovo ThinkPad X1", category: "Laptop", brand: "Lenovo", model: "X1 Carbon Gen 9", purchasePrice: 145000 },
  { name: "Samsung 27\" Monitor", category: "Monitor", brand: "Samsung", model: "S27R350", purchasePrice: 28000 },
  { name: "Logitech K380", category: "Keyboard", brand: "Logitech", model: "K380", purchasePrice: 4200 },
  { name: "Apple Magic Mouse", category: "Mouse", brand: "Apple", model: "Magic Mouse 2", purchasePrice: 8900 },
  { name: "HP LaserJet Pro M404", category: "Printer", brand: "HP", model: "LaserJet M404", purchasePrice: 32000 },
  { name: "Executive Office Chair", category: "Furniture", brand: "Hatil", model: "Exec-200", purchasePrice: 18000 },
  { name: "Standing Desk", category: "Furniture", brand: "Hatil", model: "Stand-Desk-X", purchasePrice: 35000 },
  { name: "Cisco Catalyst Switch", category: "Networking", brand: "Cisco", model: "C1000-24T", purchasePrice: 65000 },
  { name: "MacBook Pro 14\"", category: "Laptop", brand: "Apple", model: "MBP 14 M2", purchasePrice: 215000 },
  { name: "Samsung Galaxy S22", category: "Phone", brand: "Samsung", model: "Galaxy S22", purchasePrice: 92000 },
];

const statuses: AssetStatus[] = ["Available", "Assigned", "Assigned", "In Repair", "Damaged", "Reserved", "Available", "Assigned", "Lost", "Pending Approval"];

export const assets: Asset[] = assetSeed.map((s, i) => {
  const status = statuses[i % statuses.length];
  const assignedTo = status === "Assigned" ? employees[i % employees.length].name : undefined;
  const purchaseDate = `2023-${String((i % 12) + 1).padStart(2, "0")}-15`;
  return {
    id: `AST-${String(1001 + i)}`,
    name: s.name,
    category: s.category,
    brand: s.brand,
    model: s.model,
    serial: `SN${100000 + i * 37}`,
    tag: `TAG-${2000 + i}`,
    status,
    assignedTo,
    location: locations[i % locations.length],
    purchasePrice: s.purchasePrice,
    currentValue: Math.round(s.purchasePrice * (0.6 + (i % 4) * 0.08)),
    purchaseDate,
    warrantyExpiry: `2026-${String((i % 12) + 1).padStart(2, "0")}-15`,
    vendor: vendors[i % vendors.length].name,
    condition: conditions[i % conditions.length],
    depreciationMethod: depreciationMethods[i % depreciationMethods.length],
    usefulLife: 5,
    salvageValue: Math.round(s.purchasePrice * 0.1),
  };
});

export const purchases: Purchase[] = [
  { id: "PO-001", invoiceNumber: "INV-2024-001", vendor: "TechWorld BD", date: "2024-01-12", totalItems: 5, totalAmount: 485000, paymentStatus: "Paid", attachment: true },
  { id: "PO-002", invoiceNumber: "INV-2024-002", vendor: "Smart Computers", date: "2024-03-08", totalItems: 3, totalAmount: 245000, paymentStatus: "Paid", attachment: true },
  { id: "PO-003", invoiceNumber: "INV-2024-003", vendor: "Office Solutions Ltd", date: "2024-05-21", totalItems: 8, totalAmount: 178000, paymentStatus: "Partial", attachment: true },
  { id: "PO-004", invoiceNumber: "INV-2024-004", vendor: "Global IT Traders", date: "2024-08-14", totalItems: 2, totalAmount: 215000, paymentStatus: "Paid", attachment: false },
  { id: "PO-005", invoiceNumber: "INV-2024-005", vendor: "PrintMaster", date: "2024-10-03", totalItems: 4, totalAmount: 92000, paymentStatus: "Unpaid", attachment: true },
];

export const repairs: RepairTicket[] = [
  { id: "RPR-001", assetId: "AST-1004", assetName: "Logitech MX Master 3", problem: "Scroll wheel not working", reportedBy: "Arif Hossain", vendor: "TechWorld BD", cost: 1500, status: "Under Repair", reportedDate: "2026-04-12", expectedReturn: "2026-05-15" },
  { id: "RPR-002", assetId: "AST-1008", assetName: "Canon PIXMA G3010", problem: "Paper jam, cartridge issue", reportedBy: "Sajid Karim", vendor: "PrintMaster", cost: 4500, status: "Sent to Vendor", reportedDate: "2026-04-25", expectedReturn: "2026-05-20" },
  { id: "RPR-003", assetId: "AST-1011", assetName: "Lenovo ThinkPad X1", problem: "Keyboard malfunction", reportedBy: "Maliha Rahman", vendor: "Smart Computers", cost: 8000, status: "Repaired", reportedDate: "2026-03-18", expectedReturn: "2026-04-10" },
  { id: "RPR-004", assetId: "AST-1015", assetName: "HP LaserJet Pro M404", problem: "Toner sensor error", reportedBy: "Tania Akter", vendor: "PrintMaster", cost: 3200, status: "Open", reportedDate: "2026-05-02", expectedReturn: "2026-05-25" },
  { id: "RPR-005", assetId: "AST-1019", assetName: "MacBook Pro 14\"", problem: "Battery replacement", reportedBy: "Hasan Mahmud", vendor: "Global IT Traders", cost: 18500, status: "Returned", reportedDate: "2026-02-10", expectedReturn: "2026-03-05" },
];

export const auditLogs: AuditLog[] = [
  { id: "LOG-001", timestamp: "2026-05-08 09:14", user: "Arif Hossain", role: "IT/Admin User", action: "Assigned", module: "Assets", recordId: "AST-1011", ip: "10.0.0.12", device: "Chrome / Windows" },
  { id: "LOG-002", timestamp: "2026-05-08 09:02", user: "Nusrat Jahan", role: "HR User", action: "Created", module: "Employees", recordId: "EMP-010", ip: "10.0.0.18", device: "Safari / macOS" },
  { id: "LOG-003", timestamp: "2026-05-07 17:45", user: "Tania Akter", role: "Finance User", action: "Approved", module: "Purchases", recordId: "PO-004", ip: "10.0.0.21", device: "Chrome / Windows" },
  { id: "LOG-004", timestamp: "2026-05-07 14:21", user: "Sajid Karim", role: "Company Admin", action: "Updated", module: "Assets", recordId: "AST-1008", ip: "10.0.0.5", device: "Edge / Windows" },
  { id: "LOG-005", timestamp: "2026-05-07 11:08", user: "Maliha Rahman", role: "IT/Admin User", action: "Returned", module: "Returns", recordId: "AST-1004", ip: "10.0.0.33", device: "Chrome / Linux" },
  { id: "LOG-006", timestamp: "2026-05-06 18:50", user: "Auditor One", role: "Auditor/Viewer", action: "Login", module: "Auth", recordId: "USR-009", ip: "203.45.12.10", device: "Firefox / Windows" },
  { id: "LOG-007", timestamp: "2026-05-06 16:12", user: "Tania Akter", role: "Finance User", action: "Updated", module: "Finance", recordId: "AST-1019", ip: "10.0.0.21", device: "Chrome / Windows" },
  { id: "LOG-008", timestamp: "2026-05-06 10:30", user: "Arif Hossain", role: "IT/Admin User", action: "Deleted", module: "Repairs", recordId: "RPR-099", ip: "10.0.0.12", device: "Chrome / Windows" },
];

export const notifications: Notification[] = [
  { id: "N1", type: "warranty", title: "Warranty expiring soon", message: "5 assets warranty expires in 30 days", date: "2026-05-08", read: false },
  { id: "N2", type: "return", title: "Pending return", message: "Hasan Mahmud has 2 assets pending return", date: "2026-05-07", read: false },
  { id: "N3", type: "repair", title: "Repair update", message: "RPR-001 marked as Under Repair", date: "2026-05-06", read: true },
  { id: "N4", type: "approval", title: "Approval required", message: "Asset AST-1010 pending approval", date: "2026-05-05", read: false },
  { id: "N5", type: "clearance", title: "Clearance pending", message: "Employee EMP-009 clearance in progress", date: "2026-05-04", read: true },
];

export const users: User[] = [
  { id: "USR-001", name: "Super Admin", email: "admin@assetflow.com", role: "Super Admin", department: "IT", status: "Active", lastLogin: "2026-05-08 09:00" },
  { id: "USR-002", name: "Arif Hossain", email: "arif@company.com", role: "IT/Admin User", department: "IT", status: "Active", lastLogin: "2026-05-08 08:50" },
  { id: "USR-003", name: "Nusrat Jahan", email: "nusrat@company.com", role: "HR User", department: "HR", status: "Active", lastLogin: "2026-05-07 18:10" },
  { id: "USR-004", name: "Tania Akter", email: "tania@company.com", role: "Finance User", department: "Finance", status: "Active", lastLogin: "2026-05-07 17:55" },
  { id: "USR-005", name: "Auditor One", email: "auditor@company.com", role: "Auditor/Viewer", department: "Admin", status: "Active", lastLogin: "2026-05-06 18:50" },
  { id: "USR-006", name: "Sajid Karim", email: "sajid@company.com", role: "Company Admin", department: "Admin", status: "Inactive", lastLogin: "2026-04-22 14:00" },
];

export const dashboardStats = {
  total: assets.length,
  assigned: assets.filter((a) => a.status === "Assigned").length,
  available: assets.filter((a) => a.status === "Available").length,
  inRepair: assets.filter((a) => a.status === "In Repair").length,
  damaged: assets.filter((a) => a.status === "Damaged").length,
  lost: assets.filter((a) => a.status === "Lost").length,
  totalPurchase: assets.reduce((s, a) => s + a.purchasePrice, 0),
  currentValue: assets.reduce((s, a) => s + a.currentValue, 0),
  warrantyExpiringSoon: 5,
  pendingClearances: employees.filter((e) => e.clearanceStatus === "In Progress").length,
};

export const recentActivities = auditLogs.slice(0, 6).map((l) => ({
  id: l.id,
  user: l.user,
  action: `${l.action} ${l.module} (${l.recordId})`,
  time: l.timestamp,
}));