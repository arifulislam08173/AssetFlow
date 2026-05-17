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

function SimpleList({
  title,
  description,
  list,
  columns,
  createHref,
}: {
  title: string;
  description: string;
  list: any;
  columns: string[];
  createHref?: string;
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        title={title}
        description={description}
        actions={
          createHref && (
            <Button asChild>
              <Link href={createHref}>
                <Plus className="mr-2 h-4 w-4" />
                Add New
              </Link>
            </Button>
          )
        }
      />
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            createHref={createHref}
            onCsv={() => toast.info("CSV export coming next")}
            onPdf={() => downloadFile("/exports/repairs.pdf", "assetflow-repairs-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c}>{c}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={columns.length} />
            ) : list.items.length ? (
              list.items.map((i: AnyObj) => (
                <TableRow key={i.id}>
                  {columns.map((c) => (
                    <TableCell key={c}>{String(i[c] ?? "-")}</TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={columns.length} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}

export function FinancePage() {
  useAuthGuard();
  const { options } = useOptions();
  const list = useApiList(assetflowService.reportDepreciation);
  const purchase = list.items.reduce(
    (s, a) => s + Number(a.purchasePrice || 0),
    0,
  );
  const current = list.items.reduce(
    (s, a) => s + Number(a.currentValue || 0),
    0,
  );
  return (
    <div className="space-y-6">
      <PageHeader
        title="Depreciation & Finance"
        description="Company-wise book value, depreciation and full asset finance history."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="Purchase Value"
          value={money.format(purchase)}
          icon={Wallet}
        />
        <StatCard
          label="Current Book Value"
          value={money.format(current)}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Accumulated Depreciation"
          value={money.format(purchase - current)}
          icon={Wallet}
          tone="warning"
        />
      </div>
      <DataTableShell
        toolbar={
          <Toolbar
            search={list.search}
            setSearch={list.setSearch}
            onCsv={() =>
              downloadFile(
                "/exports/assets.csv",
                "assetflow-finance-assets.csv",
              )
            }
            onPdf={() =>
              downloadFile(
                "/exports/finance.pdf",
                "assetflow-finance-report.html",
              )
            }
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
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Useful Life</TableHead>
              <TableHead>Purchase</TableHead>
              <TableHead>Current</TableHead>
              <TableHead>History</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={8} />
            ) : (
              list.items.map((a) => (
                <TableRow key={a.id || a.assetCode}>
                  <TableCell>
                    {a.company?.code || a.company?.name || "-"}
                  </TableCell>
                  <TableCell>
                    {a.name}
                    <div className="text-xs text-muted-foreground">
                      {a.assetCode}
                    </div>
                  </TableCell>
                  <TableCell>
                    {a.assignedEmployee
                      ? `${a.assignedEmployee.employeeCode || ""} - ${a.assignedEmployee.name}`
                      : "-"}
                  </TableCell>
                  <TableCell>{a.depreciationMethod}</TableCell>
                  <TableCell>{a.usefulLifeYears} years</TableCell>
                  <TableCell>
                    {money.format(Number(a.purchasePrice || 0))}
                  </TableCell>
                  <TableCell>
                    {money.format(Number(a.currentValue || 0))}
                  </TableCell>
                  <TableCell>
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/finance/assets/${a.id}`}>View</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
export function FinanceAssetHistoryPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService
      .assetFinanceHistory(id)
      .then((r) => setData(r.data.data))
      .catch((e) =>
        toast.error(e.response?.data?.message || "History load failed"),
      );
  }, [id]);
  if (!data)
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
          Loading finance history...
        </CardContent>
      </Card>
    );
  const asset = data.asset || {};
  const finance = data.finance || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title={`Finance History: ${asset.assetCode}`}
        description="Purchase, assignment, warranty, depreciation, repair and return history in one place."
        actions={
          <>
            <BackButton fallback="/finance" />
            <Button
              variant="outline"
              onClick={() =>
                downloadFile(
                  `/reports/assets/${id}/history/pdf`,
                  `assetflow-finance-history-${asset.assetCode || id}.html`,
                )
              }
            >
              <FileBarChart className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </>
        }
      />
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          label="Purchase Price"
          value={money.format(Number(finance.purchasePrice || 0))}
          icon={Wallet}
        />
        <StatCard
          label="Current Value"
          value={money.format(Number(finance.currentValue || 0))}
          icon={Wallet}
          tone="success"
        />
        <StatCard
          label="Depreciation"
          value={money.format(Number(finance.accumulatedDepreciation || 0))}
          icon={Wallet}
          tone="warning"
        />
        <StatCard
          label="Warranty Days Left"
          value={finance.warrantyDaysLeft ?? "N/A"}
          icon={ShieldCheck}
          tone={(finance.warrantyDaysLeft || 0) < 30 ? "destructive" : "info"}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Asset Full History Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-3">
          <Field label="Company" value={asset.company?.name} />
          <Field label="Asset" value={`${asset.assetCode} - ${asset.name}`} />
          <Field label="Serial" value={asset.serialNumber} />
          <Field label="Purchase Date" value={finance.purchaseDate} />
          <Field
            label="Useful Life"
            value={`${finance.usefulLifeYears} years`}
          />
          <Field
            label="Estimated Salvage Date"
            value={finance.estimatedSalvageDate}
          />
          <Field label="Age" value={`${finance.ageDays} days`} />
          <Field
            label="Remaining Life"
            value={`${finance.remainingLifeDays} days`}
          />
          <Field
            label="Current Employee"
            value={
              asset.assignedEmployee
                ? `${asset.assignedEmployee.employeeCode || ""} - ${asset.assignedEmployee.name}`
                : "Not assigned"
            }
          />
          <Field label="Warranty Expiry" value={asset.warrantyExpiry} />
          <Field
            label="Salvage Value"
            value={money.format(Number(asset.salvageValue || 0))}
          />
          <Field label="Depreciation Method" value={asset.depreciationMethod} />
        </CardContent>
      </Card>
      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="repairs">Repairs/Upgrades</TabsTrigger>
        </TabsList>
        <TabsContent value="assignments">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Returned At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.assignments?.length ? (
                    data.assignments.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>
                          {x.Employee
                            ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                            : x.employeeId}
                        </TableCell>
                        <TableCell>
                          {x.assignedAt
                            ? new Date(x.assignedAt).toLocaleString()
                            : "-"}
                        </TableCell>
                        <TableCell>{x.conditionAtAssign}</TableCell>
                        <TableCell>
                          {x.returnedAt
                            ? new Date(x.returnedAt).toLocaleString()
                            : "No"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={4} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="returns">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Condition</TableHead>
                    <TableHead>Penalty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.returns?.length ? (
                    data.returns.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>
                          {x.Employee
                            ? `${x.Employee.employeeCode || ""} - ${x.Employee.name}`
                            : x.employeeId}
                        </TableCell>
                        <TableCell>{x.returnStatus}</TableCell>
                        <TableCell>{x.returnCondition}</TableCell>
                        <TableCell>
                          {money.format(Number(x.penaltyAmount || 0))}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={4} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="repairs">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Problem / Upgrade</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.repairs?.length ? (
                    data.repairs.map((x: AnyObj) => (
                      <TableRow key={x.id}>
                        <TableCell>{x.ticketCode}</TableCell>
                        <TableCell>{x.problem}</TableCell>
                        <TableCell>
                          {x.Vendor?.name || x.repairVendorId || "-"}
                        </TableCell>
                        <TableCell>
                          {money.format(Number(x.repairCost || 0))}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={x.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <EmptyRows colSpan={5} />
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}


