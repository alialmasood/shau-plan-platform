"use client";

import { useEffect, useMemo, useState } from "react";
import StackedBars from "./charts/StackedBars";
import type { StackedSeries } from "../dummyData";

type RangeKey = 6 | 12;

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
      <div className="h-44 bg-slate-100 rounded-xl" />
      <div className="mt-3 grid grid-cols-6 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 bg-slate-100 rounded" />
        ))}
      </div>
    </div>
  );
}

export default function ActivitiesMonthlyStackedChart() {
  const [months, setMonths] = useState<RangeKey>(6);
  const [loading, setLoading] = useState(true);
  const [labels, setLabels] = useState<string[]>([]);
  const [series, setSeries] = useState<StackedSeries[]>([]);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/stats/activities-monthly?months=${months}`, {
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const json = (await res.json()) as {
          ok: boolean;
          labels: string[];
          series: StackedSeries[];
        };
        if (!mounted) return;
        setLabels(Array.isArray(json.labels) ? json.labels : []);
        setSeries(Array.isArray(json.series) ? json.series : []);
      } catch {
        if (!mounted) return;
        setLabels([]);
        setSeries([]);
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
  }, [months]);

  const subtitle = useMemo(() => {
    return months === 12 ? "آخر 12 شهر" : "آخر 6 أشهر";
  }, [months]);

  return (
    <div>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="text-xs text-slate-500">{subtitle}</div>
        <div className="flex items-center gap-2">
          <SegButton active={months === 6} onClick={() => setMonths(6)}>
            آخر 6 أشهر
          </SegButton>
          <SegButton active={months === 12} onClick={() => setMonths(12)}>
            آخر 12 شهر
          </SegButton>
        </div>
      </div>

      <div className="mt-3">
        {loading ? (
          <ChartSkeleton />
        ) : (
          <StackedBars labels={labels} series={series} />
        )}
      </div>
    </div>
  );
}

