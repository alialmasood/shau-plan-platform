import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create courses table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_name VARCHAR(500) NOT NULL,
          date DATE NOT NULL,
          type VARCHAR(50) NOT NULL,
          beneficiary_organization VARCHAR(255),
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(500)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS date DATE`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS type VARCHAR(50)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS beneficiary_organization VARCHAR(255)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering courses table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating courses table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, course_name, date, type, beneficiary_organization, location, created_at, updated_at
      FROM courses WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching courses:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, courseName, date, type, beneficiaryOrganization, location } = body;

    if (!userId || !courseName || !date || !type) {
      return NextResponse.json(
        { error: "userId, courseName, date, and type are required" },
        { status: 400 }
      );
    }

    // Create courses table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS courses (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          course_name VARCHAR(500) NOT NULL,
          date DATE NOT NULL,
          type VARCHAR(50) NOT NULL,
          beneficiary_organization VARCHAR(255),
          location VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_name VARCHAR(500)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS date DATE`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS type VARCHAR(50)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS beneficiary_organization VARCHAR(255)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering courses table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating courses table:", error);
    }

    const result = await query(
      `INSERT INTO courses (
        user_id, course_name, date, type, beneficiary_organization, location
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        courseName,
        date || null,
        type,
        beneficiaryOrganization || null,
        location || null,
      ]
    );

    return NextResponse.json({ course: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, courseName, date, type, beneficiaryOrganization, location } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE courses SET
        course_name = COALESCE($1, course_name),
        date = COALESCE($2, date),
        type = COALESCE($3, type),
        beneficiary_organization = $4,
        location = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [
        courseName || null,
        date || null,
        type || null,
        beneficiaryOrganization || null,
        location || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ course: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating course:", error);
    return NextResponse.json(
      { error: "Failed to update course", details: error.message },
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

    const result = await query(`DELETE FROM courses WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting course:", error);
    return NextResponse.json(
      { error: "Failed to delete course", details: error.message },
      { status: 500 }
    );
  }
}
