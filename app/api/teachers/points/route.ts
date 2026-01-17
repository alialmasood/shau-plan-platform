import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/query";

// Points calculation functions
function calculateResearchPoints(research: any): number {
  if (!research) return 0;

  // Base points based on status
  let basePoints = 0;
  if (!research.is_completed) {
    basePoints = 1; // بحث غير منجز
  } else if (research.is_completed && !research.is_published) {
    basePoints = 3; // بحث منجز غير منشور
  } else if (research.is_published) {
    const hasGlobal = research.classifications?.includes("global") || false;
    basePoints = hasGlobal ? 10 : 5; // منشور عالمي: 10، محلي: 5
  }

  // Scopus Quartile points
  let scopusPoints = 0;
  if (research.scopus_quartile) {
    switch (research.scopus_quartile.toUpperCase()) {
      case "Q1":
        scopusPoints = 20;
        break;
      case "Q2":
        scopusPoints = 15;
        break;
      case "Q3":
        scopusPoints = 10;
        break;
      case "Q4":
        scopusPoints = 5;
        break;
      default:
        scopusPoints = 0;
    }
  }

  return basePoints + scopusPoints;
}

function calculateConferencePoints(conference: any): number {
  if (!conference) return 0;

  const isGlobal = conference.scope === "global";
  const isParticipant = conference.type === "participant" || conference.type === "باحث";
  const isCommittee = conference.is_committee_member === true;

  if (isCommittee) {
    return isGlobal ? 12 : 8; // عضو لجنة
  } else if (isParticipant) {
    return isGlobal ? 8 : 5; // مشارك ببحث
  } else {
    return isGlobal ? 4 : 2; // حضور فقط
  }
}

function calculatePositionPoints(position: any): number {
  if (!position || !position.position_title) return 0;

  const title = position.position_title.toLowerCase();
  if (title.includes("عميد") || title.includes("معاون")) return 20;
  if (title.includes("رئيس قسم")) return 15;
  if (title.includes("مقرر")) return 10;
  return 0;
}

function calculatePublicationPoints(publication: any): number {
  if (!publication) return 0;

  const type = publication.publication_type?.toLowerCase() || "";
  if (type.includes("كتاب") || type.includes("book")) {
    return 20; // كتاب علمي محكم
  } else if (type.includes("فصل") || type.includes("chapter")) {
    return 10; // فصل في كتاب
  } else {
    return 5; // مؤلف غير محكم
  }
}

function calculateCoursePoints(course: any): number {
  if (!course) return 0;
  return course.type === "lecturer" ? 8 : 3; // مقيم: 8، مشارك: 3
}

function calculateSeminarPoints(seminar: any): number {
  if (!seminar) return 0;
  return seminar.type === "lecturer" ? 5 : 2; // محاضر: 5، مشارك: 2
}

function calculateWorkshopPoints(workshop: any): number {
  if (!workshop) return 0;
  return workshop.type === "lecturer" ? 6 : 3; // مدرب: 6، مشارك: 3
}

function calculateAssignmentPoints(assignment: any): number {
  if (!assignment) return 0;
  
  // Assuming assignment has type or organization field
  // تكليف وزاري: 10، تكليف جامعي: 6
  const subject = assignment.subject?.toLowerCase() || "";
  if (subject.includes("وزار") || subject.includes("وزارة")) return 10;
  return 6; // تكليف جامعي
}

function calculateVolunteerWorkPoints(work: any): number {
  if (!work) return 0;
  
  // نشاط وطني/جامعي كبير: 5، نشاط تطوعي معتمد: 2
  const title = work.title?.toLowerCase() || "";
  const type = work.type?.toLowerCase() || "";
  if (title.includes("وطن") || title.includes("جامع") || type.includes("وطن")) {
    return 5;
  }
  return 2;
}

