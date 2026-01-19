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
  return monthNames[monthValue] || "جميع الأشهر";
}

interface Position {
  id: number;
  position_title: string;
  start_date: string | null;
  duration: string | null;
  organization: string | null;
  description: string | null;
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
  const participationCertificatesCountByDate = useMemo(() => 
    participationCertificates.filter(p => isMonthYearInRange(p.month, p.year, selectedYear, selectedMonth)).length,
    [participationCertificates, selectedYear, selectedMonth]
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

  if (!user) {
    return null;
  }

  return (
    <div className="max-[639px]:space-y-4 max-[639px]:text-[14px] max-[639px]:leading-[1.55]">
      {/* General Statistics Section */}
      <div className="bg-gray-50 rounded-lg border border-blue-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4 max-[639px]:shadow-sm max-[639px]:border-slate-200/70">
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
      <div className="bg-gray-50 rounded-lg border border-blue-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4 max-[639px]:shadow-sm max-[639px]:border-slate-200/70">
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
      <div className="bg-white rounded-lg border border-gray-200 p-5 mb-6 shadow-sm hover:shadow-md transition-shadow duration-300 max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:mb-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-300 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
          <h2 className="text-xl font-bold max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>
            إنجازات استمارة الأداء - العام الدراسي {selectedYear}
          </h2>
          <div className="flex items-center gap-3 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:w-full max-[639px]:gap-2 max-[639px]:bg-slate-50 max-[639px]:border max-[639px]:border-slate-200/70 max-[639px]:rounded-2xl max-[639px]:p-3">
            {/* Year Selector */}
            <div className="relative max-[639px]:w-full">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-4 py-2 pr-8 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:w-full max-[639px]:h-11"
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
        <div className="mt-4">
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
    </div>
  );
}
