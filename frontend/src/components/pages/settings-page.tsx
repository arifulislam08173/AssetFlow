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

export function SettingsPage() {
  const sections = [
    "Company profile",
    "Branch/location settings",
    "Asset categories",
    "Asset conditions",
    "Depreciation rules",
    "Notification settings",
    "QR/barcode settings",
    "Security settings",
    "Data import/export settings",
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure AssetFlow policies."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((s) => (
          <Card key={s}>
            <CardHeader>
              <CardTitle className="text-base">{s}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Configure {s.toLowerCase()}.
              </p>
              {s === "Asset categories" ? (
                <Button className="mt-4" variant="outline" size="sm" asChild>
                  <Link href="/categories">Manage</Link>
                </Button>
              ) : (
                <Button
                  className="mt-4"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.info("This settings section will be connected next.")
                  }
                >
                  Manage
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
function ImportPlaceholder({
  title,
  templateUrl,
  columns,
}: {
  title: string;
  templateUrl: string;
  columns: string[];
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description="Download template, fill accurate headers, then upload. Full parser/preview will be the next step."
        actions={
          <>
            <BackButton />
            <Button asChild>
              <a href={templateUrl}>
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </a>
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="rounded-2xl border border-dashed p-8 text-center">
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">
              Upload CSV Preview Foundation
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Required columns: {columns.join(", ")}
            </p>
            <Input
              type="file"
              accept=".csv"
              className="mx-auto mt-6 max-w-md"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