function calculateCommitteePoints(committee: any): number {
  if (!committee) return 0;
  
  const assignmentType = committee.assignment_type?.toLowerCase() || "";
  return assignmentType.includes("رئيس") ? 7 : 4; // رئيس: 7، عضو: 4
}

function calculateThankYouBookPoints(book: any): number {
  if (!book) return 0;
  
  const organization = (book.granting_organization || "").toLowerCase();
  
  // جهة دولية: 10 نقاط
  if (
    organization.includes("دول") || 
    organization.includes("internation") || 
    organization.includes("global") ||
    organization.includes("world") ||
    organization.includes("أجنبي")
  ) {
    return 10;
  }
  
  // الوزارة: 6 نقاط
  if (
    organization.includes("وزار") || 
    organization.includes("وزارة") ||
    organization.includes("ministry") ||
    organization.includes("minister")
  ) {
    return 6;
  }
  
  // الجامعة: 3 نقاط
  if (
    organization.includes("جامع") || 
    organization.includes("university") ||
    organization.includes("كلية") ||
    organization.includes("college") ||
    organization.includes("معهد") ||
    organization.includes("institute")
  ) {
    return 3;
  }
  
  // القيمة الافتراضية إذا لم يتم التعرف
  return 3; // افتراضياً من جامعة
}

function calculateSupervisionPoints(supervision: any): number {
  if (!supervision) return 0;
  
  const degreeType = supervision.degree_type?.toLowerCase() || "";
  if (degreeType.includes("دكتوراه") || degreeType.includes("phd")) return 10;
  if (degreeType.includes("ماجستير") || degreeType.includes("master")) return 6;
  if (degreeType.includes("بكالوريوس") || degreeType.includes("bachelor")) return 3;
  return 0;
}

function calculateScientificEvaluationPoints(evaluation: any): number {
  if (!evaluation) return 0;
  
  const type = evaluation.evaluation_type?.toLowerCase() || "";
  // تحكيم بحث دولي: 5، محلي: 2
  if (type.includes("دولي") || type.includes("internation")) return 5;
  return 2; // تحكيم محلي
}

