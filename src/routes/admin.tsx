import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ShieldCheck, Eye, EyeOff, AlertCircle, LayoutDashboard, ImagePlus,
  Star, Phone, BarChart2, Settings, LogOut, Trash2, Plus, CheckCircle, Save,
  Image, ChevronUp, ChevronDown, Zap, X, FileText, Upload, Loader2, Award,
} from "lucide-react";
import { useSiteData, AUTH_KEY, type Project, type Testimonial, type HeroSlide, type Service, type ServiceOperation, type Certificate } from "@/lib/site-store";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setAuthed(sessionStorage.getItem(AUTH_KEY) === "1");
      setReady(true);
    }
  }, []);

  if (!ready) return null;
  if (!authed) return <Login onAuth={() => setAuthed(true)} />;
  return <Dashboard onLogout={() => { sessionStorage.removeItem(AUTH_KEY); setAuthed(false); }} />;
}

function Login({ onAuth }: { onAuth: () => void }) {
  const { data } = useSiteData();
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pw === data.password) {
      sessionStorage.setItem(AUTH_KEY, "1");
      onAuth();
    } else {
      setErr(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] px-4">
      <form onSubmit={submit} className="mx-auto mt-32 max-w-sm rounded-2xl border border-white/10 bg-[#161b22] p-8">
        <ShieldCheck className="mx-auto mb-4 h-10 w-10 text-[#f97316]" />
        <h1 className="text-center font-display text-xl font-bold text-white">Admin Access</h1>
        <p className="mb-8 text-center font-mono text-sm text-white/40">Go To Electricals — Manager Portal</p>
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={pw}
            onChange={(e) => { setPw(e.target.value); setErr(false); }}
            placeholder="Password"
            className="w-full rounded-xl border border-white/10 bg-[#0d1117] px-4 py-3 pr-12 text-white placeholder:text-white/30 focus:border-[#f97316] focus:outline-none"
          />
          <button type="button" onClick={() => setShow(!show)} className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white">
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button type="submit" className="mt-4 w-full rounded-full bg-[#f97316] py-3 font-semibold text-black hover:bg-orange-400">Login</button>
        {err && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> Wrong password — try again.
          </div>
        )}
      </form>
    </div>
  );
}

