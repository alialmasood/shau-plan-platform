"use client";

import { useState, useEffect } from "react";
import { useLayout } from "../layout";
import { QRCodeSVG } from "qrcode.react";
import jsPDF from "jspdf";

interface ResearcherLinks {
  google_scholar?: string;
  scopus?: string;
  research_gate?: string;
  orcid?: string;
  web_of_science?: string;
  linkedin?: string;
  github?: string;
  academia_edu?: string;
  mendeley?: string;
  pubmed?: string;
  ieee_xplore?: string;
  google_scholar_clicks?: number;
  scopus_clicks?: number;
  research_gate_clicks?: number;
  orcid_clicks?: number;
  web_of_science_clicks?: number;
  linkedin_clicks?: number;
  github_clicks?: number;
  academia_edu_clicks?: number;
  mendeley_clicks?: number;
  pubmed_clicks?: number;
  ieee_xplore_clicks?: number;
  updated_at?: string;
  created_at?: string;
}

export default function ResearcherLinksPage() {
  const { user } = useLayout();
  const [showForm, setShowForm] = useState(false);
  const [links, setLinks] = useState<ResearcherLinks>({});
  const [formData, setFormData] = useState<ResearcherLinks>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  useEffect(() => {
    // Load links from API
    const fetchLinks = async () => {
      if (user) {
        try {
          const response = await fetch(`/api/teachers/researcher-links?userId=${user.id}`);
          if (response.ok) {
            const data = await response.json();
            setLinks(data);
            setFormData(data);
          }
        } catch (error) {
          console.error("Error fetching links:", error);
        }
      }
    };

    fetchLinks();
  }, [user]);

  // Close dropdown when clicking outside
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

  const handleInputChange = (field: keyof ResearcherLinks, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/teachers/researcher-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          ...formData,
        }),
      });

      if (!response.ok) {
        throw new Error("فشل حفظ الروابط");
      }

      setLinks(formData);
      setShowForm(false);
      setFormData({});
    } catch (error) {
      console.error("Error saving links:", error);
      alert("حدث خطأ أثناء حفظ الروابط. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setFormData(links);
    setShowForm(true);
  };

  if (!user) {
    return null;
  }

  const scientificLinks = [
    { key: "google_scholar" as keyof ResearcherLinks, label: "Google Scholar", icon: "🔍" },
    { key: "scopus" as keyof ResearcherLinks, label: "Scopus", icon: "📚" },
    { key: "research_gate" as keyof ResearcherLinks, label: "Research Gate", icon: "🔬" },
    { key: "orcid" as keyof ResearcherLinks, label: "ORCID", icon: "🆔" },
    { key: "web_of_science" as keyof ResearcherLinks, label: "Web of Science", icon: "🌐" },
  ];

  const additionalLinks = [
    { key: "linkedin" as keyof ResearcherLinks, label: "LinkedIn", icon: "💼" },
    { key: "academia_edu" as keyof ResearcherLinks, label: "Academia.edu", icon: "🎓" },
    { key: "mendeley" as keyof ResearcherLinks, label: "Mendeley", icon: "📖" },
    { key: "pubmed" as keyof ResearcherLinks, label: "PubMed", icon: "🔬" },
    { key: "ieee_xplore" as keyof ResearcherLinks, label: "IEEE Xplore", icon: "⚡" },
  ];

  const linkLabels = [...scientificLinks, ...additionalLinks];

  // Copy all links to clipboard
  const handleCopyAllLinks = async () => {
    const allLinks = linkLabels
      .map((item) => {
        const linkValue = links[item.key];
        if (!linkValue || typeof linkValue !== 'string' || linkValue.trim() === "") return null;
        return `${item.label}: ${linkValue}`;
      })
      .filter((link) => link !== null)
      .join("\n");

    try {
      await navigator.clipboard.writeText(allLinks);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying links:", error);
      alert("فشل نسخ الروابط. يرجى المحاولة مرة أخرى.");
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const csvRows = [
      ["Platform", "URL"],
      ...linkLabels
        .map((item) => {
          const linkValue = links[item.key];
          if (!linkValue || typeof linkValue !== 'string' || linkValue.trim() === "") return null;
          return [item.label, linkValue];
        })
        .filter((row) => row !== null) as string[][],
    ];

    const csvContent = csvRows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const dataBlob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `researcher-links-${user?.id || "user"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export to PDF
  const handleExportPDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPos = 20;

    // Title
    doc.setFontSize(18);
    doc.text("روابط الباحث", pageWidth / 2, yPos, { align: "center" });
    yPos += 15;

    // Links
    doc.setFontSize(12);
    linkLabels.forEach((item) => {
      const linkValue = links[item.key];
      if (!linkValue || typeof linkValue !== 'string' || linkValue.trim() === "") return;

      if (yPos > pageHeight - 30) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(item.label + ":", 20, yPos);
      doc.setFont("helvetica", "normal");
      const splitLink = doc.splitTextToSize(linkValue, pageWidth - 40);
      doc.text(splitLink, 20, yPos + 7);
      yPos += splitLink.length * 7 + 10;
    });

    doc.save(`researcher-links-${user?.id || "user"}.pdf`);
  };

  if (!user) {
    return null;
  }

  const hasLinks = Object.values(links).some((link) => link && link.trim() !== "");
  const linksCount = Object.values(links).filter((link) => link && link.trim() !== "").length;

  return (
    <div className="space-y-6 max-[639px]:space-y-4 max-[639px]:overflow-x-hidden">
      {/* Statistics Cards */}
      {hasLinks && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-[639px]:gap-3">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200 p-6 shadow-sm max-[639px]:rounded-[20px] max-[639px]:p-4 max-[639px]:min-h-[108px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>
                  عدد الروابط المحفوظة
                </p>
                <p className="text-3xl font-bold" style={{ color: '#1F2937' }}>
                  {linksCount}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-indigo-500 flex items-center justify-center max-[639px]:w-12 max-[639px]:h-12">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg border border-emerald-200 p-6 shadow-sm max-[639px]:rounded-[20px] max-[639px]:p-4 max-[639px]:min-h-[108px]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: '#6B7280' }}>
                  إجمالي الروابط المتاحة
                </p>
                <p className="text-3xl font-bold" style={{ color: '#1F2937' }}>
                  {linkLabels.length}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center max-[639px]:w-12 max-[639px]:h-12">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Button */}
      <div className="flex items-center justify-end max-[639px]:justify-stretch">
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-14 max-[639px]:rounded-2xl max-[639px]:justify-center"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span className="font-medium">إدارة روابط الباحث</span>
          <span className="hidden max-[639px]:inline font-extrabold">+</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-[639px]:rounded-3xl max-[639px]:p-4">
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-2" style={{ color: '#1F2937' }}>
              أدخل الروابط الرسمية لحساباتك البحثية
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Google Scholar
              </label>
              <input
                type="url"
                value={formData.google_scholar || ""}
                onChange={(e) => handleInputChange("google_scholar", e.target.value)}
                placeholder="https://scholar.google.com/citations?user=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Scopus
              </label>
              <input
                type="url"
                value={formData.scopus || ""}
                onChange={(e) => handleInputChange("scopus", e.target.value)}
                placeholder="https://www.scopus.com/authid/detail.uri?authorId=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Research Gate
              </label>
              <input
                type="url"
                value={formData.research_gate || ""}
                onChange={(e) => handleInputChange("research_gate", e.target.value)}
                placeholder="https://www.researchgate.net/profile/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط ORCID
              </label>
              <input
                type="url"
                value={formData.orcid || ""}
                onChange={(e) => handleInputChange("orcid", e.target.value)}
                placeholder="https://orcid.org/0000-0000-0000-0000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Web of Science
              </label>
              <input
                type="url"
                value={formData.web_of_science || ""}
                onChange={(e) => handleInputChange("web_of_science", e.target.value)}
                placeholder="https://www.webofscience.com/wos/author/record/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div className="pt-4 mt-4 border-t border-gray-200">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#1F2937' }}>
                روابط إضافية
              </h3>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط LinkedIn
              </label>
              <input
                type="url"
                value={formData.linkedin || ""}
                onChange={(e) => handleInputChange("linkedin", e.target.value)}
                placeholder="https://www.linkedin.com/in/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Academia.edu
              </label>
              <input
                type="url"
                value={formData.academia_edu || ""}
                onChange={(e) => handleInputChange("academia_edu", e.target.value)}
                placeholder="https://....academia.edu/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط Mendeley
              </label>
              <input
                type="url"
                value={formData.mendeley || ""}
                onChange={(e) => handleInputChange("mendeley", e.target.value)}
                placeholder="https://www.mendeley.com/profiles/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط PubMed
              </label>
              <input
                type="url"
                value={formData.pubmed || ""}
                onChange={(e) => handleInputChange("pubmed", e.target.value)}
                placeholder="https://pubmed.ncbi.nlm.nih.gov/?term=..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#374151' }}>
                رابط IEEE Xplore
              </label>
              <input
                type="url"
                value={formData.ieee_xplore || ""}
                onChange={(e) => handleInputChange("ieee_xplore", e.target.value)}
                placeholder="https://ieeexplore.ieee.org/author/..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-300"
                style={{ color: '#1F2937', backgroundColor: '#FAFBFC' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 max-[639px]:flex-col max-[639px]:items-stretch">
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({});
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300 max-[639px]:w-full max-[639px]:h-12 max-[639px]:rounded-2xl"
              style={{ color: '#374151' }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 max-[639px]:w-full max-[639px]:h-12 max-[639px]:rounded-2xl max-[639px]:justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>حفظ الروابط</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Links Display Card */}
      {hasLinks && !showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm max-[639px]:rounded-3xl max-[639px]:p-4">
          <div className="flex items-center justify-between mb-6 max-[639px]:flex-col max-[639px]:items-stretch max-[639px]:gap-3">
            <h2 className="text-xl font-bold max-[639px]:text-[16px]" style={{ color: '#1F2937' }}>روابط الباحث</h2>
            <div className="flex items-center gap-3 max-[639px]:grid max-[639px]:grid-cols-2 max-[639px]:gap-2 max-[639px]:w-full">
              {/* Copy All Links Button */}
              <button
                onClick={handleCopyAllLinks}
                className="px-4 py-2 text-emerald-600 border border-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:justify-center max-[639px]:rounded-2xl max-[639px]:text-[14px] max-[639px]:border-emerald-400/70"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span className="font-medium">{copied ? "تم النسخ!" : "نسخ جميع الروابط"}</span>
              </button>

              {/* Export Dropdown */}
              <div className="relative max-[639px]:w-full">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowExportDropdown(!showExportDropdown);
                  }}
                  className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:justify-center max-[639px]:rounded-2xl max-[639px]:text-[14px] max-[639px]:border-purple-400/70"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="font-medium">تصدير</span>
                </button>
                {showExportDropdown && (
                  <div className="absolute left-0 mt-2 w-48 max-[639px]:w-full bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportCSV();
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-right px-4 py-2 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2 border-t border-gray-100"
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

              {/* Edit Button */}
              <button
                onClick={handleEdit}
                className="px-4 py-2 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors duration-300 flex items-center gap-2 max-[639px]:w-full max-[639px]:h-11 max-[639px]:justify-center max-[639px]:rounded-2xl max-[639px]:text-[14px] max-[639px]:col-span-2 max-[639px]:border-indigo-400/70"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="font-medium">تعديل</span>
              </button>
            </div>
          </div>

          {/* Scientific Links Row */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-4 max-[639px]:flex-col max-[639px]:gap-3">
              {scientificLinks.map((item) => {
                const linkValue = links[item.key] as string | undefined;
                const clicks = links[`${item.key}_clicks` as keyof ResearcherLinks] as number | undefined || 0;
                if (!linkValue || linkValue.trim() === "") return null;

                return (
                  <div
                    key={item.key}
                    className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center flex-1 min-w-[200px] max-[639px]:w-full max-[639px]:min-w-0 max-[639px]:rounded-3xl max-[639px]:p-3 max-[639px]:items-stretch max-[639px]:text-right max-[639px]:active:bg-slate-50"
                  >
                    <a
                      href={linkValue}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <div className="flex flex-col items-center text-center max-[639px]:flex-row-reverse max-[639px]:items-center max-[639px]:gap-3 max-[639px]:text-right">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4 group-hover:from-indigo-200 group-hover:to-indigo-300 transition-all duration-300 max-[639px]:w-11 max-[639px]:h-11 max-[639px]:mb-0 flex-shrink-0">
                          <span className="text-3xl max-[639px]:text-2xl">{item.icon}</span>
                        </div>

                        <div className="min-w-0 flex-1 w-full">
                          <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors duration-300 max-[639px]:text-[15px] max-[639px]:mb-1" style={{ color: '#1F2937' }}>
                            {item.label}
                          </h3>
                          <p
                            className="text-xs text-gray-500 line-clamp-2 break-all mb-2 max-[639px]:text-[12px] max-[639px]:leading-5 max-[639px]:truncate max-[639px]:whitespace-nowrap max-[639px]:overflow-hidden max-[639px]:text-ellipsis max-[639px]:w-full max-[639px]:mb-1.5"
                            title={linkValue}
                          >
                            {linkValue}
                          </p>
                          {clicks > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-400 mb-2 max-[639px]:mb-0 max-[639px]:justify-start">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                              <span>{clicks} نقرات</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </a>

                    {/* Mobile actions row (prevents overlap) */}
                    <div className="hidden max-[639px]:flex items-center gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setShowQRCode(showQRCode === linkValue ? null : linkValue)}
                        className="h-11 w-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
                        aria-label="عرض QR Code"
                      >
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(linkValue);
                            setCopiedLink(linkValue);
                            setTimeout(() => setCopiedLink(null), 2000);
                          } catch (error) {
                            console.error("Error copying link:", error);
                          }
                        }}
                        className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3 flex items-center justify-center gap-2"
                        aria-label="نسخ الرابط"
                      >
                        {copiedLink === linkValue ? (
                          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                        <span className="text-[13px] font-extrabold text-slate-700">
                          {copiedLink === linkValue ? "تم النسخ" : "نسخ"}
                        </span>
                      </button>
                    </div>
                    
                    {/* QR Code Button */}
                    <button
                      onClick={() => setShowQRCode(showQRCode === linkValue ? null : linkValue)}
                      className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden"
                      title="عرض QR Code"
                    >
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      </svg>
                    </button>

                    {/* Copy Link Button */}
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(linkValue);
                          setCopiedLink(linkValue);
                          setTimeout(() => setCopiedLink(null), 2000);
                        } catch (error) {
                          console.error("Error copying link:", error);
                        }
                      }}
                      className="absolute bottom-3 left-14 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden"
                      title="نسخ الرابط"
                    >
                      {copiedLink === linkValue ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>

                    {/* External Link Icon */}
                    <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </div>
                    </div>

                    {/* QR Code Modal */}
                    {showQRCode === linkValue && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRCode(null)}>
                        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>QR Code - {item.label}</h3>
                            <button
                              onClick={() => setShowQRCode(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <div className="flex flex-col items-center">
                            <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                              <QRCodeSVG value={linkValue} size={200} />
                            </div>
                            <p className="text-sm text-gray-500 mt-4 text-center break-all">{linkValue}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Additional Links Row */}
          {additionalLinks.some((item) => {
            const linkValue = links[item.key];
            return linkValue && typeof linkValue === 'string' && linkValue.trim() !== "";
          }) && (
            <div>
              <div className="flex flex-wrap gap-4 max-[639px]:flex-col max-[639px]:gap-3">
                {additionalLinks.map((item) => {
                  const linkValue = links[item.key] as string | undefined;
                  const clicks = links[`${item.key}_clicks` as keyof ResearcherLinks] as number | undefined || 0;
                  if (!linkValue || linkValue.trim() === "") return null;

                  return (
                    <div
                      key={item.key}
                      className="group relative bg-white border-2 border-gray-200 rounded-xl p-5 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 flex flex-col items-center text-center flex-1 min-w-[200px] max-[639px]:w-full max-[639px]:min-w-0 max-[639px]:rounded-3xl max-[639px]:p-3 max-[639px]:items-stretch max-[639px]:text-right max-[639px]:active:bg-slate-50"
                    >
                      <a
                        href={linkValue}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full"
                      >
                        <div className="flex flex-col items-center text-center max-[639px]:flex-row-reverse max-[639px]:items-center max-[639px]:gap-3 max-[639px]:text-right">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center mb-4 group-hover:from-indigo-200 group-hover:to-indigo-300 transition-all duration-300 max-[639px]:w-11 max-[639px]:h-11 max-[639px]:mb-0 flex-shrink-0">
                            <span className="text-3xl max-[639px]:text-2xl">{item.icon}</span>
                          </div>

                          <div className="min-w-0 flex-1 w-full">
                            <h3 className="font-bold text-lg mb-2 group-hover:text-indigo-600 transition-colors duration-300 max-[639px]:text-[15px] max-[639px]:mb-1" style={{ color: '#1F2937' }}>
                              {item.label}
                            </h3>
                            <p
                              className="text-xs text-gray-500 line-clamp-2 break-all mb-2 max-[639px]:text-[12px] max-[639px]:leading-5 max-[639px]:truncate max-[639px]:whitespace-nowrap max-[639px]:overflow-hidden max-[639px]:text-ellipsis max-[639px]:w-full max-[639px]:mb-1.5"
                              title={linkValue}
                            >
                              {linkValue}
                            </p>
                            {clicks > 0 && (
                              <div className="flex items-center gap-1 text-xs text-gray-400 mb-2 max-[639px]:mb-0 max-[639px]:justify-start">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                </svg>
                                <span>{clicks} نقرات</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </a>

                      {/* Mobile actions row (prevents overlap) */}
                      <div className="hidden max-[639px]:flex items-center gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => setShowQRCode(showQRCode === linkValue ? null : linkValue)}
                          className="h-11 w-11 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center"
                          aria-label="عرض QR Code"
                        >
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(linkValue);
                              setCopiedLink(linkValue);
                              setTimeout(() => setCopiedLink(null), 2000);
                            } catch (error) {
                              console.error("Error copying link:", error);
                            }
                          }}
                          className="h-11 flex-1 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3 flex items-center justify-center gap-2"
                          aria-label="نسخ الرابط"
                        >
                          {copiedLink === linkValue ? (
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                          <span className="text-[13px] font-extrabold text-slate-700">
                            {copiedLink === linkValue ? "تم النسخ" : "نسخ"}
                          </span>
                        </button>
                      </div>
                      
                      {/* QR Code Button */}
                      <button
                        onClick={() => setShowQRCode(showQRCode === linkValue ? null : linkValue)}
                        className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden"
                        title="عرض QR Code"
                      >
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                      </button>

                      {/* Copy Link Button */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            await navigator.clipboard.writeText(linkValue);
                            setCopiedLink(linkValue);
                            setTimeout(() => setCopiedLink(null), 2000);
                          } catch (error) {
                            console.error("Error copying link:", error);
                          }
                        }}
                        className="absolute bottom-3 left-14 w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden"
                        title="نسخ الرابط"
                      >
                        {copiedLink === linkValue ? (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>

                      {/* External Link Icon */}
                      <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 max-[639px]:hidden">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </div>
                      </div>

                      {/* QR Code Modal */}
                      {showQRCode === linkValue && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowQRCode(null)}>
                          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                              <h3 className="text-lg font-bold" style={{ color: '#1F2937' }}>QR Code - {item.label}</h3>
                              <button
                                onClick={() => setShowQRCode(null)}
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex flex-col items-center">
                              <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                                <QRCodeSVG value={linkValue} size={200} />
                              </div>
                              <p className="text-sm text-gray-500 mt-4 text-center break-all">{linkValue}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
