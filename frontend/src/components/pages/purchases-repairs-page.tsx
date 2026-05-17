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


export function RepairDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [data, setData] = useState<AnyObj | null>(null);
  useEffect(() => {
    assetflowService.repair(id).then((r) => setData(r.data.data));
  }, [id]);
  if (!data) return <Card><CardContent className="p-8 text-center">Loading repair...</CardContent></Card>;
  const asset = data.Asset || {};
  const vendor = data.Vendor || {};
  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair / Upgrade Details"
        description="Repair, warranty claim or upgrade record."
        actions={
          <>
            <BackButton fallback="/repairs" />
            <Button variant="outline" onClick={() => downloadFile(`/repairs/${id}/pdf`, `repair-${id}.html`)}>PDF</Button>
            <Button asChild><Link href={`/repairs/${id}/edit`}>Edit</Link></Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Ticket" value={data.ticketCode} />
          <Field label="Asset" value={`${asset.assetCode || ""} - ${asset.name || ""}`} />
          <Field label="Vendor" value={vendor.name} />
          <Field label="Cost" value={money.format(Number(data.repairCost || 0))} />
          <Field label="Status" value={data.status} />
          <Field label="Problem / Upgrade" value={data.problem} />
        </CardContent>
      </Card>
    </div>
  );
}

export function RepairEditPage() {
  useAuthGuard();
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);
  const [assets, setAssets] = useState<AnyObj[]>([]);
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({ ticketCode: "", assetId: "", problem: "", repairVendorId: "", repairCost: 0, status: "Open" });
  useEffect(() => {
    assetflowService.assets({ limit: 200 }).then((r) => setAssets(r.data.data || []));
    assetflowService.repair(id).then((r) => setF({
      ticketCode: r.data.data.ticketCode || "",
      assetId: r.data.data.assetId || r.data.data.Asset?.id || "",
      problem: r.data.data.problem || "",
      repairVendorId: r.data.data.repairVendorId || r.data.data.Vendor?.id || "",
      repairCost: Number(r.data.data.repairCost || 0),
      status: r.data.data.status || "Open",
    }));
  }, [id]);
  const save = async () => {
    await assetflowService.updateRepair(id, { ...f, repairCost: Number(f.repairCost || 0), repairVendorId: f.repairVendorId || null });
    toast.success("Repair ticket updated");
    router.push("/repairs");
  };
  return (
    <FormShell title="Edit Repair / Upgrade Ticket" description="Update repair, warranty claim or upgrade record." onSave={save}>
      <div className="grid gap-4 md:grid-cols-2">
        <InputField label="Ticket Code" value={f.ticketCode} onChange={(v) => setF({ ...f, ticketCode: v })} />
        <SelectIdField label="Asset" value={f.assetId} onChange={(v) => setF({ ...f, assetId: v })} items={assets} labelKey="asset" />
        <SelectIdField label="Repair Vendor" value={f.repairVendorId} onChange={(v) => setF({ ...f, repairVendorId: v })} items={options.vendors} />
        <NumberField label="Repair Cost" value={f.repairCost} onChange={(v) => setF({ ...f, repairCost: v })} />
        <SelectField label="Status" value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["Open", "Diagnosed", "Sent to Vendor", "Under Repair", "Waiting for Parts", "Completed", "Returned", "Cancelled"]} />
        <div className="md:col-span-2"><TextAreaField label="Problem / Upgrade Details" value={f.problem} onChange={(v) => setF({ ...f, problem: v })} /></div>
      </div>
    </FormShell>
  );
}


