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
        // actions={
        //   <PermissionAction permission="users.create">
        //     <Button asChild>
        //       <Link href="/users/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Create User
        //       </Link>
        //     </Button>
        //   </PermissionAction>
        // }
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

