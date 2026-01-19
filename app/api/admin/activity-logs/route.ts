import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listRecentActivityLogsFiltered } from "@/lib/db/activityLogs";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? 15);
  const type = String(url.searchParams.get("type") ?? "all").toLowerCase();
  const status = String(url.searchParams.get("status") ?? "الكل");
  const q = url.searchParams.get("q");

  const typeToEntityTypes: Record<string, string[] | null> = {
    all: null,
    research: ["research"],
    conference: ["conference"],
    course: ["course"],
    workshop: ["workshop"],
    seminar: ["seminar"],
    committee: ["committee"],
    reports: ["scientific_evaluation", "report"],
  };

  try {
    const entityTypes = typeToEntityTypes[type] ?? null;
    const logs = await listRecentActivityLogsFiltered({
      limit,
      entityTypes: entityTypes ?? undefined,
      status: status as any,
      search: q,
    });

    const rows = logs.map((l) => {
      const actorTypeLabel =
        l.actorType === "department" ? "قسم" : l.actorType === "admin" ? "إدارة" : "باحث";

      const actorName =
        l.actorType === "department"
          ? l.departmentNameAr || "—"
          : l.actorName;

      const status = l.status;
      const actionLabel = status === "بانتظار التدقيق" ? "مراجعة" : status === "مكتمل" ? "عرض" : "تفاصيل";

      return {
        id: String(l.id),
        date: l.createdAt,
        actorName,
        actorType: actorTypeLabel as "باحث" | "قسم",
        activityType: l.actionType,
        status,
        actionLabel,
        actionHref: `/admin/activity/${l.id}`,
        entityType: l.entityType,
      };
    });

    return NextResponse.json({ ok: true, rows }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, rows: [], error: error?.message ?? "unknown" },
      { status: 200 }
    );
  }
}

