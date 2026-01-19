"use client";

import { type ReactNode, forwardRef } from "react";

const Card = forwardRef<HTMLDivElement, { children: ReactNode; className?: string }>(
  ({ children, className = "" }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          "bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/80",
          "border border-slate-200/70",
          "rounded-2xl",
          "shadow-[0_1px_0_rgba(15,23,42,0.04),0_10px_30px_rgba(15,23,42,0.06)]",
          className,
        ].join(" ")}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export default Card;

