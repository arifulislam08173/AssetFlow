"use client";

import { toast } from "sonner";
import { api } from "@/lib/api";

const isPdfPath = (path: string) => /\.pdf(?:\?|$)|\/pdf(?:\?|$)/i.test(path);

/** Authenticated PDF requests are viewed in an AssetFlow tab, never exposed as public links. */
export function openPdfPreview(path: string, filename = "assetflow-document.pdf") {
  if (typeof window === "undefined") return;
  const source = path.split("?")[0];
  const approved = /^\/(?:exports\/[\w-]+\.pdf|(?:purchases|assignments|returns|repairs)\/[a-f\d-]+\/pdf|reports\/assets\/[a-f\d-]+\/history\/pdf)$/.test(source);
  if (!approved) {
    toast.error("This document location is not available for preview.");
    return;
  }
  const query = new URLSearchParams({
    src: path,
    name: filename.endsWith(".pdf") ? filename : `${filename}.pdf`,
    from: window.location.pathname + window.location.search,
  });
  const preview = `/pdf-preview?${query.toString()}`;
  const tab = window.open(preview, "_blank");
  if (tab) tab.opener = null;
  // If popups are blocked, navigate in the current tab; the Back button still returns safely.
  if (!tab) window.location.assign(preview);
}

/** CSV and other downloads remain direct; every PDF opens a preview with print/download. */
export async function downloadFile(path: string, requestedName: string): Promise<void> {
  if (isPdfPath(path)) {
    openPdfPreview(path, requestedName);
    return;
  }
  try {
    const response = await api.get<Blob>(path, { responseType: "blob" });
    const blob = response.data;
    const contentType = String(response.headers["content-type"] || "").toLowerCase();
    if (!(blob instanceof Blob) || !blob.size) throw new Error("The export returned an empty file.");
    if (/\.csv(?:\?|$)/i.test(path) && !/csv|octet-stream/.test(contentType)) {
      throw new Error("The server did not return a CSV file.");
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = requestedName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    toast.success("Download started");
  } catch (error: any) {
    const body = error?.response?.data;
    let message = error?.message || "Download failed";
    if (body instanceof Blob && body.type.includes("json")) {
      try { message = JSON.parse(await body.text()).message || message; } catch { /* use fallback */ }
    }
    toast.error(message);
  }
}
