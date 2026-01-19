"use client";

import type { StackedSeries } from "../../dummyData";
import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils/numberFormat";

export default function StackedBars({
  labels,
  series,
}: {
  labels: string[];
  series: StackedSeries[];
}) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const totals = labels.map((_, i) =>
    series.reduce((sum, s) => sum + (s.values[i] ?? 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);

  const hovered = useMemo(() => {
    if (hoverIdx === null) return null;
    const month = labels[hoverIdx] ?? "-";
    const rows = series.map((s) => ({
      key: s.key,
      label: s.label,
      color: s.color,
      value: s.values[hoverIdx] ?? 0,
    }));
    const total = rows.reduce((sum, r) => sum + (r.value ?? 0), 0);
    return { month, rows, total };
  }, [hoverIdx, labels, series]);

  return (
    <div className="space-y-4 relative">
      <div className="flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-end justify-between gap-3">
            <div className="text-xs text-slate-500">
              إجمالي النشاطات لكل شهر (مكدّس)
            </div>
            <div className="text-xs text-slate-500">
              أعلى شهر: {formatNumber(maxTotal)}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-6 gap-3">
            {labels.map((label, idx) => {
              const total = totals[idx] ?? 0;
              const h = Math.round((total / maxTotal) * 120);
              let acc = 0;
              return (
                <div
                  key={`${label}-${idx}`}
                  className="flex flex-col items-center gap-2"
                  onMouseEnter={() => setHoverIdx(idx)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  <div className="h-[128px] w-full flex items-end">
                    <div className="relative w-full h-[128px] rounded-xl bg-slate-50 border border-slate-200/70 overflow-hidden">
                      <div
                        className="absolute bottom-0 left-0 right-0"
                        style={{ height: `${Math.max(10, h)}px` }}
                      >
                        {series.map((s) => {
                          const v = s.values[idx] ?? 0;
                          const segH =
                            total > 0 ? Math.round((v / total) * 100) : 0;
                          const el = (
                            <div
                              key={s.key}
                              className="absolute left-0 right-0"
                              style={{
                                bottom: `${acc}%`,
                                height: `${segH}%`,
                                backgroundColor: s.color,
                              }}
                            />
                          );
                          acc += segH;
                          return el;
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 truncate">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {hovered ? (
        <div
          dir="rtl"
          className="absolute top-0 right-0 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
        >
          <div className="text-xs font-extrabold text-slate-900 text-right">
            {hovered.month}
          </div>
          <div className="mt-1 space-y-1">
            {hovered.rows.map((r) => (
              <div key={r.key} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                  <span className="font-bold text-slate-700 truncate">{r.label}</span>
                </div>
                <div className="font-extrabold text-slate-900">{formatNumber(r.value)}</div>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between gap-3 text-xs">
            <div className="font-bold text-slate-600">الإجمالي</div>
            <div className="font-extrabold text-slate-900">{formatNumber(hovered.total)}</div>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {series.map((s) => (
          <div
            key={s.key}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-700"
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

