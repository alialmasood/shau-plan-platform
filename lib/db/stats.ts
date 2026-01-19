import { query } from "./query";

export function validResearchersUsersWhereSql() {
  // نفس معايير لوحة الإدارة: التدريسيون/الباحثون الحقيقيون فقط
  return `
    u.is_active = true
    AND (
      u.role IS NULL
      OR lower(u.role) IN (
        'teacher',
        'researcher',
        'teaching staff',
        'teaching_staff',
        'teaching-staff'
      )
    )
    AND (u.role IS NULL OR lower(u.role) <> 'admin')
    AND u.username <> 'test_user'
    AND (u.department IS NULL OR u.department <> 'Test Department')
    AND u.full_name IS NOT NULL
    AND btrim(u.full_name) <> ''
    AND u.email IS NOT NULL
    AND btrim(u.email) <> ''
  `;
}

export async function getRegisteredResearchersCount(): Promise<number> {
  // "Teaching Staff" + "Researcher" (مع دعم قيم مخزنة بصيغ مختلفة)
  const res = await query(`
    SELECT COUNT(*)::int AS count
    FROM users u
    WHERE ${validResearchersUsersWhereSql()};
  `);

  return Number(res.rows?.[0]?.count ?? 0) || 0;
}

export async function listValidResearcherUserIds(): Promise<number[]> {
  const res = await query(`
    SELECT u.id
    FROM users u
    WHERE ${validResearchersUsersWhereSql()}
    ORDER BY u.id ASC;
  `);
  return (res.rows ?? []).map((r: any) => Number(r.id)).filter((n) => Number.isFinite(n));
}

async function ensureResearchTableForStats() {
  // جدول research موجود أصلاً عبر واجهات التدريسيين، لكن نضمن وجوده لحساب الإحصاء
  await query(`
    CREATE TABLE IF NOT EXISTS research (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title VARCHAR(500),
      research_type VARCHAR(50),
      author_type VARCHAR(50),
      is_completed BOOLEAN DEFAULT FALSE,
      completion_percentage INTEGER,
      year INTEGER,
      is_published BOOLEAN DEFAULT FALSE,
      publication_month VARCHAR(50),
      published_at TIMESTAMP,
      classifications TEXT[],
      scopus_quartile VARCHAR(50),
      publication_status VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // إضافة أعمدة عند اختلاف المخطط
  const alterQueries = [
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS research_type VARCHAR(50)`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS author_type VARCHAR(50)`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_completed BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS completion_percentage INTEGER`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_month VARCHAR(50)`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS published_at TIMESTAMP`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS classifications TEXT[]`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS scopus_quartile VARCHAR(50)`,
    `ALTER TABLE research ADD COLUMN IF NOT EXISTS publication_status VARCHAR(50)`,
  ];
  for (const q of alterQueries) {
    try {
      await query(q);
    } catch {
      // ignore
    }
  }
}

export type ResearchQuartilesDistribution = {
  total: number;
  q1: number;
  q2: number;
  q3: number;
  q4: number;
  unindexed: number;
};

