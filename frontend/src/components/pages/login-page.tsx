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

