// quotation-pdf.ts
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import type { Quotation } from "@/lib/quotes-store";
import type { ContactInfo } from "@/lib/site-store";

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

async function loadLogo(): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    img.onerror = () => resolve("");
    img.src = `/goto-logo.jpeg?t=${Date.now()}`;
  });
}

function buildTemplate(
  q: Quotation,
  contact: ContactInfo,
  logoDataUrl: string
): HTMLDivElement {
  const ORANGE = "#f97316";
  const BG = "#ffffff";
  const TEXT = "#111827";
  const MUTED = "#374151";
  const BORDER = "#d1d5db";
  const CALLOUT_BG = "#fff7ed";
  const CALLOUT_BORDER = "#fed7aa";
  const W = 1240;

  const rows = q.line_items
    .map(
      (item, i) => `
      <tr style="border-bottom:1px solid ${BORDER};">
        <td style="padding:12px 16px;color:${MUTED};font-size:16px;text-align:center;">${i + 1}</td>
        <td style="padding:12px 16px;font-size:18px;color:${TEXT};">${item.description || "—"}</td>
        <td style="padding:12px 16px;font-size:18px;color:${TEXT};text-align:right;">${fmt(item.unit_price)}</td>
        <td style="padding:12px 16px;font-size:18px;color:${TEXT};text-align:center;">${item.qty}</td>
        <td style="padding:12px 16px;font-size:18px;font-weight:600;color:${TEXT};text-align:right;">${fmt(item.total)}</td>
      </tr>`
    )
    .join("");

  const calloutRow = q.callout_fee_enabled
    ? `<tr style="background:${CALLOUT_BG};border:1px solid ${CALLOUT_BORDER};">
        <td colspan="4" style="padding:12px 16px;font-size:18px;font-weight:700;color:${ORANGE};">Call-Out Fee</td>
        <td style="padding:12px 16px;font-size:18px;font-weight:700;color:${ORANGE};text-align:right;">${fmt(q.callout_fee_amount)}</td>
       </tr>`
    : "";

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" style="max-height:200px;max-width:360px;object-fit:contain;display:block;margin-left:auto;" alt="Logo" />`
    : `<div style="width:120px;height:60px;"></div>`;

  const vatLine = contact.vat ? `<div style="font-size:16px;color:${MUTED};">VAT No: ${contact.vat}</div>` : "";
  const tinLine = contact.tin ? `<div style="font-size:16px;color:${MUTED};">TIN No: ${contact.tin}</div>` : "";

  const html = `
<div style="width:${W}px;min-height:2245px;background:${BG};color:${TEXT};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;padding:80px 90px;box-sizing:border-box;">

  <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:56px;">
    <div>
      <div style="font-size:38px;font-weight:800;letter-spacing:-0.5px;margin-bottom:4px;">
        <span style="color:${ORANGE};">GOW TO</span> ELECTRICALS
      </div>
      <div style="margin-top:10px;display:flex;flex-direction:column;gap:6px;">
        ${contact.address ? `<div style="font-size:16px;color:${MUTED};">${contact.address}</div>` : ""}
        ${contact.phone ? `<div style="font-size:16px;color:${MUTED};">${contact.phone}</div>` : ""}
        ${contact.email ? `<div style="font-size:16px;color:${MUTED};">${contact.email}</div>` : ""}
        ${vatLine}${tinLine}
      </div>
    </div>
    <div style="text-align:right;">
      ${logoHtml}
      <div style="margin-top:14px;">
        <div style="font-size:42px;font-weight:800;color:${TEXT};letter-spacing:-0.5px;">QUOTATION</div>
        <div style="margin-top:8px;display:flex;flex-direction:column;gap:4px;align-items:flex-end;">
          <div style="font-size:16px;color:${MUTED};">Quote No: <strong style="color:${TEXT};">${q.quote_number}</strong></div>
          <div style="font-size:16px;color:${MUTED};">Date: <strong style="color:${TEXT};">${todayStr(q.created_at)}</strong></div>
        </div>
      </div>
    </div>
  </div>

  <div style="height:2px;background:linear-gradient(90deg,${ORANGE},transparent);margin-bottom:40px;border-radius:2px;"></div>

  <div style="background:#f9fafb;border:1px solid ${BORDER};border-radius:12px;padding:28px 32px;margin-bottom:40px;">
    <div style="font-size:14px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:${MUTED};margin-bottom:14px;">Bill To</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;">
      <div>
        <div style="font-size:14px;color:${MUTED};margin-bottom:4px;">Client</div>
        <div style="font-size:20px;font-weight:700;color:${TEXT};">${q.customer_snapshot.name || "—"}</div>
      </div>
      <div>
        <div style="font-size:14px;color:${MUTED};margin-bottom:4px;">Phone</div>
        <div style="font-size:18px;color:${TEXT};">${q.customer_snapshot.phone || "—"}</div>
      </div>
      <div>
        <div style="font-size:14px;color:${MUTED};margin-bottom:4px;">Address</div>
        <div style="font-size:18px;color:${TEXT};">${q.customer_snapshot.address || "—"}</div>
      </div>
    </div>
    ${q.remark ? `<div style="margin-top:16px;padding-top:16px;border-top:1px solid ${BORDER};"><span style="font-size:14px;color:${MUTED};text-transform:uppercase;letter-spacing:0.1em;">Remark:</span><span style="font-size:18px;color:${TEXT};margin-left:8px;">${q.remark}</span></div>` : ""}
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:40px;">
    <thead>
      <tr style="background:${TEXT};">
        <th style="padding:14px 16px;font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:center;width:48px;">#</th>
        <th style="padding:14px 16px;font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:left;">Description</th>
        <th style="padding:14px 16px;font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:right;width:130px;">Unit Price</th>
        <th style="padding:14px 16px;font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:center;width:80px;">Qty</th>
        <th style="padding:14px 16px;font-size:15px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#fff;text-align:right;width:130px;">Total</th>
      </tr>
    </thead>
    <tbody>${rows}${calloutRow}</tbody>
  </table>

  <div style="display:flex;justify-content:flex-end;margin-bottom:56px;">
    <div style="width:360px;">
      <div style="display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid ${BORDER};font-size:17px;">
        <span style="color:${MUTED};">Subtotal</span>
        <span style="color:${TEXT};font-weight:600;">${fmt(q.subtotal)}</span>
      </div>
      ${q.callout_fee_enabled ? `<div style="display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid ${CALLOUT_BORDER};background:${CALLOUT_BG};font-size:17px;"><span style="color:${ORANGE};font-weight:700;">Call-Out Fee</span><span style="color:${ORANGE};font-weight:700;">${fmt(q.callout_fee_amount)}</span></div>` : ""}
      <div style="display:flex;justify-content:space-between;padding:16px 0;border-top:2px solid ${TEXT};">
        <span style="font-size:22px;font-weight:800;color:${TEXT};">TOTAL</span>
        <span style="font-size:26px;font-weight:800;color:${ORANGE};">${fmt(q.total)}</span>
      </div>
    </div>
  </div>

  <div style="border-top:1px solid ${BORDER};padding-top:32px;display:flex;justify-content:space-between;align-items:flex-end;">
    <div>
      <div style="font-size:14px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px;">Issued By</div>
      <div style="font-size:20px;font-weight:700;color:${TEXT};">${q.issued_by}</div>
      <div style="font-size:15px;color:${MUTED};margin-top:4px;">${todayStr(q.created_at)}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:14px;color:${MUTED};text-transform:uppercase;letter-spacing:0.12em;margin-bottom:18px;">Authorised Signature</div>
      <div style="width:200px;border-bottom:1px solid ${TEXT};"></div>
    </div>
  </div>

  <div style="margin-top:48px;padding-top:20px;border-top:1px solid ${BORDER};display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:14px;color:${MUTED};">${contact.email || ""} · ${contact.phone || ""}</div>
    <div style="font-size:14px;color:${MUTED};">${q.quote_number} · Gow To Electricals</div>
  </div>

</div>`;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "position:fixed;top:-9999px;left:-9999px;z-index:-1;pointer-events:none;";
  wrapper.innerHTML = html;
  return wrapper;
}

