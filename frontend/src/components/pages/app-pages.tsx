"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  ArrowLeft,
  Boxes,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileBarChart,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  QrCode,
  ScanLine,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  Undo2,
  Upload,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { assetflowService } from "@/services/assetflow.service";
import { notifications, recentActivities } from "@/lib/mock-data";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { DataTableShell } from "@/components/data-table-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});
type AnyObj = Record<string, any>;
type Meta = { page: number; limit: number; total: number; totalPages: number };
type Options = {
  companies: AnyObj[];
  categories: AnyObj[];
  departments: AnyObj[];
  locations: AnyObj[];
  vendors: AnyObj[];
  roles: AnyObj[];
};
const emptyMeta: Meta = { page: 1, limit: 20, total: 0, totalPages: 1 };
const emptyOptions: Options = {
  companies: [],
  categories: [],
  departments: [],
  locations: [],
  vendors: [],
  roles: [],
};
const roleNames = [
  "Super Admin",
  "Company Admin",
  "IT",
  "Asset Manager",
  "HR Manager",
  "Finance Manager",
  "Auditor",
  "Viewer",
];
const permissionGroups = [
  "companies",
  "users",
  "roles",
  "assets",
  "categories",
  "employees",
  "vendors",
  "purchases",
  "assignments",
  "returns",
  "repairs",
  "scanner",
  "finance",
  "reports",
  "audit_logs",
  "settings",
];

function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("assetflow_access_token")
    )
      router.replace("/login");
  }, [router]);
}


function canPermission(permissions: string[], permission: string) {
  const namespace = permission.split(".")[0];
  return (
    permissions.includes("*") ||
    permissions.includes(permission) ||
    permissions.includes(`${namespace}.*`)
  );
}

function moduleFromPath(path?: string) {
  if (!path) return "";
  return path.split("/").filter(Boolean)[0] || "";
}

function useCurrentPermissions() {
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem("assetflow_access_token")) return;
    assetflowService
      .me()
      .then((res) => setPermissions(res.data.data?.permissions || []))
      .catch(() => setPermissions([]));
  }, []);

  return {
    permissions,
    can: (permission: string) => canPermission(permissions, permission),
  };
}

function useOptions(companyId?: string) {
  const [options, setOptions] = useState<Options>(emptyOptions);
  const refresh = () =>
    assetflowService
      .masterOptions(companyId ? { companyId } : undefined)
      .then((r) => setOptions(r.data.data || emptyOptions))
      .catch(() => null);
  useEffect(() => {
    refresh();
  }, [companyId]);
  return { options, refresh };
}

