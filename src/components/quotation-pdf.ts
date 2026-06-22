// quotation-pdf.ts
// Generates a branded PDF for a formal quotation.
// Uses html-to-image to rasterise an off-screen DOM node, then jsPDF to embed
// the image — same approach already used in project-export.ts.

import { toPng } from "html-to-image";
import jsPDF from "jspdf";
import type { Quotation } from "@/lib/quotes-store";
import type { ContactInfo } from "@/lib/site-store";

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

function todayStr(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── DOM template builder ──────────────────────────────────────────────────────
// We create an off-screen <div>, style it like a printed page (A4 proportions
// at 2× scale = 1587 × 2245 px), capture it with html-to-image, then drop the
// PNG into jsPDF.  We do NOT mount it into <body> visibly — we attach it to a
// hidden container and remove it when done.

function buildTemplate(
  q: Quotation,
  contact: ContactInfo,
  logoDataUrl: string | null
): HTMLDivElement {
  const ORANGE = "#f97316";
  const BG = "#ffffff";
  const TEXT = "#111827";
  const MUTED = "#6b7280";
  const BORDER = "#e5e7eb";
  const CALLOUT_BG = "#fff7ed";
  const CALLOUT_BORDER = "#fed7aa";

  const W = 1587; // px at 2× A4 width (794pt × 2)
  // We let height be auto so long content doesn't clip.

  const rows = q.line_items
    .map(
      (item, i) => `
      <tr style="border-bottom:1px solid ${BORDER};">
        <td style="padding:10px 14px;color:${MUTED};font-size:13px;text-align:center;">${i + 1}</td>
        <td style="padding:10px 14px;font-size:14px;color:${TEXT};">${item.description || "—"}</td>
        <td style="padding:10px 14px;font-size:14px;color:${TEXT};text-align:right;">${fmt(item.unit_price)}</td>
        <td style="padding:10px 14px;font-size:14px;color:${TEXT};text-align:center;">${item.qty}</td>
        <td style="padding:10px 14px;font-size:14px;font-weight:600;color:${TEXT};text-align:right;">${fmt(item.total)}</td>
      </tr>`
    )
    .join("");

  const calloutRow = q.callout_fee_enabled
    ? `<tr style="background:${CALLOUT_BG};border:1px solid ${CALLOUT_BORDER};">
        <td colspan="4" style="padding:10px 14px;font-size:14px;font-weight:700;color:${ORANGE};">Call-Out Fee</td>
        <td style="padding:10px 14px;font-size:14px;font-weight:700;color:${ORANGE};text-align:right;">${fmt(q.callout_fee_amount)}</td>
       </tr>`
    : "";

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" style="max-height:72px;max-width:160px;object-fit:contain;display:block;margin-left:auto;" alt="Logo" />`
    : `<div style="width:120px;height:60px;background:#f3f4f6;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-left:auto;font-size:11px;color:${MUTED};">LOGO</div>`;

  const vatLine = contact.vat ? `<div style="font-size:13px;color:${MUTED};">VAT No: ${contact.vat}</div>` : "";
  const tinLine = contact.tin ? `<div style="font-size:13px;color:${MUTED};">TIN No: ${contact.tin}</div>` : "";

  const html = `
<div style="
  width:${W}px;
  min-height:2245px;
  background:${BG};
  color:${TEXT};
  font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;
  padding:80px 90px;
  box-sizing:border-box;
  position:relative;
">

  <!-- ── HEADER ── -->
  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:56px;">

    <!-- LEFT: company info -->
    <div>
      <div style="font-size:26px;font-weight:800;color:${TEXT};letter-spacing:-0.5px;margin-bottom:4px;">
        ${contact.phone ? contact.phone.replace(/.*/, "") : ""}
        <span style="color:${ORANGE};">GO TO</span> ELECTRICALS
      </div>
      <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;">
        ${contact.address ? `<div style="font-size:13px;color:${MUTED};">${contact.address}</div>` : ""}
        ${contact.phone ? `<div style="font-size:13px;color:${MUTED};">${contact.phone}</div>` : ""}
        ${contact.email ? `<div style="font-size:13px;color:${MUTED};">${contact.email}</div>` : ""}
        ${vatLine}
        ${tinLine}
      </div>
    </div>

    <!-- RIGHT: logo + quote number + date -->
    <div style="text-align:right;">
      ${logoHtml}
      <div style="margin-top:14px;">
        <div style="font-size:28px;font-weight:800;color:${TEXT};letter-spacing:-0.5px;">QUOTATION</div>
        <div style="margin-top:6px;display:flex;flex-direction:column;gap:3px;align-items:flex-end;">
          <div style="font-size:13px;color:${MUTED};">Quote No: <strong style="color:${TEXT};">${q.quote_number}</strong></div>
          <div style="font-size:13px;color:${MUTED};">Date: <strong style="color:${TEXT};">${todayStr(q.created_at)}</strong></div>
        </div>
      </div>
    </div>
  </div>

  <!-- ── DIVIDER ── -->
  <div style="height:2px;background:linear-gradient(90deg,${ORANGE},transparent);margin-bottom:40px;border-radius:2px;"></div>

  <!-- ── CLIENT BLOCK ── -->
  <div style="
    background:#f9fafb;
    border:1px solid ${BORDER};
    border-radius:12px;
    padding:28px 32px;
    margin-bottom:40px;
  ">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};margin-bottom:14px;">Bill To</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">
      <div>
        <div style="font-size:11px;color:${MUTED};margin-bottom:4px;">Client</div>
        <div style="font-size:15px;font-weight:700;color:${TEXT};">${q.customer_snapshot.name || "—"}</div>
      </div>
      <div>
        <div style="font-size:11px;color:${MUTED};margin-bottom:4px;">Phone</div>
        <div style="font-size:14px;color:${TEXT};">${q.customer_snapshot.phone || "—"}</div>
      </div>
      <div>
        <div style="font-size:11px;color:${MUTED};margin-bottom:4px;">Address</div>
        <div style="font-size:14px;color:${TEXT};">${q.customer_snapshot.address || "—"}</div>
      </div>
    </div>
    ${
      q.remark
        ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid ${BORDER};">
            <span style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.1em;">Remark:</span>
            <span style="font-size:14px;color:${TEXT};margin-left:8px;">${q.remark}</span>
           </div>`
        : ""
    }
  </div>

  <!-- ── LINE ITEMS TABLE ── -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:40px;">
    <thead>
      <tr style="background:${TEXT};">
        <th style="padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:center;width:48px;">#</th>
        <th style="padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:left;">Description</th>
        <th style="padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:right;width:130px;">Unit Price</th>
        <th style="padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:center;width:80px;">Qty</th>
        <th style="padding:12px 14px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:right;width:130px;">Total</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
      ${calloutRow}
    </tbody>
  </table>

  <!-- ── TOTALS ── -->
  <div style="display:flex;justify-content:flex-end;margin-bottom:56px;">
    <div style="width:320px;">
      <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${BORDER};font-size:14px;">
        <span style="color:${MUTED};">Subtotal</span>
        <span style="color:${TEXT};font-weight:600;">${fmt(q.subtotal)}</span>
      </div>
      ${
        q.callout_fee_enabled
          ? `<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid ${CALLOUT_BORDER};background:${CALLOUT_BG};padding-left:10px;padding-right:10px;font-size:14px;">
              <span style="color:${ORANGE};font-weight:700;">Call-Out Fee</span>
              <span style="color:${ORANGE};font-weight:700;">${fmt(q.callout_fee_amount)}</span>
             </div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;padding:14px 0;border-top:2px solid ${TEXT};">
        <span style="font-size:18px;font-weight:800;color:${TEXT};">TOTAL</span>
        <span style="font-size:22px;font-weight:800;color:${ORANGE};">${fmt(q.total)}</span>
      </div>
    </div>
  </div>

  <!-- ── ISSUED BY ── -->
  <div style="
    border-top:1px solid ${BORDER};
    padding-top:32px;
    display:flex;
    justify-content:space-between;
    align-items:flex-end;
  ">
    <div>
      <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Issued By</div>
      <div style="font-size:16px;font-weight:700;color:${TEXT};">${q.issued_by}</div>
      <div style="font-size:13px;color:${MUTED};margin-top:4px;">${todayStr(q.created_at)}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:11px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:18px;">Authorised Signature</div>
      <div style="width:200px;border-bottom:1px solid ${TEXT};"></div>
    </div>
  </div>

  <!-- ── FOOTER ── -->
  <div style="
    margin-top:48px;
    padding-top:20px;
    border-top:1px solid ${BORDER};
    display:flex;
    justify-content:space-between;
    align-items:center;
  ">
    <div style="font-size:11px;color:${MUTED};">
      ${contact.email || ""} · ${contact.phone || ""}
    </div>
    <div style="font-size:11px;color:${MUTED};">
      ${q.quote_number} · Go To Electricals
    </div>
  </div>

</div>`;

  const wrapper = document.createElement("div");
  wrapper.style.cssText =
    "position:fixed;top:-9999px;left:-9999px;z-index:-1;pointer-events:none;";
  wrapper.innerHTML = html;
  return wrapper;
}

// ── loadLogoAsDataUrl ──────────────────────────────────────────────────────────
// Fetches the logo from the public assets path and converts it to a data URL
// so it embeds correctly when html-to-image rasterises the template.

async function loadLogoAsDataUrl(): Promise<string | null> {
  try {
    const res = await fetch("/src/assets/goto-logo.jpeg");
    if (!res.ok) throw new Error("not found");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    // Logo fetch failed — we'll render without it rather than crash
    return null;
  }
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function downloadQuotationPdf(
  q: Quotation,
  contact: ContactInfo
): Promise<void> {
  // 1. Load logo
  const logoDataUrl = await loadLogoAsDataUrl();

  // 2. Build off-screen template
  const container = buildTemplate(q, contact, logoDataUrl);
  document.body.appendChild(container);
  const el = container.firstElementChild as HTMLElement;

  try {
    // 3. Capture as PNG at 2× resolution (pixelRatio:2 keeps text crisp on PDF)
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      // Ensure external fonts/images inside the template don't block capture
      skipFonts: false,
    });

    // 4. Measure actual rendered size (el may be taller than 2245px for long quotes)
    const imgEl = new Image();
    await new Promise<void>((res) => { imgEl.onload = () => res(); imgEl.src = dataUrl; });
    const imgW = imgEl.naturalWidth;
    const imgH = imgEl.naturalHeight;

    // 5. Create PDF — A4 width, proportional height
    const A4_W_MM = 210;
    const A4_H_MM = (imgH / imgW) * A4_W_MM;
    const pdf = new jsPDF({
      orientation: A4_H_MM > A4_W_MM ? "portrait" : "landscape",
      unit: "mm",
      format: [A4_W_MM, Math.max(A4_H_MM, 297)], // at least A4 height
    });

    pdf.addImage(dataUrl, "PNG", 0, 0, A4_W_MM, A4_H_MM);
    pdf.save(`${q.quote_number}-Go-To-Electricals.pdf`);
  } finally {
    // 6. Clean up the off-screen node regardless of success/failure
    document.body.removeChild(container);
  }
}