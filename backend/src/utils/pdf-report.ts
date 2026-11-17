import type { Response } from "express";
import PDFDocument = require("pdfkit");
import { existsSync } from "node:fs";

/** A true, streaming PDF renderer shared by list and document exports. */
export type PdfColumn = {
  title: string;
  weight?: number;
  align?: "left" | "center" | "right";
};
export type PdfSection = {
  title?: string;
  columns: PdfColumn[];
  rows: unknown[][];
};
export type PdfReport = {
  title: string;
  filename: string;
  subtitle?: string;
  summary?: string[];
  details?: Array<[string, unknown]>;
  sections: PdfSection[];
  landscape?: boolean;
};

const C = {
  navy: "#0F2438",
  teal: "#087F76",
  pale: "#EAF7F4",
  slate: "#536477",
  border: "#DDE7EA",
  alt: "#F7FAFB",
  white: "#FFFFFF",
};
const LEFT = 34;
const RIGHT = 34;
const TABLE_PAD = 5;
const CELL_LINE_GAP = 1.5;

function value(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value);
}

function fontPaths() {
  const custom = process.env.ASSETFLOW_PDF_FONT_PATH;
  const customBold = process.env.ASSETFLOW_PDF_BOLD_FONT_PATH;
  return {
    regular: custom && existsSync(custom) ? custom : "Helvetica",
    bold: customBold && existsSync(customBold) ? customBold : "Helvetica-Bold",
  };
}

function textLines(doc: PDFKit.PDFDocument, input: unknown, maxWidth: number): string[] {
  const source = value(input).replace(/\r/g, "");
  const lines: string[] = [];
  for (const paragraph of source.split("\n")) {
    let line = "";
    for (const token of paragraph.split(/\s+/).filter(Boolean)) {
      const candidates: string[] = [];
      if (doc.widthOfString(token) <= maxWidth) candidates.push(token);
      else {
        // Break exceptionally long identifiers / URLs instead of clipping them.
        let piece = "";
        for (const char of token) {
          if (piece && doc.widthOfString(piece + char) > maxWidth) {
            candidates.push(piece);
            piece = char;
          } else piece += char;
        }
        if (piece) candidates.push(piece);
      }
      for (const candidate of candidates) {
        const next = line ? `${line} ${candidate}` : candidate;
        if (line && doc.widthOfString(next) > maxWidth) {
          lines.push(line);
          line = candidate;
        } else line = next;
      }
    }
    lines.push(line || " ");
  }
  return lines;
}

