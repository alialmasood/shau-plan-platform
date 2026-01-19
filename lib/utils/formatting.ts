// Helpers for UI-level formatting (do not mutate raw DB values)

function titleCaseWord(word: string): string {
  const w = word.trim();
  if (!w) return "";
  // common abbreviations
  const lower = w.toLowerCase();
  if (lower === "tech") return "Technology";
  if (lower === "it") return "IT";
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/**
 * Format a programming-style identifier into a human readable English title.
 *
 * Examples:
 * - nursingTechnology -> Nursing Technology
 * - radiology_tech -> Radiology Technology
 * - anesthesia-tech -> Anesthesia Technology
 */
export function formatEnglishDepartmentName(raw: string): string {
  if (!raw) return "";

  // 1) Normalize separators
  let s = String(raw).trim();

  // Insert spaces for camelCase: "nursingTechnology" -> "nursing Technology"
  s = s.replace(/([a-z0-9])([A-Z])/g, "$1 $2");

  // Replace underscores and hyphens with spaces
  s = s.replace(/[_-]+/g, " ");

  // Collapse repeated spaces
  s = s.replace(/\s+/g, " ").trim();

  if (!s) return "";

  return s
    .split(" ")
    .map(titleCaseWord)
    .filter(Boolean)
    .join(" ");
}

