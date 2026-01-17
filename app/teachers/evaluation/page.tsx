"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayout } from "../layout";

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
  return monthNames[monthValue] || monthValue;
}

interface PointsBreakdown {
  research: Array<{ id: number | null; title: string; year: string; points: number; details: any }>;
  conferences: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  positions: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  publications: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  courses: Array<{ id: number | null; title: string; year: string; points: number; details: any }>;
  seminars: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  workshops: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  assignments: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  volunteerWork: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  committees: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  thankYouBooks: Array<{ id: number; title: string; year: string; points: number; details: any }>;
  supervision: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  scientificEvaluations: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  journalMemberships: Array<{ id: number; title: string; year: number; points: number; details: any }>;
}

interface PointsData {
  totalPoints: number;
  breakdown: PointsBreakdown;
  summary: {
    research: number;
    conferences: number;
    positions: number;
    publications: number;
    courses: number;
    seminars: number;
    workshops: number;
    assignments: number;
    volunteerWork: number;
    committees: number;
    thankYouBooks: number;
    supervision: number;
    scientificEvaluations: number;
    journalMemberships: number;
  };
}

const activityLabels: { [key: string]: { label: string; color: string; icon: string } } = {
  research: { label: "البحوث العلمية", color: "purple", icon: "📚" },
  conferences: { label: "المؤتمرات", color: "blue", icon: "🏛️" },
  positions: { label: "المناصب", color: "slate", icon: "🎓" },
  publications: { label: "المؤلفات", color: "indigo", icon: "📖" },
  courses: { label: "الدورات", color: "emerald", icon: "🧑‍🏫" },
  seminars: { label: "الندوات", color: "violet", icon: "🗣️" },
  workshops: { label: "ورش العمل", color: "yellow", icon: "🛠️" },
  assignments: { label: "التكليفات", color: "orange", icon: "📌" },
  volunteerWork: { label: "الأعمال الطوعية", color: "rose", icon: "🤝" },
  committees: { label: "اللجان", color: "cyan", icon: "👥" },
  thankYouBooks: { label: "كتب الشكر", color: "pink", icon: "🏅" },
  supervision: { label: "الإشراف", color: "green", icon: "🎓" },
  scientificEvaluations: { label: "التقويم العلمي", color: "amber", icon: "🧪" },
  journalMemberships: { label: "إدارة المجلات", color: "teal", icon: "📖" },
};

// Function to format details in Arabic
function formatDetails(details: any): string {
  if (!details || typeof details !== 'object') return "-";

  const parts: string[] = [];

  // Research details
  if (details.status) {
    parts.push(`الحالة: ${details.status}`);
  }
  if (details.scopusQuartile) {
    if (details.scopusQuartile === "غير سكوبس" || details.scopusQuartile === "غير سكوبس") {
      parts.push(`تصنيف Scopus: غير سكوبس`);
    } else {
      parts.push(`تصنيف Scopus: ${details.scopusQuartile}`);
    }
  }
  if (details.type === "annual_bonus") {
    if (details.count !== undefined) {
      parts.push(`مكافأة عدد البحوث: ${details.count} ${details.count === 1 ? 'بحث' : 'بحوث'}`);
    } else {
      parts.push("مكافأة سنوية");
    }
  }

  // Conference details
  if (details.scope) {
    parts.push(`النطاق: ${details.scope === "global" ? "عالمي" : "محلي"}`);
  }
  if (details.type && details.type !== "annual_bonus") {
    const typeLabel = details.type === "participant" || details.type === "باحث" ? "باحث" : 
                     details.type === "lecturer" ? "محاضر" : "حضور";
    parts.push(`النوع: ${typeLabel}`);
  }
  if (details.isCommittee !== undefined && details.isCommittee) {
    parts.push("عضو لجنة علمية");
  }

  // Position details
  if (details.role && details.type !== "annual_bonus") {
    parts.push(`الدور: ${details.role}`);
  }
  if (details.sourceType) {
    parts.push(`المصدر: ${details.sourceType}`);
  }
  if (details.degreeType) {
    parts.push(`نوع الدرجة: ${details.degreeType}`);
  }

  // Publication details
  if (details.publicationType) {
    parts.push(`النوع: ${details.publicationType}`);
  }

  // Course/Seminar/Workshop type
  if (details.type && details.type !== "annual_bonus" && !details.scope && !details.isCommittee) {
    if (details.type === "lecturer") {
      parts.push("المدرب / المحاضر");
    } else if (details.type === "participant") {
      parts.push("المشارك");
    }
  }

  return parts.length > 0 ? parts.join(" • ") : "-";
}

