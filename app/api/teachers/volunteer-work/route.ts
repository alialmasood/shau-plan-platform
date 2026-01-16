import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create volunteer_work table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS volunteer_work (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_title VARCHAR(500) NOT NULL,
          work_type VARCHAR(200) NOT NULL,
          role VARCHAR(50) NOT NULL,
          organizing_organization VARCHAR(500),
          start_date DATE NOT NULL,
          end_date DATE,
          duration VARCHAR(100),
          location VARCHAR(255),
          beneficiaries TEXT,
          certificates_documents TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS work_title VARCHAR(500)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS work_type VARCHAR(200)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS role VARCHAR(50)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS organizing_organization VARCHAR(500)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS duration VARCHAR(100)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS beneficiaries TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS certificates_documents TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering volunteer_work table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating volunteer_work table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, work_title, work_type, role, organizing_organization, start_date, end_date, 
        duration, location, beneficiaries, certificates_documents, description, is_active, created_at, updated_at
      FROM volunteer_work WHERE user_id = $1 ORDER BY start_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching volunteer work:", error);
    return NextResponse.json(
      { error: "Failed to fetch volunteer work", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      userId, workTitle, workType, role, organizingOrganization, startDate, endDate, 
      duration, location, beneficiaries, certificatesDocuments, description, isActive 
    } = body;

    if (!userId || !workTitle || !workType || !role || !startDate) {
      return NextResponse.json(
        { error: "userId, workTitle, workType, role, and startDate are required" },
        { status: 400 }
      );
    }

    // Create volunteer_work table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS volunteer_work (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          work_title VARCHAR(500) NOT NULL,
          work_type VARCHAR(200) NOT NULL,
          role VARCHAR(50) NOT NULL,
          organizing_organization VARCHAR(500),
          start_date DATE NOT NULL,
          end_date DATE,
          duration VARCHAR(100),
          location VARCHAR(255),
          beneficiaries TEXT,
          certificates_documents TEXT,
          description TEXT,
          is_active BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS work_title VARCHAR(500)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS work_type VARCHAR(200)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS role VARCHAR(50)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS organizing_organization VARCHAR(500)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS start_date DATE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS end_date DATE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS duration VARCHAR(100)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS beneficiaries TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS certificates_documents TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE volunteer_work ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering volunteer_work table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating volunteer_work table:", error);
    }

    const result = await query(
      `INSERT INTO volunteer_work (
        user_id, work_title, work_type, role, organizing_organization, start_date, end_date, 
        duration, location, beneficiaries, certificates_documents, description, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        workTitle,
        workType,
        role,
        organizingOrganization || null,
        startDate || null,
        endDate || null,
        duration || null,
        location || null,
        beneficiaries || null,
        certificatesDocuments || null,
        description || null,
        isActive !== undefined ? isActive : false,
      ]
    );

    return NextResponse.json({ volunteerWork: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating volunteer work:", error);
    return NextResponse.json(
      { error: "Failed to create volunteer work", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, workTitle, workType, role, organizingOrganization, startDate, endDate, 
      duration, location, beneficiaries, certificatesDocuments, description, isActive 
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE volunteer_work SET
        work_title = COALESCE($1, work_title),
        work_type = COALESCE($2, work_type),
        role = COALESCE($3, role),
        organizing_organization = $4,
        start_date = COALESCE($5, start_date),
        end_date = $6,
        duration = $7,
        location = $8,
        beneficiaries = $9,
        certificates_documents = $10,
        description = $11,
        is_active = COALESCE($12, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *`,
      [
        workTitle || null,
        workType || null,
        role || null,
        organizingOrganization || null,
        startDate || null,
        endDate || null,
        duration || null,
        location || null,
        beneficiaries || null,
        certificatesDocuments || null,
        description || null,
        isActive !== undefined ? isActive : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Volunteer work not found" }, { status: 404 });
    }

    return NextResponse.json({ volunteerWork: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating volunteer work:", error);
    return NextResponse.json(
      { error: "Failed to update volunteer work", details: error.message },
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

    const result = await query(`DELETE FROM volunteer_work WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Volunteer work not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Volunteer work deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting volunteer work:", error);
    return NextResponse.json(
      { error: "Failed to delete volunteer work", details: error.message },
      { status: 500 }
    );
  }
}
