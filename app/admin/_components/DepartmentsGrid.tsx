"use client";

import DepartmentCard, { type DepartmentCardItem } from "./DepartmentCard";

export default function DepartmentsGrid({
  items,
  columns,
  maxCount,
}: {
  items: DepartmentCardItem[];
  columns: number;
  maxCount: number;
}) {
  return (
    <div
      className="grid gap-2"
      style={{
        gridTemplateColumns: `repeat(${Math.max(1, columns)}, minmax(0, 1fr))`,
      }}
    >
      {items.map((d, idx) => (
        <DepartmentCard
          key={d.id}
          item={d}
          accentIndex={idx}
          maxCount={maxCount}
        />
      ))}
    </div>
  );
}

