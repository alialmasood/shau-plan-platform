"use client";

import type { ReviewStatus } from "../models";

export default function Badge({ status }: { status: ReviewStatus }) {
  const styles =
    status === "مكتمل"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : status === "بانتظار التدقيق"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <span
      className={[
        "inline-flex items-center justify-center",
        "px-2.5 py-1",
        "rounded-full border",
        "text-xs font-bold",
        styles,
      ].join(" ")}
    >
      {status}
    </span>
  );
}

