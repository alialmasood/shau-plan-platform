"use client";

import React from "react";

type Props = {
  collegeRank: number | null;
  departmentRank: number | null;
  points: number | null;
};

function Item({ label, value }: { label: string; value: number | null }) {
  const text = value === null || Number.isNaN(value) ? "..." : String(value);
  return (
    <div className="w-full flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0">
      <span className="text-[11px] leading-4 text-slate-500 font-bold truncate">{label}</span>
      <span className="text-[15px] leading-5 text-slate-900 font-extrabold">{text}</span>
    </div>
  );
}

export default function MobileRankBar({ collegeRank, departmentRank, points }: Props) {
  return (
    <div className="hidden max-[639px]:block px-4 pb-1.5" dir="rtl">
      <div className="h-10 flex items-center overflow-hidden">
        <div className="w-full flex items-center">
          <div className="flex-1 min-w-0">
            <Item label="ترتيبه بالكلية" value={collegeRank} />
          </div>
          <span className="w-px h-5 bg-slate-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <Item label="ترتيبه بالقسم" value={departmentRank} />
          </div>
          <span className="w-px h-5 bg-slate-200 shrink-0" />
          <div className="flex-1 min-w-0">
            <Item label="نقاطه" value={points} />
          </div>
        </div>
      </div>
    </div>
  );
}

