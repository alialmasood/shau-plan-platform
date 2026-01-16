import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create research table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS research (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          research_type VARCHAR(50) NOT NULL,
          author_type VARCHAR(50) NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          completion_percentage INTEGER,
          year INTEGER NOT NULL,
          is_published BOOLEAN DEFAULT FALSE,
          research_link TEXT,
          publication_type VARCHAR(50),
          publisher VARCHAR(255),
          doi VARCHAR(255),
          publication_month VARCHAR(50),
          download_link TEXT,
          classifications TEXT[],
          scopus_quartile VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists (PostgreSQL 9.6+)
      const alterQueries = [
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS title VARCHAR(500)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS research_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS author_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS completion_percentage INTEGER`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS research_link TEXT`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS doi VARCHAR(255)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_month VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS download_link TEXT`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS classifications TEXT[]`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS scopus_quartile VARCHAR(10)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering research table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating research table:", error);
    }

    const result = await query(
      `SELECT 
        id, user_id, 
        COALESCE(research_title, title) AS title,
        research_type, author_type, is_completed, completion_percentage,
        year, is_published, research_link, publication_type, publisher, doi,
        publication_month, download_link, classifications, scopus_quartile,
        created_at, updated_at
      FROM research WHERE user_id = $1 ORDER BY year DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching research:", error);
    return NextResponse.json(
      { error: "Failed to fetch research", details: error.message },
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
      researchType,
      authorType,
      isCompleted,
      completionPercentage,
      year,
      isPublished,
      researchLink,
      publicationType,
      publisher,
      doi,
      publicationMonth,
      downloadLink,
      classifications,
      scopusQuartile,
    } = body;

    if (!userId || !title || !researchType || !authorType || !year) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create research table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS research (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          title VARCHAR(500) NOT NULL,
          research_type VARCHAR(50) NOT NULL,
          author_type VARCHAR(50) NOT NULL,
          is_completed BOOLEAN DEFAULT FALSE,
          completion_percentage INTEGER,
          year INTEGER NOT NULL,
          is_published BOOLEAN DEFAULT FALSE,
          research_link TEXT,
          publication_type VARCHAR(50),
          publisher VARCHAR(255),
          doi VARCHAR(255),
          publication_month VARCHAR(50),
          download_link TEXT,
          classifications TEXT[],
          scopus_quartile VARCHAR(10),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Add missing columns if table already exists (PostgreSQL 9.6+)
      const alterQueries = [
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS title VARCHAR(500)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS research_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS author_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS completion_percentage INTEGER`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS year INTEGER`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS research_link TEXT`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_type VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publisher VARCHAR(255)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS doi VARCHAR(255)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_month VARCHAR(50)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS download_link TEXT`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS classifications TEXT[]`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS scopus_quartile VARCHAR(10)`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
        `ALTER TABLE research ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      ];
      
      for (const alterQuery of alterQueries) {
        try {
          await query(alterQuery);
        } catch (error: any) {
          // Ignore errors if column already exists
          console.error("Error altering research table:", error.message);
        }
      }
    } catch (error: any) {
      console.error("Error creating research table:", error);
    }

    // Check if research_title exists, if so use it, otherwise use title
    // First try to insert with research_title (old schema)
    let result;
    try {
      result = await query(
        `INSERT INTO research (
          user_id, research_title, research_type, author_type, is_completed, completion_percentage,
          year, is_published, research_link, publication_type, publisher, doi,
          publication_month, download_link, classifications, scopus_quartile
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [
          parseInt(userId.toString()),
          title,
          researchType,
          authorType,
          isCompleted || false,
          completionPercentage !== undefined && completionPercentage !== null ? parseInt(completionPercentage.toString()) : null,
          parseInt(year.toString()),
          isPublished || false,
          researchLink || null,
          publicationType || null,
          publisher || null,
          doi || null,
          publicationMonth || null,
          downloadLink || null,
          classifications && classifications.length > 0 ? classifications : null,
          scopusQuartile || null,
        ]
      );
    } catch (error: any) {
      // If research_title doesn't exist, try with title (new schema)
      if (error.message && error.message.includes("research_title")) {
        result = await query(
          `INSERT INTO research (
            user_id, title, research_type, author_type, is_completed, completion_percentage,
            year, is_published, research_link, publication_type, publisher, doi,
            publication_month, download_link, classifications, scopus_quartile
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          RETURNING *`,
          [
            parseInt(userId.toString()),
            title,
            researchType,
            authorType,
            isCompleted || false,
            completionPercentage !== undefined && completionPercentage !== null ? parseInt(completionPercentage.toString()) : null,
            parseInt(year.toString()),
            isPublished || false,
            researchLink || null,
            publicationType || null,
            publisher || null,
            doi || null,
            publicationMonth || null,
            downloadLink || null,
            classifications && classifications.length > 0 ? classifications : null,
            scopusQuartile || null,
          ]
        );
      } else {
        throw error;
      }
    }

    // Map research_title to title for consistency
    const researchData = result.rows[0];
    if (researchData.research_title) {
      researchData.title = researchData.research_title;
    }
    
    return NextResponse.json({ research: researchData }, { status: 201 });
  } catch (error: any) {
    console.error("Error adding research:", error);
    return NextResponse.json(
      { error: "Failed to add research", details: error.message },
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
      researchType,
      authorType,
      isCompleted,
      completionPercentage,
      year,
      isPublished,
      researchLink,
      publicationType,
      publisher,
      doi,
      publicationMonth,
      downloadLink,
      classifications,
      scopusQuartile,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Try to update research_title first (old schema), if column doesn't exist, use title
    let result;
    try {
      result = await query(
        `UPDATE research SET
          research_title = COALESCE($1, research_title),
          research_type = COALESCE($2, research_type),
          author_type = COALESCE($3, author_type),
          is_completed = COALESCE($4, is_completed),
          completion_percentage = $5,
          year = COALESCE($6, year),
          is_published = COALESCE($7, is_published),
          research_link = $8,
          publication_type = $9,
          publisher = $10,
          doi = $11,
          publication_month = $12,
          download_link = $13,
          classifications = $14,
          scopus_quartile = $15,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $16
        RETURNING *`,
        [
          title || null,
          researchType || null,
          authorType || null,
          isCompleted !== undefined ? isCompleted : null,
          completionPercentage !== undefined && completionPercentage !== null ? parseInt(completionPercentage.toString()) : null,
          year ? parseInt(year.toString()) : null,
          isPublished !== undefined ? isPublished : null,
          researchLink || null,
          publicationType || null,
          publisher || null,
          doi || null,
          publicationMonth || null,
          downloadLink || null,
          classifications && classifications.length > 0 ? classifications : null,
          scopusQuartile || null,
          id,
        ]
      );
    } catch (error: any) {
      // If research_title doesn't exist, try with title (new schema)
      if (error.message && error.message.includes("research_title")) {
        result = await query(
          `UPDATE research SET
            title = COALESCE($1, title),
            research_type = COALESCE($2, research_type),
            author_type = COALESCE($3, author_type),
            is_completed = COALESCE($4, is_completed),
            completion_percentage = $5,
            year = COALESCE($6, year),
            is_published = COALESCE($7, is_published),
            research_link = $8,
            publication_type = $9,
            publisher = $10,
            doi = $11,
            publication_month = $12,
            download_link = $13,
            classifications = $14,
            scopus_quartile = $15,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = $16
          RETURNING *`,
          [
            title || null,
            researchType || null,
            authorType || null,
            isCompleted !== undefined ? isCompleted : null,
            completionPercentage !== undefined && completionPercentage !== null ? parseInt(completionPercentage.toString()) : null,
            year ? parseInt(year.toString()) : null,
            isPublished !== undefined ? isPublished : null,
            researchLink || null,
            publicationType || null,
            publisher || null,
            doi || null,
            publicationMonth || null,
            downloadLink || null,
            classifications && classifications.length > 0 ? classifications : null,
            scopusQuartile || null,
            id,
          ]
        );
      } else {
        throw error;
      }
    }

    // Map research_title to title for consistency
    if (result.rows[0] && result.rows[0].research_title) {
      result.rows[0].title = result.rows[0].research_title;
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ research: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating research:", error);
    return NextResponse.json(
      { error: "Failed to update research", details: error.message },
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

    const result = await query(`DELETE FROM research WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Research not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Research deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting research:", error);
    return NextResponse.json(
      { error: "Failed to delete research", details: error.message },
      { status: 500 }
    );
  }
}
