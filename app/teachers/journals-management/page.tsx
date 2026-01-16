"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface JournalMembership {
  id?: number;
  journal_name: string;
  role: "editor_in_chief" | "assistant_editor" | "editorial_board" | "reviewer";
  journal_type: "local" | "international" | "arabic" | "english";
  start_date: string;
  end_date?: string;
  impact_factor?: string;
  description?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export default function JournalsManagementPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [memberships, setMemberships] = useState<JournalMembership[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingMembership, setEditingMembership] = useState<JournalMembership | null>(null);
  const [membershipToDelete, setMembershipToDelete] = useState<JournalMembership | null>(null);
  const [formData, setFormData] = useState<JournalMembership>({
    journal_name: "",
    role: "editor_in_chief",
    journal_type: "local",
    start_date: "",
    end_date: "",
    impact_factor: "",
    description: "",
    is_active: true,
  });

  // Fetch memberships on component mount
  useEffect(() => {
    const fetchMemberships = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/journals-management?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setMemberships(data);
        }
      } catch (error) {
        console.error("Error fetching journal memberships:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMemberships();
  }, [user]);

  const handleInputChange = (field: keyof JournalMembership, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditMembership = (membership: JournalMembership) => {
    setEditingMembership(membership);
    setFormData({
      journal_name: membership.journal_name || "",
      role: membership.role || "editor_in_chief",
      journal_type: membership.journal_type || "local",
      start_date: membership.start_date ? membership.start_date.split('T')[0] : "",
      end_date: membership.end_date ? membership.end_date.split('T')[0] : "",
      impact_factor: membership.impact_factor || "",
      description: membership.description || "",
      is_active: membership.is_active !== undefined ? membership.is_active : true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/journals-management`;

      const method = editingMembership?.id ? "PATCH" : "POST";

      const body = editingMembership?.id
        ? {
            id: editingMembership.id,
            journalName: formData.journal_name,
            role: formData.role,
            journalType: formData.journal_type,
            startDate: formData.start_date,
            endDate: formData.end_date,
            impactFactor: formData.impact_factor,
            description: formData.description,
            isActive: formData.is_active,
          }
        : {
            userId: user.id,
            journalName: formData.journal_name,
            role: formData.role,
            journalType: formData.journal_type,
            startDate: formData.start_date,
            endDate: formData.end_date,
            impactFactor: formData.impact_factor,
            description: formData.description,
            isActive: formData.is_active,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ العضوية");
      }

      const result = await response.json();
      const savedMembership = result.membership || result;

      if (editingMembership?.id) {
        setMemberships((prev) =>
          prev.map((m) => (m.id === savedMembership.id ? savedMembership : m))
        );
      } else {
        setMemberships((prev) => [savedMembership, ...prev]);
      }

      setShowForm(false);
      setEditingMembership(null);
      setFormData({
        journal_name: "",
        role: "editor_in_chief",
        journal_type: "local",
        start_date: "",
        end_date: "",
        impact_factor: "",
        description: "",
        is_active: true,
      });
    } catch (error: any) {
      console.error("Error saving journal membership:", error);
      alert(error.message || "حدث خطأ أثناء حفظ العضوية");
    }
  };

  const handleDeleteMembership = async () => {
    if (!membershipToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/journals-management?id=${membershipToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMemberships((prev) => prev.filter((m) => m.id !== membershipToDelete.id));
        setMembershipToDelete(null);
      } else {
        throw new Error("فشل حذف العضوية");
      }
    } catch (error) {
      console.error("Error deleting journal membership:", error);
      alert("حدث خطأ أثناء حذف العضوية");
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "editor_in_chief":
        return "مدير تحرير";
      case "assistant_editor":
        return "محرر مساعد";
      case "editorial_board":
        return "عضو هيئة تحرير";
      case "reviewer":
        return "محكم";
      default:
        return "-";
    }
  };

  const getJournalTypeLabel = (type?: string) => {
    switch (type) {
      case "local":
        return "محلية";
      case "international":
        return "دولية";
      case "arabic":
        return "عربية";
      case "english":
        return "انكليزية";
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>إدارة المجلات العلمية</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingMembership(null);
              setFormData({
                journal_name: "",
                role: "editor_in_chief",
                journal_type: "local",
                start_date: "",
                end_date: "",
                impact_factor: "",
                description: "",
                is_active: true,
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة عضوية</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد عضويات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة عضوية جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    اسم المجلة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الدور في المجلة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع المجلة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ البداية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ النهاية
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    معامل التأثير
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الحالة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {memberships.map((membership) => (
                  <tr key={membership.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {membership.journal_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getRoleLabel(membership.role)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getJournalTypeLabel(membership.journal_type)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {membership.start_date ? new Date(membership.start_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {membership.end_date ? new Date(membership.end_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {membership.impact_factor || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {membership.is_active ? "نشط" : "غير نشط"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditMembership(membership)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setMembershipToDelete(membership)}
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
      {membershipToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف العضوية في "{membershipToDelete.journal_name}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setMembershipToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteMembership}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Membership Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingMembership?.id ? "تعديل العضوية" : "إضافة عضوية مجلة جديدة"}
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
                  اسم المجلة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.journal_name}
                  onChange={(e) => handleInputChange("journal_name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل اسم المجلة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الدور في المجلة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange("role", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="editor_in_chief">مدير تحرير</option>
                  <option value="assistant_editor">محرر مساعد</option>
                  <option value="editorial_board">عضو هيئة تحرير</option>
                  <option value="reviewer">محكم</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع المجلة <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.journal_type}
                  onChange={(e) => handleInputChange("journal_type", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="local">محلية</option>
                  <option value="international">دولية</option>
                  <option value="arabic">عربية</option>
                  <option value="english">انكليزية</option>
                </select>
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

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  معامل التأثير
                </label>
                <input
                  type="text"
                  value={formData.impact_factor}
                  onChange={(e) => handleInputChange("impact_factor", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل معامل التأثير"
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
                  placeholder="أدخل وصف العضوية"
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
                    نشط حالياً
                  </span>
                </label>
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
                  {editingMembership?.id ? "تحديث العضوية" : "إضافة العضوية"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
