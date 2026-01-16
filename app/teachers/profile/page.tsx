"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { getAcademicTitleLabel, getDepartmentLabel } from "@/lib/utils/academic";

interface AcademicQualification {
  id?: number;
  degree: string; // بكالوريوس، ماجستير، دكتوراه
  graduationYear: string;
  majorGeneral: string;
  majorSpecific: string;
  university: string;
  country: string;
}

interface PersonalInfo {
  nameAr: string;
  nameEn: string;
  email: string;
  phone: string;
  department: string;
  academicTitle: string; // لقب علمي
}

interface CVInfo {
  gender: string;
  nationality: string;
  maritalStatus: string;
  birthDate: string;
  address: string;
  languages: string;
  skills: string;
  previousExperience: string;
}


// Departments list for dropdown
const departments = [
  { value: "dental_technology", label: "قسم تقنيات صناعة الأسنان" },
  { value: "radiology_technology", label: "قسم تقنيات الأشعة" },
  { value: "anesthesia_technology", label: "قسم تقنيات التخدير" },
  { value: "optics_technology", label: "قسم تقنيات البصريات" },
  { value: "emergency_medicine_technology", label: "قسم تقنيات طب الطوارئ والإسعافات الأولية" },
  { value: "community_health_technology", label: "قسم تقنيات صحة المجتمع" },
  { value: "physical_therapy_technology", label: "قسم تقنيات العلاج الطبيعي" },
  { value: "health_physics_and_radiation_therapy_engineering", label: "قسم هندسة تقنيات الفيزياء الصحية والعلاج الإشعاعي" },
  { value: "oil_and_gas_engineering_technology", label: "قسم هندسة تقنيات النفط والغاز" },
  { value: "cybersecurity_and_cloud_computing_engineering", label: "قسم هندسة تقنيات الأمن السيبراني والحوسبة السحابية" },
  { value: "construction_and_building_engineering_technology", label: "قسم هندسة تقنيات البناء والإنشاءات" },
];

