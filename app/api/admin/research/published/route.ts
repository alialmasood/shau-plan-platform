import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db/query";

const ADMIN_COOKIE_NAME = "spsh_admin";

function isPublishedSql() {
  // نفس منطق KPI الحالي (مطابق /teachers/research)
  return `
    COALESCE(NULLIF(btrim(is_published::text), ''), 'false')
      IN ('true','t','1','yes','y')
  `;
}

export async function POST() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const exists = await query(
      `SELECT to_regclass('public.research') IS NOT NULL AS exists;`
    );
    if (!exists.rows?.[0]?.exists) {
      return NextResponse.json({ ok: true, deleted: 0 }, { status: 200 });
    }

    const res = await query(
      `
        DELETE FROM research
        WHERE ${isPublishedSql()}
        RETURNING id;
      `
    );

    return NextResponse.json(
      { ok: true, deleted: res.rowCount ?? 0 },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, deleted: 0, error: error?.message ?? "unknown" },
      { status: 500 }
    );
  }
}

