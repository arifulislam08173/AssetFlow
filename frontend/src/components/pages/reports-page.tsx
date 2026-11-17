"use client";

import { useState } from "react";
import { Download, Eye, FileText, Search, RotateCcw } from "lucide-react";
import { useOptions, CompanyFilter, PageHeader, Button, Card, CardContent, CardHeader, CardTitle, Input, downloadFile, withListFilters } from "./shared";
import { BackendFilters, type FilterState } from "@/components/backend-filters";

type Report = { title: string; path: string; csv: string; summary: string; byCompany?: boolean };
const reports: Report[] = [
  { title: "Asset Inventory", path: "/exports/assets.pdf", csv: "/exports/assets.csv", summary: "Assets, categories, holders, purchase prices and book values", byCompany: true },
  { title: "Depreciation & Finance", path: "/exports/finance.pdf", csv: "/exports/finance.csv", summary: "Purchase cost, stored book values and depreciation", byCompany: true },
  { title: "Employee Directory", path: "/exports/employees.pdf", csv: "/exports/employees.csv", summary: "Employees, departments, joining dates and status", byCompany: true },
  { title: "Vendor Directory", path: "/exports/vendors.pdf", csv: "/exports/vendors.csv", summary: "Supplier contacts and status", byCompany: true },
  { title: "Purchase Register", path: "/exports/purchases.pdf", csv: "/exports/purchases.csv", summary: "Invoices, purchase dates and payments", byCompany: true },
  { title: "Assignments", path: "/exports/assignments.pdf", csv: "/exports/assignments.csv", summary: "Asset custody, handover and returns", byCompany: true },
  { title: "Returns & Clearance", path: "/exports/returns.pdf", csv: "/exports/returns.csv", summary: "Return dates, conditions and penalties", byCompany: true },
  { title: "Repair Tickets", path: "/exports/repairs.pdf", csv: "/exports/repairs.csv", summary: "Repair dates, costs and resolution status", byCompany: true },
  { title: "Asset Categories", path: "/exports/categories.pdf", csv: "/exports/categories.csv", summary: "Category setup and depreciation methods", byCompany: true },
  { title: "Companies", path: "/exports/companies.pdf", csv: "/exports/companies.csv", summary: "Company directory and administration" },
  { title: "User Access", path: "/exports/users.pdf", csv: "/exports/users.csv", summary: "User roles, account status and login activity" },
  { title: "Audit Activity", path: "/exports/audit-logs.pdf", csv: "/exports/audit-logs.csv", summary: "Latest 500 relevant system actions" },
];

export function ReportsPage() {
  const { options } = useOptions();
  const [filters, setFilters] = useState<FilterState>({});
  const [search, setSearch] = useState("");
  const scoped = (report: Report) => {
    const choice = { ...filters };
    if (!report.byCompany) delete choice.companyId;
    return withListFilters(report.path, choice, search);
  };
  const csvPath = (report: Report) => {
    const choice = { ...filters };
    if (!report.byCompany) delete choice.companyId;
    return withListFilters(report.csv, choice, search);
  };
  return (
    <div className="space-y-6">
      <PageHeader title="Report Center" description="Preview, print or download secure PDF reports. Search and date range are applied by the backend across all matching records." />
      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 lg:flex-nowrap">
          <div className="relative w-full min-w-56 flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-3 size-4 text-muted-foreground"/>
            <Input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder="Search: starts with..." aria-label="Search report records" className="h-10 rounded-xl pl-9" />
          </div>
          <CompanyFilter value={typeof filters.companyId === "string" ? filters.companyId : undefined}
            onChange={(value) => setFilters((previous) => ({ ...previous, companyId: value }))} companies={options.companies}/>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
          <BackendFilters filters={filters} onChange={setFilters} dateLabel="Report date"
            section="dates" showReset={false} />
          {(search.trim() || Object.values(filters).some((value) => value !== undefined && value !== "" && value !== null)) &&
            <Button variant="outline" size="sm" className="h-10 rounded-xl"
              onClick={() => { setSearch(""); setFilters({}); }}><RotateCcw className="mr-2 size-4"/>Clear all</Button>}
        </div>
        <p className="text-xs leading-5 text-muted-foreground">Each report uses its relevant business date (purchase, joining, assignment, return, repair or creation). Company selection does not apply to company, user or audit reports. Search checks each report's supported fields by prefix.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.path} className="flex flex-col border-border/70 shadow-sm transition-shadow hover:shadow-md">
            <CardHeader className="pb-2"><div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><FileText className="size-5"/></div><CardTitle className="text-base">{report.title}</CardTitle></CardHeader>
            <CardContent className="flex flex-1 flex-col"><p className="mb-5 flex-1 text-sm text-muted-foreground">{report.summary}</p><div className="flex gap-2">
              <Button size="sm" onClick={() => downloadFile(scoped(report), `assetflow-${report.path.split('/').pop()}`)}><Eye className="mr-2 size-4"/> Preview PDF</Button>
              <Button size="sm" variant="outline" onClick={() => downloadFile(csvPath(report), report.csv.split('/').pop() || 'report.csv')}><Download className="mr-2 size-4"/> CSV</Button>
            </div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
