import Link from "next/link";

export default function AdminDepartmentsIndexPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8" dir="rtl">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-slate-900">
            الأقسام العلمية
          </h1>
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold"
          >
            رجوع للوحة الإدارة
          </Link>
        </div>

        <div className="mt-4 text-sm text-slate-600">
          هذه الصفحة ستكون لاحقاً لإدارة الأقسام بشكل كامل. حالياً تفاصيل القسم
          متاحة عبر الضغط على كرت القسم من لوحة الإدارة.
        </div>
      </div>
    </div>
  );
}

