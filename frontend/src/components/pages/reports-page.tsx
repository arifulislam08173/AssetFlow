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

export function ReportsPage() {
  const reports = [
    { title: "Asset Inventory Report", path: "/exports/assets.pdf" },
    { title: "Depreciation Report", path: "/exports/assets.pdf" },
    { title: "Audit Log Report", path: "/exports/audit-logs.csv" },
    { title: "Employee Asset Report", path: "" },
    { title: "Return/Clearance Report", path: "" },
    { title: "Vendor Purchase Report", path: "" },
  ];
  return (
    <div className="space-y-6">
      <PageHeader
        title="Report Center"
        description="Generate preview and export business reports."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <Card key={r.title}>
            <CardHeader>
              <CardTitle className="text-base">{r.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Filter-ready report card. PDF/CSV export is connected for core
                reports.
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Generate</Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    r.path
                      ? downloadFile(
                        r.path,
                        `${r.title.replaceAll(" ", "-").toLowerCase()}.${r.path.endsWith("csv") ? "csv" : "html"}`,
                      )
                      : toast.info("This report export will be connected next.")
                  }
                >
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

