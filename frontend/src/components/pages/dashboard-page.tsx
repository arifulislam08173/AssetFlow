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


