import { query } from "./query";

export type ResearchSummaryStats = {
  total: number;
  planned: number;
  completed: number;
  published: number;
  notCompleted: number;
  global: number;
  local: number;
  single: number;
  thomsonReuters: number;
  scopus: number;
};

export type ActivitiesSummaryStats = {
  conferences: number;
  seminars: number;
  courses: number;
  workshops: number;
  assignments: number;
  thankYouBooks: number;
  committees: number;
  participationCertificates: number;
  journalMemberships: number;
  supervision: number;
  positions: number;
  scientificEvaluations: number;
  volunteerWork: number;
};

export type SystemSummary = {
  research: ResearchSummaryStats;
  activities: ActivitiesSummaryStats;
};

async function tableExists(table: string): Promise<boolean> {
  const res = await query(
    `SELECT to_regclass($1) IS NOT NULL AS exists;`,
    [`public.${table}`]
  );
  return Boolean(res.rows?.[0]?.exists);
}

async function countAll(table: string): Promise<number> {
  if (!(await tableExists(table))) return 0;
  const res = await query(`SELECT COUNT(*)::int AS count FROM ${table};`);
  return Number(res.rows?.[0]?.count ?? 0) || 0;
}

async function researchClassificationsPredicate(token: string): Promise<string> {
  // يحاكي سلوك صفحة /teachers/research:
  // r.classifications?.includes(token)
  // مع دعم تخزين classifications كـ TEXT[] أو كنص
  const colInfo = await query(
    `
      SELECT data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'research'
        AND column_name = 'classifications'
      LIMIT 1;
    `
  );
  const dt = String(colInfo.rows?.[0]?.data_type ?? "");
  if (dt === "ARRAY") {
    return `COALESCE($$${token}$$ = ANY(classifications), false)`;
  }
  return `POSITION($$${token}$$ IN lower(COALESCE(classifications::text, ''))) > 0`;
}

export async function getResearchSummaryStats(): Promise<ResearchSummaryStats> {
  if (!(await tableExists("research"))) {
    return {
      total: 0,
      planned: 0,
      completed: 0,
      published: 0,
      notCompleted: 0,
      global: 0,
      local: 0,
      single: 0,
      thomsonReuters: 0,
      scopus: 0,
    };
  }

  // predicates (match teachers/research logic)
  const pGlobal = await researchClassificationsPredicate("global");
  const pLocal = await researchClassificationsPredicate("local");
  const pScopus = await researchClassificationsPredicate("scopus");
  const pThomson = await researchClassificationsPredicate("thomson_reuters");

  const res = await query(
    `
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE research_type = 'planned')::int AS planned,
        COUNT(*) FILTER (WHERE COALESCE(is_completed, false) = true)::int AS completed,
        COUNT(*) FILTER (WHERE COALESCE(is_published, false) = true)::int AS published,
        COUNT(*) FILTER (WHERE COALESCE(is_completed, false) = false)::int AS "notCompleted",
        COUNT(*) FILTER (WHERE ${pGlobal})::int AS global,
        COUNT(*) FILTER (WHERE ${pLocal})::int AS local,
        COUNT(*) FILTER (WHERE author_type = 'single')::int AS single,
        COUNT(*) FILTER (WHERE ${pThomson})::int AS "thomsonReuters",
        COUNT(*) FILTER (WHERE ${pScopus})::int AS scopus
      FROM research;
    `
  );

  const row = res.rows?.[0] ?? {};
  return {
    total: Number(row.total ?? 0) || 0,
    planned: Number(row.planned ?? 0) || 0,
    completed: Number(row.completed ?? 0) || 0,
    published: Number(row.published ?? 0) || 0,
    notCompleted: Number(row.notCompleted ?? 0) || 0,
    global: Number(row.global ?? 0) || 0,
    local: Number(row.local ?? 0) || 0,
    single: Number(row.single ?? 0) || 0,
    thomsonReuters: Number(row.thomsonReuters ?? 0) || 0,
    scopus: Number(row.scopus ?? 0) || 0,
  };
}

export async function getActivitiesSummaryStats(): Promise<ActivitiesSummaryStats> {
  // كل هذه الجداول هي نفس مصادر صفحات التدريسيين (GET by userId)
  const [
    conferences,
    seminars,
    courses,
    workshops,
    assignments,
    thankYouBooks,
    committees,
    participationCertificates,
    journalMemberships,
    supervision,
    positions,
    scientificEvaluations,
    volunteerWork,
  ] = await Promise.all([
    countAll("conferences"),
    countAll("seminars"),
    countAll("courses"),
    countAll("workshops"),
    countAll("assignments"),
    countAll("thank_you_books"),
    countAll("committees"),
    countAll("participation_certificates"),
    countAll("journal_memberships"),
    countAll("supervision"),
    countAll("positions"),
    countAll("scientific_evaluations"),
    countAll("volunteer_work"),
  ]);

  return {
    conferences,
    seminars,
    courses,
    workshops,
    assignments,
    thankYouBooks,
    committees,
    participationCertificates,
    journalMemberships,
    supervision,
    positions,
    scientificEvaluations,
    volunteerWork,
  };
}

export async function getSystemSummary(): Promise<SystemSummary> {
  const [research, activities] = await Promise.all([
    getResearchSummaryStats(),
    getActivitiesSummaryStats(),
  ]);
  return { research, activities };
}

