import { useMemo, useState } from "react";
import {
  Plus, Trash2, Search, X, ChevronDown, FileText, User, Phone, MapPin,
  CheckCircle, Loader2, ArrowLeft, Zap, AlertCircle, Save,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Service } from "@/lib/site-store";
import {
  useQuotations, useCustomers, computeQuotationTotals,
  type Quotation, type QuotationLineItem, type Customer,
} from "@/lib/quotes-store";

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f97316] focus:outline-none";

// ── Searchable operation picker (nice combobox, not a plain <select>) ──

type FlatOperation = { serviceTitle: string; name: string; price: string };

function OperationPicker({ services, onPick }: { services: Service[]; onPick: (op: FlatOperation) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const flatOps: FlatOperation[] = useMemo(() => {
    const list: FlatOperation[] = [];
    services.forEach((s) => {
      s.operations.forEach((op) => {
        if (op.name.trim()) list.push({ serviceTitle: s.title, name: op.name, price: op.price });
      });
    });
    return list;
  }, [services]);

  const filtered = flatOps.filter(
    (op) =>
      op.name.toLowerCase().includes(query.toLowerCase()) ||
      op.serviceTitle.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs font-semibold text-white/60 transition hover:border-[#f97316]/50 hover:text-[#f97316]"
      >
        <Zap className="h-3 w-3" /> Pick from Services <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] shadow-2xl"
            >
              <div className="border-b border-white/10 p-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search operations..."
                    className={`${inputCls} pl-8 text-xs`}
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto p-2">
                {filtered.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-white/30">
                    {flatOps.length === 0 ? "No service operations set up yet." : "No matches."}
                  </p>
                ) : (
                  filtered.map((op, i) => (
                    <button
                      key={`${op.serviceTitle}-${op.name}-${i}`}
                      type="button"
                      onClick={() => { onPick(op); setOpen(false); setQuery(""); }}
                      className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition hover:bg-[#f97316]/10"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white">{op.name}</div>
                        <div className="truncate font-mono text-[10px] uppercase tracking-wider text-white/30">{op.serviceTitle}</div>
                      </div>
                      <span className="flex-shrink-0 font-mono text-xs font-semibold text-[#f97316]">{op.price}</span>
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

// ── Builder ──

function QuotationBuilder({ services, companyDefaultFee, onClose, onSaved }: {
  services: Service[];
  companyDefaultFee: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { customers } = useCustomers();
  const { addQuotation } = useQuotations();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [items, setItems] = useState<QuotationLineItem[]>([]);
  const [calloutEnabled, setCalloutEnabled] = useState(true);
  const [issuedBy, setIssuedBy] = useState("");
  const [remark, setRemark] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

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

  const handlePickOperation = (idx: number, op: FlatOperation) => {
    const price = parseFloat(op.price.replace(/[^0-9.]/g, "")) || 0;
    updateLineItem(idx, { description: op.name, unit_price: price });
  };

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

      <h2 className="mb-1 font-display text-xl font-bold text-white">New Quotation</h2>
      <p className="mb-6 text-sm text-white/50">This creates a formal, numbered quotation — separate from WhatsApp quote requests.</p>

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
              <div className="mb-2 flex items-center justify-between">
                <OperationPicker services={services} onPick={(op) => handlePickOperation(idx, op)} />
                <button
                  onClick={() => removeLineItem(idx)}
                  aria-label="Remove line item"
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid gap-2 md:grid-cols-[1fr_100px_70px_90px]">
                <input
                  value={item.description}
                  onChange={(e) => updateLineItem(idx, { description: e.target.value })}
                  placeholder="Description"
                  className={inputCls}
                />
                <input
                  type="number"
                  value={item.unit_price}
                  onChange={(e) => updateLineItem(idx, { unit_price: parseFloat(e.target.value) || 0 })}
                  placeholder="Price"
                  className={inputCls}
                />
                <input
                  type="number"
                  value={item.qty}
                  onChange={(e) => updateLineItem(idx, { qty: parseFloat(e.target.value) || 1 })}
                  placeholder="Qty"
                  className={inputCls}
                />
                <div className="flex items-center justify-end rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm font-semibold text-[#f97316]">
                  ${item.total.toFixed(2)}
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
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save Quotation
      </button>
    </div>
  );
}

// ── List view ──

function QuotationCard({ q }: { q: Quotation }) {
  const date = new Date(q.created_at);
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
        <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">{q.line_items.length} item{q.line_items.length === 1 ? "" : "s"}</span>
        <span className="font-display text-lg font-bold text-white">${q.total.toFixed(2)}</span>
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-white/30">Issued by {q.issued_by}</div>
    </div>
  );
}

export function QuotationsAdmin({ services, defaultCalloutFee }: { services: Service[]; defaultCalloutFee: number }) {
  const { quotations, ready } = useQuotations();
  const [view, setView] = useState<"list" | "builder">("list");

  if (view === "builder") {
    return (
      <QuotationBuilder
        services={services}
        companyDefaultFee={defaultCalloutFee}
        onClose={() => setView("list")}
        onSaved={() => setView("list")}
      />
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">Quotations</h1>
        <button
          onClick={() => setView("builder")}
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
          {quotations.map((q) => <QuotationCard key={q.id} q={q} />)}
        </div>
      )}
    </div>
  );
}