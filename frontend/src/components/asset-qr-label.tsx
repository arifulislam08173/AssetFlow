"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2, Printer, QrCode } from "lucide-react";
import { assetflowService } from "@/services/assetflow.service";
import { Button } from "@/components/ui/button";

/** A clean square label. Print CSS hides all other interface components. */
export function AssetQrLabel({ id }: { id: string }) {
  const [dataUri, setDataUri] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetCode, setAssetCode] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    Promise.all([assetflowService.assetQr(id), assetflowService.asset(id)])
      .then(([qr, asset]) => { if (active) { setDataUri(qr.data.data.qr); setAssetName(asset.data.data.name); setAssetCode(asset.data.data.assetCode); } })
      .catch((e) => { if (active) setError(e.response?.data?.message || "Unable to load QR label. Please log in again if your session expired."); });
    return () => { active = false; };
  }, [id]);

  const saveImage = async (format: "png" | "jpeg") => {
    if (!dataUri) return;
    try {
      const image = new Image();
      image.src = dataUri;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is unavailable");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 1200, 1200);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(image, 50, 50, 1100, 1100);
      const a = document.createElement("a");
      a.href = canvas.toDataURL(`image/${format}`, 0.95);
      a.download = `${(assetCode || "asset").replace(/[^a-zA-Z0-9_-]/g, "-")}-qr.${format === "jpeg" ? "jpg" : "png"}`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch { setError("Could not generate the image file."); }
  };
  const back = () => {
    window.close();
    if (!window.closed) window.location.assign(`/assets/${encodeURIComponent(id)}`);
  };
  return (
    <div className="qr-root flex min-h-screen flex-col bg-slate-100 text-slate-900">
      <style>{`@page { size: 50mm 50mm; margin: 0; } @media print { html, body, .qr-root { margin: 0 !important; padding: 0 !important; width: 50mm !important; height: 50mm !important; background: white !important; } .qr-no-print { display: none !important; } .qr-print-stage { box-shadow: none !important; border: 0 !important; padding: 0 !important; margin: 0 !important; width: 50mm !important; height: 50mm !important; display:flex !important; align-items:center !important; justify-content:center !important; } .qr-only-image { width: 44mm !important; height: 44mm !important; object-fit:contain !important; padding: 0 !important; border:0 !important; image-rendering:pixelated; } }`}</style>
      <header className="qr-no-print flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4 sm:px-8">
        <div className="flex items-center gap-3"><Button variant="outline" size="sm" onClick={back}><ArrowLeft className="mr-2 size-4"/> Back</Button><QrCode className="size-6 text-teal-700"/><div><div className="font-semibold">Asset QR Label</div><div className="text-xs text-slate-500">{assetName || "AssetFlow"} · {assetCode}</div></div></div>
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={!dataUri} onClick={() => saveImage("png")}><Download className="mr-2 size-4"/> PNG</Button><Button variant="outline" disabled={!dataUri} onClick={() => saveImage("jpeg")}><Download className="mr-2 size-4"/> JPG</Button><Button disabled={!dataUri} onClick={() => window.print()}><Printer className="mr-2 size-4"/> Print QR</Button></div>
      </header>
      <div className="qr-no-print mx-auto max-w-xl px-4 pt-8 text-center text-sm text-slate-600">Prints only the QR square on a 50 × 50 mm label. Use 100% scale and disable printer headers/footers for an exact-fit label.</div>
      {error && <p role="alert" className="qr-no-print mt-4 text-center text-red-600">{error}</p>}
      <main className="flex flex-1 items-start justify-center p-8 qr-print-stage">
        <div className="qr-print-stage grid size-64 place-items-center rounded-xl border bg-white p-3 shadow-sm">
          {dataUri ? <img src={dataUri} alt={`QR code for ${assetCode}`} className="qr-only-image size-56 object-contain"/> : <Loader2 className="qr-no-print size-6 animate-spin text-slate-400"/>}
        </div>
      </main>
    </div>
  );
}
