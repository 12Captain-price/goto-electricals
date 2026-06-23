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
  created_at: string;
};

export type InvoicePayment = {
  id: string;
  invoice_id: string;
  amount: number;
  method: PaymentMethod;
  note: string | null;
  paid_at: string;
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

  // Generates the next quote number, e.g. GTE-001, GTE-002...
  const getNextQuoteNumber = async () => {
    const { data, error } = await supabase
      .from("quotations")
      .select("quote_number")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return "GTE-001";
    const last = data[0].quote_number; // "GTE-007"
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

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setInvoices(data as Invoice[]);
      setReady(true);
    };
    fetchInvoices();

    const channel = supabase
      .channel(`invoices_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoices" }, fetchInvoices)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  // Generates the next invoice number, e.g. INV-001, INV-002...
  const getNextInvoiceNumber = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .order("created_at", { ascending: false })
      .limit(1);
    if (error || !data || data.length === 0) return "INV-001";
    const last = data[0].invoice_number; // "INV-007"
    const num = parseInt(last.split("-")[1] || "0", 10);
    return `INV-${String(num + 1).padStart(3, "0")}`;
  };

  const addInvoice = async (invoice: Omit<Invoice, "id" | "created_at" | "invoice_number" | "payment_status">) => {
    const invoice_number = await getNextInvoiceNumber();
    const { data, error } = await supabase
      .from("invoices")
      .insert({ ...invoice, invoice_number, payment_status: "unpaid" })
      .select()
      .single();
    if (error) throw error;
    return data as Invoice;
  };

  const updateInvoice = async (id: string, patch: Partial<Invoice>) => {
    await supabase.from("invoices").update(patch).eq("id", id);
  };

  const removeInvoice = async (id: string) => {
    await supabase.from("invoices").delete().eq("id", id);
  };

  return { invoices, ready, addInvoice, updateInvoice, removeInvoice, getNextInvoiceNumber };
}

// ── Invoice Payments ──
// Each payment is a separate row so multiple installments can be tracked
// with a full history trail per invoice.

export function useInvoicePayments(invoiceId: string | null) {
  const [payments, setPayments] = useState<InvoicePayment[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!invoiceId) { setPayments([]); setReady(true); return; }

    const fetchPayments = async () => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .eq("invoice_id", invoiceId)
        .order("paid_at", { ascending: true });
      if (!error && data) setPayments(data as InvoicePayment[]);
      setReady(true);
    };
    fetchPayments();

    const channel = supabase
      .channel(`invoice_payments_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoice_payments", filter: `invoice_id=eq.${invoiceId}` }, fetchPayments)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [invoiceId]);

  const addPayment = async (payment: Omit<InvoicePayment, "id" | "created_at">) => {
    const { data, error } = await supabase
      .from("invoice_payments")
      .insert(payment)
      .select()
      .single();
    if (error) throw error;
    return data as InvoicePayment;
  };

  const removePayment = async (id: string) => {
    await supabase.from("invoice_payments").delete().eq("id", id);
  };

  return { payments, ready, addPayment, removePayment };
}

// Fetches ALL payments across ALL invoices in one go — useful for computing
// payment status / balance for every invoice card in a list view without
// firing a separate query per card.
export function useAllInvoicePayments() {
  const [paymentsByInvoice, setPaymentsByInvoice] = useState<Record<string, InvoicePayment[]>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const { data, error } = await supabase
        .from("invoice_payments")
        .select("*")
        .order("paid_at", { ascending: true });
      if (!error && data) {
        const grouped: Record<string, InvoicePayment[]> = {};
        (data as InvoicePayment[]).forEach((p) => {
          if (!grouped[p.invoice_id]) grouped[p.invoice_id] = [];
          grouped[p.invoice_id].push(p);
        });
        setPaymentsByInvoice(grouped);
      }
      setReady(true);
    };
    fetchAll();

    const channel = supabase
      .channel(`all_invoice_payments_changes_${nextChannelId()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "invoice_payments" }, fetchAll)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return { paymentsByInvoice, ready };
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

// Given an invoice total and its recorded payments, work out how much has
// been paid, what's left, and what the resulting payment_status should be.
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