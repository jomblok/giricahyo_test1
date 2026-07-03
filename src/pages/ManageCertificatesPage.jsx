import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Leaf, Award, Search, Plus, CheckCircle2, AlertCircle, UserPlus, FileCheck, X } from "lucide-react";
import { useApi, ApiState } from "../lib/useApi.jsx";
import { adoptionApi, treeApi, buyerApi, accountApi } from "../lib/api";
import { formatDate, formatNumber } from "../lib/format";

const PACKAGE_OPTIONS = [
  "Basic Carbon Contribution",
  "Tree Adoption — 1 Pohon",
  "Tree Adoption — 5 Pohon",
  "Tree Adoption — 10 Pohon",
  "Carbon Tourism Experience",
  "ESG/CSR Partnership",
];

export default function ManageCertificatesPage() {
  const { data: adoptions, loading, error, refetch } = useApi(() => adoptionApi.list());
  const { data: trees }  = useApi(() => treeApi.list());
  const { data: buyers } = useApi(() => buyerApi.list());

  const [showForm, setShowForm] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = (adoptions ?? []).filter((a) => {
    const haystack = `${a.tree_id} ${a.tree?.species ?? ""} ${a.tree?.farmer?.name ?? ""} ${a.buyer_name} ${a.certificate_no}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-forest-900 text-cream-50 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sage-500/20 rounded-lg p-1.5"><Leaf size={18} className="text-sage-400"/></div>
            <span className="font-semibold text-sm">Kelola Sertifikat</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-cream-50/60 text-xs hover:text-cream-50 transition-colors"><ArrowLeft size={13}/>Dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <h1 className="font-bold text-forest-950 text-lg">Sertifikat Dukungan Karbon</h1>
            <p className="text-xs text-forest-700/55 mt-0.5">Buat sertifikat baru setelah pembayaran buyer dikonfirmasi diterima koperasi.</p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-600 text-forest-950 text-sm font-semibold rounded-xl px-4 py-2.5 transition-colors shrink-0">
            <Plus size={15}/>Sertifikat Baru
          </button>
        </div>

        <div className="relative mt-6 mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-700/40"/>
          <input type="text" placeholder="Cari ID pohon, petani, buyer, atau no. sertifikat..."
            value={query} onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-white border border-cream-100 rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40"/>
        </div>

        <ApiState loading={loading} error={error}>
          <div className="space-y-3">
            {filtered.length === 0 && (
              <div className="bg-white rounded-2xl border border-cream-100 p-8 text-center text-sm text-forest-700/40">
                Belum ada sertifikat yang cocok dengan pencarian.
              </div>
            )}
            {filtered.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-cream-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <FileCheck size={16} className="text-gold-600 shrink-0"/>
                    <p className="font-mono-id text-gold-600 text-xs font-semibold">{a.certificate_no}</p>
                  </div>
                  <span className="text-[11px] text-forest-700/45 tabular shrink-0">{formatDate(a.adopted_date)}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <InfoBlock label="Pohon"          value={`${a.tree_id} — ${a.tree?.species ?? "—"}`} mono />
                  <InfoBlock label="Petani Pemilik" value={a.tree?.farmer?.name ?? "—"} />
                  <InfoBlock label="Buyer / Pendukung" value={a.buyer_name} highlight />
                </div>
                <p className="text-xs text-forest-700/55 mt-3 bg-cream-50 rounded-lg px-3 py-2 inline-block">
                  Paket: <span className="font-medium text-forest-900">{a.package_name}</span>
                </p>
              </div>
            ))}
          </div>
        </ApiState>
      </main>

      {showForm && (
        <NewCertificateModal
          trees={trees ?? []}
          buyers={buyers ?? []}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refetch(); }}
        />
      )}
    </div>
  );
}

function InfoBlock({ label, value, mono, highlight }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-forest-700/45 mb-0.5">{label}</p>
      <p className={`font-medium break-words ${mono ? "font-mono-id text-xs" : ""} ${highlight ? "text-gold-600 font-bold" : "text-forest-950"}`}>{value}</p>
    </div>
  );
}

function NewCertificateModal({ trees, buyers, onClose, onSuccess }) {
  const [mode, setMode]             = useState("existing");
  const [treeId, setTreeId]         = useState("");
  const [buyerId, setBuyerId]       = useState("");
  const [newBuyerName, setNewBuyerName] = useState("");
  const [newBuyerEmail, setNewBuyerEmail] = useState("");
  const [packageName, setPackageName]   = useState(PACKAGE_OPTIONS[0]);
  const [adoptedDate, setAdoptedDate]   = useState(new Date().toISOString().split("T")[0]);
  const [error, setError]           = useState("");
  const [success, setSuccess]       = useState(null);
  const [loading, setLoading]       = useState(false);

  async function handleSubmit() {
    setError("");
    if (!treeId) { setError("Pilih pohon yang didukung."); return; }

    let finalBuyerId = buyerId;

    // Kalau buyer baru, daftarkan dulu via API accounts
    if (mode === "new") {
      if (!newBuyerName.trim()) { setError("Nama buyer baru wajib diisi."); return; }
      try {
        // Buat buyer + akun sekaligus lewat AccountController
        const { account } = await accountApi.create({
          name:     newBuyerName.trim(),
          email:    newBuyerEmail.trim() || `buyer_${Date.now()}@giricahyo.id`,
          password: "buyer123",
          role:     "buyer",
        });
        finalBuyerId = account.linked_id;
      } catch (e) {
        setError(e.message); return;
      }
    } else if (!buyerId) {
      setError("Pilih buyer yang sudah ada, atau beralih ke 'Buyer Baru'."); return;
    }

    setLoading(true);
    try {
      const res = await adoptionApi.create({ tree_id: treeId, buyer_id: finalBuyerId, package_name: packageName, adopted_date: adoptedDate });
      setSuccess(res.adoption);
      onSuccess?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center shadow-2xl">
          <CheckCircle2 size={32} className="text-sage-600 mx-auto mb-3"/>
          <p className="font-bold text-forest-950 mb-1">Sertifikat Berhasil Dibuat</p>
          <p className="font-mono-id text-gold-600 text-sm mb-4">{success.certificate_no}</p>
          <p className="text-xs text-forest-700/60 mb-5">Sertifikat ini sekarang dapat dilihat di dashboard masing-masing.</p>
          <button onClick={onClose} className="w-full bg-forest-900 text-cream-50 text-sm font-semibold rounded-xl py-2.5 hover:bg-forest-800 transition-colors">Tutup</button>
        </div>
      </div>
    );
  }

  const inputCls = "w-full text-sm bg-cream-50 border border-cream-100 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40";

  return (
    <div className="fixed inset-0 bg-forest-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl" onClick={(e)=>e.stopPropagation()}>
        <div className="bg-forest-900 text-cream-50 px-6 py-5 flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-2"><Award size={17} className="text-gold-500"/><span className="font-semibold text-sm">Sertifikat Baru</span></div>
          <button onClick={onClose} className="text-cream-50/60 hover:text-cream-50"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-xs text-forest-700/55 bg-cream-50 rounded-lg p-3">Gunakan ini setelah pembayaran buyer sudah dikonfirmasi diterima koperasi.</p>

          <div>
            <label className="block text-xs font-medium text-forest-700/70 mb-1.5">Pohon yang Didukung <span className="text-clay-700">*</span></label>
            <select value={treeId} onChange={(e)=>setTreeId(e.target.value)} className={inputCls}>
              <option value="">Pilih pohon...</option>
              {trees.map((t)=>(
                <option key={t.id} value={t.id}>
                  {t.id} — {t.species} ({formatNumber(t.co2_eq_kg??t.co2EqKg??0,1)} kg CO₂e)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-forest-700/70 mb-1.5">Buyer / Pendukung <span className="text-clay-700">*</span></label>
            <div className="flex gap-2 mb-2">
              {["existing","new"].map((m)=>(
                <button key={m} onClick={()=>setMode(m)}
                  className={`flex-1 text-xs font-medium rounded-lg py-2 transition-colors ${mode===m?"bg-forest-900 text-cream-50":"bg-cream-100 text-forest-700/60"}`}>
                  {m==="existing"?"Sudah Ada":<><UserPlus size={12} className="inline mr-1"/>Buyer Baru</>}
                </button>
              ))}
            </div>
            {mode==="existing"
              ? <select value={buyerId} onChange={(e)=>setBuyerId(e.target.value)} className={inputCls}>
                  <option value="">Pilih buyer...</option>
                  {buyers.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              : <div className="space-y-2">
                  <input type="text" placeholder="Nama buyer (orang/perusahaan)" value={newBuyerName} onChange={(e)=>setNewBuyerName(e.target.value)} className={inputCls}/>
                  <input type="email" placeholder="Email (opsional)" value={newBuyerEmail} onChange={(e)=>setNewBuyerEmail(e.target.value)} className={inputCls}/>
                </div>
            }
          </div>

          <div>
            <label className="block text-xs font-medium text-forest-700/70 mb-1.5">Paket Kontribusi <span className="text-clay-700">*</span></label>
            <select value={packageName} onChange={(e)=>setPackageName(e.target.value)} className={inputCls}>
              {PACKAGE_OPTIONS.map(p=><option key={p}>{p}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-forest-700/70 mb-1.5">Tanggal Adopsi</label>
            <input type="date" value={adoptedDate} onChange={(e)=>setAdoptedDate(e.target.value)} className={inputCls}/>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-clay-100 text-clay-700 text-xs rounded-lg p-3">
              <AlertCircle size={13} className="shrink-0"/>{error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>}
            {loading ? "Menyimpan..." : "Buat Sertifikat"}
          </button>
        </div>
      </div>
    </div>
  );
}
