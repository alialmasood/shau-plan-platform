import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET: Get user ranking based on total points
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Get user info
    const userResult = await query(
      `SELECT id, full_name, department FROM users WHERE id = $1`,
      [parseInt(userId)]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = userResult.rows[0];
    const userDepartment = user.department;

    // Get all users (teachers/researchers) with academic_title
    const allUsersResult = await query(
      `SELECT id, full_name, name_ar, name_en, department, academic_title FROM users WHERE role = 'teacher' OR role = 'researcher' OR role IS NULL`
    );

    const allUsers = allUsersResult.rows;
    interface UserWithPoints {
      id: number;
      full_name: string;
      name_ar?: string;
      name_en?: string;
      department: string;
      academic_title?: string;
      totalPoints: number;
      pointsBreakdown?: any;
    }
    const usersWithPoints: UserWithPoints[] = [];

    // Calculate points for each user using the same logic as points API
    // We'll use a simplified approach: fetch points via internal API call
    // For better performance, we could cache this or calculate in batch
    const pointsPromises = allUsers.map(async (currentUser) => {
      try {
        // Call points calculation internally
        const pointsResponse = await fetch(`${request.nextUrl.origin}/api/teachers/points?userId=${currentUser.id}`, {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (pointsResponse.ok) {
          const pointsData = await pointsResponse.json();
          return {
            id: currentUser.id,
            full_name: currentUser.full_name || currentUser.name_ar || currentUser.name_en || currentUser.username || `User ${currentUser.id}`,
            name_ar: currentUser.name_ar,
            name_en: currentUser.name_en,
            department: currentUser.department || "",
            academic_title: currentUser.academic_title || "",
            totalPoints: pointsData.totalPoints || 0,
            pointsBreakdown: pointsData.pointsBreakdown || {}
          };
        } else {
          return {
            id: currentUser.id,
            full_name: currentUser.full_name || currentUser.name_ar || currentUser.name_en || currentUser.username || `User ${currentUser.id}`,
            name_ar: currentUser.name_ar,
            name_en: currentUser.name_en,
            department: currentUser.department || "",
            academic_title: currentUser.academic_title || "",
            totalPoints: 0,
            pointsBreakdown: {}
          };
        }
      } catch (error) {
        console.error(`Error calculating points for user ${currentUser.id}:`, error);
        return {
          id: currentUser.id,
          full_name: currentUser.full_name || currentUser.username || `User ${currentUser.id}`,
          department: currentUser.department || "",
          totalPoints: 0
        };
      }
    });

    const results = await Promise.all(pointsPromises);
    usersWithPoints.push(...results);

    // Sort users by points (descending)
    usersWithPoints.sort((a, b) => b.totalPoints - a.totalPoints);

    // Find user's rank in college (all users)
    const collegeRank = usersWithPoints.findIndex(u => u.id === parseInt(userId)) + 1;
    const totalUsersInCollege = usersWithPoints.length;

    // Filter users by department
    const departmentUsers = usersWithPoints.filter(u => u.department === userDepartment);
    
    // Find user's rank in department
    const departmentRank = departmentUsers.findIndex(u => u.id === parseInt(userId)) + 1;
    const totalUsersInDepartment = departmentUsers.length;

    // Get user's points
    const userPoints = usersWithPoints.find(u => u.id === parseInt(userId))?.totalPoints || 0;

    // Get top 3 users in college
    const top3Users = usersWithPoints.slice(0, 3).map(user => ({
      id: user.id,
      full_name: user.full_name || user.name_ar || user.name_en || `User ${user.id}`,
      name_ar: user.name_ar,
      name_en: user.name_en,
      department: user.department || "",
      academic_title: user.academic_title || "",
      totalPoints: user.totalPoints
    }));

    // Get top 10 users in college
    const top10Users = usersWithPoints.slice(0, 10).map(user => ({
      id: user.id,
      full_name: user.full_name || user.name_ar || user.name_en || `User ${user.id}`,
      name_ar: user.name_ar,
      name_en: user.name_en,
      department: user.department || "",
      academic_title: user.academic_title || "",
      totalPoints: user.totalPoints
    }));

    // Get user's points breakdown for similarity calculation
    const currentUserPointsData = usersWithPoints.find(u => u.id === parseInt(userId));
    const currentUserBreakdown = currentUserPointsData?.pointsBreakdown || {};

    // Calculate similarity score based on points breakdown
    const calculateSimilarity = (user1Breakdown: any, user2Breakdown: any): number => {
      if (!user1Breakdown || !user2Breakdown) return 0;
      
      const activityTypes = ['research', 'conferences', 'positions', 'publications', 'courses', 
                            'seminars', 'workshops', 'assignments', 'volunteerWork', 'committees', 
                            'thankYouBooks', 'supervision', 'scientificEvaluations', 'journalMemberships'];
      
      let matchingActivities = 0;
      let totalActivities = 0;
      
      activityTypes.forEach(type => {
        const user1Count = Array.isArray(user1Breakdown[type]) ? user1Breakdown[type].length : 0;
        const user2Count = Array.isArray(user2Breakdown[type]) ? user2Breakdown[type].length : 0;
        
        if (user1Count > 0 || user2Count > 0) {
          totalActivities++;
          // Calculate similarity based on activity count difference
          const diff = Math.abs(user1Count - user2Count);
          const max = Math.max(user1Count, user2Count);
          if (max > 0) {
            const similarity = (max - diff) / max;
            if (similarity > 0.5) { // At least 50% similar
              matchingActivities += similarity;
            }
          }
        }
      });
      
      return totalActivities > 0 ? Math.round((matchingActivities / totalActivities) * 100) : 0;
    };

    // Find similar users (exclude current user)
    const similarUsers = usersWithPoints
      .filter(u => u.id !== parseInt(userId))
      .map(user => ({
        ...user,
        similarity: calculateSimilarity(currentUserBreakdown, user.pointsBreakdown || {})
      }))
      .filter(u => u.similarity > 30) // At least 30% similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5) // Top 5 similar users
      .map(user => ({
        id: user.id,
        full_name: user.full_name,
        name_ar: user.name_ar,
        name_en: user.name_en,
        department: user.department || "",
        academic_title: user.academic_title || "",
        similarity: user.similarity
      }));

    // Get top users in department with points breakdown
    const topDepartmentUsers = departmentUsers
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 5)
      .map((user, index) => ({
        rank: index + 1,
        id: user.id,
        full_name: user.full_name,
        name_ar: user.name_ar,
        name_en: user.name_en,
        department: user.department || "",
        academic_title: user.academic_title || "",
        totalPoints: user.totalPoints,
        pointsBreakdown: user.pointsBreakdown || {}
      }));

    return NextResponse.json({
      collegeRank,
      totalUsersInCollege,
      departmentRank,
      totalUsersInDepartment,
      userPoints,
      userDepartment,
      top3Users,
      top10Users,
      similarUsers,
      topDepartmentUsers
    });
  } catch (error: any) {
    console.error("Error calculating ranking:", error);
    return NextResponse.json(
      { error: "Failed to calculate ranking", details: error.message },
      { status: 500 }
    );
  }
}
