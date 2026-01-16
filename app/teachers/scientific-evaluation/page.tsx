"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface ScientificEvaluation {
  id?: number;
  evaluation_title: string;
  evaluation_type?: string;
  evaluation_date: string;
  description?: string;
  status: "planned" | "in_progress" | "completed";
  created_at?: string;
  updated_at?: string;
}

export default function ScientificEvaluationPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [evaluations, setEvaluations] = useState<ScientificEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<ScientificEvaluation | null>(null);
  const [evaluationToDelete, setEvaluationToDelete] = useState<ScientificEvaluation | null>(null);
  const [formData, setFormData] = useState<ScientificEvaluation>({
    evaluation_title: "",
    evaluation_type: "",
    evaluation_date: "",
    description: "",
    status: "planned",
  });

  // Fetch evaluations on component mount
  useEffect(() => {
    const fetchEvaluations = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/scientific-evaluation?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setEvaluations(data);
        }
      } catch (error) {
        console.error("Error fetching scientific evaluations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvaluations();
  }, [user]);

  const handleInputChange = (field: keyof ScientificEvaluation, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditEvaluation = (evaluation: ScientificEvaluation) => {
    setEditingEvaluation(evaluation);
    setFormData({
      evaluation_title: evaluation.evaluation_title || "",
      evaluation_type: evaluation.evaluation_type || "",
      evaluation_date: evaluation.evaluation_date ? evaluation.evaluation_date.split('T')[0] : "",
      description: evaluation.description || "",
      status: evaluation.status || "planned",
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/scientific-evaluation`;

      const method = editingEvaluation?.id ? "PATCH" : "POST";

      const body = editingEvaluation?.id
        ? {
            id: editingEvaluation.id,
            evaluationTitle: formData.evaluation_title,
            evaluationType: formData.evaluation_type,
            evaluationDate: formData.evaluation_date,
            description: formData.description,
            status: formData.status,
          }
        : {
            userId: user.id,
            evaluationTitle: formData.evaluation_title,
            evaluationType: formData.evaluation_type,
            evaluationDate: formData.evaluation_date,
            description: formData.description,
            status: formData.status,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ التقويم");
      }

      const result = await response.json();
      const savedEvaluation = result.evaluation || result;

      if (editingEvaluation?.id) {
        setEvaluations((prev) =>
          prev.map((e) => (e.id === savedEvaluation.id ? savedEvaluation : e))
        );
      } else {
        setEvaluations((prev) => [savedEvaluation, ...prev]);
      }

      setShowForm(false);
      setEditingEvaluation(null);
      setFormData({
        evaluation_title: "",
        evaluation_type: "",
        evaluation_date: "",
        description: "",
        status: "planned",
      });
    } catch (error: any) {
      console.error("Error saving scientific evaluation:", error);
      alert(error.message || "حدث خطأ أثناء حفظ التقويم");
    }
  };

  const handleDeleteEvaluation = async () => {
    if (!evaluationToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/scientific-evaluation?id=${evaluationToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setEvaluations((prev) => prev.filter((e) => e.id !== evaluationToDelete.id));
        setEvaluationToDelete(null);
      } else {
        throw new Error("فشل حذف التقويم");
      }
    } catch (error) {
      console.error("Error deleting scientific evaluation:", error);
      alert("حدث خطأ أثناء حذف التقويم");
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case "planned":
        return "مخطط";
      case "in_progress":
        return "قيد التنفيذ";
      case "completed":
        return "مكتمل";
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>التقويم العلمي أو اللغوي</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingEvaluation(null);
              setFormData({
                evaluation_title: "",
                evaluation_type: "",
                evaluation_date: "",
                description: "",
                status: "planned",
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة تقويم</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : evaluations.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد تقويمات</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة تقويم جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    عنوان التقويم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    نوع التقويم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    تاريخ التقويم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الوصف
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    حالة التقويم
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {evaluations.map((evaluation) => (
                  <tr key={evaluation.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {evaluation.evaluation_title}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {evaluation.evaluation_type || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {evaluation.evaluation_date ? new Date(evaluation.evaluation_date).toLocaleDateString('ar-EG') : "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {evaluation.description || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getStatusLabel(evaluation.status)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditEvaluation(evaluation)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setEvaluationToDelete(evaluation)}
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
      {evaluationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف التقويم "{evaluationToDelete.evaluation_title}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setEvaluationToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteEvaluation}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Evaluation Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingEvaluation?.id ? "تعديل التقويم" : "إضافة تقويم جديد"}
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
                  عنوان التقويم <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.evaluation_title}
                  onChange={(e) => handleInputChange("evaluation_title", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل عنوان التقويم"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع التقويم
                </label>
                <input
                  type="text"
                  value={formData.evaluation_type}
                  onChange={(e) => handleInputChange("evaluation_type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل نوع التقويم"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  تاريخ التقويم <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.evaluation_date}
                  onChange={(e) => handleInputChange("evaluation_date", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
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
                  placeholder="أدخل وصف التقويم"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  حالة التقويم <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange("status", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="planned">مخطط</option>
                  <option value="in_progress">قيد التنفيذ</option>
                  <option value="completed">مكتمل</option>
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
                  {editingEvaluation?.id ? "تحديث التقويم" : "إضافة التقويم"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
