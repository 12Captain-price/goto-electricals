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
      .channel("quotes_changes")
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
      .channel("customers_changes")
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
      .channel("quotations_changes")
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

// ── Helper: compute totals for a quotation ──

export function computeQuotationTotals(
  lineItems: QuotationLineItem[],
  calloutFeeEnabled: boolean,
  calloutFeeAmount: number
) {
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + (calloutFeeEnabled ? calloutFeeAmount : 0);
  return { subtotal, total };
}