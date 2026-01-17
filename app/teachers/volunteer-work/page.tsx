"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { formatDate } from "@/lib/utils/academic";

interface VolunteerWork {
  id?: number;
  work_title: string;
  work_type: string;
  role: "coordinator" | "leader" | "participant" | "member";
  organizing_organization?: string;
  start_date: string;
  end_date?: string;
  duration?: string;
  location?: string;
  beneficiaries?: string;
  certificates_documents?: string;
  description?: string;
  is_active?: boolean;
  volunteer_work_document?: string; // base64 string for PDF/image
  created_at?: string;
  updated_at?: string;
}

const workTypes = [
  "مساعدة الفقراء والمحتاجين",
  "حماية البيئة",
  "تقديم الدعم في حالة الطوارئ",
  "المساهمة في الأنشطة الثقافية والتعليمية",
  "مساعدة كبار السن",
  "المشاركة في الأنشطة الرياضية",
  "المشاركة في الأنشطة الاجتماعية",
  "التطوع في المستشفيات ودور الأيتام",
  "التطوع في مجال التعليم",
  "التطوع في مجال التنمية المجتمعية",
  "التطوع في مجال حقوق الإنسان",
  "التطوع في مجال الفنون والثقافة",
  "التطوع في مجال التكنولوجيا والاتصالات",
  "التطوع في مجال القانون",
  "التطوع في مجال الصحة",
  "التطوع في مجال الإسعافات الأولية",
  "التطوع في مجال رعاية الحيوان"
];

