import { query } from "../db/query";

// هذا الملف يقدّم نفس منطق /api/teachers/points لحساب "النقاط العلمية"
// لا يغيّر أي بيانات خام في DB — حساب فقط.

type PointsBreakdown = {
  research: Array<{ id: number | null; title: string; year: string; points: number; details: any }>;
  conferences: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  positions: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  publications: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  courses: Array<{ id: number | null; title: string; year: string; points: number; details: any }>;
  seminars: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  workshops: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  assignments: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  volunteerWork: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  committees: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  thankYouBooks: Array<{ id: number; title: string; year: string; points: number; details: any }>;
  supervision: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  scientificEvaluations: Array<{ id: number; title: string; year: number; points: number; details: any }>;
  journalMemberships: Array<{ id: number; title: string; year: number; points: number; details: any }>;
};

export type PointsData = {
  totalPoints: number;
  breakdown: PointsBreakdown;
  summary: {
    research: number;
    conferences: number;
    positions: number;
    publications: number;
    courses: number;
    seminars: number;
    workshops: number;
    assignments: number;
    volunteerWork: number;
    committees: number;
    thankYouBooks: number;
    supervision: number;
    scientificEvaluations: number;
    journalMemberships: number;
  };
};

// ==== نفس دوال الحساب الموجودة في /api/teachers/points ====

