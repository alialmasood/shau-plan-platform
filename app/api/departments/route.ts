import { NextResponse } from "next/server";
import { listDepartmentsWithResearchersCount } from "@/lib/db/departments";
import { ensureDepartmentsReady } from "@/lib/db/schema";

export async function GET() {
  try {
    // ضمان وجود جدول departments وتعبئته (عبر db:init أو أول طلب)
    await ensureDepartmentsReady();

    const items = await listDepartmentsWithResearchersCount();
    return NextResponse.json({ ok: true, items }, { status: 200 });
  } catch {
    return NextResponse.json(
      { ok: false, items: [] as any[] },
      { status: 500 }
    );
  }
}

