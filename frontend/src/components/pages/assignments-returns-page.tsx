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


export function AssignmentsPage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.assignments);
  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Assignments"
        description="Company-aware handover tracking from stock to employee."
        // actions={
        //   <PermissionAction permission="assignments.create">
        //     <Button asChild>
        //       <Link href="/assignments/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Create Assignment
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
        // actions={
        //   <PermissionAction permission="returns.create">
        //     <Button asChild>
        //       <Link href="/returns/create">
        //         <Undo2 className="mr-2 h-4 w-4" />
        //         Process Return
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

