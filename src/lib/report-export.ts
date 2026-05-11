/* CSV + PNG export helpers used by the Reports page.
 * No new server endpoints — everything runs client-side.
 */

function csvCell(v: unknown): string {
  if (v == null) return "";
  const s = typeof v === "string" ? v : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (typeof window === "undefined") return;
  if (rows.length === 0) {
    // still emit an empty file so the user gets feedback
    const blob = new Blob([""], { type: "text/csv;charset=utf-8" });
    triggerDownload(blob, filename);
    return;
  }
  const headers = Array.from(
    rows.reduce<Set<string>>((s, r) => {
      Object.keys(r).forEach((k) => s.add(k));
      return s;
    }, new Set<string>()),
  );
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(headers.map((h) => csvCell(r[h])).join(","));
  }
  const blob = new Blob(["\uFEFF" + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  triggerDownload(blob, filename);
}

export async function downloadPng(node: HTMLElement | null, filename: string): Promise<void> {
  if (typeof window === "undefined" || !node) return;
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
        style: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  });
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/** Render a DOM node to an A4 landscape PDF and trigger a download.
 *  Uses html-to-image to capture the node, then jspdf to embed it on a single page.
 *  Honours the node's intrinsic aspect ratio (we already render the certificate as 1.414:1). */
export async function downloadPdfFromNode(
  node: HTMLElement | null,
  filename: string,
): Promise<void> {
  if (typeof window === "undefined" || !node) return;
  const [{ toPng }, { jsPDF }] = await Promise.all([
    import("html-to-image"),
    import("jspdf"),
  ]);
  const dataUrl = await toPng(node, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: "#ffffff",
    style: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  });

  const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const img = new Image();
  img.src = dataUrl;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image_load_failed"));
  });

  const imgRatio = img.height > 0 ? img.width / img.height : pageW / pageH;
  const pageRatio = pageW / pageH;
  /** When captured ratio ~= A4 landscape, rounding can leave a lone letterbox stripe after print preview. */
  const aspectSlack = Math.abs(imgRatio / pageRatio - 1) <= 0.012;

  let drawW: number;
  let drawH: number;
  if (aspectSlack) {
    drawW = pageW;
    drawH = pageH;
  } else if (imgRatio > pageRatio) {
    drawW = pageW;
    drawH = pageW / imgRatio;
  } else {
    drawH = pageH;
    drawW = pageH * imgRatio;
  }

  /** Cover fit: enlarge slightly past the page rect so fractional-mm gaps disappear in viewers / printers. */
  const bleedMm = aspectSlack ? 0 : 0.35;
  drawW += bleedMm * 2;
  drawH += bleedMm * 2;
  const x = Math.round(((pageW - drawW) / 2) * 1000) / 1000;
  const y = Math.round(((pageH - drawH) / 2) * 1000) / 1000;

  pdf.addImage(dataUrl, "PNG", x, y, drawW, drawH, undefined, "SLOW");
  pdf.save(filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function slugifyForFile(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}