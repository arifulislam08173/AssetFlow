"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
import { downloadFile } from "@/lib/download-file";
import { BackendFilters, type FilterChoice } from "@/components/backend-filters";
import { useCurrentUser } from "@/hooks/use-current-user";
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

export const money = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});
export type AnyObj = Record<string, any>;
export type Meta = { page: number; limit: number; total: number; totalPages: number; purchaseValue?: number; currentValue?: number };
export type Options = {
  companies: AnyObj[];
  categories: AnyObj[];
  departments: AnyObj[];
  locations: AnyObj[];
  vendors: AnyObj[];
  roles: AnyObj[];
};
export const emptyMeta: Meta = { page: 1, limit: 10, total: 0, totalPages: 1 };
export const emptyOptions: Options = {
  companies: [],
  categories: [],
  departments: [],
  locations: [],
  vendors: [],
  roles: [],
};
export const roleNames = [
  "Super Admin",
  "Company Admin",
  "IT",
  "Asset Manager",
  "HR Manager",
  "Finance Manager",
  "Auditor",
  "Viewer",
];
export const permissionGroups = [
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

export function useAuthGuard() {
  const router = useRouter();
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      !localStorage.getItem("assetflow_access_token")
    )
      router.replace("/login");
  }, [router]);
}


export function canPermission(permissions: string[], permission: string) {
  const namespace = permission.split(".")[0];
  return (
    permissions.includes("*") ||
    permissions.includes(permission) ||
    permissions.includes(`${namespace}.*`)
  );
}

export function moduleFromPath(path?: string) {
  if (!path) return "";
  return path.split("/").filter(Boolean)[0] || "";
}

export function useCurrentPermissions() {
  const { permissions } = useCurrentUser();

  return {
    permissions,
    can: (permission: string) => canPermission(permissions, permission),
  };
}

