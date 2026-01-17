import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create committees table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS committees (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          committee_name VARCHAR(500) NOT NULL,
          assignment_date DATE NOT NULL,
          assignment_type VARCHAR(50) NOT NULL,
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS committee_name VARCHAR(500)`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_date DATE`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50)`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering committees table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating committees table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, committee_name, assignment_date, assignment_type, assignment_document, created_at, updated_at
      FROM committees WHERE user_id = $1 ORDER BY assignment_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching committees:", error);
    return NextResponse.json(
      { error: "Failed to fetch committees", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, committeeName, assignmentDate, assignmentType, assignmentDocument } = body;

    if (!userId || !committeeName || !assignmentDate || !assignmentType) {
      return NextResponse.json(
        { error: "userId, committeeName, assignmentDate, and assignmentType are required" },
        { status: 400 }
      );
    }

    // Create committees table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS committees (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          committee_name VARCHAR(500) NOT NULL,
          assignment_date DATE NOT NULL,
          assignment_type VARCHAR(50) NOT NULL,
          assignment_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS committee_name VARCHAR(500)`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_date DATE`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50)`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE committees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering committees table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating committees table:", error);
    }

    const result = await query(
      `INSERT INTO committees (
        user_id, committee_name, assignment_date, assignment_type, assignment_document
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        committeeName,
        assignmentDate || null,
        assignmentType,
        assignmentDocument || null,
      ]
    );

    return NextResponse.json({ committee: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating committee:", error);
    return NextResponse.json(
      { error: "Failed to create committee", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, committeeName, assignmentDate, assignmentType, assignmentDocument } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE committees SET
        committee_name = COALESCE($1, committee_name),
        assignment_date = COALESCE($2, assignment_date),
        assignment_type = COALESCE($3, assignment_type),
        assignment_document = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        committeeName || null,
        assignmentDate || null,
        assignmentType || null,
        assignmentDocument !== undefined ? assignmentDocument : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ committee: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating committee:", error);
    return NextResponse.json(
      { error: "Failed to update committee", details: error.message },
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

    const result = await query(`DELETE FROM committees WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Committee not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Committee deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting committee:", error);
    return NextResponse.json(
      { error: "Failed to delete committee", details: error.message },
      { status: 500 }
    );
  }
}
