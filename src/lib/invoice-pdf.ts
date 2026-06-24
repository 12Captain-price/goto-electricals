// invoice-pdf.ts — jsPDF with proper multi-page support for long line item lists

import type { Invoice, InvoicePayment, PaymentMethod } from "@/lib/quotes-store";
import { PAYMENT_METHOD_LABELS, computeInvoicePaymentSummary } from "@/lib/quotes-store";
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
  } catch { return ""; }
}

function fmt(n: number) { return `$${n.toFixed(2)}`; }

export async function downloadInvoicePdf(
  invoice: Invoice,
  contact: ContactInfo,
  payments: InvoicePayment[],
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageW = 210;
  const pageH = 297;
  const margin = 16;
  const rightX = pageW - margin;
  const bottomMargin = 20;
  let y = 18;

  const orange: [number, number, number] = [249, 115, 22];
  const dark: [number, number, number]   = [17, 24, 39];
  const muted: [number, number, number]  = [75, 85, 99];
  const grey: [number, number, number]   = [156, 163, 175];
  const border: [number, number, number] = [209, 213, 219];
  const green: [number, number, number]  = [34, 197, 94];
  const amber: [number, number, number]  = [245, 158, 11];
  const red: [number, number, number]    = [239, 68, 68];

  const { amountPaid, balance, status } = computeInvoicePaymentSummary(invoice.total, payments);

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
    let logoDataUrl = "";
    try { logoDataUrl = await imageUrlToDataUrl("/goto-logo.png"); } catch { logoDataUrl = await imageUrlToDataUrl("/goto-logo.jpeg"); }
    if (logoDataUrl) {
      const ext = logoDataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
      pdf.addImage(logoDataUrl, ext, rightX - 28, 12, 28, 28);
    }
  } catch { /* skip */ }

  // ── Company name ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.setTextColor(...orange);
  const gW = pdf.getTextWidth("GOCOL");
  pdf.text("GOCOL", margin, y);
  pdf.setTextColor(...dark);
  pdf.text(" ELECTRICALS", margin + gW, y);

  y += 6;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  if (contact.address) { pdf.text(contact.address, margin, y); y += 5; }
  if (contact.phone)   { pdf.text(contact.phone,   margin, y); y += 5; }
  if (contact.email)   { pdf.text(contact.email,   margin, y); y += 5; }
  if (contact.vat)     { pdf.text(`VAT No: ${contact.vat}`, margin, y); y += 5; }
  if (contact.tin)     { pdf.text(`TIN No: ${contact.tin}`, margin, y); y += 5; }

  // ── INVOICE label ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...orange);
  pdf.text("INVOICE", rightX, 44, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...dark);
  pdf.text(`Invoice No: ${invoice.invoice_number}`, rightX, 51, { align: "right" });
  pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, rightX, 57, { align: "right" });
  if (invoice.due_date) { pdf.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, rightX, 63, { align: "right" }); }

  y = Math.max(y, invoice.due_date ? 68 : 62);

  // ── Divider ──
  pdf.setDrawColor(...orange);
  pdf.setLineWidth(0.8);
  pdf.line(margin, y, rightX, y);
  pdf.setLineWidth(0.3);
  y += 8;

  // ── Client block ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("BILL TO", margin, y);
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(11);
  pdf.setTextColor(...dark);
  pdf.text(invoice.customer_snapshot.name || "—", margin, y);
  y += 6;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  if (invoice.customer_snapshot.phone)   { pdf.text(`Tel: ${invoice.customer_snapshot.phone}`, margin, y); y += 5; }
  if (invoice.customer_snapshot.address) { pdf.text(`Address: ${invoice.customer_snapshot.address}`, margin, y); y += 5; }
  if ((invoice.customer_snapshot as any).vat) { pdf.text(`VAT No: ${(invoice.customer_snapshot as any).vat}`, margin, y); y += 5; }
  if ((invoice.customer_snapshot as any).tin) { pdf.text(`TIN No: ${(invoice.customer_snapshot as any).tin}`, margin, y); y += 5; }
  if (invoice.remark) { pdf.text(`Remark: ${invoice.remark}`, margin, y); y += 5; }

  y += 6;

  // ── Table ──
  const rowH = 8;
  const colDesc  = margin + 12;
  const colPrice = margin + 110;
  const colQty   = margin + 142;
  const colTotal = rightX;

  const drawTableHeader = () => {
    pdf.setFillColor(17, 24, 39);
    pdf.rect(margin, y, rightX - margin, rowH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text("#",           margin + 2, y + 5.5);
    pdf.text("DESCRIPTION", colDesc,    y + 5.5);
    pdf.text("UNIT PRICE",  colPrice,   y + 5.5);
    pdf.text("QTY",         colQty,     y + 5.5);
    pdf.text("TOTAL",       colTotal,   y + 5.5, { align: "right" });
    y += rowH;
  };

  drawTableHeader();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);

  invoice.line_items.forEach((item, idx) => {
    if (y + rowH > pageH - bottomMargin) {
      pdf.addPage();
      y = 20;
      drawTableHeader();
    }

    if (idx % 2 === 0) {
      pdf.setFillColor(249, 250, 251);
      pdf.rect(margin, y, rightX - margin, rowH, "F");
    }

    pdf.setDrawColor(...border);
    pdf.line(margin, y + rowH, rightX, y + rowH);

    pdf.setTextColor(...muted);
    pdf.text(String(idx + 1), margin + 2, y + 5.5);

    pdf.setTextColor(...dark);
    let desc = item.description || "—";
    const maxW = colPrice - colDesc - 4;
    while (desc.length > 3 && pdf.getTextWidth(desc) > maxW) desc = desc.slice(0, -1);
    if (desc !== (item.description || "—")) desc += "…";
    pdf.text(desc, colDesc, y + 5.5);
    pdf.text(fmt(item.unit_price), colPrice, y + 5.5);
    pdf.text(String(item.qty), colQty, y + 5.5);
    pdf.setFont("helvetica", "bold");
    pdf.text(fmt(item.total), colTotal, y + 5.5, { align: "right" });
    pdf.setFont("helvetica", "normal");
    y += rowH;
  });

  // Call-out fee row
  if (invoice.callout_fee_enabled) {
    if (y + rowH > pageH - bottomMargin) { pdf.addPage(); y = 20; }
    pdf.setFillColor(255, 247, 237);
    pdf.rect(margin, y, rightX - margin, rowH, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.setTextColor(...orange);
    pdf.text("Call-Out Fee", colDesc, y + 5.5);
    pdf.text(fmt(invoice.callout_fee_amount), colTotal, y + 5.5, { align: "right" });
    pdf.setFont("helvetica", "normal");
    y += rowH;
  }

  pdf.setDrawColor(...border);
  pdf.line(margin, y, rightX, y);
  y += 8;

  // ── Totals ──
  checkPage(50);
  const totalsX = rightX - 70;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...muted);
  pdf.text("Subtotal:", totalsX, y);
  pdf.setTextColor(...dark);
  pdf.text(fmt(invoice.subtotal), rightX, y, { align: "right" });
  y += 6;

  if (invoice.callout_fee_enabled) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...orange);
    pdf.text("Call-Out Fee:", totalsX, y);
    pdf.text(fmt(invoice.callout_fee_amount), rightX, y, { align: "right" });
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
  pdf.text(fmt(invoice.total), rightX, y, { align: "right" });
  pdf.setLineWidth(0.3);
  y += 8;

  // ── Payment status stamp ──
  const stampCfg = {
    paid:           { label: "PAID",           color: green },
    partially_paid: { label: "PARTIALLY PAID", color: amber },
    unpaid:         { label: "UNPAID",         color: red   },
  }[status];

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...stampCfg.color);
  const stampW = pdf.getTextWidth(stampCfg.label) + 10;
  const stampH = 8;
  const stampX = rightX - stampW;

  pdf.setFillColor(stampCfg.color[0], stampCfg.color[1], stampCfg.color[2]);
  pdf.setGState(new (pdf as any).GState({ opacity: 0.12 }));
  pdf.rect(stampX, y, stampW, stampH, "F");
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));
  pdf.setDrawColor(...stampCfg.color);
  pdf.setLineWidth(0.5);
  pdf.rect(stampX, y, stampW, stampH, "S");
  pdf.setLineWidth(0.3);
  pdf.setTextColor(...stampCfg.color);
  pdf.text(stampCfg.label, stampX + 5, y + 5.5);
  y += stampH + 8;

  // ── Payment summary ──
  if (payments.length > 0) {
    checkPage(30);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...muted);
    pdf.text("Amount Paid:", totalsX, y);
    pdf.setTextColor(...green);
    pdf.text(fmt(amountPaid), rightX, y, { align: "right" });
    y += 6;

    pdf.setTextColor(...muted);
    pdf.text("Balance Remaining:", totalsX, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...dark);
    pdf.text(fmt(balance), rightX, y, { align: "right" });
    y += 10;

    checkPage(20);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    pdf.setTextColor(...grey);
    pdf.text("PAYMENT HISTORY", margin, y);
    y += 5;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    payments.forEach((p) => {
      checkPage(6);
      const methodLabel = PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method;
      const line = `${new Date(p.paid_at).toLocaleDateString()} — ${fmt(p.amount)} — ${methodLabel}${p.note ? ` — ${p.note}` : ""}`;
      pdf.setTextColor(...dark);
      pdf.text(line, margin, y);
      y += 5;
    });
    y += 6;
  }

  // ── Issued by ──
  checkPage(25);
  pdf.setDrawColor(...border);
  pdf.line(margin, y, rightX, y);
  y += 8;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(...grey);
  pdf.text("ISSUED BY", margin, y);
  pdf.text("AUTHORISED SIGNATURE", rightX, y, { align: "right" });
  y += 5;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...dark);
  pdf.text(invoice.issued_by, margin, y);
  y += 5;
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...muted);
  pdf.text(new Date(invoice.created_at).toLocaleDateString(), margin, y);

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
  pdf.text(`${invoice.invoice_number} · Gocol Electricals`, rightX, y, { align: "right" });

  pdf.save(`${invoice.invoice_number}.pdf`);
}