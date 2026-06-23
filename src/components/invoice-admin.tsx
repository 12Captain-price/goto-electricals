import { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Search,
  X,
  FileText,
  User,
  Phone,
  Loader2,
  ArrowLeft,
  AlertCircle,
  Save,
  Download,
  CheckCircle,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  History,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useInvoices,
  useInvoicePayments,
  useAllInvoicePayments,
  useCustomers,
  computeInvoicePaymentSummary,
  PAYMENT_METHOD_LABELS,
  type Invoice,
  type InvoicePayment,
  type Customer,
  type QuotationLineItem,
} from "../lib/quotes-store";
import { downloadInvoicePdf } from "../lib/invoice-pdf";

// ── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  unpaid: {
    label: "Unpaid",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertTriangle,
    stamp: "UNPAID",
    stampColor: "#dc2626",
  },
  partially_paid: {
    label: "Partially Paid",
    color: "bg-amber-100 text-amber-700 border-amber-200",
    icon: Clock,
    stamp: "PARTIALLY PAID",
    stampColor: "#d97706",
  },
  paid: {
    label: "Paid",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
    stamp: "PAID",
    stampColor: "#16a34a",
  },
};

function fmt(n: number) {
  return `$${n.toFixed(2)}`;
}

// ── Empty line item ───────────────────────────────────────────────────────────

type LineItem = { description: string; quantity: number; unit_price: number };

function emptyItem(): LineItem {
  return { description: "", quantity: 1, unit_price: 0 };
}

// Map the builder's LineItem shape → QuotationLineItem shape used by Invoice
function toQuotationLineItems(items: LineItem[]): QuotationLineItem[] {
  return items.map((i) => ({
    description: i.description,
    unit_price: i.unit_price,
    qty: i.quantity,
    total: i.quantity * i.unit_price,
  }));
}

// ── Payment Row ───────────────────────────────────────────────────────────────

