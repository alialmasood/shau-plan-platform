import { query } from "./query";

export async function ensureConferencesTable() {
  // نفس الجدول المستخدم في /api/teachers/conferences
  await query(`
    CREATE TABLE IF NOT EXISTS conferences (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      conference_title VARCHAR(500) NOT NULL,
      date DATE NOT NULL,
      scope VARCHAR(50) NOT NULL,
      type VARCHAR(50) NOT NULL,
      sponsoring_organization VARCHAR(255),
      location VARCHAR(255),
      is_committee_member BOOLEAN DEFAULT FALSE,
      assignment_document TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  const alterQueries = [
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS conference_title VARCHAR(500)`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS date DATE`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS scope VARCHAR(50)`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS type VARCHAR(50)`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS sponsoring_organization VARCHAR(255)`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS location VARCHAR(255)`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS is_committee_member BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS assignment_document TEXT`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
    `ALTER TABLE conferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
  ];

  for (const q of alterQueries) {
    try {
      await query(q);
    } catch {
      // تجاهل أخطاء الأعمدة الموجودة مسبقاً
    }
  }
}

export async function getConferencesCountAll(): Promise<number> {
  const exists = await query(
    `SELECT to_regclass('public.conferences') IS NOT NULL AS exists;`
  );
  if (!exists.rows?.[0]?.exists) return 0;

  await ensureConferencesTable();
  const res = await query(`SELECT COUNT(*)::int AS count FROM conferences;`);
  return Number(res.rows?.[0]?.count ?? 0) || 0;
}

