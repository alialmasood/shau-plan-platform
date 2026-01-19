"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Card from "./Card";
import DepartmentsGrid from "./DepartmentsGrid";
import DepartmentsGridSkeleton from "./DepartmentsGridSkeleton";
import type { DepartmentCardItem } from "./DepartmentCard";
import { formatNumber } from "@/lib/utils/numberFormat";

export default function DepartmentsSection() {
  const [departments, setDepartments] = useState<DepartmentCardItem[] | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [columns, setColumns] = useState(3);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setError(null);
        const res = await fetch("/api/departments", {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as {
          ok: boolean;
          items: DepartmentCardItem[];
        };
        if (!mounted) return;
        const items = Array.isArray(json.items) ? json.items : [];
        // ترتيب إداري: الأقسام التي لديها باحثون أولاً، ثم الأقسام بدون باحثين
        items.sort((a, b) => {
          const ca = typeof a.researchersCount === "number" ? a.researchersCount : 0;
          const cb = typeof b.researchersCount === "number" ? b.researchersCount : 0;
          const aHas = ca > 0 ? 1 : 0;
          const bHas = cb > 0 ? 1 : 0;
          if (bHas !== aHas) return bHas - aHas;
          if (cb !== ca) return cb - ca;
          return String(a.nameAr ?? "").localeCompare(String(b.nameAr ?? ""), "ar");
        });
        setDepartments(items);
      } catch {
        if (!mounted) return;
        setDepartments([]);
        setError("تعذر تحميل الأقسام من قاعدة البيانات.");
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const gap = 8; // يساوي تقريباً gap-2 (تقليل الفراغات قليلاً)
    const minCardWidth = 160; // مريح ويحقق كثافة أعلى
    const maxColumnsCap = 8;

    function compute(width: number) {
      const possible = Math.max(
        1,
        Math.min(
          maxColumnsCap,
          Math.floor((width + gap) / (minCardWidth + gap)) || 1
        )
      );

      // نختار الأعمدة اللازمة لعرض كل الأقسام ضمن 3 صفوف إن أمكن
      const count = departments?.length ?? 0;
      const desired = Math.max(1, Math.ceil(count / 3) || 1);
      const next = Math.min(desired, possible);
      setColumns(next);
    }

    compute(el.clientWidth);

    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect?.width ?? el.clientWidth;
      compute(w);
    });
    ro.observe(el);

    return () => ro.disconnect();
  }, [departments]);

  const maxCount = useMemo(() => {
    if (!departments || departments.length === 0) return 0;
    return Math.max(
      ...departments.map((d) => (typeof d.researchersCount === "number" ? d.researchersCount : 0)),
      0
    );
  }, [departments]);

  const { visibleItems, hiddenCount } = useMemo(() => {
    if (!departments) return { visibleItems: null as DepartmentCardItem[] | null, hiddenCount: 0 };
    const maxVisible = Math.max(1, columns) * 3;
    return {
      visibleItems: departments.slice(0, maxVisible),
      hiddenCount: Math.max(0, departments.length - maxVisible),
    };
  }, [departments, columns]);

  return (
    <section>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-bold">الأقسام العلمية</h2>
          <p className="text-sm text-slate-600 mt-1">
            عرض الأقسام الموجودة في النظام، مع إحصائية عدد الباحثين لكل قسم.
          </p>
        </div>
      </div>

      <div className="mt-3" ref={containerRef}>
        {departments === null ? (
          <DepartmentsGridSkeleton columns={columns} />
        ) : departments.length === 0 ? (
          <Card className="p-4 md:p-5">
            <div className="text-sm text-slate-900 font-extrabold">
              لا توجد أقسام لعرضها حالياً.
            </div>
            <div className="text-sm text-slate-600 mt-2">
              {error
                ? error
                : "تأكد من إعداد قاعدة البيانات وإدخال الأقسام في جدول departments."}
            </div>
          </Card>
        ) : (
          <>
            <DepartmentsGrid
              items={visibleItems ?? []}
              columns={columns}
              maxCount={maxCount}
            />
            {hiddenCount > 0 ? (
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  تم عرض {formatNumber(visibleItems?.length ?? 0)} من{" "}
                  {formatNumber(departments.length)} قسم
                </div>
                <Link
                  href="/admin/departments"
                  className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold text-slate-800"
                >
                  عرض المزيد
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

