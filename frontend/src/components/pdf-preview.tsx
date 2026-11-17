"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Download, FileText, Loader2, Printer, TriangleAlert } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

const allowed = /^\/(?:exports\/[\w-]+\.pdf|(?:purchases|assignments|returns|repairs)\/[a-f\d-]+\/pdf|reports\/assets\/[a-f\d-]+\/history\/pdf)$/;
function safePath(input: string | null): string | null {
  if (!input || input.startsWith("//")) return null;
  try {
    const parsed = new URL(input, "http://assetflow.local");
    if (parsed.origin !== "http://assetflow.local" || !allowed.test(parsed.pathname)) return null;
    return parsed.pathname + parsed.search;
  } catch { return null; }
}
function safeReturn(input: string | null) {
  if (!input || !input.startsWith("/") || input.startsWith("//") || input.startsWith("/pdf-preview")) return "/dashboard";
  return input;
}

export function PdfPreview() {
  const params = useSearchParams();
  const src = safePath(params.get("src"));
  const name = (params.get("name") || "assetflow-report.pdf").replace(/[\\/:*?"<>|]/g, "_").slice(0, 120);
  const from = safeReturn(params.get("from"));
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const blobRef = useRef<Blob | null>(null);
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!src) { setError("Invalid or unsupported PDF path."); setLoading(false); return; }
    const controller = new AbortController();
    let blobUrl = "";
    const load = async () => {
      setLoading(true); setError("");
      try {
        // A JSON POST avoids browser download managers intercepting PDF responses.
        const requestDocument = (token: string) => fetch("/api/pdf-transport", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ src }),
          cache: "no-store",
          signal: controller.signal,
        });
        let token = localStorage.getItem("assetflow_access_token") || "";
        let response = await requestDocument(token);
        // Keep the existing refresh-token workflow for previews of expired sessions.
        if (response.status === 401 && token) {
          try {
            const refreshed = await api.post("/auth/refresh-token");
            const newToken = refreshed.data?.data?.accessToken;
            if (typeof newToken === "string" && newToken) {
              localStorage.setItem("assetflow_access_token", newToken);
              response = await requestDocument(newToken);
            }
          } catch { /* Report the original authentication error below */ }
        }
        const payload = await response.json();
        if (!response.ok) throw new Error(payload?.message || `Document preview failed (HTTP ${response.status})`);
        if (typeof payload?.base64 !== "string" || !payload.base64) throw new Error("The document response was empty.");
        const binary = atob(payload.base64);
        const bytes = new Uint8Array(binary.length);
        for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
        const blob = new Blob([bytes], { type: "application/pdf" });
        if (!(await blob.slice(0, 5).text()).startsWith("%PDF-")) {
          throw new Error("The server did not send a valid PDF. Check the backend export route.");
        }
        if (controller.signal.aborted) return;
        blobRef.current = blob;
        blobUrl = URL.createObjectURL(blob);
        setUrl(blobUrl);
      } catch (e: any) {
        if (controller.signal.aborted) return;
        const message = e instanceof Error ? e.message : "Failed to preview document";
        setError(message);
      } finally { if (!controller.signal.aborted) setLoading(false); }
    };
    load();
    return () => { controller.abort(); blobRef.current = null; if (blobUrl) URL.revokeObjectURL(blobUrl); };
  }, [src]);

  const goBack = () => {
    // Script-created tabs can close and expose the original working page.
    window.close();
    if (!window.closed) window.location.assign(from);
  };
  const save = () => {
    if (!blobRef.current || !url) return;
    const link = document.createElement("a");
    link.href = url;
    link.download = name.endsWith(".pdf") ? name : `${name}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };
  const print = () => {
    if (!url) return;
    try {
      const frame = frameRef.current;
      if (!frame?.contentWindow) throw new Error("Viewer unavailable");
      frame.contentWindow.focus();
      frame.contentWindow.print();
    } catch {
      // PDF browser viewer always has its own Print button as a fallback.
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button onClick={goBack} variant="outline" size="sm"><ArrowLeft className="mr-2 size-4" /> Back</Button>
          <span className="grid size-9 place-items-center rounded-lg bg-teal-50 text-teal-700"><FileText className="size-5"/></span>
          <div className="min-w-0"><div className="truncate font-semibold">{name}</div><div className="text-xs text-slate-500">AssetFlow secure document preview</div></div>
        </div>
        <div className="flex gap-2">
          <Button disabled={!url} variant="outline" onClick={print}><Printer className="mr-2 size-4" /> Print</Button>
          <Button disabled={!url} onClick={save}><Download className="mr-2 size-4" /> Download PDF</Button>
        </div>
      </header>
      <main className="min-h-0 flex-1 p-2 sm:p-4">
        {loading ? <div className="grid h-full place-items-center"><div className="flex items-center gap-3 text-sm text-slate-600"><Loader2 className="size-5 animate-spin"/> Loading secured PDF...</div></div> :
          error ? <div role="alert" className="mx-auto mt-12 flex max-w-lg gap-3 rounded-xl border border-red-200 bg-white p-6 text-sm text-red-700"><TriangleAlert className="size-5 shrink-0"/>{error}</div> :
          <iframe ref={frameRef} title={name} src={url} className="h-full w-full rounded-lg border bg-white shadow-sm" />}
      </main>
    </div>
  );
}
