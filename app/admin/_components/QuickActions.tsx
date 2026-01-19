"use client";

import type { QuickActionItem } from "../dummyData";
import Card from "./Card";

export default function QuickActions({ items }: { items: QuickActionItem[] }) {
  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base md:text-lg font-extrabold text-slate-900">
            إجراءات سريعة
          </h3>
          <p className="text-sm text-slate-600 mt-1">
            اختصارات لإدارة الباحثين، النشر، والتدقيق.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {items.map((a) => {
          const isPrimary = a.variant === "primary";
          return (
            <button
              key={a.key}
              type="button"
              className={[
                "w-full text-right",
                "rounded-2xl px-4 py-3",
                "border",
                "transition-colors",
                isPrimary
                  ? "bg-blue-600 border-blue-700 text-white hover:bg-blue-700"
                  : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50",
              ].join(" ")}
            >
              <div className="font-extrabold">{a.label}</div>
              <div
                className={[
                  "text-xs mt-1",
                  isPrimary ? "text-blue-50/90" : "text-slate-500",
                ].join(" ")}
              >
                {a.hint}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500 leading-relaxed">
        ملاحظة: هذه الأزرار جاهزة للربط لاحقاً مع الصفحات/النماذج وقاعدة
        البيانات.
      </div>
    </Card>
  );
}

