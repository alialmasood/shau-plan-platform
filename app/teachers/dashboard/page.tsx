"use client";

import { useState, useEffect, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useLayout } from "../layout";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  BookOpen,
  Briefcase,
  CalendarCheck2,
  CalendarDays,
  ChevronLeft,
  CheckCircle,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Globe,
  HandHeart,
  Landmark,
  Presentation,
  Users,
} from "lucide-react";

// Get academic year based on current year
function getAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // If we're in the second half of the year (Aug-Dec), show next year
  // Otherwise show current year
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

// Get month name in Arabic
function getMonthName(monthValue: string): string {
  const monthNames: { [key: string]: string } = {
    "all": "جميع الأشهر",
    "1": "يناير",
    "2": "فبراير",
    "3": "مارس",
    "4": "أبريل",
    "5": "مايو",
    "6": "يونيو",
    "7": "يوليو",
    "8": "أغسطس",
    "9": "سبتمبر",
    "10": "أكتوبر",
    "11": "نوفمبر",
    "12": "ديسمبر"
  };
  return monthNames[monthValue] || "جميع الأشهر";
}

function DesktopCard({
  title,
  subtitle,
  right,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={["md:bg-white md:border md:border-slate-200/70 md:rounded-2xl md:shadow-sm", className].join(" ")}>
      <div className="hidden md:flex md:items-start md:justify-between md:gap-4 md:px-5 md:pt-5 md:pb-3 md:border-b md:border-slate-200/70" dir="rtl">
        <div className="min-w-0">
          <div className="text-base font-bold text-slate-900">{title}</div>
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
      <div className="md:px-5 md:pb-5 md:pt-4">{children}</div>
    </div>
  );
}

function DesktopChip({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "indigo" | "blue" | "emerald" | "amber";
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-200/60"
      : tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-200/60"
      : tone === "indigo"
      ? "bg-indigo-50 text-indigo-700 border-indigo-200/60"
      : "bg-slate-50 text-slate-700 border-slate-200/70";

  return (
    <span className={`inline-flex items-center h-7 px-2.5 rounded-full border text-[12px] font-bold ${cls}`}>
      {label}
    </span>
  );
}

function DesktopQuickLinkButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Link
      href={href}
      className={[
        "md:h-11 md:px-4 md:rounded-xl md:border md:border-slate-200 md:bg-white md:cursor-pointer md:shadow-[0_1px_0_rgba(15,23,42,0.03)]",
        "md:inline-flex md:items-center md:gap-2",
        "md:hover:bg-slate-50 md:hover:border-slate-300 md:hover:shadow-sm",
        "md:active:scale-[0.98]",
        "md:transition md:duration-150",
        "md:focus-visible:outline-none md:focus-visible:ring-2 md:focus-visible:ring-indigo-300",
      ].join(" ")}
      dir="rtl"
    >
      <span className="md:w-8 md:h-8 md:rounded-lg md:border md:border-slate-200 md:bg-white md:flex md:items-center md:justify-center md:shrink-0">
        <Icon className="md:w-4 md:h-4 text-slate-700" strokeWidth={2} />
      </span>
      <span className="md:text-[14px] md:font-semibold md:text-slate-900">{label}</span>
      <span className="md:ml-auto md:flex md:items-center md:justify-center md:shrink-0 text-slate-500">
        <ChevronLeft className="md:w-4 md:h-4" strokeWidth={2} />
      </span>
    </Link>
  );
}

function DesktopMiniTile({
  icon: Icon,
  label,
  value,
  category = "research",
}: {
  icon: LucideIcon;
  label: string;
  value: number | string;
  category?: "research" | "activity" | "publication" | "warning";
}) {
  const numeric = typeof value === "number" ? value : Number(String(value).trim());
  const isZero = Number.isFinite(numeric) ? numeric === 0 : String(value).trim() === "0";

  const palette =
    category === "activity"
      ? {
          iconText: "text-blue-700",
          iconBg: "bg-blue-50",
          iconBorder: "border-blue-200/60",
          tileBg: "bg-blue-50/30",
          rail: "border-r-blue-400/40",
        }
      : category === "publication"
      ? {
          iconText: "text-emerald-700",
          iconBg: "bg-emerald-50",
          iconBorder: "border-emerald-200/60",
          tileBg: "bg-emerald-50/30",
          rail: "border-r-emerald-400/40",
        }
      : category === "warning"
      ? {
          iconText: "text-amber-700",
          iconBg: "bg-amber-50",
          iconBorder: "border-amber-200/60",
          tileBg: "bg-amber-50/30",
          rail: "border-r-amber-400/40",
        }
      : {
          iconText: "text-indigo-700",
          iconBg: "bg-indigo-50",
          iconBorder: "border-indigo-200/60",
          tileBg: "bg-indigo-50/30",
          rail: "border-r-indigo-400/40",
        };

  return (
    <div
      dir="rtl"
      title={`${label}: ${value}`}
      className={[
        "md:p-3 md:rounded-xl md:border md:border-r-4 md:flex md:items-center md:gap-3 md:flex-row-reverse md:hover:shadow-sm md:hover:border-slate-300 md:transition",
        isZero
          ? "md:bg-white md:border-slate-200/70 md:border-dashed md:opacity-80 md:border-r-slate-200/70"
          : `md:border-slate-200/70 md:${palette.tileBg} md:${palette.rail}`,
      ].join(" ")}
    >
      <div
        className={[
          "md:w-[42px] md:h-[42px] md:rounded-full md:border md:flex md:items-center md:justify-center md:shrink-0",
          isZero ? "bg-slate-50 border-slate-200/70" : `${palette.iconBg} ${palette.iconBorder}`,
        ].join(" ")}
      >
        <Icon
          className={[
            "md:w-[22px] md:h-[22px]",
            isZero ? "text-slate-400" : palette.iconText,
          ].join(" ")}
          strokeWidth={2}
        />
      </div>
      <div className="min-w-0 flex-1 text-right">
        <div className="md:text-[12px] md:leading-4 md:font-semibold md:text-slate-500 overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical]">
          {label}
        </div>
        <div className={`md:mt-1 md:text-[18px] md:leading-5 md:font-extrabold ${isZero ? "text-slate-600" : "text-slate-900"}`}>
          {value}
        </div>
      </div>
    </div>
  );
}