function useApiList(fetcher: (params?: AnyObj) => Promise<any>) {
  const [items, setItems] = useState<AnyObj[]>([]);
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<AnyObj>({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  useEffect(() => {
    setLoading(true);
    fetcher({
      page: meta.page,
      limit: meta.limit,
      search: search || undefined,
      ...filters,
    })
      .then((r) => {
        setItems(r.data.data || []);
        setMeta(r.data.meta || meta);
      })
      .catch((e) =>
        toast.error(
          e.response?.data?.message || "API load failed. Please login.",
        ),
      )
      .finally(() => setLoading(false));
  }, [meta.page, meta.limit, search, key, JSON.stringify(filters)]);
  return {
    items,
    meta,
    setMeta,
    search,
    setSearch,
    filters,
    setFilters,
    loading,
    refresh: () => setKey((v) => v + 1),
  };
}

function Toolbar({
  placeholder = "Search...",
  search,
  setSearch,
  createHref,
  createLabel = "Add New",
  templateUrl,
  onPdf,
  onCsv,
  children,
}: {
  placeholder?: string;
  search: string;
  setSearch: (v: string) => void;
  createHref?: string;
  createLabel?: string;
  templateUrl?: string;
  onPdf?: () => void;
  onCsv?: () => void;
  children?: React.ReactNode;
}) {
  const { can } = useCurrentPermissions();
  const moduleName = moduleFromPath(createHref);
  const canCreate = !createHref || !moduleName || can(`${moduleName}.create`);
  const canExport = can("reports.export") || (moduleName ? can(`${moduleName}.export`) : false);

  return (
    <div className="flex flex-col gap-3 rounded-2xl border bg-card/70 p-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
        <div className="relative min-w-64 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
          />
        </div>
        {children}
      </div>
      <div className="flex flex-wrap gap-2">
        {templateUrl && canExport && (
          <Button asChild variant="outline" size="sm">
            <a href={templateUrl}>
              <Download className="mr-2 h-4 w-4" />
              Template
            </a>
          </Button>
        )}
        {onCsv && canExport && (
          <Button variant="outline" size="sm" onClick={onCsv}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
        )}
        {onPdf && canExport && (
          <Button variant="outline" size="sm" onClick={onPdf}>
            <FileBarChart className="mr-2 h-4 w-4" />
            PDF
          </Button>
        )}
        {createHref && canCreate && (
          <Button asChild size="sm">
            <Link href={createHref}>
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}

function Footer({
  meta,
  setMeta,
}: {
  meta: Meta;
  setMeta: (updater: (m: Meta) => Meta) => void;
}) {
  return (
    <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
      <span>
        Page {meta.page} of {meta.totalPages || 1} / {meta.total} records
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page <= 1}
          onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={meta.page >= meta.totalPages}
          onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
function Field({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-medium">{value ?? "-"}</p>
    </div>
  );
}
function LoadingRows({ colSpan = 8 }: { colSpan?: number }) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-28 text-center text-muted-foreground"
      >
        <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
        Loading live backend data...
      </TableCell>
    </TableRow>
  );
}
function EmptyRows({
  colSpan = 8,
  label = "No records found",
}: {
  colSpan?: number;
  label?: string;
}) {
  return (
    <TableRow>
      <TableCell
        colSpan={colSpan}
        className="h-24 text-center text-muted-foreground"
      >
        {label}
      </TableCell>
    </TableRow>
  );
}
async function downloadFile(path: string, filename: string) {
  try {
    const res = await api.get(path, { responseType: "blob" });
    const blob = new Blob([res.data], {
      type: String(res.headers["content-type"] || "application/octet-stream"),
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (e: any) {
    toast.error(e.response?.data?.message || "Export failed");
  }
}
function BackButton({ fallback = "/dashboard" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1)
          router.back();
        else router.push(fallback);
      }}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      Back
    </Button>
  );
}

function PermissionAction({
  permission,
  children,
}: {
  permission: string;
  children: React.ReactNode;
}) {
  const { can } = useCurrentPermissions();
  if (!can(permission)) return null;
  return <>{children}</>;
}

export function DashboardPage() {
  useAuthGuard();
  const [stats, setStats] = useState<AnyObj>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    assetflowService
      .dashboard()
      .then((r) => setStats(r.data.data))
      .catch(() => toast.error("Login required for dashboard API"))
      .finally(() => setLoading(false));
  }, []);
  const chartData = useMemo(
    () => [
      { name: "Total", value: stats.totalAssets || 0 },
      { name: "Assigned", value: stats.assignedAssets || 0 },
      { name: "Available", value: stats.availableAssets || 0 },
      { name: "Repair", value: stats.inRepair || 0 },
      { name: "Lost", value: stats.lost || 0 },
    ],
    [stats],
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="AssetFlow Dashboard"
        description="Enterprise command center for asset lifecycle, handover, finance and audit."
        actions={
          <>
            <PermissionAction permission="scanner.use">
              <Button asChild variant="outline">
                <Link href="/scanner">
                  <ScanLine className="mr-2 h-4 w-4" />
                  Scan Asset
                </Link>
              </Button>
            </PermissionAction>
            <PermissionAction permission="assets.create">
              <Button asChild>
                <Link href="/assets/create">
                  <Boxes className="mr-2 h-4 w-4" />
                  Add Asset
                </Link>
              </Button>
            </PermissionAction>
          </>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Assets"
          value={loading ? "..." : stats.totalAssets || 0}
          icon={Boxes}
        />
        <StatCard
          label="Assigned"
          value={stats.assignedAssets || 0}
          icon={ClipboardCheck}
          tone="info"
        />
        <StatCard
          label="Available"
          value={stats.availableAssets || 0}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="In Repair"
          value={stats.inRepair || 0}
          icon={Wrench}
          tone="warning"
        />
        <StatCard
          label="Employees"
          value={stats.employees || 0}
          icon={Users}
          tone="destructive"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Purchase Value"
          value={money.format(stats.purchaseValue || 0)}
          icon={Wallet}
        />
        <StatCard
          label="Current Value"
          value={money.format(stats.currentValue || 0)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Damaged"
          value={stats.damaged || 0}
          icon={AlertTriangle}
          tone="warning"
        />
        <StatCard
          label="Lost"
          value={stats.lost || 0}
          icon={AlertTriangle}
          tone="destructive"
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-7">
        <Card className="min-w-0 xl:col-span-4">
          <CardHeader>
            <CardTitle>Asset Status Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80 min-h-80 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(stats.recentActivities?.length
              ? stats.recentActivities
              : recentActivities
            )
              .slice(0, 8)
              .map((i: AnyObj, idx: number) => (
                <div
                  key={i.id || idx}
                  className="rounded-2xl border border-border/60 bg-background/65 p-3 shadow-sm"
                >
                  <p className="font-medium">{i.action}</p>
                  <p className="text-sm text-muted-foreground">
                    {i.userName || i.user || "System"}
                  </p>
                </div>
              ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function CompaniesPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.companies);
  const remove = async (id: string) => {
    if (!confirm("Delete this company?")) return;
    await assetflowService.deleteCompany(id);
    toast.success("Company deleted");
    list.refresh();
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Create and maintain companies for future SaaS / multi-company selling."
        actions={
          <PermissionAction permission="companies.create">
            <Button asChild>
              <Link href="/companies/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/companies/create"
            onCsv={() =>
              toast.info("Company CSV export will follow same export pattern.")
            }
            onPdf={() =>
              toast.info("Company PDF export will follow same export pattern.")
            }
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={7} />
            ) : list.items.length ? (
              list.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.code}</TableCell>
                  <TableCell>{c.contactPerson || "-"}</TableCell>
                  <TableCell>{c.email || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/companies/${c.id}/edit`}
                      edit={`/companies/${c.id}/edit`}
                      onDelete={() => remove(c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={6} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}

function CompanyForm({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const [f, setF] = useState<AnyObj>({
    name: "",
    code: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    website: "",
    industry: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (id) assetflowService.company(id).then((r) => setF(r.data.data));
  }, [id]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try {
      setSaving(true);
      if (id) await assetflowService.updateCompany(id, f);
      else await assetflowService.createCompany(f);
      toast.success(id ? "Company updated" : "Company created");
      router.push("/companies");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <FormShell
      title={id ? "Edit Company" : "Create Company"}
      description="Company information for enterprise/SaaS onboarding."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Company Name"
          value={f.name}
          onChange={(v) => set("name", v)}
        />
        <InputField
          label="Company Code"
          value={f.code}
          onChange={(v) => set("code", v)}
        />
        <InputField
          label="Contact Person"
          value={f.contactPerson}
          onChange={(v) => set("contactPerson", v)}
        />
        <InputField
          label="Email"
          value={f.email}
          onChange={(v) => set("email", v)}
        />
        <InputField
          label="Phone"
          value={f.phone}
          onChange={(v) => set("phone", v)}
        />
        <InputField
          label="Website"
          value={f.website}
          onChange={(v) => set("website", v)}
        />
        <InputField
          label="Industry"
          value={f.industry}
          onChange={(v) => set("industry", v)}
        />
        <SelectField
          label="Status"
          value={f.status}
          onChange={(v) => set("status", v)}
          options={["Active", "Inactive"]}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Address"
            value={f.address}
            onChange={(v) => set("address", v)}
          />
        </div>
      </div>
    </FormShell>
  );
}
export function CompanyCreatePage() {
  return <CompanyForm />;
}
export function CompanyEditPage() {
  const params = useParams();
  return <CompanyForm id={String(params.id)} />;
}

function RowActions({
  view,
  edit,
  pdfPath,
  pdfName = "assetflow-report.html",
  onDelete,
}: {
  view?: string;
  edit?: string;
  pdfPath?: string;
  pdfName?: string;
  onDelete?: () => void;
}) {
  const { can } = useCurrentPermissions();
  const moduleName = moduleFromPath(edit || view);
  const canUpdate = !edit || !moduleName || can(`${moduleName}.update`);
  const canDelete = !!onDelete && (!moduleName || can(`${moduleName}.delete`));
  const canExport = !!pdfPath && (can("reports.export") || (moduleName ? can(`${moduleName}.export`) : false));

  if (!view && !canUpdate && !canDelete && !canExport) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {view && (
          <DropdownMenuItem asChild>
            <Link href={view}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </DropdownMenuItem>
        )}
        {edit && canUpdate && (
          <DropdownMenuItem asChild>
            <Link href={edit}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </DropdownMenuItem>
        )}
        {pdfPath && canExport && (
          <DropdownMenuItem onClick={() => downloadFile(pdfPath, pdfName)}>
            <FileBarChart className="mr-2 h-4 w-4" />
            PDF
          </DropdownMenuItem>
        )}
        {canDelete && (
          <DropdownMenuItem className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function FormShell({
  title,
  description,
  onSave,
  saving,
  children,
}: {
  title: string;
  description: string;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          <>
            <BackButton />
            <Button onClick={onSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="p-6">{children}</CardContent>
      </Card>
    </div>
  );
}
function InputField({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
function TextAreaField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || options[0]} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
function optionLabel(i: AnyObj, labelKey = "name") {
  if (labelKey === "employee") return `${i.employeeCode || "EMP"} - ${i.name}`;
  if (labelKey === "asset") return `${i.assetCode || "AST"} - ${i.name}`;
  return i[labelKey] || i.name || i.code || i.id;
}
function SelectIdField({
  label,
  value,
  onChange,
  items,
  labelKey = "name",
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  items: AnyObj[];
  labelKey?: string;
}) {
  const [q, setQ] = useState("");
  const filtered = items.filter(
    (i) =>
      optionLabel(i, labelKey).toLowerCase().includes(q.toLowerCase()) ||
      String(i.employeeCode || i.assetCode || i.code || "")
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <div className="p-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}...`}
              className="h-8"
            />
          </div>
          {filtered.map((i) => (
            <SelectItem key={i.id} value={i.id}>
              {optionLabel(i, labelKey)}
            </SelectItem>
          ))}
          {!filtered.length && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No match found
            </div>
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
function CompanyFilter({
  value,
  onChange,
  companies,
}: {
  value?: string;
  onChange: (v?: string) => void;
  companies: AnyObj[];
}) {
  return (
    <Select
      value={value || "all"}
      onValueChange={(v) => onChange(v === "all" ? undefined : v)}
    >
      <SelectTrigger className="w-full sm:w-64">
        <SelectValue placeholder="Filter by company" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All companies</SelectItem>
        {companies.map((c) => (
          <SelectItem key={c.id} value={c.id}>
            {c.code ? `${c.code} - ${c.name}` : c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function CategoriesPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.categories);
  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await assetflowService.deleteCategory(id);
    toast.success("Category deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Categories"
        description="Global asset categories used across all companies/wings. Company is selected when assets are created or assigned."
        actions={
          <PermissionAction permission="categories.create">
            <Button asChild>
              <Link href="/categories/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/categories/create"
            templateUrl={assetflowService.categoryTemplateUrl()}
            onCsv={() => toast.info("Category CSV export will be connected next.")}
            onPdf={() => toast.info("Category PDF export will be connected next.")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={3} />
            ) : list.items.length ? (
              list.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    Available for all company wings and sectors.
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      edit={`/categories/${c.id}/edit`}
                      onDelete={() => remove(c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={3} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
function CategoryForm({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const [f, setF] = useState<AnyObj>({ name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) assetflowService.category(id).then((r) => setF({ name: r.data.data.name || "" }));
  }, [id]);

  const save = async () => {
    try {
      setSaving(true);
      if (id) await assetflowService.updateCategory(id, f);
      else await assetflowService.createCategory(f);
      toast.success("Category saved");
      router.push("/categories");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell
      title={id ? "Edit Category" : "Create Category"}
      description="Create global asset categories. Useful life and depreciation are set on the asset itself."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Category Name"
          value={f.name}
          onChange={(v) => setF({ ...f, name: v })}
        />
      </div>
    </FormShell>
  );
}
export function CategoryCreatePage() {
  return <CategoryForm />;
}
export function CategoryEditPage() {
  const params = useParams();
  return <CategoryForm id={String(params.id)} />;
}

export function AssetsPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.assets);
  const remove = async (id: string) => {
    if (!confirm("Delete this asset?")) return;
    await assetflowService.deleteAsset(id);
    toast.success("Asset deleted");
    list.refresh();
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Management"
        description="Company-aware asset inventory with searchable filters, category-driven forms, QR, templates and exports."
        actions={
          <>
            <PermissionAction permission="assets.import">
              <Button asChild variant="outline">
                <Link href="/assets/import">
                  <Upload className="mr-2 h-4 w-4" />
                  Bulk Import
                </Link>
              </Button>
            </PermissionAction>
            <PermissionAction permission="assets.create">
              <Button asChild>
                <Link href="/assets/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Link>
              </Button>
            </PermissionAction>
          </>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/assets/create"
            templateUrl={assetflowService.assetTemplateUrl()}
            onCsv={() =>
              downloadFile("/exports/assets.csv", "assetflow-assets.csv")
            }
            onPdf={() =>
              downloadFile(
                "/exports/assets.pdf",
                "assetflow-assets-report.html",
              )
            }
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
            <Select
              value={list.filters.status || "all"}
              onValueChange={(status) =>
                list.setFilters((f: AnyObj) => ({
                  ...f,
                  status: status === "all" ? undefined : status,
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                {[
                  "Available",
                  "Assigned",
                  "In Repair",
                  "Damaged",
                  "Lost",
                  "Disposed",
                ].map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Toolbar>
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Serial</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Value</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={8} />
            ) : list.items.length ? (
              list.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {a.company?.code || a.company?.name || "-"}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {a.assetCode}
                    </div>
                  </TableCell>
                  <TableCell>{a.category?.name || "-"}</TableCell>
                  <TableCell>{a.serialNumber}</TableCell>
                  <TableCell>
                    <StatusBadge status={a.status} />
                  </TableCell>
                  <TableCell>
                    {a.assignedEmployee
                      ? `${a.assignedEmployee.employeeCode || ""} - ${a.assignedEmployee.name}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {money.format(Number(a.currentValue || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/assets/${a.id}`}
                      edit={`/assets/${a.id}/edit`}
                      onDelete={() => remove(a.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={8} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}

const initialAsset = () => ({
  companyId: "",
  assetCode: `AST-${Date.now().toString().slice(-6)}`,
  name: "",
  categoryId: "",
  brand: "",
  model: "",
  serialNumber: `SN-${Date.now().toString().slice(-6)}`,
  assetTag: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  purchasePrice: 0,
  salvageValue: 0,
  usefulLifeYears: 5,
  depreciationMethod: "Straight Line",
  vendorId: "",
  locationId: "",
  condition: "New",
  status: "Available",
  warrantyExpiry: "",
  notes: "",
});
function AssetFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [rows, setRows] = useState<AnyObj[]>([initialAsset()]);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (id)
      assetflowService
        .asset(id)
        .then((r) =>
          setRows([
            {
              ...r.data.data,
              companyId: r.data.data.companyId || r.data.data.company?.id || "",
              categoryId: r.data.data.categoryId || r.data.data.category?.id,
              vendorId: r.data.data.vendorId || r.data.data.vendor?.id || "",
              locationId:
                r.data.data.locationId || r.data.data.location?.id || "",
            },
          ]),
        );
  }, [id]);
  useEffect(() => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        companyId: r.companyId || options.companies[0]?.id || "",
        categoryId: r.categoryId || options.categories[0]?.id || "",
        locationId: r.locationId || options.locations[0]?.id || "",
        vendorId: r.vendorId || options.vendors[0]?.id || "",
      })),
    );
  }, [
    options.companies.length,
    options.categories.length,
    options.locations.length,
    options.vendors.length,
  ]);
  const update = (idx: number, key: string, value: any) =>
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [key]: value } : r)),
    );
  const addRow = () =>
    setRows((prev) => [
      ...prev,
      {
        ...initialAsset(),
        companyId: options.companies[0]?.id || "",
        categoryId: options.categories[0]?.id || "",
        locationId: options.locations[0]?.id || "",
        vendorId: options.vendors[0]?.id || "",
      },
    ]);
  const save = async () => {
    try {
      setSaving(true);
      const payload = rows.map((r) => ({
        ...r,
        purchasePrice: Number(r.purchasePrice || 0),
        salvageValue: Number(r.salvageValue || 0),
        usefulLifeYears: Number(r.usefulLifeYears || 5),
        companyId: r.companyId || null,
        vendorId: r.vendorId || null,
        warrantyExpiry: r.warrantyExpiry || null,
      }));
      if (id) await assetflowService.updateAsset(id, payload[0]);
      else if (payload.length === 1)
        await assetflowService.createAsset(payload[0]);
      else await assetflowService.createAssetsBulk({ assets: payload });
      toast.success(id ? "Asset updated" : "Asset saved");
      router.push("/assets");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Edit Asset" : "Add Assets"}
        description="Use single or multiple rows. Category dropdown is loaded from backend categories table."
        actions={
          <>
            <BackButton />
            {!id && (
              <Button variant="outline" onClick={addRow}>
                <Plus className="mr-2 h-4 w-4" />
                Add Row
              </Button>
            )}
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
            </Button>
          </>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle>Asset Entry Rows</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {rows.map((r, idx) => (
            <div key={idx} className="rounded-2xl border bg-background/70 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Asset Row #{idx + 1}</h3>
                {rows.length > 1 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRows(rows.filter((_, i) => i !== idx))}
                  >
                    Remove
                  </Button>
                )}
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                <SelectIdField
                  label="Company"
                  value={r.companyId}
                  onChange={(v) => update(idx, "companyId", v)}
                  items={options.companies}
                />
                <InputField
                  label="Asset Code"
                  value={r.assetCode}
                  onChange={(v) => update(idx, "assetCode", v)}
                />
                <InputField
                  label="Asset Name"
                  value={r.name}
                  onChange={(v) => update(idx, "name", v)}
                />
                <SelectIdField
                  label="Category"
                  value={r.categoryId}
                  onChange={(v) => update(idx, "categoryId", v)}
                  items={options.categories}
                />
                <InputField
                  label="Brand"
                  value={r.brand}
                  onChange={(v) => update(idx, "brand", v)}
                />
                <InputField
                  label="Model"
                  value={r.model}
                  onChange={(v) => update(idx, "model", v)}
                />
                <InputField
                  label="Serial Number"
                  value={r.serialNumber}
                  onChange={(v) => update(idx, "serialNumber", v)}
                />
                <InputField
                  label="Asset Tag"
                  value={r.assetTag}
                  onChange={(v) => update(idx, "assetTag", v)}
                />
                <InputField
                  label="Purchase Date"
                  value={r.purchaseDate}
                  onChange={(v) => update(idx, "purchaseDate", v)}
                  type="date"
                />
                <NumberField
                  label="Purchase Price"
                  value={r.purchasePrice}
                  onChange={(v) => update(idx, "purchasePrice", v)}
                />
                <NumberField
                  label="Salvage Value"
                  value={r.salvageValue}
                  onChange={(v) => update(idx, "salvageValue", v)}
                />
                <NumberField
                  label="Useful Life"
                  value={r.usefulLifeYears}
                  onChange={(v) => update(idx, "usefulLifeYears", v)}
                />
                <SelectField
                  label="Depreciation"
                  value={r.depreciationMethod}
                  onChange={(v) => update(idx, "depreciationMethod", v)}
                  options={[
                    "Straight Line",
                    "Declining Balance",
                    "Manual",
                    "No Depreciation",
                  ]}
                />
                <SelectIdField
                  label="Vendor"
                  value={r.vendorId}
                  onChange={(v) => update(idx, "vendorId", v)}
                  items={options.vendors.filter(
                    (v) => !r.companyId || v.companyId === r.companyId,
                  )}
                />
                <SelectIdField
                  label="Location"
                  value={r.locationId}
                  onChange={(v) => update(idx, "locationId", v)}
                  items={options.locations}
                />
                <SelectField
                  label="Condition"
                  value={r.condition}
                  onChange={(v) => update(idx, "condition", v)}
                  options={[
                    "New",
                    "Excellent",
                    "Good",
                    "Fair",
                    "Poor",
                    "Damaged",
                    "Unusable",
                  ]}
                />
                <SelectField
                  label="Status"
                  value={r.status}
                  onChange={(v) => update(idx, "status", v)}
                  options={[
                    "Available",
                    "Assigned",
                    "In Repair",
                    "Damaged",
                    "Lost",
                    "Disposed",
                    "Reserved",
                  ]}
                />
                <InputField
                  label="Warranty Expiry"
                  value={r.warrantyExpiry}
                  onChange={(v) => update(idx, "warrantyExpiry", v)}
                  type="date"
                />
                <div className="md:col-span-3">
                  <TextAreaField
                    label="Notes"
                    value={r.notes}
                    onChange={(v) => update(idx, "notes", v)}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
export function AssetCreatePage() {
  return <AssetFormPage />;
}
export function AssetEditPage() {
  const params = useParams();
  return <AssetFormPage id={String(params.id)} />;
}
export function AssetImportPage() {
  return (
    <ImportPlaceholder
      title="Bulk Asset Import"
      templateUrl={assetflowService.assetTemplateUrl()}
      columns={[
        "assetCode",
        "name",
        "categoryId",
        "brand",
        "model",
        "serialNumber",
        "assetTag",
        "purchaseDate",
        "purchasePrice",
        "warrantyExpiry",
      ]}
    />
  );
}

export function AssetDetailPage({ id }: { id: string }) {
  useAuthGuard();
  const [asset, setAsset] = useState<AnyObj | null>(null);
  const [qr, setQr] = useState("");
  useEffect(() => {
    assetflowService.asset(id).then((r) => setAsset(r.data.data));
    assetflowService
      .assetQr(id)
      .then((r) => setQr(r.data.data.qr))
      .catch(() => null);
  }, [id]);
  if (!asset)
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Loading asset...
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title={asset.name}
        description={`${asset.assetCode} / ${asset.serialNumber}`}
        actions={
          <>
            <BackButton fallback="/assets" />
            <Button asChild>
              <Link href={`/assets/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Asset Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5 md:grid-cols-3">
            <Field label="Status" value={asset.status} />
            <Field label="Condition" value={asset.condition} />
            <Field label="Category" value={asset.category?.name} />
            <Field label="Brand" value={asset.brand} />
            <Field label="Model" value={asset.model} />
            <Field label="Location" value={asset.location?.name} />
            <Field
              label="Assigned Employee"
              value={asset.assignedEmployee?.name}
            />
            <Field
              label="Purchase Price"
              value={money.format(Number(asset.purchasePrice || 0))}
            />
            <Field
              label="Current Value"
              value={money.format(Number(asset.currentValue || 0))}
            />
            <Field label="Warranty Expiry" value={asset.warrantyExpiry} />
            <Field label="Depreciation" value={asset.depreciationMethod} />
            <Field
              label="Useful Life"
              value={`${asset.usefulLifeYears} years`}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>QR Label</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {qr ? (
              <img
                src={qr}
                alt="QR Code"
                className="mx-auto h-44 w-44 rounded-xl border p-2"
              />
            ) : (
              <QrCode className="mx-auto h-28 w-28 text-muted-foreground" />
            )}
            <Button
              className="mt-4 w-full"
              variant="outline"
              onClick={() => window.print()}
            >
              Print QR
            </Button>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Lifecycle History</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Assignment, return and repair history will appear here from linked
              backend records.
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="finance">
          <Card>
            <CardContent className="p-6">
              Book value: <b>{money.format(Number(asset.currentValue || 0))}</b>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit">
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Audit snapshots available in Audit Logs module.
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmployeeCompanySelector({
  companies,
  value,
  onChange,
}: {
  companies: AnyObj[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-2 md:col-span-3">
      <Label>Companies</Label>
      <div className="grid gap-2 rounded-2xl border bg-muted/20 p-3 md:grid-cols-3">
        {companies.map((c) => (
          <label
            key={c.id}
            className="flex cursor-pointer items-center gap-2 rounded-xl border bg-background p-2 text-sm"
          >
            <Checkbox
              checked={value.includes(c.id)}
              onCheckedChange={() =>
                onChange(
                  value.includes(c.id)
                    ? value.filter((x) => x !== c.id)
                    : [...value, c.id],
                )
              }
            />
            <span>{c.code ? `${c.code} - ${c.name}` : c.name}</span>
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        An employee can belong to multiple companies, e.g. PRAN, RFL and Best
        Buy.
      </p>
    </div>
  );
}
function EmployeeFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    companyIds: [],
    employeeCode: `EMP-${Date.now().toString().slice(-4)}`,
    name: "",
    email: "",
    phone: "",
    designation: "",
    departmentId: "",
    locationId: "",
    joiningDate: new Date().toISOString().slice(0, 10),
    status: "Active",
    clearanceStatus: "Clear",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (id)
      assetflowService
        .employee(id)
        .then((r) =>
          setF({
            ...r.data.data,
            companyIds: (r.data.data.companies || []).map((c: AnyObj) => c.id),
            departmentId:
              r.data.data.departmentId || r.data.data.Department?.id,
            locationId: r.data.data.locationId || r.data.data.Location?.id,
          }),
        );
  }, [id]);
  useEffect(() => {
    setF((x) => ({
      ...x,
      companyIds: x.companyIds?.length
        ? x.companyIds
        : options.companies[0]?.id
          ? [options.companies[0].id]
          : [],
      departmentId: x.departmentId || options.departments[0]?.id || "",
      locationId: x.locationId || options.locations[0]?.id || "",
    }));
  }, [
    options.companies.length,
    options.departments.length,
    options.locations.length,
  ]);
  useEffect(() => {
    setF((x) => ({
      ...x,
      companyId: x.companyId || options.companies[0]?.id || "",
    }));
  }, [options.companies.length]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try {
      setSaving(true);
      if (id) await assetflowService.updateEmployee(id, f);
      else await assetflowService.createEmployee(f);
      toast.success("Employee saved");
      router.push("/employees");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <FormShell
      title={id ? "Edit Employee" : "Create Employee"}
      description="Employees can be mapped to one or multiple companies for company-wise assignment."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <EmployeeCompanySelector
          companies={options.companies}
          value={f.companyIds || []}
          onChange={(v) => set("companyIds", v)}
        />
        <InputField
          label="Employee ID"
          value={f.employeeCode}
          onChange={(v) => set("employeeCode", v)}
        />
        <InputField
          label="Name"
          value={f.name}
          onChange={(v) => set("name", v)}
        />
        <InputField
          label="Email"
          value={f.email}
          onChange={(v) => set("email", v)}
        />
        <InputField
          label="Phone"
          value={f.phone}
          onChange={(v) => set("phone", v)}
        />
        <InputField
          label="Designation"
          value={f.designation}
          onChange={(v) => set("designation", v)}
        />
        <SelectIdField
          label="Department"
          value={f.departmentId}
          onChange={(v) => set("departmentId", v)}
          items={options.departments}
        />
        <SelectIdField
          label="Location"
          value={f.locationId}
          onChange={(v) => set("locationId", v)}
          items={options.locations}
        />
        <InputField
          label="Joining Date"
          value={f.joiningDate}
          onChange={(v) => set("joiningDate", v)}
          type="date"
        />
        <SelectField
          label="Status"
          value={f.status}
          onChange={(v) => set("status", v)}
          options={["Active", "Resigned", "Terminated", "Inactive"]}
        />
      </div>
    </FormShell>
  );
}
export function EmployeesPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.employees);
  const remove = async (id: string) => {
    if (!confirm("Delete this employee?")) return;
    await assetflowService.deleteEmployee(id);
    toast.success("Employee deleted");
    list.refresh();
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Employees"
        description="Company-wise employee profiles for assignments, returns and clearance."
        actions={
          <PermissionAction permission="employees.create">
            <Button asChild>
              <Link href="/employees/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/employees/create"
            onCsv={() => toast.info("Employee CSV export coming next")}
            onPdf={() => downloadFile("/exports/employees.pdf", "assetflow-employees-report.html")}
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
          </Toolbar>
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Employee</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Designation</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Clearance</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={7} />
            ) : list.items.length ? (
              list.items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    <div className="font-medium">{e.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {e.employeeCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(e.companies || [])
                      .map((c: AnyObj) => c.code || c.name)
                      .join(", ") || "-"}
                  </TableCell>
                  <TableCell>{e.email}</TableCell>
                  <TableCell>{e.designation}</TableCell>
                  <TableCell>
                    <StatusBadge status={e.status} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={e.clearanceStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/employees/${e.id}`}
                      edit={`/employees/${e.id}/edit`}
                      onDelete={() => remove(e.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={7} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function EmployeeCreatePage() {
  return <EmployeeFormPage />;
}
export function EmployeeEditPage() {
  const params = useParams();
  return <EmployeeFormPage id={String(params.id)} />;
}
export function EmployeeDetailPage({ id }: { id: string }) {
  useAuthGuard();
  const [emp, setEmp] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService.employee(id).then((r) => setEmp(r.data.data));
  }, [id]);
  if (!emp)
    return (
      <Card>
        <CardContent className="p-8 text-center">
          Loading employee...
        </CardContent>
      </Card>
    );
  return (
    <div className="space-y-6">
      <PageHeader
        title={emp.name}
        description={`${emp.employeeCode} / ${emp.designation}`}
        actions={
          <>
            <BackButton fallback="/employees" />
            <Button asChild>
              <Link href={`/employees/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field
            label="Companies"
            value={
              (emp.companies || []).map((c: AnyObj) => c.name).join(", ") || "-"
            }
          />
          <Field label="Email" value={emp.email} />
          <Field label="Phone" value={emp.phone} />
          <Field label="Status" value={emp.status} />
          <Field label="Department" value={emp.Department?.name} />
          <Field label="Location" value={emp.Location?.name} />
          <Field label="Clearance" value={emp.clearanceStatus} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Current Assets & Clearance</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Use Returns & Clearance module to retrieve all active assigned assets
          and complete employee clearance.
        </CardContent>
      </Card>
    </div>
  );
}

function VendorFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    companyId: "",
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    if (id)
      assetflowService
        .vendor(id)
        .then((r) =>
          setF({
            ...r.data.data,
            companyId: r.data.data.companyId || r.data.data.company?.id || "",
          }),
        );
  }, [id]);
  useEffect(() => {
    setF((x) => ({
      ...x,
      companyId: x.companyId || options.companies[0]?.id || "",
    }));
  }, [options.companies.length]);
  const set = (k: string, v: any) => setF((x) => ({ ...x, [k]: v }));
  const save = async () => {
    try {
      setSaving(true);
      if (id) await assetflowService.updateVendor(id, f);
      else await assetflowService.createVendor(f);
      toast.success("Vendor saved");
      router.push("/vendors");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <FormShell
      title={id ? "Edit Vendor" : "Create Vendor"}
      description="Vendor information for purchase and warranty support."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectIdField
          label="Company"
          value={f.companyId}
          onChange={(v) => set("companyId", v)}
          items={options.companies}
        />
        <InputField
          label="Vendor Name"
          value={f.name}
          onChange={(v) => set("name", v)}
        />
        <InputField
          label="Contact Person"
          value={f.contactPerson}
          onChange={(v) => set("contactPerson", v)}
        />
        <InputField
          label="Phone"
          value={f.phone}
          onChange={(v) => set("phone", v)}
        />
        <InputField
          label="Email"
          value={f.email}
          onChange={(v) => set("email", v)}
        />
        <SelectField
          label="Status"
          value={f.status}
          onChange={(v) => set("status", v)}
          options={["Active", "Inactive"]}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Address"
            value={f.address}
            onChange={(v) => set("address", v)}
          />
        </div>
      </div>
    </FormShell>
  );
}
export function VendorsPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.vendors);
  const remove = async (id: string) => {
    if (!confirm("Delete this vendor?")) return;
    await assetflowService.deleteVendor(id);
    toast.success("Vendor deleted");
    list.refresh();
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Vendors"
        description="Supplier and warranty support directory."
        actions={
          <PermissionAction permission="vendors.create">
            <Button asChild>
              <Link href="/vendors/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Vendor
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/vendors/create"
            onCsv={() => toast.info("Vendor CSV export coming next")}
            onPdf={() => downloadFile("/exports/vendors.pdf", "assetflow-vendors-report.html")}
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
          </Toolbar>
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : list.items.length ? (
              list.items.map((v) => (
                <TableRow key={v.id}>
                  <TableCell>
                    {v.company?.code || v.company?.name || "-"}
                  </TableCell>
                  <TableCell className="font-medium">{v.name}</TableCell>
                  <TableCell>{v.contactPerson || "-"}</TableCell>
                  <TableCell>{v.phone || "-"}</TableCell>
                  <TableCell>{v.email || "-"}</TableCell>
                  <TableCell>
                    <StatusBadge status={v.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      edit={`/vendors/${v.id}/edit`}
                      onDelete={() => remove(v.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={6} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function VendorCreatePage() {
  return <VendorFormPage />;
}
export function VendorEditPage() {
  const params = useParams();
  return <VendorFormPage id={String(params.id)} />;
}

export function AssignmentsPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.assignments);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Assignments"
        description="Company-aware handover tracking from stock to employee."
        actions={
          <PermissionAction permission="assignments.create">
            <Button asChild>
              <Link href="/assignments/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Assignment
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/assignments/create"
            onCsv={() => toast.info("Assignment export coming next")}
            onPdf={() => downloadFile("/exports/assignments.pdf", "assetflow-assignments-report.html")}
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
          </Toolbar>
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Assigned At</TableHead>
              <TableHead>Returned</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : list.items.length ? (
              list.items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>
                    {x.Asset?.company?.code || x.Asset?.company?.name || "-"}
                  </TableCell>
                  <TableCell>{x.Asset?.assetCode || x.assetId}</TableCell>
                  <TableCell>
                    {x.Employee
                      ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                      : x.employeeId}
                  </TableCell>
                  <TableCell>{x.conditionAtAssign}</TableCell>
                  <TableCell>
                    {x.assignedAt
                      ? new Date(x.assignedAt).toLocaleString()
                      : "-"}
                  </TableCell>
                  <TableCell>{x.returnedAt ? "Yes" : "No"}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/assignments/${x.id}`}>
                            <Eye className="mr-2 h-4 w-4" />View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/assignments/${x.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadFile(`/assignments/${x.id}/pdf`, `assignment-${x.id}.html`)}>
                          <FileBarChart className="mr-2 h-4 w-4" />PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          if (!confirm("Delete this assignment?")) return;
                          await assetflowService.deleteAssignment(x.id);
                          toast.success("Assignment deleted");
                          list.refresh();
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={7} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function AssignmentCreatePage() {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState<AnyObj[]>([]);
  const [assets, setAssets] = useState<AnyObj[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [assetIds, setAssetIds] = useState<string[]>([]);
  const [condition, setCondition] = useState("Good");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setCompanyId((v) => v || options.companies[0]?.id || "");
  }, [options.companies.length]);
  useEffect(() => {
    if (!companyId) return;
    setEmployeeId("");
    setAssetIds([]);
    assetflowService
      .employees({ limit: 500, companyId })
      .then((r) => setEmployees(r.data.data || []));
    assetflowService
      .assets({ limit: 500, companyId, status: "Available" })
      .then((r) => setAssets(r.data.data || []));
  }, [companyId]);
  const toggle = (id: string) =>
    setAssetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  const save = async () => {
    try {
      setSaving(true);
      await assetflowService.createAssignment({
        companyId,
        employeeId,
        assetIds,
        conditionAtAssign: condition,
        notes,
      });
      toast.success("Assets assigned successfully");
      router.push("/assignments");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Assignment failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <FormShell
      title="Create Assignment"
      description="First select company, then employees and available assets are filtered automatically."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4">
          <SelectIdField
            label="Company"
            value={companyId}
            onChange={setCompanyId}
            items={options.companies}
          />
          <SelectIdField
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            items={employees}
            labelKey="employee"
          />
          <SelectField
            label="Condition at Assignment"
            value={condition}
            onChange={setCondition}
            options={["New", "Excellent", "Good", "Fair"]}
          />
          <TextAreaField label="Notes" value={notes} onChange={setNotes} />
        </div>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Available Assets</CardTitle>
          </CardHeader>
          <CardContent className="max-h-[420px] space-y-2 overflow-auto">
            {assets.length ? (
              assets.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-3 rounded-xl border p-3 hover:bg-muted/50"
                >
                  <Checkbox
                    checked={assetIds.includes(a.id)}
                    onCheckedChange={() => toggle(a.id)}
                  />
                  <span className="flex-1">
                    <b>{a.assetCode}</b> - {a.name}
                    <span className="block text-xs text-muted-foreground">
                      {a.serialNumber}
                    </span>
                  </span>
                  <StatusBadge status={a.status} />
                </label>
              ))
            ) : (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No available assets for selected company.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </FormShell>
  );
}

export function ReturnsPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.returns);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Returns & Clearance"
        description="Receive assets back and update employee clearance by company."
        actions={
          <PermissionAction permission="returns.create">
            <Button asChild>
              <Link href="/returns/create">
              <Undo2 className="mr-2 h-4 w-4" />
              Process Return
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/returns/create"
            onCsv={() => toast.info("Return export coming next")}
            onPdf={() => downloadFile("/exports/returns.pdf", "assetflow-returns-report.html")}
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
          </Toolbar>
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Condition</TableHead>
              <TableHead>Penalty</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : list.items.length ? (
              list.items.map((x) => (
                <TableRow key={x.id}>
                  <TableCell>
                    {x.Asset?.company?.code || x.Asset?.company?.name || "-"}
                  </TableCell>
                  <TableCell>{x.Asset?.assetCode || x.assetId}</TableCell>
                  <TableCell>
                    {x.Employee
                      ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                      : x.employeeId}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={x.returnStatus} />
                  </TableCell>
                  <TableCell>{x.returnCondition}</TableCell>
                  <TableCell>
                    {money.format(Number(x.penaltyAmount || 0))}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/returns/${x.id}`}>
                            <Eye className="mr-2 h-4 w-4" />View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/returns/${x.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" />Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => downloadFile(`/returns/${x.id}/pdf`, `return-${x.id}.html`)}>
                          <FileBarChart className="mr-2 h-4 w-4" />PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={async () => {
                          if (!confirm("Delete this return record?")) return;
                          await assetflowService.deleteReturn(x.id);
                          toast.success("Return record deleted");
                          list.refresh();
                        }}>
                          <Trash2 className="mr-2 h-4 w-4" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={6} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function ReturnCreatePage() {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [companyId, setCompanyId] = useState("");
  const [employees, setEmployees] = useState<AnyObj[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [open, setOpen] = useState<AnyObj[]>([]);
  const [selected, setSelected] = useState<Record<string, AnyObj>>({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    setCompanyId((v) => v || options.companies[0]?.id || "");
  }, [options.companies.length]);
  useEffect(() => {
    if (!companyId) return;
    setEmployeeId("");
    setOpen([]);
    setSelected({});
    assetflowService
      .employees({ limit: 500, companyId })
      .then((r) => setEmployees(r.data.data || []));
  }, [companyId]);
  useEffect(() => {
    if (employeeId)
      assetflowService
        .openEmployeeAssignments(employeeId, { companyId })
        .then((r) => setOpen(r.data.data || []));
  }, [employeeId, companyId]);
  const update = (assetId: string, data: AnyObj) =>
    setSelected((prev) => ({
      ...prev,
      [assetId]: { ...prev[assetId], ...data },
    }));
  const save = async () => {
    try {
      setSaving(true);
      const items = Object.entries(selected)
        .filter(([, v]) => v.checked)
        .map(([assetId, v]) => ({
          assetId,
          assignmentId: v.assignmentId,
          returnStatus: v.returnStatus || "Returned",
          returnCondition: v.returnCondition || "Good",
          penaltyAmount: Number(v.penaltyAmount || 0),
          notes: v.notes || "",
        }));
      await assetflowService.createReturn({ companyId, employeeId, items });
      toast.success("Return processed successfully");
      router.push("/returns");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Return failed");
    } finally {
      setSaving(false);
    }
  };
  return (
    <FormShell
      title="Process Return / Clearance"
      description="Select company and employee, then check returned assets one by one."
      onSave={save}
      saving={saving}
    >
      <div className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <SelectIdField
            label="Company"
            value={companyId}
            onChange={setCompanyId}
            items={options.companies}
          />
          <SelectIdField
            label="Employee"
            value={employeeId}
            onChange={setEmployeeId}
            items={employees}
            labelKey="employee"
          />
        </div>
        <div className="rounded-2xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Returned</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead>Return Status</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Penalty</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {open.length ? (
                open.map((a) => {
                  const asset = a.Asset || {};
                  const v = selected[asset.id] || {};
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <Checkbox
                          checked={!!v.checked}
                          onCheckedChange={(checked) =>
                            update(asset.id, { checked, assignmentId: a.id })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <b>{asset.assetCode}</b>
                        <div className="text-xs text-muted-foreground">
                          {asset.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={v.returnStatus || "Returned"}
                          onValueChange={(x) =>
                            update(asset.id, { returnStatus: x })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Returned", "Lost"].map((x) => (
                              <SelectItem key={x} value={x}>
                                {x}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={v.returnCondition || "Good"}
                          onValueChange={(x) =>
                            update(asset.id, { returnCondition: x })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Good", "Fair", "Damaged", "Unusable"].map(
                              (x) => (
                                <SelectItem key={x} value={x}>
                                  {x}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={v.penaltyAmount || 0}
                          onChange={(e) =>
                            update(asset.id, {
                              penaltyAmount: Number(e.target.value),
                            })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={v.notes || ""}
                          onChange={(e) =>
                            update(asset.id, { notes: e.target.value })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <EmptyRows
                  colSpan={6}
                  label={
                    employeeId
                      ? "No active assigned assets for this employee/company."
                      : "Select company and employee first."
                  }
                />
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </FormShell>
  );
}


export function AssignmentDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService.assignment(id).then((r) => setData(r.data.data));
  }, [id]);
  if (!data) return <Card><CardContent className="p-8 text-center">Loading assignment...</CardContent></Card>;
  const asset = data.Asset || {};
  const employee = data.Employee || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignment Details"
        description="Asset handover record with employee and company context."
        actions={
          <>
            <BackButton fallback="/assignments" />
            <Button variant="outline" onClick={() => downloadFile(`/assignments/${id}/pdf`, `assignment-${id}.html`)}>PDF</Button>
            <Button asChild><Link href={`/assignments/${id}/edit`}>Edit</Link></Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Company" value={asset.company?.name} />
          <Field label="Asset" value={`${asset.assetCode || ""} - ${asset.name || ""}`} />
          <Field label="Serial" value={asset.serialNumber} />
          <Field label="Employee" value={`${employee.employeeCode || ""} - ${employee.name || ""}`} />
          <Field label="Condition" value={data.conditionAtAssign} />
          <Field label="Assigned At" value={data.assignedAt ? new Date(data.assignedAt).toLocaleString() : "-"} />
          <Field label="Returned At" value={data.returnedAt ? new Date(data.returnedAt).toLocaleString() : "No"} />
          <Field label="Notes" value={data.notes} />
        </CardContent>
      </Card>
    </div>
  );
}

export function AssignmentEditPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [f, setF] = useState<AnyObj>({ conditionAtAssign: "Good", notes: "" });
  useEffect(() => {
    assetflowService.assignment(id).then((r) => setF({
      conditionAtAssign: r.data.data.conditionAtAssign || "Good",
      notes: r.data.data.notes || "",
    }));
  }, [id]);
  const save = async () => {
    await assetflowService.updateAssignment(id, f);
    toast.success("Assignment updated");
    router.push("/assignments");
  };
  return (
    <FormShell title="Edit Assignment" description="Update handover condition and notes." onSave={save}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Condition" value={f.conditionAtAssign} onChange={(v) => setF({ ...f, conditionAtAssign: v })} options={["New", "Excellent", "Good", "Fair", "Poor", "Damaged"]} />
        <div className="md:col-span-2"><TextAreaField label="Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} /></div>
      </div>
    </FormShell>
  );
}

export function ReturnDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService.returnRecord(id).then((r) => setData(r.data.data));
  }, [id]);
  if (!data) return <Card><CardContent className="p-8 text-center">Loading return...</CardContent></Card>;
  const asset = data.Asset || {};
  const employee = data.Employee || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Return / Clearance Details"
        description="Returned asset record with condition, penalty, and employee context."
        actions={
          <>
            <BackButton fallback="/returns" />
            <Button variant="outline" onClick={() => downloadFile(`/returns/${id}/pdf`, `return-${id}.html`)}>PDF</Button>
            <Button asChild><Link href={`/returns/${id}/edit`}>Edit</Link></Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Company" value={asset.company?.name} />
          <Field label="Asset" value={`${asset.assetCode || ""} - ${asset.name || ""}`} />
          <Field label="Employee" value={`${employee.employeeCode || ""} - ${employee.name || ""}`} />
          <Field label="Return Status" value={data.returnStatus} />
          <Field label="Return Condition" value={data.returnCondition} />
          <Field label="Penalty" value={money.format(Number(data.penaltyAmount || 0))} />
          <Field label="Notes" value={data.notes} />
        </CardContent>
      </Card>
    </div>
  );
}

export function ReturnEditPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [f, setF] = useState<AnyObj>({ returnStatus: "Returned", returnCondition: "Good", penaltyAmount: 0, notes: "" });
  useEffect(() => {
    assetflowService.returnRecord(id).then((r) => setF({
      returnStatus: r.data.data.returnStatus || "Returned",
      returnCondition: r.data.data.returnCondition || "Good",
      penaltyAmount: Number(r.data.data.penaltyAmount || 0),
      notes: r.data.data.notes || "",
    }));
  }, [id]);
  const save = async () => {
    await assetflowService.updateReturn(id, { ...f, penaltyAmount: Number(f.penaltyAmount || 0) });
    toast.success("Return updated");
    router.push("/returns");
  };
  return (
    <FormShell title="Edit Return" description="Update return status, condition, penalty and notes." onSave={save}>
      <div className="grid gap-4 md:grid-cols-2">
        <SelectField label="Return Status" value={f.returnStatus} onChange={(v) => setF({ ...f, returnStatus: v })} options={["Returned", "Lost"]} />
        <SelectField label="Return Condition" value={f.returnCondition} onChange={(v) => setF({ ...f, returnCondition: v })} options={["Good", "Fair", "Damaged", "Unusable"]} />
        <NumberField label="Penalty Amount" value={f.penaltyAmount} onChange={(v) => setF({ ...f, penaltyAmount: v })} />
        <div className="md:col-span-2"><TextAreaField label="Notes" value={f.notes} onChange={(v) => setF({ ...f, notes: v })} /></div>
      </div>
    </FormShell>
  );
}

export function RepairDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService.repair(id).then((r) => setData(r.data.data));
  }, [id]);
  if (!data) return <Card><CardContent className="p-8 text-center">Loading repair...</CardContent></Card>;
  const asset = data.Asset || {};
  const vendor = data.Vendor || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair / Upgrade Details"
        description="Repair, warranty claim or upgrade record."
        actions={
          <>
            <BackButton fallback="/repairs" />
            <Button variant="outline" onClick={() => downloadFile(`/repairs/${id}/pdf`, `repair-${id}.html`)}>PDF</Button>
            <Button asChild><Link href={`/repairs/${id}/edit`}>Edit</Link></Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Ticket" value={data.ticketCode} />
          <Field label="Asset" value={`${asset.assetCode || ""} - ${asset.name || ""}`} />
          <Field label="Vendor" value={vendor.name} />
          <Field label="Cost" value={money.format(Number(data.repairCost || 0))} />
          <Field label="Status" value={data.status} />
          <Field label="Problem / Upgrade" value={data.problem} />
        </CardContent>
      </Card>
    </div>
  );
}

export function RepairEditPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [assets, setAssets] = useState<AnyObj[]>([]);
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({ ticketCode: "", assetId: "", problem: "", repairVendorId: "", repairCost: 0, status: "Open" });
  useEffect(() => {
    assetflowService.assets({ limit: 200 }).then((r) => setAssets(r.data.data || []));
    assetflowService.repair(id).then((r) => setF({
      ticketCode: r.data.data.ticketCode || "",
      assetId: r.data.data.assetId || r.data.data.Asset?.id || "",
      problem: r.data.data.problem || "",
      repairVendorId: r.data.data.repairVendorId || r.data.data.Vendor?.id || "",
      repairCost: Number(r.data.data.repairCost || 0),
      status: r.data.data.status || "Open",
    }));
  }, [id]);
  const save = async () => {
    await assetflowService.updateRepair(id, { ...f, repairCost: Number(f.repairCost || 0), repairVendorId: f.repairVendorId || null });
    toast.success("Repair ticket updated");
    router.push("/repairs");
  };
  return (
    <FormShell title="Edit Repair / Upgrade Ticket" description="Update repair, warranty claim or upgrade record." onSave={save}>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Ticket Code" value={f.ticketCode} onChange={(v) => setF({ ...f, ticketCode: v })} />
        <SelectIdField label="Asset" value={f.assetId} onChange={(v) => setF({ ...f, assetId: v })} items={assets} labelKey="asset" />
        <SelectIdField label="Repair Vendor" value={f.repairVendorId} onChange={(v) => setF({ ...f, repairVendorId: v })} items={options.vendors} />
        <NumberField label="Repair Cost" value={f.repairCost} onChange={(v) => setF({ ...f, repairCost: v })} />
        <SelectField label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["Open", "Diagnosed", "Sent to Vendor", "Under Repair", "Waiting for Parts", "Completed", "Returned", "Cancelled"]} />
        <div className="md:col-span-2"><TextAreaField label="Problem / Upgrade Details" value={f.problem} onChange={(v) => setF({ ...f, problem: v })} /></div>
      </div>
    </FormShell>
  );
}

export function ScannerPage() {
  useAuthGuard();
  const [q, setQ] = useState("");
  const [r, setR] = useState<AnyObj | null>(null);
  const search = async () => {
    try {
      const res = await assetflowService.scannerSearch(q);
      setR(res.data.data);
      toast.success("Asset found");
    } catch (e: any) {
      setR(null);
      toast.error(e.response?.data?.message || "Asset not found");
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="QR & Barcode Scanner"
        description="Manual search works now; browser camera integration can be added next."
        actions={
          <Button variant="outline">
            <ScanLine className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-3xl border border-dashed p-12">
              <QrCode className="mx-auto h-20 w-20 text-muted-foreground" />
              <p className="mt-4 font-medium">Camera scanner placeholder</p>
              <p className="text-sm text-muted-foreground">
                Use manual search by asset code, serial number or asset tag.
              </p>
            </div>
            <div className="flex w-full max-w-lg gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Asset code / serial / tag"
              />
              <Button onClick={search}>Search</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {r ? (
              <>
                <StatusBadge status={r.status} />
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {r.assetCode} / {r.serialNumber}
                </p>
                <p className="text-sm">
                  Assigned: {r.assignedEmployee?.name || "Not assigned"}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/assets/${r.id}`}>Open Asset</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Search an asset.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PurchasesPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.purchases);

  const remove = async (id: string) => {
    if (!confirm("Delete this purchase?")) return;
    await assetflowService.deletePurchase(id);
    toast.success("Purchase deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Management"
        description="Company-wise invoice and purchase records with view, edit, delete and printable PDF actions."
        actions={
          <PermissionAction permission="purchases.create">
            <Button asChild>
              <Link href="/purchases/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Purchase
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/purchases/create"
            onCsv={() => toast.info("Purchase CSV export coming next")}
            onPdf={() => downloadFile("/exports/purchases.pdf", "assetflow-purchases-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={7} />
            ) : list.items.length ? (
              list.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.company?.code || p.company?.name || "-"}</TableCell>
                  <TableCell className="font-medium">{p.invoiceNumber}</TableCell>
                  <TableCell>{p.Vendor?.name || p.vendor?.name || "-"}</TableCell>
                  <TableCell>{p.purchaseDate}</TableCell>
                  <TableCell>{money.format(Number(p.totalAmount || 0))}</TableCell>
                  <TableCell><StatusBadge status={p.paymentStatus} /></TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/purchases/${p.id}`}
                      edit={`/purchases/${p.id}/edit`}
                      pdfPath={`/purchases/${p.id}/pdf`}
                      pdfName={`purchase-${p.invoiceNumber || p.id}.html`}
                      onDelete={() => remove(p.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={7} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}

function PurchaseFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    companyId: "",
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    vendorId: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    totalAmount: 0,
    paymentStatus: "Paid",
  });

  useEffect(() => {
    if (!id) return;
    assetflowService.purchase(id).then((res) => {
      const item = res.data.data || {};
      setF({
        companyId: item.companyId || item.company?.id || "",
        invoiceNumber: item.invoiceNumber || "",
        vendorId: item.vendorId || item.Vendor?.id || "",
        purchaseDate: item.purchaseDate || new Date().toISOString().slice(0, 10),
        totalAmount: Number(item.totalAmount || 0),
        paymentStatus: item.paymentStatus || "Paid",
      });
    });
  }, [id]);

  useEffect(() => {
    setF((x) => ({
      ...x,
      companyId: x.companyId || options.companies[0]?.id || "",
      vendorId: x.vendorId || options.vendors[0]?.id || "",
    }));
  }, [options.companies.length, options.vendors.length]);

  const save = async () => {
    const payload = { ...f, totalAmount: Number(f.totalAmount || 0) };
    if (id) await assetflowService.updatePurchase(id, payload);
    else await assetflowService.createPurchase(payload);
    toast.success(id ? "Purchase updated" : "Purchase created");
    router.push("/purchases");
  };

  return (
    <FormShell
      title={id ? "Edit Purchase" : "Create Purchase"}
      description="Record vendor invoice and payment status. Purchase-to-asset generation comes next."
      onSave={save}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectIdField label="Company" value={f.companyId} onChange={(v) => setF({ ...f, companyId: v })} items={options.companies} />
        <InputField label="Invoice Number" value={f.invoiceNumber} onChange={(v) => setF({ ...f, invoiceNumber: v })} />
        <SelectIdField label="Vendor" value={f.vendorId} onChange={(v) => setF({ ...f, vendorId: v })} items={options.vendors.filter((v) => !f.companyId || v.companyId === f.companyId)} />
        <InputField label="Purchase Date" value={f.purchaseDate} onChange={(v) => setF({ ...f, purchaseDate: v })} type="date" />
        <NumberField label="Total Amount" value={f.totalAmount} onChange={(v) => setF({ ...f, totalAmount: v })} />
        <SelectField label="Payment Status" value={f.paymentStatus} onChange={(v) => setF({ ...f, paymentStatus: v })} options={["Paid", "Pending", "Partial"]} />
      </div>
    </FormShell>
  );
}

export function PurchaseCreatePage() {
  return <PurchaseFormPage />;
}

export function PurchaseEditPage() {
  const params = useParams();
  return <PurchaseFormPage id={String(params.id)} />;
}

export function PurchaseDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [item, setItem] = useState<AnyObj | null>(null);

  useEffect(() => {
    assetflowService.purchase(id).then((res) => setItem(res.data.data));
  }, [id]);

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading purchase...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase ${item.invoiceNumber}`}
        description="Vendor invoice and payment information."
        actions={
          <>
            <BackButton fallback="/purchases" />
            <Button variant="outline" onClick={() => downloadFile(`/purchases/${id}/pdf`, `purchase-${item.invoiceNumber}.html`)}>
              <FileBarChart className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild>
              <Link href={`/purchases/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Company" value={item.company?.name || item.Company?.name} />
          <Field label="Invoice" value={item.invoiceNumber} />
          <Field label="Vendor" value={item.Vendor?.name || item.vendor?.name} />
          <Field label="Purchase Date" value={item.purchaseDate} />
          <Field label="Total Amount" value={money.format(Number(item.totalAmount || 0))} />
          <Field label="Payment Status" value={item.paymentStatus} />
        </CardContent>
      </Card>
    </div>
  );
}

export function RepairsPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.repairs);

  const remove = async (id: string) => {
    if (!confirm("Delete this repair ticket?")) return;
    await assetflowService.deleteRepair(id);
    toast.success("Repair ticket deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair & Upgrade"
        description="Repair tickets, warranty claims, and upgrade tracking with actions and PDF export."
        actions={
          <PermissionAction permission="repairs.create">
            <Button asChild>
              <Link href="/repairs/create">
              <Plus className="mr-2 h-4 w-4" />
              Add New
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/repairs/create"
            onCsv={() => toast.info("Repair CSV export coming next")}
            onPdf={() => downloadFile("/exports/repairs.pdf", "assetflow-repairs-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Problem / Upgrade</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : list.items.length ? (
              list.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.ticketCode}</TableCell>
                  <TableCell>{r.Asset ? `${r.Asset.assetCode} - ${r.Asset.name}` : r.assetId}</TableCell>
                  <TableCell>{r.problem}</TableCell>
                  <TableCell>{money.format(Number(r.repairCost || 0))}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/repairs/${r.id}`}
                      edit={`/repairs/${r.id}/edit`}
                      pdfPath={`/repairs/${r.id}/pdf`}
                      pdfName={`repair-${r.id}.html`}
                      onDelete={() => remove(r.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={6} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function RepairCreatePage() {
  useAuthGuard();
  const router = useRouter();
  const [assets, setAssets] = useState<AnyObj[]>([]);
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    ticketCode: `RPR-${Date.now().toString().slice(-5)}`,
    assetId: "",
    problem: "",
    repairVendorId: "",
    repairCost: 0,
    status: "Open",
  });
  useEffect(() => {
    assetflowService
      .assets({ limit: 200 })
      .then((r) => setAssets(r.data.data || []));
  }, []);
  const save = async () => {
    await assetflowService.createRepair({
      ...f,
      repairCost: Number(f.repairCost || 0),
      repairVendorId: f.repairVendorId || null,
    });
    toast.success("Repair ticket created");
    router.push("/repairs");
  };
  return (
    <FormShell
      title="Create Repair / Upgrade Ticket"
      description="Track repair, maintenance or upgrade costs."
      onSave={save}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Ticket Code"
          value={f.ticketCode}
          onChange={(v) => setF({ ...f, ticketCode: v })}
        />
        <SelectIdField
          label="Asset"
          value={f.assetId}
          onChange={(v) => setF({ ...f, assetId: v })}
          items={assets}
          labelKey="asset"
        />
        <SelectIdField
          label="Repair Vendor"
          value={f.repairVendorId}
          onChange={(v) => setF({ ...f, repairVendorId: v })}
          items={options.vendors}
        />
        <NumberField
          label="Repair Cost"
          value={f.repairCost}
          onChange={(v) => setF({ ...f, repairCost: v })}
        />
        <SelectField
          label="Status"
          value={f.status}
          onChange={(v) => setF({ ...f, status: v })}
          options={[
            "Open",
            "Diagnosed",
            "Sent to Vendor",
            "Under Repair",
            "Waiting for Parts",
            "Completed",
            "Returned",
            "Cancelled",
          ]}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Problem / Upgrade Details"
            value={f.problem}
            onChange={(v) => setF({ ...f, problem: v })}
          />
        </div>
      </div>
    </FormShell>
  );
}

function SimpleList({
  title,
  description,
  list,
  columns,
  createHref,
}: {
  title: string;
  description: string;
  list: any;
  columns: string[];
  createHref?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          createHref && (
            <Button asChild>
              <Link href={createHref}>
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Link>
            </Button>
          )
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref={createHref}
            onCsv={() => toast.info("CSV export coming next")}
            onPdf={() => downloadFile("/exports/repairs.pdf", "assetflow-repairs-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={columns.length} />
            ) : list.items.length ? (
              list.items.map((i: AnyObj) => (
                <TableRow key={i.id}>
                  {columns.map((c) => (
                    <TableCell key={c}>{String(i[c] ?? "-")}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={columns.length} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}

export function FinancePage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.reportDepreciation);
  const purchase = list.items.reduce(
    (s, a) => s + Number(a.purchasePrice || 0),
    0,
  );
  const current = list.items.reduce(
    (s, a) => s + Number(a.currentValue || 0),
    0,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Depreciation & Finance"
        description="Company-wise book value, depreciation and full asset finance history."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Purchase Value"
          value={money.format(purchase)}
          icon={Wallet}
        />
        <StatCard
          label="Current Book Value"
          value={money.format(current)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Accumulated Depreciation"
          value={money.format(purchase - current)}
          icon={Wallet}
          tone="warning"
        />
      </div>
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            onCsv={() =>
              downloadFile(
                "/exports/assets.csv",
                "assetflow-finance-assets.csv",
              )
            }
            onPdf={() =>
              downloadFile(
                "/exports/finance.pdf",
                "assetflow-finance-report.html",
              )
            }
          >
            <CompanyFilter
              value={list.filters.companyId}
              onChange={(companyId) =>
                list.setFilters((f: AnyObj) => ({ ...f, companyId }))
              }
              companies={options.companies}
            />
          </Toolbar>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Useful Life</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={8} />
            ) : (
              list.items.map((a) => (
                <TableRow key={a.id || a.assetCode}>
                  <TableCell>
                    {a.company?.code || a.company?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {a.name}
                    <div className="text-xs text-muted-foreground">
                      {a.assetCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.assignedEmployee
                      ? `${a.assignedEmployee.employeeCode || ""} - ${a.assignedEmployee.name}`
                      : "-"}
                  </TableCell>
                  <TableCell>{a.depreciationMethod}</TableCell>
                  <TableCell>{a.usefulLifeYears} years</TableCell>
                  <TableCell>
                    {money.format(Number(a.purchasePrice || 0))}
                  </TableCell>
                  <TableCell>
                    {money.format(Number(a.currentValue || 0))}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/finance/assets/${a.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function FinanceAssetHistoryPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService
      .assetFinanceHistory(id)
      .then((r) => setData(r.data.data))
      .catch((e) =>
        toast.error(e.response?.data?.message || "History load failed"),
      );
  }, [id]);
  if (!data)
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Loading finance history...
        </CardContent>
      </Card>
    );
  const asset = data.asset || {};
  const finance = data.finance || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Finance History: ${asset.assetCode}`}
        description="Purchase, assignment, warranty, depreciation, repair and return history in one place."
        actions={
          <>
            <BackButton fallback="/finance" />
            <Button
              variant="outline"
              onClick={() =>
                downloadFile(
                  `/reports/assets/${id}/history/pdf`,
                  `assetflow-finance-history-${asset.assetCode || id}.html`,
                )
              }
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Purchase Price"
          value={money.format(Number(finance.purchasePrice || 0))}
          icon={Wallet}
        />
        <StatCard
          label="Current Value"
          value={money.format(Number(finance.currentValue || 0))}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Depreciation"
          value={money.format(Number(finance.accumulatedDepreciation || 0))}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Warranty Days Left"
          value={finance.warrantyDaysLeft ?? "N/A"}
          icon={ShieldCheck}
          tone={(finance.warrantyDaysLeft || 0) < 30 ? "destructive" : "info"}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Full History Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <Field label="Company" value={asset.company?.name} />
          <Field label="Asset" value={`${asset.assetCode} - ${asset.name}`} />
          <Field label="Serial" value={asset.serialNumber} />
          <Field label="Purchase Date" value={finance.purchaseDate} />
          <Field
            label="Useful Life"
            value={`${finance.usefulLifeYears} years`}
          />
          <Field
            label="Estimated Salvage Date"
            value={finance.estimatedSalvageDate}
          />
          <Field label="Age" value={`${finance.ageDays} days`} />
          <Field
            label="Remaining Life"
            value={`${finance.remainingLifeDays} days`}
          />
          <Field
            label="Current Employee"
            value={
              asset.assignedEmployee
                ? `${asset.assignedEmployee.employeeCode || ""} - ${asset.assignedEmployee.name}`
                : "Not assigned"
            }
          />
          <Field label="Warranty Expiry" value={asset.warrantyExpiry} />
          <Field
            label="Salvage Value"
            value={money.format(Number(asset.salvageValue || 0))}
          />
          <Field label="Depreciation Method" value={asset.depreciationMethod} />
        </CardContent>
      </Card>
      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="repairs">Repairs/Upgrades</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Returned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assignments?.length ? (
                    data.assignments.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>
                          {x.Employee
                            ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                            : x.employeeId}
                        </TableCell>
                        <TableCell>
                          {x.assignedAt
                            ? new Date(x.assignedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>{x.conditionAtAssign}</TableCell>
                        <TableCell>
                          {x.returnedAt
                            ? new Date(x.returnedAt).toLocaleString()
                            : "No"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={4} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="returns">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Penalty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.returns?.length ? (
                    data.returns.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>
                          {x.Employee
                            ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                            : x.employeeId}
                        </TableCell>
                        <TableCell>{x.returnStatus}</TableCell>
                        <TableCell>{x.returnCondition}</TableCell>
                        <TableCell>
                          {money.format(Number(x.penaltyAmount || 0))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={4} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="repairs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Problem / Upgrade</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.repairs?.length ? (
                    data.repairs.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>{x.ticketCode}</TableCell>
                        <TableCell>{x.problem}</TableCell>
                        <TableCell>
                          {x.Vendor?.name || x.repairVendorId || "-"}
                        </TableCell>
                        <TableCell>
                          {money.format(Number(x.repairCost || 0))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={x.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={5} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function ReportsPage() {
  const reports = [
    { title: "Asset Inventory Report", path: "/exports/assets.pdf" },
    { title: "Depreciation Report", path: "/exports/assets.pdf" },
    { title: "Audit Log Report", path: "/exports/audit-logs.csv" },
    { title: "Employee Asset Report", path: "" },
    { title: "Return/Clearance Report", path: "" },
    { title: "Vendor Purchase Report", path: "" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Center"
        description="Generate preview and export business reports."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filter-ready report card. PDF/CSV export is connected for core
                reports.
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Generate</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    r.path
                      ? downloadFile(
                          r.path,
                          `${r.title.replaceAll(" ", "-").toLowerCase()}.${r.path.endsWith("csv") ? "csv" : "html"}`,
                        )
                      : toast.info("This report export will be connected next.")
                  }
                >
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
export function AuditLogsPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.auditLogs);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Logs"
        description="Who did what, when, from which device. Admin/Auditor access only."
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            onCsv={() =>
              downloadFile(
                "/exports/audit-logs.csv",
                "assetflow-audit-logs.csv",
              )
            }
            onPdf={() => toast.info("Audit PDF export coming next")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Module</TableHead>
              <TableHead>Record</TableHead>
              <TableHead>IP</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : (
              list.items.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    {new Date(a.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>{a.userName}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.module}</TableCell>
                  <TableCell>{a.recordId}</TableCell>
                  <TableCell>{a.ipAddress}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function NotificationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Warranty, repair and clearance alerts."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notifications.map((n) => (
          <Card key={n.id}>
            <CardHeader>
              <CardTitle className="text-base">{n.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{n.message}</p>
              <div className="mt-4">
                <StatusBadge status={n.read ? "Cleared" : "Pending"} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
const permissionActions = ["view", "create", "update", "delete", "export"];
const permissionModuleLabels: Record<string, string> = {
  companies: "Companies",
  users: "Users",
  roles: "Roles",
  assets: "Assets",
  categories: "Categories",
  employees: "Employees",
  vendors: "Vendors",
  purchases: "Purchases",
  assignments: "Assignments",
  returns: "Returns & Clearance",
  repairs: "Repairs",
  scanner: "Scanner",
  finance: "Finance",
  reports: "Reports",
  audit_logs: "Audit Logs",
  settings: "Settings",
};

function PermissionPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (permissions: string[]) => void;
}) {
  const toggle = (permission: string) => {
    onChange(
      value.includes(permission)
        ? value.filter((item) => item !== permission)
        : [...value, permission],
    );
  };

  const selectModule = (module: string) => {
    const modulePermissions = permissionActions.map((action) => `${module}.${action}`);
    const hasAll = modulePermissions.every((permission) => value.includes(permission));
    onChange(
      hasAll
        ? value.filter((permission) => !modulePermissions.includes(permission))
        : Array.from(new Set([...value, ...modulePermissions])),
    );
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <Label>User-level permission overrides</Label>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => onChange(["*"])}>
            Full Access
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => onChange([])}>
            Role Default
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() =>
              onChange([
                "dashboard.view",
                "assets.view",
                "employees.view",
                "vendors.view",
                "purchases.view",
                "assignments.view",
                "returns.view",
                "repairs.view",
                "finance.view",
                "reports.view",
              ])
            }
          >
            Read Only
          </Button>
        </div>
      </div>
      <div className="rounded-2xl border bg-muted/20 p-3">
        <p className="mb-3 text-xs text-muted-foreground">
          If you select custom permissions here, they replace the role permissions for this user. Use Read Only for users who can view data but cannot create, edit, delete, export or access admin-only sidebars.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {permissionGroups.map((module) => (
            <div key={module} className="rounded-xl border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{permissionModuleLabels[module] || module}</p>
                <Button type="button" size="sm" variant="ghost" onClick={() => selectModule(module)}>
                  Toggle All
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {permissionActions.map((action) => {
                  const permission = `${module}.${action}`;
                  return (
                    <label key={permission} className="flex items-center gap-2 text-xs">
                      <Checkbox
                        checked={value.includes("*") || value.includes(permission)}
                        onCheckedChange={() => toggle(permission)}
                      />
                      <span className="capitalize">{action}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
          <div className="rounded-xl border bg-background p-3">
            <p className="mb-2 text-sm font-medium">Scanner Special</p>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={value.includes("*") || value.includes("scanner.use")}
                onCheckedChange={() => toggle("scanner.use")}
              />
              <span>Use scanner</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

export function UsersPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.users);
  const [roles, setRoles] = useState<AnyObj[]>([]);
  useEffect(() => {
    assetflowService.roles().then((r) => setRoles(r.data.data || []));
  }, []);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Users & Roles"
        description="Default roles: Super Admin, Company Admin, IT, Asset Manager, HR Manager, Finance Manager, Auditor, Viewer."
        actions={
          <PermissionAction permission="users.create">
            <Button asChild>
              <Link href="/users/create">
              <Plus className="mr-2 h-4 w-4" />
              Create User
              </Link>
            </Button>
          </PermissionAction>
        }
      />
      <Tabs defaultValue="users">
        <TabsList>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
        </TabsList>
        <TabsContent value="users" className="mt-4">
          <DataTableShell
            toolbar={
              <Toolbar
                search={list.search}
                setSearch={list.setSearch}
                createHref="/users/create"
                onCsv={() => toast.info("User CSV export coming next")}
                onPdf={() => toast.info("User PDF export coming next")}
              />
            }
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Extra Permissions</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.loading ? (
                  <LoadingRows colSpan={6} />
                ) : (
                  list.items.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.Role?.name || "-"}</TableCell>
                      <TableCell>
                        <StatusBadge status={u.status} />
                      </TableCell>
                      <TableCell>{(u.permissions || []).length ? `${(u.permissions || []).length} custom` : "Role only"}</TableCell>
                      <TableCell className="text-right">
                        <RowActions edit={`/users/${u.id}/edit`} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </DataTableShell>
        </TabsContent>
        <TabsContent value="roles" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {roles.map((r) => (
              <Card key={r.id}>
                <CardHeader>
                  <CardTitle className="text-base">{r.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {r.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {(r.permissions || []).slice(0, 12).map((p: string) => (
                      <span
                        key={p}
                        className="rounded-full bg-muted px-2 py-1 text-xs"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
function UserFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const [roles, setRoles] = useState<AnyObj[]>([]);
  const [f, setF] = useState<AnyObj>({
    name: "",
    email: "",
    password: "password",
    roleId: "",
    status: "Active",
    permissions: [],
  });

  useEffect(() => {
    assetflowService.roles().then((r) => {
      setRoles(r.data.data || []);
      setF((x) => ({ ...x, roleId: x.roleId || r.data.data?.[0]?.id || "" }));
    });
  }, []);

  useEffect(() => {
    if (!id) return;
    assetflowService.user(id).then((r) => {
      const user = r.data.data || {};
      setF({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.roleId || user.Role?.id || "",
        status: user.status || "Active",
        permissions: user.permissions || [],
      });
    });
  }, [id]);

  const save = async () => {
    const payload = { ...f };
    if (id && !payload.password) delete payload.password;
    if (id) await assetflowService.updateUser(id, payload);
    else await assetflowService.createUser(payload);
    toast.success(id ? "User updated" : "User created");
    router.push("/users");
  };

  return (
    <FormShell
      title={id ? "Edit User" : "Create User"}
      description="Admin can create user, assign role, and add exact user-level permissions. Sidebar visibility follows these permissions."
      onSave={save}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Name" value={f.name} onChange={(v) => setF({ ...f, name: v })} />
        <InputField label="Email" value={f.email} onChange={(v) => setF({ ...f, email: v })} />
        <InputField
          label={id ? "New Password (optional)" : "Password"}
          value={f.password}
          onChange={(v) => setF({ ...f, password: v })}
        />
        <SelectIdField label="Role" value={f.roleId} onChange={(v) => setF({ ...f, roleId: v })} items={roles} />
        <SelectField label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["Active", "Inactive"]} />
        <PermissionPicker value={f.permissions || []} onChange={(permissions) => setF({ ...f, permissions })} />
      </div>
    </FormShell>
  );
}

export function UserCreatePage() {
  return <UserFormPage />;
}

export function UserEditPage() {
  const params = useParams();
  return <UserFormPage id={String(params.id)} />;
}
export function SettingsPage() {
  const sections = [
    "Company profile",
    "Branch/location settings",
    "Asset categories",
    "Asset conditions",
    "Depreciation rules",
    "Notification settings",
    "QR/barcode settings",
    "Security settings",
    "Data import/export settings",
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure AssetFlow policies."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <Card key={s}>
            <CardHeader>
              <CardTitle className="text-base">{s}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure {s.toLowerCase()}.
              </p>
              {s === "Asset categories" ? (
                <Button className="mt-4" variant="outline" size="sm" asChild>
                  <Link href="/categories">Manage</Link>
                </Button>
              ) : (
                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("This settings section will be connected next.")
                  }
                >
                  Manage
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
function ImportPlaceholder({
  title,
  templateUrl,
  columns,
}: {
  title: string;
  templateUrl: string;
  columns: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Download template, fill accurate headers, then upload. Full parser/preview will be the next step."
        actions={
          <>
            <BackButton />
            <Button asChild>
              <a href={templateUrl}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </a>
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              Upload CSV Preview Foundation
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Required columns: {columns.join(", ")}
            </p>
            <Input
              type="file"
              accept=".csv"
              className="mx-auto mt-6 max-w-md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
export function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@assetflow.com");
  const [password, setPassword] = useState("password");
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    try {
      setLoading(true);
      const res = await assetflowService.login(email, password);
      localStorage.setItem("assetflow_access_token", res.data.data.accessToken);
      toast.success("Login successful");
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background via-muted/40 to-accent/30">
      <div className="m-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border bg-card shadow-[var(--shadow-elegant)] md:grid-cols-2">
        <div className="hidden bg-sidebar p-10 text-sidebar-foreground md:block">
          <ShieldCheck className="h-12 w-12 text-sidebar-primary" />
          <h1 className="mt-8 text-4xl font-semibold">AssetFlow</h1>
          <p className="mt-4 text-sidebar-foreground/70">
            Track every asset. Control every handover. Know every value.
          </p>
          <div className="mt-8 grid gap-2 text-xs text-sidebar-foreground/60">
            {roleNames.map((r) => (
              <span key={r}>✓ {r}</span>
            ))}
          </div>
        </div>
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Login connects the frontend to your backend APIs.
          </p>
          <div className="mt-8 space-y-4">
            <Input
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button onClick={submit} className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
            <div className="rounded-xl bg-muted/50 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">Demo credentials</p>
              <p>admin@assetflow.com / password</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
