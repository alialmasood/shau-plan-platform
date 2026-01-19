"use client";

import Card from "./Card";

export default function DepartmentsGridSkeleton({
  columns,
}: {
  columns: number;
}) {
  const itemsCount = Math.min(Math.max(1, columns) * 3, 12);
  const items = Array.from({ length: itemsCount });
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((_, idx) => (
        <Card key={idx} className="px-3 py-2.5 h-[84px]">
          <div className="animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-3/4 bg-slate-200 rounded" />
                <div className="h-3 w-1/2 bg-slate-100 rounded" />
              </div>
              <div className="h-9 w-9 bg-slate-100 rounded-2xl" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="h-3 w-20 bg-slate-100 rounded" />
              <div className="h-6 w-12 bg-slate-200 rounded-full" />
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

