import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";
import { ensureConferencesTable } from "@/lib/db/conferences";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await ensureConferencesTable();

    const result = await query(
      `SELECT 
        id, user_id, conference_title, date, scope, type, sponsoring_organization, location, is_committee_member, assignment_document, created_at, updated_at
      FROM conferences WHERE user_id = $1 ORDER BY date DESC, created_at DESC`,
      [parseInt(userId)]
    );

    return NextResponse.json(result.rows);
  } catch (error: any) {
    console.error("Error fetching conferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch conferences", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, conferenceTitle, date, scope, type, sponsoringOrganization, location, isCommitteeMember, assignmentDocument } = body;

    if (!userId || !conferenceTitle || !date || !scope || !type) {
      return NextResponse.json(
        { error: "userId, conferenceTitle, date, scope, and type are required" },
        { status: 400 }
      );
    }

    await ensureConferencesTable();

    const result = await query(
      `INSERT INTO conferences (
        user_id, conference_title, date, scope, type, sponsoring_organization, location, is_committee_member, assignment_document
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        parseInt(userId.toString()),
        conferenceTitle,
        date || null,
        scope,
        type,
        sponsoringOrganization || null,
        location || null,
        isCommitteeMember || false,
        assignmentDocument || null,
      ]
    );

    return NextResponse.json({ conference: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating conference:", error);
    return NextResponse.json(
      { error: "Failed to create conference", details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, conferenceTitle, date, scope, type, sponsoringOrganization, location, isCommitteeMember, assignmentDocument } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const result = await query(
      `UPDATE conferences SET
        conference_title = COALESCE($1, conference_title),
        date = COALESCE($2, date),
        scope = COALESCE($3, scope),
        type = COALESCE($4, type),
        sponsoring_organization = $5,
        location = $6,
        is_committee_member = COALESCE($7, is_committee_member),
        assignment_document = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *`,
      [
        conferenceTitle || null,
        date || null,
        scope || null,
        type || null,
        sponsoringOrganization || null,
        location || null,
        isCommitteeMember !== undefined ? isCommitteeMember : null,
        assignmentDocument !== undefined ? assignmentDocument : null,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Conference not found" }, { status: 404 });
    }

    return NextResponse.json({ conference: result.rows[0] });
  } catch (error: any) {
    console.error("Error updating conference:", error);
    return NextResponse.json(
      { error: "Failed to update conference", details: error.message },
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

    const result = await query(`DELETE FROM conferences WHERE id = $1 RETURNING *`, [parseInt(id)]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Conference not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Conference deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting conference:", error);
    return NextResponse.json(
      { error: "Failed to delete conference", details: error.message },
      { status: 500 }
    );
  }
}
