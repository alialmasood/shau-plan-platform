import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET - Fetch user positions
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Create positions table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS positions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          position_title VARCHAR(255) NOT NULL,
          start_date DATE,
          duration VARCHAR(100),
          organization VARCHAR(255),
          description TEXT,
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Add missing columns if table already exists (PostgreSQL 9.6+)
      const alterQueries = [
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS duration VARCHAR(100)`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS organization VARCHAR(255)`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering positions table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating positions table:", error);
    }

    // Fetch positions
    const result = await query(
      `SELECT id, position_title, start_date, duration, organization, description, assignment_document, created_at, updated_at
       FROM positions
       WHERE user_id = $1
       ORDER BY start_date DESC NULLS LAST, created_at DESC`,
      [userId]
    );

    return NextResponse.json(result.rows, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching positions:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب المناصب" },
      { status: 500 }
    );
  }
}

    // POST - Add new position
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, positionTitle, startDate, duration, organization, description, assignmentDocument } = body;

    if (!userId || !positionTitle) {
      return NextResponse.json(
        { message: "معرف المستخدم واسم المنصب مطلوبان" },
        { status: 400 }
      );
    }

    // Create positions table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS positions (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          position_title VARCHAR(255) NOT NULL,
          start_date DATE,
          duration VARCHAR(100),
          organization VARCHAR(255),
          description TEXT,
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Add missing columns if table already exists (PostgreSQL 9.6+)
      const alterQueries = [
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS duration VARCHAR(100)`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS organization VARCHAR(255)`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE positions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering positions table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating positions table:", error);
    }

    // Insert new position
    const result = await query(
      `INSERT INTO positions (user_id, position_title, start_date, duration, organization, description, assignment_document, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
       RETURNING id, position_title, start_date, duration, organization, description, assignment_document, created_at, updated_at`,
      [userId, positionTitle || null, startDate || null, duration || null, organization || null, description || null, assignmentDocument || null]
    );

    return NextResponse.json(
      {
        message: "تم إضافة المنصب بنجاح",
        position: result.rows[0],
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error adding position:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء إضافة المنصب" },
      { status: 500 }
    );
  }
}

// PATCH - Update position
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, positionTitle, startDate, duration, organization, description, assignmentDocument } = body;

    if (!id) {
      return NextResponse.json(
        { message: "معرف المنصب مطلوب" },
        { status: 400 }
      );
    }

    const result = await query(
      `UPDATE positions
       SET position_title = $1, start_date = $2, duration = $3, organization = $4, description = $5, assignment_document = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, position_title, start_date, duration, organization, description, assignment_document, created_at, updated_at`,
      [positionTitle || null, startDate || null, duration || null, organization || null, description || null, assignmentDocument || null, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "المنصب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "تم تحديث المنصب بنجاح",
        position: result.rows[0],
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating position:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تحديث المنصب" },
      { status: 500 }
    );
  }
}

// DELETE - Delete position
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { message: "معرف المنصب مطلوب" },
        { status: 400 }
      );
    }

    const result = await query(
      `DELETE FROM positions WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { message: "المنصب غير موجود" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "تم حذف المنصب بنجاح" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting position:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حذف المنصب" },
      { status: 500 }
    );
  }
}
