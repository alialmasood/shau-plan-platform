import { query } from "./query";

export type ActorType = "researcher" | "department" | "admin";
export type ReviewStatus = "مكتمل" | "بانتظار التدقيق" | "مرفوض/ناقص";

export type ActivityLogRow = {
  id: number;
  createdAt: string; // ISO
  actorType: ActorType;
  actorUserId: number | null;
  departmentCode: string | null;
  departmentId: number | null;
  actorName: string;
  departmentNameAr: string | null;
  actionType: string; // Arabic label e.g. "إضافة بحث"
  entityType: string;
  entityId: number | null;
  status: ReviewStatus;
};

async function ensureActivityLogsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      actor_type VARCHAR(20) NOT NULL,
      actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
      department_code VARCHAR(120),
      entity_type VARCHAR(50) NOT NULL,
      entity_id INTEGER,
      action_type VARCHAR(200) NOT NULL,
      status VARCHAR(50) NOT NULL
    );
  `);
  await query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_user_id ON activity_logs(actor_user_id);`);
  await query(`CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);`);
}

function normalizeActorType(t: ActorType | string): ActorType {
  const s = String(t || "").toLowerCase();
  if (s === "department") return "department";
  if (s === "admin") return "admin";
  return "researcher";
}

function normalizeEntityType(raw: string): string {
  const s = String(raw || "").toLowerCase().trim();
  if (s === "research" || s === "researches") return "research";
  if (s === "conference" || s === "conferences") return "conference";
  if (s === "course" || s === "courses") return "course";
  if (s === "workshop" || s === "workshops") return "workshop";
  if (s === "seminar" || s === "seminars") return "seminar";
  if (s === "committee" || s === "committees") return "committee";
  if (s === "scientific_evaluation" || s === "scientific_evaluations") return "scientific_evaluation";
  if (s === "report" || s === "reports") return "report";
  return s || "unknown";
}

function toStatus(v: any): ReviewStatus {
  const s = String(v ?? "").trim();
  if (s === "بانتظار التدقيق") return "بانتظار التدقيق";
  if (s === "مرفوض/ناقص") return "مرفوض/ناقص";
  return "مكتمل";
}

export async function logActivity(args: {
  actorType: ActorType;
  actorUserId?: number | null;
  departmentCode?: string | null;
  entityType: string;
  entityId?: number | null;
  actionType: string;
  status?: ReviewStatus;
  createdAt?: Date;
}) {
  await ensureActivityLogsTable();
  const createdAt = args.createdAt ?? new Date();
  await query(
    `
      INSERT INTO activity_logs (
        created_at, actor_type, actor_user_id, department_code,
        entity_type, entity_id, action_type, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8);
    `,
    [
      createdAt.toISOString(),
      normalizeActorType(args.actorType),
      args.actorUserId ?? null,
      args.departmentCode ?? null,
      normalizeEntityType(String(args.entityType)),
      args.entityId ?? null,
      String(args.actionType),
      String(args.status ?? "مكتمل"),
    ]
  );
}

async function countLogs(): Promise<number> {
  await ensureActivityLogsTable();
  const res = await query(`SELECT COUNT(*)::int AS count FROM activity_logs;`);
  return Number(res.rows?.[0]?.count ?? 0) || 0;
}

