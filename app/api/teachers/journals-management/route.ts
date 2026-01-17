import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create journal_memberships table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS journal_memberships (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          journal_name VARCHAR(500) NOT NULL,
          role VARCHAR(100) NOT NULL,
          journal_type VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          impact_factor VARCHAR(50),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          membership_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS journal_name VARCHAR(500)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS role VARCHAR(100)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS journal_type VARCHAR(50)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS impact_factor VARCHAR(50)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS membership_document TEXT`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering journal_memberships table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating journal_memberships table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, journal_name, role, journal_type, start_date, end_date, impact_factor, description, is_active, membership_document, created_at, updated_at
      FROM journal_memberships WHERE user_id = $1 ORDER BY start_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching journal memberships:", error);
    return NextResponse.json(
      { error: "Failed to fetch journal memberships", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, journalName, role, journalType, startDate, endDate, impactFactor, description, isActive, membershipDocument } = body;

    if (!userId || !journalName || !role || !journalType || !startDate) {
      return NextResponse.json(
        { error: "userId, journalName, role, journalType, and startDate are required" },
        { status: 400 }
      );
    }

    // Create journal_memberships table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS journal_memberships (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          journal_name VARCHAR(500) NOT NULL,
          role VARCHAR(100) NOT NULL,
          journal_type VARCHAR(50) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE,
          impact_factor VARCHAR(50),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          membership_document TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS journal_name VARCHAR(500)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS role VARCHAR(100)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS journal_type VARCHAR(50)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS impact_factor VARCHAR(50)`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS membership_document TEXT`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE journal_memberships ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering journal_memberships table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating journal_memberships table:", error);
    }

    const result = await query(
      `INSERT INTO journal_memberships (
        user_id, journal_name, role, journal_type, start_date, end_date, impact_factor, description, is_active, membership_document
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        journalName,
        role,
        journalType,
        startDate || null,
        endDate || null,
        impactFactor || null,
        description || null,
        isActive !== undefined ? isActive : true,
        membershipDocument || null,
      ]
    );

    return NextResponse.json({ membership: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating journal membership:", error);
    return NextResponse.json(
      { error: "Failed to create journal membership", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, journalName, role, journalType, startDate, endDate, impactFactor, description, isActive, membershipDocument } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE journal_memberships SET
        journal_name = COALESCE($1, journal_name),
        role = COALESCE($2, role),
        journal_type = COALESCE($3, journal_type),
        start_date = COALESCE($4, start_date),
        end_date = $5,
        impact_factor = $6,
        description = $7,
        is_active = COALESCE($8, is_active),
        membership_document = $9,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *`,
      [
        journalName || null,
        role || null,
        journalType || null,
        startDate || null,
        endDate || null,
        impactFactor || null,
        description || null,
        isActive !== undefined ? isActive : null,
        membershipDocument !== undefined ? membershipDocument : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Journal membership not found" }, { status: 404 });
    }

    return NextResponse.json({ membership: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating journal membership:", error);
    return NextResponse.json(
      { error: "Failed to update journal membership", details: error.message },
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

    const result = await query(`DELETE FROM journal_memberships WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Journal membership not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Journal membership deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting journal membership:", error);
    return NextResponse.json(
      { error: "Failed to delete journal membership", details: error.message },
      { status: 500 }
    );
  }
}
