"use client";

import { useState, useEffect, useMemo } from "react";
import { useLayout } from "../layout";
import jsPDF from "jspdf";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { formatDate } from "@/lib/utils/academic";

interface Research {
  id?: number;
  title: string;
  research_type: "planned" | "unplanned";
  author_type: "single" | "joint";
  is_completed: boolean;
  completion_percentage?: number;
  year: number | string;
  is_published?: boolean;
  research_link?: string;
  publication_type?: "journal" | "conference" | "article";
  publisher?: string;
  doi?: string;
  publication_month?: string;
  download_link?: string;
  classifications?: string[]; // ["global", "local", "thomson_reuters", "scopus"]
  scopus_quartile?: "Q1" | "Q2" | "Q3" | "Q4";
  created_at?: string;
  updated_at?: string;
}

const months = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
];

export default function ResearchPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [researchList, setResearchList] = useState<Research[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingResearch, setEditingResearch] = useState<Research | null>(null);
  const [researchToDelete, setResearchToDelete] = useState<Research | null>(null);
  const [mobileShowMoreFilters, setMobileShowMoreFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterByResearchType, setFilterByResearchType] = useState<string>("all");
  const [filterByStatus, setFilterByStatus] = useState<string>("all");
  const [filterByPublication, setFilterByPublication] = useState<string>("all");
  const [filterByClassification, setFilterByClassification] = useState<string>("all");
  const [filterByYear, setFilterByYear] = useState<string>("all");
  const [sortBy] = useState<"year-desc" | "year-asc" | "title" | "date-desc" | "date-asc">("year-desc");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [formData, setFormData] = useState<Research>({
    title: "",
    research_type: "planned",
    author_type: "single",
    is_completed: false,
    completion_percentage: 0,
    year: new Date().getFullYear().toString(),
    is_published: false,
    research_link: "",
    publication_type: "journal",
    publisher: "",
    doi: "",
    publication_month: "",
    download_link: "",
    classifications: [],
    scopus_quartile: "Q1",
  });

  // Fetch research on component mount
  useEffect(() => {
    const fetchResearch = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/research?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setResearchList(data);
        }
      } catch (error) {
        console.error("Error fetching research:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResearch();
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

  const handleInputChange = (field: keyof Research, value: Research[keyof Research]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleClassificationChange = (classification: string, checked: boolean) => {
    setFormData((prev) => {
      const current = prev.classifications || [];
      if (checked) {
        return { ...prev, classifications: [...current, classification] };
      } else {
        return {
          ...prev,
          classifications: current.filter((c) => c !== classification),
          scopus_quartile: classification === "scopus" ? undefined : prev.scopus_quartile,
        };
      }
    });
  };

  const handleEditResearch = (research: Research) => {
    setEditingResearch(research);
    setFormData({
      title: research.title || "",
      research_type: research.research_type || "planned",
      author_type: research.author_type || "single",
      is_completed: research.is_completed || false,
      completion_percentage: research.completion_percentage || 0,
      year: research.year?.toString() || new Date().getFullYear().toString(),
      is_published: research.is_published || false,
      research_link: research.research_link || "",
      publication_type: research.publication_type || "journal",
      publisher: research.publisher || "",
      doi: research.doi || "",
      publication_month: research.publication_month || "",
      download_link: research.download_link || "",
      classifications: research.classifications || [],
      scopus_quartile: research.scopus_quartile || "Q1",
    });
    setShowForm(true);
  };

  const handleDeleteResearch = async () => {
    if (!user || !researchToDelete?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/teachers/research?id=${researchToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("فشل حذف البحث");
      }

      setResearchList(researchList.filter(r => r.id !== researchToDelete.id));
      setResearchToDelete(null);
      alert("تم حذف البحث بنجاح");
    } catch (error) {
      console.error("Error deleting research:", error);
      alert("حدث خطأ أثناء حذف البحث. يرجى المحاولة مرة أخرى.");
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
        researchType: formData.research_type,
        authorType: formData.author_type,
        isCompleted: formData.is_completed,
        completionPercentage: formData.completion_percentage,
        year: formData.year.toString(),
        isPublished: formData.is_published,
        researchLink: formData.research_link,
        publicationType: formData.publication_type,
        publisher: formData.publisher,
        doi: formData.doi,
        publicationMonth: formData.publication_month,
        downloadLink: formData.download_link,
        classifications: formData.classifications,
        scopusQuartile: formData.scopus_quartile,
      };

      if (editingResearch?.id) {
        // Update existing research
        const response = await fetch("/api/teachers/research", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingResearch.id,
            ...payload,
          }),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("API Error:", errorData);
          throw new Error(errorData.error || errorData.details || "فشل تحديث البحث");
        }

        const result = await response.json();
        setResearchList(researchList.map(r => r.id === editingResearch.id ? result.research : r));
        alert("تم تحديث البحث بنجاح");
      } else {
        // Add new research
        const response = await fetch("/api/teachers/research", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error("API Error:", errorData);
          throw new Error(errorData.error || errorData.details || "فشل إضافة البحث");
        }

        const result = await response.json();
        setResearchList([result.research, ...researchList]);
        alert("تم إضافة البحث بنجاح");
      }

      // Reset form
      setFormData({
        title: "",
        research_type: "planned",
        author_type: "single",
        is_completed: false,
        completion_percentage: 0,
        year: new Date().getFullYear().toString(),
        is_published: false,
        research_link: "",
        publication_type: "journal",
        publisher: "",
        doi: "",
        publication_month: "",
        download_link: "",
        classifications: [],
        scopus_quartile: "Q1",
      });
      setEditingResearch(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving research:", error);
      alert(editingResearch?.id ? "حدث خطأ أثناء تحديث البحث. يرجى المحاولة مرة أخرى." : "حدث خطأ أثناء إضافة البحث. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const getResearchTypeLabel = (type: string) => {
    return type === "planned" ? "مخطط" : "غير مخطط";
  };

  const getAuthorTypeLabel = (type: string) => {
    return type === "single" ? "منفرد" : "مشترك";
  };

  const getPublicationTypeLabel = (type?: string) => {
    if (!type) return "-";
    const types: Record<string, string> = {
      journal: "بحث مجلة",
      conference: "بحث مؤتمر",
      article: "مقالة",
    };
    return types[type] || type;
  };

  const getClassificationLabel = (value: string) => {
    const map: Record<string, string> = {
      global: "عالمي",
      local: "محلي",
      scopus: "سكوبس",
      thomson_reuters: "ثومبسون رويتر",
    };
    return map[value] || value;
  };

  const MobileResearchCard = ({ research }: { research: Research }) => {
    const classificationsText =
      research.classifications && research.classifications.length > 0
        ? research.classifications.map(getClassificationLabel).join("، ")
        : "-";

    const openLink = () => {
      if (research.download_link) {
        window.open(research.download_link, "_blank");
        return;
      }
      if (research.research_link) {
        window.open(research.research_link, "_blank");
      }
    };

    return (
      <div className="bg-white border border-slate-200/70 rounded-3xl shadow-sm p-4 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div
              className={`text-[16px] leading-6 font-extrabold text-slate-900 break-words ${
                research.download_link || research.research_link
                  ? "cursor-pointer hover:text-indigo-700"
                  : ""
              }`}
              onClick={openLink}
              title={research.title}
            >
              {research.title}
            </div>

            <div className="mt-2 inline-flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">السنة</span>
              <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                {research.year?.toString() || "-"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-start gap-3">
            <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
              نوع البحث
            </span>
            <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left break-words">
              {getResearchTypeLabel(research.research_type)}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
              الحالة
            </span>
            <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left break-words">
              {research.is_completed ? "منجز" : "غير منجز"}
              {!research.is_completed && (
                <span className="text-slate-500 font-bold"> ({research.completion_percentage || 0}%)</span>
              )}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
              النشر
            </span>
            <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left break-words">
              {research.is_completed ? (research.is_published ? "منشور" : "غير منشور") : "-"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
              الناشر
            </span>
            <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left break-words">
              {research.publisher || "-"}
            </span>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
              التصنيفات
            </span>
            <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left truncate" title={classificationsText}>
              {classificationsText}
            </span>
          </div>

          {research.classifications?.includes("scopus") && (
            <div className="flex items-start gap-3">
              <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
                Q
              </span>
              <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 text-left break-words">
                {research.scopus_quartile || "-"}
              </span>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200/70">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleEditResearch(research)}
              className="h-11 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-sm font-extrabold"
            >
              تعديل
            </button>
            <button
              type="button"
              onClick={() => setResearchToDelete(research)}
              className="h-11 rounded-2xl bg-red-600 text-white hover:bg-red-700 text-sm font-extrabold"
            >
              حذف
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      "عنوان البحث",
      "نوع البحث",
      "نوع المؤلف",
      "الحالة",
      "نسبة الإنجاز",
      "السنة",
      "نوع النشر",
      "الناشر",
      "الشهر",
      "DOI",
      "التصنيفات",
      "سكوبس كوارتيل"
    ];
    
    const rows = filteredAndSortedResearch.map((research) => [
      research.title || "",
      getResearchTypeLabel(research.research_type),
      getAuthorTypeLabel(research.author_type),
      research.is_completed ? "منجز" : "غير منجز",
      research.is_completed ? "100%" : `${research.completion_percentage || 0}%`,
      research.year?.toString() || "",
      getPublicationTypeLabel(research.publication_type),
      research.publisher || "",
      research.publication_month || "",
      research.doi || "",
      research.classifications?.join(", ") || "",
      research.scopus_quartile || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `البحوث_${new Date().toISOString().split('T')[0]}.csv`);
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
    doc.text("قائمة البحوث", pageWidth - margin, yPosition, { align: "right" });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const currentDate = formatDate(new Date());
    doc.text(`تاريخ التصدير: ${currentDate}`, pageWidth - margin, yPosition, { align: "right" });
    yPosition += 15;

    // Table headers
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headers = ["عنوان البحث", "نوع البحث", "الحالة", "السنة", "الناشر"];
    const colWidths = [60, 30, 25, 20, 50];
    let xPosition = pageWidth - margin;

    headers.forEach((header, index) => {
      xPosition -= colWidths[index];
      doc.text(header, xPosition, yPosition, { align: "right" });
    });
    yPosition += 8;

    // Table rows
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    
    filteredAndSortedResearch.forEach((research) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      xPosition = pageWidth - margin;
      const rowData = [
        research.title || "-",
        getResearchTypeLabel(research.research_type),
        research.is_completed ? "منجز" : "غير منجز",
        research.year?.toString() || "-",
        research.publisher || "-"
      ];

      rowData.forEach((cell, cellIndex) => {
        xPosition -= colWidths[cellIndex];
        const text = doc.splitTextToSize(cell || "-", colWidths[cellIndex] - 2);
        doc.text(text, xPosition, yPosition, { align: "right", maxWidth: colWidths[cellIndex] - 2 });
      });

      yPosition += 12;
    });

    // Save
    doc.save(`البحوث_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Get unique years for filter dropdown
  const uniqueYears = Array.from(new Set(researchList.map(r => r.year.toString()))).sort((a, b) => parseInt(b) - parseInt(a));

  // Calculate statistics for charts
  const researchByYear = useMemo(() => {
    const yearMap = new Map<string, number>();
    researchList.forEach(research => {
      const year = research.year?.toString() || "غير محدد";
      yearMap.set(year, (yearMap.get(year) || 0) + 1);
    });
    return Array.from(yearMap.entries())
      .map(([year, count]) => ({ year, count }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [researchList]);

  const completedResearchStats = useMemo(() => {
    const completed = researchList.filter(r => r.is_completed).length;
    const notCompleted = researchList.length - completed;
    return [
      { name: "منجز", value: completed, color: "#10b981" },
      { name: "غير منجز", value: notCompleted, color: "#f59e0b" },
    ];
  }, [researchList]);

  const classificationStats = useMemo(() => {
    const scopus = researchList.filter(r => r.classifications?.includes("scopus")).length;
    const thomsonReuters = researchList.filter(r => r.classifications?.includes("thomson_reuters")).length;
    const global = researchList.filter(r => r.classifications?.includes("global")).length;
    const local = researchList.filter(r => r.classifications?.includes("local")).length;
    return { scopus, thomsonReuters, global, local };
  }, [researchList]);

  // Filter and sort research
  const filteredAndSortedResearch = researchList
    .filter((research) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = research.title?.toLowerCase().includes(query);
        const matchesPublisher = research.publisher?.toLowerCase().includes(query);
        const matchesYear = research.year?.toString().includes(query);
        if (!matchesTitle && !matchesPublisher && !matchesYear) return false;
      }

      // Filter by research type
      if (filterByResearchType !== "all") {
        if (research.research_type !== filterByResearchType) return false;
      }

      // Filter by status (completed/not completed)
      if (filterByStatus !== "all") {
        if (filterByStatus === "completed" && !research.is_completed) return false;
        if (filterByStatus === "not-completed" && research.is_completed) return false;
      }

      // Filter by publication status
      if (filterByPublication !== "all") {
        if (filterByPublication === "published" && !research.is_published) return false;
        if (filterByPublication === "not-published" && research.is_published) return false;
      }

      // Filter by classification
      if (filterByClassification !== "all") {
        if (!research.classifications?.includes(filterByClassification)) return false;
      }

      // Filter by year
      if (filterByYear !== "all") {
        if (research.year?.toString() !== filterByYear) return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "year-desc":
          return (parseInt(b.year?.toString() || "0") - parseInt(a.year?.toString() || "0"));
        case "year-asc":
          return (parseInt(a.year?.toString() || "0") - parseInt(b.year?.toString() || "0"));
        case "title":
          return (a.title || "").localeCompare(b.title || "", "ar");
        case "date-desc":
          return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        case "date-asc":
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        default:
          return 0;
      }
    });

  // Calculate statistics
  const totalResearch = researchList.length;
  const completedResearch = researchList.filter(r => r.is_completed).length;
  const publishedResearch = researchList.filter(r => r.is_published).length;
  const plannedResearch = researchList.filter(r => r.research_type === "planned").length;
  const scopusResearch = researchList.filter(r => r.classifications?.includes("scopus")).length;
  const globalResearch = researchList.filter(r => r.classifications?.includes("global")).length;
  const localResearch = researchList.filter(r => r.classifications?.includes("local")).length;

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-[639px]:space-y-4 max-[639px]:overflow-x-hidden">
      {/* Statistics Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg border border-indigo-200 p-4 shadow-sm max-[639px]:rounded-3xl">
        <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>إحصائيات البحوث</h3>
        <div className="relative">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 max-[639px]:flex max-[639px]:flex-nowrap max-[639px]:overflow-x-auto max-[639px]:gap-3 max-[639px]:snap-x max-[639px]:snap-mandatory max-[639px]:pb-1 m-scroll">
          {/* إجمالي البحوث */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#6366F1' }}>{totalResearch}</p>
            <p className="text-xs text-gray-600 mt-1">إجمالي البحوث</p>
          </div>

          {/* البحوث المنجزة */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#10B981' }}>{completedResearch}</p>
            <p className="text-xs text-gray-600 mt-1">البحوث المنجزة</p>
          </div>

          {/* البحوث المنشورة */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#3B82F6' }}>{publishedResearch}</p>
            <p className="text-xs text-gray-600 mt-1">البحوث المنشورة</p>
          </div>

          {/* البحوث المخططة */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#9333EA' }}>{plannedResearch}</p>
            <p className="text-xs text-gray-600 mt-1">البحوث المخططة</p>
          </div>

          {/* السكوبس */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-orange-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#F97316' }}>{scopusResearch}</p>
            <p className="text-xs text-gray-600 mt-1">السكوبس</p>
          </div>

          {/* العالمية */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-cyan-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#06B6D4' }}>{globalResearch}</p>
            <p className="text-xs text-gray-600 mt-1">العالمية</p>
          </div>

          {/* المحلية */}
          <div className="bg-white rounded-lg p-3 shadow-sm border border-teal-100 text-center max-[639px]:min-w-[132px] max-[639px]:h-[104px] max-[639px]:snap-start max-[639px]:rounded-2xl max-[639px]:flex max-[639px]:flex-col max-[639px]:justify-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: '#14B8A6' }}>{localResearch}</p>
            <p className="text-xs text-gray-600 mt-1">المحلية</p>
          </div>
          </div>

          {/* Mobile-only edge fade (hint swipe, no scrollbar) */}
          <div className="hidden max-[639px]:block pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-indigo-50/90 to-transparent" />
          <div className="hidden max-[639px]:block pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-indigo-50/90 to-transparent" />
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:shadow-sm max-[639px]:overflow-x-hidden">
        <div className="flex items-center justify-between mb-6 max-[639px]:mb-4 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
          <div>
            <h1 className="text-2xl font-bold mb-2" style={{ color: '#1F2937' }}>البحوث</h1>
            <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
          </div>
          <div className="flex items-center gap-3 max-[639px]:hidden">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportDropdown(!showExportDropdown);
                }}
                className="px-[14px] py-2 border-2 border-purple-600 text-purple-600 bg-white rounded-lg hover:bg-purple-50 transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>تصدير</span>
              </button>
              {showExportDropdown && (
                <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-[639px]:left-0 max-[639px]:right-0 max-[639px]:w-full">
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
                setEditingResearch(null);
                setFormData({
                  title: "",
                  research_type: "planned",
                  author_type: "single",
                  is_completed: false,
                  completion_percentage: 0,
                  year: new Date().getFullYear().toString(),
                  is_published: false,
                  research_link: "",
                  publication_type: "journal",
                  publisher: "",
                  doi: "",
                  publication_month: "",
                  download_link: "",
                  classifications: [],
                  scopus_quartile: "Q1",
                });
                setShowForm(true);
              }}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>إضافة بحث</span>
            </button>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="hidden max-[639px]:block mb-3 space-y-2.5">
          <button
            onClick={() => {
              setEditingResearch(null);
              setFormData({
                title: "",
                research_type: "planned",
                author_type: "single",
                is_completed: false,
                completion_percentage: 0,
                year: new Date().getFullYear().toString(),
                is_published: false,
                research_link: "",
                publication_type: "journal",
                publisher: "",
                doi: "",
                publication_month: "",
                download_link: "",
                classifications: [],
                scopus_quartile: "Q1",
              });
              setShowForm(true);
            }}
            className="w-full h-[54px] rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2 font-extrabold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>إضافة بحث</span>
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowExportDropdown(!showExportDropdown);
              }}
              className="w-full h-11 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 transition-colors duration-200 flex items-center justify-center gap-2 font-bold"
            >
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>تصدير</span>
            </button>
            {showExportDropdown && (
              <div className="absolute left-0 right-0 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-lg z-10 overflow-hidden">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportCSV();
                    setShowExportDropdown(false);
                  }}
                  className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
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
                  className="w-full text-right px-4 py-3 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 border-t border-gray-100"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span>تصدير PDF</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Search, Filter, Sort Bar */}
        {/* Mobile Filters Card */}
        <div className="hidden max-[639px]:block mb-3 bg-white rounded-3xl border border-slate-200/70 p-3 shadow-sm">
          <div className="flex items-center gap-2 text-slate-700 mb-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-4.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span className="text-[12px] font-extrabold">بحث / فلترة</span>
          </div>

          <div className="space-y-2.5">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان، ناشر، أو سنة..."
                className="w-full pr-10 pl-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              />
            </div>

            <select
              value={filterByResearchType}
              onChange={(e) => setFilterByResearchType(e.target.value)}
              className="w-full px-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
            >
              <option value="all">جميع أنواع البحوث</option>
              <option value="planned">مخطط</option>
              <option value="unplanned">غير مخطط</option>
            </select>

            <select
              value={filterByYear}
              onChange={(e) => setFilterByYear(e.target.value)}
              className="w-full px-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
            >
              <option value="all">جميع السنوات</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            {mobileShowMoreFilters && (
              <>
                <select
                  value={filterByStatus}
                  onChange={(e) => setFilterByStatus(e.target.value)}
                  className="w-full px-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
                >
                  <option value="all">جميع الحالات</option>
                  <option value="completed">منجز</option>
                  <option value="not-completed">غير منجز</option>
                </select>

                <select
                  value={filterByPublication}
                  onChange={(e) => setFilterByPublication(e.target.value)}
                  className="w-full px-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
                >
                  <option value="all">جميع حالات النشر</option>
                  <option value="published">منشور</option>
                  <option value="not-published">غير منشور</option>
                </select>

                <select
                  value={filterByClassification}
                  onChange={(e) => setFilterByClassification(e.target.value)}
                  className="w-full px-3 h-11 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
                >
                  <option value="all">جميع التصنيفات</option>
                  <option value="global">عالمي</option>
                  <option value="local">محلي</option>
                  <option value="scopus">سكوبس</option>
                  <option value="thomson_reuters">ثومبسون رويتر</option>
                </select>
              </>
            )}

            <button
              type="button"
              onClick={() => setMobileShowMoreFilters((v) => !v)}
              className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors duration-200 text-sm font-extrabold text-slate-800 flex items-center justify-center gap-2"
            >
              <svg className={`w-4 h-4 transition-transform ${mobileShowMoreFilters ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span>{mobileShowMoreFilters ? "إخفاء الفلاتر المتقدمة" : "عرض المزيد من الفلاتر"}</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 mb-6 max-[639px]:hidden">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن عنوان، ناشر، أو سنة..."
                className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              />
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3">
            {/* Filter by Research Type */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterByResearchType}
                onChange={(e) => setFilterByResearchType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع أنواع البحوث</option>
                <option value="planned">مخطط</option>
                <option value="unplanned">غير مخطط</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterByStatus}
                onChange={(e) => setFilterByStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع الحالات</option>
                <option value="completed">منجز</option>
                <option value="not-completed">غير منجز</option>
              </select>
            </div>

            {/* Filter by Publication */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterByPublication}
                onChange={(e) => setFilterByPublication(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع حالات النشر</option>
                <option value="published">منشور</option>
                <option value="not-published">غير منشور</option>
              </select>
            </div>

            {/* Filter by Classification */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterByClassification}
                onChange={(e) => setFilterByClassification(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع التصنيفات</option>
                <option value="global">عالمي</option>
                <option value="local">محلي</option>
                <option value="scopus">سكوبس</option>
                <option value="thomson_reuters">ثومبسون رويتر</option>
              </select>
            </div>

            {/* Filter by Year */}
            <div className="flex-1 min-w-[150px]">
              <select
                value={filterByYear}
                onChange={(e) => setFilterByYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع السنوات</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Research Table */}
        {isLoading && researchList.length === 0 ? (
          <div className="text-center py-12 max-[639px]:py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : researchList.length === 0 ? (
          <>
            <div className="hidden max-[639px]:flex flex-col items-center justify-center text-center rounded-3xl border border-slate-200/70 bg-white shadow-sm px-4 py-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="mt-4 text-[16px] font-extrabold text-slate-900">لا توجد بحوث مضافة</div>
              <div className="mt-1 text-[13px] text-slate-500">ابدأ بإضافة بحثك الأول بسهولة.</div>
              {/* Mobile: keep a single strong CTA (top). Provide a secondary action here. */}
              <button
                onClick={() => {
                  setEditingResearch(null);
                  setFormData({
                    title: "",
                    research_type: "planned",
                    author_type: "single",
                    is_completed: false,
                    completion_percentage: 0,
                    year: new Date().getFullYear().toString(),
                    is_published: false,
                    research_link: "",
                    publication_type: "journal",
                    publisher: "",
                    doi: "",
                    publication_month: "",
                    download_link: "",
                    classifications: [],
                    scopus_quartile: "Q1",
                  });
                  setShowForm(true);
                }}
                className="mt-4 w-full h-11 rounded-2xl border border-slate-200 bg-white text-indigo-700 hover:bg-slate-50 transition-colors duration-200 font-extrabold flex items-center justify-center gap-2"
              >
                <span>إضافة بحث الآن</span>
              </button>
            </div>

            <div className="max-[639px]:hidden text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-lg">لا توجد بحوث مضافة</p>
              <p className="text-gray-400 text-sm mt-2">اضغط على زر &quot;إضافة بحث&quot; لإضافة بحثك الأول</p>
            </div>
          </>
        ) : (
          <>
            <div className="hidden max-[639px]:block space-y-3">
              {filteredAndSortedResearch.map((research) => (
                <MobileResearchCard key={research.id} research={research} />
              ))}
            </div>

            <div className="max-[639px]:hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان البحث</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع البحث</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع المؤلف</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نسبة الإنجاز</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">نوع النشر</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الناشر</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">السنة</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الشهر</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">عالمي</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">محلي</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">ثومبسون</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">سكوبس</th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Q</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAndSortedResearch.map((research) => (
                    <tr key={research.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div 
                          className={`text-sm font-medium ${research.download_link || research.research_link ? "cursor-pointer hover:text-indigo-600 hover:underline transition-colors" : ""}`}
                          style={{ color: '#1F2937' }}
                          onClick={() => {
                            if (research.download_link) {
                              window.open(research.download_link, '_blank');
                            } else if (research.research_link) {
                              window.open(research.research_link, '_blank');
                            }
                          }}
                        >
                          {research.title}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>{getResearchTypeLabel(research.research_type)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>{getAuthorTypeLabel(research.author_type)}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          research.is_completed 
                            ? "bg-green-100 text-green-800" 
                            : "bg-yellow-100 text-yellow-800"
                        }`}>
                          {research.is_completed ? "منجز" : "غير منجز"}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>
                          {research.is_completed ? "100%" : `${research.completion_percentage || 0}%`}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>
                          {getPublicationTypeLabel(research.publication_type)}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>{research.publisher || "-"}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>{research.year}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm" style={{ color: '#374151' }}>{research.publication_month || "-"}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {research.classifications?.includes("global") ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {research.classifications?.includes("local") ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {research.classifications?.includes("thomson_reuters") ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        {research.classifications?.includes("scopus") ? (
                          <svg className="w-5 h-5 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium" style={{ color: '#374151' }}>
                          {research.classifications?.includes("scopus") ? research.scopus_quartile || "-" : "-"}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEditResearch(research)}
                            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-300 hover:scale-105"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => setResearchToDelete(research)}
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
          </>
        )}
      </div>

      {/* Charts and Statistics Section */}
      {researchList.length > 0 && (
        <div className="mt-6 space-y-6">
          {/* Research Distribution by Year Chart */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>توزيع البحوث حسب السنة</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={researchByYear}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="year" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#6366f1" name="عدد البحوث" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Completed Research Pie Chart and Classification Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Completed Research Pie Chart */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>نسبة البحوث المنجزة</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={completedResearchStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {completedResearchStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Classification Statistics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4" style={{ color: '#1F2937' }}>إحصائيات التصنيفات</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">{classificationStats.scopus}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>سكوبس</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">{classificationStats.thomsonReuters}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>ثومسون رويتر</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">{classificationStats.global}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>عالمي</div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{classificationStats.local}</div>
                  <div className="text-sm font-medium" style={{ color: '#374151' }}>محلي</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {researchToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>تأكيد الحذف</h3>
            <p className="text-gray-600 mb-6">هل أنت متأكد من حذف البحث &quot;{researchToDelete.title}&quot;؟</p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setResearchToDelete(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                style={{ color: '#374151' }}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeleteResearch}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Research Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingResearch?.id ? "تعديل البحث" : "إضافة بحث جديد"}
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* عنوان البحث */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  عنوان البحث <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  required
                />
              </div>

              {/* نوع البحث */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع البحث <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.research_type}
                  onChange={(e) => handleInputChange("research_type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  required
                >
                  <option value="planned">مخطط</option>
                  <option value="unplanned">غير مخطط</option>
                </select>
              </div>

              {/* نوع المؤلف */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  نوع المؤلف <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.author_type}
                  onChange={(e) => handleInputChange("author_type", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  required
                >
                  <option value="single">منفرد</option>
                  <option value="joint">مشترك</option>
                </select>
              </div>

              {/* هل البحث منجز */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  هل البحث منجز <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.is_completed ? "completed" : "incomplete"}
                  onChange={(e) => handleInputChange("is_completed", e.target.value === "completed")}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  required
                >
                  <option value="incomplete">غير منجز</option>
                  <option value="completed">منجز</option>
                </select>
              </div>

              {/* نسبة الإنجاز - تظهر فقط إذا البحث غير منجز */}
              {!formData.is_completed && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    نسبة الإنجاز (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.completion_percentage || 0}
                    onChange={(e) => handleInputChange("completion_percentage", parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>
              )}

              {/* السنة */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  السنة <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear() + 5}
                  value={formData.year}
                  onChange={(e) => handleInputChange("year", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  required
                />
              </div>

              {/* هل البحث منشور - يظهر فقط إذا البحث منجز */}
              {formData.is_completed && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                      هل البحث منشور <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.is_published ? "published" : "unpublished"}
                      onChange={(e) => handleInputChange("is_published", e.target.value === "published")}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                      style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                      required
                    >
                      <option value="unpublished">غير منشور</option>
                      <option value="published">منشور</option>
                    </select>
                  </div>

                  {/* الحقول المرتبطة بالنشر - تظهر فقط إذا البحث منشور */}
                  {formData.is_published && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          رابط البحث
                        </label>
                        <input
                          type="url"
                          value={formData.research_link || ""}
                          onChange={(e) => handleInputChange("research_link", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                          style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                          placeholder="https://..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          نوع النشر
                        </label>
                        <select
                          value={formData.publication_type || "journal"}
                          onChange={(e) => handleInputChange("publication_type", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                          style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                        >
                          <option value="journal">بحث مجلة</option>
                          <option value="conference">بحث مؤتمر</option>
                          <option value="article">مقالة</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          الناشر
                        </label>
                        <input
                          type="text"
                          value={formData.publisher || ""}
                          onChange={(e) => handleInputChange("publisher", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                          style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          DOI
                        </label>
                        <input
                          type="text"
                          value={formData.doi || ""}
                          onChange={(e) => handleInputChange("doi", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                          style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                          placeholder="10.xxxx/xxxxx"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          شهر النشر
                        </label>
                        <select
                          value={formData.publication_month || ""}
                          onChange={(e) => handleInputChange("publication_month", e.target.value)}
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
                          رابط التحميل
                        </label>
                        <input
                          type="url"
                          value={formData.download_link || ""}
                          onChange={(e) => handleInputChange("download_link", e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                          style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                          placeholder="https://..."
                        />
                      </div>

                      {/* التصنيفات */}
                      <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                          التصنيفات (يمكن اختيار أكثر من واحد)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[
                            { value: "global", label: "عالمي" },
                            { value: "local", label: "محلي" },
                            { value: "thomson_reuters", label: "ثومبسون رويتر" },
                            { value: "scopus", label: "سكوبس" },
                          ].map((classification) => (
                            <label key={classification.value} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={formData.classifications?.includes(classification.value) || false}
                                onChange={(e) => handleClassificationChange(classification.value, e.target.checked)}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                              />
                              <span className="text-sm" style={{ color: '#374151' }}>{classification.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* سكوبس كوارتيل - يظهر فقط إذا تم اختيار سكوبس */}
                      {formData.classifications?.includes("scopus") && (
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                            سكوبس كوارتيل
                          </label>
                          <select
                            value={formData.scopus_quartile || "Q1"}
                            onChange={(e) => handleInputChange("scopus_quartile", e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                            style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                          >
                            <option value="Q1">Q1</option>
                            <option value="Q2">Q2</option>
                            <option value="Q3">Q3</option>
                            <option value="Q4">Q4</option>
                          </select>
                        </div>
                      )}
                    </>
                  )}
                </>
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
                  {editingResearch?.id ? "تحديث البحث" : "حفظ البحث"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
