import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, Users, UserPlus, Shield, Tractor, Building2, Eye, EyeOff, CheckCircle2, AlertCircle, X, Search, Mail, Lock, User, MapPin, Phone } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { accountApi, farmerApi, buyerApi } from "../lib/api";
import { useAuth } from "../lib/AuthContext";

const ROLE_CONFIG = {
  admin:  { label: "Admin",  icon: Shield,    badge: "bg-forest-900 text-cream-50",   desc: "Akses penuh ke seluruh sistem" },
  farmer: { label: "Petani", icon: Tractor,   badge: "bg-sage-500/20 text-sage-700",  desc: "Melihat pohon & gaji miliknya sendiri" },
  buyer:  { label: "Buyer",  icon: Building2, badge: "bg-gold-500/20 text-gold-700",  desc: "Melihat pohon yang dia dukung & sertifikat" },
};
const GROUP_OPTIONS = ["Kelompok Tani Giricahyo I","Kelompok Tani Giricahyo II","Kelompok Tani Giricahyo III"];

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-forest-700/70 mb-1.5">
        {label}{required && <span className="text-clay-700 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-clay-700 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    </div>
  );
}

const inputCls = (err) => `w-full text-sm bg-cream-50 border rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40 transition-colors ${err ? "border-clay-700/40" : "border-cream-100"}`;

