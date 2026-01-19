"use client";

import Card from "./Card";
import type { LeaderboardItem } from "../dummyData";
import Link from "next/link";
import { formatNumber } from "@/lib/utils/numberFormat";

function rankColor(rank: number) {
  if (rank === 1) return "bg-amber-100 text-amber-800 border-amber-200";
  if (rank === 2) return "bg-slate-100 text-slate-700 border-slate-200";
  if (rank === 3) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-blue-50 text-blue-700 border-blue-100";
}

function SkeletonRow({ rank }: { rank: number }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-white animate-pulse">
      <span className="inline-flex items-center justify-center h-8 min-w-8 px-2 rounded-full border border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-500">
        #{formatNumber(rank)}
      </span>
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/3 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-1/2 bg-slate-100 rounded" />
      </div>
      <div className="text-left">
        <div className="h-4 w-12 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-8 bg-slate-100 rounded" />
      </div>
    </div>
  );
}

export default function LeaderboardList({
  title,
  items,
  kind,
  loading = false,
}: {
  title: string;
  items: LeaderboardItem[];
  kind: "researcher" | "department";
  loading?: boolean;
}) {
  return (
    <Card className="p-4 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="text-sm md:text-base font-extrabold text-slate-900">
          {title}
        </h4>
        <span className="text-xs text-slate-500">
          {kind === "researcher" ? "حسب نقاط الباحث" : "حسب نقاط القسم"}
        </span>
      </div>

      <div className="mt-3 space-y-2">
        {loading ? (
          <>
            <SkeletonRow rank={1} />
            <SkeletonRow rank={2} />
            <SkeletonRow rank={3} />
            <SkeletonRow rank={4} />
            <SkeletonRow rank={5} />
          </>
        ) : items.length === 0 ? (
          <div className="text-sm text-slate-500">لا توجد بيانات للعرض حالياً.</div>
        ) : (
          items.map((it) => {
            const sub1 = it.subtitle ?? it.department;
            const sub2 = it.subtitle2;

            const row = (
              <div className="flex items-center gap-3 p-3 rounded-xl border border-slate-200/70 bg-white hover:bg-slate-50">
                <span
                  className={[
                    "inline-flex items-center justify-center",
                    "h-8 min-w-8 px-2 rounded-full border",
                    "text-xs font-extrabold",
                    rankColor(it.rank),
                  ].join(" ")}
                >
                  #{formatNumber(it.rank)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="font-bold text-slate-900 truncate">{it.name}</div>
                  <div className="text-xs text-slate-500 truncate">{sub1}</div>
                  {sub2 ? (
                    <div className="text-[11px] text-slate-500 mt-1 truncate">
                      {sub2}
                    </div>
                  ) : null}
                </div>

                <div className="text-left">
                  <div className="text-sm font-extrabold text-slate-900">
                    {formatNumber(it.points)}
                  </div>
                  <div className="text-[11px] text-slate-500">نقطة</div>
                </div>
              </div>
            );

            return it.href ? (
              <Link key={it.id} href={it.href} className="block">
                {row}
              </Link>
            ) : (
              <div key={it.id}>{row}</div>
            );
          })
        )}
      </div>
    </Card>
  );
}

