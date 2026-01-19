import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getResearchQuartilesDistribution } from "@/lib/db/stats";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const dist = await getResearchQuartilesDistribution();
    return NextResponse.json({ ok: true, ...dist }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        total: 0,
        q1: 0,
        q2: 0,
        q3: 0,
        q4: 0,
        unindexed: 0,
        error: error?.message ?? "unknown",
      },
      { status: 200 }
    );
  }
}

