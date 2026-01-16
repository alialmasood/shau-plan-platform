"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface Committee {
  id?: number;
  committee_name: string;
  assignment_date: string;
  assignment_type: "member" | "chairman";
  created_at?: string;
  updated_at?: string;
}

export default function CommitteesPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [committeeToDelete, setCommitteeToDelete] = useState<Committee | null>(null);
  const [formData, setFormData] = useState<Committee>({
    committee_name: "",
    assignment_date: "",
    assignment_type: "member",
  });

  // Fetch committees on component mount
  useEffect(() => {
    const fetchCommittees = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/committees?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCommittees(data);
        }
      } catch (error) {
        console.error("Error fetching committees:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommittees();
  }, [user]);

  const handleInputChange = (field: keyof Committee, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCommittee = (committee: Committee) => {
    setEditingCommittee(committee);
    setFormData({
      committee_name: committee.committee_name || "",
      assignment_date: committee.assignment_date ? committee.assignment_date.split('T')[0] : "",
      assignment_type: committee.assignment_type || "member",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/committees`;

      const method = editingCommittee?.id ? "PATCH" : "POST";

      const body = editingCommittee?.id
        ? {
            id: editingCommittee.id,
            committeeName: formData.committee_name,
            assignmentDate: formData.assignment_date,
            assignmentType: formData.assignment_type,
          }
        : {
            userId: user.id,
            committeeName: formData.committee_name,
            assignmentDate: formData.assignment_date,
            assignmentType: formData.assignment_type,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ اللجنة");
      }

      const result = await response.json();
      const savedCommittee = result.committee || result;

      if (editingCommittee?.id) {
        setCommittees((prev) =>
          prev.map((c) => (c.id === savedCommittee.id ? savedCommittee : c))
        );
      } else {
        setCommittees((prev) => [savedCommittee, ...prev]);
      }

      setShowForm(false);
      setEditingCommittee(null);
      setFormData({
        committee_name: "",
        assignment_date: "",
        assignment_type: "member",
      });
    } catch (error: any) {
      console.error("Error saving committee:", error);
      alert(error.message || "حدث خطأ أثناء حفظ اللجنة");
    }
  };

  const handleDeleteCommittee = async () => {
    if (!committeeToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/committees?id=${committeeToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCommittees((prev) => prev.filter((c) => c.id !== committeeToDelete.id));
        setCommitteeToDelete(null);
      } else {
        throw new Error("فشل حذف اللجنة");
      }
    } catch (error) {
      console.error("Error deleting committee:", error);
      alert("حدث خطأ أثناء حذف اللجنة");
    }
  };

  const getAssignmentTypeLabel = (type?: string) => {
    switch (type) {
      case "member":
        return "عضو لجنة";
      case "chairman":
        return "رئيس لجنة";
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>اللجان</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingCommittee(null);
              setFormData({
                committee_name: "",
                assignment_date: "",
                assignment_type: "member",
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة لجنة</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : committees.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد لجان</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة لجنة جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    اسم اللجنة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ التكليف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع التكليف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {committees.map((committee) => (
                  <tr key={committee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {committee.committee_name}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {committee.assignment_date ? new Date(committee.assignment_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getAssignmentTypeLabel(committee.assignment_type)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCommittee(committee)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCommitteeToDelete(committee)}
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
      {committeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف اللجنة "{committeeToDelete.committee_name}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCommitteeToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteCommittee}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Committee Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingCommittee?.id ? "تعديل اللجنة" : "إضافة لجنة جديدة"}
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
                  اسم اللجنة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.committee_name}
                  onChange={(e) => handleInputChange("committee_name", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل اسم اللجنة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  تاريخ التكليف <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.assignment_date}
                  onChange={(e) => handleInputChange("assignment_date", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع التكليف <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assignment_type}
                  onChange={(e) => handleInputChange("assignment_type", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="member">عضو لجنة</option>
                  <option value="chairman">رئيس لجنة</option>
                </select>
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
                  {editingCommittee?.id ? "تحديث اللجنة" : "إضافة اللجنة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
