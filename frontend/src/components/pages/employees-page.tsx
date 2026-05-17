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
        // actions={
        //   <PermissionAction permission="employees.create">
        //     <Button asChild>
        //       <Link href="/employees/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add Employee
        //       </Link>
        //     </Button>
        //   </PermissionAction>
        // }
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


