"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayout } from "../layout";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// Get academic year based on current year
function getAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}

interface ActivityData {
  id: number;
  date?: string;
  start_date?: string;
  assignment_date?: string;
  evaluation_date?: string;
  year?: string | number;
  month?: string;
  created_at?: string;
}

export default function AnalyticsPage() {
  const { user } = useLayout();
  const [selectedYearRange, setSelectedYearRange] = useState<number>(3); // Last 3 years
  const [isLoading, setIsLoading] = useState(true);
  
  // Data states
  const [research, setResearch] = useState<any[]>([]);
  const [conferences, setConferences] = useState<any[]>([]);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [supervision, setSupervision] = useState<any[]>([]);
  const [scientificEvaluations, setScientificEvaluations] = useState<any[]>([]);
  const [journalMemberships, setJournalMemberships] = useState<any[]>([]);
  const [volunteerWork, setVolunteerWork] = useState<any[]>([]);

  // Fetch all data
  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [researchRes, conferencesRes, seminarsRes, coursesRes, workshopsRes, 
               publicationsRes, positionsRes, committeesRes, assignmentsRes, 
               supervisionRes, scientificEvaluationsRes, journalMembershipsRes, 
               volunteerWorkRes] = await Promise.all([
          fetch(`/api/teachers/research?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/conferences?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/seminars?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/courses?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/workshops?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/publications?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/positions?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/committees?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/assignments?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/supervision?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/scientific-evaluation?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/journals-management?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/volunteer-work?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
        ]);

        if (researchRes.ok && researchRes instanceof Response) setResearch(await researchRes.json());
        if (conferencesRes.ok && conferencesRes instanceof Response) setConferences(await conferencesRes.json());
        if (seminarsRes.ok && seminarsRes instanceof Response) setSeminars(await seminarsRes.json());
        if (coursesRes.ok && coursesRes instanceof Response) setCourses(await coursesRes.json());
        if (workshopsRes.ok && workshopsRes instanceof Response) setWorkshops(await workshopsRes.json());
        if (publicationsRes.ok && publicationsRes instanceof Response) setPublications(await publicationsRes.json());
        if (positionsRes.ok && positionsRes instanceof Response) setPositions(await positionsRes.json());
        if (committeesRes.ok && committeesRes instanceof Response) setCommittees(await committeesRes.json());
        if (assignmentsRes.ok && assignmentsRes instanceof Response) setAssignments(await assignmentsRes.json());
        if (supervisionRes.ok && supervisionRes instanceof Response) setSupervision(await supervisionRes.json());
        if (scientificEvaluationsRes.ok && scientificEvaluationsRes instanceof Response) setScientificEvaluations(await scientificEvaluationsRes.json());
        if (journalMembershipsRes.ok && journalMembershipsRes instanceof Response) setJournalMemberships(await journalMembershipsRes.json());
        if (volunteerWorkRes.ok && volunteerWorkRes instanceof Response) setVolunteerWork(await volunteerWorkRes.json());
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  // Helper to get year from date or year field
  const getYear = (item: any): number => {
    if (item.year) {
      const year = typeof item.year === "string" ? parseInt(item.year) : item.year;
      return year || new Date().getFullYear();
    }
    const dateStr = item.date || item.start_date || item.assignment_date || item.evaluation_date || item.created_at;
    if (dateStr) {
      return new Date(dateStr).getFullYear();
    }
    return new Date().getFullYear();
  };

  // Calculate total activities per year
  const activitiesByYear = useMemo(() => {
    const yearsMap: { [year: number]: number } = {};
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - selectedYearRange + 1;

    // Initialize years
    for (let y = startYear; y <= currentYear; y++) {
      yearsMap[y] = 0;
    }

    // Count all activities
    const allActivities = [
      ...research,
      ...conferences,
      ...seminars,
      ...courses,
      ...workshops,
      ...publications,
      ...positions,
      ...committees,
      ...assignments,
      ...supervision,
      ...scientificEvaluations,
      ...journalMemberships,
      ...volunteerWork,
    ];

    allActivities.forEach((item) => {
      const year = getYear(item);
      if (year >= startYear && year <= currentYear) {
        yearsMap[year] = (yearsMap[year] || 0) + 1;
      }
    });

    return Object.entries(yearsMap)
      .map(([year, count]) => ({
        year: parseInt(year),
        activities: count,
      }))
      .sort((a, b) => a.year - b.year);
  }, [research, conferences, seminars, courses, workshops, publications, positions, committees, assignments, supervision, scientificEvaluations, journalMemberships, volunteerWork, selectedYearRange]);

  // Calculate growth rate
  const growthRate = useMemo(() => {
    if (activitiesByYear.length < 2) return 0;
    
    const recent = activitiesByYear.slice(-2);
    if (recent[0].activities === 0) return recent[1].activities > 0 ? 100 : 0;
    
    const rate = ((recent[1].activities - recent[0].activities) / recent[0].activities) * 100;
    return Math.round(rate);
  }, [activitiesByYear]);

  // Find best productive periods
  const bestPeriods = useMemo(() => {
    const monthlyData: { [key: string]: number } = {};
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - selectedYearRange + 1;

    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

    const allActivities = [
      ...research,
      ...conferences,
      ...seminars,
      ...courses,
      ...workshops,
      ...publications,
      ...positions,
      ...committees,
      ...assignments,
      ...supervision,
      ...scientificEvaluations,
      ...journalMemberships,
      ...volunteerWork,
    ];

    allActivities.forEach((item) => {
      let year = getYear(item);
      let month = 1;

      if (item.month) {
        const monthIndex = monthNames.findIndex(m => m === item.month);
        month = monthIndex >= 0 ? monthIndex + 1 : 1;
      } else {
        const dateStr = item.date || item.start_date || item.assignment_date || item.evaluation_date;
        if (dateStr) {
          const date = new Date(dateStr);
          year = date.getFullYear();
          month = date.getMonth() + 1;
        }
      }

      if (year >= startYear && year <= currentYear) {
        const key = `${year}-${month}`;
        monthlyData[key] = (monthlyData[key] || 0) + 1;
      }
    });

    const periods = Object.entries(monthlyData)
      .map(([key, count]) => {
        const [y, m] = key.split("-").map(Number);
        return {
          period: `${monthNames[m - 1]} ${y}`,
          year: y,
          month: m,
          monthName: monthNames[m - 1],
          count,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 periods

    return periods;
  }, [research, conferences, seminars, courses, workshops, publications, positions, committees, assignments, supervision, scientificEvaluations, journalMemberships, volunteerWork, selectedYearRange]);

  // Calculate productivity trend (by month for last year)
  const productivityTrend = useMemo(() => {
    const monthlyTrend: { [key: string]: number } = {};
    const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - selectedYearRange + 1;

    // Initialize all months in range
    for (let y = startYear; y <= currentYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const key = `${y}-${m}`;
        monthlyTrend[key] = 0;
      }
    }

    const allActivities = [
      ...research,
      ...conferences,
      ...seminars,
      ...courses,
      ...workshops,
      ...publications,
      ...positions,
      ...committees,
      ...assignments,
      ...supervision,
      ...scientificEvaluations,
      ...journalMemberships,
      ...volunteerWork,
    ];

    allActivities.forEach((item) => {
      let year = getYear(item);
      let month = 1;

      if (item.month) {
        const monthIndex = monthNames.findIndex(m => m === item.month);
        month = monthIndex >= 0 ? monthIndex + 1 : 1;
      } else {
        const dateStr = item.date || item.start_date || item.assignment_date || item.evaluation_date;
        if (dateStr) {
          const date = new Date(dateStr);
          year = date.getFullYear();
          month = date.getMonth() + 1;
        }
      }

      if (year >= startYear && year <= currentYear) {
        const key = `${year}-${month}`;
        monthlyTrend[key] = (monthlyTrend[key] || 0) + 1;
      }
    });

    // Convert to array format for chart
    const trendData: Array<{ period: string; activities: number; year: number; month: number }> = [];
    for (let y = startYear; y <= currentYear; y++) {
      for (let m = 1; m <= 12; m++) {
        const key = `${y}-${m}`;
        if (monthlyTrend[key] > 0 || y === currentYear) {
          trendData.push({
            period: `${monthNames[m - 1]} ${y}`,
            activities: monthlyTrend[key] || 0,
            year: y,
            month: m,
          });
        }
      }
    }

    return trendData.slice(-24); // Last 24 months or all if less
  }, [research, conferences, seminars, courses, workshops, publications, positions, committees, assignments, supervision, scientificEvaluations, journalMemberships, volunteerWork, selectedYearRange]);

  // Research Type Distribution
  const researchTypeDistribution = useMemo(() => {
    const distribution: { [key: string]: number } = {
      "مخططة": 0,
      "غير مخططة": 0,
    };

    research.forEach((item) => {
      if (item.research_type === "planned" || item.research_type === "مخططة") {
        distribution["مخططة"] = (distribution["مخططة"] || 0) + 1;
      } else if (item.research_type === "unplanned" || item.research_type === "غير مخططة") {
        distribution["غير مخططة"] = (distribution["غير مخططة"] || 0) + 1;
      }
    });

    return Object.entries(distribution).map(([name, value]) => ({ name, value }));
  }, [research]);

  // Helper function to normalize classifications
  const normalizeClassifications = (classifications: any): string[] => {
    if (!classifications) return [];
    if (Array.isArray(classifications)) {
      return classifications.map((c: any) => String(c || '').toLowerCase().trim());
    }
    if (typeof classifications === 'string') {
      try {
        const parsed = JSON.parse(classifications);
        if (Array.isArray(parsed)) {
          return parsed.map((c: any) => String(c || '').toLowerCase().trim());
        }
        return [String(parsed).toLowerCase().trim()];
      } catch {
        return [classifications.toLowerCase().trim()];
      }
    }
    return [];
  };

  // Global vs Local Research Ratio
  // Matching logic from research/page.tsx lines 509-510 and dashboard/page.tsx lines 334, 336
  const globalVsLocalResearch = useMemo(() => {
    let globalCount = 0;
    let localCount = 0;

    research.forEach((item) => {
      // Exact match with research page: only "global" in classifications
      if (item.classifications?.includes("global")) {
        globalCount++;
      }
      // Exact match with research page: only "local" in classifications
      if (item.classifications?.includes("local")) {
        localCount++;
      }
    });

    return [
      { name: "عالمية", value: globalCount },
      { name: "محلية", value: localCount },
    ];
  }, [research]);

  // Research Quality Analysis (Q1, Q2, Q3, Q4)
  // Only count research with "scopus" in classifications (matching research page logic)
  const researchQualityAnalysis = useMemo(() => {
    const quality: { [key: string]: number } = {
      "Q1": 0,
      "Q2": 0,
      "Q3": 0,
      "Q4": 0,
      "غير مصنف": 0,
    };

    research.forEach((item) => {
      // Only process research with "scopus" in classifications
      if (!item.classifications?.includes("scopus")) {
        return; // Skip non-scopus research
      }
      
      const quartile = item.scopus_quartile;
      if (quartile === "Q1" || quartile === "q1") {
        quality["Q1"] = (quality["Q1"] || 0) + 1;
      } else if (quartile === "Q2" || quartile === "q2") {
        quality["Q2"] = (quality["Q2"] || 0) + 1;
      } else if (quartile === "Q3" || quartile === "q3") {
        quality["Q3"] = (quality["Q3"] || 0) + 1;
      } else if (quartile === "Q4" || quartile === "q4") {
        quality["Q4"] = (quality["Q4"] || 0) + 1;
      } else {
        quality["غير مصنف"] = (quality["غير مصنف"] || 0) + 1;
      }
    });

    return Object.entries(quality)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [research]);

  // Research Quality Trend Over Time
  const researchQualityTrend = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - selectedYearRange + 1;

    const yearMap: { [year: number]: { Q1: number; Q2: number; Q3: number; Q4: number; unclassified: number } } = {};

    // Initialize years
    for (let y = startYear; y <= currentYear; y++) {
      yearMap[y] = { Q1: 0, Q2: 0, Q3: 0, Q4: 0, unclassified: 0 };
    }

    research.forEach((item) => {
      // Only process research with "scopus" in classifications (matching research page logic)
      if (!item.classifications?.includes("scopus")) {
        return; // Skip non-scopus research
      }
      
      const year = getYear(item);
      if (year >= startYear && year <= currentYear) {
        const quartile = item.scopus_quartile;
        if (quartile === "Q1" || quartile === "q1") {
          yearMap[year].Q1++;
        } else if (quartile === "Q2" || quartile === "q2") {
          yearMap[year].Q2++;
        } else if (quartile === "Q3" || quartile === "q3") {
          yearMap[year].Q3++;
        } else if (quartile === "Q4" || quartile === "q4") {
          yearMap[year].Q4++;
        } else {
          yearMap[year].unclassified++;
        }
      }
    });

    return Object.entries(yearMap)
      .map(([year, data]) => ({
        year: parseInt(year),
        "Q1": data.Q1,
        "Q2": data.Q2,
        "Q3": data.Q3,
        "Q4": data.Q4,
        "غير مصنف": data.unclassified,
      }))
      .sort((a, b) => a.year - b.year);
  }, [research, selectedYearRange]);

  // Key Performance Indicators (KPIs)
  const kpis = useMemo(() => {
    const totalResearch = research.length;
    const publishedResearch = research.filter((item) => item.is_published).length;
    
    // Helper function to normalize classifications
    const normalizeClassifications = (classifications: any): string[] => {
      if (!classifications) return [];
      if (Array.isArray(classifications)) {
        return classifications.map((c: any) => String(c || '').toLowerCase().trim());
      }
      if (typeof classifications === 'string') {
        try {
          const parsed = JSON.parse(classifications);
          if (Array.isArray(parsed)) {
            return parsed.map((c: any) => String(c || '').toLowerCase().trim());
          }
          return [String(parsed).toLowerCase().trim()];
        } catch {
          return [classifications.toLowerCase().trim()];
        }
      }
      return [];
    };
    
    // Scopus Research: ONLY research with "scopus" in classifications (matching research and dashboard pages)
    const scopusResearch = research.filter((item) => {
      // Match exact logic from research/page.tsx line 508 and dashboard/page.tsx line 338
      return item.classifications?.includes("scopus") || false;
    }).length;
    // Q1 Research: research with "scopus" in classifications AND scopus_quartile === "Q1"
    // Matching logic from research/page.tsx line 933: quartile only shows for scopus research
    const q1Research = research.filter((item) => {
      // Must have "scopus" in classifications (matching research page display logic)
      const hasScopus = item.classifications?.includes("scopus") || false;
      if (!hasScopus) return false;
      
      // Then check for Q1 quartile
      const quartile = item.scopus_quartile;
      return quartile === "Q1" || quartile === "q1";
    }).length;
    const globalResearch = research.filter((item) => {
      const classifications = normalizeClassifications(item.classifications);
      return classifications.includes("global") || classifications.includes("عالمية") || classifications.includes("عالمي");
    }).length;
    const publishedPercentage = totalResearch > 0 ? Math.round((publishedResearch / totalResearch) * 100) : 0;
    const scopusPercentage = totalResearch > 0 ? Math.round((scopusResearch / totalResearch) * 100) : 0;
    const q1Percentage = totalResearch > 0 ? Math.round((q1Research / totalResearch) * 100) : 0;

    return {
      totalResearch,
      publishedResearch,
      scopusResearch,
      q1Research,
      globalResearch,
      publishedPercentage,
      scopusPercentage,
      q1Percentage,
    };
  }, [research]);

  // Colors for charts
  const COLORS = {
    primary: "#6366F1",
    secondary: "#8B5CF6",
    success: "#10B981",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#3B82F6",
  };

  const PIE_COLORS = ["#6366F1", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#3B82F6"];

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>التحليلات الزمنية والإنتاجية</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600">الفترة الزمنية:</label>
            <select
              value={selectedYearRange}
              onChange={(e) => setSelectedYearRange(parseInt(e.target.value))}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
              style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
            >
              <option value={2}>آخر سنتين</option>
              <option value={3}>آخر 3 سنوات</option>
              <option value={5}>آخر 5 سنوات</option>
              <option value={10}>آخر 10 سنوات</option>
            </select>
          </div>
        </div>
      </div>

      {/* Growth Rate Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>معدل النمو</h3>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="space-y-3">
            <div className="text-center">
              <div className={`text-5xl font-bold mb-2 ${growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {growthRate >= 0 ? '+' : ''}{growthRate}%
              </div>
              <div className="text-sm text-gray-600">مقارنة مع السنة السابقة</div>
            </div>
            {activitiesByYear.length >= 2 && (
              <div className="pt-4 border-t border-green-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{activitiesByYear[activitiesByYear.length - 2].year}:</span>
                  <span className="font-bold" style={{ color: '#1F2937' }}>{activitiesByYear[activitiesByYear.length - 2].activities} نشاط</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-600">{activitiesByYear[activitiesByYear.length - 1].year}:</span>
                  <span className="font-bold text-green-600">{activitiesByYear[activitiesByYear.length - 1].activities} نشاط</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Best Productive Periods */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>أفضل فترات الإنتاجية</h3>
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
          </div>
          {bestPeriods.length > 0 ? (
            <div className="space-y-3">
              {bestPeriods.map((period, index) => {
                const rankLabels = [
                  "أعلى فترة إنتاجية",
                  "ثاني أعلى فترة إنتاجية",
                  "ثالث أعلى فترة إنتاجية",
                  "رابع أعلى فترة إنتاجية",
                  "خامس أعلى فترة إنتاجية"
                ];
                
                return (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400' :
                        index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700' :
                        'bg-gradient-to-br from-blue-400 to-indigo-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-bold" style={{ color: '#1F2937' }}>{period.period}</div>
                        <div className="text-xs text-gray-500">{rankLabels[index] || `المرتبة ${index + 1}`}</div>
                      </div>
                    </div>
                    <div className="text-xl font-bold text-blue-600">{period.count} نشاط</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات كافية</div>
          )}
        </div>
      </div>

      {/* Productivity Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>اتجاه الإنتاجية</h2>
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            توزيع الأنشطة العلمية والأكاديمية عبر الفترات الزمنية
          </p>
        </div>
        {productivityTrend.length > 0 ? (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={400}>
              <AreaChart data={productivityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorActivities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="period" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    color: '#1F2937'
                  }}
                  labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="activities" 
                  stroke="#6366F1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorActivities)" 
                  name="عدد الأنشطة"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
        )}
      </div>

      {/* Yearly Comparison Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>مقارنة الإنتاجية السنوية</h2>
        {activitiesByYear.length > 0 ? (
          <div className="mt-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activitiesByYear} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#6B7280', fontSize: 12 }}
                />
                <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    border: '1px solid #E5E7EB', 
                    borderRadius: '8px',
                    color: '#1F2937'
                  }}
                  labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="activities" 
                  fill="#6366F1" 
                  radius={[8, 8, 0, 0]}
                  name="عدد الأنشطة"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
        )}
      </div>

      {/* Research Analytics Section */}
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>تحليل البحوث العلمية</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-6"></div>

          {/* KPIs Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-5 border-2 border-indigo-200 shadow-md">
              <div className="text-sm text-gray-600 mb-2">إجمالي البحوث</div>
              <div className="text-3xl font-bold text-indigo-600">{kpis.totalResearch}</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 border-2 border-green-200 shadow-md">
              <div className="text-sm text-gray-600 mb-2">بحوث منشورة</div>
              <div className="text-3xl font-bold text-green-600">{kpis.publishedResearch}</div>
              <div className="text-xs text-gray-500 mt-1">{kpis.publishedPercentage}%</div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 border-2 border-blue-200 shadow-md">
              <div className="text-sm text-gray-600 mb-2">بحوث Scopus</div>
              <div className="text-3xl font-bold text-blue-600">{kpis.scopusResearch}</div>
              <div className="text-xs text-gray-500 mt-1">{kpis.scopusPercentage}%</div>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 border-2 border-amber-200 shadow-md">
              <div className="text-sm text-gray-600 mb-2">بحوث Q1</div>
              <div className="text-3xl font-bold text-amber-600">{kpis.q1Research}</div>
              <div className="text-xs text-gray-500 mt-1">{kpis.q1Percentage}%</div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Research Type Distribution */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>توزيع البحوث حسب النوع</h3>
              {researchTypeDistribution.length > 0 && researchTypeDistribution.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={researchTypeDistribution.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {researchTypeDistribution.filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        color: '#1F2937'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
              )}
            </div>

            {/* Global vs Local Research */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>نسبة البحوث العالمية vs المحلية</h3>
              {globalVsLocalResearch.some(item => item.value > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={globalVsLocalResearch.filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {globalVsLocalResearch.filter(item => item.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        color: '#1F2937'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
              )}
            </div>

            {/* Research Quality Analysis */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تحليل جودة البحوث (Quartile)</h3>
              {researchQualityAnalysis.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={researchQualityAnalysis} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#FFFFFF', 
                          border: '1px solid #E5E7EB', 
                          borderRadius: '8px',
                          color: '#1F2937'
                        }}
                        labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="#6366F1" 
                        radius={[8, 8, 0, 0]}
                        name="عدد البحوث"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                    {researchQualityAnalysis.map((item, index) => (
                      <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg font-bold" style={{ color: '#1F2937' }}>{item.value}</div>
                        <div className="text-xs text-gray-600 mt-1">{item.name}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
              )}
            </div>

            {/* Research Quality Trend */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>اتجاه جودة البحوث عبر الزمن</h3>
              {researchQualityTrend.length > 0 && researchQualityTrend.some(item => item.Q1 + item.Q2 + item.Q3 + item.Q4 + item["غير مصنف"] > 0) ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={researchQualityTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="year" 
                      tick={{ fill: '#6B7280', fontSize: 12 }}
                    />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#FFFFFF', 
                        border: '1px solid #E5E7EB', 
                        borderRadius: '8px',
                        color: '#1F2937'
                      }}
                      labelStyle={{ color: '#1F2937', fontWeight: 'bold' }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="Q1" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Q1" />
                    <Line type="monotone" dataKey="Q2" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} name="Q2" />
                    <Line type="monotone" dataKey="Q3" stroke="#F59E0B" strokeWidth={2} dot={{ r: 4 }} name="Q3" />
                    <Line type="monotone" dataKey="Q4" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Q4" />
                    <Line type="monotone" dataKey="غير مصنف" stroke="#9CA3AF" strokeWidth={2} dot={{ r: 4 }} name="غير مصنف" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center py-12 text-gray-500">لا توجد بيانات لعرضها</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
