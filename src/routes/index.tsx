import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import {
  Zap, LayoutDashboard, Sun, Battery, Building2, Home, Droplet,
  ShieldCheck, BadgeCheck, FileCheck, Clock, Phone, MessageCircle,
  Menu, X, Wrench, CheckCircle, Shield, Star, ImagePlus, Mail,
  MapPin, Send, Share2, ImageDown, FileDown, Crosshair, Loader2,
  AlertCircle, ChevronRight, Award, FileText, Download,
} from "lucide-react";
import { useSiteData, type Project, type HeroSlide, type Service, type Certificate } from "@/lib/site-store";
import { useQuotes } from "@/lib/quotes-store";
import { downloadProjectPng, downloadProjectPdf, shareProject } from "@/lib/project-export";
import logoUrl from "@/assets/goto-logo.jpeg";

export const Route = createFileRoute("/")(({
  component: Index,
}));

const ICON_MAP: Record<string, React.ElementType> = {
  Zap, Building2, Home, Battery, Sun, LayoutDashboard, Wrench, Droplet,
};

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "About", href: "#about" },
  { label: "Projects", href: "#projects" },
  { label: "Certificates", href: "#certificates" },
  { label: "Contact", href: "#contact" },
];

function SectionLabel({ number, label }: { number: string; label: string }) {
  return (
    <div className="mb-10 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">
      <span>§ {number} — {label}</span>
      <span className="h-px flex-1 bg-white/15" />
    </div>
  );
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0d1117]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="#home" className="group flex items-center gap-3">
          <img
            src={logoUrl}
            alt="Gow To Electricals"
            className="h-14 w-14 rounded-lg object-contain shadow-[0_0_14px_rgba(249,115,22,0.35)] transition-shadow duration-300 group-hover:shadow-[0_0_28px_rgba(249,115,22,0.7)]"
          />
          <span className="font-display text-lg font-bold tracking-tight">
            <span className="text-[#f97316]">GOW TO</span>
            <span className="text-[#f0f6fc]"> ELECTRICALS</span>
          </span>
        </a>
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n) => (
            <a key={n.href} href={n.href} className="text-sm text-white/60 transition hover:text-white">{n.label}</a>
          ))}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          <a href="#contact" className="rounded-full bg-[#f97316] px-4 py-2 text-sm font-semibold text-black transition hover:bg-orange-400">Get a Quote</a>
        </div>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="border-b border-white/10 bg-[#0d1117] md:hidden">
          <div className="flex flex-col gap-1 px-6 py-4">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded px-2 py-2 text-sm text-white/70 hover:text-white">{n.label}</a>
            ))}
            <a href="#contact" onClick={() => setOpen(false)} className="mt-3 rounded-full bg-[#f97316] px-4 py-2 text-center text-sm font-semibold text-black">Get a Quote</a>
          </div>
        </div>
      )}
    </header>
  );
}