export function PurchasesPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.purchases);

  const remove = async (id: string) => {
    if (!confirm("Delete this purchase?")) return;
    await assetflowService.deletePurchase(id);
    toast.success("Purchase deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Management"
        description="Company-wise invoice and purchase records with view, edit, delete and printable PDF actions."
        // actions={
        //   <PermissionAction permission="purchases.create">
        //     <Button asChild>
        //       <Link href="/purchases/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add Purchase
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
            createHref="/purchases/create"
            onCsv={() => toast.info("Purchase CSV export coming next")}
            onPdf={() => downloadFile("/exports/purchases.pdf", "assetflow-purchases-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>Total Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={7} />
            ) : list.items.length ? (
              list.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.company?.code || p.company?.name || "-"}</TableCell>
                  <TableCell className="font-medium">{p.invoiceNumber}</TableCell>
                  <TableCell>{p.Vendor?.name || p.vendor?.name || "-"}</TableCell>
                  <TableCell>{p.purchaseDate}</TableCell>
                  <TableCell>{money.format(Number(p.totalAmount || 0))}</TableCell>
                  <TableCell><StatusBadge status={p.paymentStatus} /></TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/purchases/${p.id}`}
                      edit={`/purchases/${p.id}/edit`}
                      pdfPath={`/purchases/${p.id}/pdf`}
                      pdfName={`purchase-${p.invoiceNumber || p.id}.html`}
                      onDelete={() => remove(p.id)}
                    />
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

function PurchaseFormPage({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    companyId: "",
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    vendorId: "",
    purchaseDate: new Date().toISOString().slice(0, 10),
    totalAmount: 0,
    paymentStatus: "Paid",
  });

  useEffect(() => {
    if (!id) return;
    assetflowService.purchase(id).then((res) => {
      const item = res.data.data || {};
      setF({
        companyId: item.companyId || item.company?.id || "",
        invoiceNumber: item.invoiceNumber || "",
        vendorId: item.vendorId || item.Vendor?.id || "",
        purchaseDate: item.purchaseDate || new Date().toISOString().slice(0, 10),
        totalAmount: Number(item.totalAmount || 0),
        paymentStatus: item.paymentStatus || "Paid",
      });
    });
  }, [id]);

  useEffect(() => {
    setF((x) => ({
      ...x,
      companyId: x.companyId || options.companies[0]?.id || "",
      vendorId: x.vendorId || options.vendors[0]?.id || "",
    }));
  }, [options.companies.length, options.vendors.length]);

  const save = async () => {
    const payload = { ...f, totalAmount: Number(f.totalAmount || 0) };
    if (id) await assetflowService.updatePurchase(id, payload);
    else await assetflowService.createPurchase(payload);
    toast.success(id ? "Purchase updated" : "Purchase created");
    router.push("/purchases");
  };

  return (
    <FormShell
      title={id ? "Edit Purchase" : "Create Purchase"}
      description="Record vendor invoice and payment status. Purchase-to-asset generation comes next."
      onSave={save}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SelectIdField label="Company" value={f.companyId} onChange={(v) => setF({ ...f, companyId: v })} items={options.companies} />
        <InputField label="Invoice Number" value={f.invoiceNumber} onChange={(v) => setF({ ...f, invoiceNumber: v })} />
        <SelectIdField label="Vendor" value={f.vendorId} onChange={(v) => setF({ ...f, vendorId: v })} items={options.vendors.filter((v) => !f.companyId || v.companyId === f.companyId)} />
        <InputField label="Purchase Date" value={f.purchaseDate} onChange={(v) => setF({ ...f, purchaseDate: v })} type="date" />
        <NumberField label="Total Amount" value={f.totalAmount} onChange={(v) => setF({ ...f, totalAmount: v })} />
        <SelectField label="Payment Status" value={f.paymentStatus} onChange={(v) => setF({ ...f, paymentStatus: v })} options={["Paid", "Pending", "Partial"]} />
      </div>
    </FormShell>
  );
}

export function PurchaseCreatePage() {
  return <PurchaseFormPage />;
}

export function PurchaseEditPage() {
  const params = useParams();
  return <PurchaseFormPage id={String(params.id)} />;
}

export function PurchaseDetailPage() {
  useAuthGuard();
  const params = useParams();
  const id = String(params.id);
  const [item, setItem] = useState<AnyObj | null>(null);

  useEffect(() => {
    assetflowService.purchase(id).then((res) => setItem(res.data.data));
  }, [id]);

  if (!item) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">Loading purchase...</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Purchase ${item.invoiceNumber}`}
        description="Vendor invoice and payment information."
        actions={
          <>
            <BackButton fallback="/purchases" />
            <Button variant="outline" onClick={() => downloadFile(`/purchases/${id}/pdf`, `purchase-${item.invoiceNumber}.html`)}>
              <FileBarChart className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
            <Button asChild>
              <Link href={`/purchases/${id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          </>
        }
      />
      <Card>
        <CardContent className="grid gap-5 p-6 md:grid-cols-3">
          <Field label="Company" value={item.company?.name || item.Company?.name} />
          <Field label="Invoice" value={item.invoiceNumber} />
          <Field label="Vendor" value={item.Vendor?.name || item.vendor?.name} />
          <Field label="Purchase Date" value={item.purchaseDate} />
          <Field label="Total Amount" value={money.format(Number(item.totalAmount || 0))} />
          <Field label="Payment Status" value={item.paymentStatus} />
        </CardContent>
      </Card>
    </div>
  );
}

export function RepairsPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.repairs);

  const remove = async (id: string) => {
    if (!confirm("Delete this repair ticket?")) return;
    await assetflowService.deleteRepair(id);
    toast.success("Repair ticket deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Repair & Upgrade"
        description="Repair tickets, warranty claims, and upgrade tracking with actions and PDF export."
        // actions={
        //   <PermissionAction permission="repairs.create">
        //     <Button asChild>
        //       <Link href="/repairs/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add New
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
            createHref="/repairs/create"
            onCsv={() => toast.info("Repair CSV export coming next")}
            onPdf={() => downloadFile("/exports/repairs.pdf", "assetflow-repairs-report.html")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Problem / Upgrade</TableHead>
              <TableHead>Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={6} />
            ) : list.items.length ? (
              list.items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.ticketCode}</TableCell>
                  <TableCell>{r.Asset ? `${r.Asset.assetCode} - ${r.Asset.name}` : r.assetId}</TableCell>
                  <TableCell>{r.problem}</TableCell>
                  <TableCell>{money.format(Number(r.repairCost || 0))}</TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      view={`/repairs/${r.id}`}
                      edit={`/repairs/${r.id}/edit`}
                      pdfPath={`/repairs/${r.id}/pdf`}
                      pdfName={`repair-${r.id}.html`}
                      onDelete={() => remove(r.id)}
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
export function RepairCreatePage() {
  useAuthGuard();
  const router = useRouter();
  const [assets, setAssets] = useState<AnyObj[]>([]);
  const { options } = useOptions();
  const [f, setF] = useState<AnyObj>({
    ticketCode: `RPR-${Date.now().toString().slice(-5)}`,
    assetId: "",
    problem: "",
    repairVendorId: "",
    repairCost: 0,
    status: "Open",
  });
  useEffect(() => {
    assetflowService
      .assets({ limit: 200 })
      .then((r) => setAssets(r.data.data || []));
  }, []);
  const save = async () => {
    await assetflowService.createRepair({
      ...f,
      repairCost: Number(f.repairCost || 0),
      repairVendorId: f.repairVendorId || null,
    });
    toast.success("Repair ticket created");
    router.push("/repairs");
  };
  return (
    <FormShell
      title="Create Repair / Upgrade Ticket"
      description="Track repair, maintenance or upgrade costs."
      onSave={save}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Ticket Code"
          value={f.ticketCode}
          onChange={(v) => setF({ ...f, ticketCode: v })}
        />
        <SelectIdField
          label="Asset"
          value={f.assetId}
          onChange={(v) => setF({ ...f, assetId: v })}
          items={assets}
          labelKey="asset"
        />
        <SelectIdField
          label="Repair Vendor"
          value={f.repairVendorId}
          onChange={(v) => setF({ ...f, repairVendorId: v })}
          items={options.vendors}
        />
        <NumberField
          label="Repair Cost"
          value={f.repairCost}
          onChange={(v) => setF({ ...f, repairCost: v })}
        />
        <SelectField
          label="Status"
          value={f.status}
          onChange={(v) => setF({ ...f, status: v })}
          options={[
            "Open",
            "Diagnosed",
            "Sent to Vendor",
            "Under Repair",
            "Waiting for Parts",
            "Completed",
            "Returned",
            "Cancelled",
          ]}
        />
        <div className="md:col-span-2">
          <TextAreaField
            label="Problem / Upgrade Details"
            value={f.problem}
            onChange={(v) => setF({ ...f, problem: v })}
          />
        </div>
      </div>
    </FormShell>
  );
}

