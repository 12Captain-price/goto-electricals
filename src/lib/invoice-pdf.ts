// Generates a branded Invoice PDF — same layout style as the Quotation PDF,
// but with a Due Date field and a payment-status stamp placed neatly below the TOTAL line.

import type { Invoice, InvoicePayment, PaymentMethod } from "@/lib/quotes-store";
import { PAYMENT_METHOD_LABELS, computeInvoicePaymentSummary } from "@/lib/quotes-store";
import type { ContactInfo } from "@/lib/site-store";
import logoUrl from "@/assets/goto-logo.png";

async function imageUrlToDataUrl(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadInvoicePdf(
  invoice: Invoice,
  contact: ContactInfo,
  payments: InvoicePayment[],
) {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  const pageWidth = 210;
  const margin = 16;
  const rightX = pageWidth - margin;
  let y = 18;

  const orange: [number, number, number] = [249, 115, 22];
  const black: [number, number, number] = [20, 20, 20];
  const dark: [number, number, number] = [40, 40, 40];
  const grey: [number, number, number] = [120, 120, 120];
  const green: [number, number, number] = [34, 197, 94];
  const amber: [number, number, number] = [245, 158, 11];
  const red: [number, number, number] = [239, 68, 68];

  const { amountPaid, balance, status } = computeInvoicePaymentSummary(invoice.total, payments);

  // ── Header: GOCOL (black) + ELECTRICALS (orange), logo right ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(...black);
  const gocolText = "GOCOL";
  pdf.text(gocolText, margin, y);
  const gocolWidth = pdf.getTextWidth(gocolText);
  pdf.setTextColor(...orange);
  pdf.text(" ELECTRICALS", margin + gocolWidth, y);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...grey);
  y += 6;
  pdf.text(contact.address || "", margin, y);
  y += 5;
  pdf.text(contact.phone || "", margin, y);
  y += 5;
  pdf.text(contact.email || "", margin, y);
  if (contact.vat) { y += 5; pdf.text(`VAT No: ${contact.vat}`, margin, y); }
  if (contact.tin) { y += 5; pdf.text(`TIN No: ${contact.tin}`, margin, y); }

  try {
    const logoDataUrl = await imageUrlToDataUrl(logoUrl);
    pdf.addImage(logoDataUrl, "JPEG", rightX - 22, 14, 22, 22);
  } catch {
    // skip logo if it fails to load
  }

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(...orange);
  pdf.text("INVOICE", rightX, 42, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...dark);
  pdf.text(`Invoice No: ${invoice.invoice_number}`, rightX, 48, { align: "right" });
  pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, rightX, 53, { align: "right" });
  if (invoice.due_date) {
    pdf.text(`Due: ${new Date(invoice.due_date).toLocaleDateString()}`, rightX, 58, { align: "right" });
  }

  y = Math.max(y, invoice.due_date ? 58 : 53) + 10;

  pdf.setDrawColor(220, 220, 220);
  pdf.line(margin, y, rightX, y);
  y += 8;

  // ── Client block ──
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(...dark);
  pdf.text("Client:", margin, y);
  pdf.setFont("helvetica", "normal");
  pdf.text(invoice.customer_snapshot.name, margin + 16, y);
  y += 6;
  if (invoice.customer_snapshot.phone) {
    pdf.text(`Tel: ${invoice.customer_snapshot.phone}`, margin, y);
    y += 6;
  }
  if (invoice.customer_snapshot.address) {
    pdf.text(`Address: ${invoice.customer_snapshot.address}`, margin, y);
    y += 6;
  }
  if (invoice.customer_snapshot.vat) {
    pdf.text(`VAT No: ${invoice.customer_snapshot.vat}`, margin, y);
    y += 6;
  }
  if (invoice.customer_snapshot.tin) {
    pdf.text(`TIN No: ${invoice.customer_snapshot.tin}`, margin, y);
    y += 6;
  }
  if (invoice.remark) {
    pdf.text(`Remark: ${invoice.remark}`, margin, y);
    y += 6;
  }

  y += 4;

  // ── Line items table ──
  const colDescX = margin + 2;
  const colPriceX = margin + 110;
  const colQtyX = margin + 140;
  const colTotalX = rightX - 2;
  const rowHeight = 8;

  const drawTableHeader = () => {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, rightX - margin, rowHeight, "F");
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...grey);
    pdf.text("#", margin + 2, y + 5.5);
    pdf.text("DESCRIPTION", colDescX + 6, y + 5.5);
    pdf.text("UNIT PRICE", colPriceX, y + 5.5);
    pdf.text("QTY", colQtyX, y + 5.5);
    pdf.text("TOTAL", colTotalX, y + 5.5, { align: "right" });
    y += rowHeight;
  };

  drawTableHeader();

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(...dark);

  invoice.line_items.forEach((item, idx) => {
    if (y > 250) { pdf.addPage(); y = 20; drawTableHeader(); }
    pdf.setDrawColor(230, 230, 230);
    pdf.line(margin, y, rightX, y);
    pdf.text(String(idx + 1), margin + 2, y + 5.5);
    pdf.text(item.description || "—", colDescX + 6, y + 5.5);
    pdf.text(`$${item.unit_price.toFixed(2)}`, colPriceX, y + 5.5);
    pdf.text(String(item.qty), colQtyX, y + 5.5);
    pdf.text(`$${item.total.toFixed(2)}`, colTotalX, y + 5.5, { align: "right" });
    y += rowHeight;
  });
  pdf.line(margin, y, rightX, y);
  y += 10;

  // ── Totals ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...dark);
  pdf.text("Subtotal:", colPriceX, y);
  pdf.text(`$${invoice.subtotal.toFixed(2)}`, colTotalX, y, { align: "right" });
  y += 6;

  if (invoice.callout_fee_enabled) {
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...orange);
    pdf.text("Call-Out Fee:", colPriceX, y);
    pdf.text(`$${invoice.callout_fee_amount.toFixed(2)}`, colTotalX, y, { align: "right" });
    y += 7;
  }

  pdf.setDrawColor(...dark);
  pdf.line(colPriceX, y, rightX, y);
  y += 6;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(12);
  pdf.setTextColor(...dark);
  pdf.text("TOTAL:", colPriceX, y);
  pdf.text(`$${invoice.total.toFixed(2)}`, colTotalX, y, { align: "right" });
  y += 10;

  // ── Payment status stamp — neat box placed directly below TOTAL ──
  const stampConfig: Record<typeof status, { label: string; color: [number, number, number] }> = {
    paid:           { label: "PAID",           color: green },
    partially_paid: { label: "PARTIALLY PAID", color: amber },
    unpaid:         { label: "UNPAID",         color: red   },
  };
  const stamp = stampConfig[status];

  // Draw a clean horizontal badge (no rotation) flush against the right column
  const stampFontSize = 11;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(stampFontSize);
  pdf.setTextColor(...stamp.color);

  const stampLabel = stamp.label;
  const stampTextWidth = pdf.getTextWidth(stampLabel);
  const stampPadX = 5;
  const stampPadY = 3.5;
  const stampBoxW = stampTextWidth + stampPadX * 2;
  const stampBoxH = stampFontSize * 0.45 + stampPadY * 2;
  const stampBoxX = colTotalX - stampBoxW;  // right-aligned with totals column
  const stampBoxY = y - 1;

  // Filled background (light tint)
  pdf.setFillColor(stamp.color[0], stamp.color[1], stamp.color[2]);
  // Draw rounded-ish rect by drawing a regular rect (jsPDF basic)
  pdf.setGState(new (pdf as any).GState({ opacity: 0.12 }));
  pdf.rect(stampBoxX, stampBoxY, stampBoxW, stampBoxH, "F");
  pdf.setGState(new (pdf as any).GState({ opacity: 1 }));

  // Border
  pdf.setDrawColor(...stamp.color);
  pdf.setLineWidth(0.6);
  pdf.rect(stampBoxX, stampBoxY, stampBoxW, stampBoxH, "S");

  // Text centred inside box
  pdf.setTextColor(...stamp.color);
  pdf.text(stampLabel, stampBoxX + stampPadX + stampTextWidth / 2, stampBoxY + stampPadY + stampFontSize * 0.35, { align: "center" });

  y = stampBoxY + stampBoxH + 10;

  // ── Payment summary ──
  if (payments.length > 0) {
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(...grey);
    pdf.text("Amount Paid:", colPriceX, y);
    pdf.setTextColor(...green);
    pdf.text(`$${amountPaid.toFixed(2)}`, colTotalX, y, { align: "right" });
    y += 6;
    pdf.setTextColor(...grey);
    pdf.text("Balance Remaining:", colPriceX, y);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(...dark);
    pdf.text(`$${balance.toFixed(2)}`, colTotalX, y, { align: "right" });
    y += 10;

    // Payment history trail
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8.5);
    pdf.setTextColor(...grey);
    pdf.text("PAYMENT HISTORY", margin, y);
    y += 5;
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8.5);
    payments.forEach((p) => {
      if (y > 270) { pdf.addPage(); y = 20; }
      const methodLabel = PAYMENT_METHOD_LABELS[p.method as PaymentMethod] ?? p.method;
      const line = `${new Date(p.paid_at).toLocaleDateString()} — $${p.amount.toFixed(2)} — ${methodLabel}${p.note ? ` — ${p.note}` : ""}`;
      pdf.setTextColor(...dark);
      pdf.text(line, margin, y);
      y += 5;
    });
    y += 6;
  } else {
    y += 6;
  }

  // ── Issued by ──
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(...grey);
  pdf.text(`Issued by: ${invoice.issued_by}`, margin, y);
  y += 6;
  pdf.text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, margin, y);

  pdf.save(`${invoice.invoice_number}.pdf`);
}