function AddUserForm({ onSuccess, onCancel }) {
  const { registerUser } = useAuth();
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
    if (!res.ok) { setErrors({ _global: res.error }); return; }
    setSuccess({ name: form.name, email: form.email, role, linkedId: res.account?.linked_id });
    onSuccess?.();
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="bg-sage-100 rounded-full p-4"><CheckCircle2 size={28} className="text-sage-600"/></div>
        <div>
          <p className="font-bold text-forest-950">{success.name}</p>
          <p className="text-xs text-forest-700/55 mt-0.5">{success.email} · {ROLE_CONFIG[success.role].label}</p>
          {success.linkedId && <p className="text-xs text-sage-600 font-mono-id mt-1">ID: {success.linkedId}</p>}
        </div>
        <p className="text-sm text-forest-700/70">Akun berhasil dibuat.</p>
        <button onClick={() => { setSuccess(null); setForm({ name:"", email:"", password:"", groupCoop: GROUP_OPTIONS[0], address:"", phone:"" }); }}
          className="text-sm text-sage-600 font-semibold hover:underline">+ Tambah akun lain</button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold text-forest-700/70 mb-2.5">Role / Jenis Akun<span className="text-clay-700 ml-0.5">*</span></p>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(ROLE_CONFIG).map(([key, cfg]) => {
            const Icon = cfg.icon;
            return (
              <button key={key} type="button" onClick={() => setRole(key)}
                className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-center transition-all ${role===key ? "border-forest-900 bg-forest-50" : "border-cream-100 bg-cream-50 hover:border-cream-200"}`}>
                <Icon size={18} className={role===key ? "text-forest-900" : "text-forest-700/40"} />
                <span className={`text-xs font-semibold ${role===key ? "text-forest-950" : "text-forest-700/50"}`}>{cfg.label}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-forest-700/45 mt-1.5 px-1">{ROLE_CONFIG[role].desc}</p>
      </div>

      <Field label="Nama Lengkap" error={errors.name} required>
        <div className="relative"><User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/35"/>
          <input type="text" placeholder="Nama lengkap" value={form.name} onChange={(e)=>setField("name",e.target.value)} className={inputCls(errors.name)+" pl-9"}/></div>
      </Field>
      <Field label="Email" error={errors.email} required>
        <div className="relative"><Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/35"/>
          <input type="email" placeholder="email@example.com" value={form.email} onChange={(e)=>setField("email",e.target.value)} className={inputCls(errors.email)+" pl-9"}/></div>
      </Field>
      <Field label="Password" error={errors.password} required>
        <div className="relative"><Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/35"/>
          <input type={showPw?"text":"password"} placeholder="Min. 6 karakter" value={form.password} onChange={(e)=>setField("password",e.target.value)} className={inputCls(errors.password)+" pl-9 pr-10"}/>
          <button type="button" onClick={()=>setShowPw(v=>!v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-700/35 hover:text-forest-700/60">
            {showPw ? <EyeOff size={14}/> : <Eye size={14}/>}
          </button></div>
      </Field>

      {role === "farmer" && (
        <>
          <Field label="Kelompok Tani">
            <select value={form.groupCoop} onChange={(e)=>setField("groupCoop",e.target.value)} className={inputCls(false)}>
              {GROUP_OPTIONS.map(g=><option key={g}>{g}</option>)}
            </select>
          </Field>
          <Field label="Alamat Dusun">
            <div className="relative"><MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/35"/>
              <input type="text" placeholder="Dusun Karang, Giricahyo..." value={form.address} onChange={(e)=>setField("address",e.target.value)} className={inputCls(false)+" pl-9"}/></div>
          </Field>
        </>
      )}
      {role === "buyer" && (
        <Field label="Nomor Telepon / WhatsApp">
          <div className="relative"><Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-700/35"/>
            <input type="text" placeholder="08xx-xxxx-xxxx" value={form.phone} onChange={(e)=>setField("phone",e.target.value)} className={inputCls(false)+" pl-9"}/></div>
        </Field>
      )}

      {errors._global && (
        <div className="flex items-center gap-2 bg-clay-100 border border-clay-700/20 text-clay-700 text-xs rounded-xl px-3 py-2.5">
          <AlertCircle size={13} className="shrink-0"/>{errors._global}
        </div>
      )}
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 bg-cream-100 hover:bg-cream-100/70 text-forest-900 font-medium text-sm rounded-xl py-2.5 transition-colors">Batal</button>
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
  const { data: accounts, loading: aLoading, error: aError, refetch: refetchAccounts } = useApi(() => accountApi.list());
  const { data: farmers }  = useApi(() => farmerApi.list());
  const { data: buyers }   = useApi(() => buyerApi.list());

  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState("semua");
  const [query, setQuery] = useState("");

  const allAccounts = accounts ?? [];
  const filtered = allAccounts.filter((a) => {
    const matchRole = filterRole === "semua" || a.role === filterRole;
    const matchQ    = `${a.name} ${a.email}`.toLowerCase().includes(query.toLowerCase());
    return matchRole && matchQ && !a.deactivated;
  });

  const counts = {
    semua:  allAccounts.filter(a=>!a.deactivated).length,
    admin:  allAccounts.filter(a=>a.role==="admin"  && !a.deactivated).length,
    farmer: allAccounts.filter(a=>a.role==="farmer" && !a.deactivated).length,
    buyer:  allAccounts.filter(a=>a.role==="buyer"  && !a.deactivated).length,
  };

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-forest-900 text-cream-50 px-4 md:px-8 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sage-500/20 rounded-lg p-1.5"><Leaf size={18} className="text-sage-400"/></div>
            <span className="font-semibold text-sm">Kelola Pengguna</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-cream-50/60 text-xs hover:text-cream-50 transition-colors">
            <ArrowLeft size={13}/>Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Ringkasan */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[{key:"semua",label:"Total Akun",icon:Users},{key:"admin",label:"Admin",icon:Shield},{key:"farmer",label:"Petani",icon:Tractor},{key:"buyer",label:"Buyer",icon:Building2}]
            .map(({key,label,icon:Icon})=>(
              <button key={key} onClick={()=>setFilterRole(key)}
                className={`bg-white rounded-2xl border p-4 text-left transition-all shadow-sm ${filterRole===key?"border-forest-900 ring-1 ring-forest-900/10":"border-cream-100 hover:border-cream-200"}`}>
                <div className="flex items-center gap-2 mb-1"><Icon size={14} className="text-forest-700/50"/><span className="text-[11px] uppercase tracking-wide text-forest-700/50 font-semibold">{label}</span></div>
                <p className="text-2xl font-bold text-forest-950 tabular">{counts[key]}</p>
              </button>
            ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/35"/>
                  <input type="text" placeholder="Cari nama / email..." value={query} onChange={(e)=>setQuery(e.target.value)}
                    className="w-full text-xs bg-cream-50 border border-cream-100 rounded-xl pl-8 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40"/>
                </div>
                <button onClick={()=>setShowForm(true)}
                  className="flex items-center gap-1.5 bg-forest-900 hover:bg-forest-800 text-cream-50 text-xs font-semibold rounded-xl px-3.5 py-2.5 transition-colors shrink-0">
                  <UserPlus size={14}/>Tambah Akun
                </button>
              </div>
              <ApiState loading={aLoading} error={aError}>
                <div className="space-y-2">
                  {filtered.map((acc)=>{
                    const cfg = ROLE_CONFIG[acc.role];
                    const Icon = cfg.icon;
                    return (
                      <div key={acc.id} className="flex items-center gap-3 bg-cream-50 rounded-xl px-4 py-3 border border-cream-100/60">
                        <div className="w-9 h-9 rounded-full bg-forest-900/10 flex items-center justify-center shrink-0"><Icon size={16} className="text-forest-700/60"/></div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-forest-950 truncate">{acc.name}</p>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-forest-700/50 truncate">{acc.email}</p>
                          {acc.linked_id && <p className="text-[11px] text-sage-600 font-mono-id mt-0.5">{acc.linked_id}</p>}
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-center text-sm text-forest-700/40 py-8">Tidak ada akun ditemukan.</p>}
                </div>
              </ApiState>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            {/* Petani */}
            <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Tractor size={15} className="text-sage-600"/>
                <h3 className="font-semibold text-forest-950 text-sm">Petani Terdaftar</h3>
                <span className="text-[11px] text-forest-700/40 ml-auto">{(farmers??[]).filter(f=>f.status==="active").length} aktif</span>
              </div>
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {(farmers??[]).map(f=>(
                  <div key={f.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="font-mono-id text-[10px] text-forest-700/40 w-10 shrink-0">{f.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-forest-950 truncate">{f.name}</p>
                      <p className="text-[10px] text-forest-700/45 truncate">{f.group_coop}</p>
                    </div>
                    <span className={`ml-auto text-[9px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${f.status==="active"?"bg-sage-100 text-sage-600":"bg-cream-100 text-forest-700/40"}`}>{f.status==="active"?"aktif":"nonaktif"}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Buyer */}
            <div className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3"><Building2 size={15} className="text-gold-600"/>
                <h3 className="font-semibold text-forest-950 text-sm">Buyer Terdaftar</h3>
                <span className="text-[11px] text-forest-700/40 ml-auto">{(buyers??[]).length}</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {(buyers??[]).map(b=>(
                  <div key={b.id} className="flex items-center gap-2.5 py-1.5">
                    <span className="font-mono-id text-[10px] text-forest-700/40 w-10 shrink-0">{b.id}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-forest-950 truncate">{b.name}</p>
                      {b.email && <p className="text-[10px] text-forest-700/45 truncate">{b.email}</p>}
                    </div>
                  </div>
                ))}
                {(buyers??[]).length===0 && <p className="text-xs text-forest-700/40 text-center py-3">Belum ada buyer terdaftar.</p>}
              </div>
            </div>
          </div>
        </div>
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-forest-950/40 backdrop-blur-sm" onClick={()=>setShowForm(false)}/>
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2"><UserPlus size={17} className="text-sage-600"/><h2 className="font-bold text-forest-950">Tambah Akun Baru</h2></div>
              <button onClick={()=>setShowForm(false)} className="text-forest-700/40 hover:text-forest-700"><X size={18}/></button>
            </div>
            <AddUserForm onSuccess={() => refetchAccounts()} onCancel={()=>setShowForm(false)} />
          </div>
        </div>
      )}
    </div>
  );
}
