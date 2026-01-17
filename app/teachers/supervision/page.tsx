"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { formatDate } from "@/lib/utils/academic";

interface Supervision {
  id?: number;
  student_name: string;
  degree_type: "phd" | "masters" | "bachelors" | "diploma";
  thesis_title?: string;
  start_date: string;
  end_date?: string;
  is_completed?: boolean;
  supervision_type?: "single" | "joint";
  supervision_document?: string; // base64 string for PDF/image
  created_at?: string;
  updated_at?: string;
}

export default function SupervisionPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [supervisions, setSupervisions] = useState<Supervision[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSupervision, setEditingSupervision] = useState<Supervision | null>(null);
  const [supervisionToDelete, setSupervisionToDelete] = useState<Supervision | null>(null);
  const [formData, setFormData] = useState<Supervision>({
    student_name: "",
    degree_type: "masters",
    thesis_title: "",
    start_date: "",
    end_date: "",
    is_completed: false,
    supervision_type: "single",
    supervision_document: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  // Fetch supervisions on component mount
  useEffect(() => {
    const fetchSupervisions = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/supervision?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSupervisions(data);
        }
      } catch (error) {
        console.error("Error fetching supervisions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSupervisions();
  }, [user]);

  const handleInputChange = (field: keyof Supervision, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSupervision = (supervision: Supervision) => {
    setEditingSupervision(supervision);
    setFormData({
      student_name: supervision.student_name || "",
      degree_type: supervision.degree_type || "masters",
      thesis_title: supervision.thesis_title || "",
      start_date: supervision.start_date ? supervision.start_date.split('T')[0] : "",
      end_date: supervision.end_date ? supervision.end_date.split('T')[0] : "",
      is_completed: supervision.is_completed || false,
      supervision_type: supervision.supervision_type || "single",
      supervision_document: supervision.supervision_document || "",
    });
    setFilePreview(supervision.supervision_document || "");
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
        setFormData({ ...formData, supervision_document: base64String });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, we'll convert to base64 but show a placeholder preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview('data:application/pdf;base64,'); // Placeholder
        setFormData({ ...formData, supervision_document: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview("");
    setFormData({ ...formData, supervision_document: "" });
    // Reset file input
    const fileInput = document.getElementById('supervision-document') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/supervision`;

      const method = editingSupervision?.id ? "PATCH" : "POST";

      // Get the final document value (from preview or formData)
      const supervisionDocument = filePreview || formData.supervision_document || null;

      const body = editingSupervision?.id
        ? {
            id: editingSupervision.id,
            studentName: formData.student_name,
            degreeType: formData.degree_type,
            thesisTitle: formData.thesis_title,
            startDate: formData.start_date,
            endDate: formData.end_date,
            isCompleted: formData.is_completed,
            supervisionType: formData.degree_type !== "bachelors" ? formData.supervision_type : null,
            supervisionDocument: supervisionDocument,
          }
        : {
            userId: user.id,
            studentName: formData.student_name,
            degreeType: formData.degree_type,
            thesisTitle: formData.thesis_title,
            startDate: formData.start_date,
            endDate: formData.end_date,
            isCompleted: formData.is_completed,
            supervisionType: formData.degree_type !== "bachelors" ? formData.supervision_type : null,
            supervisionDocument: supervisionDocument,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ الإشراف");
      }

      const result = await response.json();
      const savedSupervision = result.supervision || result;

      if (editingSupervision?.id) {
        setSupervisions((prev) =>
          prev.map((s) => (s.id === savedSupervision.id ? savedSupervision : s))
        );
      } else {
        setSupervisions((prev) => [savedSupervision, ...prev]);
      }

      setShowForm(false);
      setEditingSupervision(null);
      setFormData({
        student_name: "",
        degree_type: "masters",
        thesis_title: "",
        start_date: "",
        end_date: "",
        is_completed: false,
        supervision_type: "single",
        supervision_document: "",
      });
      setSelectedFile(null);
      setFilePreview("");
    } catch (error: any) {
      console.error("Error saving supervision:", error);
      alert(error.message || "حدث خطأ أثناء حفظ الإشراف");
    }
  };

  const handleDeleteSupervision = async () => {
    if (!supervisionToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/supervision?id=${supervisionToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSupervisions((prev) => prev.filter((s) => s.id !== supervisionToDelete.id));
        setSupervisionToDelete(null);
      } else {
        throw new Error("فشل حذف الإشراف");
      }
    } catch (error) {
      console.error("Error deleting supervision:", error);
      alert("حدث خطأ أثناء حذف الإشراف");
    }
  };

  const getDegreeTypeLabel = (type?: string) => {
    switch (type) {
      case "phd":
        return "دكتوراه";
      case "masters":
        return "ماجستير";
      case "bachelors":
        return "بكالوريوس";
      case "diploma":
        return "دبلوم عالي";
      default:
        return "-";
    }
  };

  const getSupervisionTypeLabel = (type?: string) => {
    switch (type) {
      case "single":
        return "منفرد";
      case "joint":
        return "مشترك";
      default:
        return "-";
    }
  };

  const getStatusLabel = (isCompleted?: boolean) => {
    return isCompleted ? "مكتمل" : "غير مكتمل";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>الإشراف على الطلبة</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingSupervision(null);
              setFormData({
                student_name: "",
                degree_type: "masters",
                thesis_title: "",
                start_date: "",
                end_date: "",
                is_completed: false,
                supervision_type: "single",
                supervision_document: "",
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
            <span>إضافة إشراف</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : supervisions.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد إشرافات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة إشراف جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    اسم الطالب
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع الدرجة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    عنوان الرسالة/المشروع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ البداية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ الانتهاء
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    حالة المشروع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع الإشراف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    كتاب/أمر الإشراف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {supervisions.map((supervision) => (
                  <tr key={supervision.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {supervision.student_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getDegreeTypeLabel(supervision.degree_type)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {supervision.thesis_title || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {formatDate(supervision.start_date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {formatDate(supervision.end_date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getStatusLabel(supervision.is_completed)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {supervision.degree_type !== "bachelors" ? getSupervisionTypeLabel(supervision.supervision_type) : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {supervision.supervision_document ? (
                        <div className="flex items-center gap-2">
                          {supervision.supervision_document.startsWith('data:image/') ? (
                            <>
                              <img 
                                src={supervision.supervision_document} 
                                alt="معاينة" 
                                className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${supervision.supervision_document}" style="max-width: 100%; height: auto;" />`);
                                  }
                                }}
                                title="اضغط لعرض الصورة بالحجم الكامل"
                              />
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = supervision.supervision_document!;
                                  link.download = `supervision_${supervision.id || 'document'}.jpg`;
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
                                  if (newWindow && supervision.supervision_document) {
                                    newWindow.document.write(`
                                      <iframe src="${supervision.supervision_document}" style="width: 100%; height: 100vh; border: none;"></iframe>
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
                                  link.href = supervision.supervision_document!;
                                  link.download = `supervision_${supervision.id || 'document'}.pdf`;
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
                          onClick={() => handleEditSupervision(supervision)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSupervisionToDelete(supervision)}
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
      {supervisionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف الإشراف على "{supervisionToDelete.student_name}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSupervisionToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteSupervision}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Supervision Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingSupervision?.id ? "تعديل الإشراف" : "إضافة إشراف جديد"}
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
                  اسم الطالب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.student_name}
                  onChange={(e) => handleInputChange("student_name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل اسم الطالب"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع الدرجة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.degree_type}
                  onChange={(e) => {
                    handleInputChange("degree_type", e.target.value);
                    // Reset supervision_type if degree_type is bachelors
                    if (e.target.value === "bachelors") {
                      handleInputChange("supervision_type", undefined);
                    } else if (!formData.supervision_type) {
                      handleInputChange("supervision_type", "single");
                    }
                  }}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="phd">دكتوراه</option>
                  <option value="masters">ماجستير</option>
                  <option value="bachelors">بكالوريوس</option>
                  <option value="diploma">دبلوم عالي</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  عنوان الرسالة / المشروع
                </label>
                <input
                  type="text"
                  value={formData.thesis_title}
                  onChange={(e) => handleInputChange("thesis_title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل عنوان الرسالة أو المشروع"
                />
              </div>

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
                  تاريخ الانتهاء
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => handleInputChange("end_date", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_completed || false}
                    onChange={(e) => handleInputChange("is_completed", e.target.checked)}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>
                    المشروع مكتمل
                  </span>
                </label>
              </div>

              {formData.degree_type !== "bachelors" && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    نوع الإشراف
                  </label>
                  <select
                    value={formData.supervision_type || "single"}
                    onChange={(e) => handleInputChange("supervision_type", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  >
                    <option value="single">منفرد</option>
                    <option value="joint">مشترك</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  كتاب أو أمر الإشراف (PDF أو صورة)
                </label>
                <div className="space-y-2">
                  <input
                    id="supervision-document"
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
                  {editingSupervision?.id ? "تحديث الإشراف" : "إضافة الإشراف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
