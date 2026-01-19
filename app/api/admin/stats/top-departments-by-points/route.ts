import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getTopDepartmentsByScientificPoints } from "@/lib/db/departmentsTopPoints";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const items = await getTopDepartmentsByScientificPoints(5);
    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, items: [], error: error?.message ?? "unknown" },
      { status: 200 }
    );
  }
}

