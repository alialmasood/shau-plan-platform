// Centralized Admin number/date formatting (UI-only)
// Rule: English digits (0-9) with locale en-US across /admin/*

const nf = new Intl.NumberFormat("en-US");
const nf1 = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 1,
});

export function formatNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  return nf.format(n);
}

export function formatDecimal(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0";
  return nf1.format(n);
}

export function formatPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return "0%";
  const n = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(n)) return "0%";
  // لا نستخدم style:'percent' حتى نتحكم بالمنزل العشري
  return `${nf.format(Math.round(n))}%`;
}

export function formatDateEnglishDigits(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear());
  // أرقام إنجليزية ضمن RTL
  return `${day}/${month}/${year}`;
}

