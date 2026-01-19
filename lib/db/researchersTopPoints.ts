import { query } from "./query";
import { validResearchersUsersWhereSql } from "./stats";
import { calculateScientificPointsForUser } from "@/lib/services/scientificPoints";

export type TopResearcherRow = {
  userId: number;
  fullName: string;
  departmentCode: string | null;
  departmentId: number | null;
  departmentNameAr: string | null;
  points: number;
};

async function pMap<T, R>(
  items: T[],
  concurrency: number,
  mapper: (item: T, idx: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const idx = nextIndex++;
      if (idx >= items.length) return;
      results[idx] = await mapper(items[idx]!, idx);
    }
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, () => worker());
  await Promise.all(workers);
  return results;
}

export async function getTopResearchersByScientificPoints(limit = 5): Promise<TopResearcherRow[]> {
  const res = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.department AS department_code,
        d.id AS department_id,
        d.name_ar AS department_name_ar
      FROM users u
      LEFT JOIN departments d
        ON d.code = u.department
       AND d.is_active = true
      WHERE ${validResearchersUsersWhereSql()}
      ORDER BY u.id ASC;
    `
  );

  const users = (res.rows ?? []).map((r: any) => ({
    userId: Number(r.id),
    fullName: String(r.full_name ?? "").trim(),
    departmentCode: r.department_code ? String(r.department_code) : null,
    departmentId: r.department_id !== null && r.department_id !== undefined ? Number(r.department_id) : null,
    departmentNameAr: r.department_name_ar ? String(r.department_name_ar) : null,
  }))
  .filter((u) => Number.isFinite(u.userId) && u.fullName);

  if (users.length === 0) return [];

  const scored = await pMap(
    users,
    6,
    async (u) => {
      try {
        const points = await calculateScientificPointsForUser(u.userId);
        return { ...u, points: Number(points ?? 0) || 0 };
      } catch {
        return { ...u, points: 0 };
      }
    }
  );

  scored.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    return a.fullName.localeCompare(b.fullName, "ar");
  });

  return scored.slice(0, Math.max(0, limit));
}

