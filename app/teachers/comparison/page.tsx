"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { getDepartmentLabel, getAcademicTitleLabel as getAcademicTitleLabelUtil } from "@/lib/utils/academic";

interface TopUser {
  id: number;
  full_name: string;
  name_ar?: string;
  name_en?: string;
  department: string;
  academic_title?: string;
  totalPoints: number;
}

interface SimilarUser {
  id: number;
  full_name: string;
  name_ar?: string;
  name_en?: string;
  department: string;
  academic_title?: string;
  similarity: number;
}

interface DepartmentUser extends TopUser {
  rank: number;
  pointsBreakdown?: any;
}

interface RankingData {
  collegeRank: number;
  totalUsersInCollege: number;
  top3Users: TopUser[];
  top10Users: TopUser[];
  similarUsers: SimilarUser[];
  topDepartmentUsers: DepartmentUser[];
  userDepartment?: string;
}

interface CriteriaRanking {
  rank: number;
  id: number;
  full_name: string;
  name_ar?: string;
  name_en?: string;
  department: string;
  academic_title?: string;
  value: number | string;
}

interface CriteriaRankings {
  academicTitle: CriteriaRanking[];
  publishedResearch: CriteriaRanking[];
  globalResearch: CriteriaRanking[];
  conferences: CriteriaRanking[];
  seminarsAndCourses: CriteriaRanking[];
  committees: CriteriaRanking[];
  volunteerWork: CriteriaRanking[];
  thankYouBooks: CriteriaRanking[];
}

