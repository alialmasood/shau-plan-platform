import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET - Fetch user profile information
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Add name_ar and name_en columns if they don't exist
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
        ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
      `);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes("duplicate column")) {
        console.error("Error adding columns:", error);
      }
    }

    // Fetch user data
    const result = await query(
      `SELECT id, username, email, full_name, name_ar, name_en, role, department, phone, academic_title, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    // If name_ar or name_en is null but full_name exists, try to parse it
    if (!user.name_ar && !user.name_en && user.full_name) {
      const parts = user.full_name.split(" / ");
      if (parts.length === 2) {
        user.name_ar = parts[0].trim();
        user.name_en = parts[1].trim();
      }
    }

    return NextResponse.json(user, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب معلومات المستخدم" },
      { status: 500 }
    );
  }
}

// PATCH - Update user profile information
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, nameAr, nameEn, department, academicTitle } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Add name_ar and name_en columns if they don't exist
    try {
      await query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255),
        ADD COLUMN IF NOT EXISTS name_en VARCHAR(255);
      `);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes("duplicate column")) {
        console.error("Error adding columns:", error);
      }
    }

    // Update user information
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 1;

    if (nameAr !== undefined) {
      updateFields.push(`name_ar = $${paramIndex++}`);
      updateValues.push(nameAr || null);
    }

    if (nameEn !== undefined) {
      updateFields.push(`name_en = $${paramIndex++}`);
      updateValues.push(nameEn || null);
    }

    // Also update full_name for backward compatibility
    if (nameAr !== undefined || nameEn !== undefined) {
      const fullName = nameAr && nameEn ? `${nameAr} / ${nameEn}` : (nameAr || nameEn || null);
      updateFields.push(`full_name = $${paramIndex++}`);
      updateValues.push(fullName);
    }

    if (department !== undefined) {
      updateFields.push(`department = $${paramIndex++}`);
      updateValues.push(department || null);
    }

    if (academicTitle !== undefined) {
      updateFields.push(`academic_title = $${paramIndex++}`);
      updateValues.push(academicTitle || null);
    }

    if (updateFields.length === 0) {
      return NextResponse.json(
        { message: "لا توجد بيانات للتحديث" },
        { status: 400 }
      );
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    updateValues.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, username, email, full_name, name_ar, name_en, role, department, phone, academic_title, is_active, created_at, updated_at
    `;

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "المستخدم غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "تم تحديث المعلومات بنجاح",
        user: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user profile:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث المعلومات" },
      { status: 500 }
    );
  }
}
