import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Leaf, Eye, EyeOff, LogIn, AlertCircle, Info } from "lucide-react";
import { useAuth } from "../lib/AuthContext";

const ROLE_BADGE = {
  admin:  "bg-forest-900 text-cream-50",
  farmer: "bg-sage-500 text-white",
  buyer:  "bg-gold-500 text-forest-950",
};
const ROLE_LABEL = { admin: "Admin", farmer: "Petani", buyer: "Buyer" };

// Akun demo — hardcode di sini hanya untuk kemudahan development.
// Di production, panel ini bisa disembunyikan dengan VITE_SHOW_DEMO=false
const DEMO_ACCOUNTS = [
  { name: "Koperasi Giricahyo",   email: "admin@giricahyo.id",    password: "admin123",  role: "admin"  },
  { name: "Pak Slamet Riyadi",    email: "slamet@giricahyo.id",   password: "petani123", role: "farmer" },
  { name: "Bu Wartini",           email: "wartini@giricahyo.id",  password: "petani123", role: "farmer" },
  { name: "Pak Darmaji",          email: "darmaji@giricahyo.id",  password: "petani123", role: "farmer" },
  { name: "Pak Suyono",           email: "suyono@giricahyo.id",   password: "petani123", role: "farmer" },
  { name: "Bu Ngatinem",          email: "ngatinem@giricahyo.id", password: "petani123", role: "farmer" },
  { name: "Bu Sumarni",           email: "sumarni@giricahyo.id",  password: "petani123", role: "farmer" },
  { name: "Pak Wagiman",          email: "wagiman@giricahyo.id",  password: "petani123", role: "farmer" },
  { name: "PT Hijau Lestari",     email: "buyer@giricahyo.id",    password: "buyer123",  role: "buyer"  },
];

export default function LoginPage() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email || !password) { setError("Isi email dan password terlebih dahulu."); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.ok) navigate("/");
    else setError(result.error);
  }

  function fillAccount(acc) {
    setEmail(acc.email);
    setPassword(acc.password);
    setError("");
    setShowDemo(false);
  }

  return (
    <div className="min-h-screen bg-forest-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-sage-600/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-gold-500/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-sage-500/20 rounded-2xl p-4 mb-4 border border-sage-500/20">
            <Leaf size={32} className="text-sage-400" strokeWidth={2} />
          </div>
          <h1 className="text-xl font-bold text-cream-50 tracking-tight">Giricahyo Carbon</h1>
          <p className="text-cream-50/40 text-sm mt-1">Manajemen Bisnis Karbon Komunitas</p>
        </div>

        {/* Form */}
        <div className="bg-forest-900 rounded-2xl border border-cream-50/10 p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-cream-50 mb-5">Masuk ke Dasbor</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-cream-50/60 mb-1.5">Email</label>
              <input type="email" value={email} onChange={(e)=>{setEmail(e.target.value);setError("");}}
                placeholder="email@giricahyo.id" autoComplete="email"
                className="w-full text-sm bg-forest-800/60 border border-cream-50/10 text-cream-50 placeholder-cream-50/25 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40 transition-colors"/>
            </div>
            <div>
              <label className="block text-xs font-medium text-cream-50/60 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw?"text":"password"} value={password}
                  onChange={(e)=>{setPassword(e.target.value);setError("");}}
                  placeholder="••••••••" autoComplete="current-password"
                  className="w-full text-sm bg-forest-800/60 border border-cream-50/10 text-cream-50 placeholder-cream-50/25 rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:ring-2 focus:ring-sage-400/40 transition-colors"/>
                <button type="button" onClick={()=>setShowPw(v=>!v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-50/30 hover:text-cream-50/60 transition-colors">
                  {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
                </button>
              </div>
            </div>
            {error&&(
              <div className="flex items-center gap-2 bg-clay-700/20 border border-clay-700/30 text-clay-100 text-xs rounded-xl px-3 py-2.5">
                <AlertCircle size={13} className="shrink-0"/>{error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-sage-500 hover:bg-sage-600 disabled:opacity-60 text-white font-semibold text-sm rounded-xl py-3 transition-colors mt-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : <LogIn size={15}/>}
              {loading?"Memeriksa...":"Masuk"}
            </button>
          </form>
        </div>

        {/* Demo accounts */}
        <div className="mt-4 bg-forest-900/60 border border-cream-50/8 rounded-2xl overflow-hidden">
          <button onClick={()=>setShowDemo(v=>!v)}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
            <div className="flex items-center gap-2">
              <Info size={13} className="text-cream-50/40"/>
              <span className="text-[11px] font-semibold text-cream-50/40 uppercase tracking-wider">
                Akun demo ({DEMO_ACCOUNTS.length})
              </span>
            </div>
            <span className="text-cream-50/30 text-[11px]">{showDemo?"▲ sembunyikan":"▼ tampilkan"}</span>
          </button>
          {showDemo&&(
            <div className="border-t border-cream-50/8 p-3 space-y-1.5 max-h-64 overflow-y-auto">
              {DEMO_ACCOUNTS.map((acc)=>(
                <button key={acc.email} onClick={()=>fillAccount(acc)}
                  className="w-full flex items-center justify-between gap-3 bg-forest-800/40 hover:bg-forest-800/80 border border-cream-50/8 rounded-xl px-3.5 py-2.5 transition-colors text-left group">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-cream-50/80 group-hover:text-cream-50 transition-colors truncate">{acc.name}</p>
                    <p className="text-[11px] text-cream-50/35 truncate">{acc.email}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${ROLE_BADGE[acc.role]}`}>
                    {ROLE_LABEL[acc.role]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-cream-50/20 mt-6">
          Giricahyo, Purwosari, Gunungkidul · Sistem Karbon Komunitas
        </p>
      </div>
    </div>
  );
}
