import { AssetQrLabel } from "@/components/asset-qr-label";

export default async function AssetQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AssetQrLabel id={id} />;
}