export default function ComparisonPage() {
  const { user } = useLayout();
  const [isLoading, setIsLoading] = useState(true);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [criteriaRankings, setCriteriaRankings] = useState<CriteriaRankings | null>(null);
  const [selectedCriterion, setSelectedCriterion] = useState<string>("academicTitle");

  useEffect(() => {
    const fetchRankingData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const [rankingResponse, criteriaResponse] = await Promise.all([
          fetch(`/api/teachers/ranking?userId=${user.id}`),
          fetch(`/api/teachers/criteria-ranking?limit=10`),
        ]);

        if (rankingResponse.ok) {
          const data = await rankingResponse.json();
          setRankingData({
            collegeRank: data.collegeRank || 0,
            totalUsersInCollege: data.totalUsersInCollege || 0,
            top3Users: data.top3Users || [],
            top10Users: data.top10Users || [],
            similarUsers: data.similarUsers || [],
            topDepartmentUsers: data.topDepartmentUsers || [],
            userDepartment: data.userDepartment || "",
          });
        }

        if (criteriaResponse.ok) {
          const criteriaData = await criteriaResponse.json();
          setCriteriaRankings(criteriaData);
        }
      } catch (error) {
        console.error("Error fetching ranking data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankingData();
  }, [user]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-2">
          <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>مقارنة مع التدريسيين الآخرين</h1>
          <div className="h-1 w-24 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4"></div>
          <p className="text-gray-600">اكتشف التدريسيين المشابهين لك وأفضل الأداء في كليتك</p>
        </div>
      </div>

      {/* Your Rank Card */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border-2 border-indigo-200 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: '#1F2937' }}>ترتيبك في الكلية</h2>
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
        </div>
        <div className="text-center py-6">
          <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            {rankingData?.collegeRank || "-"}
          </div>
          <div className="text-lg text-gray-600">
            من أصل <span className="font-bold text-indigo-600">{rankingData?.totalUsersInCollege || 0}</span> تدريسي مسجل في النظام
          </div>
          {rankingData && rankingData.collegeRank > 0 && rankingData.totalUsersInCollege > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-500 mb-2">نسبة الإنجاز</div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${((rankingData.totalUsersInCollege - rankingData.collegeRank + 1) / rankingData.totalUsersInCollege) * 100}%` 
                  }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                {Math.round(((rankingData.totalUsersInCollege - rankingData.collegeRank + 1) / rankingData.totalUsersInCollege) * 100)}% من التدريسيين
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Top 3 Users */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold mb-6" style={{ color: '#1F2937' }}>أعلى 3 تدريسيين في الكلية</h2>
        {rankingData && rankingData.top3Users && rankingData.top3Users.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {rankingData.top3Users.map((topUser, index) => (
              <div 
                key={topUser.id} 
                className={`relative rounded-xl p-6 border-2 shadow-md transition-all duration-300 hover:shadow-lg ${
                  index === 0 
                    ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-200" 
                    : index === 1
                    ? "bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200"
                    : "bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200"
                }`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-4 -right-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                    index === 0 
                      ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                      : index === 1
                      ? "bg-gradient-to-br from-gray-300 to-gray-400"
                      : "bg-gradient-to-br from-amber-600 to-amber-700"
                  }`}>
                    {index + 1}
                  </div>
                </div>

                <div className="mt-4">
                  {/* Name */}
                  <div className="mb-2">
                    <div className="text-lg font-bold" style={{ color: '#1F2937' }}>
                      {topUser.name_ar || topUser.full_name || "غير معروف"}
                    </div>
                  </div>

                  {/* Academic Title */}
                  {topUser.academic_title && (
                    <div className="mb-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="text-sm font-medium text-indigo-600">
                          {getAcademicTitleLabelUtil(topUser.academic_title)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Department */}
                  {topUser.department && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <span>{getDepartmentLabel(topUser.department)}</span>
                      </div>
                    </div>
                  )}

                  {/* Points */}
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">النقاط العلمية</span>
                      <span className="text-xl font-bold text-indigo-600">{topUser.totalPoints}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات متاحة</div>
        )}
      </div>

      {/* Top 10 Users in College */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>أعلى 10 تدريسيين في الجامعة</h2>
          <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
        </div>
        {rankingData && rankingData.top10Users && rankingData.top10Users.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>التسلسل</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>اسم الاستاذ</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>اللقب العلمي</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>القسم</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>عدد النقاط</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.top10Users.map((user, index) => (
                  <tr 
                    key={user.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                      index < 3 ? "bg-gradient-to-r from-indigo-50/50 to-purple-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                        index === 0 
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                          : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-600 to-amber-700"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600"
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium" style={{ color: '#1F2937' }}>
                        {user.name_ar || user.full_name || "غير معروف"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                        <span className="text-sm font-medium text-indigo-600">
                          {getAcademicTitleLabelUtil(user.academic_title) || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {getDepartmentLabel(user.department) || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-lg font-bold text-indigo-600">
                        {user.totalPoints}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات متاحة</div>
        )}
      </div>

      {/* Similar Users and Top Department Users - Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Similar Users Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>التدريسيون المشابهون</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full mb-3"></div>
            <p className="text-sm text-gray-600">تدريسيون لديهم مواصفات مشابهة لك في كل الكلية</p>
          </div>
          {rankingData && rankingData.similarUsers && rankingData.similarUsers.length > 0 ? (
            <div className="space-y-4">
              {rankingData.similarUsers.map((similarUser) => (
                <div 
                  key={similarUser.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-bold text-lg mb-1" style={{ color: '#1F2937' }}>
                        {similarUser.name_ar || similarUser.full_name || "غير معروف"}
                      </div>
                      {similarUser.academic_title && (
                        <div className="inline-flex items-center gap-2 px-2 py-1 bg-indigo-100 rounded-full mb-2">
                          <span className="text-xs font-medium text-indigo-600">
                            {getAcademicTitleLabelUtil(similarUser.academic_title)}
                          </span>
                        </div>
                      )}
                      {similarUser.department && (
                        <div className="text-sm text-gray-600 mb-2">
                          {getDepartmentLabel(similarUser.department)}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-2xl font-bold text-green-600">{similarUser.similarity}%</div>
                      <div className="text-xs text-gray-500">التشابه</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${similarUser.similarity}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات متاحة</div>
          )}
        </div>

        {/* Top Department Users Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>أفضل التدريسيين في القسم</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-3"></div>
            <p className="text-sm text-gray-600">
              ترتيب الأداء في <span className="font-bold text-purple-600">{getDepartmentLabel(rankingData?.userDepartment)}</span>
            </p>
          </div>
          {rankingData && rankingData.topDepartmentUsers && rankingData.topDepartmentUsers.length > 0 ? (
            <div className="space-y-4">
              {rankingData.topDepartmentUsers.map((deptUser) => (
                <div 
                  key={deptUser.id}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        deptUser.rank === 1 
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                          : deptUser.rank === 2
                          ? "bg-gradient-to-br from-gray-300 to-gray-400"
                          : deptUser.rank === 3
                          ? "bg-gradient-to-br from-amber-600 to-amber-700"
                          : "bg-gradient-to-br from-purple-500 to-pink-600"
                      }`}>
                        {deptUser.rank}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold mb-1" style={{ color: '#1F2937' }}>
                          {deptUser.name_ar || deptUser.full_name || "غير معروف"}
                        </div>
                        {deptUser.academic_title && (
                          <div className="inline-flex items-center gap-2 px-2 py-1 bg-indigo-100 rounded-full mb-1">
                            <span className="text-xs font-medium text-indigo-600">
                              {getAcademicTitleLabelUtil(deptUser.academic_title)}
                            </span>
                          </div>
                        )}
                        {deptUser.department && (
                          <div className="text-xs text-gray-600">
                            {getDepartmentLabel(deptUser.department)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-xl font-bold text-purple-600">{deptUser.totalPoints}</div>
                      <div className="text-xs text-gray-500">نقطة</div>
                    </div>
                  </div>
                  
                  {/* Points Breakdown */}
                  {deptUser.pointsBreakdown && (
                    <div className="pt-3 border-t border-gray-200 mt-3">
                      <div className="text-xs font-medium text-gray-600 mb-2">تفصيلات النقاط:</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {deptUser.pointsBreakdown.research && Array.isArray(deptUser.pointsBreakdown.research) && deptUser.pointsBreakdown.research.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">بحوث:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.research.reduce((sum: number, r: any) => sum + (r.points || 0), 0)}</span>
                          </div>
                        )}
                        {deptUser.pointsBreakdown.conferences && Array.isArray(deptUser.pointsBreakdown.conferences) && deptUser.pointsBreakdown.conferences.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">مؤتمرات:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.conferences.reduce((sum: number, c: any) => sum + (c.points || 0), 0)}</span>
                          </div>
                        )}
                        {deptUser.pointsBreakdown.publications && Array.isArray(deptUser.pointsBreakdown.publications) && deptUser.pointsBreakdown.publications.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">مؤلفات:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.publications.reduce((sum: number, p: any) => sum + (p.points || 0), 0)}</span>
                          </div>
                        )}
                        {deptUser.pointsBreakdown.courses && Array.isArray(deptUser.pointsBreakdown.courses) && deptUser.pointsBreakdown.courses.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">دورات:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.courses.reduce((sum: number, c: any) => sum + (c.points || 0), 0)}</span>
                          </div>
                        )}
                        {deptUser.pointsBreakdown.supervision && Array.isArray(deptUser.pointsBreakdown.supervision) && deptUser.pointsBreakdown.supervision.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">إشراف:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.supervision.reduce((sum: number, s: any) => sum + (s.points || 0), 0)}</span>
                          </div>
                        )}
                        {deptUser.pointsBreakdown.positions && Array.isArray(deptUser.pointsBreakdown.positions) && deptUser.pointsBreakdown.positions.length > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">مناصب:</span>
                            <span className="font-medium">{deptUser.pointsBreakdown.positions.reduce((sum: number, p: any) => sum + (p.points || 0), 0)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">لا توجد بيانات متاحة</div>
          )}
        </div>
      </div>

      {/* Best Teachers by Different Criteria */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>أفضل التدريسيين في المعايير المختلفة</h2>
          <div className="h-1 w-32 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full mb-4"></div>
          <p className="text-gray-600">تصنيف التدريسيين حسب كل معيار منفصل</p>
        </div>

        {/* Criteria Tabs */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              { key: "academicTitle", label: "الدرجة العلمية", icon: "🎓" },
              { key: "publishedResearch", label: "البحوث المنشورة", icon: "📚" },
              { key: "globalResearch", label: "البحوث العالمية", icon: "🌍" },
              { key: "conferences", label: "المؤتمرات", icon: "🏛️" },
              { key: "seminarsAndCourses", label: "الندوات والدورات", icon: "📖" },
              { key: "committees", label: "المشاركة في اللجان", icon: "👥" },
              { key: "volunteerWork", label: "العمل الطوعي", icon: "🤝" },
              { key: "thankYouBooks", label: "كتب الشكر", icon: "🏅" },
            ].map((criterion) => (
              <button
                key={criterion.key}
                onClick={() => setSelectedCriterion(criterion.key)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all duration-200 ${
                  selectedCriterion === criterion.key
                    ? "bg-indigo-600 text-white border-b-2 border-indigo-600"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <span className="mr-2">{criterion.icon}</span>
                {criterion.label}
              </button>
            ))}
          </div>
        </div>

        {/* Criteria Rankings Table */}
        {criteriaRankings && criteriaRankings[selectedCriterion as keyof CriteriaRankings] ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>الترتيب</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>اسم الاستاذ</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>اللقب العلمي</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>القسم</th>
                  <th className="px-4 py-3 text-right text-sm font-bold" style={{ color: '#1F2937' }}>
                    {selectedCriterion === "academicTitle" ? "الدرجة العلمية" :
                     selectedCriterion === "publishedResearch" ? "عدد البحوث المنشورة" :
                     selectedCriterion === "globalResearch" ? "عدد البحوث العالمية" :
                     selectedCriterion === "conferences" ? "عدد المؤتمرات" :
                     selectedCriterion === "seminarsAndCourses" ? "عدد الندوات والدورات" :
                     selectedCriterion === "committees" ? "عدد اللجان" :
                     selectedCriterion === "volunteerWork" ? "عدد الأعمال الطوعية" :
                     "عدد كتب الشكر"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {(criteriaRankings[selectedCriterion as keyof CriteriaRankings] as CriteriaRanking[]).map((item, index) => (
                  <tr 
                    key={item.id} 
                    className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                      index < 3 ? "bg-gradient-to-r from-indigo-50/50 to-purple-50/50" : ""
                    }`}
                  >
                    <td className="px-4 py-4 text-center">
                      <div className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-white ${
                        index === 0 
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500" 
                          : index === 1
                          ? "bg-gradient-to-br from-gray-300 to-gray-400"
                          : index === 2
                          ? "bg-gradient-to-br from-amber-600 to-amber-700"
                          : "bg-gradient-to-br from-indigo-500 to-purple-600"
                      }`}>
                        {item.rank}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-bold" style={{ color: '#1F2937' }}>
                        {item.name_ar || item.full_name || "غير معروف"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-100 rounded-full">
                        <span className="text-sm font-medium text-indigo-600">
                          {selectedCriterion === "academicTitle" 
                            ? getAcademicTitleLabelUtil(item.value as string) 
                            : getAcademicTitleLabelUtil(item.academic_title) || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        {getDepartmentLabel(item.department) || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="text-xl font-bold text-indigo-600">
                        {selectedCriterion === "academicTitle" 
                          ? getAcademicTitleLabelUtil(item.value as string)
                          : item.value}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">لا توجد بيانات متاحة</div>
        )}
      </div>
    </div>
  );
}
