import Link from "next/link";
import { cookies } from "next/headers";
import { query } from "@/lib/db/query";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";
import { formatDateEnglishDigits } from "@/lib/utils/numberFormat";

const ADMIN_COOKIE_NAME = "spsh_admin";

export default async function ActivityDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">غير مصرح</div>
          <Link href="/admin" className="mt-4 inline-block px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  const logId = Number(params.id);
  if (!Number.isFinite(logId)) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">معرّف غير صالح</div>
          <Link href="/admin" className="mt-4 inline-block px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  const res = await query(
    `
      SELECT
        l.id,
        l.created_at,
        l.actor_type,
        l.actor_user_id,
        COALESCE(u.full_name, u.username, '—') AS actor_name,
        COALESCE(l.department_code, u.department) AS department_code,
        d.id AS department_id,
        d.name_ar AS department_name_ar,
        l.action_type,
        l.entity_type,
        l.entity_id,
        l.status
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.actor_user_id
      LEFT JOIN departments d ON d.code = COALESCE(l.department_code, u.department)
      WHERE l.id = $1
      LIMIT 1;
    `,
    [logId]
  );

  const row = res.rows?.[0] as any;
  if (!row) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
        <div className="max-w-5xl mx-auto">
          <div className="text-slate-900 font-extrabold">السجل غير موجود</div>
          <Link href="/admin" className="mt-4 inline-block px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold">
            رجوع
          </Link>
        </div>
      </div>
    );
  }

  const actorType = String(row.actor_type ?? "researcher");
  const actorLabel = actorType === "department" ? "قسم" : actorType === "admin" ? "إدارة" : "باحث";
  const actorName = actorType === "department" ? String(row.department_name_ar ?? "—") : String(row.actor_name ?? "—");

  const departmentCode = row.department_code ? String(row.department_code) : null;
  const departmentNameAr = row.department_name_ar ? String(row.department_name_ar) : null;
  const departmentId = row.department_id !== null && row.department_id !== undefined ? Number(row.department_id) : null;

  const createdAt = row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString();
  const entityType = String(row.entity_type ?? "");
  const entityId = row.entity_id !== null && row.entity_id !== undefined ? Number(row.entity_id) : null;

  const entityLink =
    entityType === "department" && departmentId
      ? `/admin/departments/${departmentId}`
      : entityType === "researcher" && row.actor_user_id
        ? `/admin/researchers/${Number(row.actor_user_id)}`
        : null;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">تفاصيل التحديث</h1>
            <div className="text-sm text-slate-600 mt-1">
              {formatDateEnglishDigits(createdAt)}
            </div>
          </div>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
          >
            رجوع للوحة الإدارة
          </Link>
        </div>

        <div className="mt-6 bg-white rounded-2xl border border-slate-200/70 shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.06)] p-6 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">الفاعل</div>
            <div className="text-sm font-extrabold text-slate-900">{actorName}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">نوع الفاعل</div>
            <div className="text-sm font-extrabold text-slate-900">{actorLabel}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">النشاط</div>
            <div className="text-sm font-extrabold text-slate-900">{String(row.action_type ?? "")}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">الحالة</div>
            <div className="text-sm font-extrabold text-slate-900">{String(row.status ?? "")}</div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">القسم</div>
            <div className="text-sm font-extrabold text-slate-900">
              {departmentNameAr ||
                (departmentCode ? formatEnglishDepartmentName(departmentCode) || departmentCode : "—")}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-bold text-slate-600">الكيان</div>
            <div className="text-sm font-extrabold text-slate-900">
              {entityType} {entityId ? `#${entityId}` : ""}
            </div>
          </div>

          {entityLink ? (
            <div className="pt-3">
              <Link
                href={entityLink}
                className="inline-flex items-center justify-center rounded-xl px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold"
              >
                فتح الصفحة المرتبطة
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

