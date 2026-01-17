import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// In-memory store for active users (in production, use Redis or database)
const activeUsers = new Map<number, { userId: number; name: string; lastSeen: number }>();

// Clean up inactive users (5 minutes timeout)
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [userId, user] of activeUsers.entries()) {
    if (now - user.lastSeen > CLEANUP_INTERVAL) {
      activeUsers.delete(userId);
    }
  }
}, CLEANUP_INTERVAL);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // Get user info from database
    const userResult = await query(
      `SELECT id, full_name, name_ar FROM users WHERE id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userName = user.name_ar || user.full_name || `User ${userId}`;

    // Update or add user to active users
    activeUsers.set(userId, {
      userId,
      name: userName,
      lastSeen: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating online user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Clean up inactive users before returning list
    const now = Date.now();
    for (const [userId, user] of activeUsers.entries()) {
      if (now - user.lastSeen > CLEANUP_INTERVAL) {
        activeUsers.delete(userId);
      }
    }

    // Get all active users
    const activeUsersList = Array.from(activeUsers.values())
      .filter(user => now - user.lastSeen <= CLEANUP_INTERVAL)
      .map(user => ({
        id: user.userId,
        name: user.name,
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ar'));

    return NextResponse.json({
      count: activeUsersList.length,
      users: activeUsersList,
    });
  } catch (error) {
    console.error("Error getting online users:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
