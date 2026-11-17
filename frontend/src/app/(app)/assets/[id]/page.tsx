import { AssetDetailPage } from "@/components/pages/assets-page";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetDetailPage id={id} />;
}
