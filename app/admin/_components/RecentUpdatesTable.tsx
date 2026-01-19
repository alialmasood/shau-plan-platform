"use client";

import type { RecentUpdateRow } from "../models";
import Badge from "./Badge";
import { formatDateEnglishDigits } from "@/lib/utils/numberFormat";
import Link from "next/link";

function SkeletonRow({ idx }: { idx: number }) {
  return (
    <tr key={`sk-${idx}`} className="border-t border-slate-200/70 animate-pulse">
      <td className="py-3 px-3">
        <div className="h-4 w-24 bg-slate-100 rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-48 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-14 bg-slate-100 rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="h-4 w-40 bg-slate-100 rounded" />
      </td>
      <td className="py-3 px-3">
        <div className="h-6 w-24 bg-slate-100 rounded-full" />
      </td>
      <td className="py-3 px-3">
        <div className="h-9 w-20 bg-slate-100 rounded-xl" />
      </td>
    </tr>
  );
}

export default function RecentUpdatesTable({
  rows,
  loading = false,
  emptyMessage = "لا توجد تحديثات مطابقة للفلتر الحالي",
}: {
  rows: RecentUpdateRow[];
  loading?: boolean;
  emptyMessage?: string;
}) {
  return (
    <div className="w-full overflow-auto">
      <table className="min-w-[820px] w-full text-sm">
        <thead>
          <tr className="text-slate-600">
            <th className="text-right font-bold py-3 px-3">التاريخ</th>
            <th className="text-right font-bold py-3 px-3">الباحث/القسم</th>
            <th className="text-right font-bold py-3 px-3">نوع النشاط</th>
            <th className="text-right font-bold py-3 px-3">الحالة</th>
            <th className="text-right font-bold py-3 px-3">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonRow key={i} idx={i} />
              ))}
            </>
          ) : rows.length === 0 ? (
            <tr className="border-t border-slate-200/70">
              <td className="py-6 px-3 text-slate-500" colSpan={5}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr
                key={r.id}
                className="border-t border-slate-200/70 hover:bg-slate-50 transition-colors"
              >
                <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                  {formatDateEnglishDigits(r.date)}
                </td>
                <td className="py-3 px-3">
                  <div className="font-bold text-slate-900">{r.actorName}</div>
                  <div className="text-xs text-slate-500">
                    {r.actorType === "باحث" ? "باحث" : "قسم"}
                  </div>
                </td>
                <td className="py-3 px-3 text-slate-700">{r.activityType}</td>
                <td className="py-3 px-3">
                  <Badge status={r.status} />
                </td>
                <td className="py-3 px-3">
                  {r.actionHref ? (
                    <Link
                      href={r.actionHref}
                      className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
                    >
                      {r.actionLabel}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-slate-200 bg-slate-50 text-slate-400 font-bold cursor-not-allowed"
                    >
                      {r.actionLabel}
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

