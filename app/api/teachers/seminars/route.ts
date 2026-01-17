import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create seminars table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS seminars (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seminar_title VARCHAR(500) NOT NULL,
          date DATE NOT NULL,
          type VARCHAR(50) NOT NULL,
          beneficiary_organization VARCHAR(255),
          location VARCHAR(255),
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS seminar_title VARCHAR(500)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS date DATE`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS type VARCHAR(50)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS beneficiary_organization VARCHAR(255)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering seminars table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating seminars table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, seminar_title, date, type, beneficiary_organization, location, assignment_document, created_at, updated_at
      FROM seminars WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching seminars:", error);
    return NextResponse.json(
      { error: "Failed to fetch seminars", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, seminarTitle, date, type, beneficiaryOrganization, location, assignmentDocument } = body;

    if (!userId || !seminarTitle || !date || !type) {
      return NextResponse.json(
        { error: "userId, seminarTitle, date, and type are required" },
        { status: 400 }
      );
    }

    // Create seminars table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS seminars (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          seminar_title VARCHAR(500) NOT NULL,
          date DATE NOT NULL,
          type VARCHAR(50) NOT NULL,
          beneficiary_organization VARCHAR(255),
          location VARCHAR(255),
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS seminar_title VARCHAR(500)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS date DATE`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS type VARCHAR(50)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS beneficiary_organization VARCHAR(255)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE seminars ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering seminars table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating seminars table:", error);
    }

    const result = await query(
      `INSERT INTO seminars (
        user_id, seminar_title, date, type, beneficiary_organization, location, assignment_document
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        seminarTitle,
        date || null,
        type,
        beneficiaryOrganization || null,
        location || null,
        assignmentDocument || null,
      ]
    );

    return NextResponse.json({ seminar: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating seminar:", error);
    return NextResponse.json(
      { error: "Failed to create seminar", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, seminarTitle, date, type, beneficiaryOrganization, location, assignmentDocument } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE seminars SET
        seminar_title = COALESCE($1, seminar_title),
        date = COALESCE($2, date),
        type = COALESCE($3, type),
        beneficiary_organization = $4,
        location = $5,
        assignment_document = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *`,
      [
        seminarTitle || null,
        date || null,
        type || null,
        beneficiaryOrganization || null,
        location || null,
        assignmentDocument !== undefined ? assignmentDocument : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    return NextResponse.json({ seminar: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating seminar:", error);
    return NextResponse.json(
      { error: "Failed to update seminar", details: error.message },
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

    const result = await query(`DELETE FROM seminars WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Seminar not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Seminar deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting seminar:", error);
    return NextResponse.json(
      { error: "Failed to delete seminar", details: error.message },
      { status: 500 }
    );
  }
}
