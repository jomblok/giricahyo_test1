// src/lib/PresentationContext.jsx
//
// Mode presentasi: sembunyikan kerangka aplikasi, perbesar tipografi, dan
// tampilkan ringkasan sebagai layar penuh. Dibuat untuk demo ke dosen/mitra.

import { createContext, useContext } from "react";

// Provider-nya di PresentationProvider.jsx.
export const PresentationContext = createContext(null);

export function usePresentation() {
  return useContext(PresentationContext) ?? { active: false, enter: () => {}, exit: () => {}, toggle: () => {} };
}
