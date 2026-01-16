"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface ParticipationCertificate {
  id?: number;
  certificate_subject: string;
  granting_organization: string;
  month?: string;
  year: number;
  created_at?: string;
  updated_at?: string;
}

const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ParticipationCertificatesPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [certificates, setCertificates] = useState<ParticipationCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCertificate, setEditingCertificate] = useState<ParticipationCertificate | null>(null);
  const [certificateToDelete, setCertificateToDelete] = useState<ParticipationCertificate | null>(null);
  const [formData, setFormData] = useState<ParticipationCertificate>({
    certificate_subject: "",
    granting_organization: "",
    month: "",
    year: new Date().getFullYear(),
  });

  // Fetch certificates on component mount
  useEffect(() => {
    const fetchCertificates = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/participation-certificates?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCertificates(data);
        }
      } catch (error) {
        console.error("Error fetching participation certificates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  const handleInputChange = (field: keyof ParticipationCertificate, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditCertificate = (certificate: ParticipationCertificate) => {
    setEditingCertificate(certificate);
    setFormData({
      certificate_subject: certificate.certificate_subject || "",
      granting_organization: certificate.granting_organization || "",
      month: certificate.month || "",
      year: certificate.year || new Date().getFullYear(),
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/participation-certificates`;

      const method = editingCertificate?.id ? "PATCH" : "POST";

      const body = editingCertificate?.id
        ? {
            id: editingCertificate.id,
            certificateSubject: formData.certificate_subject,
            grantingOrganization: formData.granting_organization,
            month: formData.month,
            year: formData.year,
          }
        : {
            userId: user.id,
            certificateSubject: formData.certificate_subject,
            grantingOrganization: formData.granting_organization,
            month: formData.month,
            year: formData.year,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ شهادة المشاركة");
      }

      const result = await response.json();
      const savedCertificate = result.certificate || result;

      if (editingCertificate?.id) {
        setCertificates((prev) =>
          prev.map((c) => (c.id === savedCertificate.id ? savedCertificate : c))
        );
      } else {
        setCertificates((prev) => [savedCertificate, ...prev]);
      }

      setShowForm(false);
      setEditingCertificate(null);
      setFormData({
        certificate_subject: "",
        granting_organization: "",
        month: "",
        year: new Date().getFullYear(),
      });
    } catch (error: any) {
      console.error("Error saving participation certificate:", error);
      alert(error.message || "حدث خطأ أثناء حفظ شهادة المشاركة");
    }
  };

  const handleDeleteCertificate = async () => {
    if (!certificateToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/participation-certificates?id=${certificateToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setCertificates((prev) => prev.filter((c) => c.id !== certificateToDelete.id));
        setCertificateToDelete(null);
      } else {
        throw new Error("فشل حذف شهادة المشاركة");
      }
    } catch (error) {
      console.error("Error deleting participation certificate:", error);
      alert("حدث خطأ أثناء حذف شهادة المشاركة");
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>شهادات المشاركة</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingCertificate(null);
              setFormData({
                certificate_subject: "",
                granting_organization: "",
                month: "",
                year: new Date().getFullYear(),
              });
              setShowForm(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 min-w-[140px] justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة شهادة مشاركة</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد شهادات مشاركة</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة شهادة مشاركة جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    موضوع الشهادة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الجهة المانحة للشهادة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الشهر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    السنة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {certificate.certificate_subject}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {certificate.granting_organization}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {certificate.month || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {certificate.year || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditCertificate(certificate)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setCertificateToDelete(certificate)}
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
      {certificateToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف شهادة المشاركة "{certificateToDelete.certificate_subject}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setCertificateToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteCertificate}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Certificate Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingCertificate?.id ? "تعديل شهادة المشاركة" : "إضافة شهادة مشاركة جديدة"}
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
                  موضوع الشهادة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.certificate_subject}
                  onChange={(e) => handleInputChange("certificate_subject", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل موضوع الشهادة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الجهة المانحة للشهادة <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.granting_organization}
                  onChange={(e) => handleInputChange("granting_organization", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل الجهة المانحة للشهادة"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الشهر
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => handleInputChange("month", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                >
                  <option value="">اختر الشهر</option>
                  {months.map((month, index) => (
                    <option key={index} value={month}>{month}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  السنة <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", parseInt(e.target.value) || new Date().getFullYear())}
                  required
                  min="1900"
                  max="2100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل السنة"
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
                  {editingCertificate?.id ? "تحديث شهادة المشاركة" : "إضافة شهادة المشاركة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
