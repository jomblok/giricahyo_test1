// src/pages/MyTreesPage.jsx — daftar pohon milik petani yang sedang login.

import AppShell from "../components/AppShell";
import TreeTable from "../components/TreeTable";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";

export default function MyTreesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const farmerId = user?.linked_id ?? user?.linkedId ?? "F001";

  return (
    <AppShell title={t("nav_my_trees")} showPeriod={false}>
      {/* level=2: halaman ini tidak punya SectionHeader, jadi tabelnya
          berada langsung di bawah judul halaman (h1). */}
      <TreeTable farmerId={farmerId} level={2} />
    </AppShell>
  );
}
