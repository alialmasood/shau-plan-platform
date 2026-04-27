import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db/query";

const ADMIN_COOKIE_NAME = "spsh_admin";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";
  if (!isAuthed) {
    return NextResponse.json({ ok: false, error: "غير مصرح" }, { status: 401 });
  }

  const { id } = await params;
  const userId = Number(id);
  if (!Number.isInteger(userId) || userId <= 0) {
    return NextResponse.json({ ok: false, error: "معرّف غير صالح" }, { status: 400 });
  }

  try {
    const existing = await query(
      `
        SELECT id, full_name, username, role
        FROM users
        WHERE id = $1
        LIMIT 1;
      `,
      [userId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ ok: false, error: "الحساب غير موجود" }, { status: 404 });
    }

    const row = existing.rows[0] as {
      id: number;
      full_name: string | null;
      username: string;
      role: string | null;
    };

    if (String(row.role || "").toLowerCase() !== "teacher") {
      return NextResponse.json(
        { ok: false, error: "لا يمكن حذف هذا النوع من الحسابات من هذه الصفحة" },
        { status: 400 }
      );
    }

    await query(`DELETE FROM users WHERE id = $1`, [userId]);

    return NextResponse.json({
      ok: true,
      message: "تم حذف حساب التدريسي بنجاح",
      deletedUser: {
        id: row.id,
        fullName: row.full_name || row.username,
      },
    });
  } catch (error: any) {
    console.error("Delete researcher error:", error);
    return NextResponse.json(
      { ok: false, error: "تعذر حذف الحساب حالياً", details: error?.message || null },
      { status: 500 }
    );
  }
}
