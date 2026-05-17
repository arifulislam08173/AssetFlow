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
        // actions={
        //   <PermissionAction permission="vendors.create">
        //     <Button asChild>
        //       <Link href="/vendors/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add Vendor
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


