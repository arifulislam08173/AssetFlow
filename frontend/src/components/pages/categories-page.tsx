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

export function CategoriesPage() {
  useAuthGuard();
  const list = useApiList(assetflowService.categories);
  const remove = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await assetflowService.deleteCategory(id);
    toast.success("Category deleted");
    list.refresh();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Asset Categories"
        description="Global asset categories used across all companies/wings. Company is selected when assets are created or assigned."
        // actions={
        //   <PermissionAction permission="categories.create">
        //     <Button asChild>
        //       <Link href="/categories/create">
        //         <Plus className="mr-2 h-4 w-4" />
        //         Add Category
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
            createHref="/categories/create"
            templateUrl={assetflowService.categoryTemplateUrl()}
            onCsv={() => toast.info("Category CSV export will be connected next.")}
            onPdf={() => toast.info("Category PDF export will be connected next.")}
          />
        }
        footer={<Footer meta={list.meta} setMeta={list.setMeta} />}
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.loading ? (
              <LoadingRows colSpan={3} />
            ) : list.items.length ? (
              list.items.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    Available for all company wings and sectors.
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      edit={`/categories/${c.id}/edit`}
                      onDelete={() => remove(c.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <EmptyRows colSpan={3} />
            )}
          </TableBody>
        </Table>
      </DataTableShell>
    </div>
  );
}
function CategoryForm({ id }: { id?: string }) {
  useAuthGuard();
  const router = useRouter();
  const [f, setF] = useState<AnyObj>({ name: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) assetflowService.category(id).then((r) => setF({ name: r.data.data.name || "" }));
  }, [id]);

  const save = async () => {
    try {
      setSaving(true);
      if (id) await assetflowService.updateCategory(id, f);
      else await assetflowService.createCategory(f);
      toast.success("Category saved");
      router.push("/categories");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormShell
      title={id ? "Edit Category" : "Create Category"}
      description="Create global asset categories. Useful life and depreciation are set on the asset itself."
      onSave={save}
      saving={saving}
    >
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Category Name"
          value={f.name}
          onChange={(v) => setF({ ...f, name: v })}
        />
      </div>
    </FormShell>
  );
}
export function CategoryCreatePage() {
  return <CategoryForm />;
}
export function CategoryEditPage() {
  const params = useParams();
  return <CategoryForm id={String(params.id)} />;
}


