import { useToast } from "../lib/ToastContext";
import { useLanguage } from "../lib/LanguageContext";
import AppShell from "../components/AppShell";
import { useState } from "react";
import { Users, UserPlus, Shield, Tractor, Building2, Eye, EyeOff, CheckCircle2, AlertCircle, X, Search, Mail, Lock, User, MapPin, Phone } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import AccountRowActions from "../components/AccountRowActions";
import { accountApi, farmerApi, buyerApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";
import { ModalPortal } from '../components/ui/ModalPortal';
import { Select } from '../components/ui';

const ROLE_CONFIG = {
  admin:  { label: "Admin",  icon: Shield,    badge: "bg-forest-900 text-cream-50", desc: "Akses penuh ke seluruh sistem" },
  farmer: { label: "Petani", icon: Tractor,   badge: "bg-good-soft text-good",      desc: "Melihat pohon & gaji miliknya sendiri" },
  buyer:  { label: "Buyer",  icon: Building2, badge: "bg-warn-soft text-warn",      desc: "Melihat pohon yang dia dukung & sertifikat" },
};
const GROUP_OPTIONS = ["Kelompok Tani Giricahyo I","Kelompok Tani Giricahyo II","Kelompok Tani Giricahyo III"];

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-muted mb-1.5">
        {label}{required && <span className="text-bad ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-bad mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    </div>
  );
}

const inputCls = (err) => `w-full text-sm bg-surface-sub border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 transition-colors text-ink ${err ? "border-bad/40" : "border-line"}`;

