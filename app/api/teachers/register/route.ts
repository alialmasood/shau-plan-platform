import { NextRequest, NextResponse } from "next/server";
import { createUser } from "@/lib/db/auth";
import { query } from "@/lib/db/query";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      nameArabic,
      nameEnglish,
      phone,
      academicTitle,
      department,
    } = body;

    // Validate required fields
    if (!email || !password || !nameArabic || !nameEnglish || !phone || !academicTitle || !department) {
      return NextResponse.json(
        { message: "جميع الحقول مطلوبة" },
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

    // Check if user already exists
    const existingUser = await query(
      "SELECT id FROM users WHERE email = $1 OR username = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      );
    }

    // Create user account - active immediately for authentication
    const username = email.split("@")[0]; // Use email prefix as username
    
    // Check if we need to add phone and academic_title columns
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS academic_title VARCHAR(50);
      `);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes("duplicate column")) {
        console.error("Error adding columns:", error);
      }
    }

    const user = await createUser(username, password, {
      email,
      full_name: `${nameArabic} / ${nameEnglish}`,
      role: "teacher",
      department,
    });

    // Update user with additional information and activate immediately
    await query(
      `UPDATE users 
       SET 
         full_name = $1,
         role = $2,
         department = $3,
         phone = $4,
         academic_title = $5,
         is_active = true
       WHERE id = $6`,
      [
        `${nameArabic} / ${nameEnglish}`,
        "teacher", // Keep role as teacher
        department,
        phone,
        academicTitle,
        user.id,
      ]
    );

    // Fetch the complete user data
    const updatedUser = await query(
      `SELECT id, username, email, full_name, role, department, phone, academic_title, is_active, created_at
       FROM users WHERE id = $1`,
      [user.id]
    );

    return NextResponse.json(
      {
        message: "تم إنشاء الحساب بنجاح. يمكنك تسجيل الدخول الآن.",
        userId: user.id,
        user: updatedUser.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Registration error:", error);
    
    if (error.message.includes("already exists")) {
      return NextResponse.json(
        { message: "البريد الإلكتروني مسجل مسبقاً" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى." },
      { status: 500 }
    );
  }
}
