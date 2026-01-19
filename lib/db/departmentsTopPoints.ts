import { query } from "./query";
import { ensureDepartmentsReady } from "./schema";
import { validResearchersUsersWhereSql } from "./stats";
import { calculateScientificPointsForUser } from "@/lib/services/scientificPoints";

export type DepartmentTopPointsRow = {
  id: number;
  code: string;
  nameAr: string;
  researchersCount: number;
  totalPoints: number;
  avgPoints: number;
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

export async function getTopDepartmentsByScientificPoints(limit = 5): Promise<DepartmentTopPointsRow[]> {
  await ensureDepartmentsReady();

  const depsRes = await query(
    `
      SELECT id, code, name_ar
      FROM departments
      WHERE is_active = true
      ORDER BY id ASC;
    `
  );
  const departments = (depsRes.rows ?? []).map((r: any) => ({
    id: Number(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
  }));
  if (departments.length === 0) return [];

  // جميع الباحثين الحقيقيين + قسمهم (نفس فلاتر لوحة الإدارة)
  const usersRes = await query(
    `
      SELECT u.id, u.department
      FROM users u
      WHERE ${validResearchersUsersWhereSql()}
        AND u.department IS NOT NULL
        AND btrim(u.department) <> '';
    `
  );

  const byDept = new Map<string, number[]>();
  for (const r of usersRes.rows ?? []) {
    const userId = Number((r as any).id);
    const deptCode = String((r as any).department ?? "").trim();
    if (!deptCode || !Number.isFinite(userId)) continue;
    const arr = byDept.get(deptCode) ?? [];
    arr.push(userId);
    byDept.set(deptCode, arr);
  }

  // نحسب نقاط كل قسم (مجموع نقاط باحثيه)
  const computed = await pMap(
    departments,
    4,
    async (d) => {
      const userIds = byDept.get(d.code) ?? [];
      if (userIds.length === 0) {
        return {
          ...d,
          researchersCount: 0,
          totalPoints: 0,
          avgPoints: 0,
        };
      }

      const points = await pMap(
        userIds,
        6,
        async (id) => {
          try {
            return await calculateScientificPointsForUser(id);
          } catch {
            return 0;
          }
        }
      );

      const totalPoints = points.reduce((s, n) => s + (Number(n) || 0), 0);
      const researchersCount = userIds.length;
      const avgPoints = researchersCount > 0 ? totalPoints / researchersCount : 0;

      return {
        ...d,
        researchersCount,
        totalPoints,
        avgPoints,
      };
    }
  );

  const withResearchers = computed.filter((d) => d.researchersCount > 0);
  if (withResearchers.length === 0) return [];

  withResearchers.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.researchersCount !== a.researchersCount) return b.researchersCount - a.researchersCount;
    return a.nameAr.localeCompare(b.nameAr, "ar");
  });

  return withResearchers.slice(0, Math.max(0, limit));
}

