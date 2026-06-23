import { useState, useEffect } from "react";
import {
  Plus, Trash2, Search, X, FileText, User, Phone,
  Loader2, ArrowLeft, AlertCircle, Save, Download, Copy, Receipt,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  useQuotations, useCustomers, computeQuotationTotals,
  type Quotation, type QuotationLineItem, type Customer,
} from "@/lib/quotes-store";
import { downloadQuotationPdf } from "@/components/quotation-pdf";
import type { ContactInfo } from "@/lib/site-store";

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f97316] focus:outline-none";

// ── Customer search/select combobox ──

function CustomerPicker({ customers, selected, onSelect, onClear }: {
  customers: Customer[];
  selected: Customer | null;
  onSelect: (c: Customer) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = customers.filter(
    (c) => c.name.toLowerCase().includes(query.toLowerCase()) || (c.phone ?? "").includes(query)
  );

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#f97316]/40 bg-[#f97316]/[0.06] px-4 py-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-[#f97316]" />
          <div>
            <div className="text-sm font-semibold text-white">{selected.name}</div>
            {selected.phone && <div className="text-xs text-white/40">{selected.phone}</div>}
          </div>
        </div>
        <button onClick={onClear} title="Change customer" aria-label="Change customer" className="text-white/40 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search saved customers, or type a new name below..."
          className={`${inputCls} pl-9`}
        />
      </div>
      <AnimatePresence>
        {open && query && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl"
            >
              <div className="max-h-56 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-center text-xs text-white/30">No saved customer matches — type their details below instead.</p>
                ) : (
                  filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onSelect(c); setOpen(false); setQuery(""); }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f97316]/10"
                    >
                      <User className="h-3.5 w-3.5 text-white/40" />
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white">{c.name}</div>
                        {c.phone && <div className="truncate text-xs text-white/40">{c.phone}</div>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Shared seed type (used by duplicate + convert-to-quotation) ──

export type BuilderSeed = {
  clientName: string;
  clientPhone: string;
  clientAddress: string;
  items: QuotationLineItem[];
  calloutEnabled: boolean;
  issuedBy: string;
  remark: string;
};

// ── Invoice seed type (passed up to Dashboard when converting a quotation) ──

export type InvoiceSeed = {
  quotationId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  lineItems: { description: string; quantity: number; unit_price: number }[];
  calloutEnabled: boolean;
  calloutAmount: number;
  issuedBy: string;
  remark?: string;
};

// ── Builder ──

function QuotationBuilder({ companyDefaultFee, onClose, onSaved, seed }: {
  companyDefaultFee: number;
  onClose: () => void;
  onSaved: () => void;
  seed?: BuilderSeed;
}) {
  const { customers } = useCustomers();
  const { addQuotation } = useQuotations();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [clientName, setClientName] = useState(seed?.clientName ?? "");
  const [clientPhone, setClientPhone] = useState(seed?.clientPhone ?? "");
  const [clientAddress, setClientAddress] = useState(seed?.clientAddress ?? "");
  const [items, setItems] = useState<QuotationLineItem[]>(seed?.items ?? []);
  const [calloutEnabled, setCalloutEnabled] = useState(seed?.calloutEnabled ?? true);
  const [issuedBy, setIssuedBy] = useState(seed?.issuedBy ?? "");
  const [remark, setRemark] = useState(seed?.remark ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isDuplicate = !!seed && seed.items.length > 0;
  const isConvert = !!seed && seed.items.length === 0;

  const { subtotal, total } = computeQuotationTotals(items, calloutEnabled, companyDefaultFee);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setClientName(c.name);
    setClientPhone(c.phone ?? "");
    setClientAddress(c.address ?? "");
  };

  const addLineItem = () => setItems([...items, { description: "", unit_price: 0, qty: 1, total: 0 }]);

  const updateLineItem = (idx: number, patch: Partial<QuotationLineItem>) => {
    setItems(items.map((it, i) => {
      if (i !== idx) return it;
      const next = { ...it, ...patch };
      next.total = next.unit_price * next.qty;
      return next;
    }));
  };

  const removeLineItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setErr(null);
    if (!clientName.trim()) return setErr("Client name is required.");
    if (!issuedBy.trim()) return setErr("Please enter who is issuing this quotation.");
    if (items.length === 0) return setErr("Add at least one line item.");

    setSaving(true);
    try {
      await addQuotation({
        customer_id: selectedCustomer?.id ?? null,
        customer_snapshot: { name: clientName.trim(), phone: clientPhone.trim(), address: clientAddress.trim() },
        source_quote_id: null,
        line_items: items,
        callout_fee_enabled: calloutEnabled,
        callout_fee_amount: companyDefaultFee,
        subtotal,
        total,
        issued_by: issuedBy.trim(),
        remark: remark.trim() || null,
      });
      onSaved();
    } catch (e) {
      console.error("[QuotationBuilder] save failed:", e);
      setErr("Failed to save quotation — check your connection and try again.");
    }
    setSaving(false);
  };

  return (
    <div>
      <button onClick={onClose} className="mb-6 flex items-center gap-2 text-sm text-white/50 hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to Quotations
      </button>

      <h2 className="mb-1 font-display text-xl font-bold text-white">
        {isDuplicate ? "Duplicate Quotation" : isConvert ? "New Quotation from Quote Request" : "New Quotation"}
      </h2>
      <p className="mb-6 text-sm text-white/50">
        {isDuplicate
          ? "Pre-filled from the original — edit anything, then save to create a new numbered quotation."
          : isConvert
          ? "Client details pre-filled from the quote request — add your line items and save."
          : "This creates a formal, numbered quotation — separate from WhatsApp quote requests."}
      </p>

      {/* Customer */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#161b22] p-5">
        <h3 className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Client</h3>
        <CustomerPicker
          customers={customers}
          selected={selectedCustomer}
          onSelect={handleSelectCustomer}
          onClear={() => { setSelectedCustomer(null); setClientName(""); setClientPhone(""); setClientAddress(""); }}
        />
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="Client name" className={inputCls} />
          <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} placeholder="Phone" className={inputCls} />
          <input value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} placeholder="Address" className={inputCls} />
        </div>
      </div>

      {/* Line items */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#161b22] p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Services / Line Items</h3>
        </div>

        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={idx} className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-end">
                <button
                  onClick={() => removeLineItem(idx)}
                  aria-label="Remove line item"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_110px_90px_110px]">
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Description</label>
                  <input
                    value={item.description}
                    onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                    placeholder="e.g. DB Board Upgrade"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Unit Price ($)</label>
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => updateLineItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Quantity</label>
                  <input
                    type="number"
                    value={item.qty}
                    onChange={(e) => updateLineItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                    placeholder="1"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="mb-1 block font-mono text-[9px] uppercase tracking-[0.15em] text-white/30">Line Total</label>
                  <div className="flex items-center justify-end rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm font-semibold text-[#f97316]">
                    ${item.total.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addLineItem}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f97316]/40 py-2.5 text-sm text-[#f97316] hover:bg-[#f97316]/5"
        >
          <Plus className="h-4 w-4" /> Add Line Item
        </button>
      </div>

      {/* Call-out fee toggle + totals */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-[#161b22] p-5">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 text-sm text-white/70">
            <input
              type="checkbox"
              checked={calloutEnabled}
              onChange={(e) => setCalloutEnabled(e.target.checked)}
              className="h-4 w-4 rounded accent-[#f97316]"
            />
            Include ${companyDefaultFee.toFixed(2)} call-out fee
          </label>
        </div>
        <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between text-white/60">
            <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {calloutEnabled && (
            <div className="flex justify-between font-semibold text-[#f97316]">
              <span>Call-Out Fee</span><span>${companyDefaultFee.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-white/10 pt-2 font-display text-lg font-bold text-white">
            <span>Total</span><span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Issued by + remark */}
      <div className="mb-6 grid gap-4 rounded-2xl border border-white/10 bg-[#161b22] p-5 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Issued By</label>
          <input value={issuedBy} onChange={(e) => setIssuedBy(e.target.value)} placeholder="Your name" className={inputCls} />
        </div>
        <div>
          <label className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Remark (optional)</label>
          <input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="e.g. urgent, follow-up job" className={inputCls} />
        </div>
      </div>

      {err && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="h-4 w-4" /> {err}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#f97316] py-3 text-sm font-semibold text-black hover:bg-orange-400 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {isDuplicate ? "Save as New Quotation" : "Save Quotation"}
      </button>
    </div>
  );
}

// ── Quotation Card ──

function QuotationCard({ q, contact, defaultCalloutFee, onDuplicate, onConvertToInvoice }: {
  q: Quotation;
  contact: ContactInfo;
  defaultCalloutFee: number;
  onDuplicate: (seed: BuilderSeed) => void;
  onConvertToInvoice: (seed: InvoiceSeed) => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const [dlErr, setDlErr] = useState<string | null>(null);
  const date = new Date(q.created_at);

  const handleDownload = async () => {
    setDlErr(null);
    setDownloading(true);
    try {
      await downloadQuotationPdf(q, contact);
    } catch (e) {
      console.error("[QuotationCard] PDF generation failed:", e);
      setDlErr("PDF generation failed — please try again.");
    }
    setDownloading(false);
  };

  const handleDuplicate = () => {
    onDuplicate({
      clientName: q.customer_snapshot.name,
      clientPhone: q.customer_snapshot.phone ?? "",
      clientAddress: q.customer_snapshot.address ?? "",
      items: q.line_items.map((it) => ({ ...it })),
      calloutEnabled: q.callout_fee_enabled,
      issuedBy: q.issued_by,
      remark: q.remark ?? "",
    });
  };

  const handleConvertToInvoice = () => {
    onConvertToInvoice({
      quotationId: q.id,
      customerName: q.customer_snapshot.name,
      customerPhone: q.customer_snapshot.phone ?? "",
      customerAddress: q.customer_snapshot.address ?? "",
      lineItems: q.line_items.map((it) => ({
        description: it.description,
        quantity: it.qty,
        unit_price: it.unit_price,
      })),
      calloutEnabled: q.callout_fee_enabled,
      calloutAmount: q.callout_fee_amount ?? defaultCalloutFee,
      issuedBy: q.issued_by,
      remark: q.remark ?? undefined,
    });
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#161b22] p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm font-bold text-[#f97316]">{q.quote_number}</span>
        <span className="font-mono text-[10px] text-white/30">{date.toLocaleDateString()}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <User className="h-3.5 w-3.5 text-white/40" />
        <span className="text-sm font-semibold text-white">{q.customer_snapshot.name}</span>
      </div>
      {q.customer_snapshot.phone && (
        <div className="mt-1.5 flex items-center gap-2 text-sm text-white/50">
          <Phone className="h-3.5 w-3.5 text-white/30" /> {q.customer_snapshot.phone}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
          {q.line_items.length} item{q.line_items.length === 1 ? "" : "s"}
        </span>
        <span className="font-display text-lg font-bold text-white">${q.total.toFixed(2)}</span>
      </div>

      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-wider text-white/30">
        Issued by {q.issued_by}
      </div>

      {dlErr && (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" /> {dlErr}
        </div>
      )}

      <div className="mt-4 flex gap-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[#f97316]/40 py-2.5 text-sm font-semibold text-[#f97316] hover:bg-[#f97316]/10 disabled:opacity-50"
        >
          {downloading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
          ) : (
            <><Download className="h-4 w-4" /> PDF</>
          )}
        </button>
        <button
          onClick={handleDuplicate}
          title="Duplicate this quotation"
          aria-label="Duplicate quotation"
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-white/60 hover:border-white/30 hover:text-white"
        >
          <Copy className="h-4 w-4" /> Duplicate
        </button>
        <button
          onClick={handleConvertToInvoice}
          title="Convert to invoice"
          aria-label="Convert to invoice"
          className="flex items-center justify-center gap-2 rounded-full border border-[#a855f7]/40 bg-[#a855f7]/10 px-4 py-2.5 text-sm font-semibold text-[#a855f7] hover:bg-[#a855f7]/20"
        >
          <Receipt className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ── List + builder container ──

export function QuotationsAdmin({
  defaultCalloutFee,
  contact,
  incomingSeed,
  onSeedConsumed,
  onConvertToInvoice,
}: {
  defaultCalloutFee: number;
  contact: ContactInfo;
  incomingSeed?: BuilderSeed;
  onSeedConsumed?: () => void;
  onConvertToInvoice: (seed: InvoiceSeed) => void;
}) {
  const { quotations, ready } = useQuotations();
  const [view, setView] = useState<"list" | "builder">("list");
  const [builderSeed, setBuilderSeed] = useState<BuilderSeed | undefined>(undefined);

  useEffect(() => {
    if (incomingSeed) {
      setBuilderSeed(incomingSeed);
      setView("builder");
      onSeedConsumed?.();
    }
  }, [incomingSeed]);

  const openBuilder = (seed?: BuilderSeed) => {
    setBuilderSeed(seed);
    setView("builder");
  };

  const closeBuilder = () => {
    setBuilderSeed(undefined);
    setView("list");
  };

  if (view === "builder") {
    return (
      <QuotationBuilder
        companyDefaultFee={defaultCalloutFee}
        onClose={closeBuilder}
        onSaved={closeBuilder}
        seed={builderSeed}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Quotations</h1>
        <button
          onClick={() => openBuilder()}
          className="flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-black hover:bg-orange-400"
        >
          <Plus className="h-4 w-4" /> New Quotation
        </button>
      </div>
      <p className="mb-6 max-w-2xl text-sm text-white/60">
        Formal, numbered quotations for loyal customers and bigger jobs — separate from casual WhatsApp quote requests.
      </p>

      {!ready ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[#f97316]" />
        </div>
      ) : quotations.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-[#161b22] py-16 text-center">
          <FileText className="h-8 w-8 text-white/20" />
          <p className="text-sm text-white/40">No quotations yet — create your first one.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quotations.map((q) => (
            <QuotationCard
              key={q.id}
              q={q}
              contact={contact}
              defaultCalloutFee={defaultCalloutFee}
              onDuplicate={(seed) => openBuilder(seed)}
              onConvertToInvoice={onConvertToInvoice}
            />
          ))}
        </div>
      )}
    </div>
  );
}