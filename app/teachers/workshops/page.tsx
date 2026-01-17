"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { formatDate } from "@/lib/utils/academic";

interface Workshop {
  id?: number;
  workshop_title: string;
  date: string;
  type: "lecturer" | "participant";
  beneficiary_organization?: string;
  location?: string;
  assignment_document?: string; // base64 string for PDF/image
  created_at?: string;
  updated_at?: string;
}

export default function WorkshopsPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingWorkshop, setEditingWorkshop] = useState<Workshop | null>(null);
  const [workshopToDelete, setWorkshopToDelete] = useState<Workshop | null>(null);
  const [formData, setFormData] = useState<Workshop>({
    workshop_title: "",
    date: "",
    type: "lecturer",
    beneficiary_organization: "",
    location: "",
    assignment_document: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  // Fetch workshops on component mount
  useEffect(() => {
    const fetchWorkshops = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/workshops?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setWorkshops(data);
        }
      } catch (error) {
        console.error("Error fetching workshops:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWorkshops();
  }, [user]);

  const handleInputChange = (field: keyof Workshop, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditWorkshop = (workshop: Workshop) => {
    setEditingWorkshop(workshop);
    setFormData({
      workshop_title: workshop.workshop_title || "",
      date: workshop.date ? workshop.date.split('T')[0] : "",
      type: workshop.type || "lecturer",
      beneficiary_organization: workshop.beneficiary_organization || "",
      location: workshop.location || "",
      assignment_document: workshop.assignment_document || "",
    });
    setFilePreview(workshop.assignment_document || "");
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
        setFormData({ ...formData, assignment_document: base64String });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, we'll convert to base64 but show a placeholder preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview('data:application/pdf;base64,'); // Placeholder
        setFormData({ ...formData, assignment_document: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview("");
    setFormData({ ...formData, assignment_document: "" });
    // Reset file input
    const fileInput = document.getElementById('assignment-document') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/workshops`;

      const method = editingWorkshop?.id ? "PATCH" : "POST";

      // Get the final document value (from preview or formData)
      const assignmentDocument = filePreview || formData.assignment_document || null;

      const body = editingWorkshop?.id
        ? {
            id: editingWorkshop.id,
            workshopTitle: formData.workshop_title,
            date: formData.date,
            type: formData.type,
            beneficiaryOrganization: formData.beneficiary_organization,
            location: formData.location,
            assignmentDocument: assignmentDocument,
          }
        : {
            userId: user.id,
            workshopTitle: formData.workshop_title,
            date: formData.date,
            type: formData.type,
            beneficiaryOrganization: formData.beneficiary_organization,
            location: formData.location,
            assignmentDocument: assignmentDocument,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ ورشة العمل");
      }

      const result = await response.json();
      const savedWorkshop = result.workshop || result;

      if (editingWorkshop?.id) {
        setWorkshops((prev) =>
          prev.map((w) => (w.id === savedWorkshop.id ? savedWorkshop : w))
        );
      } else {
        setWorkshops((prev) => [savedWorkshop, ...prev]);
      }

      setShowForm(false);
      setEditingWorkshop(null);
      setFormData({
        workshop_title: "",
        date: "",
        type: "lecturer",
        beneficiary_organization: "",
        location: "",
        assignment_document: "",
      });
      setSelectedFile(null);
      setFilePreview("");
    } catch (error: any) {
      console.error("Error saving workshop:", error);
      alert(error.message || "حدث خطأ أثناء حفظ ورشة العمل");
    }
  };

  const handleDeleteWorkshop = async () => {
    if (!workshopToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/workshops?id=${workshopToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setWorkshops((prev) => prev.filter((w) => w.id !== workshopToDelete.id));
        setWorkshopToDelete(null);
      } else {
        throw new Error("فشل حذف ورشة العمل");
      }
    } catch (error) {
      console.error("Error deleting workshop:", error);
      alert("حدث خطأ أثناء حذف ورشة العمل");
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>ورش العمل</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingWorkshop(null);
              setFormData({
                workshop_title: "",
                date: "",
                type: "lecturer",
                beneficiary_organization: "",
                location: "",
                assignment_document: "",
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
            <span>إضافة ورشة عمل</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : workshops.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد ورش عمل</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة ورشة عمل جديدة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    عنوان ورشة العمل
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
                    كتاب/أمر الورشة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workshops.map((workshop) => (
                  <tr key={workshop.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {workshop.workshop_title}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {formatDate(workshop.date)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {getTypeLabel(workshop.type)}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {workshop.beneficiary_organization || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {workshop.location || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {workshop.assignment_document ? (
                        <div className="flex items-center gap-2">
                          {workshop.assignment_document.startsWith('data:image/') ? (
                            <>
                              <img 
                                src={workshop.assignment_document} 
                                alt="معاينة" 
                                className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${workshop.assignment_document}" style="max-width: 100%; height: auto;" />`);
                                  }
                                }}
                                title="اضغط لعرض الصورة بالحجم الكامل"
                              />
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = workshop.assignment_document!;
                                  link.download = `assignment_${workshop.id || 'document'}.jpg`;
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
                                  if (newWindow && workshop.assignment_document) {
                                    newWindow.document.write(`
                                      <iframe src="${workshop.assignment_document}" style="width: 100%; height: 100vh; border: none;"></iframe>
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
                                  link.href = workshop.assignment_document!;
                                  link.download = `assignment_${workshop.id || 'document'}.pdf`;
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
                          onClick={() => handleEditWorkshop(workshop)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setWorkshopToDelete(workshop)}
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
      {workshopToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف ورشة العمل "{workshopToDelete.workshop_title}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setWorkshopToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteWorkshop}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Workshop Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingWorkshop?.id ? "تعديل ورشة العمل" : "إضافة ورشة عمل جديدة"}
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
                  عنوان ورشة العمل <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.workshop_title}
                  onChange={(e) => handleInputChange("workshop_title", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل عنوان ورشة العمل"
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
                  مكان انعقاد ورشة العمل
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل مكان انعقاد ورشة العمل"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  كتاب أو أمر الورشة (PDF أو صورة)
                </label>
                <div className="space-y-2">
                  <input
                    id="assignment-document"
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
                  {editingWorkshop?.id ? "تحديث ورشة العمل" : "إضافة ورشة العمل"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
