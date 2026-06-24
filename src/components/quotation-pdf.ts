// quotation-pdf.ts — uses jsPDF directly (no html-to-image) so line items
// break cleanly across pages with the table header repeated on each new page.

import type { Quotation } from "@/lib/quotes-store";
import type { ContactInfo } from "@/lib/site-store";

async function imageUrlToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }

function dateStr(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function downloadQuotationPdf(q: Quotation, contact: ContactInfo): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const margin = 16;
  const rightX = pageW - margin;
  const pageH = 297;
  const bottomMargin = 20; // safe zone before adding new page
  let y = 18;

  const orange: [number, number, number] = [249, 115, 22];
  const dark: [number, number, number]   = [17, 24, 39];
  const muted: [number, number, number]  = [75, 85, 99];
  const grey: [number, number, number]   = [156, 163, 175];
  const border: [number, number, number] = [209, 213, 219];

  const checkPage = (needed = 10) => {
    if (y + needed > pageH - bottomMargin) {
      pdf.addPage();
      y = 20;
      return true;
    }
    return false;
  };

  // ── Logo ──
  try {
    // Try PNG first, fall back to JPEG
    let logoDataUrl = "";
    try {
      logoDataUrl = await imageUrlToDataUrl("/goto-logo.png");
    } catch {
      logoDataUrl = await imageUrlToDataUrl("/goto-logo.jpeg");
    }
    if (logoDataUrl) {
      const ext = logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(logoDataUrl, ext, rightX - 28, 12, 28, 28);
    }
  } catch { /* skip logo */ }

  // ── Company name ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...orange);
  const gocolW = pdf.getTextWidth("GOCOL");
  pdf.text("GOCOL", margin, y);
  pdf.setTextColor(...dark);
  pdf.text(" ELECTRICALS", margin + gocolW, y);

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  if (contact.address) { pdf.text(contact.address, margin, y); y += 5; }
  if (contact.phone)   { pdf.text(contact.phone,   margin, y); y += 5; }
  if (contact.email)   { pdf.text(contact.email,   margin, y); y += 5; }
  if (contact.vat)     { pdf.text(`VAT No: ${contact.vat}`, margin, y); y += 5; }
  if (contact.tin)     { pdf.text(`TIN No: ${contact.tin}`, margin, y); y += 5; }

  // ── QUOTATION label + meta (right side) ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...orange);
  pdf.text("QUOTATION", rightX, 44, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...dark);
  pdf.text(`Quote No: ${q.quote_number}`, rightX, 51, { align: "right" });
  pdf.text(`Date: ${dateStr(q.created_at)}`, rightX, 57, { align: "right" });

  y = Math.max(y, 62);

  // ── Divider ──
  pdf.setDrawColor(...orange);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, rightX, y);
  pdf.setLineWidth(0.3);
  y += 8;

  // ── Bill To ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("BILL TO", margin, y);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...dark);
  pdf.text(q.customer_snapshot.name || "—", margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  if (q.customer_snapshot.phone)   { pdf.text(`Tel: ${q.customer_snapshot.phone}`, margin, y); y += 5; }
  if (q.customer_snapshot.address) { pdf.text(`Address: ${q.customer_snapshot.address}`, margin, y); y += 5; }
  if ((q.customer_snapshot as any).vat) { pdf.text(`VAT No: ${(q.customer_snapshot as any).vat}`, margin, y); y += 5; }
  if ((q.customer_snapshot as any).tin) { pdf.text(`TIN No: ${(q.customer_snapshot as any).tin}`, margin, y); y += 5; }
  if (q.remark) { pdf.text(`Remark: ${q.remark}`, margin, y); y += 5; }

  y += 6;

  // ── Table ──
  const colW = { num: 10, desc: 80, price: 25, qty: 15, total: 28 };
  const col = {
    num:   margin,
    desc:  margin + colW.num + 2,
    price: margin + colW.num + colW.desc + 2,
    qty:   margin + colW.num + colW.desc + colW.price + 2,
    total: rightX,
  };
  const rowH = 8;

  const drawTableHeader = () => {
    checkPage(rowH + 4);
    pdf.setFillColor(17, 24, 39);
    pdf.rect(margin, y, rightX - margin, rowH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("#",           col.num + 2,   y + 5.5);
    pdf.text("DESCRIPTION", col.desc,      y + 5.5);
    pdf.text("UNIT PRICE",  col.price,     y + 5.5);
    pdf.text("QTY",         col.qty,       y + 5.5);
    pdf.text("TOTAL",       col.total,     y + 5.5, { align: "right" });
    y += rowH;
  };

  drawTableHeader();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  q.line_items.forEach((item, idx) => {
    // Check if we need a new page before drawing this row
    if (y + rowH > pageH - bottomMargin) {
      pdf.addPage();
      y = 20;
      drawTableHeader();
    }

    // Alternating row background
    if (idx % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y, rightX - margin, rowH, "F");
    }

    pdf.setDrawColor(...border);
    pdf.line(margin, y + rowH, rightX, y + rowH);

    pdf.setTextColor(...muted);
    pdf.text(String(idx + 1), col.num + 2, y + 5.5);

    pdf.setTextColor(...dark);
    // Truncate long descriptions to fit
    const maxDescW = colW.desc - 4;
    let desc = item.description || "—";
    while (desc.length > 3 && pdf.getTextWidth(desc) > maxDescW) {
      desc = desc.slice(0, -1);
    }
    if (desc !== (item.description || "—")) desc += "…";
    pdf.text(desc, col.desc, y + 5.5);
    pdf.text(fmt(item.unit_price), col.price, y + 5.5);
    pdf.text(String(item.qty),     col.qty,   y + 5.5);

    pdf.setFont("helvetica", "bold");
    pdf.text(fmt(item.total), col.total, y + 5.5, { align: "right" });
    pdf.setFont("helvetica", "normal");

    y += rowH;
  });

  // Call-out fee row
  if (q.callout_fee_enabled) {
    if (y + rowH > pageH - bottomMargin) { pdf.addPage(); y = 20; }
    pdf.setFillColor(255, 247, 237);
    pdf.rect(margin, y, rightX - margin, rowH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...orange);
    pdf.text("Call-Out Fee", col.desc, y + 5.5);
    pdf.text(fmt(q.callout_fee_amount), col.total, y + 5.5, { align: "right" });
    pdf.setFont("helvetica", "normal");
    y += rowH;
  }

  // Closing table border
  pdf.setDrawColor(...border);
  pdf.line(margin, y, rightX, y);
  y += 8;

  // ── Totals block ──
  checkPage(40);
  const totalsX = rightX - 70;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...muted);
  pdf.text("Subtotal:", totalsX, y);
  pdf.setTextColor(...dark);
  pdf.text(fmt(q.subtotal), rightX, y, { align: "right" });
  y += 6;

  if (q.callout_fee_enabled) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...orange);
    pdf.text("Call-Out Fee:", totalsX, y);
    pdf.text(fmt(q.callout_fee_amount), rightX, y, { align: "right" });
    pdf.setFont("helvetica", "normal");
    y += 6;
  }

  pdf.setDrawColor(...dark);
  pdf.setLineWidth(0.6);
  pdf.line(totalsX, y, rightX, y);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...dark);
  pdf.text("TOTAL:", totalsX, y);
  pdf.setTextColor(...orange);
  pdf.text(fmt(q.total), rightX, y, { align: "right" });
  pdf.setLineWidth(0.3);
  y += 12;

  // ── Footer: Issued by + signature ──
  checkPage(30);
  pdf.setDrawColor(...border);
  pdf.line(margin, y, rightX, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("ISSUED BY", margin, y);
  pdf.text("AUTHORISED SIGNATURE", rightX, y, { align: "right" });
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...dark);
  pdf.text(q.issued_by, margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  y += 5;
  pdf.text(dateStr(q.created_at), margin, y);

  // Signature line
  pdf.setDrawColor(...dark);
  pdf.line(rightX - 60, y + 2, rightX, y + 2);

  // ── Document footer ──
  y += 14;
  checkPage(10);
  pdf.setDrawColor(...border);
  pdf.line(margin, y, rightX, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text(`${contact.email || ""} · ${contact.phone || ""}`, margin, y);
  pdf.text(`${q.quote_number} · Gocol Electricals`, rightX, y, { align: "right" });

  pdf.save(`${q.quote_number}-Gocol-Electricals.pdf`);
}