export type EntityId = string;

export interface Department {
  id: EntityId;
  name: string;
  faculty?: string;
}

export interface Researcher {
  id: EntityId;
  fullName: string;
  departmentId: EntityId;
  departmentName: string;
  pointsTotal: number;
  profileCompletenessPct: number; // 0..100
}

export type PublicationQuartile = "Q1" | "Q2" | "Q3" | "Q4" | "غير مفهرس";

export interface Publication {
  id: EntityId;
  title: string;
  researcherId: EntityId;
  departmentId: EntityId;
  publishedAt: string; // ISO date
  isScopus: boolean;
  quartile: PublicationQuartile;
}

export interface Conference {
  id: EntityId;
  name: string;
  startsAt: string; // ISO date
  location?: string;
}

export type ActivityType =
  | "دورة"
  | "ورشة"
  | "ندوة"
  | "لجنة"
  | "كتاب شكر"
  | "تكليف"
  | "تطوع";

export interface Activity {
  id: EntityId;
  type: ActivityType;
  title: string;
  departmentId?: EntityId;
  researcherId?: EntityId;
  date: string; // ISO date
}

export interface Score {
  id: EntityId;
  researcherId: EntityId;
  departmentId: EntityId;
  points: number;
  updatedAt: string; // ISO date
}

export type ReviewStatus = "مكتمل" | "بانتظار التدقيق" | "مرفوض/ناقص";

export interface RecentUpdateRow {
  id: EntityId;
  date: string; // ISO date
  actorName: string; // الباحث/القسم
  actorType: "باحث" | "قسم";
  activityType: string;
  status: ReviewStatus;
  actionLabel: string;
  actionHref?: string;
  entityType?: string;
}

