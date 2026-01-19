"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import jsPDF from "jspdf";
import { formatDate } from "@/lib/utils/academic";

interface Position {
  id?: number;
  position_title: string;
  start_date: string;
  duration: string;
  organization: string;
  description: string;
  assignment_document?: string; // base64 string for PDF/image
  created_at?: string;
  updated_at?: string;
}

export default function PositionsPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [positionToDelete, setPositionToDelete] = useState<Position | null>(null);
  const [mobileActionsKey, setMobileActionsKey] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "title" | "organization">("date-desc");
  const [filterByOrganization, setFilterByOrganization] = useState<string>("all");
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [formData, setFormData] = useState<Position>({
    position_title: "",
    start_date: "",
    duration: "",
    organization: "",
    description: "",
    assignment_document: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");

  // Fetch positions on component mount
  useEffect(() => {
    const fetchPositions = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        const response = await fetch(`/api/teachers/positions?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setPositions(data);
        }
      } catch (error) {
        console.error("Error fetching positions:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPositions();
  }, [user]);

  const handleEditPosition = (position: Position) => {
    setEditingPosition(position);
    setFormData({
      position_title: position.position_title || "",
      start_date: position.start_date ? position.start_date.split('T')[0] : "",
      duration: position.duration || "",
      organization: position.organization || "",
      description: position.description || "",
      assignment_document: position.assignment_document || "",
    });
    setFilePreview(position.assignment_document || "");
    setSelectedFile(null);
    setShowForm(true);
  };

  const handleDeletePosition = async () => {
    if (!user || !positionToDelete?.id) return;

    try {
      setIsLoading(true);
      const response = await fetch(`/api/teachers/positions?id=${positionToDelete.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("فشل حذف المنصب");
      }

      setPositions(positions.filter(p => p.id !== positionToDelete.id));
      setPositionToDelete(null);
      alert("تم حذف المنصب بنجاح");
    } catch (error) {
      console.error("Error deleting position:", error);
      alert("حدث خطأ أثناء حذف المنصب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
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
      setIsLoading(true);
      
      // Get the final document value (from preview or formData)
      const assignmentDocument = filePreview || formData.assignment_document || null;
      
      if (editingPosition?.id) {
        // Update existing position
        const response = await fetch("/api/teachers/positions", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: editingPosition.id,
            positionTitle: formData.position_title,
            startDate: formData.start_date || null,
            duration: formData.duration,
            organization: formData.organization,
            description: formData.description,
            assignmentDocument: assignmentDocument,
          }),
        });

        if (!response.ok) {
          throw new Error("فشل تحديث المنصب");
        }

        const result = await response.json();
        setPositions(positions.map(p => p.id === editingPosition.id ? result.position : p));
        alert("تم تحديث المنصب بنجاح");
      } else {
        // Add new position
        const response = await fetch("/api/teachers/positions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            positionTitle: formData.position_title,
            startDate: formData.start_date || null,
            duration: formData.duration,
            organization: formData.organization,
            description: formData.description,
            assignmentDocument: assignmentDocument,
          }),
        });

        if (!response.ok) {
          throw new Error("فشل إضافة المنصب");
        }

        const result = await response.json();
        setPositions([result.position, ...positions]);
        alert("تم إضافة المنصب بنجاح");
      }

      // Reset form
      setFormData({
        position_title: "",
        start_date: "",
        duration: "",
        organization: "",
        description: "",
        assignment_document: "",
      });
      setSelectedFile(null);
      setFilePreview("");
      setEditingPosition(null);
      setShowForm(false);
    } catch (error) {
      console.error("Error saving position:", error);
      alert(editingPosition?.id ? "حدث خطأ أثناء تحديث المنصب. يرجى المحاولة مرة أخرى." : "حدث خطأ أثناء إضافة المنصب. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".relative") && !target.closest("#export-dropdown")) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showExportDropdown]);

  if (!user) {
    return null;
  }

  // Get unique organizations for filter
  const uniqueOrganizations = Array.from(new Set(positions.map(p => p.organization).filter(Boolean)));

  // Filter and sort positions
  const filteredAndSortedPositions = positions
    .filter((position) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = position.position_title?.toLowerCase().includes(query);
        const matchesOrganization = position.organization?.toLowerCase().includes(query);
        const matchesDescription = position.description?.toLowerCase().includes(query);
        if (!matchesTitle && !matchesOrganization && !matchesDescription) {
          return false;
        }
      }

      // Organization filter
      if (filterByOrganization !== "all" && position.organization !== filterByOrganization) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          if (!a.start_date && !b.start_date) return 0;
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
        case "date-asc":
          if (!a.start_date && !b.start_date) return 0;
          if (!a.start_date) return 1;
          if (!b.start_date) return -1;
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case "title":
          return (a.position_title || "").localeCompare(b.position_title || "", "ar");
        case "organization":
          return (a.organization || "").localeCompare(b.organization || "", "ar");
        default:
          return 0;
      }
    });

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ["المنصب", "التاريخ", "مدة المنصب", "الجهة", "الوصف"];
    const rows = filteredAndSortedPositions.map((position) => [
      position.position_title || "",
      position.start_date ? formatDate(position.start_date) : "",
      position.duration || "",
      position.organization || "",
      position.description || "",
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
    link.setAttribute("download", `المناصب_${new Date().toISOString().split('T')[0]}.csv`);
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
    doc.text("قائمة المناصب", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Date
    doc.setFontSize(10);
    doc.text(`تاريخ التصدير: ${formatDate(new Date())}`, pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Table headers
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const headers = ["المنصب", "التاريخ", "مدة المنصب", "الجهة"];
    const colWidths = [50, 35, 35, 50];
    let xPosition = margin;

    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition);
      xPosition += colWidths[index];
    });
    yPosition += 8;

    // Table rows
    doc.setFont("helvetica", "normal");
    filteredAndSortedPositions.forEach((position, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = margin;
      }

      const row = [
        position.position_title || "",
        position.start_date ? formatDate(position.start_date) : "",
        position.duration || "",
        position.organization || "",
      ];

      xPosition = margin;
      row.forEach((cell, colIndex) => {
        const lines = doc.splitTextToSize(cell, colWidths[colIndex] - 2);
        doc.text(lines, xPosition, yPosition);
        xPosition += colWidths[colIndex];
      });

      yPosition += 8;
    });

    doc.save(`المناصب_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  // Render Position Card Component (used in both views)
  const PositionCard = ({ position }: { position: Position }) => (
    <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-indigo-300 hover:shadow-md transition-all duration-300 relative overflow-hidden">
      {/* Decorative gradient bar */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
      
      <div className="flex items-start justify-between gap-4 mt-1">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Title with icon */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-md flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold truncate" style={{ color: '#1F2937' }}>
              {position.position_title}
            </h3>
          </div>

          {/* Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {position.start_date && (
              <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-md border border-blue-100">
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-blue-600">التاريخ:</span>
                  <p className="text-xs text-gray-700">{formatDate(position.start_date)}</p>
                </div>
              </div>
            )}
            
            {position.duration && (
              <div className="flex items-center gap-2 p-2 bg-purple-50 rounded-md border border-purple-100">
                <svg className="w-4 h-4 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-purple-600">المدة:</span>
                  <p className="text-xs text-gray-700">{position.duration}</p>
                </div>
              </div>
            )}
            
            {position.organization && (
              <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md border border-green-100">
                <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-green-600">الجهة:</span>
                  <p className="text-xs text-gray-700 truncate">{position.organization}</p>
                </div>
              </div>
            )}
            
            {position.description && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-md border border-amber-100">
                <svg className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-amber-600">الوصف:</span>
                  <p className="text-xs text-gray-700 truncate">{position.description}</p>
                </div>
              </div>
            )}
            
            {position.assignment_document && (
              <div className="flex items-center gap-2 p-2 bg-teal-50 rounded-md border border-teal-100 md:col-span-2">
                <svg className="w-4 h-4 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="text-xs font-medium text-teal-600">كتاب/أمر التكليف:</span>
                  {position.assignment_document.startsWith('data:image/') ? (
                    <div className="flex items-center gap-2">
                      <img 
                        src={position.assignment_document} 
                        alt="معاينة" 
                        className="w-16 h-16 object-cover rounded border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          const newWindow = window.open();
                          if (newWindow) {
                            newWindow.document.write(`<img src="${position.assignment_document}" style="max-width: 100%; height: auto;" />`);
                          }
                        }}
                        title="اضغط لعرض الصورة بالحجم الكامل"
                      />
                      <button
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = position.assignment_document!;
                          link.download = `assignment_${position.id || 'document'}.jpg`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="p-1.5 text-teal-600 hover:text-teal-800 hover:bg-teal-100 rounded transition-colors"
                        title="تحميل الصورة"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-16 bg-red-50 border border-red-200 rounded flex items-center justify-center">
                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => {
                            const newWindow = window.open();
                            if (newWindow && position.assignment_document) {
                              newWindow.document.write(`
                                <iframe src="${position.assignment_document}" style="width: 100%; height: 100vh; border: none;"></iframe>
                              `);
                            }
                          }}
                          className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          title="عرض PDF"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          عرض
                        </button>
                        <button
                          onClick={() => {
                            const link = document.createElement('a');
                            link.href = position.assignment_document!;
                            link.download = `assignment_${position.id || 'document'}.pdf`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                          className="text-xs text-teal-700 hover:text-teal-900 hover:bg-teal-100 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                          title="تحميل PDF"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          تحميل
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button
            onClick={() => handleEditPosition(position)}
            className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md transition-all duration-300 hover:scale-105 group/btn"
            title="تعديل"
          >
            <svg className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => setPositionToDelete(position)}
            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-md transition-all duration-300 hover:scale-105 group/btn"
            title="حذف"
          >
            <svg className="w-4 h-4 group-hover/btn:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );

  const MobilePositionCard = ({ position }: { position: Position }) => {
    const key = String(position.id ?? `${position.position_title}-${position.start_date}-${position.organization}`);
    const doc = position.assignment_document || "";
    const isImage = doc.startsWith("data:image/");
    const hasDoc = Boolean(doc);
    const safeTitle = position.position_title || "منصب";

    return (
      <div className="bg-white border border-slate-200/70 rounded-[22px] shadow-sm p-4 overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3 className="text-[16px] leading-6 font-extrabold text-slate-900 break-words">
                {safeTitle}
              </h3>
            </div>

            {position.organization && (
              <div className="mt-1.5 flex items-center min-w-0">
                <span className="inline-flex items-center gap-1.5 px-[10px] py-[6px] rounded-full bg-slate-50 border border-slate-200/70 text-slate-700 text-[12px] leading-none font-bold max-w-full min-w-0">
                  <svg className="w-4 h-4 text-slate-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21V5a2 2 0 012-2h4a2 2 0 012 2v16M4 21h16M6 21V9a2 2 0 012-2h0M16 21V9a2 2 0 00-2-2h0" />
                  </svg>
                  <span className="truncate" title={position.organization}>
                    {position.organization}
                  </span>
                </span>
              </div>
            )}

            {position.start_date && (
              <div className="mt-2 inline-flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-500">التاريخ</span>
                <span className="text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  {formatDate(position.start_date)}
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileActionsKey(key)}
            className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
            aria-label="إجراءات"
            title="إجراءات"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm8 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </button>
        </div>

        <div className="mt-3 space-y-2">
          {position.duration && (
            <div className="flex items-start gap-3">
              <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
                المدة
              </span>
              <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 break-words text-left">
                {position.duration}
              </span>
            </div>
          )}

          {position.organization && (
            <div className="flex items-start gap-3">
              <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
                الجهة
              </span>
              <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 break-words text-left">
                {position.organization}
              </span>
            </div>
          )}

          {position.description && (
            <div className="flex items-start gap-3">
              <span className="w-[92px] text-right text-[12px] leading-5 font-bold text-slate-500 flex-shrink-0">
                الوصف
              </span>
              <span className="flex-1 text-[13px] leading-5 font-semibold text-slate-800 break-words text-left">
                {position.description}
              </span>
            </div>
          )}

          {hasDoc && (
            <div className="pt-2 mt-2 border-t border-slate-200/70">
              <div className="text-[12px] font-bold text-slate-500 mb-2">الكتاب/الأمر</div>

              <div className="flex items-center gap-3">
                {isImage ? (
                  <img
                    src={doc}
                    alt="معاينة"
                    className="w-14 h-14 rounded-xl border border-slate-200 object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const newWindow = window.open();
                        if (!newWindow) return;
                        if (isImage) {
                          newWindow.document.write(`<img src="${doc}" style="max-width: 100%; height: auto;" />`);
                        } else {
                          newWindow.document.write(
                            `<iframe src="${doc}" style="width: 100%; height: 100vh; border: none;"></iframe>`
                          );
                        }
                      }}
                      className="h-11 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-sm font-bold"
                    >
                      عرض
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = doc;
                        link.download = isImage
                          ? `assignment_${position.id || "document"}.jpg`
                          : `assignment_${position.id || "document"}.pdf`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="h-11 rounded-2xl border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 text-sm font-bold"
                    >
                      تحميل
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {mobileActionsKey === key && (
          <div
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setMobileActionsKey(null)}
            role="presentation"
          >
            <div
              className="fixed inset-x-0 bottom-0 bg-white rounded-t-3xl p-4 border-t border-slate-200"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-base font-extrabold text-slate-900">إجراءات</div>
                <button
                  type="button"
                  onClick={() => setMobileActionsKey(null)}
                  className="h-11 w-11 rounded-2xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 flex items-center justify-center"
                  aria-label="إغلاق"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMobileActionsKey(null);
                    handleEditPosition(position);
                  }}
                  className="h-12 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700"
                >
                  تعديل
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMobileActionsKey(null);
                    setPositionToDelete(position);
                  }}
                  className="h-12 rounded-2xl bg-red-600 text-white font-extrabold hover:bg-red-700"
                >
                  حذف
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 max-[639px]:space-y-4 max-[639px]:overflow-x-hidden">
      {/* Statistics Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-lg border border-indigo-200 p-5 shadow-sm max-[639px]:rounded-3xl max-[639px]:px-4 max-[639px]:py-3 max-[639px]:shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg max-[639px]:w-12 max-[639px]:h-12">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">عدد المناصب الإجمالي</p>
              <p className="text-3xl font-bold max-[639px]:text-2xl" style={{ color: '#6366F1' }}>
                {positions.length}
              </p>
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-gray-500 max-[639px]:text-[11px] max-[639px]:text-slate-500">
              {positions.length === 0 
                ? "لا توجد مناصب مضافة" 
                : positions.length === 1 
                ? "منصب واحد" 
                : `${positions.length} مناصب`}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-[639px]:rounded-3xl max-[639px]:p-4 max-[639px]:shadow-sm max-[639px]:overflow-x-hidden">
        <div className="mb-6 max-[639px]:mb-4">
          <div className="flex items-center justify-between mb-4 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
            <div>
              <h1 className="text-2xl font-bold mb-2 max-[639px]:mb-1 max-[639px]:text-[20px]" style={{ color: '#1F2937' }}>المناصب</h1>
              <div className="h-1 w-20 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full max-[639px]:h-[3px] max-[639px]:w-16"></div>
            </div>
            {/* Desktop/Tablet Actions */}
            <div className="flex items-center gap-3 max-[639px]:hidden">
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("timeline")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-300 flex items-center gap-2 ${
                    viewMode === "timeline"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="عرض الخط الزمني"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-medium">خط زمني</span>
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 py-1.5 rounded-md transition-all duration-300 flex items-center gap-2 ${
                    viewMode === "grid"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                  title="عرض الشبكة"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                  <span className="text-sm font-medium">شبكة</span>
                </button>
              </div>
              
              <button
                onClick={() => {
                  setEditingPosition(null);
                  setFormData({
                    position_title: "",
                    start_date: "",
                    duration: "",
                    organization: "",
                    description: "",
                    assignment_document: "",
                  });
                  setSelectedFile(null);
                  setFilePreview("");
                  setShowForm(true);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>إضافة منصب</span>
              </button>
            </div>

            {/* Mobile Actions (Grid) */}
            <div className="hidden max-[639px]:grid grid-cols-2 gap-2.5 w-full">
              <button
                onClick={() => setViewMode("timeline")}
                className={`h-11 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 font-bold ${
                  viewMode === "timeline"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
                }`}
                title="عرض الخط الزمني"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm">خط زمني</span>
              </button>

              <button
                onClick={() => setViewMode("grid")}
                className={`h-11 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 font-bold ${
                  viewMode === "grid"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50"
                }`}
                title="عرض الشبكة"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="text-sm">شبكة</span>
              </button>

              <button
                onClick={() => {
                  setEditingPosition(null);
                  setFormData({
                    position_title: "",
                    start_date: "",
                    duration: "",
                    organization: "",
                    description: "",
                    assignment_document: "",
                  });
                  setSelectedFile(null);
                  setFilePreview("");
                  setShowForm(true);
                }}
                className="col-span-2 h-[52px] rounded-2xl bg-indigo-600 text-white hover:bg-indigo-700 transition-colors duration-200 flex items-center justify-center gap-2 font-extrabold"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>إضافة منصب</span>
              </button>
            </div>
          </div>

          {/* Search, Filter, Sort, Export Bar */}
          <div className="flex flex-col md:flex-row gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 max-[639px]:bg-white max-[639px]:rounded-3xl max-[639px]:p-3 max-[639px]:shadow-sm max-[639px]:gap-2.5 max-[639px]:border-slate-200/70">
            <div className="hidden max-[639px]:flex items-center gap-2 text-slate-700">
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 12.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-4.586L3.293 6.707A1 1 0 013 6V4z" />
              </svg>
              <span className="text-[12px] font-extrabold text-slate-700">بحث / فلترة</span>
            </div>
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
                  placeholder="ابحث عن منصب، جهة، أو وصف..."
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:h-11 max-[639px]:py-0 max-[639px]:rounded-2xl"
                  style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
                />
              </div>
            </div>

            {/* Filter by Organization */}
            <div className="md:w-48">
              <select
                value={filterByOrganization}
                onChange={(e) => setFilterByOrganization(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:h-11 max-[639px]:py-0 max-[639px]:rounded-2xl"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="all">جميع الجهات</option>
                {uniqueOrganizations.map((org) => (
                  <option key={org} value={org}>
                    {org}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="md:w-48">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300 max-[639px]:h-11 max-[639px]:py-0 max-[639px]:rounded-2xl"
                style={{ color: '#1F2937', backgroundColor: '#FFFFFF' }}
              >
                <option value="date-desc">التاريخ (الأحدث أولاً)</option>
                <option value="date-asc">التاريخ (الأقدم أولاً)</option>
                <option value="title">المنصب (أ-ي)</option>
                <option value="organization">الجهة (أ-ي)</option>
              </select>
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowExportDropdown(!showExportDropdown);
                }}
                className="w-full md:w-auto px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-300 flex items-center gap-2 max-[639px]:h-[52px] max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:justify-center max-[639px]:flex-row-reverse"
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
          </div>
        </div>

        {/* Positions List */}
        {isLoading && positions.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-4 text-gray-600">جاري التحميل...</p>
          </div>
        ) : positions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <p className="text-gray-500 text-lg">لا توجد مناصب مضافة</p>
            <p className="text-gray-400 text-sm mt-2">اضغط على زر "إضافة منصب" لإضافة منصبك الأول</p>
          </div>
        ) : (
          <>
            {/* Mobile list (no timeline visuals) */}
            <div className="hidden max-[639px]:block space-y-3">
              {filteredAndSortedPositions.map((position) => (
                <MobilePositionCard
                  key={String(position.id ?? `${position.position_title}-${position.start_date}-${position.organization}`)}
                  position={position}
                />
              ))}
            </div>

            {/* Desktop/Tablet original views */}
            <div className="max-[639px]:hidden">
              {viewMode === "timeline" ? (
                <div className="relative pr-8">
                  {/* Vertical Timeline Line */}
                  <div className="absolute right-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 via-purple-400 to-pink-400"></div>

                  {/* Timeline Items */}
                  <div className="space-y-4">
                    {filteredAndSortedPositions.map((position) => (
                      <div key={position.id} className="relative flex items-start gap-6">
                        {/* Timeline Dot */}
                        <div className="relative z-10 flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 border-4 border-white shadow-lg flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full bg-white"></div>
                          </div>
                          {/* Date Badge */}
                          {position.start_date && (
                            <div className="absolute -top-2 right-12 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md whitespace-nowrap">
                              {formatDate(position.start_date)}
                            </div>
                          )}
                        </div>

                        {/* Position Card */}
                        <div className="flex-1">
                          <PositionCard position={position} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAndSortedPositions.map((position) => (
                    <PositionCard key={position.id} position={position} />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Position Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold" style={{ color: '#1F2937' }}>
                {editingPosition?.id ? "تعديل المنصب" : "إضافة منصب جديد"}
              </h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingPosition(null);
                  setFormData({
                    position_title: "",
                    start_date: "",
                    duration: "",
                    organization: "",
                    description: "",
                    assignment_document: "",
                  });
                  setSelectedFile(null);
                  setFilePreview("");
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  المنصب <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.position_title}
                  onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                  placeholder="أدخل اسم المنصب"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    التاريخ
                  </label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                    مدة المنصب
                  </label>
                  <input
                    type="text"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="مثال: سنة واحدة، 6 أشهر"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                    style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  الجهة
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder="أدخل اسم الجهة أو المؤسسة"
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
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="أدخل وصفاً للمنصب..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                  style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                  كتاب أو أمر التكليف (PDF أو صورة)
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

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "جاري الحفظ..." : editingPosition?.id ? "تحديث" : "حفظ"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {positionToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setPositionToDelete(null)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center mb-2" style={{ color: '#1F2937' }}>
              تأكيد الحذف
            </h3>
            <p className="text-gray-600 text-center mb-6">
              هل أنت متأكد من حذف المنصب <strong>"{positionToDelete.position_title}"</strong>؟ هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="flex items-center justify-end gap-4">
              <button
                onClick={() => setPositionToDelete(null)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                disabled={isLoading}
              >
                إلغاء
              </button>
              <button
                onClick={handleDeletePosition}
                disabled={isLoading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "جاري الحذف..." : "حذف"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
