import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create supervision table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS supervision (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          student_name VARCHAR(500) NOT NULL,
          degree_type VARCHAR(50) NOT NULL,
          thesis_title VARCHAR(1000),
          start_date DATE NOT NULL,
          end_date DATE,
          is_completed BOOLEAN DEFAULT FALSE,
          supervision_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS student_name VARCHAR(500)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS degree_type VARCHAR(50)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS thesis_title VARCHAR(1000)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS supervision_type VARCHAR(50)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering supervision table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating supervision table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, student_name, degree_type, thesis_title, start_date, end_date, is_completed, supervision_type, created_at, updated_at
      FROM supervision WHERE user_id = $1 ORDER BY start_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching supervision:", error);
    return NextResponse.json(
      { error: "Failed to fetch supervision", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, studentName, degreeType, thesisTitle, startDate, endDate, isCompleted, supervisionType } = body;

    if (!userId || !studentName || !degreeType || !startDate) {
      return NextResponse.json(
        { error: "userId, studentName, degreeType, and startDate are required" },
        { status: 400 }
      );
    }

    // Create supervision table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS supervision (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          student_name VARCHAR(500) NOT NULL,
          degree_type VARCHAR(50) NOT NULL,
          thesis_title VARCHAR(1000),
          start_date DATE NOT NULL,
          end_date DATE,
          is_completed BOOLEAN DEFAULT FALSE,
          supervision_type VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS student_name VARCHAR(500)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS degree_type VARCHAR(50)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS thesis_title VARCHAR(1000)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS supervision_type VARCHAR(50)`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE supervision ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering supervision table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating supervision table:", error);
    }

    const result = await query(
      `INSERT INTO supervision (
        user_id, student_name, degree_type, thesis_title, start_date, end_date, is_completed, supervision_type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        studentName,
        degreeType,
        thesisTitle || null,
        startDate || null,
        endDate || null,
        isCompleted || false,
        supervisionType || null,
      ]
    );

    return NextResponse.json({ supervision: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating supervision:", error);
    return NextResponse.json(
      { error: "Failed to create supervision", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, studentName, degreeType, thesisTitle, startDate, endDate, isCompleted, supervisionType } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE supervision SET
        student_name = COALESCE($1, student_name),
        degree_type = COALESCE($2, degree_type),
        thesis_title = $3,
        start_date = COALESCE($4, start_date),
        end_date = $5,
        is_completed = COALESCE($6, is_completed),
        supervision_type = $7,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $8
      RETURNING *`,
      [
        studentName || null,
        degreeType || null,
        thesisTitle || null,
        startDate || null,
        endDate || null,
        isCompleted !== undefined ? isCompleted : null,
        supervisionType || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Supervision not found" }, { status: 404 });
    }

    return NextResponse.json({ supervision: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating supervision:", error);
    return NextResponse.json(
      { error: "Failed to update supervision", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(`DELETE FROM supervision WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Supervision not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Supervision deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting supervision:", error);
    return NextResponse.json(
      { error: "Failed to delete supervision", details: error.message },
      { status: 500 }
    );
  }
}
