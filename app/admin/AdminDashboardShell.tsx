"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "./_components/Sidebar";
import Topbar from "./_components/Topbar";
import StatCard from "./_components/StatCard";
import ChartCard from "./_components/ChartCard";
import DepartmentsSection from "./_components/DepartmentsSection";
import LineChart from "./_components/charts/LineChart";
import DonutChart from "./_components/charts/DonutChart";
import BarChart from "./_components/charts/BarChart";
import StackedBars from "./_components/charts/StackedBars";
import LeaderboardList from "./_components/LeaderboardList";
import RecentUpdatesTable from "./_components/RecentUpdatesTable";
import QuickActions from "./_components/QuickActions";
import SystemStatsSection from "./_components/SystemStatsSection";
import ResearchMonthlyLineChart from "./_components/ResearchMonthlyLineChart";
import ActivitiesMonthlyStackedChart from "./_components/ActivitiesMonthlyStackedChart";
import RecentUpdatesDynamic from "./_components/RecentUpdatesDynamic";
import { dashboardDummyData } from "./dummyData";
import { formatDecimal, formatNumber } from "@/lib/utils/numberFormat";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";

export default function AdminDashboardShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [researchersCount, setResearchersCount] = useState<number | null>(null);
  const [publishedResearchCount, setPublishedResearchCount] = useState<number | null>(
    null
  );
  const [scopusResearchCount, setScopusResearchCount] = useState<number | null>(
    null
  );
  const [conferencesCount, setConferencesCount] = useState<number | null>(null);
  const [avgPoints, setAvgPoints] = useState<number | null>(null);
  const [maxPoints, setMaxPoints] = useState<number | null>(null);
  const [avgPointsUsersCount, setAvgPointsUsersCount] = useState<number | null>(null);
  const [quartiles, setQuartiles] = useState<{
    total: number;
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    unindexed: number;
  } | null>(null);
  const [topDepartments, setTopDepartments] = useState<
    Array<{
      id: number;
      code: string;
      nameAr: string;
      researchersCount: number;
      totalPoints: number;
      avgPoints: number;
    }> | null
  >(null);
  const [topResearchers, setTopResearchers] = useState<
    Array<{
      userId: number;
      fullName: string;
      departmentCode: string | null;
      departmentId: number | null;
      departmentNameAr: string | null;
      points: number;
    }> | null
  >(null);

  const baseData = useMemo(() => dashboardDummyData(), []);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [
          rResearchers,
          rPublished,
          rScopus,
          rConferences,
          rAvgPoints,
          rQuartiles,
          rTopDepartments,
          rTopResearchers,
        ] = await Promise.all([
          fetch("/api/admin/stats/researchers-count", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/published-research-count", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/scopus-research-count", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/conferences-count", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/avg-scientific-points", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/research-quartiles", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/top-departments-by-points", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
          fetch("/api/admin/stats/top-researchers-by-points", {
            method: "GET",
            headers: { Accept: "application/json" },
          }),
        ]);

        const j1 = (await rResearchers.json()) as { ok: boolean; count: number };
        const j2 = (await rPublished.json()) as { ok: boolean; count: number };
        const j3 = (await rScopus.json()) as { ok: boolean; count: number };
        const j4 = (await rConferences.json()) as { ok: boolean; count: number };
        const j5 = (await rAvgPoints.json()) as {
          ok: boolean;
          average: number;
          max: number;
          researchersCount: number;
        };
        const j6 = (await rQuartiles.json()) as {
          ok: boolean;
          total: number;
          q1: number;
          q2: number;
          q3: number;
          q4: number;
          unindexed: number;
        };
        const j7 = (await rTopDepartments.json()) as {
          ok: boolean;
          items: Array<{
            id: number;
            code: string;
            nameAr: string;
            researchersCount: number;
            totalPoints: number;
            avgPoints: number;
          }>;
        };
        const j8 = (await rTopResearchers.json()) as {
          ok: boolean;
          items: Array<{
            userId: number;
            fullName: string;
            departmentCode: string | null;
            departmentId: number | null;
            departmentNameAr: string | null;
            points: number;
          }>;
        };
        if (!mounted) return;

        setResearchersCount(Number(j1.count ?? 0) || 0);
        setPublishedResearchCount(Number(j2.count ?? 0) || 0);
        setScopusResearchCount(Number(j3.count ?? 0) || 0);
        setConferencesCount(Number(j4.count ?? 0) || 0);
        setAvgPoints(Number(j5.average ?? 0) || 0);
        setMaxPoints(Number(j5.max ?? 0) || 0);
        setAvgPointsUsersCount(Number(j5.researchersCount ?? 0) || 0);
        setQuartiles({
          total: Number(j6.total ?? 0) || 0,
          q1: Number(j6.q1 ?? 0) || 0,
          q2: Number(j6.q2 ?? 0) || 0,
          q3: Number(j6.q3 ?? 0) || 0,
          q4: Number(j6.q4 ?? 0) || 0,
          unindexed: Number(j6.unindexed ?? 0) || 0,
        });
        setTopDepartments(Array.isArray(j7.items) ? j7.items : []);
        setTopResearchers(Array.isArray(j8.items) ? j8.items : []);
      } catch {
        if (!mounted) return;
        setResearchersCount(0);
        setPublishedResearchCount(0);
        setScopusResearchCount(0);
        setConferencesCount(0);
        setAvgPoints(0);
        setMaxPoints(0);
        setAvgPointsUsersCount(0);
        setQuartiles({ total: 0, q1: 0, q2: 0, q3: 0, q4: 0, unindexed: 0 });
        setTopDepartments([]);
        setTopResearchers([]);
      }
    }

    load();
    const interval = window.setInterval(load, 60_000); // تحديث خفيف كل دقيقة
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const data = useMemo(() => {
    const kpis = [...baseData.kpis];
    const idxResearchers = kpis.findIndex((k) => k.key === "researchers");
    if (idxResearchers >= 0) {
      kpis[idxResearchers] = {
        ...kpis[idxResearchers],
        value: researchersCount === null ? "…" : formatNumber(researchersCount),
        subtitle: "التدريسيون/الباحثون المسجلون (حقيقي)",
      };
    }

    const idxPublications = kpis.findIndex((k) => k.key === "publications");
    if (idxPublications >= 0) {
      kpis[idxPublications] = {
        ...kpis[idxPublications],
        value:
          publishedResearchCount === null
            ? "…"
            : formatNumber(publishedResearchCount),
        subtitle: "البحوث المنشورة (حقيقي)",
      };
    }

    const idxScopus = kpis.findIndex((k) => k.key === "scopus");
    if (idxScopus >= 0) {
      kpis[idxScopus] = {
        ...kpis[idxScopus],
        value: scopusResearchCount === null ? "…" : formatNumber(scopusResearchCount),
        subtitle: `إجمالي الباحثين: ${formatNumber(researchersCount ?? 0)}`,
      };
    }

    const idxConferences = kpis.findIndex((k) => k.key === "conferences");
    if (idxConferences >= 0) {
      kpis[idxConferences] = {
        ...kpis[idxConferences],
        title: "المؤتمرات",
        value: conferencesCount === null ? "…" : formatNumber(conferencesCount),
        subtitle: "إجمالي المؤتمرات المسجلة (حقيقي)",
      };
    }

    const idxAvgPoints = kpis.findIndex((k) => k.key === "avgPoints");
    if (idxAvgPoints >= 0) {
      kpis[idxAvgPoints] = {
        ...kpis[idxAvgPoints],
        value: avgPoints === null ? "…" : formatDecimal(avgPoints),
        subtitle: "متوسط حقيقي",
        meta: [
          { label: "أعلى نقاط باحث", value: formatNumber(maxPoints ?? 0) },
          { label: "عدد الباحثين المحتسبين", value: formatNumber(avgPointsUsersCount ?? 0) },
        ],
      };
    }
    const colors: Record<string, string> = {
      Q1: "#2563eb",
      Q2: "#06b6d4",
      Q3: "#22c55e",
      Q4: "#f59e0b",
      "غير مفهرس": "#94a3b8",
    };

    const publicationsByQuartile =
      quartiles === null
        ? baseData.publicationsByQuartile
        : ([
            { label: "Q1", value: quartiles.q1, color: colors.Q1 },
            { label: "Q2", value: quartiles.q2, color: colors.Q2 },
            { label: "Q3", value: quartiles.q3, color: colors.Q3 },
            { label: "Q4", value: quartiles.q4, color: colors.Q4 },
            { label: "غير مفهرس", value: quartiles.unindexed, color: colors["غير مفهرس"] },
          ] as typeof baseData.publicationsByQuartile);

    const topDepartmentsByPoints =
      topDepartments === null
        ? ([] as typeof baseData.topDepartmentsByPoints)
        : (topDepartments.map((d) => ({
            label: d.nameAr,
            value: Math.round(d.totalPoints),
            color: "#2563eb",
            href: `/admin/departments/${d.id}`,
            meta: [
              { label: "عدد الباحثين", value: d.researchersCount },
              { label: "متوسط النقاط لكل باحث", value: d.avgPoints },
            ],
          })) as typeof baseData.topDepartmentsByPoints);

    const mostActiveDepartments =
      topDepartments === null
        ? ([] as typeof baseData.mostActiveDepartments)
        : (topDepartments.map((d, idx) => ({
            id: String(d.id),
            name: d.nameAr,
            department: d.nameAr,
            points: Math.round(d.totalPoints),
            rank: idx + 1,
            href: `/admin/departments/${d.id}`,
            subtitle: formatEnglishDepartmentName(d.code) || d.code,
            subtitle2: `عدد الباحثين: ${formatNumber(d.researchersCount)} • متوسط النقاط: ${formatDecimal(
              d.avgPoints
            )}`,
          })) as typeof baseData.mostActiveDepartments);

    const topResearchersList =
      topResearchers === null
        ? ([] as typeof baseData.topResearchers)
        : (topResearchers.map((r, idx) => ({
            id: String(r.userId),
            name: r.fullName,
            department:
              r.departmentNameAr ||
              (r.departmentCode ? formatEnglishDepartmentName(r.departmentCode) : "—"),
            points: Math.round(r.points),
            rank: idx + 1,
            href: `/admin/researchers/${r.userId}`,
            subtitle:
              r.departmentNameAr ||
              (r.departmentCode ? formatEnglishDepartmentName(r.departmentCode) : "—"),
          })) as typeof baseData.topResearchers);

    return {
      ...baseData,
      kpis,
      publicationsByQuartile,
      topDepartmentsByPoints,
      mostActiveDepartments,
      topResearchers: topResearchersList,
    };
  }, [
    baseData,
    researchersCount,
    publishedResearchCount,
    scopusResearchCount,
    conferencesCount,
    avgPoints,
    maxPoints,
    avgPointsUsersCount,
    quartiles,
    topDepartments,
    topResearchers,
  ]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-50 text-slate-900 antialiased"
    >
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeKey="dashboard"
        />

        <div className="flex-1 min-w-0">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8 space-y-6">
            {/* Departments (Top) */}
            <DepartmentsSection />

            {/* KPI Cards */}
            <section>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-bold">
                    نظرة عامة على الأداء
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">
                    مؤشرات سريعة تشمل الباحثين، النشر، ونقاط الأداء العلمي.
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
                {data.kpis.map((kpi) => (
                  <StatCard key={kpi.key} item={kpi} />
                ))}
              </div>
            </section>

            {/* System summary stats (tabs) */}
            <SystemStatsSection />

            {/* Analytics Charts */}
            <section className="space-y-4">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <ChartCard
                  className="xl:col-span-2"
                  title="النشر العلمي خلال 12 شهر"
                  subtitle="عدد البحوث لكل شهر"
                >
                  <ResearchMonthlyLineChart />
                </ChartCard>

                <ChartCard
                  title="توزيع البحوث حسب التصنيف"
                  subtitle="Q1 / Q2 / Q3 / Q4 / غير مفهرس (إجمالي النظام)"
                >
                  <DonutChart items={data.publicationsByQuartile} />
                </ChartCard>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ChartCard
                  title="أفضل 5 أقسام حسب النقاط"
                  subtitle="نقاط الأداء العلمي على مستوى الأقسام"
                >
                  <BarChart items={data.topDepartmentsByPoints} />
                </ChartCard>

                <ChartCard
                  title="النشاطات العلمية"
                  subtitle="دورات / ورش / ندوات / لجان (إجمالي النظام)"
                >
                  <ActivitiesMonthlyStackedChart />
                </ChartCard>
              </div>
            </section>

            {/* Performance Panels + Actions */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <ChartCard
                className="xl:col-span-2"
                title="الأداء البحثي"
                subtitle="أفضل الباحثين والأقسام الأكثر نشاطاً"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LeaderboardList
                    title="أفضل 5 باحثين حسب النقاط"
                    items={data.topResearchers}
                    kind="researcher"
                    loading={topResearchers === null}
                  />
                  <LeaderboardList
                    title="الأقسام الأكثر نشاطاً"
                    items={data.mostActiveDepartments}
                    kind="department"
                    loading={topDepartments === null}
                  />
                </div>
              </ChartCard>

              <QuickActions items={data.quickActions} />
            </section>

            {/* Recent Updates */}
            <section>
              <ChartCard
                title="آخر التحديثات"
                subtitle="متابعة أحدث النشاطات والتغييرات مع حالة التدقيق"
              >
                <RecentUpdatesDynamic />
              </ChartCard>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}