export function useOptions(companyId?: string) {
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

export function useApiList(fetcher: (params?: AnyObj) => Promise<any>) {
  const [items, setItems] = useState<AnyObj[]>([]);
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [search, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<AnyObj>({});
  const [loading, setLoading] = useState(true);
  const [key, setKey] = useState(0);
  const filterKey = JSON.stringify(filters);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetcher({ page: meta.page, limit: meta.limit, search: debouncedSearch || undefined, ...filters })
      .then((response) => {
        if (!active) return;
        setItems(response.data.data || []);
        setMeta(response.data.meta || emptyMeta);
      })
      .catch((error) => {
        if (!active) return;
        toast.error(error.response?.data?.message || "Unable to load records. Please retry.");
      })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [fetcher, meta.page, meta.limit, debouncedSearch, filterKey, key]);

  return {
    items, meta, setMeta, search,
    setSearch: (value: string) => {
      setSearchValue(value);
      setMeta((previous) => previous.page === 1 ? previous : { ...previous, page: 1 });
    },
    filters, setFilters: (updater: ((f: AnyObj) => AnyObj) | AnyObj) => {
      setFilters(updater);
      setMeta((old) => old.page === 1 ? old : { ...old, page: 1 });
    }, loading,
    refresh: () => setKey((current) => current + 1),
  };
}

export function Toolbar({
  placeholder = "Search by prefix (e.g. K)...",
  search,
  setSearch,
  createHref,
  createLabel = "Add New",
  templateUrl,
  onTemplateDownload,
  onPdf,
  onCsv,
  children,
  filters, setFilters, filterChoices, dateLabel,
}: {
  placeholder?: string;
  search: string;
  setSearch: (v: string) => void;
  createHref?: string;
  createLabel?: string;
  templateUrl?: string;
  onTemplateDownload?: () => void;
  onPdf?: () => void;
  onCsv?: () => void;
  children?: React.ReactNode;
  filters?: AnyObj;
  setFilters?: (updater: (previous: AnyObj) => AnyObj) => void;
  filterChoices?: FilterChoice[];
  dateLabel?: string;
}) {
  const { can } = useCurrentPermissions();
  const moduleName = moduleFromPath(createHref);
  const canCreate = !createHref || !moduleName || can(`${moduleName}.create`);
  const canExport = can("reports.export") || (moduleName ? can(`${moduleName}.export`) : false);
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setHeaderTarget(document.querySelector<HTMLElement>("[data-assetflow-header-actions]"));
  }, []);

  const actionButtons = (
    <div className="flex flex-wrap items-center gap-2">
      {(templateUrl || onTemplateDownload) && canExport && (
        onTemplateDownload ? (
          <Button variant="outline" size="sm" onClick={onTemplateDownload}>
            <Download className="mr-2 h-4 w-4" /> Template
          </Button>
        ) : (
          <Button asChild variant="outline" size="sm">
            <a href={templateUrl}><Download className="mr-2 h-4 w-4" /> Template</a>
          </Button>
        )
      )}
      {onCsv && canExport && (
        <Button variant="outline" size="sm" onClick={onCsv}><Download className="mr-2 h-4 w-4" /> CSV</Button>
      )}
      {onPdf && canExport && (
        <Button variant="outline" size="sm" onClick={onPdf}><FileBarChart className="mr-2 h-4 w-4" /> PDF</Button>
      )}
      {createHref && canCreate && (
        <Button asChild size="sm"><Link href={createHref}><Plus className="mr-2 h-4 w-4" />{createLabel}</Link></Button>
      )}
    </div>
  );
  const hasActions = Boolean(((templateUrl || onTemplateDownload) && canExport) || (onCsv && canExport) || (onPdf && canExport) || (createHref && canCreate));
  const hasFilters = Boolean(filters && setFilters);
  const resetAll = () => { setSearch(""); setFilters?.(() => ({})); };
  const filterActive = Boolean(search.trim()) || Object.values(filters || {}).some((value) => value !== undefined && value !== null && value !== "" && value !== "all");

  return (
    <>
      <div className="space-y-3 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 lg:flex-nowrap lg:overflow-x-auto lg:pb-1">
          <div className="relative w-full min-w-[210px] flex-1 lg:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)}
              placeholder={placeholder} aria-label="Search records by prefix"
              className="h-10 rounded-xl pl-10 text-sm" />
          </div>
          {children}
          {hasFilters && <BackendFilters filters={filters!} onChange={setFilters!} choices={filterChoices}
            section="choices" showReset={false} />}
        </div>
        {hasFilters && <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3">
          <BackendFilters filters={filters!} onChange={setFilters!} dateLabel={dateLabel}
            section="dates" showReset={false} />
          {filterActive && <Button variant="outline" size="sm" className="h-10 rounded-xl"
            onClick={resetAll}>Clear all</Button>}
        </div>}
        {!headerTarget && hasActions && <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
          {actionButtons}
        </div>}
      </div>
      {headerTarget && hasActions && createPortal(actionButtons, headerTarget)}
    </>
  );
}

export function Footer({ meta, setMeta }: { meta: Meta; setMeta: (updater: (m: Meta) => Meta) => void }) {
  const first = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const last = Math.min(meta.page * meta.limit, meta.total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground sm:text-sm">
      <span>Showing <b className="text-foreground">{first}–{last}</b> of <b className="text-foreground">{meta.total}</b> records</span>
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="list-page-size">Rows per page</label>
        <select id="list-page-size" aria-label="Rows per page" value={meta.limit} onChange={(e) => setMeta((m) => ({ ...m, limit: Number(e.target.value), page: 1 }))}
          className="h-9 rounded-md border border-input bg-background px-3 text-foreground">
          {[10, 20, 50, 100].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <span className="min-w-20 text-center">Page {meta.page} / {meta.totalPages || 1}</span>
        <Button size="sm" variant="outline" aria-label="First page" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: 1 }))}>«</Button>
        <Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => setMeta((m) => ({ ...m, page: m.page - 1 }))}>Previous</Button>
        <Button size="sm" variant="outline" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.page + 1 }))}>Next</Button>
        <Button size="sm" variant="outline" aria-label="Last page" disabled={meta.page >= meta.totalPages} onClick={() => setMeta((m) => ({ ...m, page: m.totalPages }))}>»</Button>
      </div>
    </div>
  );
}