export default function VolunteerWorkPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [volunteerWorks, setVolunteerWorks] = useState<VolunteerWork[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingVolunteerWork, setEditingVolunteerWork] = useState<VolunteerWork | null>(null);
  const [volunteerWorkToDelete, setVolunteerWorkToDelete] = useState<VolunteerWork | null>(null);
  const [formData, setFormData] = useState<VolunteerWork>({
    work_title: "",
    work_type: "",
    role: "participant",
    organizing_organization: "",
    start_date: "",
    end_date: "",
    duration: "",
    location: "",
    beneficiaries: "",
    certificates_documents: "",
    description: "",
    is_active: false,
    volunteer_work_document: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  // Fetch volunteer works on component mount
  useEffect(() => {
    const fetchVolunteerWorks = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/volunteer-work?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setVolunteerWorks(data);
        }
      } catch (error) {
        console.error("Error fetching volunteer works:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVolunteerWorks();
  }, [user]);

  const handleInputChange = (field: keyof VolunteerWork, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditVolunteerWork = (volunteerWork: VolunteerWork) => {
    setEditingVolunteerWork(volunteerWork);
    setFormData({
      work_title: volunteerWork.work_title || "",
      work_type: volunteerWork.work_type || "",
      role: volunteerWork.role || "participant",
      organizing_organization: volunteerWork.organizing_organization || "",
      start_date: volunteerWork.start_date ? volunteerWork.start_date.split('T')[0] : "",
      end_date: volunteerWork.end_date ? volunteerWork.end_date.split('T')[0] : "",
      duration: volunteerWork.duration || "",
      location: volunteerWork.location || "",
      beneficiaries: volunteerWork.beneficiaries || "",
      certificates_documents: volunteerWork.certificates_documents || "",
      description: volunteerWork.description || "",
      is_active: volunteerWork.is_active || false,
      volunteer_work_document: volunteerWork.volunteer_work_document || "",
    });
    setFilePreview(volunteerWork.volunteer_work_document || "");
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('يرجى اختيار ملف PDF أو صورة (JPG, PNG, GIF)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview(base64String);
        setFormData({ ...formData, volunteer_work_document: base64String });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, we'll convert to base64 but show a placeholder preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview('data:application/pdf;base64,'); // Placeholder
        setFormData({ ...formData, volunteer_work_document: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview("");
    setFormData({ ...formData, volunteer_work_document: "" });
    // Reset file input
    const fileInput = document.getElementById('volunteer-work-document') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/volunteer-work`;

      const method = editingVolunteerWork?.id ? "PATCH" : "POST";

      // Get the final document value (from preview or formData)
      const volunteerWorkDocument = filePreview || formData.volunteer_work_document || null;

      const body = editingVolunteerWork?.id
        ? {
            id: editingVolunteerWork.id,
            workTitle: formData.work_title,
            workType: formData.work_type,
            role: formData.role,
            organizingOrganization: formData.organizing_organization,
            startDate: formData.start_date,
            endDate: formData.end_date,
            duration: formData.duration,
            location: formData.location,
            beneficiaries: formData.beneficiaries,
            certificatesDocuments: formData.certificates_documents,
            description: formData.description,
            isActive: formData.is_active,
            volunteerWorkDocument: volunteerWorkDocument,
          }
        : {
            userId: user.id,
            workTitle: formData.work_title,
            workType: formData.work_type,
            role: formData.role,
            organizingOrganization: formData.organizing_organization,
            startDate: formData.start_date,
            endDate: formData.end_date,
            duration: formData.duration,
            location: formData.location,
            beneficiaries: formData.beneficiaries,
            certificatesDocuments: formData.certificates_documents,
            description: formData.description,
            isActive: formData.is_active,
            volunteerWorkDocument: volunteerWorkDocument,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        let errorData;
        try {
          const errorText = await response.text();
          try {
            errorData = JSON.parse(errorText);
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: errorText };
          }
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, details: "خطأ غير معروف" };
        }
        console.error("API Error:", errorData);
        console.error("Response status:", response.status);
        throw new Error(errorData.error || errorData.details || "فشل حفظ العمل الطوعي");
      }

      const result = await response.json();
      const savedVolunteerWork = result.volunteerWork || result;

      if (editingVolunteerWork?.id) {
        setVolunteerWorks((prev) =>
          prev.map((w) => (w.id === savedVolunteerWork.id ? savedVolunteerWork : w))
        );
      } else {
        setVolunteerWorks((prev) => [savedVolunteerWork, ...prev]);
      }

      setShowForm(false);
      setEditingVolunteerWork(null);
      setFormData({
        work_title: "",
        work_type: "",
        role: "participant",
        organizing_organization: "",
        start_date: "",
        end_date: "",
        duration: "",
        location: "",
        beneficiaries: "",
        certificates_documents: "",
        description: "",
        is_active: false,
        volunteer_work_document: "",
      });
      setSelectedFile(null);
      setFilePreview("");
    } catch (error: any) {
      console.error("Error saving volunteer work:", error);
      alert(error.message || "حدث خطأ أثناء حفظ العمل الطوعي");
    }
  };

  const handleDeleteVolunteerWork = async () => {
    if (!volunteerWorkToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/volunteer-work?id=${volunteerWorkToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setVolunteerWorks((prev) => prev.filter((w) => w.id !== volunteerWorkToDelete.id));
        setVolunteerWorkToDelete(null);
      } else {
        throw new Error("فشل حذف العمل الطوعي");
      }
    } catch (error) {
      console.error("Error deleting volunteer work:", error);
      alert("حدث خطأ أثناء حذف العمل الطوعي");
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "coordinator":
        return "منسق";
      case "leader":
        return "قائد";
      case "participant":
        return "مشارك";
      case "member":
        return "عضو";
      default:
        return "-";
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>الأعمال الطوعية</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingVolunteerWork(null);
              setFormData({
                work_title: "",
                work_type: "",
                role: "participant",
                organizing_organization: "",
                start_date: "",
                end_date: "",
                duration: "",
                location: "",
                beneficiaries: "",
                certificates_documents: "",
                description: "",
                is_active: false,
                volunteer_work_document: "",
              });
              setSelectedFile(null);
              setFilePreview("");
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة عمل طوعي</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : volunteerWorks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد أعمال طوعية</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عمل طوعي جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    عنوان العمل الطوعي
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع العمل
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الدور
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الجهة المنظمة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ البداية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ النهاية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الكتاب/الأمر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {volunteerWorks.map((work) => (
                  <tr key={work.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {work.work_title}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {work.work_type || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getRoleLabel(work.role)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {work.organizing_organization || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {formatDate(work.start_date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {formatDate(work.end_date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {work.is_active ? "نشط ومستمر" : "غير نشط"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {work.volunteer_work_document ? (
                        <div className="flex items-center gap-2">
                          {work.volunteer_work_document.startsWith('data:image/') ? (
                            <>
                              <img 
                                src={work.volunteer_work_document} 
                                alt="معاينة" 
                                className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${work.volunteer_work_document}" style="max-width: 100%; height: auto;" />`);
                                  }
                                }}
                                title="اضغط لعرض الصورة بالحجم الكامل"
                              />
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = work.volunteer_work_document!;
                                  link.download = `volunteer_work_${work.id || 'document'}.jpg`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="p-1 text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded transition-colors"
                                title="تحميل الصورة"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <button
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow && work.volunteer_work_document) {
                                    newWindow.document.write(`
                                      <iframe src="${work.volunteer_work_document}" style="width: 100%; height: 100vh; border: none;"></iframe>
                                    `);
                                  }
                                }}
                                className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                title="عرض PDF"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = work.volunteer_work_document!;
                                  link.download = `volunteer_work_${work.id || 'document'}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                }}
                                className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-50 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                title="تحميل PDF"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditVolunteerWork(work)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setVolunteerWorkToDelete(work)}
                          className="text-red-600 hover:text-red-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {volunteerWorkToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف العمل الطوعي "{volunteerWorkToDelete.work_title}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setVolunteerWorkToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteVolunteerWork}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Volunteer Work Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingVolunteerWork?.id ? "تعديل العمل الطوعي" : "إضافة عمل طوعي جديد"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setSelectedFile(null);
                  setFilePreview("");
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  عنوان العمل الطوعي <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.work_title}
                  onChange={(e) => handleInputChange("work_title", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل عنوان العمل الطوعي"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع العمل <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.work_type}
                  onChange={(e) => handleInputChange("work_type", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر نوع العمل</option>
                  {workTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الدور <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="coordinator">منسق</option>
                  <option value="leader">قائد</option>
                  <option value="participant">مشارك</option>
                  <option value="member">عضو</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  اسم الجهة المنظمة للعمل الطوعي
                </label>
                <input
                  type="text"
                  value={formData.organizing_organization}
                  onChange={(e) => handleInputChange("organizing_organization", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل اسم الجهة المنظمة"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    تاريخ البداية <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange("start_date", e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    تاريخ النهاية
                  </label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange("end_date", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  المدة
                </label>
                <input
                  type="text"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل المدة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الموقع
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل الموقع"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  المستفيدون
                </label>
                <input
                  type="text"
                  value={formData.beneficiaries}
                  onChange={(e) => handleInputChange("beneficiaries", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل المستفيدون"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الشهادات أو الوثائق
                </label>
                <input
                  type="text"
                  value={formData.certificates_documents}
                  onChange={(e) => handleInputChange("certificates_documents", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل الشهادات أو الوثائق"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل وصف العمل الطوعي"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active || false}
                    onChange={(e) => handleInputChange("is_active", e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>
                    العمل الطوعي نشط ومستمر
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الكتاب أو الأمر (PDF أو صورة)
                </label>
                <div className="space-y-2">
                  <input
                    id="volunteer-work-document"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,application/pdf,image/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                  {filePreview && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">معاينة:</span>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="text-sm text-red-600 hover:text-red-800"
                        >
                          إزالة
                        </button>
                      </div>
                      {filePreview.startsWith('data:image/') ? (
                        <img 
                          src={filePreview} 
                          alt="معاينة" 
                          className="w-32 h-32 object-cover rounded border border-gray-300"
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 bg-white rounded border border-gray-300">
                          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm text-gray-700">تم اختيار ملف PDF</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                  style={{ color: '#374151' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300"
                >
                  {editingVolunteerWork?.id ? "تحديث العمل الطوعي" : "إضافة العمل الطوعي"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
