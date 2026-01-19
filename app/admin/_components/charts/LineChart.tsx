"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/utils/numberFormat";

export default function LineChart({
  labels,
  series,
}: {
  labels: string[];
  series: number[];
}) {
  const w = 640;
  const h = 220;
  const padX = 34;
  const padY = 26;

  const safeSeries = series.length > 0 ? series : [0];
  const safeLabels = labels.length > 0 ? labels : [""];

  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const min = Math.min(...safeSeries);
  const max = Math.max(...safeSeries);
  const range = Math.max(1, max - min);

  const points = safeSeries.map((v, i) => {
    const x = padX + (i / Math.max(1, safeSeries.length - 1)) * (w - padX * 2);
    const y = padY + (1 - (v - min) / range) * (h - padY * 2);
    return { x, y, v, label: safeLabels[i] ?? "" };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");

  const hovered = useMemo(() => {
    if (hoverIdx === null) return null;
    return points[hoverIdx] ?? null;
  }, [hoverIdx, points]);

  return (
    <div className="w-full relative">
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full h-[220px] block"
        role="img"
        aria-label="مخطط خطي"
      >
        {/* grid */}
        {[0, 1, 2, 3].map((t) => {
          const y = padY + (t / 3) * (h - padY * 2);
          return (
            <line
              key={t}
              x1={padX}
              x2={w - padX}
              y1={y}
              y2={y}
              stroke="rgba(148,163,184,0.35)"
              strokeWidth="1"
            />
          );
        })}

        {/* line */}
        <path
          d={pathD}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* points */}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle
              cx={p.x}
              cy={p.y}
              r="4"
              fill="#ffffff"
              stroke="#2563eb"
              strokeWidth="2"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIdx(idx)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        ))}
      </svg>

      {/* labels */}
      <div className="mt-3 grid grid-cols-6 gap-2 text-[11px] text-slate-500">
        {safeLabels.slice(-6).map((l, idx) => (
          <div key={l} className="truncate">
            {l}
          </div>
        ))}
      </div>

      {hovered ? (
        <div
          dir="rtl"
          className="absolute top-2 right-2 rounded-xl border border-slate-200 bg-white/95 backdrop-blur px-3 py-2 shadow-[0_10px_30px_rgba(15,23,42,0.10)]"
        >
          <div className="text-xs font-extrabold text-slate-900 text-right">
            {hovered.label}
          </div>
          <div className="mt-1 text-xs text-slate-700 text-right">
            العدد:{" "}
            <span className="font-extrabold text-slate-900">
              {formatNumber(hovered.v)}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

