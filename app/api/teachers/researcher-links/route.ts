import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET - Fetch researcher links for a user
export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Check if researcher_links table exists, if not create it
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS researcher_links (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          google_scholar TEXT,
          scopus TEXT,
          research_gate TEXT,
          orcid TEXT,
          web_of_science TEXT,
          linkedin TEXT,
          github TEXT,
          academia_edu TEXT,
          mendeley TEXT,
          pubmed TEXT,
          ieee_xplore TEXT,
          google_scholar_clicks INTEGER DEFAULT 0,
          scopus_clicks INTEGER DEFAULT 0,
          research_gate_clicks INTEGER DEFAULT 0,
          orcid_clicks INTEGER DEFAULT 0,
          web_of_science_clicks INTEGER DEFAULT 0,
          linkedin_clicks INTEGER DEFAULT 0,
          github_clicks INTEGER DEFAULT 0,
          academia_edu_clicks INTEGER DEFAULT 0,
          mendeley_clicks INTEGER DEFAULT 0,
          pubmed_clicks INTEGER DEFAULT 0,
          ieee_xplore_clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      
      // Add new columns if table already exists
      await query(`
        ALTER TABLE researcher_links
        ADD COLUMN IF NOT EXISTS linkedin TEXT,
        ADD COLUMN IF NOT EXISTS github TEXT,
        ADD COLUMN IF NOT EXISTS academia_edu TEXT,
        ADD COLUMN IF NOT EXISTS mendeley TEXT,
        ADD COLUMN IF NOT EXISTS pubmed TEXT,
        ADD COLUMN IF NOT EXISTS ieee_xplore TEXT,
        ADD COLUMN IF NOT EXISTS google_scholar_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS scopus_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS research_gate_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS orcid_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS web_of_science_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS linkedin_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS github_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS academia_edu_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mendeley_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pubmed_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ieee_xplore_clicks INTEGER DEFAULT 0;
      `);
    } catch (error: any) {
      console.error("Error creating table:", error);
    }

    // Fetch links
    const result = await query(
      `SELECT google_scholar, scopus, research_gate, orcid, web_of_science, linkedin, github, academia_edu, mendeley, pubmed, ieee_xplore,
              google_scholar_clicks, scopus_clicks, research_gate_clicks, orcid_clicks, web_of_science_clicks,
              linkedin_clicks, github_clicks, academia_edu_clicks, mendeley_clicks, pubmed_clicks, ieee_xplore_clicks,
              updated_at, created_at
       FROM researcher_links
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({}, { status: 200 });
    }

    return NextResponse.json(result.rows[0], { status: 200 });
  } catch (error: any) {
    console.error("Error fetching researcher links:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء جلب الروابط" },
      { status: 500 }
    );
  }
}

// POST/PUT - Save researcher links for a user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, google_scholar, scopus, research_gate, orcid, web_of_science, linkedin, github, academia_edu, mendeley, pubmed, ieee_xplore } = body;

    if (!userId) {
      return NextResponse.json(
        { message: "معرف المستخدم مطلوب" },
        { status: 400 }
      );
    }

    // Check if researcher_links table exists, if not create it
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS researcher_links (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          google_scholar TEXT,
          scopus TEXT,
          research_gate TEXT,
          orcid TEXT,
          web_of_science TEXT,
          linkedin TEXT,
          github TEXT,
          academia_edu TEXT,
          mendeley TEXT,
          pubmed TEXT,
          ieee_xplore TEXT,
          google_scholar_clicks INTEGER DEFAULT 0,
          scopus_clicks INTEGER DEFAULT 0,
          research_gate_clicks INTEGER DEFAULT 0,
          orcid_clicks INTEGER DEFAULT 0,
          web_of_science_clicks INTEGER DEFAULT 0,
          linkedin_clicks INTEGER DEFAULT 0,
          github_clicks INTEGER DEFAULT 0,
          academia_edu_clicks INTEGER DEFAULT 0,
          mendeley_clicks INTEGER DEFAULT 0,
          pubmed_clicks INTEGER DEFAULT 0,
          ieee_xplore_clicks INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      
      // Add new columns if table already exists
      await query(`
        ALTER TABLE researcher_links
        ADD COLUMN IF NOT EXISTS linkedin TEXT,
        ADD COLUMN IF NOT EXISTS github TEXT,
        ADD COLUMN IF NOT EXISTS academia_edu TEXT,
        ADD COLUMN IF NOT EXISTS mendeley TEXT,
        ADD COLUMN IF NOT EXISTS pubmed TEXT,
        ADD COLUMN IF NOT EXISTS ieee_xplore TEXT,
        ADD COLUMN IF NOT EXISTS google_scholar_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS scopus_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS research_gate_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS orcid_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS web_of_science_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS linkedin_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS github_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS academia_edu_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS mendeley_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS pubmed_clicks INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS ieee_xplore_clicks INTEGER DEFAULT 0;
      `);
    } catch (error: any) {
      console.error("Error creating table:", error);
    }

    // Use UPSERT (INSERT ... ON CONFLICT UPDATE)
    await query(
      `INSERT INTO researcher_links (user_id, google_scholar, scopus, research_gate, orcid, web_of_science, linkedin, github, academia_edu, mendeley, pubmed, ieee_xplore, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP)
       ON CONFLICT (user_id)
       DO UPDATE SET
         google_scholar = EXCLUDED.google_scholar,
         scopus = EXCLUDED.scopus,
         research_gate = EXCLUDED.research_gate,
         orcid = EXCLUDED.orcid,
         web_of_science = EXCLUDED.web_of_science,
         linkedin = EXCLUDED.linkedin,
         github = EXCLUDED.github,
         academia_edu = EXCLUDED.academia_edu,
         mendeley = EXCLUDED.mendeley,
         pubmed = EXCLUDED.pubmed,
         ieee_xplore = EXCLUDED.ieee_xplore,
         updated_at = CURRENT_TIMESTAMP`,
      [userId, google_scholar || null, scopus || null, research_gate || null, orcid || null, web_of_science || null, linkedin || null, github || null, academia_edu || null, mendeley || null, pubmed || null, ieee_xplore || null]
    );

    return NextResponse.json(
      { message: "تم حفظ الروابط بنجاح" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error saving researcher links:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء حفظ الروابط" },
      { status: 500 }
    );
  }
}

// PATCH - Track link click
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, linkKey } = body;

    if (!userId || !linkKey) {
      return NextResponse.json(
        { message: "معرف المستخدم ومفتاح الرابط مطلوبان" },
        { status: 400 }
      );
    }

    // Map of allowed link keys to their click columns (to prevent SQL injection)
    const clickColumnsMap: { [key: string]: string } = {
      google_scholar: "google_scholar_clicks",
      scopus: "scopus_clicks",
      research_gate: "research_gate_clicks",
      orcid: "orcid_clicks",
      web_of_science: "web_of_science_clicks",
      linkedin: "linkedin_clicks",
      github: "github_clicks",
      academia_edu: "academia_edu_clicks",
      mendeley: "mendeley_clicks",
      pubmed: "pubmed_clicks",
      ieee_xplore: "ieee_xplore_clicks",
    };

    const clickColumn = clickColumnsMap[linkKey];

    if (!clickColumn) {
      return NextResponse.json(
        { message: "مفتاح الرابط غير صحيح" },
        { status: 400 }
      );
    }

    // Since column names cannot be parameterized, we validate using the map
    // This is safe because clickColumn comes from the validated map
    const updateQuery = `UPDATE researcher_links 
       SET ${clickColumn} = ${clickColumn} + 1 
       WHERE user_id = $1`;
    
    await query(updateQuery, [userId]);

    return NextResponse.json(
      { message: "تم تحديث عدد النقرات" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error tracking click:", error);
    return NextResponse.json(
      { message: "حدث خطأ أثناء تتبع النقرات" },
      { status: 500 }
    );
  }
}
