"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";

interface ThankYouBook {
  id?: number;
  granting_organization: string;
  thank_you_direction?: string;
  month?: string;
  year: number;
  thank_you_book_document?: string; // base64 string for PDF/image
  created_at?: string;
  updated_at?: string;
}

const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ThankYouBooksPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [thankYouBooks, setThankYouBooks] = useState<ThankYouBook[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingThankYouBook, setEditingThankYouBook] = useState<ThankYouBook | null>(null);
  const [thankYouBookToDelete, setThankYouBookToDelete] = useState<ThankYouBook | null>(null);
  const [formData, setFormData] = useState<ThankYouBook>({
    granting_organization: "",
    thank_you_direction: "",
    month: "",
    year: new Date().getFullYear(),
    thank_you_book_document: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  // Fetch thank you books on component mount
  useEffect(() => {
    const fetchThankYouBooks = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/thank-you-books?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setThankYouBooks(data);
        }
      } catch (error) {
        console.error("Error fetching thank you books:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchThankYouBooks();
  }, [user]);

  const handleInputChange = (field: keyof ThankYouBook, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditThankYouBook = (thankYouBook: ThankYouBook) => {
    setEditingThankYouBook(thankYouBook);
    setFormData({
      granting_organization: thankYouBook.granting_organization || "",
      thank_you_direction: thankYouBook.thank_you_direction || "",
      month: thankYouBook.month || "",
      year: thankYouBook.year || new Date().getFullYear(),
      thank_you_book_document: thankYouBook.thank_you_book_document || "",
    });
    setFilePreview(thankYouBook.thank_you_book_document || "");
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
        setFormData({ ...formData, thank_you_book_document: base64String });
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // For PDF, we'll convert to base64 but show a placeholder preview
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setFilePreview('data:application/pdf;base64,'); // Placeholder
        setFormData({ ...formData, thank_you_book_document: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFilePreview("");
    setFormData({ ...formData, thank_you_book_document: "" });
    // Reset file input
    const fileInput = document.getElementById('thank-you-book-document') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      const url = `/api/teachers/thank-you-books`;

      const method = editingThankYouBook?.id ? "PATCH" : "POST";

      // Get the final document value (from preview or formData)
      const thankYouBookDocument = filePreview || formData.thank_you_book_document || null;

      const body = editingThankYouBook?.id
        ? {
            id: editingThankYouBook.id,
            grantingOrganization: formData.granting_organization,
            thankYouDirection: formData.thank_you_direction,
            month: formData.month,
            year: formData.year,
            thankYouBookDocument: thankYouBookDocument,
          }
        : {
            userId: user.id,
            grantingOrganization: formData.granting_organization,
            thankYouDirection: formData.thank_you_direction,
            month: formData.month,
            year: formData.year,
            thankYouBookDocument: thankYouBookDocument,
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
        throw new Error(errorData.error || errorData.details || "فشل حفظ كتاب الشكر");
      }

      const result = await response.json();
      const savedThankYouBook = result.thankYouBook || result;

      if (editingThankYouBook?.id) {
        setThankYouBooks((prev) =>
          prev.map((b) => (b.id === savedThankYouBook.id ? savedThankYouBook : b))
        );
      } else {
        setThankYouBooks((prev) => [savedThankYouBook, ...prev]);
      }

      setShowForm(false);
      setEditingThankYouBook(null);
      setFormData({
        granting_organization: "",
        thank_you_direction: "",
        month: "",
        year: new Date().getFullYear(),
        thank_you_book_document: "",
      });
      setSelectedFile(null);
      setFilePreview("");
    } catch (error: any) {
      console.error("Error saving thank you book:", error);
      alert(error.message || "حدث خطأ أثناء حفظ كتاب الشكر");
    }
  };

  const handleDeleteThankYouBook = async () => {
    if (!thankYouBookToDelete?.id) return;

    try {
      const response = await fetch(`/api/teachers/thank-you-books?id=${thankYouBookToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setThankYouBooks((prev) => prev.filter((b) => b.id !== thankYouBookToDelete.id));
        setThankYouBookToDelete(null);
      } else {
        throw new Error("فشل حذف كتاب الشكر");
      }
    } catch (error) {
      console.error("Error deleting thank you book:", error);
      alert("حدث خطأ أثناء حذف كتاب الشكر");
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
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>كتب الشكر والتقدير</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <button
            onClick={() => {
              setEditingThankYouBook(null);
              setFormData({
                granting_organization: "",
                thank_you_direction: "",
                month: "",
                year: new Date().getFullYear(),
                thank_you_book_document: "",
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
            <span>إضافة كتاب شكر</span>
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">جاري التحميل...</p>
          </div>
        ) : thankYouBooks.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h3 className="mt-2 text-sm font-medium" style={{ color: '#374151' }}>لا توجد كتب شكر</h3>
            <p className="mt-1 text-sm text-gray-500">ابدأ بإضافة كتاب شكر جديد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الجهة المانحة للشكر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    توجيه الشكر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الشهر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    السنة
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    كتاب الشكر
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider" style={{ color: '#6B7280' }}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {thankYouBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        {book.granting_organization}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {book.thank_you_direction || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {book.month || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>
                        {book.year || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {book.thank_you_book_document ? (
                        <div className="flex items-center gap-2">
                          {book.thank_you_book_document.startsWith('data:image/') ? (
                            <>
                              <img 
                                src={book.thank_you_book_document} 
                                alt="معاينة" 
                                className="w-12 h-12 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  const newWindow = window.open();
                                  if (newWindow) {
                                    newWindow.document.write(`<img src="${book.thank_you_book_document}" style="max-width: 100%; height: auto;" />`);
                                  }
                                }}
                                title="اضغط لعرض الصورة بالحجم الكامل"
                              />
                              <button
                                onClick={() => {
                                  const link = document.createElement('a');
                                  link.href = book.thank_you_book_document!;
                                  link.download = `thank_you_book_${book.id || 'document'}.jpg`;
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
                                  if (newWindow && book.thank_you_book_document) {
                                    newWindow.document.write(`
                                      <iframe src="${book.thank_you_book_document}" style="width: 100%; height: 100vh; border: none;"></iframe>
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
                                  link.href = book.thank_you_book_document!;
                                  link.download = `thank_you_book_${book.id || 'document'}.pdf`;
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
                          onClick={() => handleEditThankYouBook(book)}
                          className="text-indigo-600 hover:text-indigo-900 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setThankYouBookToDelete(book)}
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
      {thankYouBookToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف كتاب الشكر "{thankYouBookToDelete.granting_organization}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setThankYouBookToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteThankYouBook}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Thank You Book Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingThankYouBook?.id ? "تعديل كتاب الشكر" : "إضافة كتاب شكر جديد"}
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
                  الجهة المانحة للشكر <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.granting_organization}
                  onChange={(e) => handleInputChange("granting_organization", e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل الجهة المانحة للشكر"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  توجيه الشكر
                </label>
                <input
                  type="text"
                  value={formData.thank_you_direction}
                  onChange={(e) => handleInputChange("thank_you_direction", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  placeholder="أدخل توجيه الشكر"
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

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  كتاب الشكر (PDF أو صورة)
                </label>
                <div className="space-y-2">
                  <input
                    id="thank-you-book-document"
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
                  {editingThankYouBook?.id ? "تحديث كتاب الشكر" : "إضافة كتاب الشكر"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
