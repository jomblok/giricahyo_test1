import { useState, useRef, Fragment } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { treeApi, farmerApi, speciesApi } from "../lib/api";
import { useApi } from "../lib/useApi.jsx";
import { ArrowLeft, Leaf, ClipboardEdit, Eye, CheckCircle2, Download, Printer, RotateCcw, ChevronRight, ChevronLeft, AlertCircle, TreePine, User, MapPin, Ruler, Calculator, Wind } from "lucide-react";

function hitungKarbon({ dbhCm, heightM, densityRho }) {
  const D=Number(dbhCm), H=Number(heightM), rho=Number(densityRho);
  if (!D||!H||!rho) return null;
  const agb = 0.0673*Math.pow(rho*D*D*H,0.976);
  const bgb = agb*0.24, tb=agb+bgb, c=tb*0.47, co2=c*3.67;
  return { agbKg:agb, bgbKg:bgb, tbKg:tb, cKg:c, co2EqKg:co2 };
}
function fmt(n,d=2) { return n==null?"—":n.toLocaleString("id-ID",{minimumFractionDigits:d,maximumFractionDigits:d}); }

const STEP_LABELS = ["Isi Data Pohon","Preview & Kalkulasi","QR Code Jadi"];
const inputCls = (err) => `w-full text-sm bg-cream-50 border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-sage-400/40 transition-colors ${err?"border-clay-700/50":"border-cream-100"}`;
const selectCls = inputCls;

