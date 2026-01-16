"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface Assignment {
  id?: number;
  assignment_subject: string;
  assignment_date: string;
  is_completed?: boolean;
  completion_date?: string;
  created_at?: string;
  updated_at?: string;
}

export default function AssignmentsPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [formData, setFormData] = useState<Assignment>({
    assignment_subject: "",
    assignment_date: "",
    is_completed: false,
    completion_date: "",
  });

  // Fetch assignments on component mount
  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/assignments?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setAssignments(data);
        }
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  const handleInputChange = (field: keyof Assignment, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      assignment_subject: assignment.assignment_subject || "",
      assignment_date: assignment.assignment_date ? assignment.assignment_date.split('T')[0] : "",
      is_completed: assignment.is_completed || false,
      completion_date: assignment.completion_date ? assignment.completion_date.split('T')[0] : "",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate: if assignment is completed, completion date is required
    if (formData.is_completed && !formData.completion_date) {
      alert("يرجى إدخال تاريخ انتهاء التكليف");
      return;
    }

    try {
      const url = `/api/teachers/assignments`;

      const method = editingAssignment?.id ? "PATCH" : "POST";

      const body = editingAssignment?.id
        ? {
            id: editingAssignment.id,
            assignmentSubject: formData.assignment_subject,
            assignmentDate: formData.assignment_date,
            isCompleted: formData.is_completed,
            completionDate: formData.is_completed ? formData.completion_date : null,
          }
        : {
            userId: user.id,
            assignmentSubject: formData.assignment_subject,
            assignmentDate: formData.assignment_date,
            isCompleted: formData.is_completed,
            completionDate: formData.is_completed ? formData.completion_date : null,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ التكليف");
      }

      const result = await response.json();
      const savedAssignment = result.assignment || result;

      if (editingAssignment?.id) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === savedAssignment.id ? savedAssignment : a))
        );
      } else {
        setAssignments((prev) => [savedAssignment, ...prev]);
      }

      setShowForm(false);
      setEditingAssignment(null);
      setFormData({
        assignment_subject: "",
        assignment_date: "",
        is_completed: false,
        completion_date: "",
      });
    } catch (error: any) {
      console.error("Error saving assignment:", error);
      alert(error.message || "حدث خطأ أثناء حفظ التكليف");
    }
  };

  const handleDeleteAssignment = async () => {
    if (!assignmentToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/assignments?id=${assignmentToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setAssignments((prev) => prev.filter((a) => a.id !== assignmentToDelete.id));
        setAssignmentToDelete(null);
      } else {
        throw new Error("فشل حذف التكليف");
      }
    } catch (error) {
      console.error("Error deleting assignment:", error);
      alert("حدث خطأ أثناء حذف التكليف");
    }
  };

  const getStatusLabel = (isCompleted?: boolean) => {
    return isCompleted ? "منتهي" : "غير منتهي";
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>التكليفات</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingAssignment(null);
              setFormData({
                assignment_subject: "",
                assignment_date: "",
                is_completed: false,
                completion_date: "",
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة تكليف</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد تكليفات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة تكليف جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    موضوع التكليف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ التكليف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    حالة التكليف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ الانتهاء
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {assignment.assignment_subject}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {assignment.assignment_date ? new Date(assignment.assignment_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getStatusLabel(assignment.is_completed)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {assignment.completion_date ? new Date(assignment.completion_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditAssignment(assignment)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setAssignmentToDelete(assignment)}
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
      {assignmentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف التكليف "{assignmentToDelete.assignment_subject}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setAssignmentToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteAssignment}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Assignment Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingAssignment?.id ? "تعديل التكليف" : "إضافة تكليف جديد"}
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
                  موضوع التكليف <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.assignment_subject}
                  onChange={(e) => handleInputChange("assignment_subject", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل موضوع التكليف"
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
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_completed || false}
                    onChange={(e) => {
                      handleInputChange("is_completed", e.target.checked);
                      if (!e.target.checked) {
                        handleInputChange("completion_date", "");
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <span className="text-sm font-medium" style={{ color: '#374151' }}>
                    التكليف منتهي
                  </span>
                </label>
              </div>

              {formData.is_completed && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    تاريخ انتهاء التكليف <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.completion_date}
                    onChange={(e) => handleInputChange("completion_date", e.target.value)}
                    required={formData.is_completed}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>
              )}

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
                  {editingAssignment?.id ? "تحديث التكليف" : "إضافة التكليف"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
