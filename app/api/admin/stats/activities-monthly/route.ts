import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getActivitiesMonthlyStacked } from "@/lib/db/activitiesMonthly";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET(req: Request) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) return NextResponse.json({ ok: false }, { status: 401 });

  const url = new URL(req.url);
  const monthsRaw = url.searchParams.get("months") || "6";
  const monthsNum = Number(monthsRaw);
  const months = monthsNum === 12 ? 12 : 6;

  try {
    const data = await getActivitiesMonthlyStacked({ months });
    return NextResponse.json({ ok: true, months, ...data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        ok: false,
        months,
        labels: Array.from({ length: months }, () => ""),
        series: [],
        error: error?.message ?? "unknown",
      },
      { status: 200 }
    );
  }
}