function Field({ label, hint, error, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-forest-700/70 mb-1">
        {label}{required&&<span className="text-clay-700 ml-0.5">*</span>}
        {hint&&<span className="font-normal text-forest-700/40 ml-1">— {hint}</span>}
      </label>
      {children}
      {error&&<p className="text-[11px] text-clay-700 mt-1 flex items-center gap-1"><AlertCircle size={11}/>{error}</p>}
    </div>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-forest-700/60 mb-3">{icon}<span className="text-[11px] font-semibold uppercase tracking-wider">{title}</span></div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default function GenerateQrPage() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ id:"", farmerId:"", species:"", dbhCm:"", heightM:"", densityRho:"", latitude:"", longitude:"", plantedDate:"", healthStatus:"baik" });
  const [errors, setErrors] = useState({});
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const qrRef = useRef(null);

  // Fetch farmers dan species dari API
  const { data: farmers } = useApi(() => farmerApi.list());
  const { data: speciesList } = useApi(() => speciesApi.list());

  const carbon = hitungKarbon(form);
  const selectedFarmer = (farmers??[]).find(f=>f.id===form.farmerId);
  const qrValue = form.id ? `${window.location.origin}/pohon/${form.id}` : "";

  function handleSpeciesChange(val) {
    const sp = (speciesList??[]).find(s=>s.name===val);
    setForm(p=>({ ...p, species:val, densityRho: sp ? String(sp.density_rho??sp.densityRho) : p.densityRho }));
  }
  function handleField(k,v) { setForm(p=>({...p,[k]:v})); if(errors[k]) setErrors(p=>({...p,[k]:undefined})); }

  function validate() {
    const e={};
    if (!form.id.trim()) e.id="ID pohon wajib diisi";
    else if (!/^[A-Z]{3}-\d{3}-\d{3}$/.test(form.id.trim())) e.id="Format: GJR-001-001";
    if (!form.farmerId) e.farmerId="Pilih petani pemilik";
    if (!form.species) e.species="Pilih jenis pohon";
    if (!form.dbhCm||isNaN(form.dbhCm)||Number(form.dbhCm)<=0) e.dbhCm="DBH wajib diisi";
    if (!form.heightM||isNaN(form.heightM)||Number(form.heightM)<=0) e.heightM="Tinggi wajib diisi";
    if (!form.densityRho||isNaN(form.densityRho)||Number(form.densityRho)<=0) e.densityRho="Densitas wajib diisi";
    if (!form.latitude||isNaN(form.latitude)) e.latitude="Koordinat lintang tidak valid";
    if (!form.longitude||isNaN(form.longitude)) e.longitude="Koordinat bujur tidak valid";
    if (!form.plantedDate) e.plantedDate="Tanggal tanam wajib diisi";
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(1);
  }

  async function handleConfirmAndGenerate() {
    setSaveError(""); setSaving(true);
    try {
      await treeApi.create({
        id:            form.id.trim(),
        farmer_id:     form.farmerId,
        species:       form.species,
        dbh_cm:        Number(form.dbhCm),
        height_m:      Number(form.heightM),
        density_rho:   Number(form.densityRho),
        latitude:      Number(form.latitude),
        longitude:     Number(form.longitude),
        health_status: form.healthStatus,
        planted_date:  form.plantedDate,
      });
      setStep(2);
    } catch(e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([xml],{type:"image/svg+xml"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href=url; a.download=`QR-${form.id}.svg`; a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setStep(0); setSaveError("");
    setForm({ id:"", farmerId:"", species:"", dbhCm:"", heightM:"", densityRho:"", latitude:"", longitude:"", plantedDate:"", healthStatus:"baik" });
    setErrors({});
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="bg-forest-900 text-cream-50 px-4 md:px-8 py-4 print:hidden">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-sage-500/20 rounded-lg p-1.5"><Leaf size={18} className="text-sage-400"/></div>
            <span className="font-semibold text-sm">Generate QR Code Pohon</span>
          </div>
          <Link to="/" className="flex items-center gap-1.5 text-cream-50/60 text-xs hover:text-cream-50 transition-colors"><ArrowLeft size={13}/>Dashboard</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center gap-1.5 mb-8 px-1 print:hidden">
          {STEP_LABELS.map((label,i)=>(
            <Fragment key={i}>
              <div className="flex items-center gap-2 shrink-0">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors ${i<step?"bg-sage-500 text-white":i===step?"bg-gold-500 text-forest-950":"bg-cream-100 text-forest-700/40"}`}>
                  {i<step?<CheckCircle2 size={13}/>:i+1}
                </div>
                <span className={`text-[11px] font-medium hidden sm:inline whitespace-nowrap ${i===step?"text-forest-950":"text-forest-700/40"}`}>{label}</span>
              </div>
              {i<STEP_LABELS.length-1&&<div className="flex-1 h-px bg-cream-100"/>}
            </Fragment>
          ))}
        </div>

        {/* STEP 0 */}
        {step===0&&(
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6"><ClipboardEdit size={18} className="text-sage-600"/><h2 className="font-semibold text-forest-950">Langkah 1 — Isi Data Pohon</h2></div>
            <div className="space-y-5">
              <FormSection icon={<TreePine size={14}/>} title="Identitas">
                <Field label="ID Pohon" hint="Format: GJR-001-001" error={errors.id} required>
                  <input type="text" placeholder="GJR-001-001" value={form.id} onChange={(e)=>handleField("id",e.target.value.toUpperCase())} className={inputCls(errors.id)+" font-mono-id"}/>
                </Field>
                <Field label="Jenis Pohon" error={errors.species} required>
                  <select value={form.species} onChange={(e)=>handleSpeciesChange(e.target.value)} className={selectCls(errors.species)}>
                    <option value="">— Pilih jenis pohon —</option>
                    {(speciesList??[]).map(s=><option key={s.name??s} value={s.name??s}>{s.name??s}</option>)}
                  </select>
                </Field>
                <Field label="Status Kesehatan">
                  <div className="flex gap-2">
                    {["baik","sedang","buruk"].map(s=>(
                      <button key={s} type="button" onClick={()=>handleField("healthStatus",s)}
                        className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors capitalize ${form.healthStatus===s?s==="baik"?"bg-sage-500 text-white border-sage-500":s==="sedang"?"bg-gold-500 text-forest-950 border-gold-500":"bg-clay-700 text-white border-clay-700":"bg-cream-50 text-forest-700/60 border-cream-100"}`}>
                        {s}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Tanggal Tanam" error={errors.plantedDate} required>
                  <input type="date" value={form.plantedDate} onChange={(e)=>handleField("plantedDate",e.target.value)} className={inputCls(errors.plantedDate)}/>
                </Field>
              </FormSection>

              <FormSection icon={<User size={14}/>} title="Petani Pemilik">
                <Field label="Pilih Petani" error={errors.farmerId} required>
                  <select value={form.farmerId} onChange={(e)=>handleField("farmerId",e.target.value)} className={selectCls(errors.farmerId)}>
                    <option value="">— Pilih petani —</option>
                    {(farmers??[]).filter(f=>f.status==="active").map(f=><option key={f.id} value={f.id}>{f.name} ({f.group_coop})</option>)}
                  </select>
                </Field>
              </FormSection>

              <FormSection icon={<MapPin size={14}/>} title="Lokasi GPS">
                <p className="text-xs text-forest-700/50 -mt-1 mb-2">Gunakan GPS dari perangkat, atau ambil dari Google Maps.</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Lintang (Latitude)" error={errors.latitude} required>
                    <input type="number" step="any" placeholder="-7.9847" value={form.latitude} onChange={(e)=>handleField("latitude",e.target.value)} className={inputCls(errors.latitude)+" font-mono-id"}/>
                  </Field>
                  <Field label="Bujur (Longitude)" error={errors.longitude} required>
                    <input type="number" step="any" placeholder="110.4734" value={form.longitude} onChange={(e)=>handleField("longitude",e.target.value)} className={inputCls(errors.longitude)+" font-mono-id"}/>
                  </Field>
                </div>
              </FormSection>

              <FormSection icon={<Ruler size={14}/>} title="Dimensi Fisik Pohon">
                <p className="text-xs text-forest-700/50 -mt-1 mb-2">Digunakan untuk menghitung estimasi serapan karbon.</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="DBH (cm)" hint="Diameter setinggi dada" error={errors.dbhCm} required>
                    <input type="number" min="1" step="0.1" placeholder="13.0" value={form.dbhCm} onChange={(e)=>handleField("dbhCm",e.target.value)} className={inputCls(errors.dbhCm)}/>
                  </Field>
                  <Field label="Tinggi (m)" error={errors.heightM} required>
                    <input type="number" min="0.1" step="0.1" placeholder="6.2" value={form.heightM} onChange={(e)=>handleField("heightM",e.target.value)} className={inputCls(errors.heightM)}/>
                  </Field>
                  <Field label="Densitas (ρ)" hint="auto dari jenis" error={errors.densityRho} required>
                    <input type="number" min="0.1" max="1.5" step="0.01" placeholder="0.65" value={form.densityRho} onChange={(e)=>handleField("densityRho",e.target.value)} className={inputCls(errors.densityRho)}/>
                  </Field>
                </div>
                {carbon&&(
                  <div className="mt-3 bg-sage-100 rounded-xl p-3 flex items-center gap-3">
                    <Wind size={16} className="text-sage-600 shrink-0"/>
                    <div>
                      <p className="text-[11px] text-sage-600/70 font-medium uppercase tracking-wide">Estimasi CO₂ (preview)</p>
                      <p className="text-sm font-bold text-forest-900 tabular">{fmt(carbon.co2EqKg)} kg CO₂e</p>
                    </div>
                  </div>
                )}
              </FormSection>
            </div>

            {Object.keys(errors).length>0&&(
              <div className="mt-5 flex items-start gap-2 bg-clay-100 text-clay-700 text-xs rounded-xl p-3">
                <AlertCircle size={14} className="shrink-0 mt-0.5"/>
                <p>Harap lengkapi semua field yang wajib diisi.</p>
              </div>
            )}
            <button onClick={handleNext} className="w-full mt-6 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-sm rounded-xl py-3 transition-colors">
              Preview & Hitung Karbon<ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* STEP 1 */}
        {step===1&&(
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-5"><Eye size={18} className="text-sage-600"/><h2 className="font-semibold text-forest-950">Langkah 2 — Preview &amp; Kalkulasi Karbon</h2></div>
            <p className="text-xs text-forest-700/55 mb-5">Periksa data sebelum QR digenerate.</p>
            <div className="border border-cream-100 rounded-xl overflow-hidden mb-4">
              <div className="bg-forest-900 px-4 py-3 flex items-center justify-between">
                <span className="font-mono-id text-gold-500 text-xs">{form.id}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${form.healthStatus==="baik"?"bg-sage-500/20 text-sage-400":form.healthStatus==="sedang"?"bg-gold-100 text-gold-600":"bg-clay-100 text-clay-700"}`}>{form.healthStatus}</span>
              </div>
              <div className="p-4 space-y-3 text-sm">
                {[["🌿 Jenis Pohon",form.species],["👤 Petani",selectedFarmer?.name??form.farmerId],[`📍 Koordinat`,`${Number(form.latitude).toFixed(5)}, ${Number(form.longitude).toFixed(5)}`],["📏 Dimensi",`DBH ${form.dbhCm} cm · Tinggi ${form.heightM} m · ρ ${form.densityRho}`]].map(([l,v])=>(
                  <div key={l} className="flex gap-2"><span className="text-forest-700/50 text-xs w-32 shrink-0">{l}</span><span className="font-medium text-forest-950">{v}</span></div>
                ))}
              </div>
            </div>
            {carbon&&(
              <div className="bg-cream-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3"><Calculator size={14} className="text-sage-600"/><p className="text-xs font-semibold text-forest-800 uppercase tracking-wide">Rincian Kalkulasi Karbon</p></div>
                <div className="space-y-2">
                  {[["AGB",carbon.agbKg,"kg"],["BGB",carbon.bgbKg,"kg"],["Total Biomassa",carbon.tbKg,"kg"],["Stok Karbon",carbon.cKg,"kg C"]].map(([l,v,u])=>(
                    <div key={l} className="flex justify-between"><span className="text-xs text-forest-700/60">{l}</span><span className="text-xs font-semibold tabular">{fmt(v)} {u}</span></div>
                  ))}
                  <div className="pt-2 border-t border-cream-100 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-forest-900">Total CO₂</span>
                    <span className="text-base font-bold text-gold-600 tabular">{fmt(carbon.co2EqKg)} kg CO₂e</span>
                  </div>
                </div>
                <p className="text-[10px] text-forest-700/40 mt-3">AGB = 0.0673×(ρ×D²×H)^0.976 · BGB = AGB×0.24 · C = TB×0.47 · CO₂ = C×3.67</p>
              </div>
            )}
            {saveError&&<div className="mb-3 flex items-center gap-2 bg-clay-100 text-clay-700 text-xs rounded-xl px-3 py-2.5"><AlertCircle size={13} className="shrink-0"/>{saveError}</div>}
            <div className="flex gap-3">
              <button onClick={()=>setStep(0)} className="flex-1 flex items-center justify-center gap-2 bg-cream-100 hover:bg-cream-100/70 text-forest-900 font-medium text-sm rounded-xl py-2.5 transition-colors"><ChevronLeft size={14}/>Kembali Edit</button>
              <button onClick={handleConfirmAndGenerate} disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors">
                {saving?<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>:<ChevronRight size={16}/>}
                {saving?"Menyimpan...":"Simpan & Generate QR"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2 */}
        {step===2&&(
          <div className="bg-white rounded-2xl border border-cream-100 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-sage-600"><CheckCircle2 size={18}/><h2 className="font-semibold text-forest-950">QR Code Siap &amp; Tersimpan</h2></div>
            <p className="text-xs text-forest-700/55 mb-6">Pohon berhasil disimpan ke database. QR code siap di-print dan ditempel ke batang pohon.</p>
            <div ref={qrRef} className="print-area flex flex-col items-center gap-4 py-8 px-6 bg-cream-50 rounded-2xl border border-cream-100 mb-5">
              <div className="flex items-center gap-2 mb-1"><Leaf size={14} className="text-forest-900"/><span className="text-xs font-semibold text-forest-900 uppercase tracking-wider">Inventarisasi Pohon Karbon Giricahyo</span></div>
              <QRCodeSVG value={qrValue} size={220} fgColor="#15392e" bgColor="#f6f3ea" level="M" marginSize={2}/>
              <div className="text-center space-y-1">
                <p className="font-mono-id text-forest-900 text-sm font-bold">{form.id}</p>
                <p className="text-xs text-forest-700/70">{form.species} · {selectedFarmer?.name}</p>
                {carbon&&<p className="text-xs font-semibold text-sage-600">{fmt(carbon.co2EqKg)} kg CO₂e</p>}
              </div>
              <p className="font-mono-id text-[9px] text-forest-700/40 break-all text-center max-w-xs">{qrValue}</p>
            </div>
            <div className="flex gap-3 mb-3 print:hidden">
              <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 bg-sage-500 hover:bg-sage-600 text-white font-semibold text-sm rounded-xl py-2.5 transition-colors"><Download size={15}/>Unduh SVG</button>
              <button onClick={()=>window.print()} className="flex-1 flex items-center justify-center gap-2 bg-forest-900 hover:bg-forest-800 text-cream-50 font-semibold text-sm rounded-xl py-2.5 transition-colors"><Printer size={15}/>Print Label</button>
            </div>
            <Link to={`/pohon/${form.id}`} className="block text-center w-full text-xs text-sage-600 hover:text-sage-500 font-medium mb-5 print:hidden">Lihat kartu identitas publik pohon ini →</Link>
            <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 bg-cream-100 hover:bg-cream-100/70 text-forest-900 font-medium text-sm rounded-xl py-2.5 transition-colors print:hidden"><RotateCcw size={14}/>Generate QR untuk Pohon Lain</button>
          </div>
        )}
      </main>
      <style>{`@media print{body *{visibility:hidden;}.print-area,.print-area *{visibility:visible;}.print-area{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);border:2px solid #15392e !important;}}`}</style>
    </div>
  );
}
