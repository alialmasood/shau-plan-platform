import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSystemSummary } from "@/lib/db/systemSummary";

const ADMIN_COOKIE_NAME = "spsh_admin";

function csvEscape(value: string) {
  const v = value.replace(/"/g, '""');
  return `"${v}"`;
}

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";

  try {
    const summary = await getSystemSummary();

    if (format === "csv") {
      const rows: Array<[string, string, string]> = [];
      rows.push(["الفئة", "المؤشر", "العدد"]);

      // Research tab
      rows.push(["البحوث", "إجمالي البحوث", String(summary.research.total)]);
      rows.push(["البحوث", "البحوث المخططة", String(summary.research.planned)]);
      rows.push(["البحوث", "البحوث المنجزة", String(summary.research.completed)]);
      rows.push(["البحوث", "البحوث المنشورة", String(summary.research.published)]);
      rows.push(["البحوث", "البحوث غير المنجزة", String(summary.research.notCompleted)]);
      rows.push(["البحوث", "البحوث العالمية", String(summary.research.global)]);
      rows.push(["البحوث", "البحوث المحلية", String(summary.research.local)]);
      rows.push(["البحوث", "البحوث المفردة", String(summary.research.single)]);
      rows.push(["البحوث", "ثومبسون رويتر", String(summary.research.thomsonReuters)]);
      rows.push(["البحوث", "سكوبس", String(summary.research.scopus)]);

      // Activities tab
      rows.push(["النشاطات", "المؤتمرات", String(summary.activities.conferences)]);
      rows.push(["النشاطات", "الندوات", String(summary.activities.seminars)]);
      rows.push(["النشاطات", "الدورات", String(summary.activities.courses)]);
      rows.push(["النشاطات", "ورش العمل", String(summary.activities.workshops)]);
      rows.push(["النشاطات", "التكليفات", String(summary.activities.assignments)]);
      rows.push(["النشاطات", "كتب الشكر", String(summary.activities.thankYouBooks)]);
      rows.push(["النشاطات", "اللجان", String(summary.activities.committees)]);
      rows.push(["النشاطات", "شهادات المشاركة", String(summary.activities.participationCertificates)]);
      rows.push(["النشاطات", "إدارة المجلات", String(summary.activities.journalMemberships)]);
      rows.push(["النشاطات", "الإشراف على الطلبة", String(summary.activities.supervision)]);
      rows.push(["النشاطات", "المناصب", String(summary.activities.positions)]);
      rows.push(["النشاطات", "التقويم العلمي", String(summary.activities.scientificEvaluations)]);
      rows.push(["النشاطات", "الأعمال الطوعية", String(summary.activities.volunteerWork)]);

      const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
      const bom = "\uFEFF";

      return new NextResponse(bom + csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="system_summary_${new Date()
            .toISOString()
            .slice(0, 10)}.csv"`,
        },
      });
    }

    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, summary: null, error: error?.message ?? "unknown" },
      { status: 200 }
    );
  }
}

