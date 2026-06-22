import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type ServiceOperation = {
  id: string;
  name: string;
  price: string;
};

export type Service = {
  id: string;
  icon: string;
  title: string;
  desc: string;
  operations: ServiceOperation[];
};

export type Project = {
  id: string;
  tag: string;
  title: string;
  description: string;
  chips: string[];
  image?: string;
};

export type Testimonial = {
  id: string;
  name: string;
  suburb: string;
  quote: string;
};

export type ContactInfo = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  vat: string;
  tin: string;
};

export type Stats = {
  years: string;
  projects: string;
  clients: string;
};

export type HeroSlide = {
  id: string;
  image: string;
};

export type Certificate = {
  id: string;
  title: string;
  url: string;
  fileType: "image" | "pdf";
  uploadedAt: string;
};

export type SiteData = {
  services: Service[];
  projects: Project[];
  testimonials: Testimonial[];
  contact: ContactInfo;
  stats: Stats;
  heroSlides: HeroSlide[];
  certificates: Certificate[];
  password: string;
};

export const DEFAULT_DATA: SiteData = {
  services: [
    { id: "s1", icon: "Zap", title: "House Wiring & Rewiring", desc: "Full rewires, new circuits, and safe upgrades for ageing installations.", operations: [] },
    { id: "s2", icon: "Building2", title: "Commercial & Industrial Installation", desc: "Three-phase wiring, fit-outs, and large-scale electrical projects.", operations: [] },
    { id: "s3", icon: "Home", title: "Residential Buildings", desc: "New builds and renovations wired to standard, start to finish.", operations: [] },
    { id: "s4", icon: "Battery", title: "Backup Systems & Generators", desc: "Automatic changeover, load management, and full generator installs.", operations: [] },
    { id: "s5", icon: "Sun", title: "Photovoltaic Solar Installations", desc: "Grid-tied and off-grid solar PV systems sized for your property.", operations: [] },
    { id: "s6", icon: "LayoutDashboard", title: "Distribution Board Upgrades", desc: "Old fusebox? We upgrade to modern compliant DB boards.", operations: [] },
    { id: "s7", icon: "Wrench", title: "Electrical Maintenance & Fault Finding", desc: "Tripping breakers, dead circuits, load issues — diagnosed fast.", operations: [] },
    { id: "s8", icon: "Droplet", title: "Borehole Installation & Pumps", desc: "Borehole pump installs, wiring, and electrical control setups.", operations: [] },
  ],
  projects: [
    { id: "p1", tag: "01 / residential", title: "DB Board Upgrade, Suburbs", description: "Modern compliant board replacing an old fusebox in a family home.", chips: ["DB Board", "Residential", "Bulawayo"] },
    { id: "p2", tag: "02 / commercial", title: "Full Office Rewire, CBD", description: "Complete commercial rewire with new circuits and lighting.", chips: ["Commercial", "Rewire", "Bulawayo"] },
    { id: "p3", tag: "03 / generator", title: "20kVA Backup System, Belmont Industrial", description: "Automatic changeover and load management for industrial backup.", chips: ["Generator", "Industrial", "20kVA"] },
    { id: "p4", tag: "04 / solar", title: "Solar PV Install, Residential", description: "Off-grid solar system sized for full household load.", chips: ["Solar", "Off-Grid", "Residential"] },
    { id: "p5", tag: "05 / compliance", title: "COC Certificate, New Build", description: "Certificate of Compliance issued for a new residential build.", chips: ["COC", "Compliance", "New Build"] },
    { id: "p6", tag: "06 / fault finding", title: "Emergency Fault Repair, 7pm Callout", description: "Same-day diagnosis and repair of a tripping main breaker.", chips: ["Fault Finding", "Emergency", "Same-Day"] },
  ],
  testimonials: [
    { id: "t1", name: "[Client Name]", suburb: "Suburb, Bulawayo", quote: "Add your testimonial here." },
    { id: "t2", name: "[Client Name]", suburb: "Suburb, Bulawayo", quote: "Add your testimonial here." },
    { id: "t3", name: "[Client Name]", suburb: "Suburb, Bulawayo", quote: "Add your testimonial here." },
  ],
  contact: {
    phone: "+263 778 687 510",
    whatsapp: "263778687510",
    email: "info@gotoelectricals.co.zw",
    address: "Bulawayo, Zimbabwe",
    hours: "Mon–Fri 7am–6pm · 24/7 Emergency Callouts",
    vat: "",
    tin: "",
  },
  stats: { years: "6", projects: "150", clients: "120" },
  heroSlides: [],
  certificates: [],
  password: "2005",
};

const DB_KEY = "main";

export function useSiteData() {
  const [data, setData] = useState<SiteData>(DEFAULT_DATA);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: row, error } = await supabase
        .from("site_data")
        .select("value")
        .eq("key", DB_KEY)
        .single();

      if (error || !row) {
        setData(DEFAULT_DATA);
      } else {
        setData({ ...DEFAULT_DATA, ...row.value, contact: { ...DEFAULT_DATA.contact, ...(row.value as any).contact } });
      }
      setReady(true);
    };

    fetchData();

    const channel = supabase
      .channel(`site_data_changes_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_data" },
        (payload) => {
          if (payload.new && "value" in payload.new) {
            const v = (payload.new as any).value;
            setData({ ...DEFAULT_DATA, ...v, contact: { ...DEFAULT_DATA.contact, ...v.contact } });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const update = async (next: SiteData | ((prev: SiteData) => SiteData)) => {
    const value = typeof next === "function" ? (next as (p: SiteData) => SiteData)(data) : next;
    setData(value);
    await supabase
      .from("site_data")
      .upsert({ key: DB_KEY, value });
  };

  return { data, update, ready };
}

export const AUTH_KEY = "goto-admin-auth";