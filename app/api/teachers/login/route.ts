import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/db/auth";
import { query } from "@/lib/db/query";
import crypto from "crypto";

// Generate session token
function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Create session in database
async function createSession(userId: number, token: string, request: NextRequest) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  await query(
    `INSERT INTO sessions (user_id, session_token, expires_at, ip_address, user_agent)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, token, expiresAt, ipAddress, userAgent]
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, rememberMe } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { message: "البريد الإلكتروني وكلمة المرور مطلوبان" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!email.toLowerCase().endsWith("@shau.edu.iq")) {
      return NextResponse.json(
        { message: "يجب أن يكون البريد الإلكتروني بالامتداد @shau.edu.iq" },
        { status: 400 }
      );
    }

    // Authenticate user
    const user = await authenticateUser(email, password);

    if (!user) {
      return NextResponse.json(
        { message: "البريد الإلكتروني أو كلمة المرور غير صحيحة" },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.is_active) {
      return NextResponse.json(
        { message: "حسابك غير مفعّل. يرجى التواصل مع الإدارة." },
        { status: 403 }
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    await createSession(user.id, sessionToken, request);

    // Prepare response with user data (without password)
    const { password_hash: _, ...userWithoutPassword } = user as any;

    // Create response with cookie
    const response = NextResponse.json(
      {
        message: "تم تسجيل الدخول بنجاح",
        user: userWithoutPassword,
      },
      { status: 200 }
    );

    // Set session cookie
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: rememberMe ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // 7 days or 1 day
      path: "/",
    };

    response.cookies.set("session_token", sessionToken, cookieOptions);

    return response;
  } catch (error: any) {
    console.error("Login error:", error);

    return NextResponse.json(
      { message: "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
