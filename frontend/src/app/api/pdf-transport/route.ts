import { NextRequest, NextResponse } from "next/server";

/**
 * PDF fetches happen on the Next.js server rather than in the user's browser.
 * Returning JSON (not a .pdf GET / attachment) avoids download managers
 * intercepting an authenticated document-preview request.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_PDF_BYTES = 30 * 1024 * 1024;
const ALLOWED = /^\/(?:exports\/[\w-]+\.pdf|(?:purchases|assignments|returns|repairs)\/[a-f\d-]+\/pdf|reports\/assets\/[a-f\d-]+\/history\/pdf)$/;

function secureDocumentPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048 || value.startsWith("//")) return null;
  try {
    const parsed = new URL(value, "http://assetflow.internal");
    if (parsed.origin !== "http://assetflow.internal" || !ALLOWED.test(parsed.pathname)) return null;
    return parsed.pathname + parsed.search;
  } catch { return null; }
}

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer\s+[^\s]+$/.test(authorization)) {
    return NextResponse.json({ message: "Sign in to preview this document." }, { status: 401 });
  }
  let src: string | null = null;
  try { src = secureDocumentPath((await request.json())?.src); }
  catch { /* invalid request */ }
  if (!src) return NextResponse.json({ message: "Unsupported document path." }, { status: 400 });

  const baseUrl = process.env.ASSETFLOW_BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
  let base: URL;
  try {
    base = new URL(baseUrl);
    if (!(["http:", "https:"].includes(base.protocol)) || base.username || base.password) throw new Error("Invalid backend API URL");
  } catch {
    return NextResponse.json({ message: "Backend API is not configured correctly." }, { status: 500 });
  }

  try {
    const upstream = await fetch(`${base.toString().replace(/\/+$/, "")}${src}`, {
      method: "GET",
      headers: { Authorization: authorization, Accept: "application/pdf" },
      cache: "no-store",
      redirect: "manual",
      signal: AbortSignal.timeout(60_000),
    });
    if (!upstream.ok) {
      let message = `Document service returned HTTP ${upstream.status}.`;
      try {
        const body = await upstream.json();
        if (typeof body?.message === "string") message = body.message;
      } catch { /* PDF service might return an error with no JSON body */ }
      return NextResponse.json({ message }, { status: upstream.status >= 400 && upstream.status <= 599 ? upstream.status : 502 });
    }
    const length = Number(upstream.headers.get("content-length") || 0);
    if (length > MAX_PDF_BYTES) return NextResponse.json({ message: "Document is too large for preview." }, { status: 413 });
    const buffer = Buffer.from(await upstream.arrayBuffer());
    if (!buffer.length || buffer.length > MAX_PDF_BYTES) {
      return NextResponse.json({ message: "The document is empty or exceeds the 30 MB preview limit." }, { status: 413 });
    }
    if (buffer.toString("ascii", 0, 5) !== "%PDF-") {
      return NextResponse.json({ message: "Backend returned an invalid PDF document." }, { status: 502 });
    }
    return NextResponse.json(
      { base64: buffer.toString("base64") },
      { headers: { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } },
    );
  } catch (error) {
    const reason = error instanceof Error && error.name === "TimeoutError" ? "PDF generation timed out." : "Cannot reach the document service. Check that the AssetFlow backend is running.";
    return NextResponse.json({ message: reason }, { status: 502 });
  }
}