export function sendPdfReport(res: Response, report: PdfReport): void {
  const fonts = fontPaths();
  const doc = new PDFDocument({
    size: "A4",
    layout: report.landscape ? "landscape" : "portrait",
    margins: { top: 108, bottom: 62, left: LEFT, right: RIGHT },
    bufferPages: true,
    compress: true,
    info: { Title: report.title, Author: "AssetFlow", Subject: report.subtitle || "Asset management report" },
  });
  doc.on("error", (error) => res.destroy(error));
  const contentWidth = doc.page.width - LEFT - RIGHT;
  const bottomLimit = () => doc.page.height - 61;
  let currentY = 113;
  const regular = fonts.regular;
  const bold = fonts.bold;

  function pageHeader() {
    const w = doc.page.width;
    doc.save();
    doc.rect(0, 0, w, 79).fill(C.navy);
    doc.rect(0, 76, w, 3).fill(C.teal);
    doc.fillColor(C.white).font(bold).fontSize(20).text("AssetFlow", LEFT, 19, { lineBreak: false });
    doc.fillColor("#BADEDA").font(regular).fontSize(8).text("ASSET MANAGEMENT  /  REPORTING", LEFT, 47, { lineBreak: false });
    doc.fillColor("#D9E5E8").fontSize(7.5).text(new Date().toLocaleString("en-GB", { timeZone: "Asia/Dhaka", hour12: false }), w - 204, 44, { width: 170, align: "right", lineBreak: false });
    doc.restore();
    currentY = 109;
  }
  doc.on("page", pageHeader);
  pageHeader();

  function nextPage() {
    doc.addPage();
    // The page event paints the repeating brand and resets currentY.
  }

  function ensureSpace(height: number) {
    if (currentY + height > bottomLimit()) nextPage();
  }

  function sectionTitle(title: string) {
    ensureSpace(34);
    doc.fillColor(C.navy).font(bold).fontSize(11).text(title, LEFT, currentY, { width: contentWidth, lineBreak: false });
    currentY += 19;
    doc.moveTo(LEFT, currentY).lineTo(LEFT + contentWidth, currentY).lineWidth(0.6).strokeColor(C.border).stroke();
    currentY += 10;
  }

  doc.font(bold).fillColor(C.navy).fontSize(16);
  const titleH = doc.heightOfString(report.title, { width: contentWidth });
  ensureSpace(titleH + 16);
  doc.text(report.title, LEFT, currentY, { width: contentWidth });
  currentY += titleH + 8;
  if (report.subtitle) {
    doc.font(regular).fillColor(C.slate).fontSize(8.5);
    const h = doc.heightOfString(report.subtitle, { width: contentWidth });
    ensureSpace(h + 12);
    doc.text(report.subtitle, LEFT, currentY, { width: contentWidth });
    currentY += h + 12;
  } else currentY += 8;

  if (report.summary?.length) {
    const lines = report.summary.map(value);
    doc.font(bold).fontSize(8.5);
    const maxH = Math.max(...lines.map((item) => doc.heightOfString(item, { width: contentWidth / lines.length - 24 })));
    const height = Math.max(49, maxH + 22);
    ensureSpace(height + 17);
    doc.roundedRect(LEFT, currentY, contentWidth, height, 8).fill(C.pale);
    const piece = contentWidth / lines.length;
    for (let i = 0; i < lines.length; i++) {
      doc.fillColor(C.teal).font(bold).fontSize(9).text(lines[i], LEFT + i * piece + 12, currentY + 12, { width: piece - 24 });
    }
    currentY += height + 17;
  }

  if (report.details?.length) {
    sectionTitle("REPORT DETAILS");
    const half = (contentWidth - 10) / 2;
    for (let i = 0; i < report.details.length; i += 2) {
      const pair = report.details.slice(i, i + 2);
      doc.font(regular).fontSize(9);
      const cellHeight = Math.max(47, ...pair.map(([, v]) => doc.heightOfString(value(v), { width: half - 26 }) + 28));
      ensureSpace(cellHeight + 9);
      for (let j = 0; j < pair.length; j++) {
        const [label, data] = pair[j];
        const x = LEFT + j * (half + 10);
        doc.roundedRect(x, currentY, half, cellHeight, 6).fillAndStroke(C.alt, C.border);
        doc.font(bold).fontSize(7).fillColor(C.slate).text(value(label).toUpperCase(), x + 11, currentY + 9, { width: half - 22 });
        doc.font(regular).fontSize(9).fillColor(C.navy).text(value(data), x + 11, currentY + 23, { width: half - 22 });
      }
      currentY += cellHeight + 9;
    }
    currentY += 6;
  }

  for (const section of report.sections) {
    if (section.title) sectionTitle(section.title);
    const columns = section.columns;
    if (!columns.length) continue;
    const totalWeight = columns.reduce((s, c) => s + (c.weight || 1), 0);
    const widths = columns.map((c) => contentWidth * (c.weight || 1) / totalWeight);
    const xCoords = widths.map((_, i) => LEFT + widths.slice(0, i).reduce((a, b) => a + b, 0));
    const fontSize = columns.length >= 11 ? 6.5 : columns.length >= 8 ? 7.1 : 8;
    const fontHeight = fontSize * 1.22 + CELL_LINE_GAP;

    function tableHeader() {
      doc.font(bold).fontSize(fontSize).fillColor(C.white);
      const wraps = columns.map((c, i) => textLines(doc, c.title, widths[i] - TABLE_PAD * 2));
      const maxLines = Math.max(...wraps.map((line) => line.length));
      const h = Math.max(28, maxLines * fontHeight + TABLE_PAD * 2);
      ensureSpace(h + fontHeight * 2 + TABLE_PAD * 2);
      doc.rect(LEFT, currentY, contentWidth, h).fill(C.teal);
      columns.forEach((c, i) => {
        doc.fillColor(C.white).font(bold).fontSize(fontSize)
          .text(wraps[i].join("\n"), xCoords[i] + TABLE_PAD, currentY + TABLE_PAD, {
            width: widths[i] - TABLE_PAD * 2,
            align: c.align || "left", lineGap: CELL_LINE_GAP,
          });
      });
      currentY += h;
    }

    tableHeader();
    const rows = section.rows.length ? section.rows : [["No records found", ...Array(Math.max(columns.length - 1, 0)).fill("")]];
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
      doc.font(regular).fontSize(fontSize);
      const row = rows[rowIndex];
      const wraps = columns.map((_, i) => textLines(doc, row[i], widths[i] - TABLE_PAD * 2));
      let offset = 0;
      const longest = Math.max(...wraps.map((line) => line.length));
      while (offset < longest) {
        if (currentY + fontHeight + TABLE_PAD * 2 > bottomLimit()) {
          nextPage();
          tableHeader();
        }
        const available = bottomLimit() - currentY - TABLE_PAD * 2;
        const maxLines = Math.max(1, Math.floor(available / fontHeight));
        const count = Math.min(maxLines, longest - offset);
        const h = count * fontHeight + TABLE_PAD * 2;
        doc.rect(LEFT, currentY, contentWidth, h)
          .fill(rowIndex % 2 === 0 ? C.white : C.alt);
        let leftX = LEFT;
        columns.forEach((c, i) => {
          doc.font(regular).fontSize(fontSize).fillColor(C.navy)
            .text(wraps[i].slice(offset, offset + count).join("\n"), leftX + TABLE_PAD, currentY + TABLE_PAD, {
              width: widths[i] - TABLE_PAD * 2,
              align: c.align || "left", lineGap: CELL_LINE_GAP,
            });
          leftX += widths[i];
        });
        doc.moveTo(LEFT, currentY + h).lineTo(LEFT + contentWidth, currentY + h)
          .lineWidth(0.4).strokeColor(C.border).stroke();
        currentY += h;
        offset += count;
        if (offset < longest) {
          nextPage();
          tableHeader();
        }
      }
    }
    currentY += 18;
  }

  // Buffered page pass, for accurate page X of Y numbering.
  const { start, count } = doc.bufferedPageRange();
  for (let i = start; i < start + count; i++) {
    doc.switchToPage(i);
    const y = doc.page.height - 37;
    // Footer is deliberately outside the content margin; temporarily relax it
    // to prevent PDFKit from adding an unwanted extra page while drawing text.
    const previousBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;
    doc.moveTo(LEFT, y - 10).lineTo(doc.page.width - RIGHT, y - 10)
      .lineWidth(0.6).strokeColor(C.border).stroke();
    doc.font(regular).fontSize(7).fillColor(C.slate)
      .text("AssetFlow  |  Confidential business report", LEFT, y, { lineBreak: false });
    doc.text(`Page ${i - start + 1} of ${count}`, doc.page.width - RIGHT - 110, y, {
      width: 110, align: "right", lineBreak: false,
    });
    doc.page.margins.bottom = previousBottom;
  }
  const filename = report.filename.replace(/[^A-Za-z0-9_.-]/g, "_").replace(/\.+/g, ".");
  res.status(200);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename.endsWith(".pdf") ? filename : filename + ".pdf"}"`);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  doc.pipe(res);
  doc.end();
}

export function pdfMoney(amount: unknown): string {
  return `BDT ${Number(amount || 0).toLocaleString("en-BD", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
}