async function seedLogsFromExistingDataIfEmpty() {
  const n = await countLogs();
  if (n > 0) return;

  // نُدخل آخر سجلات حقيقية من أهم جداول النشاطات كبداية (بدون قيم وهمية).
  // هذا يضمن أن لوحة الإدارة تعرض "آخر التحديثات" حتى قبل تفعيل التسجيل على كل endpoints.
  const tables: Array<{
    entityType: string;
    table: string;
    idCol: string;
    userCol: string;
    createdCol: string;
    actionType: string;
    statusSql?: string;
  }> = [
    { entityType: "research", table: "research", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة بحث" },
    { entityType: "conference", table: "conferences", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة مؤتمر" },
    { entityType: "course", table: "courses", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة دورة" },
    { entityType: "workshop", table: "workshops", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة ورشة" },
    { entityType: "seminar", table: "seminars", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة ندوة" },
    { entityType: "committee", table: "committees", idCol: "id", userCol: "user_id", createdCol: "created_at", actionType: "إضافة لجنة" },
  ];

  for (const t of tables) {
    // تجاهل إذا الجدول غير موجود
    const exists = await query(`SELECT to_regclass($1) IS NOT NULL AS exists;`, [`public.${t.table}`]);
    if (!exists.rows?.[0]?.exists) continue;

    const rows = await query(
      `
        SELECT ${t.idCol} AS id, ${t.userCol} AS user_id, ${t.createdCol} AS created_at
        FROM ${t.table}
        ORDER BY ${t.createdCol} DESC NULLS LAST
        LIMIT 3;
      `
    ).catch(() => ({ rows: [] as any[] }));

    for (const r of rows.rows ?? []) {
      const entityId = Number((r as any).id);
      const userId = Number((r as any).user_id);
      const createdAt = (r as any).created_at ? new Date((r as any).created_at) : new Date();
      if (!Number.isFinite(entityId) || !Number.isFinite(userId)) continue;

      // department_code من users إذا متوفر
      const u = await query(`SELECT department FROM users WHERE id = $1 LIMIT 1;`, [userId]).catch(() => ({ rows: [] as any[] }));
      const deptCode = u.rows?.[0]?.department ? String(u.rows[0].department) : null;

      await logActivity({
        actorType: "researcher",
        actorUserId: userId,
        departmentCode: deptCode,
        entityType: t.entityType,
        entityId,
        actionType: t.actionType,
        status: "مكتمل",
        createdAt,
      }).catch(() => undefined);
    }
  }
}

export async function listRecentActivityLogs(limit = 15): Promise<ActivityLogRow[]> {
  await ensureActivityLogsTable();
  await seedLogsFromExistingDataIfEmpty();

  const lim = Math.max(1, Math.min(50, Number(limit) || 15));
  const res = await query(
    `
      SELECT
        l.id,
        l.created_at,
        l.actor_type,
        l.actor_user_id,
        COALESCE(l.department_code, u.department) AS department_code,
        d.id AS department_id,
        COALESCE(u.full_name, u.username, '—') AS actor_name,
        d.name_ar AS department_name_ar,
        l.action_type,
        l.entity_type,
        l.entity_id,
        l.status
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.actor_user_id
      LEFT JOIN departments d ON d.code = COALESCE(l.department_code, u.department)
      ORDER BY l.created_at DESC
      LIMIT $1;
    `,
    [lim]
  );

  return (res.rows ?? []).map((r: any) => ({
    id: Number(r.id),
    createdAt: new Date(r.created_at).toISOString(),
    actorType: normalizeActorType(r.actor_type),
    actorUserId: r.actor_user_id !== null && r.actor_user_id !== undefined ? Number(r.actor_user_id) : null,
    departmentCode: r.department_code ? String(r.department_code) : null,
    departmentId: r.department_id !== null && r.department_id !== undefined ? Number(r.department_id) : null,
    actorName: String(r.actor_name ?? "—"),
    departmentNameAr: r.department_name_ar ? String(r.department_name_ar) : null,
    actionType: String(r.action_type ?? ""),
    entityType: normalizeEntityType(String(r.entity_type ?? "")),
    entityId: r.entity_id !== null && r.entity_id !== undefined ? Number(r.entity_id) : null,
    status: toStatus(r.status),
  }));
}

export async function listRecentActivityLogsFiltered(args: {
  limit?: number;
  entityTypes?: string[]; // already normalized values
  status?: ReviewStatus | "الكل";
  search?: string | null;
}): Promise<ActivityLogRow[]> {
  await ensureActivityLogsTable();
  await seedLogsFromExistingDataIfEmpty();

  const lim = Math.max(1, Math.min(50, Number(args.limit ?? 15) || 15));
  const entityTypes = (args.entityTypes ?? [])
    .map((t) => normalizeEntityType(String(t)))
    .filter(Boolean);
  const status = args.status && args.status !== "الكل" ? args.status : null;
  const q = String(args.search ?? "").trim();
  const hasQ = q.length > 0;

  const params: any[] = [];
  let p = 1;

  const where: string[] = [];
  if (entityTypes.length > 0) {
    params.push(entityTypes);
    where.push(`lower(l.entity_type) = ANY($${p}::text[])`);
    p += 1;
  }
  if (status) {
    params.push(status);
    where.push(`l.status = $${p}`);
    p += 1;
  }
  if (hasQ) {
    params.push(`%${q}%`);
    where.push(
      `(COALESCE(u.full_name, u.username, '') ILIKE $${p} OR COALESCE(d.name_ar, '') ILIKE $${p})`
    );
    p += 1;
  }
  params.push(lim);

  const res = await query(
    `
      SELECT
        l.id,
        l.created_at,
        l.actor_type,
        l.actor_user_id,
        COALESCE(l.department_code, u.department) AS department_code,
        d.id AS department_id,
        COALESCE(u.full_name, u.username, '—') AS actor_name,
        d.name_ar AS department_name_ar,
        l.action_type,
        l.entity_type,
        l.entity_id,
        l.status
      FROM activity_logs l
      LEFT JOIN users u ON u.id = l.actor_user_id
      LEFT JOIN departments d ON d.code = COALESCE(l.department_code, u.department)
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY l.created_at DESC
      LIMIT $${p};
    `,
    params
  );

  return (res.rows ?? []).map((r: any) => ({
    id: Number(r.id),
    createdAt: new Date(r.created_at).toISOString(),
    actorType: normalizeActorType(r.actor_type),
    actorUserId: r.actor_user_id !== null && r.actor_user_id !== undefined ? Number(r.actor_user_id) : null,
    departmentCode: r.department_code ? String(r.department_code) : null,
    departmentId: r.department_id !== null && r.department_id !== undefined ? Number(r.department_id) : null,
    actorName: String(r.actor_name ?? "—"),
    departmentNameAr: r.department_name_ar ? String(r.department_name_ar) : null,
    actionType: String(r.action_type ?? ""),
    entityType: normalizeEntityType(String(r.entity_type ?? "")),
    entityId: r.entity_id !== null && r.entity_id !== undefined ? Number(r.entity_id) : null,
    status: toStatus(r.status),
  }));
}

