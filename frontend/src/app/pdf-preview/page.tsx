import { Suspense } from "react";
import { PdfPreview } from "@/components/pdf-preview";

export default function PdfPreviewRoute() {
  return <Suspense fallback={<main className="p-8 text-sm">Opening document preview...</main>}><PdfPreview /></Suspense>;
}
