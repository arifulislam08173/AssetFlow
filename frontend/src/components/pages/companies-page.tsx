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
        // actions={
        //   <PermissionAction permission="companies.create">
        //     <Button asChild>
        //       <Link href="/companies/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add Company
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


