"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Card from "./Card";
import { formatNumber } from "@/lib/utils/numberFormat";
import type { SVGProps } from "react";
import {
  IconActivity,
  IconAward,
  IconBookOpen,
  IconBuilding,
  IconCalendar,
  IconFileText,
  IconTrendingUp,
  IconUsers,
  IconX,
} from "./icons";

type SystemSummary = {
  research: {
    total: number;
    planned: number;
    completed: number;
    published: number;
    notCompleted: number;
    global: number;
    local: number;
    single: number;
    thomsonReuters: number;
    scopus: number;
  };
  activities: {
    conferences: number;
    seminars: number;
    courses: number;
    workshops: number;
    assignments: number;
    thankYouBooks: number;
    committees: number;
    participationCertificates: number;
    journalMemberships: number;
    supervision: number;
    positions: number;
    scientificEvaluations: number;
    volunteerWork: number;
  };
};

type TabKey = "research" | "activities";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-extrabold text-slate-800">
      {children}
    </span>
  );
}

type Accent = "blue" | "emerald" | "violet" | "amber" | "teal" | "rose";
type IconType = (props: SVGProps<SVGSVGElement>) => React.ReactNode;

function StatItem({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: IconType;
  accent: Accent;
}) {
  const accents: Record<
    Accent,
    { stripe: string; icon: string }
  > = {
    blue: { stripe: "border-r-blue-200", icon: "bg-blue-50 text-blue-700" },
    emerald: {
      stripe: "border-r-emerald-200",
      icon: "bg-emerald-50 text-emerald-700",
    },
    violet: {
      stripe: "border-r-violet-200",
      icon: "bg-violet-50 text-violet-700",
    },
    amber: { stripe: "border-r-amber-200", icon: "bg-amber-50 text-amber-700" },
    teal: { stripe: "border-r-teal-200", icon: "bg-teal-50 text-teal-700" },
    rose: { stripe: "border-r-rose-200", icon: "bg-rose-50 text-rose-700" },
  };

  return (
    <div
      className={[
        // slim row
        "h-10 rounded-xl border border-slate-200/80 bg-white",
        "border-r-4",
        accents[accent].stripe,
        "px-2.5",
        "flex items-center justify-between gap-2",
      ].join(" ")}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span
          className={[
            "inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200/60",
            accents[accent].icon,
          ].join(" ")}
        >
          <span className="opacity-90">
            <Icon width={14} height={14} />
          </span>
        </span>
        <div className="text-sm font-bold text-slate-700 truncate">{label}</div>
      </div>
      <Pill>{formatNumber(value)}</Pill>
    </div>
  );
}

