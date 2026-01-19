import type {
  RecentUpdateRow,
  ReviewStatus,
  PublicationQuartile,
} from "./models";

export type TrendDirection = "up" | "down";

export interface KPIItem {
  key: string;
  title: string;
  value: string;
  subtitle: string;
  meta?: Array<{ label: string; value: string }>;
  trendDirection: TrendDirection;
  trendLabel: string;
  spark?: number[];
  iconKey:
    | "researchers"
    | "publications"
    | "scopus"
    | "points"
    | "conferences"
    | "completeness";
}

export interface DonutItem {
  label: PublicationQuartile;
  value: number;
  color: string;
}

export interface BarItem {
  label: string;
  value: number;
  color?: string;
  href?: string;
  meta?: Array<{ label: string; value: number }>;
}

export interface StackedSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

export interface LeaderboardItem {
  id: string;
  name: string;
  department: string;
  points: number;
  rank: number;
  href?: string;
  subtitle?: string;
  subtitle2?: string;
}

export interface QuickActionItem {
  key: string;
  label: string;
  hint: string;
  variant: "primary" | "secondary";
}

function statusToLabel(status: ReviewStatus) {
  return status;
}

export function dashboardDummyData() {
  const kpis: KPIItem[] = [
    {
      key: "researchers",
      title: "إجمالي الباحثين",
      value: "248",
      subtitle: "نشطون هذا الفصل",
      trendDirection: "up",
      trendLabel: "+8.4% مقارنة بالشهر الماضي",
      spark: [18, 22, 21, 26, 24, 28, 31, 29, 33, 35, 36, 38],
      iconKey: "researchers",
    },
    {
      key: "publications",
      title: "البحوث المنشورة",
      value: "612",
      subtitle: "إجمالي السنة الحالية",
      trendDirection: "up",
      trendLabel: "+12.1% نمو سنوي",
      spark: [30, 28, 32, 34, 36, 40, 42, 41, 45, 48, 50, 54],
      iconKey: "publications",
    },
    {
      key: "scopus",
      title: "بحوث ضمن Scopus",
      value: "184",
      subtitle: "من إجمالي المنشور",
      trendDirection: "up",
      trendLabel: "+5.2% هذا الربع",
      spark: [10, 12, 11, 13, 14, 15, 16, 16, 17, 18, 18, 19],
      iconKey: "scopus",
    },
    {
      key: "avgPoints",
      title: "متوسط النقاط العلمية",
      value: "71.6",
      subtitle: "نقاط الأداء العلمي",
      trendDirection: "down",
      trendLabel: "-1.3% تراجع طفيف",
      spark: [76, 75, 74, 74, 73, 72, 72, 71, 71, 71, 72, 72],
      iconKey: "points",
    },
    {
      key: "conferences",
      title: "المؤتمرات",
      value: "23",
      subtitle: "داخلية وخارجية",
      trendDirection: "up",
      trendLabel: "+3 مؤتمرات جديدة",
      spark: [1, 1, 2, 2, 3, 4, 6, 8, 11, 14, 18, 23],
      iconKey: "conferences",
    },
    {
      key: "completeness",
      title: "نسبة اكتمال الملفات",
      value: "82%",
      subtitle: "متوسط اكتمال ملفات الباحثين",
      trendDirection: "up",
      trendLabel: "+4% تحسن هذا الشهر",
      spark: [70, 71, 72, 73, 75, 76, 78, 79, 80, 81, 81, 82],
      iconKey: "completeness",
    },
  ];

  const publications12m = {
    labels: [
      "شباط",
      "آذار",
      "نيسان",
      "أيار",
      "حزيران",
      "تموز",
      "آب",
      "أيلول",
      "تشرين1",
      "تشرين2",
      "كانون1",
      "كانون2",
    ],
    values: [22, 18, 24, 27, 25, 31, 34, 29, 38, 41, 45, 48],
  };

  const publicationsByQuartile: DonutItem[] = [
    { label: "Q1", value: 72, color: "#2563eb" },
    { label: "Q2", value: 54, color: "#06b6d4" },
    { label: "Q3", value: 31, color: "#22c55e" },
    { label: "Q4", value: 19, color: "#f59e0b" },
    { label: "غير مفهرس", value: 24, color: "#94a3b8" },
  ];

  const topDepartmentsByPoints: BarItem[] = [
    { label: "علوم الحاسوب", value: 1280, color: "#2563eb" },
    { label: "تقنيات المختبرات", value: 1120, color: "#06b6d4" },
    { label: "إدارة الأعمال", value: 980, color: "#22c55e" },
    { label: "الهندسة", value: 910, color: "#f59e0b" },
    { label: "التمريض", value: 860, color: "#a855f7" },
  ];

  const activities6m = {
    labels: ["آب", "أيلول", "تشرين1", "تشرين2", "كانون1", "كانون2"],
    series: [
      {
        key: "courses",
        label: "دورات",
        color: "#2563eb",
        values: [6, 7, 9, 8, 10, 12],
      },
      {
        key: "workshops",
        label: "ورش",
        color: "#06b6d4",
        values: [4, 5, 6, 5, 7, 7],
      },
      {
        key: "seminars",
        label: "ندوات",
        color: "#22c55e",
        values: [3, 4, 4, 6, 5, 6],
      },
      {
        key: "committees",
        label: "لجان",
        color: "#f59e0b",
        values: [2, 2, 3, 3, 4, 4],
      },
    ] satisfies StackedSeries[],
  };

  const topResearchers: LeaderboardItem[] = [
    { id: "r1", name: "د. سارة عبد الرحمن", department: "علوم الحاسوب", points: 312, rank: 1 },
    { id: "r2", name: "م. أحمد يوسف", department: "الهندسة", points: 296, rank: 2 },
    { id: "r3", name: "د. مريم علي", department: "تقنيات المختبرات", points: 284, rank: 3 },
    { id: "r4", name: "د. حسين كريم", department: "إدارة الأعمال", points: 271, rank: 4 },
    { id: "r5", name: "م. نور حيدر", department: "التمريض", points: 259, rank: 5 },
  ];

  const mostActiveDepartments: LeaderboardItem[] = [
    { id: "d1", name: "علوم الحاسوب", department: "كلية الشرق", points: 1280, rank: 1 },
    { id: "d2", name: "تقنيات المختبرات", department: "كلية الشرق", points: 1120, rank: 2 },
    { id: "d3", name: "إدارة الأعمال", department: "كلية الشرق", points: 980, rank: 3 },
    { id: "d4", name: "الهندسة", department: "كلية الشرق", points: 910, rank: 4 },
    { id: "d5", name: "التمريض", department: "كلية الشرق", points: 860, rank: 5 },
  ];

  const recentUpdates: RecentUpdateRow[] = [
    {
      id: "u1",
      date: "2026-01-16",
      actorName: "د. سارة عبد الرحمن",
      actorType: "باحث",
      activityType: "إضافة بحث منشور",
      status: statusToLabel("مكتمل"),
      actionLabel: "عرض",
    },
    {
      id: "u2",
      date: "2026-01-15",
      actorName: "قسم علوم الحاسوب",
      actorType: "قسم",
      activityType: "رفع تقرير شهري",
      status: statusToLabel("بانتظار التدقيق"),
      actionLabel: "مراجعة",
    },
    {
      id: "u3",
      date: "2026-01-14",
      actorName: "م. أحمد يوسف",
      actorType: "باحث",
      activityType: "تحديث ملف باحث",
      status: statusToLabel("مكتمل"),
      actionLabel: "عرض",
    },
    {
      id: "u4",
      date: "2026-01-13",
      actorName: "قسم الهندسة",
      actorType: "قسم",
      activityType: "إضافة ورشة عمل",
      status: statusToLabel("بانتظار التدقيق"),
      actionLabel: "مراجعة",
    },
    {
      id: "u5",
      date: "2026-01-12",
      actorName: "د. مريم علي",
      actorType: "باحث",
      activityType: "طلب اعتماد نقاط أداء علمي",
      status: statusToLabel("مرفوض/ناقص"),
      actionLabel: "تفاصيل",
    },
  ];

  const quickActions: QuickActionItem[] = [
    { key: "addResearcher", label: "إضافة باحث", hint: "إنشاء ملف باحث جديد", variant: "primary" },
    { key: "addPublication", label: "إضافة بحث", hint: "تسجيل نشر علمي جديد", variant: "secondary" },
    { key: "addActivity", label: "إضافة مؤتمر/نشاط", hint: "مؤتمر أو نشاط علمي", variant: "secondary" },
    { key: "reviewRequests", label: "مراجعة طلبات التدقيق", hint: "طلبات بانتظار الموافقة", variant: "primary" },
    { key: "exportReport", label: "تصدير تقرير (PDF/Excel)", hint: "تصدير سريع للتقارير", variant: "secondary" },
  ];

  return {
    kpis,
    publications12m,
    publicationsByQuartile,
    topDepartmentsByPoints,
    activities6m,
    topResearchers,
    mostActiveDepartments,
    recentUpdates,
    quickActions,
  };
}