export function withListFilters(path: string, filters: AnyObj = {}, search = "") {
  const [base, existingQuery] = path.split("?");
  const params = new URLSearchParams(existingQuery || "");
  if (search.trim()) params.set("search", search.trim());
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== "" && value !== "all") params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

export function Field({
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
export function LoadingRows({ colSpan = 8 }: { colSpan?: number }) {
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
export function EmptyRows({
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
export function BackButton({ fallback = "/dashboard" }: { fallback?: string }) {
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

export function PermissionAction({
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


export function RowActions({
  view,
  edit,
  pdfPath,
  pdfName = "assetflow-report.pdf",
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

export function FormShell({
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
export function FieldHint({ error, helper }: { error?: string; helper?: string }) {
  if (!error && !helper) return null;
  return <p className={`text-xs ${error ? "text-destructive" : "text-muted-foreground"}`}>{error || helper}</p>;
}
export function RequiredMark({ required }: { required?: boolean }) {
  return required ? <span className="text-destructive"> *</span> : null;
}
export function InputField({
  label,
  value,
  onChange,
  type = "text",
  required,
  error,
  helper,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  error?: string;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}<RequiredMark required={required} /></Label>
      <Input
        type={type}
        value={value ?? ""}
        aria-invalid={Boolean(error)}
        className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldHint error={error} helper={helper} />
    </div>
  );
}
export function NumberField({
  label,
  value,
  onChange,
  required,
  error,
  helper,
  disabled,
}: {
  label: string;
  value: any;
  onChange: (v: number) => void;
  required?: boolean;
  error?: string;
  helper?: string;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}<RequiredMark required={required} /></Label>
      <Input
        type="number"
        value={value ?? 0}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <FieldHint error={error} helper={helper} />
    </div>
  );
}
export function TextAreaField({
  label,
  value,
  onChange,
  error,
  helper,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  error?: string;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        value={value ?? ""}
        aria-invalid={Boolean(error)}
        className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
        onChange={(e) => onChange(e.target.value)}
      />
      <FieldHint error={error} helper={helper} />
    </div>
  );
}
export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  error,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  error?: string;
  helper?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}<RequiredMark required={required} /></Label>
      <Select value={value || options[0]} onValueChange={onChange}>
        <SelectTrigger aria-invalid={Boolean(error)} className={error ? "border-destructive focus-visible:ring-destructive" : undefined}>
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
      <FieldHint error={error} helper={helper} />
    </div>
  );
}
export function optionLabel(i: AnyObj, labelKey = "name") {
  if (labelKey === "employee") return `${i.employeeCode || "EMP"} - ${i.name}`;
  if (labelKey === "asset") return `${i.assetCode || "AST"} - ${i.name}`;
  return i[labelKey] || i.name || i.code || i.id;
}
export function SelectIdField({
  label,
  value,
  onChange,
  items,
  labelKey = "name",
  required,
  error,
  helper,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  items: AnyObj[];
  labelKey?: string;
  required?: boolean;
  error?: string;
  helper?: string;
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
      <Label>{label}<RequiredMark required={required} /></Label>
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger aria-invalid={Boolean(error)} className={error ? "border-destructive focus-visible:ring-destructive" : undefined}>
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
      <FieldHint error={error} helper={helper} />
    </div>
  );
}
export function CompanyFilter({
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


export {
  Link,
  useParams,
  useRouter,
  useEffect,
  useMemo,
  useState,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
  api,
  assetflowService,
  notifications,
  recentActivities,
  PageHeader,
  StatCard,
  StatusBadge,
  DataTableShell,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
  downloadFile,
  BackendFilters,
};