function GridSkeleton() {
  const items = Array.from({ length: 9 });
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
      {items.map((_, i) => (
        <div
          key={i}
          className="h-10 rounded-xl border border-slate-200 bg-white px-2.5 animate-pulse"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0 w-full">
              <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200/60" />
              <div className="h-4 w-2/3 bg-slate-200 rounded" />
            </div>
            <div className="h-5 w-11 bg-slate-50 border border-slate-200 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SystemStatsSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("research");
  const [summary, setSummary] = useState<SystemSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const sectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/admin/stats/system-summary", {
          headers: { Accept: "application/json" },
        });
        const json = (await res.json()) as { ok: boolean; summary: SystemSummary };
        if (!mounted) return;
        setSummary(json?.summary ?? null);
      } catch {
        if (!mounted) return;
        setSummary(null);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const researchItems = useMemo(() => {
    const s = summary?.research;
    return [
      { label: "إجمالي البحوث", value: s?.total ?? 0, icon: IconBookOpen },
      { label: "البحوث المخططة", value: s?.planned ?? 0, icon: IconCalendar },
      { label: "البحوث المنجزة", value: s?.completed ?? 0, icon: IconTrendingUp },
      { label: "البحوث المنشورة", value: s?.published ?? 0, icon: IconFileText },
      { label: "البحوث غير المنجزة", value: s?.notCompleted ?? 0, icon: IconX },
      { label: "البحوث العالمية", value: s?.global ?? 0, icon: IconActivity },
      { label: "البحوث المحلية", value: s?.local ?? 0, icon: IconBuilding },
      { label: "البحوث المفردة", value: s?.single ?? 0, icon: IconUsers },
      { label: "ثومبسون رويتر", value: s?.thomsonReuters ?? 0, icon: IconAward },
      { label: "سكوبس", value: s?.scopus ?? 0, icon: IconAward },
    ] as const;
  }, [summary]);

  const activityItems = useMemo(() => {
    const s = summary?.activities;
    return [
      { label: "المؤتمرات", value: s?.conferences ?? 0, icon: IconCalendar },
      { label: "الندوات", value: s?.seminars ?? 0, icon: IconBookOpen },
      { label: "الدورات", value: s?.courses ?? 0, icon: IconBookOpen },
      { label: "ورش العمل", value: s?.workshops ?? 0, icon: IconActivity },
      { label: "التكليفات", value: s?.assignments ?? 0, icon: IconFileText },
      { label: "كتب الشكر", value: s?.thankYouBooks ?? 0, icon: IconAward },
      { label: "اللجان", value: s?.committees ?? 0, icon: IconUsers },
      {
        label: "شهادات المشاركة",
        value: s?.participationCertificates ?? 0,
        icon: IconAward,
      },
      { label: "إدارة المجلات", value: s?.journalMemberships ?? 0, icon: IconFileText },
      { label: "الإشراف على الطلبة", value: s?.supervision ?? 0, icon: IconUsers },
      { label: "المناصب", value: s?.positions ?? 0, icon: IconBuilding },
      {
        label: "التقويم العلمي",
        value: s?.scientificEvaluations ?? 0,
        icon: IconTrendingUp,
      },
      { label: "الأعمال الطوعية", value: s?.volunteerWork ?? 0, icon: IconActivity },
    ] as const;
  }, [summary]);

  async function exportCsv() {
    const res = await fetch("/api/admin/stats/system-summary?format=csv", {
      headers: { Accept: "text/csv" },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system_summary_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    if (!sectionRef.current) return;
    const canvas = await html2canvas(sectionRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "pt", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const margin = 24;
    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let y = margin;
    let remaining = imgHeight;
    let sourceY = 0;

    while (remaining > 0) {
      const sliceHeight = Math.min(remaining, pageHeight - margin * 2);
      // قصّ الصورة لصفحة واحدة
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = Math.floor((sliceHeight * canvas.width) / imgWidth);
      const ctx = pageCanvas.getContext("2d");
      if (!ctx) break;
      ctx.drawImage(
        canvas,
        0,
        Math.floor((sourceY * canvas.width) / imgWidth),
        canvas.width,
        pageCanvas.height,
        0,
        0,
        canvas.width,
        pageCanvas.height
      );
      const pageImg = pageCanvas.toDataURL("image/png");
      pdf.addImage(pageImg, "PNG", margin, y, imgWidth, sliceHeight);

      remaining -= sliceHeight;
      sourceY += sliceHeight;
      if (remaining > 0) pdf.addPage();
    }

    pdf.save(`system_summary_${new Date().toISOString().slice(0, 10)}.pdf`);
  }

  const items =
    activeTab === "research" ? researchItems : activityItems;
  const accentCycle: Array<
    Accent
  > = ["blue", "emerald", "violet", "amber", "teal", "rose"];

  return (
    <section>
      <Card className="p-5 md:p-6" ref={sectionRef as any}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-slate-900">
              الإحصائيات العامة للنظام
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              ملخص سريع بإجماليات البحوث والنشاطات (بيانات حقيقية من قاعدة
              البيانات).
            </p>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setExportOpen((v) => !v)}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-xs font-extrabold text-slate-800"
            >
              Export summary
            </button>
            {exportOpen ? (
              <div className="absolute left-0 mt-2 w-44">
                <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.10)] p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportCsv();
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-50 text-sm font-bold"
                  >
                    تصدير CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setExportOpen(false);
                      exportPdf();
                    }}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-50 text-sm font-bold"
                  >
                    تصدير PDF
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("research")}
            className={[
              "px-4 py-2 rounded-xl text-sm font-extrabold border",
              activeTab === "research"
                ? "bg-blue-50 border-blue-100 text-blue-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            البحوث
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("activities")}
            className={[
              "px-4 py-2 rounded-xl text-sm font-extrabold border",
              activeTab === "activities"
                ? "bg-blue-50 border-blue-100 text-blue-700"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50",
            ].join(" ")}
          >
            النشاطات
          </button>
        </div>

        {/* Content */}
        <div className="mt-4">
          {loading ? (
            <GridSkeleton />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 md:gap-2">
              {items.map((it, idx) => (
                <StatItem
                  key={it.label}
                  label={it.label}
                  value={it.value}
                  icon={it.icon}
                  accent={accentCycle[idx % accentCycle.length]}
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

