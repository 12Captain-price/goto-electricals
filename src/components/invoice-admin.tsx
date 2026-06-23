import { useState } from "react";
import {
  Plus, Trash2, Search, X, FileText, User, Phone,
  Loader2, ArrowLeft, AlertCircle, Save, Download,
  CheckCircle, Clock, AlertTriangle, ChevronDown, ChevronUp, History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useInvoices, useCustomers,
  computeInvoicePaymentSummary, PAYMENT_METHOD_LABELS,
  type Invoice, type InvoicePayment, type Customer, type QuotationLineItem, type PaymentMethod,
} from "../lib/quotes-store";
import { downloadInvoicePdf } from "../lib/invoice-pdf";

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f97316] focus:outline-none";

const STATUS_CONFIG = {
  unpaid: {
    label: "Unpaid",
    color: "text-[#ef4444]", bg: "bg-[#ef4444]/10", border: "border-[#ef4444]/40",
    icon: AlertTriangle, stamp: "UNPAID", stampColor: "#ef4444",
  },
  partially_paid: {
    label: "Partially Paid",
    color: "text-[#f97316]", bg: "bg-[#f97316]/10", border: "border-[#f97316]/40",
    icon: Clock, stamp: "PARTIALLY PAID", stampColor: "#f97316",
  },
  paid: {
    label: "Paid",
    color: "text-[#22c55e]", bg: "bg-[#22c55e]/10", border: "border-[#22c55e]/40",
    icon: CheckCircle, stamp: "PAID", stampColor: "#22c55e",
  },
};

function fmt(n: number) { return `$${n.toFixed(2)}`; }

type LineItem = { description: string; quantity: number; unit_price: number };
function emptyItem(): LineItem { return { description: "", quantity: 1, unit_price: 0 }; }

function toQuotationLineItems(items: LineItem[]): QuotationLineItem[] {
  return items.map((i) => ({
    description: i.description,
    unit_price: i.unit_price,
    qty: i.quantity,
    total: i.quantity * i.unit_price,
  }));
}

// ── Payment Row ──

function PaymentRow({ payment, onDelete }: { payment: InvoicePayment; onDelete: () => void }) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-white/10 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white">{fmt(payment.amount)}</span>
          <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">
            {PAYMENT_METHOD_LABELS[payment.method]}
          </span>
          <span className="text-xs text-white/30">{payment.paid_at}</span>
        </div>
        {payment.note && <p className="text-xs text-white/40 mt-0.5 truncate">{payment.note}</p>}
      </div>
      <button onClick={onDelete} className="ml-2 flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10 shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  );
}

// ── Add Payment Form ──

function AddPaymentForm({
  invoiceId,
  onDone,
  addPayment,
}: {
  invoiceId: string;
  onDone: () => void;
  addPayment: (invoiceId: string, payment: Omit<InvoicePayment, "id" | "created_at">) => Promise<InvoicePayment>;
}) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { setError("Enter a valid amount"); return; }
    setSaving(true);
    setError("");
    try {
      await addPayment(invoiceId, { amount: amt, method, note: note.trim() || null, paid_at: date });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally { setSaving(false); }
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1117] p-4 space-y-3 mt-3">
      <h4 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Record Payment</h4>
      {error && <p className="text-xs text-[#ef4444] bg-[#ef4444]/10 rounded-lg px-3 py-2">{error}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Amount ($)</label>
          <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className={inputCls} />
        </div>
        <div>
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Payment Method</label>
        <select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={`${inputCls} cursor-pointer`}>
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div>
        <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Note</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Deposit for DB board upgrade" className={inputCls} />
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={handleSubmit} disabled={saving}
          className="flex-1 flex items-center justify-center gap-2 rounded-full bg-[#f97316] py-2 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />} Save Payment
        </button>
        <button onClick={onDone} className="px-4 py-2 rounded-full border border-white/10 text-sm text-white/60 hover:text-white">Cancel</button>
      </div>
    </div>
  );
}

// ── Invoice Payment Panel (modal) ──

