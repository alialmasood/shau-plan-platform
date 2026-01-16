"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayout } from "../layout";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Publication {
  id?: number;
  title: string;
  author_name?: string;
  language?: "arabic" | "english";
  publication_type?: "book" | "textbook" | "reference" | "translation" | "dictionary" | "encyclopedia" | "other";
  publisher?: string;
  publication_date?: string;
  isbn?: string;
  pages?: number;
  edition?: string;
  download_link?: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export default function PublicationsPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPublication, setEditingPublication] = useState<Publication | null>(null);
  const [publicationToDelete, setPublicationToDelete] = useState<Publication | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [formData, setFormData] = useState<Publication>({
    title: "",
    author_name: "",
    language: "arabic",
    publication_type: "book",
    publisher: "",
    publication_date: "",
    isbn: "",
    pages: undefined,
    edition: "",
    download_link: "",
    description: "",
  });

  // Fetch publications on component mount
  useEffect(() => {
    const fetchPublications = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/publications?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPublications(data);
        }
      } catch (error) {
        console.error("Error fetching publications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPublications();
  }, [user]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".relative")) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showExportDropdown]);

  const handleInputChange = (field: keyof Publication, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleEditPublication = (publication: Publication) => {
    setEditingPublication(publication);
    setFormData({
      title: publication.title || "",
      author_name: publication.author_name || "",
      language: publication.language || "arabic",
      publication_type: publication.publication_type || "book",
      publisher: publication.publisher || "",
      publication_date: publication.publication_date ? publication.publication_date.split('T')[0] : "",
      isbn: publication.isbn || "",
      pages: publication.pages,
      edition: publication.edition || "",
      download_link: publication.download_link || "",
      description: publication.description || "",
    });
    setShowForm(true);
  };

  const handleDeletePublication = async () => {
    if (!user || !publicationToDelete?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/teachers/publications?id=${publicationToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("فشل حذف المؤلفة");
      }

      setPublications(publications.filter(p => p.id !== publicationToDelete.id));
      setPublicationToDelete(null);
      alert("تم حذف المؤلفة بنجاح");
    } catch (error) {
      console.error("Error deleting publication:", error);
      alert("حدث خطأ أثناء حذف المؤلفة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsLoading(true);
      
      const payload = {
        userId: user.id,
        title: formData.title,
        authorName: formData.author_name,
        language: formData.language,
        publicationType: formData.publication_type,
        publisher: formData.publisher,
        publicationDate: formData.publication_date,
        isbn: formData.isbn,
        pages: formData.pages,
        edition: formData.edition,
        downloadLink: formData.download_link,
        description: formData.description,
      };

      if (editingPublication?.id) {
        // Update existing publication
        const response = await fetch("/api/teachers/publications", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingPublication.id,
            ...payload,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error("API Error:", result, "Status:", response.status);
          throw new Error(result.error || result.details || `فشل تحديث المؤلفة (${response.status})`);
        }

        setPublications(publications.map(p => p.id === editingPublication.id ? result.publication : p));
        alert("تم تحديث المؤلفة بنجاح");
      } else {
        // Add new publication
        const response = await fetch("/api/teachers/publications", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const result = await response.json();
        
        if (!response.ok) {
          console.error("API Error:", result, "Status:", response.status);
          throw new Error(result.error || result.details || `فشل إضافة المؤلفة (${response.status})`);
        }

        setPublications([result.publication, ...publications]);
        alert("تم إضافة المؤلفة بنجاح");
      }

      // Reset form
      setFormData({
        title: "",
        author_name: "",
        language: "arabic",
        publication_type: "book",
        publisher: "",
        publication_date: "",
        isbn: "",
        pages: undefined,
        edition: "",
        download_link: "",
        description: "",
      });
      setEditingPublication(null);
      setShowForm(false);
    } catch (error: any) {
      console.error("Error saving publication:", error);
      alert(editingPublication?.id ? "حدث خطأ أثناء تحديث المؤلفة. يرجى المحاولة مرة أخرى." : "حدث خطأ أثناء إضافة المؤلفة. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const getLanguageLabel = (lang?: string) => {
    return lang === "english" ? "انكليزي" : "عربي";
  };

  const getPublicationTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      book: "كتاب",
      textbook: "كتاب منهجي",
      reference: "كتاب مرجعي",
      translation: "ترجمة",
      dictionary: "قاموس",
      encyclopedia: "موسوعة",
      other: "أخرى",
    };
    return types[type || ""] || type || "-";
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "عنوان المؤلفة",
      "اسم المؤلف",
      "اللغة",
      "نوع المؤلفة",
      "الناشر",
      "تاريخ النشر",
      "رقم ISBN",
      "عدد الصفحات",
      "الطبعة",
      "رابط التحميل",
      "الوصف"
    ];
    
    const rows = publications.map((publication) => [
      publication.title || "",
      publication.author_name || "",
      getLanguageLabel(publication.language),
      getPublicationTypeLabel(publication.publication_type),
      publication.publisher || "",
      publication.publication_date ? new Date(publication.publication_date).toLocaleDateString('ar-EG') : "",
      publication.isbn || "",
      publication.pages?.toString() || "",
      publication.edition || "",
      publication.download_link || "",
      publication.description || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `المؤلفات_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let yPosition = margin;

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("قائمة المؤلفات", pageWidth - margin, yPosition, { align: "right" });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentDate = new Date().toLocaleDateString("ar-EG");
    doc.text(`تاريخ التصدير: ${currentDate}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headers = ["عنوان المؤلفة", "اسم المؤلف", "اللغة", "نوع المؤلفة", "الناشر", "تاريخ النشر"];
    const colWidths = [50, 30, 20, 30, 30, 30];
    let xPosition = pageWidth - margin;

    headers.forEach((header, index) => {
      xPosition -= colWidths[index];
      doc.text(header, xPosition, yPosition, { align: "right" });
    });
    yPosition += 8;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    publications.forEach((publication) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      xPosition = pageWidth - margin;
      const rowData = [
        publication.title || "-",
        publication.author_name || "-",
        getLanguageLabel(publication.language),
        getPublicationTypeLabel(publication.publication_type),
        publication.publisher || "-",
        publication.publication_date ? new Date(publication.publication_date).toLocaleDateString('ar-EG') : "-"
      ];

      rowData.forEach((cell, cellIndex) => {
        xPosition -= colWidths[cellIndex];
        const text = doc.splitTextToSize(cell || "-", colWidths[cellIndex] - 2);
        doc.text(text, xPosition, yPosition, { align: "right", maxWidth: colWidths[cellIndex] - 2 });
      });

      yPosition += 12;
    });

    // Save
    doc.save(`المؤلفات_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Calculate statistics
  const totalPublications = publications.length;
  const arabicPublications = publications.filter(p => p.language === "arabic").length;
  const englishPublications = publications.filter(p => p.language === "english").length;
  const publicationsWithDownloadLink = publications.filter(p => p.download_link).length;
  
  const publicationTypesStats = useMemo(() => {
    const stats: Record<string, number> = {
      book: 0,
      textbook: 0,
      reference: 0,
      translation: 0,
      dictionary: 0,
      encyclopedia: 0,
      other: 0,
    };
    
    publications.forEach(p => {
      if (p.publication_type && stats.hasOwnProperty(p.publication_type)) {
        stats[p.publication_type]++;
      }
    });
    
    return stats;
  }, [publications]);

  // Calculate statistics for charts
  const publicationsByYear = useMemo(() => {
    const yearMap = new Map<string, number>();
    publications.forEach(publication => {
      if (publication.publication_date) {
        const year = new Date(publication.publication_date).getFullYear().toString();
        yearMap.set(year, (yearMap.get(year) || 0) + 1);
      }
    });
    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [publications]);

  const languageStats = useMemo(() => {
    const arabic = publications.filter(p => p.language === "arabic").length;
    const english = publications.filter(p => p.language === "english").length;
    return [
      { name: "عربي", value: arabic, color: "#10b981" },
      { name: "انكليزي", value: english, color: "#3b82f6" },
    ];
  }, [publications]);

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Statistics Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg border border-indigo-200 p-4 shadow-sm">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>إحصائيات المؤلفات</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {/* إجمالي المؤلفات */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#6366F1' }}>{totalPublications}</p>
            <p className="text-xs text-gray-600 mt-1">إجمالي المؤلفات</p>
          </div>

          {/* المؤلفات بالعربية */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{arabicPublications}</p>
            <p className="text-xs text-gray-600 mt-1">عربي</p>
          </div>

          {/* المؤلفات بالإنجليزية */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{englishPublications}</p>
            <p className="text-xs text-gray-600 mt-1">انكليزي</p>
          </div>

          {/* المؤلفات التي لها رابط تحميل */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#9333EA' }}>{publicationsWithDownloadLink}</p>
            <p className="text-xs text-gray-600 mt-1">برابط تحميل</p>
          </div>

          {/* كتاب */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#F97316' }}>{publicationTypesStats.book}</p>
            <p className="text-xs text-gray-600 mt-1">كتاب</p>
          </div>

          {/* كتاب منهجي */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#06B6D4' }}>{publicationTypesStats.textbook}</p>
            <p className="text-xs text-gray-600 mt-1">كتاب منهجي</p>
          </div>

          {/* كتاب مرجعي */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-teal-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#14B8A6' }}>{publicationTypesStats.reference}</p>
            <p className="text-xs text-gray-600 mt-1">كتاب مرجعي</p>
          </div>
        </div>
        
        {/* Second row for additional publication types */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {/* ترجمة */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-pink-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#EC4899' }}>{publicationTypesStats.translation}</p>
            <p className="text-xs text-gray-600 mt-1">ترجمة</p>
          </div>

          {/* قاموس */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-yellow-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#EAB308' }}>{publicationTypesStats.dictionary}</p>
            <p className="text-xs text-gray-600 mt-1">قاموس</p>
          </div>

          {/* موسوعة */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-rose-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#F43F5E' }}>{publicationTypesStats.encyclopedia}</p>
            <p className="text-xs text-gray-600 mt-1">موسوعة</p>
          </div>

          {/* أخرى */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#6B7280' }}>{publicationTypesStats.other}</p>
            <p className="text-xs text-gray-600 mt-1">أخرى</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>المؤلفات</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportDropdown(!showExportDropdown);
                }}
                className="px-4 py-2 border-2 border-purple-600 text-purple-600 bg-white rounded-lg hover:bg-purple-50 transition-colors duration-300 flex items-center justify-center gap-2 min-w-[140px]"
                style={{ height: '42px' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>تصدير</span>
              </button>
              {showExportDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportCSV();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>تصدير CSV</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportPDF();
                      setShowExportDropdown(false);
                    }}
                    className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 border-t border-gray-100"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>تصدير PDF</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setEditingPublication(null);
                setFormData({
                  title: "",
                  author_name: "",
                  language: "arabic",
                  publication_type: "book",
                  publisher: "",
                  publication_date: "",
                  isbn: "",
                  pages: undefined,
                  edition: "",
                  download_link: "",
                  description: "",
                });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center justify-center gap-2 min-w-[140px]"
              style={{ height: '42px' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>إضافة مؤلف</span>
            </button>
          </div>
        </div>

        {isLoading && publications.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : publications.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-gray-500 text-lg">لا توجد مؤلفات مضافة</p>
            <p className="text-gray-400 text-sm mt-2">اضغط على زر "إضافة مؤلف" لإضافة مؤلفتك الأولى</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان المؤلفة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اسم المؤلف</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">اللغة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع المؤلفة</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الناشر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ النشر</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عدد الصفحات</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الطبعة</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {publications.map((publication) => (
                  <tr key={publication.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div 
                        className={`text-sm font-medium ${publication.download_link ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors" : ""}`}
                        style={{ color: '#1F2937' }}
                        onClick={() => {
                          if (publication.download_link) {
                            window.open(publication.download_link, '_blank');
                          }
                        }}
                      >
                        {publication.title}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.author_name || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{getLanguageLabel(publication.language)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{getPublicationTypeLabel(publication.publication_type)}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.publisher || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.publication_date ? new Date(publication.publication_date).toLocaleDateString('ar-EG') : "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.isbn || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.pages || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm" style={{ color: '#374151' }}>{publication.edition || "-"}</div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditPublication(publication)}
                          className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-300 hover:scale-105"
                          title="تعديل"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setPublicationToDelete(publication)}
                          className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all duration-300 hover:scale-105"
                          title="حذف"
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

        {/* Charts Section */}
        {publications.length > 0 && (
          <div className="mt-6 space-y-6">
            {/* Publications Distribution by Year Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>توزيع المؤلفات حسب السنة</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={publicationsByYear}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="year" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="count" fill="#6366f1" name="عدد المؤلفات" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Language Pie Chart and Publication Types Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Language Pie Chart */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>نسبة المؤلفات حسب اللغة</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={languageStats}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {languageStats.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Publication Types Statistics */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>إحصائيات أنواع المؤلفات</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">{publicationTypesStats.book}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>كتاب</div>
                  </div>
                  <div className="bg-cyan-50 rounded-lg p-4 border border-cyan-200">
                    <div className="text-3xl font-bold text-cyan-600 mb-2">{publicationTypesStats.textbook}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>كتاب منهجي</div>
                  </div>
                  <div className="bg-teal-50 rounded-lg p-4 border border-teal-200">
                    <div className="text-3xl font-bold text-teal-600 mb-2">{publicationTypesStats.reference}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>كتاب مرجعي</div>
                  </div>
                  <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
                    <div className="text-3xl font-bold text-pink-600 mb-2">{publicationTypesStats.translation}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>ترجمة</div>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                    <div className="text-3xl font-bold text-yellow-600 mb-2">{publicationTypesStats.dictionary}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>قاموس</div>
                  </div>
                  <div className="bg-rose-50 rounded-lg p-4 border border-rose-200">
                    <div className="text-3xl font-bold text-rose-600 mb-2">{publicationTypesStats.encyclopedia}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>موسوعة</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="text-3xl font-bold text-gray-600 mb-2">{publicationTypesStats.other}</div>
                    <div className="text-sm font-medium" style={{ color: '#374151' }}>أخرى</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {publicationToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف المؤلفة "{publicationToDelete.title}"؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setPublicationToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeletePublication}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Publication Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingPublication?.id ? "تعديل المؤلفة" : "إضافة مؤلفة جديد"}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    عنوان المؤلفة <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    اسم المؤلف
                  </label>
                  <input
                    type="text"
                    value={formData.author_name}
                    onChange={(e) => handleInputChange("author_name", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    اللغة
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => handleInputChange("language", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  >
                    <option value="arabic">عربي</option>
                    <option value="english">انكليزي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    نوع المؤلفة
                  </label>
                  <select
                    value={formData.publication_type}
                    onChange={(e) => handleInputChange("publication_type", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  >
                    <option value="book">كتاب</option>
                    <option value="textbook">كتاب منهجي</option>
                    <option value="reference">كتاب مرجعي</option>
                    <option value="translation">ترجمة</option>
                    <option value="dictionary">قاموس</option>
                    <option value="encyclopedia">موسوعة</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    الناشر
                  </label>
                  <input
                    type="text"
                    value={formData.publisher}
                    onChange={(e) => handleInputChange("publisher", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    تاريخ النشر
                  </label>
                  <input
                    type="date"
                    value={formData.publication_date}
                    onChange={(e) => handleInputChange("publication_date", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    رقم ISBN
                  </label>
                  <input
                    type="text"
                    value={formData.isbn}
                    onChange={(e) => handleInputChange("isbn", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    عدد الصفحات
                  </label>
                  <input
                    type="number"
                    value={formData.pages || ""}
                    onChange={(e) => handleInputChange("pages", e.target.value ? parseInt(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    الطبعة
                  </label>
                  <input
                    type="text"
                    value={formData.edition}
                    onChange={(e) => handleInputChange("edition", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    رابط التحميل
                  </label>
                  <input
                    type="url"
                    value={formData.download_link}
                    onChange={(e) => handleInputChange("download_link", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    style={{ color: '#1F2937' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  style={{ color: '#1F2937' }}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                  style={{ color: '#374151' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري الحفظ..." : editingPublication?.id ? "تحديث المؤلفة" : "إضافة المؤلفة"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
