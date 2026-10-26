// src/components/ui/DataTable.jsx
//
// Tabel yang bisa diurut, dipaginasi, dan diekspor. Sebelumnya tabel pohon
// dan petani merender seluruh baris sekaligus tanpa sorting, tanpa halaman,
// dan tanpa cara mengunduh — padahal itu data yang paling sering diminta
// dalam bentuk file.

import { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ChevronsUpDown, ChevronLeft, ChevronRight, Download, Columns3, Check } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { Button, IconButton } from "./Button";

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const na = typeof a === "number" ? a : Number(String(a).replace(/[^\d.-]/g, ""));
  const nb = typeof b === "number" ? b : Number(String(b).replace(/[^\d.-]/g, ""));
  if (Number.isFinite(na) && Number.isFinite(nb) && String(a).trim() !== "" && String(b).trim() !== "") {
    return na - nb;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: "base" });
}

function toCsv(columns, rows) {
  const esc = (v) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.header)).join(";");
  const body = rows.map((r) =>
    columns.map((c) => esc(c.exportValue ? c.exportValue(r) : c.value(r))).join(";")
  );
  // BOM supaya Excel di Windows membaca UTF-8 dengan benar (ID petani, ° dst).
  return "﻿" + [head, ...body].join("\r\n");
}

export function DataTable({
  columns,
  rows,
  getRowKey = (r, i) => r.id ?? i,
  onRowClick,
  rowLabel,
  initialSort = null,
  pageSize = 15,
  exportName,
  empty = null,
  minWidth = 640,
}) {
  const { t } = useLanguage();
  const [sort, setSort] = useState(initialSort);
  const [page, setPage] = useState(0);
  // Kolom yang disembunyikan pengguna. Kolom ber-`sortable: false` (mis. tombol
  // aksi) tetap ikut disembunyikan kalau dipilih — tidak ada perlakuan khusus.
  const [hidden, setHidden] = useState(() => new Set());
  const [colsOpen, setColsOpen] = useState(false);

  const visibleColumns = useMemo(
    () => columns.filter((c) => !hidden.has(c.key)),
    [columns, hidden]
  );

  const toggleColumn = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      // Sisakan minimal satu kolom supaya tabel tidak pernah kosong total.
      if (next.has(key)) next.delete(key);
      else if (columns.length - next.size > 1) next.add(key);
      return next;
    });

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const dir = sort.dir === "desc" ? -1 : 1;
    return [...rows].sort((a, b) => compare(col.value(a), col.value(b)) * dir);
  }, [rows, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const paged = pageSize > 0 ? sorted.slice(safePage * pageSize, safePage * pageSize + pageSize) : sorted;

  const toggleSort = (key) => {
    setPage(0);
    setSort((s) =>
      !s || s.key !== key ? { key, dir: "asc" }
      : s.dir === "asc"   ? { key, dir: "desc" }
      : null // klik ketiga mengembalikan urutan asli
    );
  };

  const download = () => {
    const csv = toCsv(visibleColumns, sorted);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${exportName ?? "data"}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (rows.length === 0 && empty) return empty;

  const onRowKeyDown = (e, row) => {
    if (!onRowClick) return;
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onRowClick(row); }
  };

  return (
    <div className="space-y-3">
      {/* Header lengket: saat tabel panjang di-scroll, nama kolom tetap terbaca. */}
      <div className="overflow-x-auto overflow-y-auto max-h-[70vh] -mx-1">
        <table className="w-full text-sm" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-surface">
            <tr className="text-[11px] uppercase tracking-wide text-ink-faint text-left border-b border-line">
              {visibleColumns.map((c) => {
                const active = sort?.key === c.key;
                const Arrow = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
                return (
                  <th
                    key={c.key}
                    scope="col"
                    className={`py-2.5 px-3 font-semibold ${c.align === "right" ? "text-right" : c.align === "center" ? "text-center" : ""}`}
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {c.sortable === false ? c.header : (
                      <button
                        type="button"
                        onClick={() => toggleSort(c.key)}
                        title={`${t("sort_by")}: ${c.header}`}
                        className={`inline-flex items-center gap-1 uppercase tracking-wide font-semibold transition-colors hover:text-ink ${
                          active ? "text-ink" : ""
                        } ${c.align === "right" ? "flex-row-reverse" : ""}`}
                      >
                        {c.header}
                        <Arrow size={11} className={active ? "text-brand" : "opacity-45"} />
                      </button>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={getRowKey(row, i)}
                tabIndex={onRowClick ? 0 : undefined}
                role={onRowClick ? "button" : undefined}
                aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={(e) => onRowKeyDown(e, row)}
                className={`border-b border-line/60 last:border-0 transition-colors ${
                  onRowClick ? "cursor-pointer hover:bg-surface-hover focus:bg-surface-hover" : "hover:bg-surface-hover"
                }`}
              >
                {visibleColumns.map((c) => (
                  <td
                    key={c.key}
                    className={`py-2.5 px-3 ${c.align === "right" ? "text-right tabular" : c.align === "center" ? "text-center" : ""} ${c.cellClass ?? "text-ink"}`}
                  >
                    {c.render ? c.render(row) : c.value(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Kaki tabel: jumlah baris, ekspor, dan navigasi halaman */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="text-[11px] text-ink-faint tabular">
          {t("showing_rows")} {sorted.length === 0 ? 0 : safePage * pageSize + 1}–
          {Math.min((safePage + 1) * pageSize, sorted.length)} {t("of")} {sorted.length}
        </p>

        <div className="flex items-center gap-2">
          {/* Pengatur kolom */}
          <div className="relative">
            <Button
              size="sm"
              variant="secondary"
              icon={Columns3}
              onClick={() => setColsOpen((o) => !o)}
              aria-expanded={colsOpen}
            >
              {hidden.size > 0 ? `${visibleColumns.length}/${columns.length}` : t("columns_label")}
            </Button>
            {colsOpen && (
              <>
                <div className="fixed inset-0 z-20" onClick={() => setColsOpen(false)} />
                <div className="absolute right-0 bottom-full mb-2 z-30 w-52 bg-surface border border-line rounded-xl shadow-xl py-1.5">
                  {columns.map((c) => {
                    const shown = !hidden.has(c.key);
                    return (
                      <button
                        key={c.key}
                        type="button"
                        role="menuitemcheckbox"
                        aria-checked={shown}
                        onClick={() => toggleColumn(c.key)}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 text-left text-xs text-ink hover:bg-surface-hover transition-colors"
                      >
                        <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${
                          shown ? "bg-brand border-brand text-surface" : "border-line-strong"
                        }`}>
                          {shown && <Check size={10} strokeWidth={3} />}
                        </span>
                        <span className="truncate">{c.header}</span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {exportName && (
            <Button size="sm" variant="secondary" icon={Download} onClick={download}>
              {t("export_csv")}
            </Button>
          )}
          {pageCount > 1 && (
            <div className="flex items-center gap-1">
              <IconButton icon={ChevronLeft} label={t("prev_page")} size="sm" variant="secondary"
                          onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={safePage === 0} />
              <span className="text-[11px] text-ink-muted tabular px-1.5">
                {safePage + 1} / {pageCount}
              </span>
              <IconButton icon={ChevronRight} label={t("next_page")} size="sm" variant="secondary"
                          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))} disabled={safePage >= pageCount - 1} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataTable;
