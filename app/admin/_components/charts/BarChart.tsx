"use client";

import type { BarItem } from "../../dummyData";
import Link from "next/link";
import { formatDecimal, formatNumber } from "@/lib/utils/numberFormat";

export default function BarChart({ items }: { items: BarItem[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-sm text-slate-500">
        لا توجد بيانات كافية لعرض أفضل الأقسام حالياً.
      </div>
    );
  }

  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-3">
      {items.map((it) => {
        const pct = Math.round((it.value / max) * 100);
        const color = it.color ?? "#2563eb";
        const content = (
          <div
            className={[
              "space-y-1 rounded-2xl p-2",
              it.href ? "hover:bg-slate-50 cursor-pointer" : "",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-slate-800 truncate">
                  {it.label}
                </div>
                {it.meta && it.meta.length > 0 ? (
                  <div className="mt-1 space-y-0.5">
                    {it.meta.slice(0, 2).map((m) => (
                      <div
                        key={m.label}
                        className="text-[12px] text-slate-500 flex items-center justify-between gap-2"
                      >
                        <span className="font-bold">{m.label}</span>
                        <span className="font-extrabold text-slate-700">
                          {m.label.includes("متوسط")
                            ? formatDecimal(m.value)
                            : formatNumber(m.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="text-sm font-extrabold text-slate-900 shrink-0">
                {formatNumber(it.value)}
              </div>
            </div>

            <div className="h-3 rounded-full bg-slate-100 overflow-hidden border border-slate-200/70">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        );

        return it.href ? (
          <Link key={it.label} href={it.href} className="block">
            {content}
          </Link>
        ) : (
          <div key={it.label}>{content}</div>
        );
      })}

      <div className="text-xs text-slate-500 pt-2">
        القياس: نقاط الأداء العلمي (الحد الأعلى داخل القائمة = 100%)
      </div>
    </div>
  );
}

