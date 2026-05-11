import { AssetDetailPage } from "@/components/pages/app-pages";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailPage id={id} />;
}
