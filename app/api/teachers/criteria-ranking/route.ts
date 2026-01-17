import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// GET: Get top users by different criteria
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get all users (teachers/researchers) with academic_title
    const allUsersResult = await query(
      `SELECT id, full_name, name_ar, name_en, department, academic_title FROM users WHERE role = 'teacher' OR role = 'researcher' OR role IS NULL`
    );

    const allUsers = allUsersResult.rows;

    // Academic title ranking (professor > associate_professor > assistant_professor > lecturer > assistant_lecturer)
    const titleRank: { [key: string]: number } = {
      "professor": 5,
      "أستاذ": 5,
      "associate_professor": 4,
      "أستاذ مشارك": 4,
      "assistant_professor": 3,
      "أستاذ مساعد": 3,
      "lecturer": 2,
      "مدرس": 2,
      "assistant_lecturer": 1,
      "مدرس مساعد": 1,
    };

    // Calculate statistics for each user
    const usersStats = await Promise.all(
      allUsers.map(async (user) => {
        try {
          // Get research data
          const researchResult = await query(
            `SELECT id, is_published, classifications FROM research WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));

          const research = researchResult.rows || [];
          const publishedResearch = research.filter((r: any) => r.is_published).length;
          const globalResearch = research.filter((r: any) => {
            const classifications = Array.isArray(r.classifications) ? r.classifications : [];
            return classifications.includes("global") || classifications.includes("عالمية") || classifications.includes("عالمي");
          }).length;

          // Get conferences
          const conferencesResult = await query(
            `SELECT id FROM conferences WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const conferencesCount = (conferencesResult.rows || []).length;

          // Get seminars and courses
          const seminarsResult = await query(
            `SELECT id FROM seminars WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const coursesResult = await query(
            `SELECT id FROM courses WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const seminarsCount = (seminarsResult.rows || []).length;
          const coursesCount = (coursesResult.rows || []).length;
          const seminarsAndCoursesCount = seminarsCount + coursesCount;

          // Get committees
          const committeesResult = await query(
            `SELECT id FROM committees WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const committeesCount = (committeesResult.rows || []).length;

          // Get volunteer work
          const volunteerWorkResult = await query(
            `SELECT id FROM volunteer_work WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const volunteerWorkCount = (volunteerWorkResult.rows || []).length;

          // Get thank you books
          const thankYouBooksResult = await query(
            `SELECT id FROM thank_you_books WHERE user_id = $1`,
            [user.id]
          ).catch(() => ({ rows: [] }));
          const thankYouBooksCount = (thankYouBooksResult.rows || []).length;

          return {
            id: user.id,
            full_name: user.full_name || user.name_ar || user.name_en || `User ${user.id}`,
            name_ar: user.name_ar,
            name_en: user.name_en,
            department: user.department || "",
            academic_title: user.academic_title || "",
            academic_title_rank: titleRank[user.academic_title || ""] || 0,
            publishedResearch,
            globalResearch,
            conferencesCount,
            seminarsAndCoursesCount,
            committeesCount,
            volunteerWorkCount,
            thankYouBooksCount,
          };
        } catch (error) {
          console.error(`Error calculating stats for user ${user.id}:`, error);
          return {
            id: user.id,
            full_name: user.full_name || user.name_ar || user.name_en || `User ${user.id}`,
            name_ar: user.name_ar,
            name_en: user.name_en,
            department: user.department || "",
            academic_title: user.academic_title || "",
            academic_title_rank: 0,
            publishedResearch: 0,
            globalResearch: 0,
            conferencesCount: 0,
            seminarsAndCoursesCount: 0,
            committeesCount: 0,
            volunteerWorkCount: 0,
            thankYouBooksCount: 0,
          };
        }
      })
    );

    // Sort by each criterion
    const rankings = {
      academicTitle: usersStats
        .filter(u => u.academic_title_rank > 0)
        .sort((a, b) => b.academic_title_rank - a.academic_title_rank)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.academic_title,
        })),

      publishedResearch: usersStats
        .sort((a, b) => b.publishedResearch - a.publishedResearch)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.publishedResearch,
        })),

      globalResearch: usersStats
        .sort((a, b) => b.globalResearch - a.globalResearch)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.globalResearch,
        })),

      conferences: usersStats
        .sort((a, b) => b.conferencesCount - a.conferencesCount)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.conferencesCount,
        })),

      seminarsAndCourses: usersStats
        .sort((a, b) => b.seminarsAndCoursesCount - a.seminarsAndCoursesCount)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.seminarsAndCoursesCount,
        })),

      committees: usersStats
        .sort((a, b) => b.committeesCount - a.committeesCount)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.committeesCount,
        })),

      volunteerWork: usersStats
        .sort((a, b) => b.volunteerWorkCount - a.volunteerWorkCount)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.volunteerWorkCount,
        })),

      thankYouBooks: usersStats
        .sort((a, b) => b.thankYouBooksCount - a.thankYouBooksCount)
        .slice(0, limit)
        .map((u, index) => ({
          rank: index + 1,
          ...u,
          value: u.thankYouBooksCount,
        })),
    };

    return NextResponse.json(rankings);
  } catch (error: any) {
    console.error("Error calculating criteria rankings:", error);
    return NextResponse.json(
      { error: "Failed to calculate criteria rankings", details: error.message },
      { status: 500 }
    );
  }
}
