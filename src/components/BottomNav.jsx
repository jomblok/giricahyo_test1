// src/components/BottomNav.jsx
//
// Navigasi bawah untuk layar kecil. Sebelumnya di ponsel tidak ada navigasi
// sama sekali untuk role mana pun.

import { NavLink } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import { useLanguage } from "../lib/LanguageContext";
import { bottomNavFor } from "../lib/navConfig";

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const items = bottomNavFor(user?.role);

  if (items.length < 2) return null;

  return (
    <nav
      aria-label="Navigasi bawah"
      className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-line"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 min-h-14 text-[10px] font-medium transition-colors ${
                isActive ? "text-brand-ink" : "text-ink-faint"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={19} strokeWidth={isActive ? 2.4 : 1.9} />
                <span className="truncate max-w-full px-1">{t(item.key)}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
