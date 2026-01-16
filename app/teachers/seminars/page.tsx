"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface Seminar {
  id?: number;
  seminar_title: string;
  date: string;
  type: "lecturer" | "participant";
  beneficiary_organization?: string;
  location?: string;
  created_at?: string;
  updated_at?: string;
}

export default function SeminarsPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [seminars, setSeminars] = useState<Seminar[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingSeminar, setEditingSeminar] = useState<Seminar | null>(null);
  const [seminarToDelete, setSeminarToDelete] = useState<Seminar | null>(null);
  const [formData, setFormData] = useState<Seminar>({
    seminar_title: "",
    date: "",
    type: "lecturer",
    beneficiary_organization: "",
    location: "",
  });

  // Fetch seminars on component mount
  useEffect(() => {
    const fetchSeminars = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/seminars?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setSeminars(data);
        }
      } catch (error) {
        console.error("Error fetching seminars:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeminars();
  }, [user]);

  const handleInputChange = (field: keyof Seminar, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditSeminar = (seminar: Seminar) => {
    setEditingSeminar(seminar);
    setFormData({
      seminar_title: seminar.seminar_title || "",
      date: seminar.date ? seminar.date.split('T')[0] : "",
      type: seminar.type || "lecturer",
      beneficiary_organization: seminar.beneficiary_organization || "",
      location: seminar.location || "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/seminars`;

      const method = editingSeminar?.id ? "PATCH" : "POST";

      const body = editingSeminar?.id
        ? {
            id: editingSeminar.id,
            seminarTitle: formData.seminar_title,
            date: formData.date,
            type: formData.type,
            beneficiaryOrganization: formData.beneficiary_organization,
            location: formData.location,
          }
        : {
            userId: user.id,
            seminarTitle: formData.seminar_title,
            date: formData.date,
            type: formData.type,
            beneficiaryOrganization: formData.beneficiary_organization,
            location: formData.location,
          };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error("API Error:", errorData);
        throw new Error(errorData.error || errorData.details || "فشل حفظ الندوة");
      }

      const result = await response.json();
      const savedSeminar = result.seminar || result;

      if (editingSeminar?.id) {
        setSeminars((prev) =>
          prev.map((s) => (s.id === savedSeminar.id ? savedSeminar : s))
        );
      } else {
        setSeminars((prev) => [savedSeminar, ...prev]);
      }

      setShowForm(false);
      setEditingSeminar(null);
      setFormData({
        seminar_title: "",
        date: "",
        type: "lecturer",
        beneficiary_organization: "",
        location: "",
      });
    } catch (error: any) {
      console.error("Error saving seminar:", error);
      alert(error.message || "حدث خطأ أثناء حفظ الندوة");
    }
  };

  const handleDeleteSeminar = async () => {
    if (!seminarToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/seminars?id=${seminarToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSeminars((prev) => prev.filter((s) => s.id !== seminarToDelete.id));
        setSeminarToDelete(null);
      } else {
        throw new Error("فشل حذف الندوة");
      }
    } catch (error) {
      console.error("Error deleting seminar:", error);
      alert("حدث خطأ أثناء حذف الندوة");
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case "lecturer":
        return "محاضر";
      case "participant":
        return "مشترك";
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>الندوات</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingSeminar(null);
              setFormData({
                seminar_title: "",
                date: "",
                type: "lecturer",
                beneficiary_organization: "",
                location: "",
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة ندوة</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : seminars.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد ندوات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة ندوة جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    عنوان الندوة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    التاريخ
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    النوع
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الجهة المستفيدة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    مكان الانعقاد
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {seminars.map((seminar) => (
                  <tr key={seminar.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {seminar.seminar_title}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {seminar.date ? new Date(seminar.date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getTypeLabel(seminar.type)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {seminar.beneficiary_organization || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {seminar.location || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditSeminar(seminar)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setSeminarToDelete(seminar)}
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
      {seminarToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف الندوة "{seminarToDelete.seminar_title}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setSeminarToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteSeminar}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Seminar Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingSeminar?.id ? "تعديل الندوة" : "إضافة ندوة جديدة"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
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
                  عنوان الندوة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.seminar_title}
                  onChange={(e) => handleInputChange("seminar_title", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل عنوان الندوة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  التاريخ <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange("date", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  النوع <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="lecturer">محاضر</option>
                  <option value="participant">مشترك</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الجهة المستفيدة
                </label>
                <input
                  type="text"
                  value={formData.beneficiary_organization}
                  onChange={(e) => handleInputChange("beneficiary_organization", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل الجهة المستفيدة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  مكان انعقاد الندوة
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل مكان انعقاد الندوة"
                />
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
                  {editingSeminar?.id ? "تحديث الندوة" : "إضافة الندوة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