export default function EvaluationPage() {
  const { user } = useLayout();
  const [pointsData, setPointsData] = useState<PointsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [selectedYear, setSelectedYear] = useState(getAcademicYear());
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [periodPointsData, setPeriodPointsData] = useState<PointsData | null>(null);
  const [isLoadingPeriod, setIsLoadingPeriod] = useState(false);
  const [rankingData, setRankingData] = useState<{
    collegeRank: number;
    totalUsersInCollege: number;
    departmentRank: number;
    totalUsersInDepartment: number;
    userPoints: number;
    userDepartment: string;
  } | null>(null);
  const [isLoadingRanking, setIsLoadingRanking] = useState(false);

  useEffect(() => {
    const fetchPoints = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPointsData(data);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoints();
  }, [user]);

  // Fetch ranking data
  useEffect(() => {
    const fetchRanking = async () => {
      if (!user) return;

      try {
        setIsLoadingRanking(true);
        const response = await fetch(`/api/teachers/ranking?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setRankingData(data);
        }
      } catch (error) {
        console.error("Error fetching ranking:", error);
      } finally {
        setIsLoadingRanking(false);
      }
    };

    fetchRanking();
  }, [user]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Fetch points for selected period
  useEffect(() => {
    const fetchPeriodPoints = async () => {
      if (!user) return;

      try {
        setIsLoadingPeriod(true);
        const response = await fetch(`/api/teachers/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          // Filter points by selected year and month
          const filteredBreakdown: PointsBreakdown = {
            research: [],
            conferences: [],
            positions: [],
            publications: [],
            courses: [],
            seminars: [],
            workshops: [],
            assignments: [],
            volunteerWork: [],
            committees: [],
            thankYouBooks: [],
            supervision: [],
            scientificEvaluations: [],
            journalMemberships: [],
          };

          let totalPeriodPoints = 0;

          // Helper function to check if date is in range
          const isInDateRange = (dateStr: string | null, year: string, month: string): boolean => {
            if (!dateStr) return false;
            const date = new Date(dateStr);
            const [yearStart] = year.split("-");
            const yearStartNum = parseInt(yearStart);
            const yearEndNum = yearStartNum + 1;
            const dateYear = date.getFullYear();
            const dateMonth = date.getMonth() + 1; // 1-12
            
            if (month === "all") {
              if (dateYear === yearStartNum) {
                return dateMonth >= 8; // Aug (8) to Dec (12)
              } else if (dateYear === yearEndNum) {
                return dateMonth < 8; // Jan (1) to Jul (7)
              }
              return false;
            } else {
              const monthNum = parseInt(month);
              if (monthNum >= 8) {
                return dateYear === yearStartNum && dateMonth === monthNum;
              } else {
                return dateYear === yearEndNum && dateMonth === monthNum;
              }
            }
          };

          // Filter research by year
          const researchYearMatch = (r: any) => {
            const rYear = r.year?.toString() || "";
            const [yearStart] = selectedYear.split("-");
            return rYear === yearStart || rYear === (parseInt(yearStart) + 1).toString();
          };

          // Filter by month/year for thank you books
          const monthYearMatch = (item: any, year: string | number | null, month: string | null) => {
            if (selectedMonth === "all") {
              const itemYear = typeof year === "string" ? parseInt(year) : year;
              const [yearStart] = selectedYear.split("-");
              return itemYear === parseInt(yearStart) || itemYear === parseInt(yearStart) + 1;
            } else {
              const monthNames: { [key: string]: number } = {
                "يناير": 1, "فبراير": 2, "مارس": 3, "أبريل": 4, "مايو": 5, "يونيو": 6,
                "يوليو": 7, "أغسطس": 8, "سبتمبر": 9, "أكتوبر": 10, "نوفمبر": 11, "ديسمبر": 12
              };
              const itemMonthNum = monthNames[month || ""] || 0;
              const selectedMonthNum = parseInt(selectedMonth);
              const itemYear = typeof year === "string" ? parseInt(year) : year;
              const [yearStart] = selectedYear.split("-");
              const yearStartNum = parseInt(yearStart);
              
              if (itemMonthNum >= 8) {
                return itemYear === yearStartNum && itemMonthNum === selectedMonthNum;
              } else {
                return itemYear === yearStartNum + 1 && itemMonthNum === selectedMonthNum;
              }
            }
          };

          // Filter all activities based on year
          Object.keys(data.breakdown).forEach((key) => {
            const items = data.breakdown[key as keyof PointsBreakdown];
            items.forEach((item: any) => {
              let shouldInclude = false;
              
              if (key === "research") {
                // Research uses year field directly
                shouldInclude = researchYearMatch(item);
              } else if (key === "thankYouBooks") {
                // Thank you books have year and month fields
                shouldInclude = monthYearMatch(item, item.year, null);
              } else {
                // For other activities, check year from item.year
                const year = typeof item.year === "string" ? parseInt(item.year) : item.year;
                const [yearStart] = selectedYear.split("-");
                const yearStartNum = parseInt(yearStart);
                
                if (selectedMonth === "all") {
                  // Include if year matches academic year range
                  shouldInclude = year === yearStartNum || year === yearStartNum + 1;
                } else {
                  // For specific month, we need to check if the item's date matches
                  // Since we don't have exact date in breakdown, we'll include based on year match
                  // This is an approximation - for exact month filtering, we'd need the full data
                  shouldInclude = year === yearStartNum || year === yearStartNum + 1;
                }
              }

              if (shouldInclude) {
                filteredBreakdown[key as keyof PointsBreakdown].push(item);
                totalPeriodPoints += item.points;
              }
            });
          });

          setPeriodPointsData({
            totalPoints: totalPeriodPoints,
            breakdown: filteredBreakdown,
            summary: {
              research: filteredBreakdown.research.reduce((sum, r) => sum + r.points, 0),
              conferences: filteredBreakdown.conferences.reduce((sum, c) => sum + c.points, 0),
              positions: filteredBreakdown.positions.reduce((sum, p) => sum + p.points, 0),
              publications: filteredBreakdown.publications.reduce((sum, p) => sum + p.points, 0),
              courses: filteredBreakdown.courses.reduce((sum, c) => sum + c.points, 0),
              seminars: filteredBreakdown.seminars.reduce((sum, s) => sum + s.points, 0),
              workshops: filteredBreakdown.workshops.reduce((sum, w) => sum + w.points, 0),
              assignments: filteredBreakdown.assignments.reduce((sum, a) => sum + a.points, 0),
              volunteerWork: filteredBreakdown.volunteerWork.reduce((sum, v) => sum + v.points, 0),
              committees: filteredBreakdown.committees.reduce((sum, c) => sum + c.points, 0),
              thankYouBooks: filteredBreakdown.thankYouBooks.reduce((sum, b) => sum + b.points, 0),
              supervision: filteredBreakdown.supervision.reduce((sum, s) => sum + s.points, 0),
              scientificEvaluations: filteredBreakdown.scientificEvaluations.reduce((sum, e) => sum + e.points, 0),
              journalMemberships: filteredBreakdown.journalMemberships.reduce((sum, j) => sum + j.points, 0),
            }
          });
        }
      } catch (error) {
        console.error("Error fetching period points:", error);
      } finally {
        setIsLoadingPeriod(false);
      }
    };

    fetchPeriodPoints();
  }, [user, selectedYear, selectedMonth]);

  // Calculate evaluation scores
  const evaluationScores = useMemo(() => {
    if (!periodPointsData) return null;

    const periodPoints = periodPointsData.totalPoints;
    
    // مقارنة مع أهداف الخطة العلمية (Target: 100 points per academic year)
    const planTarget = 100;
    const planAchievement = Math.min((periodPoints / planTarget) * 100, 100);
    const planGrade = planAchievement >= 90 ? "ممتاز" : 
                     planAchievement >= 75 ? "جيد جداً" :
                     planAchievement >= 60 ? "جيد" :
                     planAchievement >= 50 ? "مقبول" : "يحتاج تحسين";

    // مقارنة مع المعايير الدولية (International Standards: 150 points per year)
    const internationalTarget = 150;
    const internationalAchievement = Math.min((periodPoints / internationalTarget) * 100, 100);
    const internationalGrade = internationalAchievement >= 90 ? "ممتاز" :
                               internationalAchievement >= 75 ? "جيد جداً" :
                               internationalAchievement >= 60 ? "جيد" :
                               internationalAchievement >= 50 ? "مقبول" : "يحتاج تحسين";

    // تقييم شامل (Comprehensive Evaluation)
    const comprehensiveScore = (planAchievement * 0.4) + (internationalAchievement * 0.6);
    const comprehensiveGrade = comprehensiveScore >= 90 ? "ممتاز" :
                               comprehensiveScore >= 75 ? "جيد جداً" :
                               comprehensiveScore >= 60 ? "جيد" :
                               comprehensiveScore >= 50 ? "مقبول" : "يحتاج تحسين";

    return {
      planTarget,
      planAchievement: Math.round(planAchievement),
      planGrade,
      internationalTarget,
      internationalAchievement: Math.round(internationalAchievement),
      internationalGrade,
      comprehensiveScore: Math.round(comprehensiveScore),
      comprehensiveGrade,
      periodPoints
    };
  }, [periodPointsData]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">جاري حساب النقاط...</p>
        </div>
      </div>
    );
  }

  if (!pointsData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <p className="text-gray-600">لا توجد بيانات نقاط متاحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period-based Evaluation Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: '#1F2937' }}>التقييم حسب الفترة</h2>
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              >
                {Array.from({ length: 10 }, (_, i) => {
                  const year = 2024 + i;
                  const nextYear = year + 1;
                  return (
                    <option key={year} value={`${year}-${nextYear}`}>
                      {year}-{nextYear}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Month Selector */}
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
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

        {isLoadingPeriod ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري حساب التقييم...</p>
          </div>
        ) : evaluationScores ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* مقارنة مع أهداف الخطة العلمية */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>مقارنة مع أهداف الخطة العلمية</h3>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">النقاط المحققة:</span>
                  <span className="text-xl font-bold text-blue-600">{evaluationScores.periodPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الهدف المستهدف:</span>
                  <span className="text-lg font-medium" style={{ color: '#1F2937' }}>{evaluationScores.planTarget} نقطة</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(evaluationScores.planAchievement, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-600">نسبة التحقق:</span>
                  <span className="text-xl font-bold text-blue-600">{evaluationScores.planAchievement}%</span>
                </div>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <span className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-lg font-bold">
                    {evaluationScores.planGrade}
                  </span>
                </div>
              </div>
            </div>

            {/* مقارنة مع المعايير الدولية */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>مقارنة مع المعايير الدولية</h3>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">النقاط المحققة:</span>
                  <span className="text-xl font-bold text-purple-600">{evaluationScores.periodPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">المعيار الدولي:</span>
                  <span className="text-lg font-medium" style={{ color: '#1F2937' }}>{evaluationScores.internationalTarget} نقطة</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div 
                    className="bg-gradient-to-r from-purple-500 to-pink-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(evaluationScores.internationalAchievement, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-600">نسبة التحقق:</span>
                  <span className="text-xl font-bold text-purple-600">{evaluationScores.internationalAchievement}%</span>
                </div>
                <div className="mt-4 pt-4 border-t border-purple-200">
                  <span className="inline-block px-4 py-2 bg-purple-100 text-purple-800 rounded-lg font-bold">
                    {evaluationScores.internationalGrade}
                  </span>
                </div>
              </div>
            </div>

            {/* تقييم شامل */}
            <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-xl p-6 border-2 border-indigo-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>تقييم شامل</h3>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-pink-600 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">النقاط الإجمالية:</span>
                  <span className="text-xl font-bold text-indigo-600">{evaluationScores.periodPoints}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">الفترة المحددة:</span>
                  <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
                    {getMonthName(selectedMonth)} {selectedYear}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(evaluationScores.comprehensiveScore, 100)}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm text-gray-600">النتيجة الشاملة:</span>
                  <span className="text-xl font-bold text-indigo-600">{evaluationScores.comprehensiveScore}%</span>
                </div>
                <div className="mt-4 pt-4 border-t border-indigo-200">
                  <span className="inline-block px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-800 rounded-lg font-bold">
                    {evaluationScores.comprehensiveGrade}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            لا توجد بيانات للفترة المحددة
          </div>
        )}
      </div>

      {/* Ranking Section */}
      {isLoadingRanking ? (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري حساب الترتيب...</p>
          </div>
        </div>
      ) : rankingData ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* College Rank */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>ترتيب التدريسي بين زملائه في الكلية</h3>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-emerald-600 mb-2">{rankingData.collegeRank}</div>
                <div className="text-lg text-gray-600">من {rankingData.totalUsersInCollege} تدريسي</div>
              </div>
              <div className="pt-4 border-t border-emerald-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">نقاطك الإجمالية:</span>
                  <span className="text-xl font-bold text-emerald-600">{rankingData.userPoints}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${((rankingData.totalUsersInCollege - rankingData.collegeRank + 1) / rankingData.totalUsersInCollege) * 100}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  نسبة التفوق: {Math.round(((rankingData.totalUsersInCollege - rankingData.collegeRank + 1) / rankingData.totalUsersInCollege) * 100)}%
                </div>
              </div>
            </div>
          </div>

          {/* Department Rank */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-2 border-amber-200 shadow-md hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>ترتيب التدريسي بين زملائه في القسم</h3>
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-6xl font-bold text-amber-600 mb-2">{rankingData.departmentRank}</div>
                <div className="text-lg text-gray-600">من {rankingData.totalUsersInDepartment} تدريسي في القسم</div>
              </div>
              <div className="pt-4 border-t border-amber-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">نقاطك الإجمالية:</span>
                  <span className="text-xl font-bold text-amber-600">{rankingData.userPoints}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-3">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${rankingData.totalUsersInDepartment > 0 ? ((rankingData.totalUsersInDepartment - rankingData.departmentRank + 1) / rankingData.totalUsersInDepartment) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="text-xs text-gray-500 mt-2 text-center">
                  نسبة التفوق: {rankingData.totalUsersInDepartment > 0 ? Math.round(((rankingData.totalUsersInDepartment - rankingData.departmentRank + 1) / rankingData.totalUsersInDepartment) * 100) : 0}%
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Total Points Card */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-lg border border-indigo-400 p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-2">إجمالي النقاط العلمية</h2>
          <div className="text-7xl font-bold text-white mb-4">{pointsData.totalPoints}</div>
          <p className="text-white/90 text-lg">نقطة علمية</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Object.entries(pointsData.summary).map(([key, points]) => {
          const activity = activityLabels[key];
          if (!activity || points === 0) return null;

          const colorClasses: { [key: string]: string } = {
            purple: "from-purple-400 to-purple-600",
            blue: "from-blue-400 to-blue-600",
            slate: "from-slate-400 to-slate-600",
            indigo: "from-indigo-400 to-indigo-600",
            emerald: "from-emerald-400 to-emerald-600",
            violet: "from-violet-400 to-violet-600",
            yellow: "from-yellow-400 to-yellow-600",
            orange: "from-orange-400 to-orange-600",
            rose: "from-rose-400 to-rose-600",
            cyan: "from-cyan-400 to-cyan-600",
            pink: "from-pink-400 to-pink-600",
            green: "from-green-400 to-green-600",
            amber: "from-amber-400 to-amber-600",
            teal: "from-teal-400 to-teal-600",
          };

          return (
            <div
              key={key}
              className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => toggleSection(key)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${colorClasses[activity.color]} flex items-center justify-center text-2xl`}>
                    {activity.icon}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-600">{activity.label}</div>
                    <div className="text-2xl font-bold" style={{ color: '#1F2937' }}>{points}</div>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${expandedSections[key] ? "transform rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h3 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>تفاصيل النقاط</h3>
        <div className="space-y-4">
          {Object.entries(pointsData.breakdown).map(([key, items]) => {
            const activity = activityLabels[key];
            if (!activity || items.length === 0) return null;

            const isExpanded = expandedSections[key];

            return (
              <div key={key} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleSection(key)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{activity.icon}</span>
                    <span className="font-bold" style={{ color: '#1F2937' }}>{activity.label}</span>
                    <span className="text-sm text-gray-600">({items.length} نشاط)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-indigo-600">
                      {items.reduce((sum: number, item: { points: number }) => sum + item.points, 0)} نقطة
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? "transform rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">العنوان</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">السنة</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">النقاط</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">التفاصيل</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {items.map((item: { title: string; year: number | string; points: number; details: any }, index: number) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm" style={{ color: '#1F2937' }}>{item.title}</td>
                              <td className="px-4 py-2 text-sm text-gray-600">{item.year}</td>
                              <td className="px-4 py-2 text-sm font-bold text-indigo-600">{item.points}</td>
                              <td className="px-4 py-2 text-sm">
                                {formatDetails(item.details) !== "-" ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {formatDetails(item.details).split(" • ").map((detail, idx) => (
                                      <span key={idx} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                                        {detail}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
