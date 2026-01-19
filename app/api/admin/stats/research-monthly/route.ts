import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getResearchMonthlyCounts, type ResearchMonthlyMetric } from "@/lib/db/stats";

const ADMIN_COOKIE_NAME = "spsh_admin";

const MONTHS_AR = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function ymdMonthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const range = (url.searchParams.get("range") || "last12").toLowerCase();
  const metric = (url.searchParams.get("metric") || "published").toLowerCase() as ResearchMonthlyMetric;
  const yearParam = url.searchParams.get("year");

  const now = new Date();
  let start = startOfMonth(addMonths(now, -11));
  let end = startOfMonth(addMonths(now, 1));
  let labels: string[] = [];
  let months: Date[] = [];

  if (range === "year") {
    const y = Number(yearParam);
    const year = Number.isFinite(y) ? y : now.getFullYear();
    start = new Date(year, 0, 1);
    end = new Date(year + 1, 0, 1);
    months = Array.from({ length: 12 }, (_, i) => new Date(year, i, 1));
    labels = MONTHS_AR.slice();
  } else {
    months = Array.from({ length: 12 }, (_, i) => addMonths(start, i));
    labels = months.map((d) => `${MONTHS_AR[d.getMonth()]} ${d.getFullYear()}`);
  }

  try {
    const rows = await getResearchMonthlyCounts({
      startInclusive: start,
      endExclusive: end,
      metric: metric === "total" ? "total" : "published",
    });

    const map = new Map<string, number>();
    for (const r of rows) map.set(r.month, r.count);

    const values = months.map((d) => map.get(ymdMonthKey(d)) ?? 0);
    const total = values.reduce((s, v) => s + v, 0);

    return NextResponse.json(
      {
        ok: true,
        metric: metric === "total" ? "total" : "published",
        range: range === "year" ? "year" : "last12",
        year: range === "year" ? start.getFullYear() : null,
        labels,
        values,
        total,
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        metric: metric === "total" ? "total" : "published",
        range: range === "year" ? "year" : "last12",
        year: range === "year" ? start.getFullYear() : null,
        labels,
        values: months.map(() => 0),
        total: 0,
        error: error?.message ?? "unknown",
      },
      { status: 200 }
    );
  }
}

