import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create assignments table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assignment_subject VARCHAR(500) NOT NULL,
          assignment_date DATE NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          completion_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_subject VARCHAR(500)`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_date DATE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completion_date DATE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering assignments table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating assignments table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id,
        COALESCE(assignment_subject, subject) AS assignment_subject,
        assignment_date, is_completed, completion_date, created_at, updated_at
      FROM assignments WHERE user_id = $1 ORDER BY assignment_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, assignmentSubject, assignmentDate, isCompleted, completionDate } = body;

    if (!userId || !assignmentSubject || !assignmentDate) {
      return NextResponse.json(
        { error: "userId, assignmentSubject, and assignmentDate are required" },
        { status: 400 }
      );
    }

    // Create assignments table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS assignments (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          assignment_subject VARCHAR(500) NOT NULL,
          assignment_date DATE NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          completion_date DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_subject VARCHAR(500)`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS assignment_date DATE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS completion_date DATE`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE assignments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering assignments table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating assignments table:", error);
    }

    // Try to insert with subject first (old schema), if column doesn't exist, try with assignment_subject
    let result;
    try {
      result = await query(
        `INSERT INTO assignments (
          user_id, subject, assignment_date, is_completed, completion_date
        ) VALUES ($1, $2, $3, $4, $5)
        RETURNING *`,
        [
          parseInt(userId.toString()),
          assignmentSubject,
          assignmentDate || null,
          isCompleted || false,
          completionDate || null,
        ]
      );
      // Map subject to assignment_subject for consistency
      if (result.rows[0] && result.rows[0].subject) {
        result.rows[0].assignment_subject = result.rows[0].subject;
      }
    } catch (error: any) {
      // If subject doesn't exist, try with assignment_subject (new schema)
      if (error.message && (error.message.includes("subject") || error.message.includes("column"))) {
        result = await query(
          `INSERT INTO assignments (
            user_id, assignment_subject, assignment_date, is_completed, completion_date
          ) VALUES ($1, $2, $3, $4, $5)
          RETURNING *`,
          [
            parseInt(userId.toString()),
            assignmentSubject,
            assignmentDate || null,
            isCompleted || false,
            completionDate || null,
          ]
        );
      } else {
        throw error;
      }
    }

    if (!result || !result.rows || result.rows.length === 0) {
      return NextResponse.json(
        { error: "Failed to create assignment", details: "No data returned from database" },
        { status: 500 }
      );
    }

    return NextResponse.json({ assignment: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating assignment:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Failed to create assignment", details: error.message || "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, assignmentSubject, assignmentDate, isCompleted, completionDate } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Try to update subject first (old schema), if column doesn't exist, try with assignment_subject
    let result;
    try {
      result = await query(
        `UPDATE assignments SET
          subject = COALESCE($1, subject),
          assignment_date = COALESCE($2, assignment_date),
          is_completed = COALESCE($3, is_completed),
          completion_date = $4,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *`,
        [
          assignmentSubject || null,
          assignmentDate || null,
          isCompleted !== undefined ? isCompleted : null,
          completionDate || null,
          id,
        ]
      );
      // Map subject to assignment_subject for consistency
      if (result.rows[0] && result.rows[0].subject) {
        result.rows[0].assignment_subject = result.rows[0].subject;
      }
    } catch (error: any) {
      // If subject doesn't exist, try with assignment_subject (new schema)
      if (error.message && (error.message.includes("subject") || error.message.includes("column"))) {
        result = await query(
          `UPDATE assignments SET
            assignment_subject = COALESCE($1, assignment_subject),
            assignment_date = COALESCE($2, assignment_date),
            is_completed = COALESCE($3, is_completed),
            completion_date = $4,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $5
          RETURNING *`,
          [
            assignmentSubject || null,
            assignmentDate || null,
            isCompleted !== undefined ? isCompleted : null,
            completionDate || null,
            id,
          ]
        );
      } else {
        throw error;
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ assignment: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating assignment:", error);
    return NextResponse.json(
      { error: "Failed to update assignment", details: error.message },
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

    const result = await query(`DELETE FROM assignments WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Failed to delete assignment", details: error.message },
      { status: 500 }
    );
  }
}
