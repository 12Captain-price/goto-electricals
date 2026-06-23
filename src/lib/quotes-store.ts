import { useEffect, useState } from "react";
import { supabase } from "./supabase";

// ── Types ──

export type QuoteStatus = "new" | "contacted" | "quoted" | "closed";
export type QuoteChannel = "whatsapp" | "email";

export type Quote = {
  id: string;
  service: string;
  name: string;
  phone: string;
  location: string | null;
  message: string | null;
  channel: QuoteChannel;
  status: QuoteStatus;
  created_at: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  vat: string | null;
  tin: string | null;
  created_at: string;
};

export type QuotationLineItem = {
  description: string;
  unit_price: number;
  qty: number;
  total: number;
};

export type CustomerSnapshot = {
  name: string;
  phone: string;
  address: string;
  vat?: string;
  tin?: string;
};

export type Quotation = {
  id: string;
  quote_number: string;
  customer_id: string | null;
  customer_snapshot: CustomerSnapshot;
  source_quote_id: string | null;
  line_items: QuotationLineItem[];
  callout_fee_enabled: boolean;
  callout_fee_amount: number;
  subtotal: number;
  total: number;
  issued_by: string;
  remark: string | null;
  created_at: string;
};

// ── Invoices ──

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";
export type PaymentMethod = "cash" | "ecocash" | "zig" | "bank_transfer" | "other";

// Payments are stored as a JSONB array inside the invoice row — no separate table needed.
export type InvoicePayment = {
  id: string;         // generated client-side with crypto.randomUUID()
  amount: number;
  method: PaymentMethod;
  note: string | null;
  paid_at: string;    // ISO date string YYYY-MM-DD
  created_at: string; // ISO timestamp
  // note: no invoice_id — payments live inside invoices.payments JSONB array
};

export type Invoice = {
  id: string;
  invoice_number: string;
  quotation_id: string | null;
  customer_id: string | null;
  customer_snapshot: CustomerSnapshot;
  source_quote_id: string | null;
  line_items: QuotationLineItem[];
  callout_fee_enabled: boolean;
  callout_fee_amount: number;
  subtotal: number;
  total: number;
  issued_by: string;
  remark: string | null;
  due_date: string | null;
  payment_status: PaymentStatus;
  payments: InvoicePayment[];  // ← stored directly in invoices.payments JSONB column
  created_at: string;
};

// Unique id generator so multiple hook instances don't collide on channel names
let channelCounter = 0;
const nextChannelId = () => `${Date.now()}-${channelCounter++}-${Math.random().toString(36).slice(2, 7)}`;

// ── Quotes (WhatsApp/Email quote requests) ──

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchQuotes = async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setQuotes(data as Quote[]);
      setReady(true);
    };
    fetchQuotes();

    const channel = supabase
      .channel(`quotes_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotes" }, fetchQuotes)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addQuote = async (quote: Omit<Quote, "id" | "created_at" | "status">) => {
    const { data, error } = await supabase
      .from("quotes")
      .insert({ ...quote, status: "new" })
      .select()
      .single();
    if (error) throw error;
    return data as Quote;
  };

  const updateStatus = async (id: string, status: QuoteStatus) => {
    await supabase.from("quotes").update({ status }).eq("id", id);
  };

  const removeQuote = async (id: string) => {
    await supabase.from("quotes").delete().eq("id", id);
  };

  return { quotes, ready, addQuote, updateStatus, removeQuote };
}

// ── Customers ──

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("name", { ascending: true });
      if (!error && data) setCustomers(data as Customer[]);
      setReady(true);
    };
    fetchCustomers();

    const channel = supabase
      .channel(`customers_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "customers" }, fetchCustomers)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const addCustomer = async (customer: Omit<Customer, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("customers")
      .insert(customer)
      .select()
      .single();
    if (error) throw error;
    return data as Customer;
  };

  const updateCustomer = async (id: string, patch: Partial<Customer>) => {
    await supabase.from("customers").update(patch).eq("id", id);
  };

  const removeCustomer = async (id: string) => {
    await supabase.from("customers").delete().eq("id", id);
  };

  return { customers, ready, addCustomer, updateCustomer, removeCustomer };
}

// ── Quotations (formal numbered PDFs) ──

