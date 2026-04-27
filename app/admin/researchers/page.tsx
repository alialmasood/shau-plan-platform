import { query } from "@/lib/db/query";
import { formatEnglishDepartmentName } from "@/lib/utils/formatting";
import ResearchersPageShell from "./ResearchersPageShell";

type DbRow = {
  id: number;
  full_name: string | null;
  username: string;
  email: string | null;
  department: string | null;
  department_name_ar: string | null;
  academic_title: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | Date | null;
};

export default async function AdminResearchersPage() {
  const result = await query(
    `
      SELECT
        u.id,
        u.full_name,
        u.username,
        u.email,
        u.department,
        d.name_ar AS department_name_ar,
        u.academic_title,
        u.phone,
        u.is_active,
        u.created_at
      FROM users u
      LEFT JOIN departments d
        ON d.code = u.department
      WHERE u.role = 'teacher'
      ORDER BY u.created_at DESC, u.id DESC;
    `
  ).catch(() => ({ rows: [] as DbRow[] }));

  const researchers = (result.rows as DbRow[]).map((row) => ({
    id: Number(row.id),
    fullName: row.full_name || row.username,
    username: row.username,
    email: row.email,
    departmentName:
      row.department_name_ar ||
      (row.department ? formatEnglishDepartmentName(row.department) || row.department : "بدون قسم"),
    academicTitle: row.academic_title,
    phone: row.phone,
    isActive: Boolean(row.is_active),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  }));

  return <ResearchersPageShell researchers={researchers} />;
}

