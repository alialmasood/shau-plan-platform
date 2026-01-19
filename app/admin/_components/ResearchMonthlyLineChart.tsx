"use client";

import { useEffect, useMemo, useState } from "react";
import LineChart from "./charts/LineChart";
import { formatNumber } from "@/lib/utils/numberFormat";

type RangeKey = "last12" | "year";
type MetricKey = "published" | "total";

const YEARS_BACK = 5;

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800"
    >
      {children}
    </select>
  );
}

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

function ChartSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 animate-pulse">
      <div className="h-48 bg-slate-100 rounded-xl" />
      <div className="mt-3 grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function ResearchMonthlyLineChart() {
  const [range, setRange] = useState<RangeKey>("last12");
  const [metric, setMetric] = useState<MetricKey>("published");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<string[]>(Array.from({ length: 12 }, () => ""));
  const [values, setValues] = useState<number[]>(Array.from({ length: 12 }, () => 0));
  const [total, setTotal] = useState<number>(0);

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    const start = Math.max(2000, now - YEARS_BACK);
    return Array.from({ length: now - start + 1 }, (_, i) => now - i);
  }, []);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const qs =
          range === "year"
            ? `range=year&year=${encodeURIComponent(String(year))}&metric=${encodeURIComponent(metric)}`
            : `range=last12&metric=${encodeURIComponent(metric)}`;

        const res = await fetch(`/api/admin/stats/research-monthly?${qs}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const json = (await res.json()) as {
          ok: boolean;
          labels: string[];
          values: number[];
          total: number;
        };
        if (!mounted) return;
        setLabels(Array.isArray(json.labels) ? json.labels : []);
        setValues(Array.isArray(json.values) ? json.values : []);
        setTotal(Number(json.total ?? 0) || 0);
      } catch {
        if (!mounted) return;
        setLabels(Array.from({ length: 12 }, () => ""));
        setValues(Array.from({ length: 12 }, () => 0));
        setTotal(0);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
      controller.abort();
    };
  }, [range, metric, year]);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={range} onChange={(v) => setRange(v as RangeKey)}>
            <option value="last12">آخر 12 شهر</option>
            <option value="year">سنة محددة</option>
          </Select>

          {range === "year" ? (
            <Select value={String(year)} onChange={(v) => setYear(Number(v))}>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </Select>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <SegButton active={metric === "published"} onClick={() => setMetric("published")}>
            البحوث المنشورة
          </SegButton>
          <SegButton active={metric === "total"} onClick={() => setMetric("total")}>
            إجمالي البحوث
          </SegButton>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <div>
            <LineChart labels={labels} series={values} />
            <div className="mt-2 text-xs text-slate-500">
              الإجمالي ضمن الفترة:{" "}
              <span className="font-extrabold text-slate-800">{formatNumber(total)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

