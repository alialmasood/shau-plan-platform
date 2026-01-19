import { NextResponse } from "next/server";

const ADMIN_CODE = "332211";
const ADMIN_COOKIE_NAME = "spsh_admin";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { code?: unknown };
    const code = typeof body?.code === "string" ? body.code : "";

    if (code !== ADMIN_CODE) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    const res = NextResponse.json({ ok: true }, { status: 200 });
    res.cookies.set({
      name: ADMIN_COOKIE_NAME,
      value: "1",
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return res;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}

