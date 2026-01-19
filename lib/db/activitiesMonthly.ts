import { query } from "./query";

export type ActivitiesMonthlyRange = 6 | 12;

export type ActivitiesMonthlyResponse = {
  labels: string[];
  series: {
    key: "courses" | "workshops" | "seminars" | "committees";
    label: string;
    color: string;
    values: number[];
  }[];
};

const MONTHS_AR_SHORT = [
  "كانون2", // Jan
  "شباط", // Feb
  "آذار", // Mar
  "نيسان", // Apr
  "أيار", // May
  "حزيران", // Jun
  "تموز", // Jul
  "آب", // Aug
  "أيلول", // Sep
  "تشرين1", // Oct
  "تشرين2", // Nov
  "كانون1", // Dec
];

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, months: number) {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

function monthKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

async function tableExists(table: string): Promise<boolean> {
  const res = await query(`SELECT to_regclass($1) IS NOT NULL AS exists;`, [
    `public.${table}`,
  ]);
  return Boolean(res.rows?.[0]?.exists);
}

async function countByMonth(args: {
  table: string;
  dateColumn: string;
  startInclusive: Date;
  endExclusive: Date;
}): Promise<Map<string, number>> {
  const { table, dateColumn, startInclusive, endExclusive } = args;
  if (!(await tableExists(table))) return new Map();

  // الأعمدة من مسارات التدريسيين:
  // courses.date, workshops.date, seminars.date, committees.assignment_date
  const res = await query(
    `
      SELECT
        to_char(date_trunc('month', ${dateColumn}), 'YYYY-MM-01') AS month,
        COUNT(*)::int AS count
      FROM ${table}
      WHERE ${dateColumn} >= $1
        AND ${dateColumn} < $2
      GROUP BY 1
      ORDER BY 1 ASC;
    `,
    [startInclusive.toISOString(), endExclusive.toISOString()]
  );

  const map = new Map<string, number>();
  for (const r of res.rows ?? []) {
    map.set(String((r as any).month), Number((r as any).count ?? 0) || 0);
  }
  return map;
}

export async function getActivitiesMonthlyStacked(args: {
  months: ActivitiesMonthlyRange;
}): Promise<ActivitiesMonthlyResponse> {
  const monthsCount = args.months;
  const now = new Date();

  const start = startOfMonth(addMonths(now, -(monthsCount - 1)));
  const end = startOfMonth(addMonths(now, 1));
  const monthsList = Array.from({ length: monthsCount }, (_, i) =>
    addMonths(start, i)
  );
  const labels = monthsList.map((d) => MONTHS_AR_SHORT[d.getMonth()] || "");

  const [mCourses, mWorkshops, mSeminars, mCommittees] = await Promise.all([
    countByMonth({ table: "courses", dateColumn: "date", startInclusive: start, endExclusive: end }),
    countByMonth({ table: "workshops", dateColumn: "date", startInclusive: start, endExclusive: end }),
    countByMonth({ table: "seminars", dateColumn: "date", startInclusive: start, endExclusive: end }),
    countByMonth({
      table: "committees",
      dateColumn: "assignment_date",
      startInclusive: start,
      endExclusive: end,
    }),
  ]);

  const valuesFrom = (map: Map<string, number>) =>
    monthsList.map((d) => map.get(monthKey(d)) ?? 0);

  return {
    labels,
    series: [
      { key: "courses", label: "دورات", color: "#2563eb", values: valuesFrom(mCourses) },
      { key: "workshops", label: "ورش", color: "#06b6d4", values: valuesFrom(mWorkshops) },
      { key: "seminars", label: "ندوات", color: "#22c55e", values: valuesFrom(mSeminars) },
      { key: "committees", label: "لجان", color: "#f59e0b", values: valuesFrom(mCommittees) },
    ],
  };
}

