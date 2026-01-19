import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { listValidResearcherUserIds } from "@/lib/db/stats";
import { calculateScientificPointsForUser } from "@/lib/services/scientificPoints";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function GET() {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json(
      { ok: false, average: 0, max: 0, researchersCount: 0 },
      { status: 401 }
    );
  }

  try {
    const ids = await listValidResearcherUserIds();
    if (ids.length === 0) {
      return NextResponse.json(
        { ok: true, average: 0, max: 0, researchersCount: 0 },
        { status: 200 }
      );
    }

    // حساب نقاط كل باحث بنفس منطق /teachers/evaluation عبر /api/teachers/points
    const pointsList = await Promise.all(
      ids.map(async (id) => {
        try {
          return await calculateScientificPointsForUser(id);
        } catch {
          return 0;
        }
      })
    );

    const sum = pointsList.reduce((a, b) => a + b, 0);
    const max = pointsList.reduce((m, v) => (v > m ? v : m), 0);
    const average = ids.length > 0 ? sum / ids.length : 0;

    return NextResponse.json(
      {
        ok: true,
        average,
        max,
        researchersCount: ids.length,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { ok: false, average: 0, max: 0, researchersCount: 0 },
      { status: 200 }
    );
  }
}