type Tab = "overview" | "hero" | "services" | "portfolio" | "certificates" | "testimonials" | "contact" | "stats" | "settings";

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>("overview");
  const { data, update } = useSiteData();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2500); };

  const nav: { id: Tab; icon: typeof LayoutDashboard; label: string }[] = [
    { id: "overview", icon: LayoutDashboard, label: "Overview" },
    { id: "hero", icon: Image, label: "Hero Slideshow" },
    { id: "services", icon: Zap, label: "Services" },
    { id: "portfolio", icon: ImagePlus, label: "Portfolio" },
    { id: "certificates", icon: Award, label: "Certificates" },
    { id: "testimonials", icon: Star, label: "Testimonials" },
    { id: "contact", icon: Phone, label: "Contact Info" },
    { id: "stats", icon: BarChart2, label: "Stats" },
    { id: "settings", icon: Settings, label: "Settings" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <aside className="fixed top-0 left-0 flex h-screen w-64 flex-col border-r border-white/10 bg-[#161b22] p-5 overflow-y-auto">
        <div className="mb-8 font-display text-lg font-bold">
          <span className="text-[#f97316]">GO TO</span> <span className="text-white">ADMIN</span>
        </div>
        <nav className="flex-1 space-y-1">
          {nav.map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-sm transition ${
                tab === n.id ? "border-white/30 bg-[#1c2128] text-white" : "border-transparent text-white/60 hover:text-white"
              }`}
            >
              <n.icon className="h-4 w-4 text-[#f97316]" /> {n.label}
            </button>
          ))}
        </nav>
        <button onClick={onLogout} className="flex items-center gap-3 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 hover:bg-[#1c2128] hover:text-white">
          <LogOut className="h-4 w-4 text-[#ef4444]" /> Logout
        </button>
      </aside>

      <main className="ml-64 min-h-screen p-8">
        {tab === "overview" && <Overview data={data} />}
        {tab === "hero" && <HeroSlideshowAdmin data={data} update={update} showToast={showToast} />}
        {tab === "services" && <ServicesAdmin data={data} update={update} showToast={showToast} />}
        {tab === "portfolio" && <PortfolioAdmin data={data} update={update} showToast={showToast} />}
        {tab === "certificates" && <CertificatesAdmin data={data} update={update} showToast={showToast} />}
        {tab === "testimonials" && <TestimonialsAdmin data={data} update={update} showToast={showToast} />}
        {tab === "contact" && <ContactAdmin data={data} update={update} showToast={showToast} />}
        {tab === "stats" && <StatsAdmin data={data} update={update} showToast={showToast} />}
        {tab === "settings" && <SettingsAdmin data={data} update={update} showToast={showToast} />}
      </main>

      {toast && (
        <div className="fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl border border-white/10 bg-[#161b22] px-4 py-3 text-sm text-white shadow-lg">
          <CheckCircle className="h-4 w-4 text-[#f97316]" /> {toast}
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-8 font-display text-2xl font-bold">{children}</h1>;
}

function Overview({ data }: { data: ReturnType<typeof useSiteData>["data"] }) {
  const stats = [
    { value: data.projects.length, label: "Portfolio Items" },
    { value: data.testimonials.length, label: "Testimonials" },
    { value: data.certificates.length, label: "Certificates" },
    { value: "Live", label: "Site Status" },
  ];
  return (
    <div>
      <SectionTitle>Overview</SectionTitle>
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/10 bg-[#161b22] p-5">
            <div className="font-display text-2xl font-bold text-[#f97316]">{s.value}</div>
            <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-white/10 bg-[#0d1117] px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#f97316] focus:outline-none";

function HeroSlideshowAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const setSlides = (heroSlides: HeroSlide[]) => update((p) => ({ ...p, heroSlides }));

  const removeSlide = (id: string) => {
    setSlides(data.heroSlides.filter((s) => s.id !== id));
    showToast("Slide removed");
  };

  const moveSlide = (id: string, dir: -1 | 1) => {
    const idx = data.heroSlides.findIndex((s) => s.id === id);
    const swapIdx = idx + dir;
    if (idx === -1 || swapIdx < 0 || swapIdx >= data.heroSlides.length) return;
    const next = [...data.heroSlides];
    [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
    setSlides(next);
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const id = `s${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        setSlides([...data.heroSlides, { id, image: reader.result as string }]);
      };
      reader.readAsDataURL(file);
    });
    showToast(files.length > 1 ? "Slides added" : "Slide added");
  };

  return (
    <div>
      <SectionTitle>Hero Slideshow</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-white/60">
        Upload background photos for the homepage banner. They fade through automatically behind the headline — the
        text, badges and button always render on top with a dark overlay, so the slideshow never gets in the way of
        reading the page. Leave this empty to keep the plain background.
      </p>
      <div className="grid gap-4 md:grid-cols-3">
        {data.heroSlides.map((s, i) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-[#161b22] p-4">
            <div className="h-36 w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              <img src={s.image} alt={`Hero slide ${i + 1}`} className="h-full w-full object-cover" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">Slide {i + 1}</span>
              <div className="flex gap-1">
                <button
                  onClick={() => moveSlide(s.id, -1)}
                  disabled={i === 0}
                  title="Move earlier"
                  aria-label="Move earlier"
                  className="rounded-full border border-white/10 p-1.5 text-white/50 transition hover:text-white disabled:opacity-30"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveSlide(s.id, 1)}
                  disabled={i === data.heroSlides.length - 1}
                  title="Move later"
                  aria-label="Move later"
                  className="rounded-full border border-white/10 p-1.5 text-white/50 transition hover:text-white disabled:opacity-30"
                >
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => removeSlide(s.id)}
                  title="Delete slide"
                  aria-label="Delete slide"
                  className="rounded-full border border-[#ef4444]/40 p-1.5 text-[#ef4444] hover:bg-red-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        <label className="flex min-h-[180px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f97316]/40 p-5 text-center text-[#f97316] hover:bg-[#f97316]/5">
          <Plus className="h-5 w-5" />
          <span className="text-sm font-semibold">Add slide(s)</span>
          <span className="text-xs text-[#f97316]/70">Select one or more photos</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
          />
        </label>
      </div>
    </div>
  );
}

const ICON_OPTIONS = ["Zap", "Building2", "Home", "Battery", "Sun", "LayoutDashboard", "Wrench", "Droplet"];

function OperationsModal({ service, onClose, onSave }: { service: Service; onClose: () => void; onSave: (ops: ServiceOperation[]) => void }) {
  const [ops, setOps] = useState<ServiceOperation[]>(service.operations);

  const addOp = () => setOps([...ops, { id: `op${Date.now()}`, name: "", price: "" }]);
  const updateOp = (id: string, patch: Partial<ServiceOperation>) =>
    setOps(ops.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  const removeOp = (id: string) => setOps(ops.filter((o) => o.id !== id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl border border-white/10 bg-[#161b22] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">{service.title} — Operations</h3>
          <button onClick={onClose} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/50 hover:border-[#f97316]/50 hover:text-[#f97316]">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-2">
          {ops.map((op) => (
            <div key={op.id} className="flex items-center gap-2">
              <input
                value={op.name}
                onChange={(e) => updateOp(op.id, { name: e.target.value })}
                placeholder="Operation name"
                className={`${inputCls} flex-1`}
              />
              <input
                value={op.price}
                onChange={(e) => updateOp(op.id, { price: e.target.value })}
                placeholder="Price (e.g. $25)"
                className={`${inputCls} w-28`}
              />
              <button
                onClick={() => removeOp(op.id)}
                aria-label="Delete operation"
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-[#ef4444]/40 text-[#ef4444] hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {ops.length === 0 && (
            <p className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-sm text-white/40">
              No operations added yet.
            </p>
          )}
        </div>
        <button onClick={addOp} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#f97316]/40 py-2.5 text-sm text-[#f97316] hover:bg-[#f97316]/5">
          <Plus className="h-4 w-4" /> Add Operation
        </button>
        <div className="mt-5 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-full border border-white/10 py-2.5 text-sm text-white/70 hover:text-white">Close</button>
          <button
            onClick={() => { onSave(ops); onClose(); }}
            className="flex-1 rounded-full bg-[#f97316] py-2.5 text-sm font-semibold text-black hover:bg-orange-400"
          >
            Save Operations
          </button>
        </div>
      </div>
    </div>
  );
}

function ServicesAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const [editing, setEditing] = useState<Service | null>(null);
  const setServices = (services: Service[]) => update((p) => ({ ...p, services }));
  const updateService = (id: string, patch: Partial<Service>) =>
    setServices(data.services.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  return (
    <div>
      <SectionTitle>Services</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-white/60">
        Edit the title and description for each service. Use "View / Edit Operations" to manage the list of
        operations and prices shown to visitors when they click "View Details" on the public site.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        {data.services.map((s) => (
          <div key={s.id} className="rounded-2xl border border-white/10 bg-[#161b22] p-5">
            <div className="space-y-2">
              <input value={s.title} onChange={(e) => updateService(s.id, { title: e.target.value })} className={inputCls} placeholder="Title" />
              <textarea value={s.desc} onChange={(e) => updateService(s.id, { desc: e.target.value })} rows={2} className={inputCls} placeholder="Description" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                {s.operations.length} operation{s.operations.length === 1 ? "" : "s"}
              </span>
              <button
                onClick={() => setEditing(s)}
                className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-white/70 hover:border-[#f97316]/50 hover:text-[#f97316]"
              >
                View / Edit Operations
              </button>
            </div>
            <button
              onClick={() => { update((p) => ({ ...p, services: data.services })); showToast(`"${s.title}" saved`); }}
              className="mt-3 flex items-center gap-1 rounded-full bg-[#f97316] px-4 py-2 text-xs font-semibold text-black"
            >
              <Save className="h-3 w-3" /> Save
            </button>
          </div>
        ))}
      </div>
      {editing && (
        <OperationsModal
          service={editing}
          onClose={() => setEditing(null)}
          onSave={(ops) => { updateService(editing.id, { operations: ops }); showToast("Operations updated"); }}
        />
      )}
    </div>
  );
}

function PortfolioAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const setProjects = (projects: Project[]) => update((p) => ({ ...p, projects }));

  const updateProject = (id: string, patch: Partial<Project>) =>
    setProjects(data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const removeProject = (id: string) => setProjects(data.projects.filter((p) => p.id !== id));

  const addProject = () => {
    const id = `p${Date.now()}`;
    setProjects([...data.projects, { id, tag: "0X / new", title: "New Project", description: "Description goes here.", chips: ["Tag"] }]);
  };

  const handleImage = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => updateProject(id, { image: reader.result as string });
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <SectionTitle>Portfolio</SectionTitle>
      <div className="grid gap-4 md:grid-cols-2">
        {data.projects.map((p) => (
          <div key={p.id} className="rounded-2xl border border-white/10 bg-[#161b22] p-5">
            <label className="block cursor-pointer">
              <div className="flex h-40 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
                {p.image ? (
                  <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-white/40">
                    <ImagePlus className="h-7 w-7" />
                    <span className="text-xs">Click to upload photo</span>
                  </div>
                )}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImage(p.id, e.target.files[0])} />
            </label>
            <div className="mt-4 space-y-2">
              <input value={p.tag} onChange={(e) => updateProject(p.id, { tag: e.target.value })} className={inputCls} placeholder="Tag" />
              <input value={p.title} onChange={(e) => updateProject(p.id, { title: e.target.value })} className={inputCls} placeholder="Title" />
              <textarea value={p.description} onChange={(e) => updateProject(p.id, { description: e.target.value })} rows={2} className={inputCls} placeholder="Description" />
              <input
                value={p.chips.join(", ")}
                onChange={(e) => updateProject(p.id, { chips: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                className={inputCls}
                placeholder="Chips (comma separated)"
              />
            </div>
            <div className="mt-3 flex justify-between gap-2">
              <button onClick={() => { update((prev) => ({ ...prev, projects: data.projects })); showToast(`"${p.title}" saved`); }} className="flex items-center gap-1 rounded-full bg-[#f97316] px-4 py-2 text-xs font-semibold text-black"><Save className="h-3 w-3" /> Save</button>
              <button onClick={() => removeProject(p.id)} className="flex items-center gap-1 rounded-full border border-[#ef4444]/40 px-4 py-2 text-xs text-[#ef4444] hover:bg-red-500/10"><Trash2 className="h-3 w-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={addProject} className="flex min-h-[200px] items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f97316]/40 p-5 text-[#f97316] hover:bg-[#f97316]/5">
          <Plus className="h-5 w-5" /> Add new project
        </button>
      </div>
    </div>
  );
}

function CertificatesAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);

  const setCertificates = (certificates: Certificate[]) => update((p) => ({ ...p, certificates }));

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setUploadErr(null);
    const newCerts: Certificate[] = [];

    for (const file of Array.from(files)) {
      try {
        const isPdf = file.type === "application/pdf";
        const isImage = file.type.startsWith("image/");
        if (!isPdf && !isImage) {
          throw new Error(`${file.name}: only images or PDF files are supported`);
        }

        const ext = file.name.split(".").pop() || (isPdf ? "pdf" : "jpg");
        const path = `cert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("certificates")
          .upload(path, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);

        newCerts.push({
          id: `c${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: file.name.replace(/\.[^.]+$/, ""),
          url: urlData.publicUrl,
          fileType: isPdf ? "pdf" : "image",
          uploadedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("[Certificates] upload failed:", err);
        const msg = err instanceof Error ? err.message : String(err);
        setUploadErr(
          msg.includes("Bucket not found")
            ? "Storage bucket 'certificates' doesn't exist yet — create it in Supabase Storage first."
            : `Upload failed: ${msg}`
        );
      }
    }

    if (newCerts.length) {
      setCertificates([...data.certificates, ...newCerts]);
      showToast(newCerts.length > 1 ? "Certificates uploaded" : "Certificate uploaded");
    }
    setUploading(false);
  };

  const removeCert = async (cert: Certificate) => {
    setCertificates(data.certificates.filter((c) => c.id !== cert.id));
    try {
      const path = cert.url.split("/certificates/")[1];
      if (path) await supabase.storage.from("certificates").remove([path]);
    } catch (err) {
      console.error("[Certificates] failed to remove file from storage:", err);
    }
    showToast("Certificate removed");
  };

  const updateTitle = (id: string, title: string) =>
    setCertificates(data.certificates.map((c) => (c.id === id ? { ...c, title } : c)));

  return (
    <div>
      <SectionTitle>Certificates</SectionTitle>
      <p className="mb-6 max-w-2xl text-sm text-white/60">
        Upload certificates, licenses, or compliance documents. These appear in a public Certificates section on the
        homepage so any visitor can view and download them — no login required. Images and PDFs are supported.
      </p>

      {uploadErr && (
        <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {uploadErr}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {data.certificates.map((c) => (
          <div key={c.id} className="rounded-2xl border border-white/10 bg-[#161b22] p-4">
            <div className="flex h-36 w-full items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04]">
              {c.fileType === "image" ? (
                <img src={c.url} alt={c.title} className="h-full w-full object-cover" />
              ) : (
                <FileText className="h-10 w-10 text-white/30" />
              )}
            </div>
            <input
              value={c.title}
              onChange={(e) => updateTitle(c.id, e.target.value)}
              className={`${inputCls} mt-3`}
              placeholder="Certificate title"
            />
            <div className="mt-3 flex items-center justify-between">
              <a
                href={c.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/40 hover:text-[#f97316]"
              >
                View file
              </a>
              <button
                onClick={() => removeCert(c)}
                title="Delete certificate"
                aria-label="Delete certificate"
                className="rounded-full border border-[#ef4444]/40 p-1.5 text-[#ef4444] hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
        <label className="flex min-h-[200px] cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f97316]/40 p-5 text-center text-[#f97316] hover:bg-[#f97316]/5">
          {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
          <span className="text-sm font-semibold">{uploading ? "Uploading..." : "Upload certificate(s)"}</span>
          <span className="text-xs text-[#f97316]/70">Images or PDF</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            multiple
            disabled={uploading}
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleUpload(e.target.files); e.target.value = ""; }}
          />
        </label>
      </div>
    </div>
  );
}

function TestimonialsAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const setItems = (testimonials: Testimonial[]) => update((p) => ({ ...p, testimonials }));
  const updateItem = (id: string, patch: Partial<Testimonial>) =>
    setItems(data.testimonials.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const remove = (id: string) => setItems(data.testimonials.filter((t) => t.id !== id));
  const add = () => setItems([...data.testimonials, { id: `t${Date.now()}`, name: "Client Name", suburb: "Suburb, Bulawayo", quote: "Their words here." }]);

  return (
    <div>
      <SectionTitle>Testimonials</SectionTitle>
      <div className="space-y-4">
        {data.testimonials.map((t) => (
          <div key={t.id} className="rounded-2xl border border-white/10 bg-[#161b22] p-5">
            <div className="grid gap-2 md:grid-cols-2">
              <input value={t.name} onChange={(e) => updateItem(t.id, { name: e.target.value })} className={inputCls} placeholder="Name" />
              <input value={t.suburb} onChange={(e) => updateItem(t.id, { suburb: e.target.value })} className={inputCls} placeholder="Suburb" />
            </div>
            <textarea value={t.quote} onChange={(e) => updateItem(t.id, { quote: e.target.value })} rows={3} className={`${inputCls} mt-2`} placeholder="Quote" />
            <div className="mt-3 flex justify-between">
              <button onClick={() => { update((prev) => ({ ...prev, testimonials: data.testimonials })); showToast(`Testimonial from "${t.name}" saved`); }} className="flex items-center gap-1 rounded-full bg-[#f97316] px-4 py-2 text-xs font-semibold text-black"><Save className="h-3 w-3" /> Save</button>
              <button onClick={() => remove(t.id)} className="flex items-center gap-1 rounded-full border border-[#ef4444]/40 px-4 py-2 text-xs text-[#ef4444] hover:bg-red-500/10"><Trash2 className="h-3 w-3" /> Delete</button>
            </div>
          </div>
        ))}
        <button onClick={add} className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#f97316]/40 p-5 text-[#f97316] hover:bg-[#f97316]/5">
          <Plus className="h-5 w-5" /> Add new testimonial
        </button>
      </div>
    </div>
  );
}

function ContactAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const [form, setForm] = useState(data.contact);
  const save = () => { update((p) => ({ ...p, contact: form })); showToast("Contact info saved"); };
  const fields: { key: keyof typeof form; label: string }[] = [
    { key: "phone", label: "Phone Number" },
    { key: "whatsapp", label: "WhatsApp Number (digits only, e.g. 2637XXXXXXXX)" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    { key: "hours", label: "Business Hours" },
  ];
  return (
    <div>
      <SectionTitle>Contact Info</SectionTitle>
      <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#161b22] p-6">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{f.label}</label>
            <input value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} className={inputCls} />
          </div>
        ))}
        <button onClick={save} className="flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-black hover:bg-orange-400"><Save className="h-4 w-4" /> Save</button>
      </div>
    </div>
  );
}

function StatsAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const [form, setForm] = useState(data.stats);
  const save = () => { update((p) => ({ ...p, stats: form })); showToast("Stats updated"); };
  return (
    <div>
      <SectionTitle>Stats</SectionTitle>
      <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#161b22] p-6">
        {(["years", "projects", "clients"] as const).map((k) => (
          <div key={k}>
            <label className="mb-2 block font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">{k}</label>
            <input type="number" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className={inputCls} />
          </div>
        ))}
        <button onClick={save} className="flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-black hover:bg-orange-400"><Save className="h-4 w-4" /> Save</button>
      </div>
    </div>
  );
}

function SettingsAdmin({ data, update, showToast }: { data: ReturnType<typeof useSiteData>["data"]; update: ReturnType<typeof useSiteData>["update"]; showToast: (m: string) => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const save = () => {
    setErr(null);
    if (current !== data.password) return setErr("Current password is incorrect.");
    if (next.length < 4) return setErr("New password must be at least 4 characters.");
    if (next !== confirm) return setErr("New passwords don't match.");
    update((p) => ({ ...p, password: next }));
    setCurrent(""); setNext(""); setConfirm("");
    showToast("Password updated");
  };

  return (
    <div>
      <SectionTitle>Settings</SectionTitle>
      <div className="max-w-xl space-y-4 rounded-2xl border border-white/10 bg-[#161b22] p-6">
        <h2 className="font-display text-lg font-semibold">Change Password</h2>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" className={inputCls} />
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password" className={inputCls} />
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm new password" className={inputCls} />
        {err && (
          <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4" /> {err}
          </div>
        )}
        <button onClick={save} className="flex items-center gap-2 rounded-full bg-[#f97316] px-5 py-2 text-sm font-semibold text-black hover:bg-orange-400"><Save className="h-4 w-4" /> Save</button>
      </div>
    </div>
  );
}