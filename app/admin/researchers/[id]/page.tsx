import Link from "next/link";
import { getUserById } from "@/lib/db/auth";
import { query } from "@/lib/db/query";
import { calculateScientificPointsForUser } from "@/lib/services/scientificPoints";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";
import { formatNumber } from "@/lib/utils/numberFormat";

export default async function ResearcherDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const userId = Number(params.id);
  if (!Number.isFinite(userId)) {
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

  const user = await getUserById(userId);
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">الباحث غير موجود</div>
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

  const deptCode = user.department ? String(user.department) : null;
  const dept = deptCode
    ? await query(
        `
          SELECT id, name_ar
          FROM departments
          WHERE code = $1
          LIMIT 1;
        `,
        [deptCode]
      ).catch(() => ({ rows: [] as any[] }))
    : { rows: [] as any[] };

  const deptRow = (dept.rows?.[0] as any) ?? null;
  const deptNameAr = deptRow?.name_ar ? String(deptRow.name_ar) : null;

  const points = await calculateScientificPointsForUser(userId).catch(() => 0);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold text-slate-900 truncate">
              {user.full_name || user.username}
            </h1>
            <div className="text-sm text-slate-600 mt-1">
              {deptNameAr
                ? deptNameAr
                : deptCode
                  ? formatEnglishDepartmentName(deptCode) || deptCode
                  : "بدون قسم"}
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-xs font-bold text-slate-500">نقاط الأداء العلمي</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {formatNumber(points)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-xs font-bold text-slate-500">المعرّف</div>
              <div className="mt-2 text-2xl font-extrabold text-slate-900">
                {formatNumber(user.id)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
              <div className="text-xs font-bold text-slate-500">الدور</div>
              <div className="mt-2 text-sm font-extrabold text-slate-900">
                {user.role || "—"}
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-600">
            صفحة تفاصيل الباحث جاهزة كبداية. لاحقاً سنضيف: ملف الباحث، نشاطاته، بحوثه، وتقارير النقاط.
          </div>
        </div>
      </div>
    </div>
  );
}

