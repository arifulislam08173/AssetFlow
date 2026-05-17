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
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={7} />
            ) : list.items.length ? (
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
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/audit-logs/${a.id}`}>
                        <Eye className="mr-2 h-4 w-4" />View
                      </Link>
                    </Button>
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
function JsonSnapshot({ value }: { value: unknown }) {
  return (
    <pre className="max-h-[520px] overflow-auto rounded-2xl border bg-muted/30 p-4 text-xs leading-relaxed">
      {JSON.stringify(value || null, null, 2)}
    </pre>
  );
}
export function AuditLogDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [log, setLog] = useState<AnyObj | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    assetflowService
      .auditLog(id)
      .then((r) => setLog(r.data.data))
      .catch((e) => toast.error(e.response?.data?.message || "Audit log not found"))
      .finally(() => setLoading(false));
  }, [id]);
  if (loading)
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading audit detail...
        </CardContent>
      </Card>
    );
  if (!log) return <Card><CardContent className="p-8 text-center text-muted-foreground">Audit log not found.</CardContent></Card>;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log Detail"
        description={`${log.action} / ${log.module} / ${new Date(log.createdAt).toLocaleString()}`}
        actions={<BackButton fallback="/audit-logs" />}
      />
      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>User</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Name" value={log.userName || "System"} />
            <Field label="Role" value={log.roleName || "-"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Operation</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Action" value={log.action} />
            <Field label="Module" value={log.module} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Record</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="Record ID" value={log.recordId || "-"} />
            <Field label="Date / Time" value={new Date(log.createdAt).toLocaleString()} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Request</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Field label="IP" value={log.ipAddress || "-"} />
            <Field label="Device" value={log.device || "-"} />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Changed Fields</CardTitle>
        </CardHeader>
        <CardContent>
          {log.changedFields?.length ? (
            <Table>
              <TableHeader>
                <TableRow><TableHead>Field</TableHead><TableHead>Before</TableHead><TableHead>After</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {log.changedFields.map((change: AnyObj) => (
                  <TableRow key={change.field}>
                    <TableCell className="font-medium">{change.field}</TableCell>
                    <TableCell className="max-w-md truncate">{JSON.stringify(change.before)}</TableCell>
                    <TableCell className="max-w-md truncate">{JSON.stringify(change.after)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">No field-level differences were detected for this action.</p>
          )}
        </CardContent>
      </Card>
      <Tabs defaultValue="before">
        <TabsList>
          <TabsTrigger value="before">Before Snapshot</TabsTrigger>
          <TabsTrigger value="after">After Snapshot</TabsTrigger>
        </TabsList>
        <TabsContent value="before"><JsonSnapshot value={log.beforeSnapshot} /></TabsContent>
        <TabsContent value="after"><JsonSnapshot value={log.afterSnapshot} /></TabsContent>
      </Tabs>
    </div>
  );
}

