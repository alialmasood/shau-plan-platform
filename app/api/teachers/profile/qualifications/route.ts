import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET - Fetch user academic qualifications
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Create academic_qualifications table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS academic_qualifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          degree VARCHAR(100) NOT NULL,
          graduation_year VARCHAR(10),
          major_general VARCHAR(255),
          major_specific VARCHAR(255),
          university VARCHAR(255),
          country VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error: any) {
      console.error("Error creating academic_qualifications table:", error);
    }

    // Fetch qualifications
    const result = await query(
      `SELECT id, degree, graduation_year, major_general, major_specific, university, country
       FROM academic_qualifications
       WHERE user_id = $1
       ORDER BY created_at ASC`,
      [userId]
    );

    const qualifications = result.rows.map((row) => ({
      id: row.id,
      degree: row.degree || "",
      graduationYear: row.graduation_year || "",
      majorGeneral: row.major_general || "",
      majorSpecific: row.major_specific || "",
      university: row.university || "",
      country: row.country || "",
    }));

    return NextResponse.json(qualifications, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching qualifications:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب الشهادات العلمية" },
      { status: 500 }
    );
  }
}

// POST - Create new academic qualification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, degree, graduationYear, majorGeneral, majorSpecific, university, country } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    if (!degree) {
      return NextResponse.json(
        { message: "الدرجة العلمية مطلوبة" },
        { status: 400 }
      );
    }

    // Create academic_qualifications table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS academic_qualifications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          degree VARCHAR(100) NOT NULL,
          graduation_year VARCHAR(10),
          major_general VARCHAR(255),
          major_specific VARCHAR(255),
          university VARCHAR(255),
          country VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } catch (error: any) {
      console.error("Error creating academic_qualifications table:", error);
    }

    // Insert new qualification
    const result = await query(
      `INSERT INTO academic_qualifications (user_id, degree, graduation_year, major_general, major_specific, university, country)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, degree, graduation_year, major_general, major_specific, university, country`,
      [userId, degree, graduationYear || null, majorGeneral || null, majorSpecific || null, university || null, country || null]
    );

    return NextResponse.json(
      {
        message: "تم إضافة الشهادة العلمية بنجاح",
        qualification: {
          id: result.rows[0].id,
          degree: result.rows[0].degree,
          graduationYear: result.rows[0].graduation_year || "",
          majorGeneral: result.rows[0].major_general || "",
          majorSpecific: result.rows[0].major_specific || "",
          university: result.rows[0].university || "",
          country: result.rows[0].country || "",
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating qualification:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة الشهادة العلمية" },
      { status: 500 }
    );
  }
}

// PATCH - Update academic qualification
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, degree, graduationYear, majorGeneral, majorSpecific, university, country } = body;

    if (!id) {
      return NextResponse.json(
        { message: "معرف الشهادة العلمية مطلوب" },
        { status: 400 }
      );
    }

    if (!degree) {
      return NextResponse.json(
        { message: "الدرجة العلمية مطلوبة" },
        { status: 400 }
      );
    }

    // Update qualification
    const result = await query(
      `UPDATE academic_qualifications
       SET degree = $1, graduation_year = $2, major_general = $3, major_specific = $4, university = $5, country = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, degree, graduation_year, major_general, major_specific, university, country`,
      [degree, graduationYear || null, majorGeneral || null, majorSpecific || null, university || null, country || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "الشهادة العلمية غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "تم تحديث الشهادة العلمية بنجاح",
        qualification: {
          id: result.rows[0].id,
          degree: result.rows[0].degree,
          graduationYear: result.rows[0].graduation_year || "",
          majorGeneral: result.rows[0].major_general || "",
          majorSpecific: result.rows[0].major_specific || "",
          university: result.rows[0].university || "",
          country: result.rows[0].country || "",
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating qualification:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث الشهادة العلمية" },
      { status: 500 }
    );
  }
}

// DELETE - Delete academic qualification
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "معرف الشهادة العلمية مطلوب" },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM academic_qualifications WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "الشهادة العلمية غير موجودة" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "تم حذف الشهادة العلمية بنجاح" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting qualification:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف الشهادة العلمية" },
      { status: 500 }
    );
  }
}
