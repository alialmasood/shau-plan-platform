import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";
import { calculateScientificPointsDataForUser } from "@/lib/services/scientificPoints";

// GET: Calculate and return points for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const year = searchParams.get("year"); // Optional: specific year

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Create points table if it doesn't exist
    try {
      await query(`
        CREATE TABLE IF NOT EXISTS points (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          activity_type VARCHAR(100) NOT NULL,
          activity_id INTEGER,
          role VARCHAR(100),
          year INTEGER NOT NULL,
          points INTEGER NOT NULL,
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index for faster queries
      await query(`
        CREATE INDEX IF NOT EXISTS idx_points_user_year ON points(user_id, year)
      `).catch(() => {}); // Ignore if index exists
    } catch (error: any) {
      console.error("Error creating points table:", error);
    }

    const userPoints = await calculateScientificPointsDataForUser(
      parseInt(userId)
    );
    // year param غير مستخدم سابقاً في API، نحافظ على نفس السلوك
    void year;
    return NextResponse.json(userPoints);
  } catch (error: any) {
    console.error("Error calculating points:", error);
    return NextResponse.json(
      { error: "Failed to calculate points", details: error.message },
      { status: 500 }
    );
  }
}
