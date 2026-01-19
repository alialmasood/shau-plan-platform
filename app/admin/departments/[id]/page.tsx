import Link from "next/link";
import { getDepartmentById } from "@/lib/db/departments";
import { ensureDepartmentsReady } from "@/lib/db/schema";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";

export default async function DepartmentDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const departmentId = Number(id);

  if (!Number.isFinite(departmentId)) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">معرّف غير صالح</div>
          <div className="mt-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  await ensureDepartmentsReady();
  const dept = await getDepartmentById(departmentId);

  if (!dept) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">القسم غير موجود</div>
          <div className="mt-3">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
            >
              رجوع
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              {dept.name_ar}
            </h1>
            <div className="text-sm text-slate-600 mt-1">
              {formatEnglishDepartmentName(dept.code) || dept.code}
            </div>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
          >
            رجوع للوحة الإدارة
          </Link>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.06)] p-6">
          <div className="text-sm text-slate-700 leading-relaxed">
            صفحة تفاصيل القسم جاهزة كبداية. سنضيف لاحقاً:
            <ul className="list-disc pr-6 mt-3 space-y-1 text-slate-600">
              <li>قائمة الباحثين داخل القسم</li>
              <li>تحليلات نقاط الأداء العلمي للقسم</li>
              <li>المنشورات والمؤتمرات والنشاطات المرتبطة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