function calculateJournalManagementPoints(membership: any): number {
  if (!membership) return 0;
  
  const role = (membership.role || "").toLowerCase().trim();
  
  // رئيس تحرير: 20 نقطة
  if (
    role === "editor_in_chief" ||
    role.includes("رئيس تحرير") || 
    role.includes("editor-in-chief") ||
    role.includes("editor in chief") ||
    role === "chief_editor"
  ) {
    return 20;
  }
  
  // هيئة تحرير / محرر مساعد: 10 نقاط
  if (
    role === "editorial_board" ||
    role === "assistant_editor" ||
    role.includes("هيئة تحرير") || 
    role.includes("editorial board") ||
    role.includes("محرر مساعد") ||
    role.includes("assistant editor")
  ) {
    return 10;
  }
  
  // محكم: 5 نقاط
  if (
    role === "reviewer" ||
    role.includes("محكم") || 
    role.includes("reviewer") ||
    role.includes("referee") ||
    role.includes("referee")
  ) {
    return 5;
  }
  
  // القيمة الافتراضية: 5 نقاط (محكم)
  return 5;
}

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

    // Fetch all activities for the user directly from database
    const [
      researchResult,
      conferencesResult,
      positionsResult,
      publicationsResult,
      coursesResult,
      seminarsResult,
      workshopsResult,
      assignmentsResult,
      volunteerWorkResult,
      committeesResult,
      thankYouBooksResult,
      supervisionResult,
      scientificEvaluationsResult,
      journalMembershipsResult,
    ] = await Promise.all([
      query(`SELECT id, user_id, COALESCE(research_title, title) AS title, research_type, author_type, is_completed, year, is_published, classifications, scopus_quartile FROM research WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, conference_title AS title, date, scope, type, is_committee_member FROM conferences WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, position_title, start_date FROM positions WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, title, publication_date, publication_type FROM publications WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, course_name AS title, date, type FROM courses WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, title, date, type FROM seminars WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, title, date, type FROM workshops WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, COALESCE(subject, assignment_subject) AS subject, assignment_date FROM assignments WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, title, start_date, type FROM volunteer_work WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, committee_name, assignment_date, assignment_type FROM committees WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, granting_organization, year FROM thank_you_books WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, student_name, start_date, degree_type FROM supervision WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, evaluation_title, evaluation_date, evaluation_type FROM scientific_evaluations WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
      query(`SELECT id, user_id, journal_name, start_date, role FROM journal_memberships WHERE user_id = $1`, [parseInt(userId)]).catch(() => ({ rows: [] })),
    ]);

    const research = researchResult.rows || [];
    const conferences = conferencesResult.rows || [];
    const positions = positionsResult.rows || [];
    const publications = publicationsResult.rows || [];
    const courses = coursesResult.rows || [];
    const seminars = seminarsResult.rows || [];
    const workshops = workshopsResult.rows || [];
    const assignments = assignmentsResult.rows || [];
    const volunteerWork = volunteerWorkResult.rows || [];
    const committees = committeesResult.rows || [];
    const thankYouBooks = thankYouBooksResult.rows || [];
    const supervision = supervisionResult.rows || [];
    const scientificEvaluations = scientificEvaluationsResult.rows || [];
    const journalMemberships = journalMembershipsResult.rows || [];

    // Calculate points for each activity
    const pointsBreakdown: any = {
      research: [],
      conferences: [],
      positions: [],
      publications: [],
      courses: [],
      seminars: [],
      workshops: [],
      assignments: [],
      volunteerWork: [],
      committees: [],
      thankYouBooks: [],
      supervision: [],
      scientificEvaluations: [],
      journalMemberships: [],
    };

    let totalPoints = 0;

    // Research points (with annual bonus)
    const researchByYear: { [year: string]: any[] } = {};
    research.forEach((r: any) => {
      const y = r.year?.toString() || new Date().getFullYear().toString();
      if (!researchByYear[y]) researchByYear[y] = [];
      researchByYear[y].push(r);
    });

    Object.keys(researchByYear).forEach(yearKey => {
      const yearResearch = researchByYear[yearKey];
      let yearResearchPoints = 0;
      
      yearResearch.forEach((r: any) => {
        const points = calculateResearchPoints(r);
        yearResearchPoints += points;
        pointsBreakdown.research.push({
          id: r.id,
          title: r.title,
          year: yearKey,
          points,
          details: {
            status: r.is_completed ? (r.is_published ? (r.classifications?.includes("global") ? "منشور عالمي" : "منشور محلي") : "منجز غير منشور") : "غير منجز",
            scopusQuartile: r.scopus_quartile || "غير سكوبس",
          }
        });
      });

      // Annual research bonus
      const researchCount = yearResearch.length;
      let bonus = 0;
      if (researchCount >= 5) bonus = 10;
      else if (researchCount >= 3) bonus = 5;
      else if (researchCount >= 1) bonus = 2;

      if (bonus > 0) {
        pointsBreakdown.research.push({
          id: null,
          title: `مكافأة عدد البحوث (${researchCount} بحث)`,
          year: yearKey,
          points: bonus,
          details: { type: "annual_bonus", count: researchCount }
        });
        yearResearchPoints += bonus;
      }

      totalPoints += yearResearchPoints;
    });

    // Conferences
    conferences.forEach((c: any) => {
      const points = calculateConferencePoints(c);
      totalPoints += points;
      pointsBreakdown.conferences.push({
        id: c.id,
        title: c.title || c.conference_title,
        year: c.date ? new Date(c.date).getFullYear() : new Date().getFullYear(),
        points,
        details: { scope: c.scope, type: c.type, isCommittee: c.is_committee_member }
      });
    });

    // Positions
    positions.forEach((p: any) => {
      const points = calculatePositionPoints(p);
      totalPoints += points;
      const year = new Date(p.start_date || new Date()).getFullYear();
      pointsBreakdown.positions.push({
        id: p.id,
        title: p.position_title,
        year,
        points,
        details: {}
      });
    });

    // Publications
    publications.forEach((p: any) => {
      const points = calculatePublicationPoints(p);
      totalPoints += points;
      const year = new Date(p.publication_date || new Date()).getFullYear();
      pointsBreakdown.publications.push({
        id: p.id,
        title: p.title,
        year,
        points,
        details: { type: p.publication_type }
      });
    });

    // Courses (bonus for multiple courses per year)
    const coursesByYear: { [year: string]: any[] } = {};
    courses.forEach((c: any) => {
      const y = new Date(c.date || new Date()).getFullYear().toString();
      if (!coursesByYear[y]) coursesByYear[y] = [];
      coursesByYear[y].push(c);
    });

    Object.keys(coursesByYear).forEach(yearKey => {
      const yearCourses = coursesByYear[yearKey];
      yearCourses.forEach((c: any) => {
        let points = calculateCoursePoints(c);
        totalPoints += points;
        pointsBreakdown.courses.push({
          id: c.id,
          title: c.course_name,
          year: yearKey,
          points,
          details: { type: c.type }
        });
      });

      // Bonus for additional courses (+1 per course after first)
      if (yearCourses.length > 1) {
        const bonus = (yearCourses.length - 1);
        totalPoints += bonus;
        pointsBreakdown.courses.push({
          id: null,
          title: `مكافأة الدورات الإضافية (${yearCourses.length - 1} دورة)`,
          year: yearKey,
          points: bonus,
          details: { type: "annual_bonus", count: yearCourses.length }
        });
      }
    });

    // Seminars
    seminars.forEach((s: any) => {
      const points = calculateSeminarPoints(s);
      totalPoints += points;
      const year = new Date(s.date || new Date()).getFullYear();
      pointsBreakdown.seminars.push({
        id: s.id,
        title: s.title,
        year,
        points,
        details: { type: s.type }
      });
    });

    // Workshops
    workshops.forEach((w: any) => {
      const points = calculateWorkshopPoints(w);
      totalPoints += points;
      const year = new Date(w.date || new Date()).getFullYear();
      pointsBreakdown.workshops.push({
        id: w.id,
        title: w.title,
        year,
        points,
        details: { type: w.type }
      });
    });

    // Assignments
    assignments.forEach((a: any) => {
      const points = calculateAssignmentPoints(a);
      totalPoints += points;
      const year = a.assignment_date ? new Date(a.assignment_date).getFullYear() : new Date().getFullYear();
      pointsBreakdown.assignments.push({
        id: a.id,
        title: a.subject || a.assignment_subject,
        year,
        points,
        details: {}
      });
    });

    // Volunteer Work
    volunteerWork.forEach((v: any) => {
      const points = calculateVolunteerWorkPoints(v);
      totalPoints += points;
      const year = new Date(v.start_date || new Date()).getFullYear();
      pointsBreakdown.volunteerWork.push({
        id: v.id,
        title: v.title,
        year,
        points,
        details: { type: v.type }
      });
    });

    // Committees
    committees.forEach((c: any) => {
      const points = calculateCommitteePoints(c);
      totalPoints += points;
      const year = new Date(c.assignment_date || new Date()).getFullYear();
      pointsBreakdown.committees.push({
        id: c.id,
        title: c.committee_name,
        year,
        points,
        details: { type: c.assignment_type }
      });
    });

    // Thank You Books
    thankYouBooks.forEach((b: any) => {
      const points = calculateThankYouBookPoints(b);
      totalPoints += points;
      const y = b.year?.toString() || new Date().getFullYear().toString();
      const organization = (b.granting_organization || "").toLowerCase();
      let sourceType = "جامعة";
      if (organization.includes("دول") || organization.includes("internation") || organization.includes("global")) {
        sourceType = "جهة دولية";
      } else if (organization.includes("وزار") || organization.includes("ministry")) {
        sourceType = "الوزارة";
      }
      pointsBreakdown.thankYouBooks.push({
        id: b.id,
        title: b.granting_organization || "كتاب شكر",
        year: y,
        points,
        details: { sourceType }
      });
    });

    // Supervision
    supervision.forEach((s: any) => {
      const points = calculateSupervisionPoints(s);
      totalPoints += points;
      const year = new Date(s.start_date || new Date()).getFullYear();
      pointsBreakdown.supervision.push({
        id: s.id,
        title: s.student_name,
        year,
        points,
        details: { degreeType: s.degree_type }
      });
    });

    // Scientific Evaluations
    scientificEvaluations.forEach((e: any) => {
      const points = calculateScientificEvaluationPoints(e);
      totalPoints += points;
      const year = e.evaluation_date ? new Date(e.evaluation_date).getFullYear() : new Date().getFullYear();
      pointsBreakdown.scientificEvaluations.push({
        id: e.id,
        title: e.evaluation_title || "تقويم علمي",
        year,
        points,
        details: { type: e.evaluation_type }
      });
    });

    // Journal Memberships
    journalMemberships.forEach((j: any) => {
      const points = calculateJournalManagementPoints(j);
      totalPoints += points;
      const year = j.start_date ? new Date(j.start_date).getFullYear() : new Date().getFullYear();
      const role = (j.role || "").toLowerCase().trim();
      let roleLabel = "محكم";
      if (role === "editor_in_chief" || role.includes("رئيس تحرير") || role.includes("editor-in-chief")) {
        roleLabel = "رئيس تحرير";
      } else if (role === "editorial_board" || role === "assistant_editor" || role.includes("هيئة تحرير")) {
        roleLabel = "هيئة تحرير / محرر مساعد";
      }
      pointsBreakdown.journalMemberships.push({
        id: j.id,
        title: j.journal_name || "مجلة علمية",
        year,
        points,
        details: { role: roleLabel }
      });
    });

    return NextResponse.json({
      totalPoints,
      breakdown: pointsBreakdown,
      summary: {
        research: pointsBreakdown.research.reduce((sum: number, r: any) => sum + r.points, 0),
        conferences: pointsBreakdown.conferences.reduce((sum: number, c: any) => sum + c.points, 0),
        positions: pointsBreakdown.positions.reduce((sum: number, p: any) => sum + p.points, 0),
        publications: pointsBreakdown.publications.reduce((sum: number, p: any) => sum + p.points, 0),
        courses: pointsBreakdown.courses.reduce((sum: number, c: any) => sum + c.points, 0),
        seminars: pointsBreakdown.seminars.reduce((sum: number, s: any) => sum + s.points, 0),
        workshops: pointsBreakdown.workshops.reduce((sum: number, w: any) => sum + w.points, 0),
        assignments: pointsBreakdown.assignments.reduce((sum: number, a: any) => sum + a.points, 0),
        volunteerWork: pointsBreakdown.volunteerWork.reduce((sum: number, v: any) => sum + v.points, 0),
        committees: pointsBreakdown.committees.reduce((sum: number, c: any) => sum + c.points, 0),
        thankYouBooks: pointsBreakdown.thankYouBooks.reduce((sum: number, b: any) => sum + b.points, 0),
        supervision: pointsBreakdown.supervision.reduce((sum: number, s: any) => sum + s.points, 0),
        scientificEvaluations: pointsBreakdown.scientificEvaluations.reduce((sum: number, e: any) => sum + e.points, 0),
        journalMemberships: pointsBreakdown.journalMemberships.reduce((sum: number, j: any) => sum + j.points, 0),
      }
    });
  } catch (error: any) {
    console.error("Error calculating points:", error);
    return NextResponse.json(
      { error: "Failed to calculate points", details: error.message },
      { status: 500 }
    );
  }
}
