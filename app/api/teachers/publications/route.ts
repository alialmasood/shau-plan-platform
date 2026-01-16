import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create publications table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS publications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          author_name VARCHAR(255),
          language VARCHAR(50),
          publication_type VARCHAR(50),
          publisher VARCHAR(255),
          publication_date DATE,
          isbn VARCHAR(50),
          pages INTEGER,
          edition VARCHAR(50),
          download_link TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS title VARCHAR(500)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS author_name VARCHAR(255)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS language VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publication_type VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publication_date DATE`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS isbn VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS pages INTEGER`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS edition VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS download_link TEXT`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering publications table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating publications table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id,
        COALESCE(publication_title, title) AS title,
        author_name, language, publication_type, publisher, publication_date,
        isbn, pages, edition, download_link, description, created_at, updated_at
      FROM publications WHERE user_id = $1 ORDER BY publication_date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching publications:", error);
    return NextResponse.json(
      { error: "Failed to fetch publications", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      title,
      authorName,
      language,
      publicationType,
      publisher,
      publicationDate,
      isbn,
      pages,
      edition,
      downloadLink,
      description,
    } = body;

    if (!userId || !title) {
      return NextResponse.json(
        { error: "userId and title are required" },
        { status: 400 }
      );
    }

    // Create publications table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS publications (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          author_name VARCHAR(255),
          language VARCHAR(50),
          publication_type VARCHAR(50),
          publisher VARCHAR(255),
          publication_date DATE,
          isbn VARCHAR(50),
          pages INTEGER,
          edition VARCHAR(50),
          download_link TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists
      const alterQueries = [
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS title VARCHAR(500)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS author_name VARCHAR(255)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS language VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publication_type VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS publication_date DATE`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS isbn VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS pages INTEGER`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS edition VARCHAR(50)`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS download_link TEXT`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS description TEXT`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE publications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering publications table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating publications table:", error);
    }

    // Try to insert with publication_title first (old schema), if column doesn't exist, use title
    let result;
    try {
      result = await query(
        `INSERT INTO publications (
          user_id, publication_title, author_name, language, publication_type, publisher,
          publication_date, isbn, pages, edition, download_link, description
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          parseInt(userId.toString()),
          title,
          authorName || null,
          language || null,
          publicationType || null,
          publisher || null,
          publicationDate || null,
          isbn || null,
          pages ? parseInt(pages.toString()) : null,
          edition || null,
          downloadLink || null,
          description || null,
        ]
      );
    } catch (error: any) {
      // If publication_title doesn't exist, try with title (new schema)
      if (error.message && error.message.includes("publication_title")) {
        result = await query(
          `INSERT INTO publications (
            user_id, title, author_name, language, publication_type, publisher,
            publication_date, isbn, pages, edition, download_link, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *`,
          [
            parseInt(userId.toString()),
            title,
            authorName || null,
            language || null,
            publicationType || null,
            publisher || null,
            publicationDate || null,
            isbn || null,
            pages ? parseInt(pages.toString()) : null,
            edition || null,
            downloadLink || null,
            description || null,
          ]
        );
      } else {
        throw error;
      }
    }

    // Map publication_title to title for consistency
    const publicationData = result.rows[0];
    if (publicationData.publication_title) {
      publicationData.title = publicationData.publication_title;
    }
    
    return NextResponse.json({ publication: publicationData }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding publication:", error);
    return NextResponse.json(
      { error: "Failed to add publication", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      title,
      authorName,
      language,
      publicationType,
      publisher,
      publicationDate,
      isbn,
      pages,
      edition,
      downloadLink,
      description,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Try to update publication_title first (old schema), if column doesn't exist, use title
    let result;
    try {
      result = await query(
        `UPDATE publications SET
          publication_title = COALESCE($1, publication_title),
          author_name = $2,
          language = $3,
          publication_type = $4,
          publisher = $5,
          publication_date = $6,
          isbn = $7,
          pages = $8,
          edition = $9,
          download_link = $10,
          description = $11,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $12
        RETURNING *`,
        [
          title || null,
          authorName || null,
          language || null,
          publicationType || null,
          publisher || null,
          publicationDate || null,
          isbn || null,
          pages ? parseInt(pages.toString()) : null,
          edition || null,
          downloadLink || null,
          description || null,
          id,
        ]
      );
    } catch (error: any) {
      // If publication_title doesn't exist, try with title (new schema)
      if (error.message && error.message.includes("publication_title")) {
        result = await query(
          `UPDATE publications SET
            title = COALESCE($1, title),
            author_name = $2,
            language = $3,
            publication_type = $4,
            publisher = $5,
            publication_date = $6,
            isbn = $7,
            pages = $8,
            edition = $9,
            download_link = $10,
            description = $11,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $12
          RETURNING *`,
          [
            title || null,
            authorName || null,
            language || null,
            publicationType || null,
            publisher || null,
            publicationDate || null,
            isbn || null,
            pages ? parseInt(pages.toString()) : null,
            edition || null,
            downloadLink || null,
            description || null,
            id,
          ]
        );
      } else {
        throw error;
      }
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    }

    // Map publication_title to title for consistency
    if (result.rows[0].publication_title) {
      result.rows[0].title = result.rows[0].publication_title;
    }

    return NextResponse.json({ publication: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating publication:", error);
    return NextResponse.json(
      { error: "Failed to update publication", details: error.message },
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

    const result = await query(`DELETE FROM publications WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Publication not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Publication deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting publication:", error);
    return NextResponse.json(
      { error: "Failed to delete publication", details: error.message },
      { status: 500 }
    );
  }
}
