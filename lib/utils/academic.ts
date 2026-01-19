// Utility functions for academic titles and departments

// Format date to dd-mm-yyyy format
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return "-";
  
  const day = String(dateObj.getDate()).padStart(2, "0");
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const year = dateObj.getFullYear();
  
  return `${day}-${month}-${year}`;
}

// Map academic title values to Arabic display names
export const ACADEMIC_TITLE_MAP: Record<string, string> = {
  professor: "أستاذ",
  associate_professor: "أستاذ مشارك",
  assistant_professor: "أستاذ مساعد",
  lecturer: "مدرس",
  assistant_lecturer: "مدرس مساعد",
};

export function getAcademicTitleLabel(title?: string): string {
  return title ? ACADEMIC_TITLE_MAP[title] || title : "غير محدد";
}

// Map department values to Arabic display names
export const DEPARTMENT_MAP: Record<string, string> = {
  dental_technology: "قسم تقنيات صناعة الأسنان",
  radiology_technology: "قسم تقنيات الأشعة",
  anesthesia_technology: "قسم تقنيات التخدير",
  optics_technology: "قسم تقنيات البصريات",
  emergency_medicine_technology: "قسم تقنيات طب الطوارئ والإسعافات الأولية",
  community_health_technology: "قسم تقنيات صحة المجتمع",
  physical_therapy_technology: "قسم تقنيات العلاج الطبيعي",
  health_physics_and_radiation_therapy_engineering:
    "قسم هندسة تقنيات الفيزياء الصحية والعلاج الإشعاعي",
  oil_and_gas_engineering_technology: "قسم هندسة تقنيات النفط والغاز",
  cybersecurity_and_cloud_computing_engineering:
    "قسم هندسة تقنيات الأمن السيبراني والحوسبة السحابية",
  construction_and_building_engineering_technology:
    "قسم هندسة تقنيات البناء والإنشاءات",
};

export function getDepartmentLabel(department?: string): string {
  return department ? DEPARTMENT_MAP[department] || department : "غير محدد";
}
