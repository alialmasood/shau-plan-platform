"use client";

import Link from "next/link";
import Card from "./Card";
import { IconBuilding } from "./icons";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";
import { formatNumber } from "@/lib/utils/numberFormat";

export type DepartmentCardItem = {
  id: number;
  code: string;
  nameAr: string;
  nameEn?: string;
  researchersCount?: number;
};

const PALETTES = [
  {
    stripe: "bg-blue-200/60",
    iconBg: "bg-blue-50 text-blue-700",
    badge: "bg-blue-50 border-blue-100 text-blue-700",
    hover: "hover:bg-blue-50/30",
  },
  {
    stripe: "bg-emerald-200/60",
    iconBg: "bg-emerald-50 text-emerald-700",
    badge: "bg-emerald-50 border-emerald-100 text-emerald-700",
    hover: "hover:bg-emerald-50/30",
  },
  {
    stripe: "bg-violet-200/60",
    iconBg: "bg-violet-50 text-violet-700",
    badge: "bg-violet-50 border-violet-100 text-violet-700",
    hover: "hover:bg-violet-50/30",
  },
  {
    stripe: "bg-amber-200/60",
    iconBg: "bg-amber-50 text-amber-700",
    badge: "bg-amber-50 border-amber-100 text-amber-700",
    hover: "hover:bg-amber-50/30",
  },
  {
    stripe: "bg-teal-200/60",
    iconBg: "bg-teal-50 text-teal-700",
    badge: "bg-teal-50 border-teal-100 text-teal-700",
    hover: "hover:bg-teal-50/30",
  },
  {
    stripe: "bg-rose-200/60",
    iconBg: "bg-rose-50 text-rose-700",
    badge: "bg-rose-50 border-rose-100 text-rose-700",
    hover: "hover:bg-rose-50/30",
  },
] as const;

export default function DepartmentCard({
  item,
  accentIndex,
  maxCount,
}: {
  item: DepartmentCardItem;
  accentIndex: number;
  maxCount: number;
}) {
  const palette = PALETTES[accentIndex % PALETTES.length];
  const count = typeof item.researchersCount === "number" ? item.researchersCount : 0;
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const isHigh = ratio >= 0.8;
  const isMid = ratio >= 0.5 && ratio < 0.8;
  const englishName =
    item.nameEn && item.nameEn.trim().length > 0
      ? item.nameEn.trim()
      : formatEnglishDepartmentName(item.code);

  return (
    <Link
      href={`/admin/departments/${item.id}`}
      className="block cursor-pointer"
      title={`${item.nameAr} (${item.code})`}
    >
      <Card
        className={[
          "relative overflow-hidden",
          // تقليل الكثافة بشكل بسيط (padding رأسي أقل ~10-15%)
          "px-3 py-2.5 h-[84px]",
          palette.hover,
          // hover subtle + consistent click affordance
          "transition-all duration-200",
          "hover:border-slate-300 hover:shadow-sm",
          isHigh
            ? "ring-1 ring-slate-200 border-slate-300"
            : isMid
              ? "border-slate-200"
              : "border-slate-200/70",
        ].join(" ")}
      >
        <div className={["absolute inset-x-0 top-0 h-1", palette.stripe].join(" ")} />

        <div className="h-full flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate leading-5">
                <span title={item.nameAr}>{item.nameAr}</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                {englishName || item.code}
              </div>
            </div>

            <span
              className={[
                "inline-flex items-center justify-center h-9 w-9 rounded-2xl",
                palette.iconBg,
              ].join(" ")}
              aria-hidden="true"
            >
              <IconBuilding />
            </span>
          </div>

          {typeof item.researchersCount === "number" ? (
            <div className="flex items-center justify-between gap-3 mt-1.5">
              <span className="text-[11px] text-slate-500">عدد الباحثين</span>
              <span
                className={[
                  // إبراز العدد بشكل مهني (badge محايد بدل ألوان قوية)
                  "inline-flex items-center justify-center px-2.5 py-0.5 rounded-full border",
                  "text-xs font-extrabold text-slate-900",
                  "bg-slate-50 border-slate-200",
                ].join(" ")}
              >
                {formatNumber(item.researchersCount)}
              </span>
            </div>
          ) : null}
        </div>
      </Card>
    </Link>
  );
}

