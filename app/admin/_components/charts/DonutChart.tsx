"use client";

import type { DonutItem } from "../../dummyData";
import { useMemo, useState } from "react";
import { formatDecimal, formatNumber } from "@/lib/utils/numberFormat";

export default function DonutChart({ items }: { items: DonutItem[] }) {
  const [hovered, setHovered] = useState<DonutItem | null>(null);

  const sum = useMemo(() => items.reduce((s, it) => s + (Number(it.value) || 0), 0), [items]);
  const total = sum; // قد يكون 0 (حالة فارغة)
  const radius = 44;
  const stroke = 12;
  const c = 2 * Math.PI * radius;

  let offset = 0;
  const segments =
    total > 0
      ? items.map((it) => {
          const frac = it.value / total;
          const dash = frac * c;
          const seg = { ...it, dash, offset };
          offset += dash;
          return seg;
        })
      : [];

  const tooltip = hovered
    ? {
        label: hovered.label,
        value: hovered.value,
        pct: total > 0 ? (hovered.value / total) * 100 : 0,
      }
    : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
      <div className="relative flex items-center justify-center">
        <svg
          width="160"
          height="160"
          viewBox="0 0 120 120"
          role="img"
          aria-label="مخطط دائري"
        >
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(148,163,184,0.25)"
            strokeWidth={stroke}
          />
          <g transform="rotate(-90 60 60)">
            {segments.map((s) => (
              <circle
                key={s.label}
                cx="60"
                cy="60"
                r={radius}
                fill="none"
                stroke={s.color}
                strokeWidth={stroke}
                strokeDasharray={`${s.dash.toFixed(2)} ${(c - s.dash).toFixed(2)}`}
                strokeDashoffset={(-s.offset).toFixed(2)}
                strokeLinecap="round"
                className="cursor-pointer"
                onMouseEnter={() => setHovered({ label: s.label, value: s.value, color: s.color })}
                onMouseLeave={() => setHovered(null)}
              />
            ))}
          </g>

          <text
            x="60"
            y="56"
            textAnchor="middle"
            className="fill-slate-900"
            style={{ fontWeight: 800, fontSize: 14 }}
          >
            {formatNumber(total)}
          </text>
          <text
            x="60"
            y="74"
            textAnchor="middle"
            className="fill-slate-500"
            style={{ fontWeight: 700, fontSize: 10 }}
          >
            بحث
          </text>
        </svg>

        {tooltip ? (
          <div
            dir="rtl"
            className="absolute top-0 right-0 translate-x-2 -translate-y-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: hovered?.color }}
              />
              <div className="text-xs font-extrabold text-slate-900">
                {tooltip.label}
              </div>
            </div>
            <div className="mt-1 text-xs text-slate-700 text-right">
              <div>
                العدد:{" "}
                <span className="font-extrabold text-slate-900">
                  {formatNumber(tooltip.value)}
                </span>
              </div>
              <div className="mt-0.5">
                النسبة:{" "}
                <span className="font-extrabold text-slate-900">
                  {formatDecimal(tooltip.pct)}%
                </span>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className="space-y-2">
        {items.map((it) => {
          const pct = total > 0 ? (it.value / total) * 100 : 0;
          return (
            <div
              key={it.label}
              className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200/70 bg-white"
              onMouseEnter={() => setHovered(it)}
              onMouseLeave={() => setHovered(null)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: it.color }}
                />
                <div className="font-bold text-slate-800 truncate">
                  {it.label}{" "}
                  <span className="text-slate-500 font-extrabold">
                    ({formatNumber(it.value)})
                  </span>
                </div>
              </div>
              <div className="text-left">
                <div className="text-xs font-extrabold text-slate-500">
                  {formatDecimal(pct)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