function AddUserForm({ onSuccess, onCancel }) {
  const { registerUser } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [role, setRole] = useState("farmer");
  const [form, setForm] = useState({ name:"", email:"", password:"", groupCoop: GROUP_OPTIONS[0], address:"", phone:"" });
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  function setField(k,v) { setForm(p=>({...p,[k]:v})); if(errors[k]) setErrors(p=>({...p,[k]:undefined})); }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email tidak valid";
    if (!form.password || form.password.length < 6) e.password = "Password minimal 6 karakter";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    const res = await registerUser({ ...form, role });
    setLoading(false);
    if (!res.ok) { setErrors({ _global: res.error }); toast.error(res.error || t("toast_failed")); return; }
    setSuccess({ name: form.name, email: form.email, role, linkedId: res.account?.linked_id });
    toast.success(`${t("toast_account_created")} — ${form.name}`);
    onSuccess?.();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="bg-brand-soft rounded-full p-4"><CheckCircle2 size={28} className="text-brand"/></div>
        <div>
          <p className="font-bold text-ink">{success.name}</p>
          <p className="text-xs text-ink-muted mt-0.5">{success.email} · {ROLE_CONFIG[success.role].label}</p>
          {success.linkedId && <p className="text-xs text-brand font-mono-id mt-1">ID: {success.linkedId}</p>}
        </div>
        <p className="text-sm text-ink-muted">Akun berhasil dibuat.</p>
        <button onClick={() => { setSuccess(null); setForm({ name:"", email:"", password:"", groupCoop: GROUP_OPTIONS[0], address:"", phone:"" }); }}
          className="text-sm text-brand font-semibold hover:underline">+ Tambah akun lain</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-ink-muted mb-2.5">Role / Jenis Akun<span className="text-bad ml-0.5">*</span></p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} type="button" onClick={() => setRole(key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all ${role===key ? "border-brand bg-brand-soft" : "border-line bg-surface-sub hover:border-line-strong"}`}>
                <Icon size={18} className={role===key ? "text-ink" : "text-ink-faint"} />
                <span className={`text-xs font-semibold ${role===key ? "text-ink" : "text-ink-faint"}`}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-ink-faint mt-1.5 px-1">{ROLE_CONFIG[role].desc}</p>
      </div>

      <Field label="Nama Lengkap" error={errors.name} required>
        <div className="relative"><User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"/>
          <input type="text" placeholder="Nama lengkap" value={form.name} onChange={(e)=>setField("name",e.target.value)} className={inputCls(errors.name)+" pl-9"}/></div>
      </Field>
      <Field label="Email" error={errors.email} required>
        <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"/>
          <input type="email" placeholder="email@example.com" value={form.email} onChange={(e)=>setField("email",e.target.value)} className={inputCls(errors.email)+" pl-9"}/></div>
      </Field>
      <Field label="Password" error={errors.password} required>
        <div className="relative"><Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"/>
          <input type={showPw?"text":"password"} placeholder="Min. 6 karakter" value={form.password} onChange={(e)=>setField("password",e.target.value)} className={inputCls(errors.password)+" pl-9 pr-10"}/>
          <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink-muted">
            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button></div>
      </Field>

      {role === "farmer" && (
        <>
          <Field label="Kelompok Tani">
            <Select
              value={form.groupCoop}
              onChange={(e)=>setField("groupCoop",e.target.value)}
              options={GROUP_OPTIONS.map(g=>({ value: g, label: g }))}
              ariaLabel="Kelompok Tani"
            />
          </Field>
          <Field label="Alamat Dusun">
            <div className="relative"><MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"/>
              <input type="text" placeholder="Dusun Karang, Giricahyo..." value={form.address} onChange={(e)=>setField("address",e.target.value)} className={inputCls(false)+" pl-9"}/></div>
          </Field>
        </>
      )}
      {role === "buyer" && (
        <Field label="Nomor Telepon / WhatsApp">
          <div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"/>
            <input type="text" placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={(e)=>setField("phone",e.target.value)} className={inputCls(false)+" pl-9"}/></div>
        </Field>
      )}

      {errors._global && (
        <div className="flex items-center gap-2 bg-bad-soft border border-bad/20 text-bad text-xs rounded-xl px-3 py-2.5">
          <AlertCircle size={13} className="shrink-0"/>{errors._global}
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 bg-surface-sub hover:bg-surface-hover text-ink font-medium text-sm rounded-xl py-2.5 transition-colors">Batal</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors">
          {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <UserPlus size={15}/>}
          {loading ? "Menyimpan..." : "Buat Akun"}
        </button>
      </div>
    </div>
  );
}

export default function ManageUsersPage() {
  const { t } = useLanguage();
  // Akun nonaktif hanya dimuat kalau diminta. Sebelumnya tidak pernah bisa
  // dimuat sama sekali, jadi menonaktifkan akun adalah pintu satu arah.
  const [lihatNonaktif, setLihatNonaktif] = useState(false);
  const { data: accounts, loading: aLoading, error: aError, refetch: refetchAccounts } =
    useApi(() => accountApi.list(lihatNonaktif), [lihatNonaktif]);
  const { data: farmers }  = useApi(() => farmerApi.list());
  const { data: buyers }   = useApi(() => buyerApi.list());

  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState("semua");
  const [query, setQuery] = useState("");

  const allAccounts = accounts ?? [];
  const filtered = allAccounts.filter((a) => {
    const matchRole = filterRole === "semua" || a.role === filterRole;
    const matchQ    = `${a.name} ${a.email}`.toLowerCase().includes(query.toLowerCase());
    // Saat melihat yang nonaktif, keduanya ditampilkan supaya pengurus bisa
    // membandingkan dan langsung mengaktifkan kembali dari daftar yang sama.
    return matchRole && matchQ && (lihatNonaktif || !a.deactivated);
  });

  const counts = {
    semua:  allAccounts.filter(a=>!a.deactivated).length,
    admin:  allAccounts.filter(a=>a.role==="admin"  && !a.deactivated).length,
    farmer: allAccounts.filter(a=>a.role==="farmer" && !a.deactivated).length,
    buyer:  allAccounts.filter(a=>a.role==="buyer"  && !a.deactivated).length,
  };

  return (
    <AppShell title={t("nav_users")} showPeriod={false}>

      {/* Dulu <main>, padahal AppShell sudah punya <main> sendiri. */}
      <div className="gjr-stagger max-w-5xl mx-auto px-4 py-8">
        {/* Ringkasan */}
        {/* 8.5rem, lebih kecil dari 10rem yang dipakai dashboard lain. Grid ini
            BERSARANG di dalam kartu ber-padding, jadi lebarnya cuma 311px
            bukan 343px — kurang 21px dari syarat dua kolom, sehingga keempat
            kartu menumpuk satu per baris dan daftar akunnya terdorong jauh ke
            bawah. Diperkecil HANYA di sini karena angkanya satu digit; di
            dashboard lain angkanya ribuan dan kartu sesempit ini akan
            memotongnya. */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(8.5rem,1fr))] gap-3 mb-6">
          {[{key:"semua",label:"Total Akun",icon:Users},{key:"admin",label:"Admin",icon:Shield},{key:"farmer",label:"Petani",icon:Tractor},{key:"buyer",label:"Buyer",icon:Building2}]
            .map(({key,label,icon:Icon})=>(
              <button key={key} onClick={()=>setFilterRole(key)}
                className={`bg-surface rounded-2xl border p-4 text-left transition-all shadow-sm ${filterRole===key?"border-forest-900 dark:border-sage-400 ring-1 ring-forest-900/10 dark:ring-sage-400/20":"border-line hover:border-line-strong"}`}>
                <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-ink-faint"/><span className="text-[11px] uppercase tracking-wide text-ink-faint font-semibold">{label}</span></div>
                <p className="text-2xl font-bold text-ink tabular">{counts[key]}</p>
              </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm transition-colors">
              {/* flex-wrap: baris ini memuat kolom cari + dua tombol. Tanpa
                  membungkus, di lebar 320px ketiganya meluber 70px dan
                  menyeret seluruh halaman ikut melebar. */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="relative min-w-[11rem] flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint"/>
                  <input type="text" placeholder={t("search_users_placeholder")} value={query} onChange={(e)=>setQuery(e.target.value)}
                    className="w-full text-xs bg-surface-sub border border-line rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand/40 text-ink"/>
                </div>
                <button onClick={()=>setLihatNonaktif(v=>!v)}
                  aria-pressed={lihatNonaktif}
                  className={`shrink-0 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-colors ${lihatNonaktif?"border-brand bg-brand-soft text-brand-ink":"border-line bg-surface-sub text-ink-muted hover:text-ink"}`}>
                  {t("show_deactivated")}
                </button>
                <button onClick={()=>setShowForm(true)}
                  className="flex items-center gap-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors shrink-0">
                  <UserPlus size={14}/>{t("users_page_add_account")}
                </button>
              </div>
              <ApiState loading={aLoading} error={aError}>
                <div className="space-y-2">
                  {filtered.map((acc)=>{
                    const cfg = ROLE_CONFIG[acc.role];
                    const Icon = cfg.icon;
                    return (
                      <div key={acc.id} className="flex flex-wrap items-center gap-3 bg-surface-sub rounded-xl px-4 py-3 border border-line">
                        <div className="w-9 h-9 rounded-full bg-surface-hover flex items-center justify-center shrink-0"><Icon size={16} className="text-ink-muted"/></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* w-full di ponsel: nama berbagi baris flex dengan lencana peran, dan
                                di layar 375px ia cuma kebagian 83px sehingga
                                "admin@giricahyo.id" terpotong jadi tak terbaca.
                                Dengan baris penuh, lencananya turun ke bawah dan
                                nama mendapat seluruh lebar kolom. */}
                            <p className="w-full sm:w-auto text-sm font-semibold text-ink truncate">{acc.name}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-ink-faint truncate">{acc.email}</p>
                          {acc.linked_id && <p className="text-[11px] text-brand font-mono-id mt-0.5">{acc.linked_id}</p>}
                        </div>
                        {acc.deactivated && (
                          <span className="shrink-0 rounded-full bg-surface-hover px-2 py-0.5 text-[10px] font-semibold text-ink-faint">
                            {t("deactivated")}
                          </span>
                        )}
                        <AccountRowActions akun={acc} onBerubah={refetchAccounts} />
                      </div>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-center text-sm text-ink-faint py-8">{t("no_accounts_found")}</p>}
                </div>
              </ApiState>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Petani */}
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-3"><Tractor size={15} className="text-brand"/>
                {/* h2: berada langsung di bawah judul halaman (h1), tanpa
                    SectionHeader di antaranya. */}
                <h2 className="font-semibold text-ink text-sm">Petani Terdaftar</h2>
                <span className="text-[11px] text-ink-faint ml-auto">{(farmers??[]).filter(f=>f.status==="active").length} aktif</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(farmers??[]).map(f=>(
                  <div key={f.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="font-mono-id text-[10px] text-ink-faint w-10 shrink-0">{f.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{f.name}</p>
                      <p className="text-[10px] text-ink-faint truncate">{f.group_coop}</p>
                    </div>
                    <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${f.status==="active"?"bg-good-soft text-good":"bg-surface-hover text-ink-faint"}`}>{f.status==="active"?"aktif":"nonaktif"}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Buyer */}
            <div className="bg-surface rounded-2xl border border-line p-5 shadow-sm transition-colors">
              <div className="flex items-center gap-2 mb-3"><Building2 size={15} className="text-warn"/>
                <h2 className="font-semibold text-ink text-sm">Buyer Terdaftar</h2>
                <span className="text-[11px] text-ink-faint ml-auto">{(buyers??[]).length}</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(buyers??[]).map(b=>(
                  <div key={b.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="font-mono-id text-[10px] text-ink-faint w-10 shrink-0">{b.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{b.name}</p>
                      {b.email && <p className="text-[10px] text-ink-faint truncate">{b.email}</p>}
                    </div>
                  </div>
                ))}
                {(buyers??[]).length===0 && <p className="text-xs text-ink-faint text-center py-3">Belum ada buyer terdaftar.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <ModalPortal onClose={() => setShowForm(false)}>
        <div className="gjr-overlay-in fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm" onClick={()=>setShowForm(false)}/>
          <div className="gjr-panel-in relative w-full max-w-md bg-surface rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto transition-colors">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><UserPlus size={17} className="text-brand"/><h2 className="font-bold text-ink">Tambah Akun Baru</h2></div>
              <button onClick={()=>setShowForm(false)} aria-label={t("close")} title={t("close")} className="text-ink-faint hover:text-ink transition-colors"><X size={18}/></button>
            </div>
            <AddUserForm onSuccess={() => refetchAccounts()} onCancel={()=>setShowForm(false)} />
          </div>
        </div>
        </ModalPortal>
      )}
    </AppShell>
  );
}