function calculateResearchPoints(research: any): number {
  if (!research) return 0;

  let basePoints = 0;
  if (!research.is_completed) {
    basePoints = 1;
  } else if (research.is_completed && !research.is_published) {
    basePoints = 3;
  } else if (research.is_published) {
    const hasGlobal = research.classifications?.includes("global") || false;
    basePoints = hasGlobal ? 10 : 5;
  }

  let scopusPoints = 0;
  if (research.scopus_quartile) {
    switch (String(research.scopus_quartile).toUpperCase()) {
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
  const isParticipant =
    conference.type === "participant" || conference.type === "باحث";
  const isCommittee = conference.is_committee_member === true;

  if (isCommittee) return isGlobal ? 12 : 8;
  if (isParticipant) return isGlobal ? 8 : 5;
  return isGlobal ? 4 : 2;
}

function calculatePositionPoints(position: any): number {
  if (!position || !position.position_title) return 0;
  const title = String(position.position_title).toLowerCase();
  if (title.includes("عميد") || title.includes("معاون")) return 20;
  if (title.includes("رئيس قسم")) return 15;
  if (title.includes("مقرر")) return 10;
  return 0;
}

function calculatePublicationPoints(publication: any): number {
  if (!publication) return 0;
  const type = String(publication.publication_type ?? "").toLowerCase();
  if (type.includes("كتاب") || type.includes("book")) return 20;
  if (type.includes("فصل") || type.includes("chapter")) return 10;
  return 5;
}

function calculateCoursePoints(course: any): number {
  if (!course) return 0;
  return course.type === "lecturer" ? 8 : 3;
}

function calculateSeminarPoints(seminar: any): number {
  if (!seminar) return 0;
  return seminar.type === "lecturer" ? 5 : 2;
}

function calculateWorkshopPoints(workshop: any): number {
  if (!workshop) return 0;
  return workshop.type === "lecturer" ? 6 : 3;
}

function calculateAssignmentPoints(assignment: any): number {
  if (!assignment) return 0;
  const subject = String(assignment.subject ?? "").toLowerCase();
  if (subject.includes("وزار") || subject.includes("وزارة")) return 10;
  return 6;
}

function calculateVolunteerWorkPoints(work: any): number {
  if (!work) return 0;
  const title = String(work.title ?? "").toLowerCase();
  const type = String(work.type ?? "").toLowerCase();
  if (title.includes("وطن") || title.includes("جامع") || type.includes("وطن")) {
    return 5;
  }
  return 2;
}

function calculateCommitteePoints(committee: any): number {
  if (!committee) return 0;
  const assignmentType = String(committee.assignment_type ?? "").toLowerCase();
  return assignmentType.includes("رئيس") ? 7 : 4;
}

function calculateThankYouBookPoints(book: any): number {
  if (!book) return 0;
  const organization = String(book.granting_organization ?? "").toLowerCase();

  if (
    organization.includes("دول") ||
    organization.includes("internation") ||
    organization.includes("global") ||
    organization.includes("world") ||
    organization.includes("أجنبي")
  ) {
    return 10;
  }

  if (
    organization.includes("وزار") ||
    organization.includes("وزارة") ||
    organization.includes("ministry") ||
    organization.includes("minister")
  ) {
    return 6;
  }

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

  return 3;
}

function calculateSupervisionPoints(supervision: any): number {
  if (!supervision) return 0;
  const degreeType = String(supervision.degree_type ?? "").toLowerCase();
  if (degreeType.includes("دكتوراه") || degreeType.includes("phd")) return 10;
  if (degreeType.includes("ماجستير") || degreeType.includes("master")) return 6;
  if (degreeType.includes("بكالوريوس") || degreeType.includes("bachelor")) return 3;
  return 0;
}

function calculateScientificEvaluationPoints(evaluation: any): number {
  if (!evaluation) return 0;
  const type = String(evaluation.evaluation_type ?? "").toLowerCase();
  if (type.includes("دولي") || type.includes("internation")) return 5;
  return 2;
}

function calculateJournalManagementPoints(membership: any): number {
  if (!membership) return 0;
  const role = String(membership.role ?? "").toLowerCase().trim();

  if (
    role === "editor_in_chief" ||
    role.includes("رئيس تحرير") ||
    role.includes("editor-in-chief") ||
    role.includes("editor in chief") ||
    role === "chief_editor"
  ) {
    return 20;
  }

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

  if (
    role === "reviewer" ||
    role.includes("محكم") ||
    role.includes("reviewer") ||
    role.includes("referee")
  ) {
    return 5;
  }

  return 5;
}

export type PointsDateRange = {
  startInclusive: Date;
  endExclusive: Date;
};

function iso(d: Date) {
  return d.toISOString();
}

async function fetchUserActivities(userId: number, range?: PointsDateRange) {
  const hasRange = Boolean(range?.startInclusive && range?.endExclusive);
  const rangeSql = (expr: string) =>
    hasRange ? ` AND ${expr} >= $2 AND ${expr} < $3 ` : "";
  const params = hasRange ? [userId, iso(range!.startInclusive), iso(range!.endExclusive)] : [userId];

  // لحقول الشهر النصية (مثل thank_you_books.month) — نطبعها لأرقام
  const monthNumExpr = `
    CASE lower(btrim(COALESCE(month::text, '')))
      WHEN 'يناير' THEN 1
      WHEN 'فبراير' THEN 2
      WHEN 'مارس' THEN 3
      WHEN 'أبريل' THEN 4
      WHEN 'ابريل' THEN 4
      WHEN 'مايو' THEN 5
      WHEN 'يونيو' THEN 6
      WHEN 'يوليو' THEN 7
      WHEN 'أغسطس' THEN 8
      WHEN 'اغسطس' THEN 8
      WHEN 'سبتمبر' THEN 9
      WHEN 'أكتوبر' THEN 10
      WHEN 'اكتوبر' THEN 10
      WHEN 'نوفمبر' THEN 11
      WHEN 'ديسمبر' THEN 12
      WHEN 'january' THEN 1
      WHEN 'february' THEN 2
      WHEN 'march' THEN 3
      WHEN 'april' THEN 4
      WHEN 'may' THEN 5
      WHEN 'june' THEN 6
      WHEN 'july' THEN 7
      WHEN 'august' THEN 8
      WHEN 'september' THEN 9
      WHEN 'october' THEN 10
      WHEN 'november' THEN 11
      WHEN 'december' THEN 12
      ELSE NULL
    END
  `;

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
    query(
      `
        SELECT
          id, user_id,
          COALESCE(research_title, title) AS title,
          research_type, author_type, is_completed, year, is_published,
          classifications, scopus_quartile,
          created_at, updated_at
        FROM research
        WHERE user_id = $1
        ${rangeSql("COALESCE(created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, conference_title AS title, date, scope, type, is_committee_member
        FROM conferences
        WHERE user_id = $1
        ${rangeSql("date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, position_title, start_date
        FROM positions
        WHERE user_id = $1
        ${rangeSql("COALESCE(start_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, COALESCE(publication_title, title) AS title, publication_date, publication_type, created_at, updated_at
        FROM publications
        WHERE user_id = $1
        ${rangeSql("COALESCE(publication_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, course_name AS title, date, type
        FROM courses
        WHERE user_id = $1
        ${rangeSql("date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, seminar_title AS title, date, type
        FROM seminars
        WHERE user_id = $1
        ${rangeSql("date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, workshop_title AS title, date, type
        FROM workshops
        WHERE user_id = $1
        ${rangeSql("date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, COALESCE(subject, assignment_subject) AS subject, assignment_date
        FROM assignments
        WHERE user_id = $1
        ${rangeSql("assignment_date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, COALESCE(work_title, title) AS title, start_date, COALESCE(work_type, type) AS type
        FROM volunteer_work
        WHERE user_id = $1
        ${rangeSql("COALESCE(start_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, committee_name, assignment_date, assignment_type
        FROM committees
        WHERE user_id = $1
        ${rangeSql("assignment_date")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, granting_organization, month, year
        FROM thank_you_books
        WHERE user_id = $1
        ${
          hasRange
            ? ` AND COALESCE(
                  CASE
                    WHEN year IS NOT NULL AND (${monthNumExpr}) IS NOT NULL THEN make_date(year::int, (${monthNumExpr})::int, 1)
                    WHEN year IS NOT NULL THEN make_date(year::int, 1, 1)
                    ELSE NULL
                  END,
                  created_at,
                  updated_at,
                  NOW()
                ) >= $2
                AND COALESCE(
                  CASE
                    WHEN year IS NOT NULL AND (${monthNumExpr}) IS NOT NULL THEN make_date(year::int, (${monthNumExpr})::int, 1)
                    WHEN year IS NOT NULL THEN make_date(year::int, 1, 1)
                    ELSE NULL
                  END,
                  created_at,
                  updated_at,
                  NOW()
                ) < $3 `
            : ""
        }
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, student_name, start_date, degree_type
        FROM supervision
        WHERE user_id = $1
        ${rangeSql("COALESCE(start_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, evaluation_title, evaluation_date, evaluation_type
        FROM scientific_evaluations
        WHERE user_id = $1
        ${rangeSql("COALESCE(evaluation_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
    query(
      `
        SELECT id, user_id, journal_name, start_date, role
        FROM journal_memberships
        WHERE user_id = $1
        ${rangeSql("COALESCE(start_date, created_at, updated_at, NOW())")}
      `,
      params
    ).catch(() => ({ rows: [] as any[] })),
  ]);

  return {
    research: researchResult.rows || [],
    conferences: conferencesResult.rows || [],
    positions: positionsResult.rows || [],
    publications: publicationsResult.rows || [],
    courses: coursesResult.rows || [],
    seminars: seminarsResult.rows || [],
    workshops: workshopsResult.rows || [],
    assignments: assignmentsResult.rows || [],
    volunteerWork: volunteerWorkResult.rows || [],
    committees: committeesResult.rows || [],
    thankYouBooks: thankYouBooksResult.rows || [],
    supervision: supervisionResult.rows || [],
    scientificEvaluations: scientificEvaluationsResult.rows || [],
    journalMemberships: journalMembershipsResult.rows || [],
  };
}

export async function calculateScientificPointsForUser(
  userId: number,
  range?: PointsDateRange
): Promise<number> {
  const data = await calculateScientificPointsDataForUser(userId, range);
  return data.totalPoints;
}

export async function calculateScientificPointsDataForUser(
  userId: number,
  range?: PointsDateRange
): Promise<PointsData> {
  const {
    research,
    conferences,
    positions,
    publications,
    courses,
    seminars,
    workshops,
    assignments,
    volunteerWork,
    committees,
    thankYouBooks,
    supervision,
    scientificEvaluations,
    journalMemberships,
  } = await fetchUserActivities(userId, range);

  const breakdown: PointsBreakdown = {
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

  // Research points + annual bonus
  const researchByYear: Record<string, any[]> = {};
  research.forEach((r: any) => {
    const y = r.year?.toString() || new Date().getFullYear().toString();
    if (!researchByYear[y]) researchByYear[y] = [];
    researchByYear[y].push(r);
  });

  Object.keys(researchByYear).forEach((yearKey) => {
    const yearResearch = researchByYear[yearKey];
    let yearResearchPoints = 0;

    yearResearch.forEach((r: any) => {
      const points = calculateResearchPoints(r);
      yearResearchPoints += points;
      breakdown.research.push({
        id: r.id,
        title: r.title,
        year: yearKey,
        points,
        details: {
          status: r.is_completed
            ? r.is_published
              ? r.classifications?.includes("global")
                ? "منشور عالمي"
                : "منشور محلي"
              : "منجز غير منشور"
            : "غير منجز",
          scopusQuartile: r.scopus_quartile || "غير سكوبس",
        },
      });
    });

    const researchCount = yearResearch.length;
    let bonus = 0;
    if (researchCount >= 5) bonus = 10;
    else if (researchCount >= 3) bonus = 5;
    else if (researchCount >= 1) bonus = 2;

    if (bonus > 0) {
      breakdown.research.push({
        id: null,
        title: `مكافأة عدد البحوث (${researchCount} بحث)`,
        year: yearKey,
        points: bonus,
        details: { type: "annual_bonus", count: researchCount },
      });
      yearResearchPoints += bonus;
    }

    totalPoints += yearResearchPoints;
  });

  // Conferences
  conferences.forEach((c: any) => {
    const points = calculateConferencePoints(c);
    totalPoints += points;
    breakdown.conferences.push({
      id: c.id,
      title: c.title || c.conference_title,
      year: c.date ? new Date(c.date).getFullYear() : new Date().getFullYear(),
      points,
      details: { scope: c.scope, type: c.type, isCommittee: c.is_committee_member },
    });
  });

  // Positions
  positions.forEach((p: any) => {
    const points = calculatePositionPoints(p);
    totalPoints += points;
    const year = new Date(p.start_date || new Date()).getFullYear();
    breakdown.positions.push({
      id: p.id,
      title: p.position_title,
      year,
      points,
      details: {},
    });
  });

  // Publications
  publications.forEach((p: any) => {
    const points = calculatePublicationPoints(p);
    totalPoints += points;
    const year = new Date(p.publication_date || new Date()).getFullYear();
    breakdown.publications.push({
      id: p.id,
      title: p.title,
      year,
      points,
      details: { type: p.publication_type },
    });
  });

  // Courses + bonus
  const coursesByYear: Record<string, any[]> = {};
  courses.forEach((c: any) => {
    const y = new Date(c.date || new Date()).getFullYear().toString();
    if (!coursesByYear[y]) coursesByYear[y] = [];
    coursesByYear[y].push(c);
  });

  Object.keys(coursesByYear).forEach((yearKey) => {
    const yearCourses = coursesByYear[yearKey];
    yearCourses.forEach((c: any) => {
      const points = calculateCoursePoints(c);
      totalPoints += points;
      breakdown.courses.push({
        id: c.id,
        title: c.course_name,
        year: yearKey,
        points,
        details: { type: c.type },
      });
    });

    if (yearCourses.length > 1) {
      const bonus = yearCourses.length - 1;
      totalPoints += bonus;
      breakdown.courses.push({
        id: null,
        title: `مكافأة الدورات الإضافية (${yearCourses.length - 1} دورة)`,
        year: yearKey,
        points: bonus,
        details: { type: "annual_bonus", count: yearCourses.length },
      });
    }
  });

  // Seminars
  seminars.forEach((s: any) => {
    const points = calculateSeminarPoints(s);
    totalPoints += points;
    const year = new Date(s.date || new Date()).getFullYear();
    breakdown.seminars.push({ id: s.id, title: s.title, year, points, details: { type: s.type } });
  });

  // Workshops
  workshops.forEach((w: any) => {
    const points = calculateWorkshopPoints(w);
    totalPoints += points;
    const year = new Date(w.date || new Date()).getFullYear();
    breakdown.workshops.push({ id: w.id, title: w.title, year, points, details: { type: w.type } });
  });

  // Assignments
  assignments.forEach((a: any) => {
    const points = calculateAssignmentPoints(a);
    totalPoints += points;
    const year = a.assignment_date ? new Date(a.assignment_date).getFullYear() : new Date().getFullYear();
    breakdown.assignments.push({
      id: a.id,
      title: a.subject || a.assignment_subject,
      year,
      points,
      details: {},
    });
  });

  // Volunteer Work
  volunteerWork.forEach((v: any) => {
    const points = calculateVolunteerWorkPoints(v);
    totalPoints += points;
    const year = new Date(v.start_date || new Date()).getFullYear();
    breakdown.volunteerWork.push({ id: v.id, title: v.title, year, points, details: { type: v.type } });
  });

  // Committees
  committees.forEach((c: any) => {
    const points = calculateCommitteePoints(c);
    totalPoints += points;
    const year = new Date(c.assignment_date || new Date()).getFullYear();
    breakdown.committees.push({
      id: c.id,
      title: c.committee_name,
      year,
      points,
      details: { type: c.assignment_type },
    });
  });

  // Thank You Books
  thankYouBooks.forEach((b: any) => {
    const points = calculateThankYouBookPoints(b);
    totalPoints += points;
    const y = b.year?.toString() || new Date().getFullYear().toString();
    const organization = String(b.granting_organization || "").toLowerCase();
    let sourceType = "جامعة";
    if (organization.includes("دول") || organization.includes("internation") || organization.includes("global")) {
      sourceType = "جهة دولية";
    } else if (organization.includes("وزار") || organization.includes("ministry")) {
      sourceType = "الوزارة";
    }
    breakdown.thankYouBooks.push({
      id: b.id,
      title: b.granting_organization || "كتاب شكر",
      year: y,
      points,
      details: { sourceType },
    });
  });

  // Supervision
  supervision.forEach((s: any) => {
    const points = calculateSupervisionPoints(s);
    totalPoints += points;
    const year = new Date(s.start_date || new Date()).getFullYear();
    breakdown.supervision.push({
      id: s.id,
      title: s.student_name,
      year,
      points,
      details: { degreeType: s.degree_type },
    });
  });

  // Scientific Evaluations
  scientificEvaluations.forEach((e: any) => {
    const points = calculateScientificEvaluationPoints(e);
    totalPoints += points;
    const year = e.evaluation_date ? new Date(e.evaluation_date).getFullYear() : new Date().getFullYear();
    breakdown.scientificEvaluations.push({
      id: e.id,
      title: e.evaluation_title || "تقويم علمي",
      year,
      points,
      details: { type: e.evaluation_type },
    });
  });

  // Journal Memberships
  journalMemberships.forEach((j: any) => {
    const points = calculateJournalManagementPoints(j);
    totalPoints += points;
    const year = j.start_date ? new Date(j.start_date).getFullYear() : new Date().getFullYear();
    const role = String(j.role || "").toLowerCase().trim();
    let roleLabel = "محكم";
    if (role === "editor_in_chief" || role.includes("رئيس تحرير") || role.includes("editor-in-chief")) {
      roleLabel = "رئيس تحرير";
    } else if (role === "editorial_board" || role === "assistant_editor" || role.includes("هيئة تحرير")) {
      roleLabel = "هيئة تحرير / محرر مساعد";
    }
    breakdown.journalMemberships.push({
      id: j.id,
      title: j.journal_name || "مجلة علمية",
      year,
      points,
      details: { role: roleLabel },
    });
  });

  const summary = {
    research: breakdown.research.reduce((sum, r) => sum + r.points, 0),
    conferences: breakdown.conferences.reduce((sum, c) => sum + c.points, 0),
    positions: breakdown.positions.reduce((sum, p) => sum + p.points, 0),
    publications: breakdown.publications.reduce((sum, p) => sum + p.points, 0),
    courses: breakdown.courses.reduce((sum, c) => sum + c.points, 0),
    seminars: breakdown.seminars.reduce((sum, s) => sum + s.points, 0),
    workshops: breakdown.workshops.reduce((sum, w) => sum + w.points, 0),
    assignments: breakdown.assignments.reduce((sum, a) => sum + a.points, 0),
    volunteerWork: breakdown.volunteerWork.reduce((sum, v) => sum + v.points, 0),
    committees: breakdown.committees.reduce((sum, c) => sum + c.points, 0),
    thankYouBooks: breakdown.thankYouBooks.reduce((sum, b) => sum + b.points, 0),
    supervision: breakdown.supervision.reduce((sum, s) => sum + s.points, 0),
    scientificEvaluations: breakdown.scientificEvaluations.reduce((sum, e) => sum + e.points, 0),
    journalMemberships: breakdown.journalMemberships.reduce((sum, j) => sum + j.points, 0),
  };

  return { totalPoints, breakdown, summary };
}