function InvoicePaymentPanel({
  invoice,
  onClose,
  settings,
  addPayment,
  removePayment,
}: {
  invoice: Invoice;
  onClose: () => void;
  settings: any;
  addPayment: (invoiceId: string, payment: Omit<InvoicePayment, "id" | "created_at">) => Promise<InvoicePayment>;
  removePayment: (invoiceId: string, paymentId: string) => Promise<void>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const payments = invoice.payments ?? [];
  const summary = computeInvoicePaymentSummary(invoice.total, payments);
  const statusCfg = STATUS_CONFIG[summary.status];

  async function handleDelete(paymentId: string) {
    if (!confirm("Remove this payment record?")) return;
    await removePayment(invoice.id, paymentId);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#161b22] border-b border-white/10 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-display font-bold text-white">{invoice.invoice_number}</h2>
            <p className="text-xs text-white/40">{invoice.customer_snapshot?.name || "—"}</p>
          </div>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 hover:border-[#f97316]/50 hover:text-[#f97316]">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Status + totals */}
          <div className="rounded-xl border border-white/10 bg-[#0d1117] p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Invoice Total</span>
              <span className="font-bold text-white">{fmt(invoice.total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/50">Amount Paid</span>
              <span className="font-semibold text-[#22c55e]">{fmt(summary.amountPaid)}</span>
            </div>
            {summary.balance > 0 && (
              <div className="flex items-center justify-between border-t border-white/10 pt-2 text-sm">
                <span className="text-white/50">Balance Remaining</span>
                <span className="font-bold text-[#ef4444]">{fmt(summary.balance)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/30">Status</span>
              <span className={`flex items-center gap-1.5 rounded-full ${statusCfg.bg} ${statusCfg.border} border px-3 py-1 font-mono text-[10px] uppercase tracking-wider ${statusCfg.color}`}>
                <statusCfg.icon size={11} /> {statusCfg.label}
              </span>
            </div>
            {invoice.due_date && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/30">Due Date</span>
                <span className="text-white/60">{invoice.due_date}</span>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <History size={13} /> Payment History
              </h3>
              {summary.status !== "paid" && (
                <button onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1 rounded-full bg-[#f97316] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-black hover:bg-orange-400">
                  <Plus size={11} /> Add Payment
                </button>
              )}
            </div>
            {payments.length === 0 ? (
              <p className="text-center py-6 text-sm text-white/30">No payments recorded yet</p>
            ) : (
              <div className="rounded-xl border border-white/10 bg-[#0d1117] px-3">
                {payments.map((p) => (
                  <PaymentRow key={p.id} payment={p} onDelete={() => handleDelete(p.id)} />
                ))}
              </div>
            )}
            <AnimatePresence>
              {showAddForm && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                  <AddPaymentForm
                    invoiceId={invoice.id}
                    addPayment={addPayment}
                    onDone={() => setShowAddForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Download PDF */}
          <button onClick={() => downloadInvoicePdf(invoice, settings, payments)}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#f97316]/40 py-2.5 text-sm font-semibold text-[#f97316] hover:bg-[#f97316]/10">
            <Download size={16} /> Download Invoice PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Invoice Card ──

function InvoiceCard({ invoice, onClick, onDelete }: {
  invoice: Invoice; onClick: () => void; onDelete: () => void;
}) {
  const payments = invoice.payments ?? [];
  const summary = computeInvoicePaymentSummary(invoice.total, payments);
  const statusCfg = STATUS_CONFIG[summary.status];
  const StatusIcon = statusCfg.icon;
  const snap = invoice.customer_snapshot;

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
      className={`relative overflow-hidden rounded-2xl border ${statusCfg.border} bg-[#161b22] p-5 cursor-pointer hover:bg-[#1c2128] transition-all`}
      onClick={onClick}
    >
      <div className="pointer-events-none absolute top-1/2 right-6 -translate-y-1/2 -rotate-[30deg] select-none font-black text-4xl opacity-[0.06]"
        style={{ color: statusCfg.stampColor }}>{statusCfg.stamp}</div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-[#f97316]">{invoice.invoice_number}</span>
            <span className={`flex items-center gap-1 rounded-full ${statusCfg.bg} border ${statusCfg.border} px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${statusCfg.color}`}>
              <StatusIcon size={10} /> {statusCfg.label}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-white truncate">{snap?.name || "—"}</p>
          {snap?.phone && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-white/40">
              <Phone size={10} /> {snap.phone}
            </p>
          )}
          {invoice.due_date && <p className="mt-0.5 text-xs text-white/30">Due {invoice.due_date}</p>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10">
          <Trash2 size={13} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Total</p>
          <p className="text-sm font-bold text-white">{fmt(invoice.total)}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Paid</p>
          <p className="text-sm font-bold text-[#22c55e]">{fmt(summary.amountPaid)}</p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-wider text-white/30">Balance</p>
          <p className={`text-sm font-bold ${summary.balance > 0 ? "text-[#ef4444]" : "text-white/30"}`}>{fmt(summary.balance)}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Invoice Builder ──

function InvoiceBuilder({ seed, onSave, onCancel }: {
  seed?: Partial<Invoice> & { lineItems?: LineItem[] };
  onSave: (data: Omit<Invoice, "id" | "invoice_number" | "created_at" | "payment_status" | "payments">) => Promise<void>;
  onCancel: () => void;
}) {
  const { customers } = useCustomers();
  const [customerName, setCustomerName] = useState(seed?.customer_snapshot?.name || "");
  const [customerPhone, setCustomerPhone] = useState(seed?.customer_snapshot?.phone || "");
  const [customerAddress, setCustomerAddress] = useState(seed?.customer_snapshot?.address || "");
  const [customerVat, setCustomerVat] = useState(seed?.customer_snapshot?.vat || "");
  const [customerTin, setCustomerTin] = useState(seed?.customer_snapshot?.tin || "");
  const [customerId, setCustomerId] = useState<string | null>(seed?.customer_id ?? null);
  const [issuedBy, setIssuedBy] = useState(seed?.issued_by || "");
  const [remark, setRemark] = useState(seed?.remark || "");
  const [dueDate, setDueDate] = useState(seed?.due_date || "");
  const [calloutEnabled, setCalloutEnabled] = useState(seed?.callout_fee_enabled ?? true);
  const [calloutAmount, setCalloutAmount] = useState(seed?.callout_fee_amount ?? 15);
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (seed?.lineItems && seed.lineItems.length > 0) return seed.lineItems;
    if (seed?.line_items && seed.line_items.length > 0)
      return seed.line_items.map((i) => ({ description: i.description, quantity: i.qty, unit_price: i.unit_price }));
    return [emptyItem()];
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  const subtotal = lineItems.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const total = subtotal + (calloutEnabled ? calloutAmount : 0);

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setLineItems((prev) => { const next = [...prev]; next[idx] = { ...next[idx], [field]: value }; return next; });
  }

  function pickCustomer(c: Customer) {
    setCustomerId(c.id); setCustomerName(c.name);
    setCustomerPhone(c.phone || ""); setCustomerAddress(c.address || "");
    setCustomerVat(c.vat || ""); setCustomerTin(c.tin || "");
    setShowCustomerSearch(false); setCustomerSearch("");
  }

  async function handleSave() {
    if (!customerName.trim()) { setError("Customer name is required"); return; }
    const validItems = lineItems.filter((i) => i.description.trim());
    if (validItems.length === 0) { setError("Add at least one line item"); return; }
    setSaving(true); setError("");
    try {
      await onSave({
        customer_id: customerId,
        customer_snapshot: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          vat: customerVat.trim() || undefined,
          tin: customerTin.trim() || undefined,
        },
        quotation_id: seed?.quotation_id ?? null,
        source_quote_id: seed?.source_quote_id ?? null,
        line_items: toQuotationLineItems(validItems),
        callout_fee_enabled: calloutEnabled,
        callout_fee_amount: calloutAmount,
        subtotal, total,
        issued_by: issuedBy.trim(),
        remark: remark.trim() || null,
        due_date: dueDate || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
    } finally { setSaving(false); }
  }

  const filteredCustomers = customers.filter((c) =>
    customerSearch.trim() === "" ||
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    (c.phone || "").includes(customerSearch)
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <button onClick={onCancel} className="flex items-center gap-2 text-sm text-white/50 hover:text-white">
          <ArrowLeft size={16} /> Back to Invoices
        </button>
      </div>
      <h2 className="font-display text-xl font-bold text-white">
        {seed?.quotation_id ? "Invoice from Quotation" : "New Invoice"}
      </h2>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Customer */}
      <div className="rounded-2xl border border-white/10 bg-[#161b22] p-5 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Client</h3>
        <div className="relative">
          <button onClick={() => setShowCustomerSearch((s) => !s)}
            className="flex w-full items-center gap-2 rounded-xl border border-dashed border-white/20 px-3 py-2 text-sm text-white/40 hover:border-[#f97316]/40 hover:text-white/60 transition-colors">
            <Search size={14} /> Select existing customer
            {showCustomerSearch ? <ChevronUp size={14} className="ml-auto" /> : <ChevronDown size={14} className="ml-auto" />}
          </button>
          <AnimatePresence>
            {showCustomerSearch && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 right-0 mt-1 z-20 overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl">
                <div className="p-2 border-b border-white/10">
                  <input autoFocus type="text" value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search by name or phone…" className={inputCls} />
                </div>
                <div className="max-h-48 overflow-y-auto p-2">
                  {filteredCustomers.length === 0 ? (
                    <p className="text-center py-4 text-xs text-white/30">No customers found</p>
                  ) : filteredCustomers.map((c) => (
                    <button key={c.id} onClick={() => pickCustomer(c)}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-[#f97316]/10 transition-colors">
                      <User size={13} className="text-white/30" />
                      <div>
                        <p className="text-sm text-white">{c.name}</p>
                        {c.phone && <p className="text-xs text-white/40">{c.phone}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="grid gap-2">
          <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer Name *" className={inputCls} />
          <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="Phone Number" className={inputCls} />
          <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="Address" className={inputCls} />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" value={customerVat} onChange={(e) => setCustomerVat(e.target.value)} placeholder="VAT Number" className={inputCls} />
            <input type="text" value={customerTin} onChange={(e) => setCustomerTin(e.target.value)} placeholder="TIN Number" className={inputCls} />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="rounded-2xl border border-white/10 bg-[#161b22] p-5 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Invoice Details</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Issued By</label>
            <input type="text" value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="Your name" className={inputCls} />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Due Date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Remark / Notes</label>
          <textarea value={remark} onChange={(e) => setRemark(e.target.value)} rows={2} placeholder="Any notes for this invoice…" className={`${inputCls} resize-none`} />
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-2xl border border-white/10 bg-[#161b22] p-5 space-y-3">
        <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Line Items</h3>
        <div className="space-y-3">
          {lineItems.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex justify-end">
                {lineItems.length > 1 && (
                  <button onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_90px_80px_90px]">
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Description</label>
                  <input type="text" value={item.description} onChange={(e) => updateItem(idx, "description", e.target.value)} placeholder="e.g. DB Board Upgrade" className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Unit Price ($)</label>
                  <input type="number" min="0" step="0.01" value={item.unit_price} onChange={(e) => updateItem(idx, "unit_price", parseFloat(e.target.value) || 0)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Qty</label>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => updateItem(idx, "quantity", parseInt(e.target.value) || 1)} className={inputCls} />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Line Total</label>
                  <div className="flex items-center justify-end rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm font-semibold text-[#f97316]">
                    {fmt(item.quantity * item.unit_price)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setLineItems((prev) => [...prev, emptyItem()])}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f97316]/40 py-2.5 text-sm text-[#f97316] hover:bg-[#f97316]/5">
          <Plus size={15} /> Add Line Item
        </button>
      </div>

      {/* Call-out fee + totals */}
      <div className="rounded-2xl border border-white/10 bg-[#161b22] p-5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer">
            <input type="checkbox" checked={calloutEnabled} onChange={(e) => setCalloutEnabled(e.target.checked)} className="h-4 w-4 rounded accent-[#f97316]" />
            Include call-out fee
          </label>
          {calloutEnabled && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">$</span>
              <input type="number" min="0" step="0.01" value={calloutAmount} onChange={(e) => setCalloutAmount(parseFloat(e.target.value) || 0)}
                className="w-24 rounded-xl border border-white/10 bg-[#0d1117] px-3 py-1.5 text-sm text-white focus:border-[#f97316] focus:outline-none" />
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/60"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
          {calloutEnabled && (
            <div className="flex justify-between font-semibold text-[#f97316]"><span>Call-Out Fee</span><span>{fmt(calloutAmount)}</span></div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 font-display text-lg font-bold text-white">
            <span>Total</span><span>{fmt(total)}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-[#f97316] py-3 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Create Invoice
        </button>
        <button onClick={onCancel} className="rounded-full border border-white/10 px-5 py-3 text-sm text-white/60 hover:text-white">Cancel</button>
      </div>
    </div>
  );
}

// ── Main InvoiceAdmin Component ──

export interface InvoiceAdminProps {
  settings: any;
  convertSeed?: Partial<Invoice> & { lineItems?: LineItem[] };
  onConvertDone?: () => void;
}

export function InvoiceAdmin({ settings, convertSeed, onConvertDone }: InvoiceAdminProps) {
  const { invoices, ready, addInvoice, addPayment, removePayment, removeInvoice } = useInvoices();
  const [view, setView] = useState<"list" | "builder">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [builderSeed, setBuilderSeed] = useState<(Partial<Invoice> & { lineItems?: LineItem[] }) | undefined>(convertSeed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "unpaid" | "partially_paid" | "paid">("all");

  // Keep selectedInvoice in sync when invoices update (e.g. after adding a payment)
  const liveSelectedInvoice = selectedInvoice
    ? (invoices.find((inv) => inv.id === selectedInvoice.id) ?? selectedInvoice)
    : null;

  async function handleSave(data: Omit<Invoice, "id" | "invoice_number" | "created_at" | "payment_status" | "payments">) {
    await addInvoice(data);
    setView("list"); setBuilderSeed(undefined); onConvertDone?.();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    if (selectedInvoice?.id === id) setSelectedInvoice(null);
    await removeInvoice(id);
  }

  const filtered = invoices.filter((inv) => {
    const snap = inv.customer_snapshot;
    const payments = inv.payments ?? [];
    const matchSearch = search.trim() === "" ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (snap?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" ||
      computeInvoicePaymentSummary(inv.total, payments).status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (view === "builder") {
    return <InvoiceBuilder seed={builderSeed} onSave={handleSave} onCancel={() => { setView("list"); setBuilderSeed(undefined); onConvertDone?.(); }} />;
  }

  return (
    <div className="flex flex-col">
      {/* Toolbar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invoices…"
            className={`${inputCls} pl-9`} />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
              <X size={14} />
            </button>
          )}
        </div>
        <button onClick={() => { setBuilderSeed(undefined); setView("builder"); }}
          className="flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-black hover:bg-orange-400 whitespace-nowrap">
          <Plus size={14} /> New Invoice
        </button>
      </div>

      {/* Status filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {([{ key: "all", label: "All" }, { key: "unpaid", label: "Unpaid" }, { key: "partially_paid", label: "Partially Paid" }, { key: "paid", label: "Paid" }] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setStatusFilter(key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${statusFilter === key ? "border-[#f97316] bg-[#f97316]/10 text-[#f97316]" : "border-white/10 text-white/50 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {!ready ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[#f97316]" /></div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#161b22] py-16 text-center">
          <FileText size={32} className="text-white/20" />
          <p className="text-sm text-white/40">{invoices.length === 0 ? "No invoices yet — create your first one." : "No matching invoices."}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filtered.map((inv) => (
              <InvoiceCard key={inv.id} invoice={inv}
                onClick={() => setSelectedInvoice(inv)} onDelete={() => handleDelete(inv.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {liveSelectedInvoice && (
          <InvoicePaymentPanel
            invoice={liveSelectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            settings={settings}
            addPayment={addPayment}
            removePayment={removePayment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}