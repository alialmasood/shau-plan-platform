import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create thank_you_books table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS thank_you_books (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          granting_organization VARCHAR(500) NOT NULL,
          thank_you_direction VARCHAR(500),
          month VARCHAR(50),
          year INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS granting_organization VARCHAR(500)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS thank_you_direction VARCHAR(500)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS month VARCHAR(50)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering thank_you_books table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating thank_you_books table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, granting_organization, thank_you_direction, month, year, created_at, updated_at
      FROM thank_you_books WHERE user_id = $1 ORDER BY year DESC, month DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching thank you books:", error);
    return NextResponse.json(
      { error: "Failed to fetch thank you books", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, grantingOrganization, thankYouDirection, month, year } = body;

    if (!userId || !grantingOrganization || !year) {
      return NextResponse.json(
        { error: "userId, grantingOrganization, and year are required" },
        { status: 400 }
      );
    }

    // Create thank_you_books table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS thank_you_books (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          granting_organization VARCHAR(500) NOT NULL,
          thank_you_direction VARCHAR(500),
          month VARCHAR(50),
          year INTEGER NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS granting_organization VARCHAR(500)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS thank_you_direction VARCHAR(500)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS month VARCHAR(50)`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE thank_you_books ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering thank_you_books table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating thank_you_books table:", error);
    }

    const result = await query(
      `INSERT INTO thank_you_books (
        user_id, granting_organization, thank_you_direction, month, year
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        grantingOrganization,
        thankYouDirection || null,
        month || null,
        parseInt(year.toString()),
      ]
    );

    return NextResponse.json({ thankYouBook: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating thank you book:", error);
    return NextResponse.json(
      { error: "Failed to create thank you book", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, grantingOrganization, thankYouDirection, month, year } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE thank_you_books SET
        granting_organization = COALESCE($1, granting_organization),
        thank_you_direction = $2,
        month = $3,
        year = COALESCE($4, year),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *`,
      [
        grantingOrganization || null,
        thankYouDirection || null,
        month || null,
        year ? parseInt(year.toString()) : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Thank you book not found" }, { status: 404 });
    }

    return NextResponse.json({ thankYouBook: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating thank you book:", error);
    return NextResponse.json(
      { error: "Failed to update thank you book", details: error.message },
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

    const result = await query(`DELETE FROM thank_you_books WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Thank you book not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Thank you book deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting thank you book:", error);
    return NextResponse.json(
      { error: "Failed to delete thank you book", details: error.message },
      { status: 500 }
    );
  }
}
