"use client";

import { useEffect, useMemo, useState } from "react";
import RecentUpdatesTable from "./RecentUpdatesTable";
import type { RecentUpdateRow } from "../models";

type TypeKey =
  | "all"
  | "research"
  | "conference"
  | "course"
  | "workshop"
  | "seminar"
  | "committee"
  | "reports";

type StatusKey = "الكل" | "مكتمل" | "بانتظار التدقيق" | "مرفوض/ناقص";

function SegButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-9 px-3 rounded-xl text-sm font-extrabold border",
        active
          ? "bg-blue-50 border-blue-100 text-blue-700"
          : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function RecentUpdatesDynamic({ limit = 15 }: { limit?: number }) {
  const [rows, setRows] = useState<RecentUpdateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [type, setType] = useState<TypeKey>("all");
  const [status, setStatus] = useState<StatusKey>("الكل");
  const [q, setQ] = useState("");

  const debouncedQ = useDebouncedValue(q, 350);

  const typeTabs = useMemo(
    () =>
      [
        { key: "all" as const, label: "الكل" },
        { key: "research" as const, label: "البحوث" },
        { key: "conference" as const, label: "المؤتمرات" },
        { key: "course" as const, label: "الدورات" },
        { key: "workshop" as const, label: "ورش العمل" },
        { key: "seminar" as const, label: "الندوات" },
        { key: "committee" as const, label: "اللجان" },
        { key: "reports" as const, label: "التقارير/التقويم" },
      ] as const,
    []
  );

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("limit", String(limit));
        params.set("type", type);
        params.set("status", status);
        if (debouncedQ.trim()) params.set("q", debouncedQ.trim());

        const res = await fetch(`/api/admin/activity-logs?${params.toString()}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const json = (await res.json()) as { ok: boolean; rows: RecentUpdateRow[] };
        if (!mounted) return;
        setRows(Array.isArray(json.rows) ? json.rows : []);
      } catch {
        if (!mounted) return;
        setRows([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    const i = window.setInterval(load, 60_000);
    return () => {
      mounted = false;
      controller.abort();
      window.clearInterval(i);
    };
  }, [limit, type, status, debouncedQ]);

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-col gap-2">
        {/* Type tabs */}
        <div className="flex items-center gap-2 overflow-auto">
          {typeTabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setType(t.key)}
              className={[
                "h-9 px-3 rounded-xl text-sm font-extrabold border whitespace-nowrap",
                type === t.key
                  ? "bg-blue-50 border-blue-100 text-blue-700"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Status */}
          <div className="flex items-center gap-2">
            <SegButton active={status === "الكل"} onClick={() => setStatus("الكل")}>
              الكل
            </SegButton>
            <SegButton active={status === "مكتمل"} onClick={() => setStatus("مكتمل")}>
              مكتمل
            </SegButton>
            <SegButton
              active={status === "بانتظار التدقيق"}
              onClick={() => setStatus("بانتظار التدقيق")}
            >
              بانتظار التدقيق
            </SegButton>
            <SegButton
              active={status === "مرفوض/ناقص"}
              onClick={() => setStatus("مرفوض/ناقص")}
            >
              مرفوض/ناقص
            </SegButton>
          </div>

          {/* Search */}
          <div className="min-w-[240px] w-full sm:w-[320px]">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="بحث باسم الباحث أو القسم..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      <RecentUpdatesTable
        rows={rows}
        loading={loading}
        emptyMessage="لا توجد تحديثات مطابقة للفلتر الحالي"
      />
    </div>
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

