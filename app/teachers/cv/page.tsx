"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { getAcademicTitleLabel, getDepartmentLabel, formatDate } from "@/lib/utils/academic";

export default function CVPage() {
  const { user } = useLayout();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [cvData, setCVData] = useState<any>(null);
  const [qualifications, setQualifications] = useState<any[]>([]);
  const [research, setResearch] = useState<any[]>([]);
  const [publications, setPublications] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [conferences, setConferences] = useState<any[]>([]);
  const [seminars, setSeminars] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [workshops, setWorkshops] = useState<any[]>([]);
  const [committees, setCommittees] = useState<any[]>([]);
  const [thankYouBooks, setThankYouBooks] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [participationCertificates, setParticipationCertificates] = useState<any[]>([]);
  const [supervision, setSupervision] = useState<any[]>([]);
  const [scientificEvaluations, setScientificEvaluations] = useState<any[]>([]);
  const [journalMemberships, setJournalMemberships] = useState<any[]>([]);
  const [volunteerWork, setVolunteerWork] = useState<any[]>([]);
  const [researcherLinks, setResearcherLinks] = useState<any>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [
          profileRes,
          cvRes,
          qualificationsRes,
          researchRes,
          publicationsRes,
          positionsRes,
          conferencesRes,
          seminarsRes,
          coursesRes,
          workshopsRes,
          committeesRes,
          thankYouBooksRes,
          assignmentsRes,
          participationCertificatesRes,
          supervisionRes,
          scientificEvaluationsRes,
          journalMembershipsRes,
          volunteerWorkRes,
          researcherLinksRes,
        ] = await Promise.all([
          fetch(`/api/teachers/profile?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/profile/cv?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/profile/qualifications?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/research?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/publications?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/positions?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/conferences?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/seminars?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/courses?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/workshops?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/committees?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/thank-you-books?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/assignments?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/participation-certificates?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/supervision?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/scientific-evaluation?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/journals-management?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/volunteer-work?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
          fetch(`/api/teachers/researcher-links?userId=${user.id}`).catch(() => ({ ok: false } as Response)),
        ]);

        if (profileRes.ok && profileRes instanceof Response) setProfileData(await profileRes.json());
        if (cvRes.ok && cvRes instanceof Response) setCVData(await cvRes.json());
        if (qualificationsRes.ok && qualificationsRes instanceof Response) setQualifications(await qualificationsRes.json());
        if (researchRes.ok && researchRes instanceof Response) setResearch(await researchRes.json());
        if (publicationsRes.ok && publicationsRes instanceof Response) setPublications(await publicationsRes.json());
        if (positionsRes.ok && positionsRes instanceof Response) setPositions(await positionsRes.json());
        if (conferencesRes.ok && conferencesRes instanceof Response) setConferences(await conferencesRes.json());
        if (seminarsRes.ok && seminarsRes instanceof Response) setSeminars(await seminarsRes.json());
        if (coursesRes.ok && coursesRes instanceof Response) setCourses(await coursesRes.json());
        if (workshopsRes.ok && workshopsRes instanceof Response) setWorkshops(await workshopsRes.json());
        if (committeesRes.ok && committeesRes instanceof Response) setCommittees(await committeesRes.json());
        if (thankYouBooksRes.ok && thankYouBooksRes instanceof Response) setThankYouBooks(await thankYouBooksRes.json());
        if (assignmentsRes.ok && assignmentsRes instanceof Response) setAssignments(await assignmentsRes.json());
        if (participationCertificatesRes.ok && participationCertificatesRes instanceof Response) setParticipationCertificates(await participationCertificatesRes.json());
        if (supervisionRes.ok && supervisionRes instanceof Response) setSupervision(await supervisionRes.json());
        if (scientificEvaluationsRes.ok && scientificEvaluationsRes instanceof Response) setScientificEvaluations(await scientificEvaluationsRes.json());
        if (journalMembershipsRes.ok && journalMembershipsRes instanceof Response) setJournalMemberships(await journalMembershipsRes.json());
        if (volunteerWorkRes.ok && volunteerWorkRes instanceof Response) setVolunteerWork(await volunteerWorkRes.json());
        if (researcherLinksRes.ok && researcherLinksRes instanceof Response) setResearcherLinks(await researcherLinksRes.json());
      } catch (error) {
        console.error("Error fetching CV data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, [user]);

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `السيرة الذاتية - ${profileData?.name_ar || profileData?.full_name || user?.username}`,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred
        console.log("Share cancelled or error:", error);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(url);
      alert("تم نسخ رابط السيرة الذاتية إلى الحافظة");
    }
  };

  const handleExportPDF = async () => {
    // Use browser's native print dialog which handles CSS better
    // User can save as PDF from print dialog
    const element = document.getElementById('cv-content');
    if (!element) {
      alert('تعذر العثور على محتوى السيرة الذاتية');
      return;
    }

    // Show message to user
    const confirmed = window.confirm(
      'سيتم فتح نافذة الطباعة. من هناك يمكنك حفظ السيرة الذاتية كملف PDF.\n\n' +
      'اختر "Save as PDF" أو "Microsoft Print to PDF" كطابعة، ثم اضغط "Save".\n\n' +
      'هل تريد المتابعة؟'
    );

    if (!confirmed) return;

    // Use print functionality which handles CSS correctly
    window.print();
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">جاري تحميل السيرة الذاتية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-[639px]:space-y-4 max-[639px]:px-4 max-[639px]:max-w-[420px] max-[639px]:mx-auto max-[639px]:overflow-x-hidden">
      {/* Action Buttons */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm print:hidden max-[639px]:rounded-[22px] max-[639px]:p-4">
        <div className="flex items-center justify-between max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
          <h1 className="text-2xl font-bold max-[639px]:text-[18px]" style={{ color: '#1F2937' }}>السيرة الذاتية الشاملة</h1>
          <div className="flex items-center gap-3 max-[639px]:grid max-[639px]:grid-cols-2 max-[639px]:gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:px-3 max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:justify-center max-[639px]:text-[13px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span>طباعة</span>
            </button>
            <button
              onClick={handleShare}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:px-3 max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:justify-center max-[639px]:text-[13px]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>مشاركة</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:px-3 max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:justify-center max-[639px]:text-[13px] max-[639px]:col-span-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>تصدير PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div id="cv-content" className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm print:shadow-none print:border-0 max-[639px]:p-4 max-[639px]:rounded-[22px] max-[639px]:border-slate-200/70 max-[639px]:overflow-x-hidden">
        {/* Header with Photo */}
        <div className="flex items-start gap-6 mb-8 pb-6 border-b-2 border-indigo-600 max-[639px]:gap-3 max-[639px]:mb-4 max-[639px]:pb-4 max-[639px]:border-b max-[639px]:border-indigo-200">
          {profileData?.profile_picture && (
            <div className="flex-shrink-0">
              <img
                src={profileData.profile_picture}
                alt="صورة شخصية"
                width={150}
                height={150}
                className="rounded-lg object-cover border-4 border-indigo-200 w-[150px] h-[150px] max-[639px]:w-12 max-[639px]:h-12 max-[639px]:rounded-full max-[639px]:border-2"
              />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2 max-[639px]:text-[20px] max-[639px]:leading-7 max-[639px]:mb-1 break-words" style={{ color: '#1F2937' }}>
              {profileData?.name_ar || profileData?.full_name || user?.username || "غير محدد"}
            </h1>
            {profileData?.academic_title && (
              <h2 className="text-2xl text-indigo-600 mb-2 font-semibold max-[639px]:text-[14px] max-[639px]:mb-1">
                {getAcademicTitleLabel(profileData.academic_title)}
              </h2>
            )}
            {profileData?.department && (
              <p className="text-lg text-gray-600 mb-3 max-[639px]:text-[13px] max-[639px]:mb-2 break-words">
                {getDepartmentLabel(profileData.department)}
              </p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 max-[639px]:gap-3 max-[639px]:text-[13px]">
              {profileData?.email && (
                <div className="flex items-start gap-2 min-w-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="min-w-0 break-all">{profileData.email}</span>
                </div>
              )}
              {profileData?.phone && (
                <div className="flex items-start gap-2 min-w-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="min-w-0 break-words">{profileData.phone}</span>
                </div>
              )}
              {cvData?.address && (
                <div className="flex items-start gap-2 min-w-0">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="min-w-0 break-words">{cvData.address}</span>
                </div>
              )}
              {cvData?.nationality && (
                <div className="flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-0.5">
                  <span className="font-medium text-gray-700 max-[639px]:text-[12px]">الجنسية</span>
                  <span className="break-words">{cvData.nationality}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        {(cvData?.gender || cvData?.maritalStatus || cvData?.birthDate || cvData?.languages || cvData?.skills || cvData?.previousExperience) && (
          <section className="mb-8 max-[639px]:mb-4 max-[639px]:bg-white max-[639px]:rounded-[22px] max-[639px]:border max-[639px]:border-slate-200/70 max-[639px]:shadow-sm max-[639px]:p-4">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300 max-[639px]:text-[16px] max-[639px]:mb-3 max-[639px]:pb-0 max-[639px]:border-b-0" style={{ color: '#1F2937' }}>
              المعلومات الشخصية
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-[639px]:gap-3">
              {cvData?.gender && (
                <div className="pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                  <div className="font-medium text-gray-700 mb-1 max-[639px]:text-[12px]">الجنس</div>
                  <div className="text-gray-600 break-words">
                    {cvData.gender === "male" ? "ذكر" : cvData.gender === "female" ? "أنثى" : cvData.gender}
                  </div>
                </div>
              )}
              {cvData?.maritalStatus && (
                <div className="pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                  <div className="font-medium text-gray-700 mb-1 max-[639px]:text-[12px]">الحالة الزوجية</div>
                  <div className="text-gray-600 break-words">
                    {cvData.maritalStatus === "single" ? "أعزب" : 
                     cvData.maritalStatus === "married" ? "متزوج" : 
                     cvData.maritalStatus === "divorced" ? "مطلق" : 
                     cvData.maritalStatus === "widowed" ? "أرمل" : 
                     cvData.maritalStatus}
                  </div>
                </div>
              )}
              {cvData?.birthDate && (
                <div className="pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                  <div className="font-medium text-gray-700 mb-1 max-[639px]:text-[12px]">تاريخ الميلاد</div>
                  <div className="text-gray-600 break-words">{formatDate(cvData.birthDate)}</div>
                </div>
              )}
            </div>
            {cvData?.languages && (
              <div className="mt-4 pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                <div className="font-medium text-gray-700 mb-2 max-[639px]:text-[12px] max-[639px]:mb-1">اللغات</div>
                <div className="text-gray-600 break-words">{cvData.languages}</div>
              </div>
            )}
            {cvData?.skills && (
              <div className="mt-4 pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                <div className="font-medium text-gray-700 mb-2 max-[639px]:text-[12px] max-[639px]:mb-1">المهارات</div>
                <div className="text-gray-600 whitespace-pre-line break-words">{cvData.skills}</div>
              </div>
            )}
            {cvData?.previousExperience && (
              <div className="mt-4 pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0">
                <div className="font-medium text-gray-700 mb-2 max-[639px]:text-[12px] max-[639px]:mb-1">الخبرات السابقة</div>
                <div className="text-gray-600 whitespace-pre-line break-words">{cvData.previousExperience}</div>
              </div>
            )}
          </section>
        )}

        {/* Academic Qualifications */}
        {qualifications.length > 0 && (
          <section className="mb-8 max-[639px]:mb-4 max-[639px]:bg-white max-[639px]:rounded-[22px] max-[639px]:border max-[639px]:border-slate-200/70 max-[639px]:shadow-sm max-[639px]:p-4">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300 max-[639px]:text-[16px] max-[639px]:mb-3 max-[639px]:pb-0 max-[639px]:border-b-0" style={{ color: '#1F2937' }}>
              المؤهلات الأكاديمية
            </h2>
            <div className="space-y-4 max-[639px]:space-y-0 max-[639px]:divide-y max-[639px]:divide-slate-200/70">
              {qualifications.map((qual: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4 max-[639px]:border-r-0 max-[639px]:px-0 max-[639px]:py-3">
                  <div className="font-semibold text-lg mb-1 max-[639px]:text-[15px]" style={{ color: '#1F2937' }}>
                    {qual.degree || ""}
                  </div>
                  <div className="text-gray-600 break-words max-[639px]:text-[13px]">
                    {qual.majorSpecific && <span>{qual.majorSpecific}</span>}
                    {qual.majorGeneral && qual.majorSpecific && <span> - </span>}
                    {qual.majorGeneral && <span>{qual.majorGeneral}</span>}
                  </div>
                  <div className="text-sm text-gray-500 break-words max-[639px]:text-[12px]">
                    {qual.university && <span>{qual.university}</span>}
                    {qual.country && qual.university && <span> - </span>}
                    {qual.country && <span>{qual.country}</span>}
                    {qual.graduationYear && <span> - {qual.graduationYear}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Positions */}
        {positions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              المناصب العلمية والإدارية
            </h2>
            <div className="space-y-3">
              {positions.map((pos: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {pos.position_title || ""}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(pos.start_date)} {pos.end_date ? `- ${formatDate(pos.end_date)}` : ""}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Research */}
        {research.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              البحوث العلمية
            </h2>
            <div className="space-y-4">
              {research.map((res: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {res.title || ""}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                    {res.year && <span>السنة: {res.year}</span>}
                    {res.is_published && <span className="text-green-600">• منشور</span>}
                    {res.is_completed && !res.is_published && <span className="text-yellow-600">• مكتمل</span>}
                    {res.classifications?.includes("global") && <span className="text-blue-600">• عالمي</span>}
                    {res.scopus_quartile && <span className="text-purple-600">• Scopus {res.scopus_quartile}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Publications */}
        {publications.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              المؤلفات
            </h2>
            <div className="space-y-3">
              {publications.map((pub: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {pub.title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {pub.publisher && <span>{pub.publisher}</span>}
                    {pub.publication_date && <span> - {formatDate(pub.publication_date)}</span>}
                    {pub.isbn && <span> - ISBN: {pub.isbn}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conferences */}
        {conferences.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              المؤتمرات
            </h2>
            <div className="space-y-3">
              {conferences.map((conf: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {conf.conference_title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {conf.scope && <span>{conf.scope === "global" ? "عالمي" : "محلي"}</span>}
                    {conf.date && <span> - {formatDate(conf.date)}</span>}
                    {conf.location && <span> - {conf.location}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seminars */}
        {seminars.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              الندوات
            </h2>
            <div className="space-y-3">
              {seminars.map((sem: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {sem.title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {sem.type && <span>{sem.type}</span>}
                    {sem.date && <span> - {formatDate(sem.date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              الدورات
            </h2>
            <div className="space-y-3">
              {courses.map((course: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {course.course_name || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {course.type && <span>{course.type}</span>}
                    {course.date && <span> - {formatDate(course.date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Workshops */}
        {workshops.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              ورش العمل
            </h2>
            <div className="space-y-3">
              {workshops.map((workshop: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {workshop.title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {workshop.type && <span>{workshop.type}</span>}
                    {workshop.date && <span> - {formatDate(workshop.date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Committees */}
        {committees.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              اللجان
            </h2>
            <div className="space-y-3">
              {committees.map((comm: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {comm.committee_name || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {comm.assignment_type && <span>{comm.assignment_type}</span>}
                    {comm.assignment_date && <span> - {formatDate(comm.assignment_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Thank You Books */}
        {thankYouBooks.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              كتب الشكر والتقدير
            </h2>
            <div className="space-y-3">
              {thankYouBooks.map((book: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {book.granting_organization || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {book.month && <span>{book.month}</span>}
                    {book.year && <span> {book.year}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Assignments */}
        {assignments.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              التكليفات
            </h2>
            <div className="space-y-3">
              {assignments.map((assign: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {assign.subject || assign.assignment_subject || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {assign.assignment_date && <span>{formatDate(assign.assignment_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Participation Certificates */}
        {participationCertificates.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              شهادات المشاركة
            </h2>
            <div className="space-y-3">
              {participationCertificates.map((cert: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {cert.subject || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {cert.granting_organization && <span>{cert.granting_organization}</span>}
                    {cert.month && <span> - {cert.month}</span>}
                    {cert.year && <span> {cert.year}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Supervision */}
        {supervision.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              الإشراف على الطلبة
            </h2>
            <div className="space-y-3">
              {supervision.map((sup: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {sup.student_name || ""} - {sup.degree_type || ""}
                  </div>
                  {sup.thesis_title && (
                    <div className="text-sm text-gray-600 mb-1">
                      {sup.thesis_title}
                    </div>
                  )}
                  <div className="text-sm text-gray-500">
                    {sup.start_date && <span>{formatDate(sup.start_date)}</span>}
                    {sup.end_date && <span> - {formatDate(sup.end_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Scientific Evaluations */}
        {scientificEvaluations.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              التقويم العلمي
            </h2>
            <div className="space-y-3">
              {scientificEvaluations.map((evaluation: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {evaluation.evaluation_title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {evaluation.evaluation_type && <span>{evaluation.evaluation_type}</span>}
                    {evaluation.evaluation_date && <span> - {formatDate(evaluation.evaluation_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Journal Memberships */}
        {journalMemberships.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              إدارة المجلات العلمية
            </h2>
            <div className="space-y-3">
              {journalMemberships.map((journal: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {journal.journal_name || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {journal.role && <span>{journal.role}</span>}
                    {journal.start_date && <span> - {formatDate(journal.start_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Volunteer Work */}
        {volunteerWork.length > 0 && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300" style={{ color: '#1F2937' }}>
              الأعمال الطوعية
            </h2>
            <div className="space-y-3">
              {volunteerWork.map((vol: any, index: number) => (
                <div key={index} className="pl-4 border-r-4 border-indigo-200 pr-4">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#1F2937' }}>
                    {vol.title || ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {vol.type && <span>{vol.type}</span>}
                    {vol.start_date && <span> - {formatDate(vol.start_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Researcher Links */}
        {researcherLinks && (
          <section className="mb-8 max-[639px]:mb-4 max-[639px]:bg-white max-[639px]:rounded-[22px] max-[639px]:border max-[639px]:border-slate-200/70 max-[639px]:shadow-sm max-[639px]:p-4">
            <h2 className="text-2xl font-bold mb-4 pb-2 border-b-2 border-indigo-300 max-[639px]:text-[16px] max-[639px]:mb-3 max-[639px]:pb-0 max-[639px]:border-b-0" style={{ color: '#1F2937' }}>
              روابط الباحث
            </h2>
            <div className="space-y-2 max-[639px]:space-y-0 max-[639px]:divide-y max-[639px]:divide-slate-200/70">
              {researcherLinks.google_scholar && (
                <div className="flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-1 max-[639px]:py-3">
                  <span className="font-medium text-gray-700 max-[639px]:text-[12px]">Google Scholar</span>
                  <a href={researcherLinks.google_scholar} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all max-w-full">
                    {researcherLinks.google_scholar}
                  </a>
                </div>
              )}
              {researcherLinks.scopus && (
                <div className="flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-1 max-[639px]:py-3">
                  <span className="font-medium text-gray-700 max-[639px]:text-[12px]">Scopus</span>
                  <a href={researcherLinks.scopus} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all max-w-full">
                    {researcherLinks.scopus}
                  </a>
                </div>
              )}
              {researcherLinks.research_gate && (
                <div className="flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-1 max-[639px]:py-3">
                  <span className="font-medium text-gray-700 max-[639px]:text-[12px]">Research Gate</span>
                  <a href={researcherLinks.research_gate} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all max-w-full">
                    {researcherLinks.research_gate}
                  </a>
                </div>
              )}
              {researcherLinks.orcid && (
                <div className="flex items-center gap-2 max-[639px]:flex-col max-[639px]:items-start max-[639px]:gap-1 max-[639px]:py-3">
                  <span className="font-medium text-gray-700 max-[639px]:text-[12px]">ORCID</span>
                  <a href={researcherLinks.orcid} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all max-w-full">
                    {researcherLinks.orcid}
                  </a>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #cv-content, #cv-content * {
            visibility: visible;
          }
          #cv-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