function PaymentRow({
  payment,
  onDelete,
}: {
  payment: InvoicePayment;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-gray-900">
            {fmt(payment.amount)}
          </span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
            {PAYMENT_METHOD_LABELS[payment.method]}
          </span>
          <span className="text-xs text-gray-400">{payment.paid_at}</span>
        </div>
        {payment.note && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{payment.note}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        className="ml-2 p-1 text-gray-300 hover:text-red-500 transition-colors shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Add Payment Form ──────────────────────────────────────────────────────────

function AddPaymentForm({
  invoiceId,
  onDone,
}: {
  invoiceId: string;
  onDone: () => void;
}) {
  const { addPayment } = useInvoicePayments(invoiceId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<InvoicePayment["method"]>("cash");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      await addPayment({
        invoice_id: invoiceId,
        amount: amt,
        method,
        note: note.trim() || null,
        paid_at: date,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 space-y-3">
      <h4 className="text-sm font-semibold text-gray-700">Record Payment</h4>

      {error && (
        <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Amount ($)
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Payment Method
        </label>
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as InvoicePayment["method"])}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        >
          {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Note (what was this payment for?)
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. Deposit for DB board upgrade"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 rounded-lg text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
          Save Payment
        </button>
        <button
          onClick={onDone}
          className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Invoice Detail (payment tracking panel) ───────────────────────────────────

function InvoicePaymentPanel({
  invoice,
  onClose,
  settings,
}: {
  invoice: Invoice;
  onClose: () => void;
  settings: any;
}) {
  const { payments, ready, removePayment } = useInvoicePayments(invoice.id);
  const [showAddForm, setShowAddForm] = useState(false);

  const summary = computeInvoicePaymentSummary(invoice.total, payments);
  const statusCfg = STATUS_CONFIG[summary.status];

  async function handleDelete(paymentId: string) {
    if (!confirm("Remove this payment record?")) return;
    await removePayment(paymentId);
  }

  function handleDownloadPDF() {
    downloadInvoicePdf(invoice, settings, payments);
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-900">{invoice.invoice_number}</h2>
            <p className="text-xs text-gray-500">
              {invoice.customer_snapshot?.name || "—"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Status + totals */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Invoice Total</span>
              <span className="font-bold text-gray-900">{fmt(invoice.total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Amount Paid</span>
              <span className="font-semibold text-green-700">
                {fmt(summary.amountPaid)}
              </span>
            </div>
            {summary.balance > 0 && (
              <div className="flex items-center justify-between border-t border-gray-200 pt-2 mt-2">
                <span className="text-sm font-medium text-gray-700">
                  Balance Remaining
                </span>
                <span className="font-bold text-red-600">
                  {fmt(summary.balance)}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-gray-500">Status</span>
              <span
                className={`text-xs font-semibold px-3 py-1 rounded-full border ${statusCfg.color}`}
              >
                {statusCfg.label}
              </span>
            </div>
            {invoice.due_date && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Due Date</span>
                <span className="text-xs text-gray-700">{invoice.due_date}</span>
              </div>
            )}
          </div>

          {/* Payment history */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
                <History size={14} />
                Payment History
              </h3>
              {summary.status !== "paid" && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-xs bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                >
                  <Plus size={12} />
                  Add Payment
                </button>
              )}
            </div>

            {!ready ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 size={20} className="animate-spin text-gray-400" />
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">
                No payments recorded yet
              </div>
            ) : (
              <div className="bg-white border border-gray-100 rounded-xl px-3">
                {payments.map((p) => (
                  <PaymentRow
                    key={p.id}
                    payment={p}
                    onDelete={() => handleDelete(p.id)}
                  />
                ))}
              </div>
            )}

            <AnimatePresence>
              {showAddForm && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-3"
                >
                  <AddPaymentForm
                    invoiceId={invoice.id}
                    onDone={() => setShowAddForm(false)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            className="w-full border border-gray-200 hover:border-yellow-400 hover:bg-yellow-50 text-gray-700 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} />
            Download Invoice PDF
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Invoice Card ──────────────────────────────────────────────────────────────

function InvoiceCard({
  invoice,
  payments,
  onClick,
  onDelete,
}: {
  invoice: Invoice;
  payments: InvoicePayment[];
  onClick: () => void;
  onDelete: () => void;
}) {
  const summary = computeInvoicePaymentSummary(invoice.total, payments);
  const statusCfg = STATUS_CONFIG[summary.status];
  const StatusIcon = statusCfg.icon;
  const snap = invoice.customer_snapshot;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer relative overflow-hidden"
      onClick={onClick}
    >
      {/* Status stamp watermark */}
      <div
        className="absolute top-1/2 right-4 -translate-y-1/2 opacity-[0.07] pointer-events-none select-none font-black text-4xl rotate-[-30deg]"
        style={{ color: statusCfg.stampColor }}
      >
        {statusCfg.stamp}
      </div>

      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 text-sm">
              {invoice.invoice_number}
            </span>
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${statusCfg.color}`}
            >
              <StatusIcon size={11} />
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-700 mt-0.5 truncate">
            {snap?.name || "—"}
          </p>
          {snap?.phone && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              <Phone size={10} />
              {snap.phone}
            </p>
          )}
          {invoice.due_date && (
            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
              Due {invoice.due_date}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-gray-300 hover:text-red-500 transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Totals */}
      <div className="mt-3 pt-3 border-t border-gray-50 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-xs text-gray-400">Total</p>
          <p className="text-sm font-bold text-gray-900">{fmt(invoice.total)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Paid</p>
          <p className="text-sm font-bold text-green-600">
            {fmt(summary.amountPaid)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Balance</p>
          <p
            className={`text-sm font-bold ${
              summary.balance > 0 ? "text-red-600" : "text-gray-400"
            }`}
          >
            {fmt(summary.balance)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ── Invoice Builder ───────────────────────────────────────────────────────────

function InvoiceBuilder({
  seed,
  onSave,
  onCancel,
}: {
  seed?: Partial<Invoice> & { lineItems?: LineItem[] };
  onSave: (data: Omit<Invoice, "id" | "invoice_number" | "created_at" | "payment_status">) => Promise<void>;
  onCancel: () => void;
}) {
  const { customers } = useCustomers();

  // Customer fields
  const [customerName, setCustomerName] = useState(
    seed?.customer_snapshot?.name || ""
  );
  const [customerPhone, setCustomerPhone] = useState(
    seed?.customer_snapshot?.phone || ""
  );
  const [customerAddress, setCustomerAddress] = useState(
    seed?.customer_snapshot?.address || ""
  );
  const [customerId, setCustomerId] = useState<string | null>(
    seed?.customer_id ?? null
  );

  // Invoice fields
  const [issuedBy, setIssuedBy] = useState(seed?.issued_by || "");
  const [remark, setRemark] = useState(seed?.remark || "");
  const [dueDate, setDueDate] = useState(seed?.due_date || "");
  const [calloutEnabled, setCalloutEnabled] = useState(
    seed?.callout_fee_enabled ?? true
  );
  const [calloutAmount, setCalloutAmount] = useState(
    seed?.callout_fee_amount ?? 15
  );
  // Seed line items may come as QuotationLineItem[] (from conversion) or LineItem[]
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (seed?.lineItems && seed.lineItems.length > 0) return seed.lineItems;
    if (seed?.line_items && seed.line_items.length > 0) {
      return seed.line_items.map((i) => ({
        description: i.description,
        quantity: i.qty,
        unit_price: i.unit_price,
      }));
    }
    return [emptyItem()];
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Totals
  const subtotal = lineItems.reduce(
    (s, i) => s + i.quantity * i.unit_price,
    0
  );
  const total = subtotal + (calloutEnabled ? calloutAmount : 0);

  function updateItem(
    idx: number,
    field: keyof LineItem,
    value: string | number
  ) {
    setLineItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function addItem() {
    setLineItems((prev) => [...prev, emptyItem()]);
  }

  function removeItem(idx: number) {
    setLineItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function pickCustomer(c: Customer) {
    setCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone || "");
    setCustomerAddress(c.address || "");
    setShowCustomerSearch(false);
    setCustomerSearch("");
  }

  async function handleSave() {
    if (!customerName.trim()) {
      setError("Customer name is required");
      return;
    }
    const validItems = lineItems.filter((i) => i.description.trim());
    if (validItems.length === 0) {
      setError("Add at least one line item");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        customer_id: customerId,
        customer_snapshot: {
          name: customerName.trim(),
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
        },
        quotation_id: seed?.quotation_id ?? null,
        source_quote_id: seed?.source_quote_id ?? null,
        line_items: toQuotationLineItems(validItems),
        callout_fee_enabled: calloutEnabled,
        callout_fee_amount: calloutAmount,
        subtotal,
        total,
        issued_by: issuedBy.trim(),
        remark: remark.trim() || null,
        due_date: dueDate || null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  }

  const filteredCustomers = customers.filter(
    (c) =>
      customerSearch.trim() === "" ||
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phone || "").includes(customerSearch)
  );

  return (
    <div className="h-full overflow-y-auto px-1">
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-bold text-gray-900 text-lg">
            {seed?.quotation_id ? "Invoice from Quotation" : "New Invoice"}
          </h2>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Customer Section */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <User size={14} />
            Customer
          </h3>

          {/* Search existing customers */}
          <div className="relative">
            <button
              onClick={() => setShowCustomerSearch((s) => !s)}
              className="w-full text-left border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-500 hover:border-yellow-400 hover:text-gray-700 transition-colors flex items-center gap-2"
            >
              <Search size={14} />
              Select existing customer
              {showCustomerSearch ? (
                <ChevronUp size={14} className="ml-auto" />
              ) : (
                <ChevronDown size={14} className="ml-auto" />
              )}
            </button>

            <AnimatePresence>
              {showCustomerSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden"
                >
                  <div className="p-2 border-b border-gray-100">
                    <input
                      autoFocus
                      type="text"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      placeholder="Search by name or phone…"
                      className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No customers found
                      </p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => pickCustomer(c)}
                          className="w-full text-left px-4 py-2.5 hover:bg-yellow-50 transition-colors"
                        >
                          <p className="text-sm font-medium text-gray-800">
                            {c.name}
                          </p>
                          {c.phone && (
                            <p className="text-xs text-gray-400">{c.phone}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Customer Name *"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone Number"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
            <input
              type="text"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              placeholder="Address"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
            />
          </div>
        </div>

        {/* Invoice Details */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <FileText size={14} />
            Invoice Details
          </h3>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Issued By
              </label>
              <input
                type="text"
                value={issuedBy}
                onChange={(e) => setIssuedBy(e.target.value)}
                placeholder="Your name"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Remark / Notes
            </label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
              placeholder="Any notes for this invoice…"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none"
            />
          </div>
        </div>

        {/* Line Items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-700">Line Items</h3>

          <div className="space-y-2">
            {lineItems.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(idx, "description", e.target.value)
                    }
                    placeholder="Description"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 mb-1"
                  />
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(idx, "quantity", parseInt(e.target.value) || 1)
                      }
                      placeholder="Qty"
                      className="w-16 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price}
                      onChange={(e) =>
                        updateItem(
                          idx,
                          "unit_price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="Unit price"
                      className="flex-1 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                    />
                    <span className="py-1.5 text-sm text-gray-500 shrink-0 min-w-[60px] text-right">
                      {fmt(item.quantity * item.unit_price)}
                    </span>
                  </div>
                </div>
                {lineItems.length > 1 && (
                  <button
                    onClick={() => removeItem(idx)}
                    className="mt-2 p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-yellow-400 hover:text-gray-700 transition-colors flex items-center justify-center gap-1"
          >
            <Plus size={14} />
            Add Line Item
          </button>
        </div>

        {/* Callout Fee */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                Call-out Fee
              </h3>
              <p className="text-xs text-gray-400">
                Site visit / call-out charge
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={calloutEnabled}
                onChange={(e) => setCalloutEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 peer-checked:bg-yellow-400 rounded-full transition-colors relative">
                <div
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    calloutEnabled ? "translate-x-4" : ""
                  }`}
                />
              </div>
            </label>
          </div>

          {calloutEnabled && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={calloutAmount}
                onChange={(e) =>
                  setCalloutAmount(parseFloat(e.target.value) || 0)
                }
                className="w-28 border border-gray-200 rounded-xl px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
              />
            </div>
          )}
        </div>

        {/* Totals summary */}
        <div className="bg-gray-900 rounded-2xl p-4 text-white space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Subtotal</span>
            <span>{fmt(subtotal)}</span>
          </div>
          {calloutEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Call-out Fee</span>
              <span>{fmt(calloutAmount)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg border-t border-gray-700 pt-2 mt-2">
            <span>Total</span>
            <span className="text-yellow-400">{fmt(total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-3 rounded-2xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Create Invoice
          </button>
          <button
            onClick={onCancel}
            className="px-5 py-3 border border-gray-200 rounded-2xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main InvoiceAdmin Component ───────────────────────────────────────────────

export interface InvoiceAdminProps {
  settings: any;
  /** If provided, opens the builder pre-seeded (used when converting a quotation) */
  convertSeed?: Partial<Invoice> & { lineItems?: LineItem[] };
  onConvertDone?: () => void;
}

export function InvoiceAdmin({
  settings,
  convertSeed,
  onConvertDone,
}: InvoiceAdminProps) {
  const {
    invoices,
    ready,
    addInvoice,
    removeInvoice,
  } = useInvoices();

  const { paymentsByInvoice } = useAllInvoicePayments();

  const [view, setView] = useState<"list" | "builder">("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [builderSeed, setBuilderSeed] = useState<
    (Partial<Invoice> & { lineItems?: LineItem[] }) | undefined
  >(convertSeed);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "unpaid" | "partially_paid" | "paid"
  >("all");

  // Open builder from a quotation conversion
  useEffect(() => {
    if (convertSeed) {
      setBuilderSeed(convertSeed);
      setView("builder");
    }
  }, [convertSeed]);

  async function handleSave(
    data: Omit<Invoice, "id" | "invoice_number" | "created_at" | "payment_status">
  ) {
    await addInvoice(data);
    setView("list");
    setBuilderSeed(undefined);
    onConvertDone?.();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await removeInvoice(id);
  }

  const filtered = invoices.filter((inv) => {
    const snap = inv.customer_snapshot;
    const payments = paymentsByInvoice[inv.id] ?? [];
    const matchSearch =
      search.trim() === "" ||
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      (snap?.name || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === "all" ||
      computeInvoicePaymentSummary(inv.total, payments).status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (view === "builder") {
    return (
      <InvoiceBuilder
        seed={builderSeed}
        onSave={handleSave}
        onCancel={() => {
          setView("list");
          setBuilderSeed(undefined);
          onConvertDone?.();
        }}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoices…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => {
            setBuilderSeed(undefined);
            setView("builder");
          }}
          className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-4 py-2 rounded-xl text-sm flex items-center gap-1 whitespace-nowrap transition-colors"
        >
          <Plus size={14} />
          New Invoice
        </button>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {(
          [
            { key: "all", label: "All" },
            { key: "unpaid", label: "Unpaid" },
            { key: "partially_paid", label: "Partially Paid" },
            { key: "paid", label: "Paid" },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              statusFilter === key
                ? "bg-gray-900 text-white border-gray-900"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Invoice list */}
      {!ready ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-16">
          <FileText size={32} className="text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">
            {invoices.length === 0 ? "No invoices yet" : "No matching invoices"}
          </p>
          <p className="text-gray-400 text-sm mt-1">
            {invoices.length === 0
              ? "Convert a quotation or create one from scratch"
              : "Try adjusting your search or filter"}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-3">
          <AnimatePresence>
            {filtered.map((inv) => (
              <InvoiceCard
                key={inv.id}
                invoice={inv}
                payments={paymentsByInvoice[inv.id] ?? []}
                onClick={() => setSelectedInvoice(inv)}
                onDelete={() => handleDelete(inv.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Payment panel modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <InvoicePaymentPanel
            invoice={selectedInvoice}
            onClose={() => setSelectedInvoice(null)}
            settings={settings}
          />
        )}
      </AnimatePresence>
    </div>
  );
}