export function useQuotations() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchQuotations = async () => {
      const { data, error } = await supabase
        .from("quotations")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setQuotations(data as Quotation[]);
      setReady(true);
    };
    fetchQuotations();

    const channel = supabase
      .channel(`quotations_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "quotations" }, fetchQuotations)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getNextQuoteNumber = async () => {
    const { data, error } = await supabase
      .from("quotations")
      .select("quote_number")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return "GTE-001";
    const last = data[0].quote_number;
    const num = parseInt(last.split("-")[1] || "0", 10);
    return `GTE-${String(num + 1).padStart(3, "0")}`;
  };

  const addQuotation = async (quotation: Omit<Quotation, "id" | "created_at" | "quote_number">) => {
    const quote_number = await getNextQuoteNumber();
    const { data, error } = await supabase
      .from("quotations")
      .insert({ ...quotation, quote_number })
      .select()
      .single();
    if (error) throw error;
    return data as Quotation;
  };

  const updateQuotation = async (id: string, patch: Partial<Quotation>) => {
    await supabase.from("quotations").update(patch).eq("id", id);
  };

  const removeQuotation = async (id: string) => {
    await supabase.from("quotations").delete().eq("id", id);
  };

  return { quotations, ready, addQuotation, updateQuotation, removeQuotation, getNextQuoteNumber };
}

// ── Invoices ──
// Payments are stored as a JSONB array on each invoice row.
// No separate invoice_payments table — avoids all RLS/realtime issues.

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        const normalised = (data as any[]).map((inv) => ({
          ...inv,
          payments: Array.isArray(inv.payments) ? inv.payments : [],
        }));
        setInvoices(normalised as Invoice[]);
      }
      setReady(true);
    };
    fetchInvoices();

    const channel = supabase
      .channel(`invoices_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, fetchInvoices)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const getNextInvoiceNumber = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return "INV-001";
    const last = data[0].invoice_number;
    const num = parseInt(last.split("-")[1] || "0", 10);
    return `INV-${String(num + 1).padStart(3, "0")}`;
  };

  const addInvoice = async (invoice: Omit<Invoice, "id" | "created_at" | "invoice_number" | "payment_status" | "payments">) => {
    const invoice_number = await getNextInvoiceNumber();
    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...invoice, invoice_number, payment_status: "unpaid", payments: [] })
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  };

  const addPayment = async (
    invoiceId: string,
    payment: Omit<InvoicePayment, "id" | "created_at">
  ) => {
    const { data: current, error: fetchErr } = await supabase
      .from("invoices")
      .select("payments, total")
      .eq("id", invoiceId)
      .single();
    if (fetchErr) throw fetchErr;

    const existingPayments: InvoicePayment[] = Array.isArray(current.payments) ? current.payments : [];
    const newPayment: InvoicePayment = {
      ...payment,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    const updatedPayments = [...existingPayments, newPayment];

    const amountPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
    const total: number = current.total;
    let payment_status: PaymentStatus = "unpaid";
    if (amountPaid >= total && total > 0) payment_status = "paid";
    else if (amountPaid > 0) payment_status = "partially_paid";

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({ payments: updatedPayments, payment_status })
      .eq("id", invoiceId);
    if (updateErr) throw updateErr;

    return newPayment;
  };

  const removePayment = async (invoiceId: string, paymentId: string) => {
    const { data: current, error: fetchErr } = await supabase
      .from("invoices")
      .select("payments, total")
      .eq("id", invoiceId)
      .single();
    if (fetchErr) throw fetchErr;

    const existingPayments: InvoicePayment[] = Array.isArray(current.payments) ? current.payments : [];
    const updatedPayments = existingPayments.filter((p) => p.id !== paymentId);

    const amountPaid = updatedPayments.reduce((s, p) => s + p.amount, 0);
    const total: number = current.total;
    let payment_status: PaymentStatus = "unpaid";
    if (amountPaid >= total && total > 0) payment_status = "paid";
    else if (amountPaid > 0) payment_status = "partially_paid";

    const { error: updateErr } = await supabase
      .from("invoices")
      .update({ payments: updatedPayments, payment_status })
      .eq("id", invoiceId);
    if (updateErr) throw updateErr;
  };

  const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
    await supabase.from("invoices").update(patch).eq("id", id);
  };

  const removeInvoice = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
  };

  return { invoices, ready, addInvoice, addPayment, removePayment, updateInvoice, removeInvoice, getNextInvoiceNumber };
}

// ── Helpers ──

export function computeQuotationTotals(
  lineItems: QuotationLineItem[],
  calloutFeeEnabled: boolean,
  calloutFeeAmount: number
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + (calloutFeeEnabled ? calloutFeeAmount : 0);
  return { subtotal, total };
}

export function computeInvoicePaymentSummary(total: number, payments: InvoicePayment[]) {
  const amountPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const balance = Math.max(0, total - amountPaid);
  let status: PaymentStatus = "unpaid";
  if (amountPaid >= total && total > 0) status = "paid";
  else if (amountPaid > 0) status = "partially_paid";
  return { amountPaid, balance, status };
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  ecocash: "EcoCash",
  zig: "ZiG",
  bank_transfer: "Bank Transfer",
  other: "Other",
};