function DesktopHeroKpiCard({
  title,
  value,
  helper,
  icon: Icon,
  accent = "indigo",
  badge,
}: {
  title: string;
  value: number | string;
  helper: string;
  icon: LucideIcon;
  accent?: "indigo" | "blue" | "emerald" | "amber";
  badge?: string;
}) {
  const accentLine =
    accent === "blue"
      ? "after:bg-gradient-to-r after:from-blue-500 after:to-cyan-500"
      : accent === "emerald"
      ? "after:bg-gradient-to-r after:from-emerald-500 after:to-teal-500"
      : accent === "amber"
      ? "after:bg-gradient-to-r after:from-amber-500 after:to-orange-500"
      : "after:bg-gradient-to-r after:from-indigo-500 after:to-violet-500";

  const iconBg =
    accent === "blue"
      ? "bg-blue-50 border-blue-200/60 text-blue-700"
      : accent === "emerald"
      ? "bg-emerald-50 border-emerald-200/60 text-emerald-700"
      : accent === "amber"
      ? "bg-amber-50 border-amber-200/60 text-amber-700"
      : "bg-indigo-50 border-indigo-200/60 text-indigo-700";

  return (
    <div
      dir="rtl"
      className={[
        "relative overflow-hidden md:bg-white md:border md:border-slate-200/70 md:rounded-2xl md:shadow-sm md:p-5 md:min-h-[140px]",
        "after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-[3px]",
        accentLine,
      ].join(" ")}
    >
      <div className="md:space-y-2">
        {/* top row: title (single line) + badge */}
        <div className="flex items-center justify-between gap-3" dir="ltr">
          <div dir="rtl" className="text-sm text-slate-600 font-bold truncate max-w-[70%]">
            {title}
          </div>
          <div className="shrink-0">
            {badge ? (
              <DesktopChip
                label={badge}
                tone={accent === "indigo" ? "indigo" : accent === "blue" ? "blue" : accent === "emerald" ? "emerald" : "amber"}
              />
            ) : null}
          </div>
        </div>

        {/* middle: value + icon (no absolute to avoid overlaps) */}
        <div className="flex items-end justify-between gap-4" dir="ltr">
          <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
          <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${iconBg}`}>
            <Icon className="w-5 h-5" strokeWidth={2} />
          </div>
        </div>

        {/* bottom: helper */}
        <div className="text-xs text-slate-500">{helper}</div>
      </div>
    </div>
  );
}

// تحويل تاريخ/سنة/شهر إلى "عام دراسي" بصيغة YYYY-YYYY (من أغسطس إلى يوليو)
function getAcademicYearFromDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = d.getMonth() + 1; // 1-12
  // Aug-Dec => y-(y+1) ، Jan-Jul => (y-1)-y
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

function toIntYear(v: unknown): number | null {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  return Number.isFinite(n) ? n : null;
}

function monthToNumber(month: unknown): number | null {
  if (month === null || month === undefined) return null;
  const s = String(month).trim().toLowerCase();
  if (!s) return null;
  // رقم مباشر
  const direct = parseInt(s, 10);
  if (Number.isFinite(direct) && direct >= 1 && direct <= 12) return direct;

  const map: Record<string, number> = {
    "يناير": 1,
    "فبراير": 2,
    "مارس": 3,
    "أبريل": 4,
    "ابريل": 4,
    "مايو": 5,
    "يونيو": 6,
    "يوليو": 7,
    "أغسطس": 8,
    "اغسطس": 8,
    "سبتمبر": 9,
    "أكتوبر": 10,
    "اكتوبر": 10,
    "نوفمبر": 11,
    "ديسمبر": 12,
    "january": 1,
    "february": 2,
    "march": 3,
    "april": 4,
    "may": 5,
    "june": 6,
    "july": 7,
    "august": 8,
    "september": 9,
    "october": 10,
    "november": 11,
    "december": 12,
  };
  return map[s] ?? null;
}

function getAcademicYearFromYearMonth(
  year: number | string | null | undefined,
  month: string | null | undefined
): string | null {
  const y = toIntYear(year);
  if (!y) return null;
  const m = monthToNumber(month);
  if (!m) {
    // إن لم تتوفر قيمة شهر، نعتبر السنة هي بداية العام الدراسي (أشمل وأقرب لفهم المستخدم)
    return `${y}-${y + 1}`;
  }
  return m >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

interface Position {
  id: number;
  position_title: string;
  start_date: string | null;
  duration: string | null;
  organization: string | null;
  description: string | null;
  created_at?: string;
}

interface Research {
  id: number;
  title: string;
  research_type: "planned" | "unplanned";
  author_type: "single" | "joint";
  is_completed: boolean;
  is_published?: boolean;
  year: number | string;
  publication_month?: string;
  classifications?: string[];
  created_at?: string;
}

interface Publication {
  id: number;
  title: string;
  publication_date: string | null;
  language: string;
  publication_type: string;
  created_at?: string;
}

interface Course {
  id: number;
  course_name: string;
  date: string | null;
  created_at?: string;
}

interface Seminar {
  id: number;
  title: string;
  date: string | null;
  created_at?: string;
}

interface Workshop {
  id: number;
  title: string;
  date: string | null;
  created_at?: string;
}

interface Conference {
  id: number;
  title: string;
  date: string | null;
  created_at?: string;
}

interface Committee {
  id: number;
  committee_name: string;
  assignment_date: string | null;
  created_at?: string;
}

interface ThankYouBook {
  id: number;
  granting_organization: string;
  month: string | null;
  year: number | string | null;
  created_at?: string;
}

interface Assignment {
  id: number;
  subject: string;
  assignment_date: string | null;
  created_at?: string;
}

interface ParticipationCertificate {
  id: number;
  certificate_subject: string;
  month: string | null;
  year: number | string | null;
  created_at?: string;
}

interface Supervision {
  id: number;
  student_name: string;
  start_date: string | null;
  created_at?: string;
}

interface ScientificEvaluation {
  id: number;
  title: string;
  evaluation_date: string | null;
  created_at?: string;
}

interface JournalMembership {
  id: number;
  journal_name: string;
  start_date: string | null;
  created_at?: string;
}

interface VolunteerWork {
  id: number;
  title: string;
  start_date: string | null;
  created_at?: string;
}

// Helper function to check if date is in academic year/month range
function isInDateRange(dateStr: string | null, academicYear: string, month: string): boolean {
  if (!dateStr) return false;
  
  const date = new Date(dateStr);
  const [yearStart] = academicYear.split("-");
  const yearStartNum = parseInt(yearStart);
  const yearEndNum = yearStartNum + 1;
  const dateYear = date.getFullYear();
  const dateMonth = date.getMonth(); // 0-indexed
  
  if (month === "all") {
    // Check if date is in academic year (Aug yearStart to Jul yearEnd)
    if (dateYear === yearStartNum) {
      return dateMonth >= 7; // Aug (7) to Dec (11)
    } else if (dateYear === yearEndNum) {
      return dateMonth < 7; // Jan (0) to Jul (6)
    }
    return false;
  } else {
    // Check specific month
    const monthNum = parseInt(month) - 1;
    if (monthNum >= 7) {
      return dateYear === yearStartNum && dateMonth === monthNum;
    } else {
      return dateYear === yearEndNum && dateMonth === monthNum;
    }
  }
}

// Helper function to check if year is in academic year range (for research.year)
function isYearInAcademicRange(year: number | string, academicYear: string): boolean {
  const yearNum = typeof year === "string" ? parseInt(year) : year;
  const [yearStart] = academicYear.split("-");
  const yearStartNum = parseInt(yearStart);
  const yearEndNum = yearStartNum + 1;
  
  // Check if research year matches the academic year
  return yearNum === yearStartNum || yearNum === yearEndNum;
}

// Helper function to check if month/year (from ThankYouBook, ParticipationCertificate) is in range
function isMonthYearInRange(month: string | null, year: number | string | null, academicYear: string, selectedMonth: string): boolean {
  if (selectedMonth === "all") {
    if (!year) return false;
    return isYearInAcademicRange(year, academicYear);
  } else {
    if (!month || !year) return false;
    const monthNum = parseInt(selectedMonth);
    const yearNum = typeof year === "string" ? parseInt(year) : year;
    const [yearStart] = academicYear.split("-");
    const yearStartNum = parseInt(yearStart);
    const yearEndNum = yearStartNum + 1;
    
    const monthNames: { [key: string]: number } = {
      "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "مايو": 5, "يونيو": 6,
      "يوليو": 7, "أغسطس": 8, "سبتمبر": 9, "أكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12
    };
    const itemMonthNum = monthNames[month] || 0;
    
    if (itemMonthNum >= 8) {
      return yearNum === yearStartNum && itemMonthNum === monthNum;
    } else {
      return yearNum === yearEndNum && itemMonthNum === monthNum;
    }
  }
}

export default function TeachersDashboardPage() {
  const { user } = useLayout();
  const [selectedYear, setSelectedYear] = useState(getAcademicYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [allYearsExpanded, setAllYearsExpanded] = useState(false);
  
  // Data states
  const [positions, setPositions] = useState<Position[]>([]);
  const [researchList, setResearchList] = useState<Research[]>([]);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [conferences, setConferences] = useState<Conference[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [thankYouBooks, setThankYouBooks] = useState<ThankYouBook[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [participationCertificates, setParticipationCertificates] = useState<ParticipationCertificate[]>([]);
  const [supervision, setSupervision] = useState<Supervision[]>([]);
  const [scientificEvaluations, setScientificEvaluations] = useState<ScientificEvaluation[]>([]);
  const [journalMemberships, setJournalMemberships] = useState<JournalMembership[]>([]);
  const [volunteerWork, setVolunteerWork] = useState<VolunteerWork[]>([]);

  // السنوات الدراسية المتاحة فعلياً (فقط السنوات التي يوجد بها أي نشاط/فعالية)
  const availableAcademicYears = useMemo(() => {
    const years = new Set<string>();

    const add = (y: string | null) => {
      if (y && /^\d{4}-\d{4}$/.test(y)) years.add(y);
    };

    // research: الأفضل الاعتماد على created_at إن وجد، وإلا year (+ publication_month إن وجد)
    researchList.forEach((r) => {
      add(getAcademicYearFromDate(r.created_at));
      if (!r.created_at) {
        add(getAcademicYearFromYearMonth(r.year, r.publication_month ?? null));
      }
    });

    // date-based tables (مع fallback لـ created_at إن وجد)
    positions.forEach((p) => add(getAcademicYearFromDate(p.start_date ?? p.created_at)));
    publications.forEach((p) => add(getAcademicYearFromDate(p.publication_date ?? p.created_at)));
    courses.forEach((c) => add(getAcademicYearFromDate(c.date ?? c.created_at)));
    seminars.forEach((s) => add(getAcademicYearFromDate(s.date ?? s.created_at)));
    workshops.forEach((w) => add(getAcademicYearFromDate(w.date ?? w.created_at)));
    conferences.forEach((c) => add(getAcademicYearFromDate(c.date ?? c.created_at)));
    committees.forEach((c) => add(getAcademicYearFromDate(c.assignment_date ?? c.created_at)));
    assignments.forEach((a) => add(getAcademicYearFromDate(a.assignment_date ?? a.created_at)));
    supervision.forEach((s) => add(getAcademicYearFromDate(s.start_date ?? s.created_at)));
    scientificEvaluations.forEach((s) => add(getAcademicYearFromDate(s.evaluation_date ?? s.created_at)));
    journalMemberships.forEach((j) => add(getAcademicYearFromDate(j.start_date ?? j.created_at)));
    volunteerWork.forEach((v) => add(getAcademicYearFromDate(v.start_date ?? v.created_at)));

    // month/year based tables
    thankYouBooks.forEach((t) => add(getAcademicYearFromYearMonth(t.year, t.month)));
    participationCertificates.forEach((p) => add(getAcademicYearFromYearMonth(p.year, p.month)));

    const sorted = Array.from(years).sort((a, b) => {
      const ay = parseInt(a.split("-")[0], 10);
      const by = parseInt(b.split("-")[0], 10);
      return by - ay;
    });

    return sorted;
  }, [
    positions,
    researchList,
    publications,
    courses,
    seminars,
    workshops,
    conferences,
    committees,
    thankYouBooks,
    assignments,
    participationCertificates,
    supervision,
    scientificEvaluations,
    journalMemberships,
    volunteerWork,
  ]);

  // إذا السنة الحالية غير موجودة ضمن السنوات التي تحتوي بيانات، نحول تلقائياً لأحدث سنة متاحة
  useEffect(() => {
    const options = availableAcademicYears.length > 0 ? availableAcademicYears : [getAcademicYear()];
    if (!options.includes(selectedYear)) {
      const next = options[0];
      const t = setTimeout(() => setSelectedYear(next), 0);
      return () => clearTimeout(t);
    }
  }, [availableAcademicYears, selectedYear]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      try {
        // Fetch all data in parallel using Promise.all
        const [
          positionsRes,
          researchRes,
          publicationsRes,
          coursesRes,
          seminarsRes,
          workshopsRes,
          conferencesRes,
          committeesRes,
          thankYouBooksRes,
          assignmentsRes,
          participationCertificatesRes,
          supervisionRes,
          scientificEvaluationsRes,
          journalMembershipsRes,
          volunteerWorkRes,
        ] = await Promise.all([
          fetch(`/api/teachers/positions?userId=${user.id}`),
          fetch(`/api/teachers/research?userId=${user.id}`),
          fetch(`/api/teachers/publications?userId=${user.id}`),
          fetch(`/api/teachers/courses?userId=${user.id}`),
          fetch(`/api/teachers/seminars?userId=${user.id}`),
          fetch(`/api/teachers/workshops?userId=${user.id}`),
          fetch(`/api/teachers/conferences?userId=${user.id}`),
          fetch(`/api/teachers/committees?userId=${user.id}`),
          fetch(`/api/teachers/thank-you-books?userId=${user.id}`),
          fetch(`/api/teachers/assignments?userId=${user.id}`),
          fetch(`/api/teachers/participation-certificates?userId=${user.id}`),
          fetch(`/api/teachers/supervision?userId=${user.id}`),
          fetch(`/api/teachers/scientific-evaluation?userId=${user.id}`),
          fetch(`/api/teachers/journals-management?userId=${user.id}`),
          fetch(`/api/teachers/volunteer-work?userId=${user.id}`),
        ]);

        if (positionsRes.ok) setPositions(await positionsRes.json());
        if (researchRes.ok) setResearchList(await researchRes.json());
        if (publicationsRes.ok) setPublications(await publicationsRes.json());
        if (coursesRes.ok) setCourses(await coursesRes.json());
        if (seminarsRes.ok) setSeminars(await seminarsRes.json());
        if (workshopsRes.ok) setWorkshops(await workshopsRes.json());
        if (conferencesRes.ok) setConferences(await conferencesRes.json());
        if (committeesRes.ok) setCommittees(await committeesRes.json());
        if (thankYouBooksRes.ok) setThankYouBooks(await thankYouBooksRes.json());
        if (assignmentsRes.ok) setAssignments(await assignmentsRes.json());
        if (participationCertificatesRes.ok) setParticipationCertificates(await participationCertificatesRes.json());
        if (supervisionRes.ok) setSupervision(await supervisionRes.json());
        if (scientificEvaluationsRes.ok) setScientificEvaluations(await scientificEvaluationsRes.json());
        if (journalMembershipsRes.ok) setJournalMemberships(await journalMembershipsRes.json());
        if (volunteerWorkRes.ok) setVolunteerWork(await volunteerWorkRes.json());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchAllData();
  }, [user]);

  // Calculate total counts
  const totalPositionsCount = useMemo(() => positions.length, [positions]);
  const totalResearchCount = useMemo(() => researchList.length, [researchList]);
  const totalPublicationsCount = useMemo(() => publications.length, [publications]);
  const totalCoursesCount = useMemo(() => courses.length, [courses]);
  const totalSeminarsCount = useMemo(() => seminars.length, [seminars]);
  const totalWorkshopsCount = useMemo(() => workshops.length, [workshops]);
  const totalConferencesCount = useMemo(() => conferences.length, [conferences]);
  const totalCommitteesCount = useMemo(() => committees.length, [committees]);
  const totalThankYouBooksCount = useMemo(() => thankYouBooks.length, [thankYouBooks]);
  const totalAssignmentsCount = useMemo(() => assignments.length, [assignments]);
  const totalParticipationCertificatesCount = useMemo(() => participationCertificates.length, [participationCertificates]);
  const totalSupervisionCount = useMemo(() => supervision.length, [supervision]);
  const totalScientificEvaluationsCount = useMemo(() => scientificEvaluations.length, [scientificEvaluations]);
  const totalJournalMembershipsCount = useMemo(() => journalMemberships.length, [journalMemberships]);
  const totalVolunteerWorkCount = useMemo(() => volunteerWork.length, [volunteerWork]);

  // Research detailed statistics
  const researchStats = useMemo(() => {
    const planned = researchList.filter(r => r.research_type === "planned").length;
    const completed = researchList.filter(r => r.is_completed).length;
    const published = researchList.filter(r => r.is_published).length;
    const uncompleted = researchList.filter(r => !r.is_completed).length;
    const international = researchList.filter(r => r.classifications?.includes("global")).length;
    const individual = researchList.filter(r => r.author_type === "single").length;
    const local = researchList.filter(r => r.classifications?.includes("local")).length;
    const thomsonReuters = researchList.filter(r => r.classifications?.includes("thomson_reuters")).length;
    const scopus = researchList.filter(r => r.classifications?.includes("scopus")).length;
    return { planned, completed, published, uncompleted, international, individual, local, thomsonReuters, scopus };
  }, [researchList]);

  // Research statistics by date
  const researchStatsByDate = useMemo(() => {
    const filtered = researchList.filter(r => isYearInAcademicRange(r.year, selectedYear));
    const planned = filtered.filter(r => r.research_type === "planned").length;
    const completed = filtered.filter(r => r.is_completed).length;
    const published = filtered.filter(r => r.is_published).length;
    const uncompleted = filtered.filter(r => !r.is_completed).length;
    return { total: filtered.length, planned, completed, published, uncompleted };
  }, [researchList, selectedYear]);

  // Calculate counts by date for all types
  const positionsCountByDate = useMemo(() => 
    positions.filter(p => isInDateRange(p.start_date, selectedYear, selectedMonth)).length,
    [positions, selectedYear, selectedMonth]
  );
  const conferencesCountByDate = useMemo(() => 
    conferences.filter(c => isInDateRange(c.date, selectedYear, selectedMonth)).length,
    [conferences, selectedYear, selectedMonth]
  );
  const seminarsCountByDate = useMemo(() => 
    seminars.filter(s => isInDateRange(s.date, selectedYear, selectedMonth)).length,
    [seminars, selectedYear, selectedMonth]
  );
  const coursesCountByDate = useMemo(() => 
    courses.filter(c => isInDateRange(c.date, selectedYear, selectedMonth)).length,
    [courses, selectedYear, selectedMonth]
  );
  const workshopsCountByDate = useMemo(() => 
    workshops.filter(w => isInDateRange(w.date, selectedYear, selectedMonth)).length,
    [workshops, selectedYear, selectedMonth]
  );
  const committeesCountByDate = useMemo(() => 
    committees.filter(c => isInDateRange(c.assignment_date, selectedYear, selectedMonth)).length,
    [committees, selectedYear, selectedMonth]
  );
  const thankYouBooksCountByDate = useMemo(() => 
    thankYouBooks.filter(t => isMonthYearInRange(t.month, t.year, selectedYear, selectedMonth)).length,
    [thankYouBooks, selectedYear, selectedMonth]
  );
  const assignmentsCountByDate = useMemo(() => 
    assignments.filter(a => isInDateRange(a.assignment_date, selectedYear, selectedMonth)).length,
    [assignments, selectedYear, selectedMonth]
  );
  const supervisionCountByDate = useMemo(() => 
    supervision.filter(s => isInDateRange(s.start_date, selectedYear, selectedMonth)).length,
    [supervision, selectedYear, selectedMonth]
  );
  const journalMembershipsCountByDate = useMemo(() => 
    journalMemberships.filter(j => isInDateRange(j.start_date, selectedYear, selectedMonth)).length,
    [journalMemberships, selectedYear, selectedMonth]
  );
  const scientificEvaluationsCountByDate = useMemo(() => 
    scientificEvaluations.filter(s => isInDateRange(s.evaluation_date, selectedYear, selectedMonth)).length,
    [scientificEvaluations, selectedYear, selectedMonth]
  );
  const volunteerWorkCountByDate = useMemo(() => 
    volunteerWork.filter(v => isInDateRange(v.start_date, selectedYear, selectedMonth)).length,
    [volunteerWork, selectedYear, selectedMonth]
  );

  // Desktop chart: تطور الإنجازات عبر السنوات (مشتق من نفس البيانات المحمّلة)
  const achievementsByAcademicYear = useMemo(() => {
    const map = new Map<string, number>();
    const inc = (y: string | null) => {
      if (!y) return;
      map.set(y, (map.get(y) || 0) + 1);
    };

    // Research
    researchList.forEach((r) => {
      inc(getAcademicYearFromDate(r.created_at));
      if (!r.created_at) inc(getAcademicYearFromYearMonth(r.year, r.publication_month ?? null));
    });

    // Date-based tables
    positions.forEach((p) => inc(getAcademicYearFromDate(p.start_date ?? p.created_at)));
    publications.forEach((p) => inc(getAcademicYearFromDate(p.publication_date ?? p.created_at)));
    courses.forEach((c) => inc(getAcademicYearFromDate(c.date ?? c.created_at)));
    seminars.forEach((s) => inc(getAcademicYearFromDate(s.date ?? s.created_at)));
    workshops.forEach((w) => inc(getAcademicYearFromDate(w.date ?? w.created_at)));
    conferences.forEach((c) => inc(getAcademicYearFromDate(c.date ?? c.created_at)));
    committees.forEach((c) => inc(getAcademicYearFromDate(c.assignment_date ?? c.created_at)));
    assignments.forEach((a) => inc(getAcademicYearFromDate(a.assignment_date ?? a.created_at)));
    supervision.forEach((s) => inc(getAcademicYearFromDate(s.start_date ?? s.created_at)));
    scientificEvaluations.forEach((s) => inc(getAcademicYearFromDate(s.evaluation_date ?? s.created_at)));
    journalMemberships.forEach((j) => inc(getAcademicYearFromDate(j.start_date ?? j.created_at)));
    volunteerWork.forEach((v) => inc(getAcademicYearFromDate(v.start_date ?? v.created_at)));

    // Month/year based tables
    thankYouBooks.forEach((t) => inc(getAcademicYearFromYearMonth(t.year, t.month)));
    participationCertificates.forEach((p) => inc(getAcademicYearFromYearMonth(p.year, p.month)));

    const rows = Array.from(map.entries())
      .map(([academicYear, total]) => ({
        academicYear,
        total,
        sortKey: parseInt(academicYear.split("-")[0] || "0", 10),
      }))
      .filter((r) => Number.isFinite(r.sortKey) && r.sortKey > 0)
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ academicYear, total }) => ({ academicYear, total }));

    // اعرض آخر 8 سنوات فقط لتجنب تزاحم المحور
    return rows.length > 8 ? rows.slice(rows.length - 8) : rows;
  }, [
    researchList,
    positions,
    publications,
    courses,
    seminars,
    workshops,
    conferences,
    committees,
    thankYouBooks,
    assignments,
    participationCertificates,
    supervision,
    scientificEvaluations,
    journalMemberships,
    volunteerWork,
  ]);

  if (!user) {
    return null;
  }

  const displayName = (user.full_name || user.username || "").trim();
  const todayLabel = new Date().toLocaleDateString("ar-IQ", { year: "numeric", month: "2-digit", day: "2-digit" });

  return (
    <div className="max-[639px]:space-y-4 max-[639px]:text-[14px] max-[639px]:leading-[1.55] md:flex-1 md:w-full md:px-6 lg:px-8 md:py-6 md:space-y-8 xl:max-w-[1600px] xl:mx-auto">
      {/* Desktop-only HERO HEADER (premium) */}
      <div className="hidden md:block">
        <div
          className={[
            "relative overflow-hidden md:rounded-2xl md:border md:border-slate-200/70 md:bg-white md:shadow-sm md:p-5",
            "before:content-[''] before:absolute before:-inset-24 before:bg-gradient-to-br before:from-indigo-100/60 before:via-white before:to-violet-100/60 before:blur-2xl",
          ].join(" ")}
        >
          <div className="relative md:flex md:items-start md:justify-between md:gap-6">
            <div dir="rtl" className="min-w-0">
              <div className="text-[12px] font-bold text-slate-500">مرحباً بعودتك</div>
              <div className="mt-2 text-[22px] font-extrabold text-slate-900 truncate">
                {displayName || "مستخدم"}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                لوحة تحكم مختصرة تساعدك على متابعة إنجازاتك بسرعة ووضوح.
              </div>

              {/* Quick links (NOT metrics) */}
              <div className="mt-4 hidden md:block" dir="rtl">
                <div className="md:mt-4 md:rounded-2xl md:border md:border-slate-200/70 md:bg-white/70 md:backdrop-blur md:p-4">
                  <div className="md:flex md:items-start md:justify-between md:gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900">روابط سريعة</div>
                      <div className="mt-1 text-xs text-slate-500">اختصارات للصفحات الأكثر استخداماً</div>
                    </div>
                    <span className="hidden lg:inline-flex items-center h-7 px-2.5 rounded-full border border-slate-200/70 bg-white text-[12px] font-bold text-slate-700">
                      اختصارات
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <DesktopQuickLinkButton href="/teachers/research" label="البحوث" icon={FileText} />
                    <DesktopQuickLinkButton href="/teachers/positions" label="المناصب" icon={Briefcase} />
                    <DesktopQuickLinkButton href="/teachers/evaluation" label="التقييم" icon={Award} />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 md:mt-0 shrink-0">
              <div className="flex items-center justify-end gap-2" dir="rtl">
                <DesktopChip label={`اليوم: ${todayLabel}`} tone="neutral" />
                <DesktopChip label={`العام: ${selectedYear}`} tone="indigo" />
                <DesktopChip label={selectedMonth === "all" ? "الشهر: الكل" : `الشهر: ${getMonthName(selectedMonth)}`} tone="blue" />
              </div>

              <div className="mt-3 flex items-center justify-end gap-2">
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200/70 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                >
                  {(availableAcademicYears.length > 0 ? availableAcademicYears : [getAcademicYear()]).map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="h-10 px-3 rounded-xl border border-slate-200/70 bg-white text-[13px] font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-300"
                >
                  <option value="all">جميع الأشهر</option>
                  <option value="1">يناير</option>
                  <option value="2">فبراير</option>
                  <option value="3">مارس</option>
                  <option value="4">أبريل</option>
                  <option value="5">مايو</option>
                  <option value="6">يونيو</option>
                  <option value="7">يوليو</option>
                  <option value="8">أغسطس</option>
                  <option value="9">سبتمبر</option>
                  <option value="10">أكتوبر</option>
                  <option value="11">نوفمبر</option>
                  <option value="12">ديسمبر</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop-only HERO KPI row */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {(() => {
          const allYearsActivities =
            totalConferencesCount +
            totalSeminarsCount +
            totalCoursesCount +
            totalWorkshopsCount +
            totalCommitteesCount +
            totalPositionsCount +
            totalThankYouBooksCount +
            totalAssignmentsCount +
            totalSupervisionCount +
            totalJournalMembershipsCount +
            totalScientificEvaluationsCount +
            totalVolunteerWorkCount +
            totalParticipationCertificatesCount +
            totalPublicationsCount;

          const allYearsAchievements = totalResearchCount + allYearsActivities;

          const currentYearActivities =
            conferencesCountByDate +
            seminarsCountByDate +
            coursesCountByDate +
            workshopsCountByDate +
            committeesCountByDate +
            positionsCountByDate +
            thankYouBooksCountByDate +
            assignmentsCountByDate +
            supervisionCountByDate +
            journalMembershipsCountByDate +
            scientificEvaluationsCountByDate +
            volunteerWorkCountByDate;

          const currentYearAchievements = researchStatsByDate.total + currentYearActivities;

          return (
            <>
              <DesktopHeroKpiCard
                title="إجمالي المنجزات"
                value={allYearsAchievements}
                helper="جميع السنوات"
                icon={CheckCircle}
                accent="indigo"
                badge="كل السنوات"
              />
              <DesktopHeroKpiCard
                title="إجمالي النشاطات"
                value={allYearsActivities}
                helper="بدون البحوث"
                icon={CalendarDays}
                accent="blue"
                badge="محدّث"
              />
              <DesktopHeroKpiCard
                title="إجمالي البحوث"
                value={totalResearchCount}
                helper="جميع السنوات"
                icon={FileText}
                accent="emerald"
                badge="كل السنوات"
              />
              <DesktopHeroKpiCard
                title="منجزات العام الدراسي"
                value={currentYearAchievements}
                helper={`حسب فلتر السنة: ${selectedYear}`}
                icon={Award}
                accent="amber"
                badge="حسب الفلتر"
              />
            </>
          );
        })()}
      </div>

      {/* Desktop-only chart: تطور الإنجازات عبر السنوات */}
      <div className="hidden md:block">
        {(() => {
          const last = achievementsByAcademicYear[achievementsByAcademicYear.length - 1]?.total ?? null;
          const prev = achievementsByAcademicYear[achievementsByAcademicYear.length - 2]?.total ?? null;
          const trend =
            typeof last === "number" && typeof prev === "number"
              ? last > prev
                ? "تحسّن مقارنة بالعام السابق"
                : last < prev
                ? "تراجع مقارنة بالعام السابق"
                : "مستقر مقارنة بالعام السابق"
              : null;
          const trendTone =
            trend === "تحسّن مقارنة بالعام السابق"
              ? "text-emerald-700"
              : trend === "تراجع مقارنة بالعام السابق"
              ? "text-amber-700"
              : "text-slate-600";

          const shortenAcademicYear = (label: unknown) => {
            const s = String(label);
            const m = s.match(/^(\d{4})-(\d{4})$/);
            if (!m) return s;
            const start = m[1];
            const end2 = m[2].slice(-2);
            return `${start}/${end2}`;
          };

          let bestIdx: number | null = null;
          let bestTotal = -Infinity;
          for (let i = 0; i < achievementsByAcademicYear.length; i += 1) {
            const t = achievementsByAcademicYear[i]?.total ?? 0;
            if (t > bestTotal) {
              bestTotal = t;
              bestIdx = i;
            }
          }
          const bestLabel =
            bestIdx !== null ? shortenAcademicYear(achievementsByAcademicYear[bestIdx]?.academicYear) : null;

          return (
        <DesktopCard
          title="تطور الإنجازات عبر السنوات"
          subtitle="إجمالي إنجازاتك لكل سنة دراسية (آخر 8 سنوات)"
          right={
            <div className="flex items-center gap-2" dir="rtl">
              {trend ? <span className={`text-xs font-bold ${trendTone}`}>{trend}</span> : null}
              {bestLabel ? <DesktopChip label={`الأفضل: ${bestLabel}`} tone="neutral" /> : null}
              <DesktopChip label="مخطط" tone="indigo" />
            </div>
          }
        >
          <div className="h-[270px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={achievementsByAcademicYear} margin={{ top: 8, right: 12, left: 8, bottom: 8 }}>
                <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
                <XAxis
                  dataKey="academicYear"
                  tickFormatter={shortenAcademicYear}
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={{ stroke: "#E2E8F0" }}
                  interval={0}
                  angle={-12}
                  textAnchor="end"
                  height={52}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#64748B" }}
                  axisLine={{ stroke: "#E2E8F0" }}
                  tickLine={{ stroke: "#E2E8F0" }}
                  allowDecimals={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                  contentStyle={{ borderRadius: 12, borderColor: "#E2E8F0" }}
                  labelStyle={{ color: "#0F172A", fontWeight: 800 }}
                  formatter={(v: unknown) => [
                    typeof v === "number" ? v : Number(v),
                    "إجمالي الإنجازات",
                  ]}
                  labelFormatter={(l: unknown) => `العام الدراسي: ${String(l)}`}
                />
                <Bar
                  dataKey="total"
                  name="إجمالي الإنجازات"
                  fill="#C7D2FE"
                  radius={[10, 10, 4, 4]}
                  isAnimationActive={false}
                >
                  {achievementsByAcademicYear.map((e, idx) => (
                    <Cell
                      key={e.academicYear}
                      fill={typeof bestIdx === "number" && idx === bestIdx ? "#6366F1" : "#C7D2FE"}
                    />
                  ))}
                  <LabelList
                    dataKey="total"
                    position="top"
                    fill="#475569"
                    fontSize={11}
                    formatter={(v: unknown) => (typeof v === "number" ? v : Number(v))}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DesktopCard>
          );
        })()}
      </div>

      {/* Desktop/Tablet: top stats as clean cards */}
      <div className="hidden md:grid md:grid-cols-12 md:gap-6 md:items-stretch">
        <DesktopCard
          title="إحصائيات البحوث"
          subtitle="نظرة عامة على نشاطك البحثي"
          right={
            <div className="flex items-center gap-2" dir="rtl">
              <DesktopChip label="بحوث" tone="indigo" />
              <span className="text-[12px] font-bold text-indigo-600">عرض التفاصيل</span>
            </div>
          }
          className="md:col-span-6 md:h-full"
        >
          <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3">
            <DesktopMiniTile icon={FileText} category="research" label="إجمالي البحوث" value={totalResearchCount} />
            <DesktopMiniTile icon={ClipboardList} category="research" label="البحوث المخططة" value={researchStats.planned} />
            <DesktopMiniTile icon={CheckCircle} category="research" label="البحوث المنجزة" value={researchStats.completed} />
            <DesktopMiniTile icon={ClipboardCheck} category="publication" label="البحوث المنشورة" value={researchStats.published} />
            <DesktopMiniTile icon={CalendarDays} category="warning" label="البحوث غير المنجزة" value={researchStats.uncompleted} />
            <DesktopMiniTile icon={Globe} category="research" label="البحوث العالمية" value={researchStats.international} />
            <DesktopMiniTile icon={Users} category="research" label="البحوث المفردة" value={researchStats.individual} />
            <DesktopMiniTile icon={Landmark} category="research" label="البحوث المحلية" value={researchStats.local} />
            <DesktopMiniTile icon={FileText} category="publication" label="ثومبسون رويتر" value={researchStats.thomsonReuters} />
            <DesktopMiniTile icon={Award} category="publication" label="سكوبس" value={researchStats.scopus} />
          </div>
        </DesktopCard>

        <DesktopCard
          title="إحصائيات عامة"
          subtitle="ملخص نشاطاتك الأكاديمية"
          right={
            <div className="flex items-center gap-2" dir="rtl">
              <DesktopChip label="نشاطات" tone="blue" />
              <span className="text-[12px] font-bold text-indigo-600">عرض التفاصيل</span>
            </div>
          }
          className="md:col-span-6 md:h-full"
        >
          <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3">
            <DesktopMiniTile icon={CalendarDays} category="activity" label="المؤتمرات" value={totalConferencesCount} />
            <DesktopMiniTile icon={Presentation} category="activity" label="الندوات" value={totalSeminarsCount} />
            <DesktopMiniTile icon={BookOpen} category="activity" label="الدورات" value={totalCoursesCount} />
            <DesktopMiniTile icon={BookOpen} category="activity" label="ورش العمل" value={totalWorkshopsCount} />
            <DesktopMiniTile icon={ClipboardList} category="activity" label="التكليفات" value={totalAssignmentsCount} />
            <DesktopMiniTile icon={Users} category="activity" label="اللجان" value={totalCommitteesCount} />
            <DesktopMiniTile icon={CalendarCheck2} category="activity" label="شهادات المشاركة" value={totalParticipationCertificatesCount} />
            <DesktopMiniTile icon={Landmark} category="activity" label="إدارة المجلات" value={totalJournalMembershipsCount} />
            <DesktopMiniTile icon={Users} category="activity" label="الإشراف على الطلبة" value={totalSupervisionCount} />
            <DesktopMiniTile icon={Briefcase} category="activity" label="المناصب" value={totalPositionsCount} />
            <DesktopMiniTile icon={ClipboardCheck} category="activity" label="التقويم العلمي" value={totalScientificEvaluationsCount} />
            <DesktopMiniTile icon={HandHeart} category="activity" label="الأعمال الطوعية" value={totalVolunteerWorkCount} />
            <DesktopMiniTile icon={FileText} category="activity" label="كتب الشكر" value={totalThankYouBooksCount} />
          </div>
        </DesktopCard>
      </div>

      {/* General Statistics Section */}
      <div className="bg-gray-50 rounded-lg border border-blue-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4 max-[639px]:shadow-sm max-[639px]:border-slate-200/70 md:hidden">
        <div className="mb-4 pb-2 border-b border-gray-300">
          <h2 className="text-xl font-bold max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>إحصائيات البحوث</h2>
        </div>
        <div className="flex flex-nowrap items-start gap-5 justify-center pb-2 px-2 max-[639px]:overflow-x-auto max-[639px]:justify-start max-[639px]:gap-3 max-[639px]:px-1 max-[639px]:pb-1 max-[639px]:snap-x max-[639px]:snap-mandatory max-[639px]:[&>div]:min-w-[120px] max-[639px]:[&>div]:h-[104px] max-[639px]:[&>div]:justify-center max-[639px]:[&>div]:items-center max-[639px]:[&>div]:bg-slate-50 max-[639px]:[&>div]:rounded-2xl max-[639px]:[&>div]:border max-[639px]:[&>div]:border-slate-200/70 max-[639px]:[&>div]:p-3 max-[639px]:[&>div]:shadow-sm max-[639px]:[&>div]:gap-1 max-[639px]:[&>div]:snap-start max-[639px]:[&>div>div:first-child]:w-10 max-[639px]:[&>div>div:first-child]:h-10 max-[639px]:[&>div>div:first-child_svg]:w-4 max-[639px]:[&>div>div:first-child_svg]:h-4 max-[639px]:[&>div>span:last-child]:truncate max-[639px]:[&>div>span:last-child]:max-w-full max-[639px]:[&>div>span:last-child]:text-[12px] max-[639px]:[&>div>span:last-child]:leading-5 m-scroll">
          {/* Total Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-purple-600" style={{ color: '#1F2937' }}>{totalResearchCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-purple-600" style={{ color: '#1F2937' }}>إجمالي البحوث</span>
          </div>

          {/* Planned Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>{researchStats.planned}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>البحوث المخططة</span>
          </div>

          {/* Completed Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>{researchStats.completed}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>البحوث المنجزة</span>
          </div>

          {/* Published Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-green-600" style={{ color: '#1F2937' }}>{researchStats.published}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-green-600" style={{ color: '#1F2937' }}>البحوث المنشورة</span>
          </div>

          {/* Uncompleted Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-red-600" style={{ color: '#1F2937' }}>{researchStats.uncompleted}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-red-600" style={{ color: '#1F2937' }}>البحوث غير المنجزة</span>
          </div>

          {/* International Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14v9M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-indigo-600" style={{ color: '#1F2937' }}>{researchStats.international}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-indigo-600" style={{ color: '#1F2937' }}>البحوث العالمية</span>
          </div>

          {/* Individual Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-teal-500" style={{ color: '#1F2937' }}>{researchStats.individual}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-teal-500" style={{ color: '#1F2937' }}>البحوث المفردة</span>
          </div>

          {/* Local Research */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-cyan-600" style={{ color: '#1F2937' }}>{researchStats.local}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-cyan-600" style={{ color: '#1F2937' }}>البحوث المحلية</span>
          </div>

          {/* Thomson Reuters */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-rose-600" style={{ color: '#1F2937' }}>{researchStats.thomsonReuters}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-rose-600" style={{ color: '#1F2937' }}>ثومبسون رويتر</span>
          </div>

          {/* Scopus */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>{researchStats.scopus}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>سكوبس</span>
          </div>
        </div>
      </div>

      {/* General Statistics Section */}
      <div className="bg-gray-50 rounded-lg border border-blue-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4 max-[639px]:shadow-sm max-[639px]:border-slate-200/70 md:hidden">
        <div className="mb-4 pb-2 border-b border-gray-300">
          <h2 className="text-xl font-bold max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>إحصائيات عامة</h2>
        </div>
        <div className="flex flex-nowrap items-start gap-5 justify-center pb-2 px-2 max-[639px]:overflow-x-auto max-[639px]:justify-start max-[639px]:gap-3 max-[639px]:px-1 max-[639px]:pb-1 max-[639px]:snap-x max-[639px]:snap-mandatory max-[639px]:[&>div]:min-w-[120px] max-[639px]:[&>div]:h-[104px] max-[639px]:[&>div]:justify-center max-[639px]:[&>div]:items-center max-[639px]:[&>div]:bg-slate-50 max-[639px]:[&>div]:rounded-2xl max-[639px]:[&>div]:border max-[639px]:[&>div]:border-slate-200/70 max-[639px]:[&>div]:p-3 max-[639px]:[&>div]:shadow-sm max-[639px]:[&>div]:gap-1 max-[639px]:[&>div]:snap-start max-[639px]:[&>div>div:first-child]:w-10 max-[639px]:[&>div>div:first-child]:h-10 max-[639px]:[&>div>div:first-child_svg]:w-4 max-[639px]:[&>div>div:first-child_svg]:h-4 max-[639px]:[&>div>span:last-child]:truncate max-[639px]:[&>div>span:last-child]:max-w-full max-[639px]:[&>div>span:last-child]:text-[12px] max-[639px]:[&>div>span:last-child]:leading-5 m-scroll">
          {/* Conferences */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>{totalConferencesCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>المؤتمرات</span>
          </div>

          {/* Seminars */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-violet-600" style={{ color: '#1F2937' }}>{totalSeminarsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-violet-600" style={{ color: '#1F2937' }}>الندوات</span>
          </div>

          {/* Courses */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-emerald-600" style={{ color: '#1F2937' }}>{totalCoursesCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-emerald-600" style={{ color: '#1F2937' }}>الدورات</span>
          </div>

          {/* Workshops */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>{totalWorkshopsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>ورش العمل</span>
          </div>

          {/* Assignments */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>{totalAssignmentsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>التكليفات</span>
          </div>

          {/* Thank You Books */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-pink-500" style={{ color: '#1F2937' }}>{totalThankYouBooksCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-pink-500" style={{ color: '#1F2937' }}>كتب الشكر</span>
          </div>

          {/* Committees */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-cyan-500" style={{ color: '#1F2937' }}>{totalCommitteesCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-cyan-500" style={{ color: '#1F2937' }}>اللجان</span>
          </div>

          {/* Participation Certificates */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-emerald-500" style={{ color: '#1F2937' }}>{totalParticipationCertificatesCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-emerald-500" style={{ color: '#1F2937' }}>شهادات المشاركة</span>
          </div>

          {/* Journals Management */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-violet-500" style={{ color: '#1F2937' }}>{totalJournalMembershipsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-violet-500" style={{ color: '#1F2937' }}>إدارة المجلات</span>
          </div>

          {/* Student Supervision */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>{totalSupervisionCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>الإشراف على الطلبة</span>
          </div>

          {/* Positions */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-slate-600" style={{ color: '#1F2937' }}>{totalPositionsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-slate-600" style={{ color: '#1F2937' }}>المناصب</span>
          </div>

          {/* Scientific Evaluation */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-amber-600" style={{ color: '#1F2937' }}>{totalScientificEvaluationsCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-amber-600" style={{ color: '#1F2937' }}>التقويم العلمي</span>
          </div>

          {/* Volunteer Work */}
          <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
              <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-rose-500" style={{ color: '#1F2937' }}>{totalVolunteerWorkCount}</span>
            <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-rose-500" style={{ color: '#1F2937' }}>الأعمال الطوعية</span>
          </div>
        </div>
      </div>

      {/* Performance Achievements Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4 md:bg-transparent md:border-0 md:shadow-none md:p-0 md:rounded-none md:mb-0">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-300 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
          <h2 className="text-xl font-bold max-[639px]:text-[16px] md:text-[18px] md:font-extrabold" style={{ color: '#1F2937' }}>
            إنجازات استمارة الأداء - العام الدراسي {selectedYear}
          </h2>
          <div className="flex items-center gap-3 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:w-full max-[639px]:gap-2 max-[639px]:bg-slate-50 max-[639px]:border max-[639px]:border-slate-200/70 max-[639px]:rounded-2xl max-[639px]:p-3 md:hidden">
            {/* Year Selector */}
            <div className="relative max-[639px]:w-full">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:w-full max-[639px]:h-11"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              >
                {(availableAcademicYears.length > 0 ? availableAcademicYears : [getAcademicYear()]).map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="relative max-[639px]:w-full">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:w-full max-[639px]:h-11"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              >
                <option value="all">جميع الأشهر</option>
                <option value="1">يناير</option>
                <option value="2">فبراير</option>
                <option value="3">مارس</option>
                <option value="4">أبريل</option>
                <option value="5">مايو</option>
                <option value="6">يونيو</option>
                <option value="7">يوليو</option>
                <option value="8">أغسطس</option>
                <option value="9">سبتمبر</option>
                <option value="10">أكتوبر</option>
                <option value="11">نوفمبر</option>
                <option value="12">ديسمبر</option>
              </select>
            </div>
          </div>
        </div>
        <div className="mt-4 md:hidden">
          {/* Research Statistics Card */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 shadow-sm max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:border-slate-200/70">
            <div className="mb-4 pb-2 border-b border-gray-300">
              <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>
                إحصائيات البحوث - {getMonthName(selectedMonth)} {selectedYear.split('-')[0]}
              </h3>
            </div>
            <div className="flex flex-wrap items-start gap-6 justify-center pb-2 px-2 max-[639px]:flex-nowrap max-[639px]:overflow-x-auto max-[639px]:justify-start max-[639px]:gap-3 max-[639px]:px-1 max-[639px]:pb-1 max-[639px]:snap-x max-[639px]:snap-mandatory max-[639px]:[&>div]:min-w-[120px] max-[639px]:[&>div]:h-[104px] max-[639px]:[&>div]:justify-center max-[639px]:[&>div]:items-center max-[639px]:[&>div]:bg-slate-50 max-[639px]:[&>div]:rounded-2xl max-[639px]:[&>div]:border max-[639px]:[&>div]:border-slate-200/70 max-[639px]:[&>div]:p-3 max-[639px]:[&>div]:shadow-sm max-[639px]:[&>div]:gap-1 max-[639px]:[&>div]:snap-start max-[639px]:[&>div>div:first-child]:w-10 max-[639px]:[&>div>div:first-child]:h-10 max-[639px]:[&>div>div:first-child_svg]:w-4 max-[639px]:[&>div>div:first-child_svg]:h-4 max-[639px]:[&>div>span:last-child]:truncate max-[639px]:[&>div>span:last-child]:max-w-full max-[639px]:[&>div>span:last-child]:text-[12px] max-[639px]:[&>div>span:last-child]:leading-5 m-scroll">
              {/* Planned Research */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>{researchStatsByDate.planned}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>البحوث المخططة</span>
              </div>

              {/* Completed Research */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-green-500" style={{ color: '#1F2937' }}>{researchStatsByDate.completed}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-green-500" style={{ color: '#1F2937' }}>البحوث المنجزة</span>
              </div>

              {/* Incomplete Research */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-red-500" style={{ color: '#1F2937' }}>{researchStatsByDate.uncompleted}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-red-500" style={{ color: '#1F2937' }}>البحوث غير المنجزة</span>
              </div>

              {/* Published Research */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>{researchStatsByDate.published}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>البحوث المنشورة</span>
              </div>
            </div>
          </div>

          {/* General Statistics Card */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-5 shadow-sm mt-4 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:border-slate-200/70 max-[639px]:mt-3">
            <div className="mb-4 pb-2 border-b border-gray-300">
              <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>
                الإحصائيات العامة - {getMonthName(selectedMonth)} {selectedYear.split('-')[0]}
              </h3>
            </div>
            <div className="flex flex-wrap items-start gap-6 justify-center pb-2 px-2 max-[639px]:flex-nowrap max-[639px]:overflow-x-auto max-[639px]:justify-start max-[639px]:gap-3 max-[639px]:px-1 max-[639px]:pb-1 max-[639px]:snap-x max-[639px]:snap-mandatory max-[639px]:[&>div]:min-w-[120px] max-[639px]:[&>div]:h-[104px] max-[639px]:[&>div]:justify-center max-[639px]:[&>div]:items-center max-[639px]:[&>div]:bg-slate-50 max-[639px]:[&>div]:rounded-2xl max-[639px]:[&>div]:border max-[639px]:[&>div]:border-slate-200/70 max-[639px]:[&>div]:p-3 max-[639px]:[&>div]:shadow-sm max-[639px]:[&>div]:gap-1 max-[639px]:[&>div]:snap-start max-[639px]:[&>div>div:first-child]:w-10 max-[639px]:[&>div>div:first-child]:h-10 max-[639px]:[&>div>div:first-child_svg]:w-4 max-[639px]:[&>div>div:first-child_svg]:h-4 max-[639px]:[&>div>span:last-child]:truncate max-[639px]:[&>div>span:last-child]:max-w-full max-[639px]:[&>div>span:last-child]:text-[12px] max-[639px]:[&>div>span:last-child]:leading-5 m-scroll">
              {/* Conferences */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>{conferencesCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-blue-500" style={{ color: '#1F2937' }}>المؤتمرات</span>
              </div>

              {/* Seminars */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-violet-600" style={{ color: '#1F2937' }}>{seminarsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-violet-600" style={{ color: '#1F2937' }}>الندوات</span>
              </div>

              {/* Courses */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-emerald-600" style={{ color: '#1F2937' }}>{coursesCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-emerald-600" style={{ color: '#1F2937' }}>الدورات</span>
              </div>

              {/* Workshops */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>{workshopsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-yellow-500" style={{ color: '#1F2937' }}>ورش العمل</span>
              </div>

              {/* Committees */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-cyan-500" style={{ color: '#1F2937' }}>{committeesCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-cyan-500" style={{ color: '#1F2937' }}>اللجان</span>
              </div>

              {/* Thank You Books */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-pink-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-pink-500" style={{ color: '#1F2937' }}>{thankYouBooksCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-pink-500" style={{ color: '#1F2937' }}>كتب الشكر</span>
              </div>

              {/* Assignments */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>{assignmentsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-purple-500" style={{ color: '#1F2937' }}>التكليفات</span>
              </div>

              {/* Student Supervision */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>{supervisionCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-orange-500" style={{ color: '#1F2937' }}>الإشراف على الطلبة</span>
              </div>

              {/* Journals Management */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-violet-500" style={{ color: '#1F2937' }}>{journalMembershipsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-violet-500" style={{ color: '#1F2937' }}>إدارة المجلات</span>
              </div>

              {/* Positions */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-slate-600" style={{ color: '#1F2937' }}>{positionsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-slate-600" style={{ color: '#1F2937' }}>المناصب</span>
              </div>

              {/* Scientific Evaluation */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-amber-600" style={{ color: '#1F2937' }}>{scientificEvaluationsCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-amber-600" style={{ color: '#1F2937' }}>التقويم العلمي</span>
              </div>

              {/* Volunteer Work */}
              <div className="flex flex-col items-center gap-2 group cursor-pointer flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 ease-in-out">
                  <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <span className="text-2xl font-bold transition-colors duration-300 group-hover:text-rose-500" style={{ color: '#1F2937' }}>{volunteerWorkCountByDate}</span>
                <span className="text-sm font-medium text-center transition-colors duration-300 group-hover:text-rose-500" style={{ color: '#1F2937' }}>الأعمال الطوعية</span>
              </div>
            </div>
          </div>

          {/* Summary Achievements Card */}
          <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg border-2 border-indigo-200 p-6 shadow-lg mt-4 max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mt-3">
            <div className="mb-5 pb-3 border-b-2 border-indigo-300">
              <h3 className="text-2xl font-bold flex items-center gap-3 max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>
                <svg className="w-7 h-7 max-[639px]:w-5 max-[639px]:h-5" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                منجزاتك للعام الدراسي {selectedYear}
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Research Summary */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold" style={{ color: '#1F2937' }}>إجمالي البحوث</h4>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المخططة</span>
                    <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStatsByDate.planned}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المنجزة</span>
                    <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStatsByDate.completed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المنشورة</span>
                    <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStatsByDate.published}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث غير المنجزة</span>
                    <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStatsByDate.uncompleted}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t-2 border-purple-200">
                    <span className="text-base font-bold" style={{ color: '#1F2937' }}>المجموع</span>
                    <span className="text-2xl font-bold" style={{ color: '#6366F1' }}>{researchStatsByDate.total}</span>
                  </div>
                </div>
              </div>

              {/* Activities Summary */}
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold" style={{ color: '#1F2937' }}>إجمالي النشاطات</h4>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>المؤتمرات</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{conferencesCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الندوات</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{seminarsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الدورات</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{coursesCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>ورش العمل</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{workshopsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>اللجان</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{committeesCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>المناصب</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{positionsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>كتب الشكر</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{thankYouBooksCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>التكليفات</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{assignmentsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الإشراف على الطلبة</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{supervisionCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>إدارة المجلات</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{journalMembershipsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>التقويم العلمي</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{scientificEvaluationsCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الأعمال الطوعية</span>
                    <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{volunteerWorkCountByDate}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t-2 border-blue-200 mt-2">
                    <span className="text-base font-bold" style={{ color: '#1F2937' }}>المجموع</span>
                    <span className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{conferencesCountByDate + seminarsCountByDate + coursesCountByDate + workshopsCountByDate + committeesCountByDate + positionsCountByDate + thankYouBooksCountByDate + assignmentsCountByDate + supervisionCountByDate + journalMembershipsCountByDate + scientificEvaluationsCountByDate + volunteerWorkCountByDate}</span>
                  </div>
                </div>
              </div>

              {/* Total Achievements */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 border border-indigo-400 shadow-lg hover:shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-bold text-white">إجمالي المنجزات</h4>
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-5xl font-bold text-white mb-2 max-[639px]:text-4xl max-[639px]:mb-1.5">{researchStatsByDate.total + conferencesCountByDate + seminarsCountByDate + coursesCountByDate + workshopsCountByDate + committeesCountByDate + positionsCountByDate + thankYouBooksCountByDate + assignmentsCountByDate + supervisionCountByDate + journalMembershipsCountByDate + scientificEvaluationsCountByDate + volunteerWorkCountByDate}</div>
                    <div className="text-white/90 text-sm font-medium">إجمالي الإنجازات</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 max-[639px]:grid-cols-1">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{researchStatsByDate.total}</div>
                      <div className="text-white/80 text-xs">بحوث</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{conferencesCountByDate + seminarsCountByDate + coursesCountByDate + workshopsCountByDate + committeesCountByDate + positionsCountByDate + thankYouBooksCountByDate + assignmentsCountByDate + supervisionCountByDate + journalMembershipsCountByDate + scientificEvaluationsCountByDate + volunteerWorkCountByDate}</div>
                      <div className="text-white/80 text-xs">نشاطات</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-6 pt-4 border-t border-indigo-200">
              <div className="flex items-center justify-center gap-8 flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>متابعة مستمرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>أداء متميز</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>تقدم مستمر</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop/Tablet: clean breakdown + summary layout */}
        <div className="hidden md:block">
          <div className="md:grid md:grid-cols-12 md:gap-6 md:items-stretch">
            <DesktopCard
              title={`إحصائيات البحوث - ${getMonthName(selectedMonth)} ${selectedYear.split("-")[0]}`}
              subtitle="ضمن فترة الفلتر الحالية"
              right={
                <div className="flex items-center gap-2" dir="rtl">
                  <DesktopChip label="بحوث" tone="indigo" />
                  <span className="text-[12px] font-bold text-indigo-600">عرض التفاصيل</span>
                </div>
              }
              className="md:col-span-6 md:h-full"
            >
              <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3">
                <DesktopMiniTile icon={ClipboardList} category="research" label="البحوث المخططة" value={researchStatsByDate.planned} />
                <DesktopMiniTile icon={CheckCircle} category="research" label="البحوث المنجزة" value={researchStatsByDate.completed} />
                <DesktopMiniTile icon={CalendarDays} category="warning" label="البحوث غير المنجزة" value={researchStatsByDate.uncompleted} />
                <DesktopMiniTile icon={ClipboardCheck} category="publication" label="البحوث المنشورة" value={researchStatsByDate.published} />
              </div>
            </DesktopCard>

            <DesktopCard
              title={`الإحصائيات العامة - ${getMonthName(selectedMonth)} ${selectedYear.split("-")[0]}`}
              subtitle="ضمن فترة الفلتر الحالية"
              right={
                <div className="flex items-center gap-2" dir="rtl">
                  <DesktopChip label="نشاطات" tone="blue" />
                  <span className="text-[12px] font-bold text-indigo-600">عرض التفاصيل</span>
                </div>
              }
              className="md:col-span-6 md:h-full"
            >
              <div className="md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-3">
                <DesktopMiniTile icon={CalendarDays} category="activity" label="المؤتمرات" value={conferencesCountByDate} />
                <DesktopMiniTile icon={Presentation} category="activity" label="الندوات" value={seminarsCountByDate} />
                <DesktopMiniTile icon={BookOpen} category="activity" label="الدورات" value={coursesCountByDate} />
                <DesktopMiniTile icon={BookOpen} category="activity" label="ورش العمل" value={workshopsCountByDate} />
                <DesktopMiniTile icon={Users} category="activity" label="اللجان" value={committeesCountByDate} />
                <DesktopMiniTile icon={Briefcase} category="activity" label="المناصب" value={positionsCountByDate} />
                <DesktopMiniTile icon={FileText} category="activity" label="كتب الشكر" value={thankYouBooksCountByDate} />
                <DesktopMiniTile icon={ClipboardList} category="activity" label="التكليفات" value={assignmentsCountByDate} />
                <DesktopMiniTile icon={Users} category="activity" label="الإشراف على الطلبة" value={supervisionCountByDate} />
                <DesktopMiniTile icon={Landmark} category="activity" label="إدارة المجلات" value={journalMembershipsCountByDate} />
                <DesktopMiniTile icon={ClipboardCheck} category="activity" label="التقويم العلمي" value={scientificEvaluationsCountByDate} />
                <DesktopMiniTile icon={HandHeart} category="activity" label="الأعمال الطوعية" value={volunteerWorkCountByDate} />
              </div>
            </DesktopCard>
          </div>

          <div className="mt-6 md:grid md:grid-cols-12 md:gap-6 md:items-stretch" style={{ direction: "ltr" }}>
            {/* Left: highlight total */}
            <div className="md:col-span-12 lg:col-span-5">
              <div
                dir="rtl"
                className="relative h-full md:rounded-2xl md:bg-gradient-to-br md:from-indigo-600 md:to-violet-600 md:p-5 md:shadow-sm md:border md:border-indigo-200/30 overflow-hidden"
              >
                {/* micro bars (derived, no new libs) */}
                <div className="hidden md:flex absolute left-5 top-5 items-end gap-1 h-10 opacity-90">
                  {(() => {
                    const activities =
                      conferencesCountByDate +
                      seminarsCountByDate +
                      coursesCountByDate +
                      workshopsCountByDate +
                      committeesCountByDate +
                      positionsCountByDate +
                      thankYouBooksCountByDate +
                      assignmentsCountByDate +
                      supervisionCountByDate +
                      journalMembershipsCountByDate +
                      scientificEvaluationsCountByDate +
                      volunteerWorkCountByDate;
                    const total = researchStatsByDate.total + activities;
                    const bars = [
                      researchStatsByDate.planned,
                      researchStatsByDate.completed,
                      researchStatsByDate.published,
                      researchStatsByDate.uncompleted,
                      activities,
                      total,
                    ];
                    const max = Math.max(...bars, 1);
                    return bars.map((v, i) => {
                      const h = Math.max(8, Math.round((v / max) * 40));
                      return (
                        <div
                          key={i}
                          className="w-2 rounded-sm bg-white/35 border border-white/10"
                          style={{ height: `${h}px` }}
                        />
                      );
                    });
                  })()}
                </div>

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[16px] font-extrabold text-white">إجمالي المنجزات</div>
                    <div className="mt-1 text-[12px] text-white/80">للـعام الدراسي {selectedYear}</div>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>

                <div className="mt-4 text-[46px] leading-none font-extrabold text-white">
                  {(() => {
                    const activities =
                      conferencesCountByDate +
                      seminarsCountByDate +
                      coursesCountByDate +
                      workshopsCountByDate +
                      committeesCountByDate +
                      positionsCountByDate +
                      thankYouBooksCountByDate +
                      assignmentsCountByDate +
                      supervisionCountByDate +
                      journalMembershipsCountByDate +
                      scientificEvaluationsCountByDate +
                      volunteerWorkCountByDate;
                    return researchStatsByDate.total + activities;
                  })()}
                </div>
                <div className="mt-2 text-[12px] text-white/80">إجمالي الإنجازات ضمن فلتر السنة/الشهر</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                    <div className="text-[20px] font-extrabold text-white">{researchStatsByDate.total}</div>
                    <div className="mt-1 text-[12px] text-white/80">بحوث</div>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                    <div className="text-[20px] font-extrabold text-white">
                      {conferencesCountByDate +
                        seminarsCountByDate +
                        coursesCountByDate +
                        workshopsCountByDate +
                        committeesCountByDate +
                        positionsCountByDate +
                        thankYouBooksCountByDate +
                        assignmentsCountByDate +
                        supervisionCountByDate +
                        journalMembershipsCountByDate +
                        scientificEvaluationsCountByDate +
                        volunteerWorkCountByDate}
                    </div>
                    <div className="mt-1 text-[12px] text-white/80">نشاطات</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: stacked summaries */}
            <div className="md:col-span-12 lg:col-span-7">
              <div className="h-full flex flex-col gap-6">
                <DesktopCard title="ملخص البحوث" subtitle="أوضح حالة البحوث ضمن الفترة" className="md:h-full">
                  <div className="space-y-2" dir="rtl">
                    {[
                      ["البحوث المخططة", researchStatsByDate.planned],
                      ["البحوث المنجزة", researchStatsByDate.completed],
                      ["البحوث المنشورة", researchStatsByDate.published],
                      ["البحوث غير المنجزة", researchStatsByDate.uncompleted],
                    ].map(([label, v]) => (
                      <div key={label as string} className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-600">{label as string}</span>
                        <span className="font-extrabold text-slate-900">{v as number}</span>
                      </div>
                    ))}
                  </div>
                </DesktopCard>

                <DesktopCard title="ملخص النشاطات" subtitle="أهم النشاطات ضمن الفترة" className="md:h-full">
                  <div className="space-y-2" dir="rtl">
                    {[
                      ["المؤتمرات", conferencesCountByDate],
                      ["الندوات", seminarsCountByDate],
                      ["الدورات", coursesCountByDate],
                      ["ورش العمل", workshopsCountByDate],
                      ["اللجان", committeesCountByDate],
                      ["المناصب", positionsCountByDate],
                      ["كتب الشكر", thankYouBooksCountByDate],
                      ["التكليفات", assignmentsCountByDate],
                      ["الإشراف على الطلبة", supervisionCountByDate],
                      ["إدارة المجلات", journalMembershipsCountByDate],
                      ["التقويم العلمي", scientificEvaluationsCountByDate],
                      ["الأعمال الطوعية", volunteerWorkCountByDate],
                    ].map(([label, v]) => (
                      <div key={label as string} className="flex items-center justify-between text-[13px]">
                        <span className="text-slate-600">{label as string}</span>
                        <span className="font-extrabold text-slate-900">{v as number}</span>
                      </div>
                    ))}
                  </div>
                </DesktopCard>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Achievements Section - All Years */}
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4">
        <div className="mb-4 pb-2 border-b border-gray-300">
          <h2 className="text-xl font-bold max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>
            المنجزات العامة - جميع السنوات
          </h2>
        </div>
        
        {/* Summary Achievements Card - All Years */}
        <div
          className={[
            "bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-lg border-2 border-emerald-200 p-6 shadow-lg mt-4 max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mt-3 max-[639px]:relative",
            allYearsExpanded ? "" : "max-[639px]:max-h-[420px] max-[639px]:overflow-hidden",
          ].join(" ")}
        >
          <div className="mb-5 pb-3 border-b-2 border-emerald-300">
            <h3 className="text-2xl font-bold flex items-center gap-3 max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>
              <svg className="w-7 h-7 max-[639px]:w-5 max-[639px]:h-5" style={{ color: '#10B981' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              إنجازاتك الإجمالية
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Research Summary - All Years */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold" style={{ color: '#1F2937' }}>إجمالي البحوث</h4>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المخططة</span>
                  <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStats.planned}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المنجزة</span>
                  <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStats.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث المنشورة</span>
                  <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStats.published}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium" style={{ color: '#6B7280' }}>البحوث غير المنجزة</span>
                  <span className="text-xl font-bold" style={{ color: '#1F2937' }}>{researchStats.uncompleted}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-purple-200">
                  <span className="text-base font-bold" style={{ color: '#1F2937' }}>المجموع</span>
                  <span className="text-2xl font-bold" style={{ color: '#6366F1' }}>{totalResearchCount}</span>
                </div>
              </div>
            </div>

            {/* Activities Summary - All Years */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-emerald-100 shadow-md hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold" style={{ color: '#1F2937' }}>إجمالي النشاطات</h4>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto max-[639px]:max-h-none max-[639px]:overflow-visible">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>المؤتمرات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalConferencesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الندوات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalSeminarsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الدورات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalCoursesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>ورش العمل</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalWorkshopsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>اللجان</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalCommitteesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>المناصب</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalPositionsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>كتب الشكر</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalThankYouBooksCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>التكليفات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalAssignmentsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الإشراف على الطلبة</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalSupervisionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>إدارة المجلات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalJournalMembershipsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>التقويم العلمي</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalScientificEvaluationsCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>الأعمال الطوعية</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalVolunteerWorkCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>شهادات المشاركة</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalParticipationCertificatesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: '#6B7280' }}>المؤلفات</span>
                  <span className="text-lg font-bold" style={{ color: '#1F2937' }}>{totalPublicationsCount}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t-2 border-blue-200 mt-2">
                  <span className="text-base font-bold" style={{ color: '#1F2937' }}>المجموع</span>
                  <span className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{totalConferencesCount + totalSeminarsCount + totalCoursesCount + totalWorkshopsCount + totalCommitteesCount + totalPositionsCount + totalThankYouBooksCount + totalAssignmentsCount + totalSupervisionCount + totalJournalMembershipsCount + totalScientificEvaluationsCount + totalVolunteerWorkCount + totalParticipationCertificatesCount + totalPublicationsCount}</span>
                </div>
              </div>
            </div>

            {/* Total Achievements - All Years */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-5 border border-emerald-400 shadow-lg hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-bold text-white">إجمالي المنجزات</h4>
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-5xl font-bold text-white mb-2 max-[639px]:text-4xl max-[639px]:mb-1.5">{totalResearchCount + totalConferencesCount + totalSeminarsCount + totalCoursesCount + totalWorkshopsCount + totalCommitteesCount + totalPositionsCount + totalThankYouBooksCount + totalAssignmentsCount + totalSupervisionCount + totalJournalMembershipsCount + totalScientificEvaluationsCount + totalVolunteerWorkCount + totalParticipationCertificatesCount + totalPublicationsCount}</div>
                  <div className="text-white/90 text-sm font-medium">إجمالي الإنجازات</div>
                </div>
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/20 max-[639px]:grid-cols-1">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalResearchCount}</div>
                    <div className="text-white/80 text-xs">بحوث</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{totalConferencesCount + totalSeminarsCount + totalCoursesCount + totalWorkshopsCount + totalCommitteesCount + totalPositionsCount + totalThankYouBooksCount + totalAssignmentsCount + totalSupervisionCount + totalJournalMembershipsCount + totalScientificEvaluationsCount + totalVolunteerWorkCount + totalParticipationCertificatesCount + totalPublicationsCount}</div>
                    <div className="text-white/80 text-xs">نشاطات</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-6 pt-4 border-t border-emerald-200">
            <div className="flex items-center justify-center gap-8 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>إنجازات تراكمية</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>سجل شامل</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                <span className="text-sm font-medium" style={{ color: '#6B7280' }}>رؤية شاملة</span>
              </div>
            </div>
          </div>

          {!allYearsExpanded ? (
            <div className="hidden max-[639px]:block pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-emerald-50 to-transparent" />
          ) : null}
        </div>

        {/* Mobile-only expand/collapse toggle */}
        <div className="hidden max-[639px]:block mt-3">
          <button
            type="button"
            onClick={() => setAllYearsExpanded((v) => !v)}
            className="w-full h-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-extrabold"
          >
            {allYearsExpanded ? "إخفاء" : "عرض المزيد"}
          </button>
        </div>
      </div>

      {/* Desktop/Tablet: All-years achievements (clean + consistent) */}
      <div className="hidden md:block">
        <div className="md:bg-white md:border md:border-slate-200/70 md:rounded-2xl md:shadow-sm md:p-5">
          <div className="md:flex md:items-end md:justify-between md:gap-6 md:pb-4 md:border-b md:border-slate-200/70" dir="rtl">
            <div>
              <div className="text-[18px] font-extrabold text-slate-900">المنجزات العامة</div>
              <div className="mt-1 text-[13px] text-slate-500">جميع السنوات</div>
            </div>
          </div>

          <div className="mt-5 md:grid md:grid-cols-12 md:gap-6 md:items-stretch" style={{ direction: "ltr" }}>
            {/* Left: highlight total */}
            <div className="md:col-span-12 lg:col-span-4 lg:order-1">
              <div
                dir="rtl"
                className="h-full md:rounded-2xl md:bg-gradient-to-br md:from-emerald-600 md:to-teal-600 md:p-5 md:shadow-sm md:border md:border-emerald-200/30"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[16px] font-extrabold text-white">إجمالي المنجزات</div>
                    <div className="mt-1 text-[13px] text-white/80">لكل السنوات</div>
                  </div>
                  <div className="w-10 h-10 rounded-[10px] bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" strokeWidth={2} />
                  </div>
                </div>

                <div className="mt-4 text-[44px] leading-none font-extrabold text-white">
                  {totalResearchCount +
                    totalConferencesCount +
                    totalSeminarsCount +
                    totalCoursesCount +
                    totalWorkshopsCount +
                    totalCommitteesCount +
                    totalPositionsCount +
                    totalThankYouBooksCount +
                    totalAssignmentsCount +
                    totalSupervisionCount +
                    totalJournalMembershipsCount +
                    totalScientificEvaluationsCount +
                    totalVolunteerWorkCount +
                    totalParticipationCertificatesCount +
                    totalPublicationsCount}
                </div>
                <div className="mt-2 text-[13px] text-white/80">إجمالي الإنجازات</div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                    <div className="text-[20px] font-extrabold text-white">{totalResearchCount}</div>
                    <div className="mt-1 text-[12px] text-white/80">بحوث</div>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3 text-center">
                    <div className="text-[20px] font-extrabold text-white">
                      {totalConferencesCount +
                        totalSeminarsCount +
                        totalCoursesCount +
                        totalWorkshopsCount +
                        totalCommitteesCount +
                        totalPositionsCount +
                        totalThankYouBooksCount +
                        totalAssignmentsCount +
                        totalSupervisionCount +
                        totalJournalMembershipsCount +
                        totalScientificEvaluationsCount +
                        totalVolunteerWorkCount +
                        totalParticipationCertificatesCount +
                        totalPublicationsCount}
                    </div>
                    <div className="mt-1 text-[12px] text-white/80">نشاطات</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: activities summary */}
            <DesktopCard title="ملخص النشاطات" subtitle="تفصيل سريع للنشاطات" className="md:col-span-12 lg:col-span-4 lg:order-2 md:h-full">
              <div className="space-y-2" dir="rtl">
                {[
                  ["المؤتمرات", totalConferencesCount],
                  ["الندوات", totalSeminarsCount],
                  ["الدورات", totalCoursesCount],
                  ["ورش العمل", totalWorkshopsCount],
                  ["اللجان", totalCommitteesCount],
                  ["المناصب", totalPositionsCount],
                  ["كتب الشكر", totalThankYouBooksCount],
                  ["التكليفات", totalAssignmentsCount],
                  ["الإشراف على الطلبة", totalSupervisionCount],
                  ["إدارة المجلات", totalJournalMembershipsCount],
                  ["التقويم العلمي", totalScientificEvaluationsCount],
                  ["الأعمال الطوعية", totalVolunteerWorkCount],
                  ["شهادات المشاركة", totalParticipationCertificatesCount],
                  ["المؤلفات", totalPublicationsCount],
                ].map(([label, v]) => (
                  <div key={label as string} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">{label as string}</span>
                    <span className="font-extrabold text-slate-900">{v as number}</span>
                  </div>
                ))}
              </div>
            </DesktopCard>

            {/* Right: research summary */}
            <DesktopCard title="ملخص البحوث" subtitle="تفصيل سريع للبحوث" className="md:col-span-12 lg:col-span-4 lg:order-3 md:h-full">
              <div className="space-y-2" dir="rtl">
                {[
                  ["البحوث المخططة", researchStats.planned],
                  ["البحوث المنجزة", researchStats.completed],
                  ["البحوث المنشورة", researchStats.published],
                  ["البحوث غير المنجزة", researchStats.uncompleted],
                ].map(([label, v]) => (
                  <div key={label as string} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">{label as string}</span>
                    <span className="font-extrabold text-slate-900">{v as number}</span>
                  </div>
                ))}
                <div className="pt-3 mt-3 border-t border-slate-200/70 flex items-center justify-between">
                  <span className="text-[13px] font-bold text-slate-700">المجموع</span>
                  <span className="text-[18px] font-extrabold text-slate-900">{totalResearchCount}</span>
                </div>
              </div>
            </DesktopCard>
          </div>
        </div>
      </div>
    </div>
  );
}
