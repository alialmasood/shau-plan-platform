import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getPublishedResearchPapersCount } from "@/lib/db/stats";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ ok: false, count: 0 }, { status: 401 });
  }

  try {
    const count = await getPublishedResearchPapersCount();
    return NextResponse.json({ ok: true, count }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, count: 0 }, { status: 200 });
  }
}