export async function getResearchQuartilesDistribution(): Promise<ResearchQuartilesDistribution> {
  const exists = await query(
    `SELECT to_regclass('public.research') IS NOT NULL AS exists;`
  );
  if (!exists.rows?.[0]?.exists) {
    return { total: 0, q1: 0, q2: 0, q3: 0, q4: 0, unindexed: 0 };
  }

  await ensureResearchTableForStats();

  const colsRes = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'research';
    `
  );
  const cols = new Set<string>(
    (colsRes.rows ?? []).map((r: any) => String(r.column_name))
  );

  const totalRes = await query(`SELECT COUNT(*)::int AS count FROM research;`);
  const total = Number(totalRes.rows?.[0]?.count ?? 0) || 0;

  if (!cols.has("scopus_quartile")) {
    return { total, q1: 0, q2: 0, q3: 0, q4: 0, unindexed: total };
  }

  const res = await query(`
    WITH normalized AS (
      SELECT
        CASE
          WHEN scopus_quartile IS NULL OR btrim(scopus_quartile::text) = '' THEN 'unindexed'
          WHEN lower(scopus_quartile::text) ~ '(غير\\s*مفهرس|غير\\s*مفهرسة|unindexed|not\\s*indexed|non\\s*-?indexed)' THEN 'unindexed'
          WHEN upper(btrim(scopus_quartile::text)) IN ('Q1','Q2','Q3','Q4')
            THEN upper(btrim(scopus_quartile::text))
          WHEN lower(scopus_quartile::text) ~ '(quartile\\s*1|quartile1|q\\s*1|q1)' THEN 'Q1'
          WHEN lower(scopus_quartile::text) ~ '(quartile\\s*2|quartile2|q\\s*2|q2)' THEN 'Q2'
          WHEN lower(scopus_quartile::text) ~ '(quartile\\s*3|quartile3|q\\s*3|q3)' THEN 'Q3'
          WHEN lower(scopus_quartile::text) ~ '(quartile\\s*4|quartile4|q\\s*4|q4)' THEN 'Q4'
          ELSE 'unindexed'
        END AS bucket
      FROM research
    )
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE bucket = 'Q1')::int AS q1,
      COUNT(*) FILTER (WHERE bucket = 'Q2')::int AS q2,
      COUNT(*) FILTER (WHERE bucket = 'Q3')::int AS q3,
      COUNT(*) FILTER (WHERE bucket = 'Q4')::int AS q4,
      COUNT(*) FILTER (WHERE bucket = 'unindexed')::int AS unindexed
    FROM normalized;
  `);

  const row = res.rows?.[0] ?? {};
  return {
    total: Number(row.total ?? 0) || 0,
    q1: Number(row.q1 ?? 0) || 0,
    q2: Number(row.q2 ?? 0) || 0,
    q3: Number(row.q3 ?? 0) || 0,
    q4: Number(row.q4 ?? 0) || 0,
    unindexed: Number(row.unindexed ?? 0) || 0,
  };
}

export type ResearchMonthlyMetric = "published" | "total";
export type ResearchMonthlyRow = { month: string; count: number };

export async function getResearchMonthlyCounts(args: {
  startInclusive: Date;
  endExclusive: Date;
  metric: ResearchMonthlyMetric;
}): Promise<ResearchMonthlyRow[]> {
  const exists = await query(
    `SELECT to_regclass('public.research') IS NOT NULL AS exists;`
  );
  if (!exists.rows?.[0]?.exists) return [];

  await ensureResearchTableForStats();

  const hasPublishedAtRes = await query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'research'
        AND column_name = 'published_at'
      LIMIT 1;
    `
  );
  const hasPublishedAt = hasPublishedAtRes.rows.length > 0;

  // NOTE:
  // - إذا وجد published_at نستخدمه لتجميع "البحوث المنشورة" حسب الشهر.
  // - إن لم يوجد، نستخدم publication_month + year إن توفرت، وإلا نعود لـ created_at.
  const monthNumExpr = `
    CASE lower(btrim(COALESCE(r.publication_month::text, '')))
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

  const publishedEffectiveDateExpr = `
    COALESCE(
      ${hasPublishedAt ? "r.published_at" : "NULL"},
      CASE
        WHEN r.year IS NOT NULL AND (${monthNumExpr}) IS NOT NULL
          THEN make_date(r.year::int, (${monthNumExpr})::int, 1)
        ELSE NULL
      END,
      COALESCE(r.created_at, r.updated_at, NOW())
    )
  `;

  const totalEffectiveDateExpr = `COALESCE(r.created_at, r.updated_at, NOW())`;

  const effectiveDateExpr =
    args.metric === "published" ? publishedEffectiveDateExpr : totalEffectiveDateExpr;

  const whereMetric =
    args.metric === "published"
      ? `
        AND COALESCE(NULLIF(btrim(r.is_published::text), ''), 'false')
          IN ('true','t','1','yes','y')
      `
      : ``;

  const res = await query(
    `
      SELECT
        to_char(date_trunc('month', ${effectiveDateExpr}), 'YYYY-MM-01') AS month,
        COUNT(*)::int AS count
      FROM research r
      WHERE ${effectiveDateExpr} >= $1
        AND ${effectiveDateExpr} < $2
        ${whereMetric}
      GROUP BY 1
      ORDER BY 1 ASC;
    `,
    [args.startInclusive.toISOString(), args.endExclusive.toISOString()]
  );

  return (res.rows ?? []).map((r: any) => ({
    month: String(r.month),
    count: Number(r.count ?? 0) || 0,
  }));
}

export async function getPublishedResearchPapersCount(): Promise<number> {
  // إذا جدول research غير موجود أصلاً، النتيجة 0
  const exists = await query(
    `SELECT to_regclass('public.research') IS NOT NULL AS exists;`
  );
  if (!exists.rows?.[0]?.exists) return 0;

  // نضمن الأعمدة الأساسية (بدون التأثير على القيم الحالية)
  await ensureResearchTableForStats();

  // حسب تعريف النظام: "منشور" يعتمد فقط على الحقل المحفوظ من الفورم:
  // "هل البحث منشور؟" -> is_published (boolean) داخل جدول research
  const colsRes = await query(
    `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'research';
    `
  );
  const cols = new Set<string>(
    (colsRes.rows ?? []).map((r: any) => String(r.column_name))
  );

  if (!cols.has("is_published")) {
    console.warn("[admin-stats] Missing is_published on research table", {
      columns: Array.from(cols).sort(),
    });
    return 0;
  }

  // IMPORTANT: لمطابقة /teachers/research بالضبط:
  // "منشور" = is_published == true فقط (بدون أي شروط إضافية أو حقول أخرى)
  const res = await query(`
    SELECT COUNT(*)::int AS count
    FROM research r
    WHERE COALESCE(NULLIF(btrim(r.is_published::text), ''), 'false')
      IN ('true','t','1','yes','y');
  `);

  const count = Number(res.rows?.[0]?.count ?? 0) || 0;

  // Debug: إذا النتيجة صفر نطبع تشخيص سريع (بدون بيانات حساسة)
  if (count === 0) {
    try {
      const sample = await query(
        `
          SELECT
            COUNT(*)::int AS total_research,
            COUNT(*) FILTER (WHERE r.is_published IS TRUE)::int AS is_published_true
          FROM research r
        `
      );
      console.warn("[admin-stats] Published research count is 0", {
        columns: Array.from(cols).sort(),
        sample: sample.rows?.[0],
      });

      // توزيع القيم المخزنة في is_published (للتأكد من النوع/القيم)
      const dist = await query(
        `
          SELECT COALESCE(NULLIF(btrim(is_published::text), ''), '(empty)') AS v,
                 COUNT(*)::int AS c
          FROM research
          GROUP BY v
          ORDER BY c DESC;
        `
      );
      console.warn("[admin-stats] is_published distribution", dist.rows);
    } catch {
      // ignore
    }
  }

  return count;
}

export async function getScopusResearchCount(): Promise<number> {
  // مصدر /teachers/research: جدول research وحقـل classifications (array) بقيمة "scopus"
  const exists = await query(
    `SELECT to_regclass('public.research') IS NOT NULL AS exists;`
  );
  if (!exists.rows?.[0]?.exists) return 0;

  await ensureResearchTableForStats();

  const colInfo = await query(
    `
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'research'
        AND column_name = 'classifications'
      LIMIT 1;
    `
  );

  if (colInfo.rows.length === 0) {
    const allCols = await query(
      `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'research';
      `
    );
    console.warn("[admin-stats] Missing classifications on research table", {
      columns: (allCols.rows ?? []).map((r: any) => r.column_name).sort(),
    });
    return 0;
  }

  const dataType = String(colInfo.rows[0].data_type ?? "");

  // EXACT match with teachers page logic:
  // research.classifications?.includes("scopus")
  // ملاحظة: صفحة التدريسيين قد تستقبل classifications كـ array أو string، لذلك نغطي الحالتين.
  if (dataType === "ARRAY") {
    const res = await query(`
      SELECT COUNT(*)::int AS count
      FROM research r
      WHERE COALESCE('scopus' = ANY(r.classifications), false);
    `);
    return Number(res.rows?.[0]?.count ?? 0) || 0;
  }

  // fallback إذا كانت classifications مخزّنة كنص (مثلاً "{scopus,global}" أو "scopus,global" أو JSON)
  const res2 = await query(`
    SELECT COUNT(*)::int AS count
    FROM research r
    WHERE POSITION('scopus' IN lower(COALESCE(r.classifications::text, ''))) > 0;
  `);
  return Number(res2.rows?.[0]?.count ?? 0) || 0;
}

