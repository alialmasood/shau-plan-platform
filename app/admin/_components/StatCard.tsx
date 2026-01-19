"use client";

import type { KPIItem } from "../dummyData";
import Card from "./Card";
import {
  IconAward,
  IconBookOpen,
  IconCalendar,
  IconTrendingUp,
  IconUsers,
} from "./icons";

function MiniSparkline({ values }: { values: number[] }) {
  const w = 120;
  const h = 36;
  const pad = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (w - pad * 2);
      const y = pad + (1 - (v - min) / range) * (h - pad * 2);
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="block">
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="text-slate-300"
      />
    </svg>
  );
}

function iconFor(key: KPIItem["iconKey"]) {
  switch (key) {
    case "researchers":
      return <IconUsers />;
    case "publications":
      return <IconBookOpen />;
    case "scopus":
      return <IconTrendingUp />;
    case "points":
      return <IconAward />;
    case "conferences":
      return <IconCalendar />;
    case "completeness":
      return <IconTrendingUp />;
    default:
      return <IconTrendingUp />;
  }
}

export default function StatCard({ item }: { item: KPIItem }) {
  const trendStyle =
    item.trendDirection === "up"
      ? "text-emerald-700 bg-emerald-50 border-emerald-100"
      : "text-rose-700 bg-rose-50 border-rose-100";

  const arrow = item.trendDirection === "up" ? "↑" : "↓";

  // بطاقات تحتوي على معلومات ثانوية تحتاج محاذاة أدق (مثل متوسط النقاط)
  const hasMeta = (item.meta?.length ?? 0) > 0;

  if (hasMeta) {
    return (
      <Card className="p-5 md:p-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-bold text-slate-700">{item.title}</div>
          </div>
          <span className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-slate-100 text-slate-700">
            {iconFor(item.iconKey)}
          </span>
        </div>

        {/* Main value (centered) */}
        <div className="mt-4 text-center">
          <div className="text-4xl font-extrabold text-slate-900 leading-none">
            {item.value}
          </div>
          <div className="text-sm text-slate-500 mt-2">{item.subtitle}</div>
        </div>

        {/* Secondary metrics (2 columns) */}
        <div className="mt-4 grid grid-cols-2 gap-3">
          {item.meta!.slice(0, 2).map((m) => (
            <div
              key={m.label}
              className="rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2"
            >
              <div className="text-[11px] font-bold text-slate-500 truncate">
                {m.label}
              </div>
              <div className="text-sm font-extrabold text-slate-900 mt-1">
                {m.value}
              </div>
            </div>
          ))}
        </div>

        {/* Trend (bottom) */}
        <div className="mt-4 flex justify-center">
          <span
            className={[
              "inline-flex items-center gap-2",
              "px-2.5 py-1.5 rounded-full border",
              "text-xs font-bold",
              trendStyle,
            ].join(" ")}
          >
            <span aria-hidden="true">{arrow}</span>
            <span>{item.trendLabel}</span>
          </span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-700">{item.title}</div>
          <div className="text-3xl font-extrabold text-slate-900 mt-2">
            {item.value}
          </div>
          <div className="text-sm text-slate-500 mt-1">{item.subtitle}</div>
        </div>

        <div className="flex flex-col items-end gap-3">
          <span className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-slate-100 text-slate-700">
            {iconFor(item.iconKey)}
          </span>
          {item.spark?.length ? (
            <div className="text-slate-300">
              <MiniSparkline values={item.spark} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <span
          className={[
            "inline-flex items-center gap-2",
            "px-2.5 py-1.5 rounded-full border",
            "text-xs font-bold",
            trendStyle,
          ].join(" ")}
        >
          <span aria-hidden="true">{arrow}</span>
          <span>{item.trendLabel}</span>
        </span>
      </div>
    </Card>
  );
}

