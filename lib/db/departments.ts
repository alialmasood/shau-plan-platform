import { query } from "./query";

export interface DepartmentRow {
  id: number;
  code: string;
  name_ar: string;
  is_active: boolean;
}

export interface DepartmentWithStats {
  id: number;
  code: string;
  nameAr: string;
  researchersCount: number;
}

export async function listDepartmentsWithResearchersCount(): Promise<
  DepartmentWithStats[]
> {
  const res = await query(
    `
      SELECT
        d.id,
        d.code,
        d.name_ar,
        COALESCE(COUNT(u.id), 0)::int AS "researchersCount"
      FROM departments d
      LEFT JOIN users u
        ON u.department = d.code
       AND u.is_active = true
       AND (u.role IS NULL OR u.role IN ('teacher','researcher'))
      WHERE d.is_active = true
      GROUP BY d.id, d.code, d.name_ar
      ORDER BY d.name_ar ASC;
    `
  );

  return (res.rows ?? []).map((r: any) => ({
    id: Number(r.id),
    code: String(r.code),
    nameAr: String(r.name_ar),
    researchersCount: Number(r.researchersCount ?? 0),
  }));
}

export async function getDepartmentById(id: number): Promise<DepartmentRow | null> {
  const res = await query(
    `
      SELECT id, code, name_ar, is_active
      FROM departments
      WHERE id = $1
      LIMIT 1;
    `,
    [id]
  );

  return (res.rows?.[0] as DepartmentRow | undefined) ?? null;
}

