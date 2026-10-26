import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'
import { AuthProvider } from './lib/AuthContext.jsx'
import { LanguageProvider } from './lib/LanguageContext.jsx'
import { ThemeProvider } from './lib/ThemeContext.jsx'
import { PeriodProvider } from './lib/PeriodContext.jsx'
import { PresentationProvider } from './lib/PresentationContext.jsx'
import { ToastProvider } from './lib/ToastContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <PeriodProvider>
                <PresentationProvider>
                  <App />
                </PresentationProvider>
              </PeriodProvider>
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
)

// Service worker: cangkang aplikasi tetap terbuka tanpa sinyal.
//
// Didaftarkan SETELAH render, bukan sebelum: pendaftarannya memakan bandwidth
// dan CPU, dan tidak ada gunanya mendahului tampilan pertama. Hanya di
// production — di dev, SW yang menyimpan cache justru menyembunyikan hasil
// perubahan kode di balik berkas lama.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Pendaftaran bisa gagal di konteks tidak aman (http non-localhost).
      // Aplikasinya tetap jalan penuh tanpa SW; yang hilang hanya kemampuan
      // membuka tanpa sinyal, dan itu bukan alasan menampilkan galat.
    });
  });
}
