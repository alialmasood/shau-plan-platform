import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create participation_certificates table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS participation_certificates (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          certificate_subject VARCHAR(500) NOT NULL,
          granting_organization VARCHAR(500) NOT NULL,
          month VARCHAR(50),
          year INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS certificate_subject VARCHAR(500)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS granting_organization VARCHAR(500)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS month VARCHAR(50)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering participation_certificates table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating participation_certificates table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, certificate_subject, granting_organization, month, year, created_at, updated_at
      FROM participation_certificates WHERE user_id = $1 ORDER BY year DESC, month DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching participation certificates:", error);
    return NextResponse.json(
      { error: "Failed to fetch participation certificates", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, certificateSubject, grantingOrganization, month, year } = body;

    if (!userId || !certificateSubject || !grantingOrganization || !year) {
      return NextResponse.json(
        { error: "userId, certificateSubject, grantingOrganization, and year are required" },
        { status: 400 }
      );
    }

    // Create participation_certificates table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS participation_certificates (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          certificate_subject VARCHAR(500) NOT NULL,
          granting_organization VARCHAR(500) NOT NULL,
          month VARCHAR(50),
          year INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS certificate_subject VARCHAR(500)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS granting_organization VARCHAR(500)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS month VARCHAR(50)`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE participation_certificates ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering participation_certificates table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating participation_certificates table:", error);
    }

    const result = await query(
      `INSERT INTO participation_certificates (
        user_id, certificate_subject, granting_organization, month, year
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        certificateSubject,
        grantingOrganization,
        month || null,
        parseInt(year.toString()),
      ]
    );

    return NextResponse.json({ certificate: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating participation certificate:", error);
    return NextResponse.json(
      { error: "Failed to create participation certificate", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, certificateSubject, grantingOrganization, month, year } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE participation_certificates SET
        certificate_subject = COALESCE($1, certificate_subject),
        granting_organization = COALESCE($2, granting_organization),
        month = $3,
        year = COALESCE($4, year),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        certificateSubject || null,
        grantingOrganization || null,
        month || null,
        year ? parseInt(year.toString()) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Participation certificate not found" }, { status: 404 });
    }

    return NextResponse.json({ certificate: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating participation certificate:", error);
    return NextResponse.json(
      { error: "Failed to update participation certificate", details: error.message },
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

    const result = await query(`DELETE FROM participation_certificates WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Participation certificate not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Participation certificate deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting participation certificate:", error);
    return NextResponse.json(
      { error: "Failed to delete participation certificate", details: error.message },
      { status: 500 }
    );
  }
}
