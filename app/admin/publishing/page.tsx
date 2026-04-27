import { query } from "@/lib/db/query";
import PublishingPageShell from "./PublishingPageShell";

type DbRow = {
  user_id: number;
  researcher_name: string;
  researches_count: number;
  research_titles: string[] | null;
  publication_years: number[] | null;
};

async function hasColumn(tableName: string, columnName: string): Promise<boolean> {
  const res = await query(
    `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = $1 AND column_name = $2
      ) AS exists
    `,
    [tableName, columnName]
  ).catch(() => ({ rows: [{ exists: false }] }));
  return Boolean(res.rows?.[0]?.exists);
}

export default async function AdminPublishingPage() {
  const hasResearchTitle = await hasColumn("research", "research_title");
  const titleExpr = hasResearchTitle
    ? "COALESCE(NULLIF(r.title, ''), NULLIF(r.research_title, ''))"
    : "NULLIF(r.title, '')";

  const result = await query(
    `
      SELECT
        u.id AS user_id,
        COALESCE(NULLIF(u.full_name, ''), u.username) AS researcher_name,
        COUNT(r.id)::int AS researches_count,
        COALESCE(
          ARRAY_AGG(
            DISTINCT ${titleExpr}
          ) FILTER (
            WHERE ${titleExpr} IS NOT NULL
          ),
          '{}'
        ) AS research_titles,
        COALESCE(
          ARRAY_AGG(
            DISTINCT r.year
          ) FILTER (
            WHERE r.year IS NOT NULL
          ),
          '{}'
        ) AS publication_years
      FROM users u
      LEFT JOIN research r
        ON CASE
          WHEN r.user_id::text ~ '^[0-9]+$' THEN (r.user_id::text)::int
          ELSE NULL
        END = u.id
      WHERE u.role = 'teacher'
      GROUP BY u.id, u.full_name, u.username
      ORDER BY researches_count DESC, researcher_name ASC;
    `
  ).catch(() => ({ rows: [] as DbRow[] }));

  const rows = (result.rows as DbRow[]).map((row) => ({
    userId: Number(row.user_id),
    researcherName: String(row.researcher_name || "بدون اسم"),
    researchesCount: Number(row.researches_count || 0),
    researchTitles: Array.isArray(row.research_titles)
      ? row.research_titles.filter((t): t is string => Boolean(t && t.trim()))
      : [],
    publicationYears: Array.isArray(row.publication_years)
      ? row.publication_years
          .map((y) => Number(y))
          .filter((y) => Number.isFinite(y))
          .sort((a, b) => b - a)
      : [],
  }));

  return <PublishingPageShell rows={rows} />;
}

