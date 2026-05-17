"use client";

import type { AnyObj } from "./shared";
import {
  money,
  roleNames,
  permissionGroups,
  useAuthGuard,
  canPermission,
  moduleFromPath,
  useCurrentPermissions,
  useOptions,
  useApiList,
  Toolbar,
  Footer,
  Field,
  LoadingRows,
  EmptyRows,
  BackButton,
  PermissionAction,
  RowActions,
  FormShell,
  FieldHint,
  RequiredMark,
  InputField,
  NumberField,
  TextAreaField,
  SelectField,
  optionLabel,
  SelectIdField,
  CompanyFilter,
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
} from "./shared";

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
            {/* <PermissionAction permission="assets.create">
              <Button asChild>
                <Link href="/assets/create">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Asset
                </Link>
              </Button>
            </PermissionAction> */}
          </>
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref="/assets/create"
            onTemplateDownload={downloadAssetTemplateCsv}
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
  manualSalvage: false,
  usefulLifeYears: 5,
  depreciationMethod: "Straight Line",
  vendorId: "",
  locationId: "",
  condition: "New",
  status: "Available",
  warrantyExpiry: "",
  notes: "",
});
const assetRequiredFields: Array<[string, string]> = [
  ["companyId", "Company"],
  ["assetCode", "Asset code"],
  ["name", "Asset name"],
  ["categoryId", "Category"],
  ["brand", "Brand"],
  ["model", "Model"],
  ["serialNumber", "Serial number"],
  ["assetTag", "Asset tag"],
  ["purchaseDate", "Purchase date"],
  ["purchasePrice", "Purchase price"],
  ["usefulLifeYears", "Useful life years"],
  ["depreciationMethod", "Depreciation method"],
  ["vendorId", "Vendor"],
  ["locationId", "Location"],
  ["condition", "Condition"],
  ["status", "Status"],
  ["warrantyExpiry", "Warranty expiry"],
];
function autoSalvageValue(purchasePrice: number, condition: string) {
  const c = String(condition || "").toLowerCase();
  const rate = c.includes("new") || c.includes("excellent") ? 0.1 : c.includes("good") ? 0.07 : c.includes("fair") ? 0.05 : c.includes("poor") ? 0.02 : 0;
  return Math.round((Number(purchasePrice || 0) * rate + Number.EPSILON) * 100) / 100;
}
function validateAssetRows(rows: AnyObj[]) {
  const nextErrors: Record<string, string> = {};
  rows.forEach((row, idx) => {
    assetRequiredFields.forEach(([key, label]) => {
      const value = row[key];
      if (value === undefined || value === null || String(value).trim() === "") nextErrors[`${idx}.${key}`] = `${label} is required`;
    });
    if (Number(row.purchasePrice) <= 0) nextErrors[`${idx}.purchasePrice`] = "Purchase price must be greater than 0";
    if (!Number.isInteger(Number(row.usefulLifeYears)) || Number(row.usefulLifeYears) <= 0) nextErrors[`${idx}.usefulLifeYears`] = "Useful life years must be a positive whole number";
    if (row.purchaseDate && Number.isNaN(Date.parse(row.purchaseDate))) nextErrors[`${idx}.purchaseDate`] = "Purchase date must be valid";
    if (row.warrantyExpiry && Number.isNaN(Date.parse(row.warrantyExpiry))) nextErrors[`${idx}.warrantyExpiry`] = "Warranty expiry must be valid";
  });
  return nextErrors;
}
function AssetFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [rows, setRows] = useState<AnyObj[]>([initialAsset()]);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
              manualSalvage: false,
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
      prev.map((r, i) => {
        if (i !== idx) return r;
        const next = { ...r, [key]: value };
        if (!next.manualSalvage && ["purchasePrice", "condition"].includes(key)) {
          next.salvageValue = autoSalvageValue(Number(next.purchasePrice || 0), next.condition);
        }
        return next;
      }),
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
    const errors = validateAssetRows(rows);
    setFieldErrors(errors);
    if (Object.keys(errors).length) {
      toast.error("Please fill all required asset fields before saving.");
      return;
    }
    try {
      setSaving(true);
      const payload = rows.map(({ manualSalvage, ...r }) => ({
        ...r,
        purchasePrice: Number(r.purchasePrice || 0),
        salvageValue: Number(r.salvageValue || 0),
        usefulLifeYears: Number(r.usefulLifeYears || 5),
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
  const errorFor = (idx: number, key: string) => fieldErrors[`${idx}.${key}`];
  return (
    <div className="space-y-6">
      <PageHeader
        title={id ? "Edit Asset" : "Add Assets"}
        description="All asset lifecycle and finance fields are required except notes. Salvage value can be auto-calculated from purchase price and condition."
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
            <div key={idx} className="rounded-2xl border bg-background/70 p-4 shadow-sm">
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
                <SelectIdField label="Company" required error={errorFor(idx, "companyId")} value={r.companyId} onChange={(v) => update(idx, "companyId", v)} items={options.companies} />
                <InputField label="Asset Code" required error={errorFor(idx, "assetCode")} value={r.assetCode} onChange={(v) => update(idx, "assetCode", v)} />
                <InputField label="Asset Name" required error={errorFor(idx, "name")} value={r.name} onChange={(v) => update(idx, "name", v)} />
                <SelectIdField label="Category" required error={errorFor(idx, "categoryId")} value={r.categoryId} onChange={(v) => update(idx, "categoryId", v)} items={options.categories} />
                <InputField label="Brand" required error={errorFor(idx, "brand")} value={r.brand} onChange={(v) => update(idx, "brand", v)} />
                <InputField label="Model" required error={errorFor(idx, "model")} value={r.model} onChange={(v) => update(idx, "model", v)} />
                <InputField label="Serial Number" required error={errorFor(idx, "serialNumber")} value={r.serialNumber} onChange={(v) => update(idx, "serialNumber", v)} />
                <InputField label="Asset Tag" required error={errorFor(idx, "assetTag")} value={r.assetTag} onChange={(v) => update(idx, "assetTag", v)} />
                <InputField label="Purchase Date" required error={errorFor(idx, "purchaseDate")} value={r.purchaseDate} onChange={(v) => update(idx, "purchaseDate", v)} type="date" />
                <NumberField label="Purchase Price" required error={errorFor(idx, "purchasePrice")} value={r.purchasePrice} onChange={(v) => update(idx, "purchasePrice", v)} />
                <SelectField label="Condition" required error={errorFor(idx, "condition")} value={r.condition} onChange={(v) => update(idx, "condition", v)} options={["New", "Excellent", "Good", "Fair", "Poor", "Damaged", "Unusable"]} />
                <NumberField label="Useful Life" required error={errorFor(idx, "usefulLifeYears")} value={r.usefulLifeYears} onChange={(v) => update(idx, "usefulLifeYears", v)} />
                <div className="space-y-4 rounded-2xl border bg-muted/20 p-4 md:col-span-3">
                  <label className="flex w-fit items-center gap-2 text-sm font-medium text-foreground">
                    <Checkbox
                      checked={Boolean(r.manualSalvage)}
                      onCheckedChange={(checked) =>
                        update(idx, "manualSalvage", Boolean(checked))
                      }
                    />
                    Manual salvage value
                  </label>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Auto-calculated from purchase price and condition. You can enable manual
                    override if company policy requires.
                  </p>

                  <div className="max-w-md">
                    <NumberField
                      label="Salvage Value"
                      value={r.salvageValue}
                      disabled={!r.manualSalvage}
                      onChange={(v) => update(idx, "salvageValue", v)}
                      helper={
                        !r.manualSalvage
                          ? `${money.format(Number(r.salvageValue || 0))} based on ${r.condition}`
                          : "Manual override enabled."
                      }
                    />
                  </div>
                </div>
                <SelectField label="Depreciation" required error={errorFor(idx, "depreciationMethod")} value={r.depreciationMethod} onChange={(v) => update(idx, "depreciationMethod", v)} options={["Straight Line", "Declining Balance", "Manual", "No Depreciation"]} />
                <SelectIdField label="Vendor" required error={errorFor(idx, "vendorId")} value={r.vendorId} onChange={(v) => update(idx, "vendorId", v)} items={options.vendors.filter((v) => !r.companyId || !v.companyId || v.companyId === r.companyId)} />
                <SelectIdField label="Location" required error={errorFor(idx, "locationId")} value={r.locationId} onChange={(v) => update(idx, "locationId", v)} items={options.locations} />
                <SelectField label="Status" required error={errorFor(idx, "status")} value={r.status} onChange={(v) => update(idx, "status", v)} options={["Available", "Assigned", "In Repair", "Damaged", "Lost", "Disposed", "Reserved"]} />
                <InputField label="Warranty Expiry" required error={errorFor(idx, "warrantyExpiry")} value={r.warrantyExpiry} onChange={(v) => update(idx, "warrantyExpiry", v)} type="date" />
                <div className="md:col-span-3">
                  <TextAreaField label="Notes" value={r.notes} onChange={(v) => update(idx, "notes", v)} />
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
const assetImportHeaders = [
  "companyCode",
  "assetCode",
  "name",
  "categoryName",
  "brand",
  "model",
  "serialNumber",
  "assetTag",
  "purchaseDate",
  "purchasePrice",
  "usefulLifeYears",
  "depreciationMethod",
  "warrantyExpiry",
  "condition",
  "status",
  "vendorName",
  "locationName",
  "notes",
];
function buildAssetTemplateCsv() {
  return `${assetImportHeaders.join(",")}\nH001,AST-0001,Dell Latitude 5420,Laptop,Dell,Latitude 5420,SN-0001,TAG-0001,2026-01-01,80000,5,Straight Line,2029-01-01,New,Available,Demo Vendor,Head Office,Optional notes\nH001,AST-0002,Dell Latitude 5421,Laptop,Dell,Latitude 5421,SN-0002,TAG-0002,2026-01-02,82000,5,Straight Line,2029-01-02,New,Available,Demo Vendor,Head Office,Optional notes\n`;
}
function downloadAssetTemplateCsv() {
  const blob = new Blob([buildAssetTemplateCsv()], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "assetflow-assets-template.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function parsePreviewRows(csv: string) {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
  return lines.slice(1, 6).map((line) => {
    const values = line.split(",");
    return Object.fromEntries(headers.map((h, idx) => [h, values[idx] || ""]));
  });
}
export function AssetImportPage() {
  useAuthGuard();
  const [csv, setCsv] = useState("");
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<AnyObj[]>([]);
  const [result, setResult] = useState<AnyObj | null>(null);
  const [uploading, setUploading] = useState(false);
  const downloadTemplate = downloadAssetTemplateCsv;
  const onFile = async (file?: File) => {
    if (!file) return;
    const text = await file.text();
    setCsv(text);
    setFileName(file.name);
    setPreview(parsePreviewRows(text));
    setResult(null);
  };
  const upload = async () => {
    if (!csv.trim()) {
      toast.error("Please select a CSV file first.");
      return;
    }
    try {
      setUploading(true);
      const response = await assetflowService.importAssetsCsv(csv);
      setResult(response.data.data);
      const summary = response.data.data;
      if (summary.failedCount) toast.error(`Import finished with ${summary.failedCount} failed row(s).`);
      else toast.success(`Imported ${summary.successCount} asset(s) successfully.`);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "CSV import failed");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="Bulk Asset Import"
        description="Download the exact CSV template, fill asset data, then upload it to insert assets into PostgreSQL."
        actions={
          <>
            <BackButton fallback="/assets" />
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="mr-2 h-4 w-4" />Download Template
            </Button>
          </>
        }
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-dashed bg-muted/20 p-6 text-center">
              <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Choose completed asset CSV file</p>
              <p className="mb-4 text-sm text-muted-foreground">The first row must contain the exact template headers.</p>
              <Input type="file" accept=".csv,text/csv" onChange={(e) => onFile(e.target.files?.[0])} className="mx-auto max-w-md" />
              {fileName && <p className="mt-3 text-sm text-muted-foreground">Selected: {fileName}</p>}
            </div>
            <div className="flex justify-end">
              <Button onClick={upload} disabled={uploading || !csv.trim()}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Upload and Import
              </Button>
            </div>
            {preview.length > 0 && (
              <div className="rounded-2xl border">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Preview first {preview.length} row(s)</h3>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>{assetImportHeaders.slice(0, 8).map((h) => <TableHead key={h}>{h}</TableHead>)}</TableRow>
                    </TableHeader>
                    <TableBody>
                      {preview.map((row, idx) => (
                        <TableRow key={idx}>{assetImportHeaders.slice(0, 8).map((h) => <TableCell key={h}>{row[h]}</TableCell>)}</TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
            {result && (
              <Card className="border-muted bg-muted/20">
                <CardContent className="grid gap-4 p-4 md:grid-cols-3">
                  <Field label="Total Rows" value={result.totalRows} />
                  <Field label="Success" value={result.successCount} />
                  <Field label="Failed" value={result.failedCount} />
                  {result.errors?.length ? (
                    <div className="md:col-span-3">
                      <h4 className="mb-2 font-semibold">Validation Errors</h4>
                      <div className="max-h-72 overflow-auto rounded-xl border bg-background">
                        {result.errors.map((err: AnyObj, idx: number) => (
                          <div key={idx} className="border-b p-3 text-sm last:border-b-0">
                            Row {err.row}{err.field ? ` / ${err.field}` : ""}: {err.message}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Required Columns</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">Use these exact headers. All are required except notes.</p>
            <div className="flex flex-wrap gap-2">
              {assetImportHeaders.map((header) => (
                <span key={header} className="rounded-full border bg-background px-3 py-1 text-xs font-medium">{header}</span>
              ))}
            </div>
            <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
              Company, category, vendor and location are matched by code/name. Purchase and warranty dates should use YYYY-MM-DD.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
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