export default function ProfilePage() {
  const { user } = useLayout();
  const [isEditing, setIsEditing] = useState(false);
  const [activeSection, setActiveSection] = useState<'personal' | 'cv' | 'academic'>('personal');
  const [isLoading, setIsLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    nameAr: "",
    nameEn: "",
    email: "",
    phone: "",
    department: "",
    academicTitle: "",
  });

  // Fetch user profile data
  useEffect(() => {
    const fetchProfileData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/profile?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setProfileData(data);
          setPersonalInfo({
            nameAr: data.name_ar || data.full_name?.split(" / ")[0] || "",
            nameEn: data.name_en || data.full_name?.split(" / ")[1] || "",
            email: data.email || "",
            phone: data.phone || "",
            department: data.department || "",
            academicTitle: data.academic_title || "",
          });
        }

        // Fetch CV data
        const cvResponse = await fetch(`/api/teachers/profile/cv?userId=${user.id}`);
        if (cvResponse.ok) {
          const cvData = await cvResponse.json();
          setCVInfo({
            gender: cvData.gender || "",
            nationality: cvData.nationality || "",
            maritalStatus: cvData.maritalStatus || "",
            birthDate: cvData.birthDate || "",
            address: cvData.address || "",
            languages: cvData.languages || "",
            skills: cvData.skills || "",
            previousExperience: cvData.previousExperience || "",
          });
        }

        // Fetch academic qualifications
        const qualificationsResponse = await fetch(`/api/teachers/profile/qualifications?userId=${user.id}`);
        if (qualificationsResponse.ok) {
          const qualificationsData = await qualificationsResponse.json();
          setQualifications(qualificationsData);
        }
      } catch (error) {
        console.error("Error fetching profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const [cvInfo, setCVInfo] = useState<CVInfo>({
    gender: "",
    nationality: "",
    maritalStatus: "",
    birthDate: "",
    address: "",
    languages: "",
    skills: "",
    previousExperience: "",
  });

  const [qualifications, setQualifications] = useState<AcademicQualification[]>([]);
  const [editingQualification, setEditingQualification] = useState<AcademicQualification | null>(null);
  const [showQualificationForm, setShowQualificationForm] = useState(false);

  if (!user) {
    return null;
  }

  if (isLoading && !profileData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
            <p className="text-gray-600">جاري تحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSavePersonalInfo = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/teachers/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          nameAr: personalInfo.nameAr,
          nameEn: personalInfo.nameEn,
          department: personalInfo.department,
          academicTitle: personalInfo.academicTitle,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل حفظ المعلومات");
      }

      const result = await response.json();
      if (result.user) {
        setProfileData(result.user);
        // Update the personalInfo with the saved data
        setPersonalInfo({
          ...personalInfo,
          nameAr: result.user.name_ar || personalInfo.nameAr,
          nameEn: result.user.name_en || personalInfo.nameEn,
          department: result.user.department || personalInfo.department,
          academicTitle: result.user.academic_title || personalInfo.academicTitle,
        });

        // Update localStorage to reflect changes in header
        const userData = localStorage.getItem("user");
        if (userData) {
          const currentUser = JSON.parse(userData);
          const updatedUser = {
            ...currentUser,
            academic_title: result.user.academic_title,
            department: result.user.department,
            full_name: result.user.full_name,
            name_ar: result.user.name_ar,
            name_en: result.user.name_en,
          };
          localStorage.setItem("user", JSON.stringify(updatedUser));
          
          // Trigger a custom event to notify layout about user update
          window.dispatchEvent(new CustomEvent("userUpdated", { detail: updatedUser }));
        }
      }

      setIsEditing(false);
      alert("تم حفظ المعلومات بنجاح");
    } catch (error) {
      console.error("Error saving personal info:", error);
      alert("حدث خطأ أثناء حفظ المعلومات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCVInfo = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const response = await fetch("/api/teachers/profile/cv", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          gender: cvInfo.gender,
          nationality: cvInfo.nationality,
          maritalStatus: cvInfo.maritalStatus,
          birthDate: cvInfo.birthDate,
          address: cvInfo.address,
          languages: cvInfo.languages,
          skills: cvInfo.skills,
          previousExperience: cvInfo.previousExperience,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل حفظ بيانات السيرة الذاتية");
      }

      const result = await response.json();
      if (result.cv) {
        setCVInfo({
          gender: result.cv.gender || "",
          nationality: result.cv.nationality || "",
          maritalStatus: result.cv.maritalStatus || "",
          birthDate: result.cv.birthDate || "",
          address: result.cv.address || "",
          languages: result.cv.languages || "",
          skills: result.cv.skills || "",
          previousExperience: result.cv.previousExperience || "",
        });
      }

      setIsEditing(false);
      alert("تم حفظ بيانات السيرة الذاتية بنجاح");
    } catch (error) {
      console.error("Error saving CV info:", error);
      alert("حدث خطأ أثناء حفظ بيانات السيرة الذاتية. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddQualification = () => {
    setEditingQualification({
      degree: "",
      graduationYear: "",
      majorGeneral: "",
      majorSpecific: "",
      university: "",
      country: "",
    });
    setShowQualificationForm(true);
  };

  const handleEditQualification = (qual: AcademicQualification) => {
    setEditingQualification(qual);
    setShowQualificationForm(true);
  };

  const handleDeleteQualification = async (id: number) => {
    if (!user) return;

    try {
      const response = await fetch(`/api/teachers/profile/qualifications?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("فشل حذف الشهادة العلمية");
      }

      setQualifications(qualifications.filter(q => q.id !== id));
      alert("تم حذف الشهادة العلمية بنجاح");
    } catch (error) {
      console.error("Error deleting qualification:", error);
      alert("حدث خطأ أثناء حذف الشهادة العلمية. يرجى المحاولة مرة أخرى.");
    }
  };

  const handleSaveQualification = async () => {
    if (!user || !editingQualification) return;

    try {
      setIsLoading(true);
      let response;

      if (editingQualification.id) {
        // Update existing
        response = await fetch("/api/teachers/profile/qualifications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingQualification.id,
            degree: editingQualification.degree,
            graduationYear: editingQualification.graduationYear,
            majorGeneral: editingQualification.majorGeneral,
            majorSpecific: editingQualification.majorSpecific,
            university: editingQualification.university,
            country: editingQualification.country,
          }),
        });
      } else {
        // Add new
        response = await fetch("/api/teachers/profile/qualifications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            degree: editingQualification.degree,
            graduationYear: editingQualification.graduationYear,
            majorGeneral: editingQualification.majorGeneral,
            majorSpecific: editingQualification.majorSpecific,
            university: editingQualification.university,
            country: editingQualification.country,
          }),
        });
      }

      if (!response.ok) {
        throw new Error("فشل حفظ الشهادة العلمية");
      }

      const result = await response.json();
      if (result.qualification) {
        if (editingQualification.id) {
          // Update existing
          setQualifications(qualifications.map(q => q.id === editingQualification.id ? result.qualification : q));
        } else {
          // Add new
          setQualifications([...qualifications, result.qualification]);
        }
      }

      setShowQualificationForm(false);
      setEditingQualification(null);
      alert("تم حفظ الشهادة العلمية بنجاح");
    } catch (error) {
      console.error("Error saving qualification:", error);
      alert("حدث خطأ أثناء حفظ الشهادة العلمية. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate profile completion percentage
  const calculateCompletionPercentage = (): number => {
    let completedFields = 0;
    let totalFields = 0;

    // Personal Information fields (6 fields)
    const personalFields = [
      personalInfo.nameAr,
      personalInfo.nameEn,
      personalInfo.email,
      personalInfo.phone,
      personalInfo.department,
      personalInfo.academicTitle,
    ];
    personalFields.forEach((field) => {
      totalFields++;
      if (field && field.trim() !== "") completedFields++;
    });

    // CV Information fields (8 fields)
    const cvFields = [
      cvInfo.gender,
      cvInfo.nationality,
      cvInfo.maritalStatus,
      cvInfo.birthDate,
      cvInfo.address,
      cvInfo.languages,
      cvInfo.skills,
      cvInfo.previousExperience,
    ];
    cvFields.forEach((field) => {
      totalFields++;
      if (field && field.trim() !== "") completedFields++;
    });

    // Academic Qualifications (1 field - at least one qualification)
    totalFields++;
    if (qualifications.length > 0) completedFields++;

    return Math.round((completedFields / totalFields) * 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Completion Percentage Card */}
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg border border-indigo-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-base font-semibold" style={{ color: '#1F2937' }}>
              نسبة اكتمال الملف الشخصي
            </h3>
            <span className="text-xl font-bold" style={{ color: '#6366F1' }}>
              {completionPercentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-600 mt-1.5">
            {completionPercentage === 100
              ? "ممتاز! ملفك الشخصي مكتمل"
              : completionPercentage >= 75
              ? "جيد جداً، بضع خطوات للاكتمال"
              : completionPercentage >= 50
              ? "في الطريق الصحيح، استمر في إكمال البيانات"
              : "ابدأ بإكمال البيانات الأساسية"}
          </p>
        </div>

        {/* CV Summary Card */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg border border-blue-200 p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1F2937' }}>
            ملخص السيرة الذاتية
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
              <p className="text-xl font-bold" style={{ color: '#3B82F6' }}>
                {cvInfo.languages ? cvInfo.languages.split(/[،,]/).filter(l => l.trim() !== '').length : 0}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">لغة</p>
            </div>
            <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
              <p className="text-xl font-bold" style={{ color: '#3B82F6' }}>
                {cvInfo.skills ? cvInfo.skills.split(/[،,]/).filter(s => s.trim() !== '').length : 0}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">مهارة</p>
            </div>
            <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
              <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                {cvInfo.previousExperience ? (cvInfo.previousExperience.trim() !== '' ? 'نعم' : 'لا') : 'لا'}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">خبرات</p>
            </div>
            <div className="text-center bg-white rounded-lg px-3 py-2 shadow-sm border border-blue-100">
              <p className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                {cvInfo.gender === "male" ? "ذكر" : cvInfo.gender === "female" ? "أنثى" : "غير محدد"}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">الجنس</p>
            </div>
          </div>
        </div>

        {/* Academic Qualifications Statistics Card */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4 shadow-sm">
          <h3 className="text-base font-semibold mb-3" style={{ color: '#1F2937' }}>
            إحصائيات الشهادات
          </h3>
          <div className="grid grid-cols-5 gap-2">
            <div className="text-center bg-white rounded-lg px-2 py-2 shadow-sm border border-purple-100">
              <p className="text-lg font-bold" style={{ color: '#A855F7' }}>
                {qualifications.filter(q => q.degree === 'دبلوم').length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">دبلوم</p>
            </div>
            <div className="text-center bg-white rounded-lg px-2 py-2 shadow-sm border border-purple-100">
              <p className="text-lg font-bold" style={{ color: '#A855F7' }}>
                {qualifications.filter(q => q.degree === 'بكالوريوس').length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">بكالوريوس</p>
            </div>
            <div className="text-center bg-white rounded-lg px-2 py-2 shadow-sm border border-purple-100">
              <p className="text-lg font-bold" style={{ color: '#A855F7' }}>
                {qualifications.filter(q => q.degree === 'ماجستير').length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">ماجستير</p>
            </div>
            <div className="text-center bg-white rounded-lg px-2 py-2 shadow-sm border border-purple-100">
              <p className="text-lg font-bold" style={{ color: '#A855F7' }}>
                {qualifications.filter(q => q.degree === 'دكتوراه').length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">دكتوراه</p>
            </div>
            <div className="text-center bg-white rounded-lg px-2 py-2 shadow-sm border border-purple-100">
              <p className="text-lg font-bold" style={{ color: '#A855F7' }}>
                {qualifications.filter(q => q.degree === 'بورد').length}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">بورد</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveSection('personal')}
          className={`px-6 py-3 font-medium transition-colors duration-300 border-b-2 ${
            activeSection === 'personal'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-indigo-600'
          }`}
        >
          المعلومات الشخصية
        </button>
        <button
          onClick={() => setActiveSection('cv')}
          className={`px-6 py-3 font-medium transition-colors duration-300 border-b-2 ${
            activeSection === 'cv'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-indigo-600'
          }`}
        >
          السيرة الذاتية
        </button>
        <button
          onClick={() => setActiveSection('academic')}
          className={`px-6 py-3 font-medium transition-colors duration-300 border-b-2 ${
            activeSection === 'academic'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-600 hover:text-indigo-600'
          }`}
        >
          السيرة العلمية
        </button>
      </div>

      {/* Personal Information Section */}
      {activeSection === 'personal' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>
                المعلومات الشخصية والأكاديمية
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>تعديل</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                الاسم باللغة العربية
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalInfo.nameAr}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, nameAr: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {personalInfo.nameAr || "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                الاسم باللغة الإنجليزية
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={personalInfo.nameEn}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, nameEn: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {personalInfo.nameEn || "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                البريد الإلكتروني
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={personalInfo.email}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {personalInfo.email || "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رقم الهاتف
              </label>
              {isEditing ? (
                <input
                  type="tel"
                  value={personalInfo.phone}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {personalInfo.phone || "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                القسم / التشكيل
              </label>
              {isEditing ? (
                <select
                  value={personalInfo.department}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, department: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر القسم</option>
                  {departments.map((dept) => (
                    <option key={dept.value} value={dept.value}>
                      {dept.label}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {getDepartmentLabel(personalInfo.department)}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                اللقب العلمي
              </label>
              {isEditing ? (
                <select
                  value={personalInfo.academicTitle}
                  onChange={(e) => setPersonalInfo({ ...personalInfo, academicTitle: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر اللقب العلمي</option>
                  <option value="assistant_lecturer">مدرس مساعد</option>
                  <option value="lecturer">مدرس</option>
                  <option value="assistant_professor">أستاذ مساعد</option>
                  <option value="associate_professor">أستاذ مشارك</option>
                  <option value="professor">أستاذ</option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {getAcademicTitleLabel(personalInfo.academicTitle)}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePersonalInfo}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
              >
                حفظ التغييرات
              </button>
            </div>
          )}
        </div>
      )}

      {/* CV Information Section */}
      {activeSection === 'cv' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>
                السيرة الذاتية
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"></div>
            </div>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span>تعديل</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                الجنس
              </label>
              {isEditing ? (
                <select
                  value={cvInfo.gender}
                  onChange={(e) => setCVInfo({ ...cvInfo, gender: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.gender === "male" ? "ذكر" : cvInfo.gender === "female" ? "أنثى" : "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                القومية
              </label>
              {isEditing ? (
                <select
                  value={cvInfo.nationality}
                  onChange={(e) => setCVInfo({ ...cvInfo, nationality: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر القومية</option>
                  <option value="arabic">عربية</option>
                  <option value="kurdish">كردية</option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.nationality === "arabic" ? "عربية" : cvInfo.nationality === "kurdish" ? "كردية" : "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                الحالة الزوجية
              </label>
              {isEditing ? (
                <select
                  value={cvInfo.maritalStatus}
                  onChange={(e) => setCVInfo({ ...cvInfo, maritalStatus: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر الحالة الزوجية</option>
                  <option value="single">أعزب</option>
                  <option value="married">متزوج</option>
                  <option value="divorced">مطلق</option>
                  <option value="widowed">أرمل</option>
                </select>
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.maritalStatus === "single" ? "أعزب" : cvInfo.maritalStatus === "married" ? "متزوج" : cvInfo.maritalStatus === "divorced" ? "مطلق" : cvInfo.maritalStatus === "widowed" ? "أرمل" : "غير محدد"}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                تاريخ الميلاد
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={cvInfo.birthDate}
                  onChange={(e) => setCVInfo({ ...cvInfo, birthDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.birthDate || "غير محدد"}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                عنوان السكن
              </label>
              {isEditing ? (
                <textarea
                  value={cvInfo.address}
                  onChange={(e) => setCVInfo({ ...cvInfo, address: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.address || "غير محدد"}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                اللغات
              </label>
              {isEditing ? (
                <textarea
                  value={cvInfo.languages}
                  onChange={(e) => setCVInfo({ ...cvInfo, languages: e.target.value })}
                  rows={3}
                  placeholder="مثال: العربية (اللغة الأم)، الإنجليزية (متقدم)، الفرنسية (متوسط)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200" style={{ color: '#1F2937' }}>
                  {cvInfo.languages || "غير محدد"}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                المهارات
              </label>
              {isEditing ? (
                <textarea
                  value={cvInfo.skills}
                  onChange={(e) => setCVInfo({ ...cvInfo, skills: e.target.value })}
                  rows={4}
                  placeholder="اذكر مهاراتك المهنية والتقنية..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[100px]" style={{ color: '#1F2937' }}>
                  {cvInfo.skills || "غير محدد"}
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                الخبرات السابقة
              </label>
              {isEditing ? (
                <textarea
                  value={cvInfo.previousExperience}
                  onChange={(e) => setCVInfo({ ...cvInfo, previousExperience: e.target.value })}
                  rows={5}
                  placeholder="اذكر خبراتك العملية السابقة..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              ) : (
                <div className="px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 min-h-[120px]" style={{ color: '#1F2937' }}>
                  {cvInfo.previousExperience || "غير محدد"}
                </div>
              )}
            </div>
          </div>

          {isEditing && (
            <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => setIsEditing(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveCVInfo}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
              >
                حفظ التغييرات
              </button>
            </div>
          )}
        </div>
      )}

      {/* Academic Qualifications Section */}
      {activeSection === 'academic' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>
                السيرة العلمية
              </h2>
              <div className="h-1 w-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
            </div>
            <button
              onClick={handleAddQualification}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>إضافة شهادة علمية</span>
            </button>
          </div>

          {/* Qualifications Timeline */}
          {qualifications.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <p className="text-gray-500 text-lg">لا توجد شهادات علمية مضافة</p>
              <p className="text-gray-400 text-sm mt-2">اضغط على زر "إضافة شهادة علمية" لإضافة شهادتك الأولى</p>
            </div>
          ) : (
            <div className="relative pr-8">
              {/* Vertical Timeline Line */}
              <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-400 via-pink-400 to-purple-400"></div>
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {[...qualifications]
                  .sort((a, b) => {
                    const yearA = parseInt(a.graduationYear) || 0;
                    const yearB = parseInt(b.graduationYear) || 0;
                    return yearB - yearA; // الأحدث أولاً
                  })
                  .map((qual, index) => (
                    <div key={qual.id} className="relative flex items-start gap-6">
                      {/* Timeline Dot */}
                      <div className="relative z-10 flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white shadow-lg flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        </div>
                        {/* Year Badge */}
                        <div className="absolute -top-2 right-12 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                          {qual.graduationYear || "غير محدد"}
                        </div>
                      </div>

                      {/* Qualification Card */}
                      <div className="flex-1 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-lg p-5 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Degree Badge */}
                            <div className="inline-flex items-center gap-2 mb-4">
                              <div className="px-4 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full text-sm font-bold shadow-sm">
                                {qual.degree || "شهادة علمية"}
                              </div>
                            </div>

                            {/* Qualification Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 block mb-1">الاختصاص العام</span>
                                  <p className="text-sm font-semibold text-gray-800">{qual.majorGeneral || "غير محدد"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 block mb-1">الاختصاص الدقيق</span>
                                  <p className="text-sm font-semibold text-gray-800">{qual.majorSpecific || "غير محدد"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 block mb-1">الجامعة</span>
                                  <p className="text-sm font-semibold text-gray-800">{qual.university || "غير محدد"}</p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-cyan-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <div>
                                  <span className="text-xs font-medium text-gray-500 block mb-1">البلد</span>
                                  <p className="text-sm font-semibold text-gray-800">{qual.country || "غير محدد"}</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2">
                            <button
                              onClick={() => handleEditQualification(qual)}
                              className="p-2.5 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors duration-300 hover:scale-110"
                              title="تعديل"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => qual.id && handleDeleteQualification(qual.id)}
                              className="p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-300 hover:scale-110"
                              title="حذف"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Qualification Form Modal */}
          {showQualificationForm && editingQualification && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowQualificationForm(false)}>
              <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                    {editingQualification.id ? "تعديل الشهادة العلمية" : "إضافة شهادة علمية جديدة"}
                  </h3>
                  <button
                    onClick={() => {
                      setShowQualificationForm(false);
                      setEditingQualification(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      الدرجة العلمية *
                    </label>
                    <select
                      value={editingQualification.degree}
                      onChange={(e) => setEditingQualification({ ...editingQualification, degree: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                    >
                      <option value="">اختر الدرجة العلمية</option>
                      <option value="دبلوم">دبلوم</option>
                      <option value="بكالوريوس">بكالوريوس</option>
                      <option value="ماجستير">ماجستير</option>
                      <option value="دكتوراه">دكتوراه</option>
                      <option value="بورد">بورد</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      سنة التخرج *
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={editingQualification.graduationYear}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, '');
                        setEditingQualification({ ...editingQualification, graduationYear: value });
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                      placeholder="مثال: 2020"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      الاختصاص العام
                    </label>
                    <input
                      type="text"
                      value={editingQualification.majorGeneral}
                      onChange={(e) => setEditingQualification({ ...editingQualification, majorGeneral: e.target.value })}
                      placeholder="مثال: هندسة النفط والغاز"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      الاختصاص الدقيق
                    </label>
                    <input
                      type="text"
                      value={editingQualification.majorSpecific}
                      onChange={(e) => setEditingQualification({ ...editingQualification, majorSpecific: e.target.value })}
                      placeholder="مثال: هندسة حفر الآبار"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      الجامعة *
                    </label>
                    <input
                      type="text"
                      value={editingQualification.university}
                      onChange={(e) => setEditingQualification({ ...editingQualification, university: e.target.value })}
                      placeholder="اسم الجامعة"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      البلد *
                    </label>
                    <input
                      type="text"
                      value={editingQualification.country}
                      onChange={(e) => setEditingQualification({ ...editingQualification, country: e.target.value })}
                      placeholder="اسم البلد"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-4 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowQualificationForm(false);
                      setEditingQualification(null);
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={handleSaveQualification}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
                  >
                    حفظ
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
