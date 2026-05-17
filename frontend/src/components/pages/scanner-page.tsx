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


export function ScannerPage() {
  useAuthGuard();
  const [q, setQ] = useState("");
  const [r, setR] = useState<AnyObj | null>(null);
  const search = async () => {
    try {
      const res = await assetflowService.scannerSearch(q);
      setR(res.data.data);
      toast.success("Asset found");
    } catch (e: any) {
      setR(null);
      toast.error(e.response?.data?.message || "Asset not found");
    }
  };
  return (
    <div className="space-y-6">
      <PageHeader
        title="QR & Barcode Scanner"
        description="Manual search works now; browser camera integration can be added next."
        actions={
          <Button variant="outline">
            <ScanLine className="mr-2 h-4 w-4" />
            Start Camera
          </Button>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="rounded-3xl border border-dashed p-12">
              <QrCode className="mx-auto h-20 w-20 text-muted-foreground" />
              <p className="mt-4 font-medium">Camera scanner placeholder</p>
              <p className="text-sm text-muted-foreground">
                Use manual search by asset code, serial number or asset tag.
              </p>
            </div>
            <div className="flex w-full max-w-lg gap-2">
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Asset code / serial / tag"
              />
              <Button onClick={search}>Search</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Scan Result</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {r ? (
              <>
                <StatusBadge status={r.status} />
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {r.assetCode} / {r.serialNumber}
                </p>
                <p className="text-sm">
                  Assigned: {r.assignedEmployee?.name || "Not assigned"}
                </p>
                <Button asChild className="w-full" variant="outline">
                  <Link href={`/assets/${r.id}`}>Open Asset</Link>
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Search an asset.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

