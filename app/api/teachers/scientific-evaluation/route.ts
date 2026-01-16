import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create scientific_evaluations table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS scientific_evaluations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          evaluation_title VARCHAR(500) NOT NULL,
          evaluation_type VARCHAR(100),
          evaluation_date DATE NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_title VARCHAR(500)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(100)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_date DATE`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering scientific_evaluations table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating scientific_evaluations table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, evaluation_title, evaluation_type, evaluation_date, description, status, created_at, updated_at
      FROM scientific_evaluations WHERE user_id = $1 ORDER BY evaluation_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching scientific evaluations:", error);
    return NextResponse.json(
      { error: "Failed to fetch scientific evaluations", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, evaluationTitle, evaluationType, evaluationDate, description, status } = body;

    if (!userId || !evaluationTitle || !evaluationDate || !status) {
      return NextResponse.json(
        { error: "userId, evaluationTitle, evaluationDate, and status are required" },
        { status: 400 }
      );
    }

    // Create scientific_evaluations table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS scientific_evaluations (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          evaluation_title VARCHAR(500) NOT NULL,
          evaluation_type VARCHAR(100),
          evaluation_date DATE NOT NULL,
          description TEXT,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_title VARCHAR(500)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_type VARCHAR(100)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS evaluation_date DATE`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS status VARCHAR(50)`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE scientific_evaluations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering scientific_evaluations table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating scientific_evaluations table:", error);
    }

    const result = await query(
      `INSERT INTO scientific_evaluations (
        user_id, evaluation_title, evaluation_type, evaluation_date, description, status
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        evaluationTitle,
        evaluationType || null,
        evaluationDate || null,
        description || null,
        status,
      ]
    );

    return NextResponse.json({ evaluation: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating scientific evaluation:", error);
    return NextResponse.json(
      { error: "Failed to create scientific evaluation", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, evaluationTitle, evaluationType, evaluationDate, description, status } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE scientific_evaluations SET
        evaluation_title = COALESCE($1, evaluation_title),
        evaluation_type = $2,
        evaluation_date = COALESCE($3, evaluation_date),
        description = $4,
        status = COALESCE($5, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *`,
      [
        evaluationTitle || null,
        evaluationType || null,
        evaluationDate || null,
        description || null,
        status || null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Scientific evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({ evaluation: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating scientific evaluation:", error);
    return NextResponse.json(
      { error: "Failed to update scientific evaluation", details: error.message },
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

    const result = await query(`DELETE FROM scientific_evaluations WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Scientific evaluation not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Scientific evaluation deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting scientific evaluation:", error);
    return NextResponse.json(
      { error: "Failed to delete scientific evaluation", details: error.message },
      { status: 500 }
    );
  }
}