function HeroSlideshow({ slides }: { slides: HeroSlide[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
      {slides.map((s, i) => (
        <img
          key={s.id}
          src={s.image}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-[1800ms] ease-in-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-[#0d1117]/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0d1117]/40 via-[#0d1117]/70 to-[#0d1117]" />
    </div>
  );
}

function Hero({ slides }: { slides: HeroSlide[] }) {
  return (
    <section id="home" className="relative flex min-h-screen items-center overflow-hidden bg-[#0d1117]">
      <HeroSlideshow slides={slides} />
      <div
        className="pointer-events-none absolute inset-0 z-[1] opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
          maskImage: "radial-gradient(ellipse at center, black 40%, transparent 80%)",
        }}
      />
      <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-6 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">§ BULAWAYO · ZIMBABWE</div>
        <h1 className="font-display font-bold leading-[0.95] tracking-tight" style={{ fontSize: "clamp(2.8rem, 8vw, 5.5rem)" }}>
          Bulawayo's Trusted<br />Electrical <span className="text-[#f97316]">Contractors.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-lg text-white/60">Residential · Commercial · Industrial — Licensed, Insured & ECB Registered.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href="#contact" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-6 py-3 font-semibold text-white transition hover:border-[#f97316]/60 hover:text-[#f97316]">
            Get In Touch ↓
          </a>
        </div>
        <div className="mt-16 flex flex-wrap justify-center gap-3">
          {[
            { icon: ShieldCheck, label: "ECB Registered" },
            { icon: BadgeCheck, label: "Fully Insured" },
            { icon: FileCheck, label: "COC Certified" },
            { icon: Clock, label: "24/7 Emergency" },
          ].map((b) => (
            <span key={b.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-sm text-white/60">
              <b.icon className="h-4 w-4 text-[#f97316]" /> {b.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function ServiceModal({ service, onClose }: { service: Service; onClose: () => void }) {
  const Icon = ICON_MAP[service.icon] ?? Zap;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#161b22] p-7 shadow-2xl"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#f97316]/50 hover:text-[#f97316]"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="mb-4 flex items-center gap-3">
          <Icon className="h-6 w-6 text-[#f97316]" />
          <h3 className="font-display text-xl font-semibold text-white">{service.title}</h3>
        </div>
        <p className="mb-4 text-sm text-white/60">{service.desc}</p>

        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[#f97316]/40 bg-[#f97316]/[0.06] p-3">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#f97316]" />
          <p className="text-xs text-white/70">
            <span className="font-semibold text-white">$15 fixed call-out fee</span> applies before any work begins. Covers site assessment and fault diagnosis.
          </p>
        </div>

        {service.operations && service.operations.length > 0 ? (
          <div>
            <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Operations & Pricing</div>
            <div className="overflow-hidden rounded-xl border border-white/10">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.02]">
                    <th className="px-4 py-3 text-left font-mono text-[10px] uppercase tracking-wider text-white/40">Operation</th>
                    <th className="px-4 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-white/40">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {service.operations.map((op, i) => (
                    <tr key={op.id} className={i !== service.operations.length - 1 ? "border-b border-white/10" : ""}>
                      <td className="px-4 py-3 text-white/80">{op.name}</td>
                      <td className="px-4 py-3 text-right font-semibold text-[#f97316]">{op.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/40">
            Pricing available on request — contact us for a quote.
          </div>
        )}
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-black transition hover:bg-orange-400"
        >
          Close
        </button>
      </motion.div>
    </div>
  );
}

const cardAnim = (i: number) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.5, delay: i * 0.06 },
});

function Services({ services }: { services: Service[] }) {
  const [selected, setSelected] = useState<Service | null>(null);
  return (
    <section id="services" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel number="02" label="what we do" />
      <p className="mb-10 text-sm text-white/60">We handle the full scope — from a tripping breaker to a full industrial fit-out.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {services.map((s, i) => {
          const Icon = ICON_MAP[s.icon] ?? Zap;
          return (
            <motion.div
              key={s.id}
              {...cardAnim(i)}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-7 transition-all duration-300 before:absolute before:top-0 before:right-0 before:left-0 before:h-[2px] before:bg-gradient-to-r before:from-[#f97316] before:to-transparent hover:border-white/30 hover:bg-[#1c2128]"
            >
              <Icon className="mb-4 h-6 w-6 text-[#f97316]" />
              <h3 className="mb-2 font-display text-lg font-semibold text-white">{s.title}</h3>
              <p className="text-sm text-white/60">{s.desc}</p>
              <button
                onClick={() => setSelected(s)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/60 transition hover:border-[#f97316]/50 hover:text-[#f97316]"
              >
                View Details <ChevronRight className="h-3 w-3" />
              </button>
            </motion.div>
          );
        })}
      </div>
      {selected && <ServiceModal service={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

function About({ stats }: { stats: { years: string; projects: string; clients: string } }) {
  const items = [
    { value: `${stats.years}+`, label: "Years Experience" },
    { value: `${stats.projects}+`, label: "Projects Completed" },
    { value: `${stats.clients}+`, label: "Happy Clients" },
    { value: "ECB", label: "Registered" },
  ];
  const badges = [
    { icon: Wrench, label: "Schneider Electric" },
    { icon: Wrench, label: "ABB" },
    { icon: CheckCircle, label: "ZESA Approved Materials" },
    { icon: Shield, label: "12-Month Workmanship Warranty" },
  ];
  return (
    <section id="about" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel number="03" label="about us" />
      <div className="grid gap-12 md:grid-cols-5">
        <div className="md:col-span-2">
          <h2 className="font-display text-3xl font-bold leading-tight text-white">
            Built on experience.<br />Wired for safety.
          </h2>
        </div>
        <div className="space-y-5 text-base text-white/65 md:col-span-3">
          <p>Gow To Electricals is a Bulawayo-based electrical contracting company founded and led by <span className="text-white">Collen N Goto</span>. With 6 years of hands-on trade experience across residential, commercial and industrial projects, every job is backed by proper licensing and a commitment to safety.</p>
          <p>We are ECB registered and actively building our compliance portfolio. Whether it's a fault at 7pm or a full commercial fit-out, we show up, do it right, and stand behind our work.</p>
        </div>
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {items.map((s, i) => (
          <motion.div key={s.label} {...cardAnim(i)} className="rounded-xl border border-white/10 bg-[#161b22] p-5 text-center">
            <div className="font-display text-2xl font-bold text-[#f97316]">{s.value}</div>
            <span className="mt-1 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{s.label}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        {badges.map((b) => (
          <span key={b.label} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 font-mono text-xs uppercase tracking-wider text-white/50">
            <b.icon className="h-4 w-4 text-[#f97316]" /> {b.label}
          </span>
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"share" | "png" | "pdf" | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  const flashStatus = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 4000);
  };

  const withBusy = (key: "share" | "png" | "pdf", fn: () => Promise<void>) => async () => {
    console.log(`[ProjectCard] ${key} button clicked`);
    if (busy) return;
    setBusy(key);
    setCapturing(true);
    await new Promise((r) => setTimeout(r, 30));
    try {
      await fn();
      console.log(`[ProjectCard] ${key} finished successfully`);
    } catch (err) {
      console.error(`[ProjectCard] ${key} FAILED:`, err);
      const msg = err instanceof Error ? err.message : String(err);
      flashStatus(`Error: ${msg}`);
    } finally {
      setCapturing(false);
      setBusy(null);
    }
  };

  const handleShare = withBusy("share", async () => {
    if (!cardRef.current) throw new Error("Card ref not found");
    const siteUrl = window.location.origin + window.location.pathname;
    const result = await shareProject(cardRef.current, project, siteUrl);
    if (result === "shared") flashStatus("Shared");
    else if (result === "copied") flashStatus("Link copied!");
    else flashStatus("Sharing not supported on this browser");
  });

  const handlePng = withBusy("png", async () => {
    if (!cardRef.current) throw new Error("Card ref not found");
    await downloadProjectPng(cardRef.current, project);
    flashStatus("Image saved");
  });

  const handlePdf = withBusy("pdf", async () => {
    if (!cardRef.current) throw new Error("Card ref not found");
    await downloadProjectPdf(cardRef.current, project);
    flashStatus("PDF downloaded");
  });

  return (
    <motion.article
      {...cardAnim(index)}
      ref={cardRef}
      className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] p-7 transition-all duration-300 before:absolute before:top-0 before:right-0 before:left-0 before:h-[2px] before:bg-gradient-to-r before:from-[#f97316] before:to-transparent hover:border-white/30 hover:bg-white/[0.04]"
    >
      <div className="flex min-h-7 items-start justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">{project.tag}</div>
        <div className="flex shrink-0 gap-1.5" style={{ visibility: capturing ? "hidden" : "visible" }}>
          <button type="button" onClick={handleShare} disabled={busy !== null} title="Share project link" aria-label="Share project link"
            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#f97316]/50 hover:text-[#f97316] disabled:opacity-40">
            {busy === "share" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={handlePng} disabled={busy !== null} title="Save as image" aria-label="Save as image"
            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#f97316]/50 hover:text-[#f97316] disabled:opacity-40">
            {busy === "png" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageDown className="h-3.5 w-3.5" />}
          </button>
          <button type="button" onClick={handlePdf} disabled={busy !== null} title="Download PDF" aria-label="Download PDF"
            className="relative z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/50 transition hover:border-[#f97316]/50 hover:text-[#f97316] disabled:opacity-40">
            {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
      <div className="mt-3 flex h-48 w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        {project.image ? (
          <img src={project.image} alt={project.title} className="h-full w-full object-cover" />
        ) : (
          <>
            <ImagePlus className="h-8 w-8 text-white/20" />
            <span className="text-xs text-white/20">Add project photo</span>
          </>
        )}
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-white">{project.title}</h3>
      <p className="mt-2 text-sm text-white/65">{project.description}</p>
      <div className="mt-5 flex flex-wrap gap-2">
        {project.chips.map((c) => (
          <span key={c} className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-white/60">{c}</span>
        ))}
      </div>
      {status && (
        <div className="mt-4 font-mono text-[10px] uppercase tracking-wider text-[#f97316]">{status}</div>
      )}
    </motion.article>
  );
}

function Portfolio({ projects }: { projects: Project[] }) {
  return (
    <section id="projects" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel number="04" label="our work" />
      <p className="mb-10 text-sm text-white/60">Every job is a reference. Here's a sample of what we've done.</p>
      <div className="grid gap-6 md:grid-cols-2">
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  );
}

function CertificateCard({ cert, index }: { cert: Certificate; index: number }) {
  return (
    <motion.a
      {...cardAnim(index)}
      href={cert.url}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-5 transition-all duration-300 before:absolute before:top-0 before:right-0 before:left-0 before:h-[2px] before:bg-gradient-to-r before:from-[#f97316] before:to-transparent hover:border-white/30 hover:bg-[#1c2128]"
    >
      <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
        {cert.fileType === "image" ? (
          <img src={cert.url} alt={cert.title} className="h-full w-full object-cover" />
        ) : (
          <FileText className="h-10 w-10 text-white/30" />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <h3 className="truncate font-display text-sm font-semibold text-white">{cert.title}</h3>
        <Download className="h-4 w-4 flex-shrink-0 text-white/40 transition group-hover:text-[#f97316]" />
      </div>
    </motion.a>
  );
}

function Certificates({ certificates }: { certificates: Certificate[] }) {
  if (certificates.length === 0) return null;
  return (
    <section id="certificates" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel number="05" label="certificates & compliance" />
      <p className="mb-10 text-sm text-white/60">Licenses, certifications, and compliance documents — view or download any of them below.</p>
      <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
        {certificates.map((c, i) => (
          <CertificateCard key={c.id} cert={c} index={i} />
        ))}
      </div>
    </section>
  );
}

function Testimonials({ items }: { items: ReturnType<typeof useSiteData>["data"]["testimonials"] }) {
  return (
    <section className="mx-auto max-w-6xl bg-[#0d1117] px-6 py-24">
      <SectionLabel number="06" label="what clients say" />
      <div className="grid gap-6 md:grid-cols-3">
        {items.map((t, i) => (
          <motion.div key={t.id} {...cardAnim(i)} className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#161b22] p-7">
            <div className="pointer-events-none absolute top-4 right-6 font-mono text-6xl leading-none text-white/[0.06] select-none">"</div>
            <div className="mb-4 flex gap-1">
              {[0, 1, 2, 3, 4].map((s) => (
                <Star key={s} className="h-4 w-4 fill-[#f97316] text-[#f97316]" />
              ))}
            </div>
            <p className="mb-6 text-sm leading-relaxed text-white/70 italic">"{t.quote}"</p>
            <div className="border-t border-white/10 pt-4">
              <div className="text-sm font-semibold text-white">{t.name}</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/40">{t.suburb}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ── Quote wizard service tiles ──
const QUOTE_SERVICES = [
  { icon: Zap,             label: "Fault Finding" },
  { icon: LayoutDashboard, label: "DB Board Upgrade" },
  { icon: Sun,             label: "Solar Installation" },
  { icon: Battery,         label: "Generator Backup" },
  { icon: FileCheck,       label: "COC Certificate" },
  { icon: Building2,       label: "Commercial / Industrial" },
  { icon: Wrench,          label: "House Wiring" },
  { icon: Droplet,         label: "Borehole & Pumps" },
  { icon: ShieldCheck,     label: "Other / Not Sure" },
];

function Contact({ contact }: { contact: ReturnType<typeof useSiteData>["data"]["contact"] }) {
  const [step, setStep]         = useState<1 | 2 | 3>(1);
  const [service, setService]   = useState("");
  const [name, setName]         = useState("");
  const [phone, setPhone]       = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState<string | null>(null);
  const [message, setMessage]   = useState("");
  const [sent, setSent]         = useState(false);
  const [saving, setSaving]     = useState(false);

  const { addQuote } = useQuotes();

  const useMyLocation = () => {
    if (!navigator.geolocation) { setLocError("Not supported on this browser."); return; }
    setLocating(true); setLocError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation(`${pos.coords.latitude.toFixed(5)}, ${pos.coords.longitude.toFixed(5)}`);
        setLocating(false);
      },
      () => { setLocError("Couldn't get location — enter manually."); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const openMaps = () => {
    if (!location.trim()) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`, "_blank");
  };

  const saveQuote = async (channel: "whatsapp" | "email") => {
    setSaving(true);
    try {
      await addQuote({
        service,
        name,
        phone,
        location: location || null,
        message: message || null,
        channel,
      });
    } catch (err) {
      console.error("[Contact] Failed to save quote:", err);
      // Don't block the client from sending even if saving fails
    }
    setSaving(false);
  };

  const handleSend = async () => {
    await saveQuote("whatsapp");

    const body = `*New Quote Request — Gow To Electricals*\n\n*Service:* ${service}\n*Name:* ${name}\n*Phone:* ${phone}\n*Location:* ${location || "Not provided"}\n*Message:* ${message || "—"}\n\nNote: A $15 fixed call-out fee applies before work begins — covers site visit, assessment & fault diagnosis.`;
    window.open(`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(body)}`, "_blank");
    setSent(true);
    setTimeout(() => {
      setSent(false); setStep(1);
      setService(""); setName(""); setPhone(""); setLocation(""); setMessage("");
    }, 5000);
  };

  const handleSendEmail = async () => {
    await saveQuote("email");

    const subject = encodeURIComponent(`Quote Request — ${name} — ${service}`);
    const body = encodeURIComponent(`Hi,\n\nService: ${service}\nName: ${name}\nPhone: ${phone}\nLocation: ${location || "Not provided"}\n\n${message}\n\nNote: A $15 fixed call-out fee applies before work begins — covers site visit, assessment & fault diagnosis.`);
    window.open(`mailto:${contact.email}?subject=${subject}&body=${body}`, "_blank");
  };

  const stepLabels = ["Choose Service", "Your Details", "Review & Send"];

  return (
    <section id="contact" className="mx-auto max-w-6xl px-6 py-24">
      <SectionLabel number="07" label="get a quote" />

      {/* $15 Call-out fee — bold banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-[#f97316]/40 bg-gradient-to-r from-[#f97316]/10 via-[#f97316]/5 to-transparent">
        <div className="flex items-center gap-3 border-b border-[#f97316]/20 bg-[#f97316]/10 px-5 py-3">
          <AlertCircle className="h-4 w-4 text-[#f97316]" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#f97316]">Please Read Before Requesting a Quote</span>
        </div>
        <div className="flex flex-col gap-1 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-2xl font-bold text-white">
              $15 Fixed Call-Out Fee
            </p>
            <p className="mt-1 text-sm text-white/60">
              Applies before any work begins — covers site visit, assessment &amp; fault diagnosis.
            </p>
          </div>
          <div className="mt-3 shrink-0 rounded-xl border border-[#f97316]/30 bg-[#f97316]/10 px-5 py-3 text-center sm:mt-0">
            <div className="font-mono text-[10px] uppercase tracking-wider text-[#f97316]/70">All jobs</div>
            <div className="font-display text-3xl font-bold text-[#f97316]">$15</div>
            <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">call-out</div>
          </div>
        </div>
      </div>

      {/* Emergency banner */}
      <div className="mb-10 flex items-start gap-3 rounded-xl border border-[#ef4444]/30 bg-[#ef4444]/[0.06] p-4">
        <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#ef4444]" />
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ef4444]/80">24/7 Emergency Callout</div>
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="mt-1 block text-sm font-semibold text-white transition hover:text-[#ef4444]"
          >
            Tripping breaker or live fault? Call {contact.phone} now →
          </a>
        </div>
      </div>

      <div className="grid gap-12 md:grid-cols-5">

        {/* ── Left: contact info ── */}
        <div className="md:col-span-2 flex flex-col gap-5">
          <div>
            <h2 className="font-display text-3xl font-bold text-white leading-tight">
              Let's get the<br />job done.
            </h2>
            <p className="mt-3 text-sm text-white/55">
              Fill in the quick form and we'll follow up by WhatsApp. Or reach us directly:
            </p>
          </div>

          {/* Phone */}
          <a
            href={`tel:${contact.phone.replace(/\s/g, "")}`}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#f97316]/40 hover:bg-[#f97316]/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f97316]/10 text-[#f97316]">
              <Phone className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Call Us</div>
              <div className="mt-0.5 text-sm font-semibold text-white transition group-hover:text-[#f97316]">{contact.phone}</div>
            </div>
          </a>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/${contact.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#25d366]/40 hover:bg-[#25d366]/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25d366]/10 text-[#25d366]">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">WhatsApp</div>
              <div className="mt-0.5 text-sm font-semibold text-white transition group-hover:text-[#25d366]">Chat with us</div>
            </div>
          </a>

          {/* Email */}
          <a
            href={`mailto:${contact.email}`}
            className="group flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-[#f97316]/40 hover:bg-[#f97316]/[0.04]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f97316]/10 text-[#f97316]">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Email</div>
              <div className="mt-0.5 text-sm font-semibold text-white transition group-hover:text-[#f97316]">{contact.email}</div>
            </div>
          </a>

          {/* Address */}
          <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f97316]/10 text-[#f97316]">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Address</div>
              <div className="mt-0.5 text-sm text-white/70">{contact.address}</div>
              <div className="mt-0.5 text-xs text-white/40">{contact.hours}</div>
            </div>
          </div>


        </div>

        {/* ── Right: wizard ── */}
        <div className="md:col-span-3">
          <div className="rounded-2xl border border-white/10 bg-[#161b22] p-7">

            {/* Progress */}
            <div className="mb-8">
              <div className="mb-3 flex items-center">
                {stepLabels.map((label, i) => {
                  const n = (i + 1) as 1 | 2 | 3;
                  const active = step === n;
                  const done   = step > n;
                  return (
                    <div key={label} className="flex items-center">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all duration-300 ${
                          done   ? "bg-[#f97316] text-black" :
                          active ? "border-2 border-[#f97316] text-[#f97316]" :
                                   "border border-white/20 text-white/30"
                        }`}>
                          {done ? "✓" : n}
                        </div>
                        <span className={`hidden sm:block font-mono text-[10px] uppercase tracking-wider transition-colors duration-300 ${
                          active ? "text-white" : done ? "text-[#f97316]" : "text-white/30"
                        }`}>{label}</span>
                      </div>
                      {i < 2 && (
                        <div className={`mx-3 h-px w-6 sm:w-10 transition-all duration-500 ${step > n ? "bg-[#f97316]" : "bg-white/10"}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="h-px w-full bg-white/10">
                <div
                  className="h-px bg-[#f97316] transition-all duration-500"
                  style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "100%" }}
                />
              </div>
            </div>

            {/* Step 1 — pick service */}
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <h3 className="mb-1 font-display text-xl font-semibold text-white">What do you need?</h3>
                <p className="mb-6 text-sm text-white/50">Select the service closest to your job.</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {QUOTE_SERVICES.map(({ icon: Icon, label }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => { setService(label); setStep(2); }}
                      className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all duration-200 ${
                        service === label
                          ? "border-[#f97316] bg-[#f97316]/10 text-[#f97316]"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-[#f97316]/40 hover:text-white"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                      <span className="font-mono text-[10px] uppercase leading-tight tracking-wider">{label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2 — details */}
            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div className="mb-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/30 hover:text-white"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">Your details</h3>
                    <p className="text-xs text-white/40">Service: <span className="text-[#f97316]">{service}</span></p>
                  </div>
                </div>
                <div className="space-y-4">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white placeholder:text-white/30 transition focus:border-[#f97316] focus:outline-none"
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone / WhatsApp number"
                    className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white placeholder:text-white/30 transition focus:border-[#f97316] focus:outline-none"
                  />
                  <div>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-white/30" />
                      <input
                        value={location}
                        onChange={(e) => { setLocation(e.target.value); setLocError(null); }}
                        placeholder="Location — address or coordinates"
                        className="w-full rounded-xl border border-white/10 bg-[#0d1117] py-3 pl-11 pr-24 text-sm text-white placeholder:text-white/30 transition focus:border-[#f97316] focus:outline-none"
                      />
                      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
                        <button
                          type="button"
                          onClick={useMyLocation}
                          disabled={locating}
                          title="Use my current location"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/5 hover:text-[#f97316] disabled:opacity-30"
                        >
                          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Crosshair className="h-4 w-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={openMaps}
                          disabled={!location.trim()}
                          title="View on Google Maps"
                          className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 transition hover:bg-white/5 hover:text-[#f97316] disabled:opacity-30"
                        >
                          <MapPin className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {locError && <p className="mt-2 text-xs text-[#ef4444]">{locError}</p>}
                    {location && (
                      <button
                        type="button"
                        onClick={openMaps}
                        className="mt-2 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[#f97316]/70 underline underline-offset-2 transition hover:text-[#f97316]"
                      >
                        <MapPin className="h-3 w-3" /> View on Google Maps
                      </button>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={!name.trim() || !phone.trim()}
                  onClick={() => setStep(3)}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#f97316] py-3 text-sm font-semibold text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next — Describe the job <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* Step 3 — message & send */}
            {step === 3 && !sent && (
              <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
                <div className="mb-6 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/40 transition hover:border-white/30 hover:text-white"
                  >
                    ←
                  </button>
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">Describe the job</h3>
                    <p className="text-xs text-white/40">{service} · {name} · {phone}</p>
                  </div>
                </div>

                {/* Summary */}
                <div className="mb-5 space-y-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  {[
                    { label: "Service",  value: service },
                    { label: "Name",     value: name },
                    { label: "Phone",    value: phone },
                    { label: "Location", value: location || "Not provided" },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">{label}</span>
                      <span className="text-white/70">{value}</span>
                    </div>
                  ))}
                </div>

                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Anything extra — size of the property, what's happening, urgency…"
                  className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 text-sm text-white placeholder:text-white/30 transition focus:border-[#f97316] focus:outline-none"
                />

                <p className="mt-3 mb-5 flex items-center gap-1.5 text-xs text-white/40">
                  <MessageCircle className="h-3.5 w-3.5 text-[#25d366]" />
                  Opens WhatsApp with your details pre-filled — no typing needed.
                </p>

                <button
                  type="button"
                  onClick={handleSend}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25d366] py-3 text-sm font-semibold text-black transition hover:bg-green-400 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />} Send via WhatsApp
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={saving}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-white/10 py-3 text-sm font-semibold text-white/60 transition hover:border-white/30 hover:text-white disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Send via Email instead
                </button>
              </motion.div>
            )}

            {/* Sent confirmation */}
            {sent && (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#25d366]/10">
                  <CheckCircle className="h-8 w-8 text-[#25d366]" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white">Request sent!</h3>
                <p className="mt-2 text-sm text-white/50">We'll follow up on WhatsApp shortly.</p>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </section>
  );
}

function Footer({ contact }: { contact: ReturnType<typeof useSiteData>["data"]["contact"] }) {
  return (
    <footer className="border-t border-white/10 bg-[#0d1117] pt-16 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-[#f97316]" />
              <span className="font-display text-lg font-bold tracking-tight">
                <span className="text-[#f97316]">GOW TO</span><span className="text-white"> ELECTRICALS</span>
              </span>
            </div>
            <p className="mt-2 font-mono text-sm text-white/40">Licensed · Insured · ECB Registered</p>
          </div>
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Quick Links</div>
            <ul className="space-y-2 text-sm">
              {NAV.map((n) => (
                <li key={n.href}><a href={n.href} className="text-white/60 hover:text-white">{n.label}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.25em] text-white/40">Contact</div>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:${contact.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-white/60 transition hover:text-[#f97316]">
                  <Phone className="h-4 w-4 text-[#f97316]" /> {contact.phone}
                </a>
              </li>
              <li>
                <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-white/60 transition hover:text-[#25d366]">
                  <MessageCircle className="h-4 w-4 text-[#f97316]" /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-white/60 transition hover:text-[#f97316]">
                  <Mail className="h-4 w-4 text-[#f97316]" /> {contact.email}
                </a>
              </li>
              <li className="flex items-center gap-2 text-white/60">
                <MapPin className="h-4 w-4 text-[#f97316]" /> {contact.address}
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-wider text-white/30 md:flex-row">
          <span>ECB Reg: Pending · © 2026 Gow To Electricals</span>
          <span>Bulawayo · Zimbabwe · All Rights Reserved</span>
        </div>
      </div>
    </footer>
  );
}

function Index() {
  const { data, ready } = useSiteData();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1117]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f97316]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <Navbar />
      <main>
        <Hero slides={data.heroSlides} />
        <Services services={data.services} />
        <About stats={data.stats} />
        <Portfolio projects={data.projects} />
        <Certificates certificates={data.certificates} />
        <Testimonials items={data.testimonials} />
        <Contact contact={data.contact} />
      </main>
      <Footer contact={data.contact} />
    </div>
  );
}