export async function downloadQuotationPdf(
  q: Quotation,
  contact: ContactInfo
): Promise<void> {
  const logoDataUrl = await loadLogo();
  const container = buildTemplate(q, contact, logoDataUrl);
  document.body.appendChild(container);
  const el = container.firstElementChild as HTMLElement;

  try {
    const dataUrl = await toJpeg(el, {
      pixelRatio: 1.8,
      backgroundColor: "#ffffff",
      quality: 0.82,
      skipFonts: false,
    });

    const imgEl = new Image();
    await new Promise<void>((res) => { imgEl.onload = () => res(); imgEl.src = dataUrl; });
    const imgW = imgEl.naturalWidth;
    const imgH = imgEl.naturalHeight;

    const PAGE_W = 210;
    const PAGE_H = 297;
    const scaledH = (imgH / imgW) * PAGE_W;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(dataUrl, "JPEG", 0, 0, PAGE_W, scaledH);

    if (scaledH > PAGE_H) {
      let yOffset = -PAGE_H;
      while (yOffset > -scaledH) {
        pdf.addPage();
        pdf.addImage(dataUrl, "JPEG", 0, yOffset, PAGE_W, scaledH);
        yOffset -= PAGE_H;
      }
    }

    pdf.save(`${q.quote_number}-Gow-To-Electricals.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}