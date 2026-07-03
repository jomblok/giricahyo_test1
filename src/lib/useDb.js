// src/lib/useDb.js
// Hook reaktif — komponen yang pakai ini akan re-render otomatis
// setiap kali data di db.js berubah (misalnya pohon baru di-generate).

import { useState, useEffect } from "react";
import { subscribeDb } from "../data/db";

export function useDb(selector) {
  const [value, setValue] = useState(() => selector());

  useEffect(() => {
    // Update saat data berubah
    const unsub = subscribeDb(() => setValue(selector()));
    return unsub;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return value;
}
