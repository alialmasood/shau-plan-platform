"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Sidebar from "../_components/Sidebar";
import Topbar from "../_components/Topbar";
import Card from "../_components/Card";

type PublishingRow = {
  userId: number;
  researcherName: string;
  researchesCount: number;
  researchTitles: string[];
  publicationYears: number[];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export default function PublishingPageShell({
  rows,
}: {
  rows: PublishingRow[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pdfExportRef = useRef<HTMLDivElement | null>(null);

  const totalResearchers = useMemo(() => rows.length, [rows]);
  const totalResearches = useMemo(
    () => rows.reduce((sum, row) => sum + row.researchesCount, 0),
    [rows]
  );

  function exportExcel() {
    const htmlRows = rows
      .map((row, idx) => {
        const titles =
          row.researchTitles.length > 0
            ? row.researchTitles.map((t) => `- ${escapeHtml(t)}`).join("<br/>")
            : "لا توجد بحوث مسجلة";
        const years =
          row.publicationYears.length > 0
            ? row.publicationYears.join("، ")
            : "—";
        return `
          <tr>
            <td>${idx + 1}</td>
            <td>${escapeHtml(row.researcherName)}</td>
            <td>${row.researchesCount}</td>
            <td>${titles}</td>
            <td>${escapeHtml(years)}</td>
          </tr>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; direction: rtl; }
            h2 { color: #0f172a; margin-bottom: 8px; }
            .meta { color: #475569; margin-bottom: 14px; font-size: 12px; }
            table { border-collapse: collapse; width: 100%; font-size: 12px; }
            th, td { border: 1px solid #cbd5e1; padding: 8px; vertical-align: top; text-align: right; }
            th { background: #dbeafe; color: #1e3a8a; font-weight: 700; }
            tr:nth-child(even) td { background: #f8fafc; }
          </style>
        </head>
        <body>
          <h2>تقرير البحوث والنشر</h2>
          <div class="meta">عدد الباحثين/التدريسيين: ${totalResearchers} | إجمالي البحوث: ${totalResearches}</div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>اسم الباحث/التدريسي</th>
                <th>عدد البحوث المسجلة</th>
                <th>أسماء البحوث</th>
                <th>سنة النشر</th>
              </tr>
            </thead>
            <tbody>${htmlRows}</tbody>
          </table>
        </body>
      </html>
    `;

    const blob = new Blob([`\ufeff${html}`], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "publishing-report.xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function exportPdf() {
    if (!pdfExportRef.current) return;

    const canvas = await html2canvas(pdfExportRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = contentWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = margin;

    doc.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + margin;
      doc.addPage("a4", "portrait");
      doc.addImage(imgData, "PNG", margin, position, imgWidth, imgHeight, undefined, "FAST");
      heightLeft -= contentHeight;
    }

    doc.save("publishing-report-a4.pdf");
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeKey="publishing"
        />

        <div className="flex-1 min-w-0">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8 space-y-6">
            <section className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  البحوث والنشر
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  قائمة رسمية بأسماء الباحثين وعدد البحوث المسجلة وعناوينها.
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
              >
                رجوع للوحة الإدارة
              </Link>
            </section>

            <section className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={exportExcel}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold"
              >
                تصدير Excel
              </button>
              <button
                type="button"
                onClick={exportPdf}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-extrabold"
              >
                تصدير PDF (A4)
              </button>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-xs font-bold text-slate-500">عدد الباحثين/التدريسيين</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {totalResearchers}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-bold text-slate-500">إجمالي البحوث المسجلة</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">
                  {totalResearches}
                </div>
              </Card>
            </section>

            <section>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100/80 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-right font-extrabold">#</th>
                        <th className="px-4 py-3 text-right font-extrabold">اسم الباحث/التدريسي</th>
                        <th className="px-4 py-3 text-right font-extrabold">عدد البحوث المسجلة</th>
                        <th className="px-4 py-3 text-right font-extrabold">أسماء البحوث</th>
                        <th className="px-4 py-3 text-right font-extrabold">سنة النشر</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={row.userId} className="border-t border-slate-200/80 align-top">
                          <td className="px-4 py-3 font-bold text-slate-600">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/researchers/${row.userId}`}
                              className="font-bold text-slate-900 hover:text-blue-700"
                            >
                              {row.researcherName}
                            </Link>
                          </td>
                          <td className="px-4 py-3 font-extrabold text-slate-900">
                            {row.researchesCount}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.researchTitles.length > 0 ? (
                              <ul className="space-y-1">
                                {row.researchTitles.map((title, titleIdx) => (
                                  <li key={`${row.userId}-${titleIdx}`} className="leading-6">
                                    - {title}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <span className="text-slate-400">لا توجد بحوث مسجلة</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {row.publicationYears.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {row.publicationYears.map((year) => (
                                  <span
                                    key={`${row.userId}-${year}`}
                                    className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700"
                                  >
                                    {year}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-500" colSpan={5}>
                            لا توجد بيانات بحوث حالياً.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </main>
        </div>
      </div>

      <div className="fixed -left-[10000px] top-0 pointer-events-none opacity-0" aria-hidden>
        <div
          ref={pdfExportRef}
          dir="rtl"
          style={{
            width: "1120px",
            backgroundColor: "#ffffff",
            color: "#0f172a",
            fontFamily:
              "Tahoma, Arial, 'Noto Sans Arabic', 'Segoe UI', sans-serif",
            padding: "28px",
          }}
        >
          <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "8px" }}>
            تقرير البحوث والنشر
          </div>
          <div style={{ fontSize: "16px", color: "#334155", marginBottom: "16px" }}>
            عدد الباحثين/التدريسيين: {totalResearchers} | إجمالي البحوث: {totalResearches}
          </div>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "14px",
              border: "1px solid #cbd5e1",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#2563eb", color: "#ffffff" }}>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>#</th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>
                  اسم الباحث/التدريسي
                </th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>
                  عدد البحوث المسجلة
                </th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>
                  أسماء البحوث
                </th>
                <th style={{ border: "1px solid #cbd5e1", padding: "8px", textAlign: "right" }}>
                  سنة النشر
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row, idx) => (
                  <tr key={`pdf-${row.userId}`} style={{ backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", verticalAlign: "top" }}>
                      {idx + 1}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", verticalAlign: "top" }}>
                      {row.researcherName}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", verticalAlign: "top" }}>
                      {row.researchesCount}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", verticalAlign: "top", lineHeight: 1.6 }}>
                      {row.researchTitles.length > 0
                        ? row.researchTitles.map((title, titleIdx) => (
                            <div key={`pdf-title-${row.userId}-${titleIdx}`}>- {title}</div>
                          ))
                        : "لا توجد بحوث مسجلة"}
                    </td>
                    <td style={{ border: "1px solid #cbd5e1", padding: "8px", verticalAlign: "top" }}>
                      {row.publicationYears.length > 0 ? row.publicationYears.join("، ") : "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      border: "1px solid #cbd5e1",
                      padding: "20px",
                      textAlign: "center",
                      color: "#64748b",
                    }}
                  >
                    لا توجد بيانات بحوث حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

