"use client";

import type { ReactNode } from "react";
import Card from "./Card";

export default function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={["p-5 md:p-6", className].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-extrabold text-slate-900 truncate">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <div className="mt-4">{children}</div>
    </Card>
  );
}

