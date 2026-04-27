"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Sidebar from "../_components/Sidebar";
import Topbar from "../_components/Topbar";
import Card from "../_components/Card";

type ResearcherRow = {
  id: number;
  fullName: string;
  username: string;
  email: string | null;
  departmentName: string;
  academicTitle: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string | null;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-IQ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ResearchersPageShell({
  researchers,
}: {
  researchers: ResearcherRow[];
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState(researchers);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const total = useMemo(() => rows.length, [rows]);
  const active = useMemo(
    () => rows.filter((r) => r.isActive).length,
    [rows]
  );

  async function handleDeleteResearcher(researcher: ResearcherRow) {
    const label = researcher.fullName || researcher.username;
    const confirmed = window.confirm(`هل أنت متأكد من حذف حساب التدريسي "${label}"؟ لا يمكن التراجع عن هذا الإجراء.`);
    if (!confirmed) return;

    setFeedback(null);
    setDeletingId(researcher.id);
    try {
      const res = await fetch(`/api/admin/researchers/${researcher.id}`, {
        method: "DELETE",
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; message?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "فشل حذف الحساب");
      }

      setRows((prev) => prev.filter((r) => r.id !== researcher.id));
      setFeedback({ type: "success", text: data.message || "تم حذف حساب التدريسي بنجاح" });
    } catch (error: any) {
      setFeedback({ type: "error", text: error?.message || "تعذر حذف الحساب حالياً" });
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div dir="rtl" className="min-h-screen bg-slate-50 text-slate-900 antialiased">
      <div className="flex min-h-screen">
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeKey="researchers"
        />

        <div className="flex-1 min-w-0">
          <Topbar onOpenSidebar={() => setSidebarOpen(true)} />

          <main className="px-4 py-5 md:px-6 md:py-6 lg:px-8 space-y-6">
            <section className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-extrabold text-slate-900">
                  الباحثون المسجلون
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  عرض جميع الباحثين الذين تم تسجيلهم من صفحة إنشاء الحساب.
                </p>
              </div>
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
              >
                رجوع للوحة الإدارة
              </Link>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="text-xs font-bold text-slate-500">إجمالي الباحثين</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">{total}</div>
              </Card>
              <Card className="p-4">
                <div className="text-xs font-bold text-slate-500">الحسابات الفعالة</div>
                <div className="mt-2 text-2xl font-extrabold text-slate-900">{active}</div>
              </Card>
            </section>

            <section>
              {feedback ? (
                <div
                  className={[
                    "mb-3 rounded-xl border px-3 py-2 text-sm font-bold",
                    feedback.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-rose-200 bg-rose-50 text-rose-700",
                  ].join(" ")}
                >
                  {feedback.text}
                </div>
              ) : null}

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-100/80 text-slate-700">
                      <tr>
                        <th className="px-4 py-3 text-right font-extrabold">#</th>
                        <th className="px-4 py-3 text-right font-extrabold">الاسم</th>
                        <th className="px-4 py-3 text-right font-extrabold">البريد الإلكتروني</th>
                        <th className="px-4 py-3 text-right font-extrabold">القسم</th>
                        <th className="px-4 py-3 text-right font-extrabold">اللقب العلمي</th>
                        <th className="px-4 py-3 text-right font-extrabold">الهاتف</th>
                        <th className="px-4 py-3 text-right font-extrabold">الحالة</th>
                        <th className="px-4 py-3 text-right font-extrabold">تاريخ التسجيل</th>
                        <th className="px-4 py-3 text-right font-extrabold">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, idx) => (
                        <tr key={r.id} className="border-t border-slate-200/80 hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-bold text-slate-600">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <Link
                              href={`/admin/researchers/${r.id}`}
                              className="font-bold text-slate-900 hover:text-blue-700"
                            >
                              {r.fullName}
                            </Link>
                            <div className="text-xs text-slate-500 mt-0.5">@{r.username}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{r.email || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{r.departmentName}</td>
                          <td className="px-4 py-3 text-slate-700">{r.academicTitle || "—"}</td>
                          <td className="px-4 py-3 text-slate-700">{r.phone || "—"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={[
                                "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold",
                                r.isActive
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-rose-100 text-rose-700",
                              ].join(" ")}
                            >
                              {r.isActive ? "فعال" : "غير فعال"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{formatDate(r.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => void handleDeleteResearcher(r)}
                              disabled={deletingId === r.id}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-extrabold text-rose-700 hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {deletingId === r.id ? "جارِ الحذف..." : "حذف"}
                            </button>
                          </td>
                        </tr>
                      ))}

                      {rows.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-slate-500" colSpan={9}>
                            لا يوجد باحثون مسجلون حالياً.
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
    </div>
  );
}

