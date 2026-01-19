"use client";

import type { SVGProps } from "react";

function baseProps(props: SVGProps<SVGSVGElement>) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function IconBell(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function IconSearch(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

export function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export function IconHome(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 11l9-8 9 8" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}

export function IconUsers(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

export function IconBuilding(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M3 22h18" />
      <path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18" />
      <path d="M10 6h4M10 10h4M10 14h4M10 18h4" />
    </svg>
  );
}

export function IconBookOpen(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M2 4h8a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 4h-8a4 4 0 00-4 4v14a3 3 0 013-3h9z" />
    </svg>
  );
}

export function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  );
}

export function IconActivity(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M22 12h-4l-3 9-4-18-3 9H2" />
    </svg>
  );
}

export function IconTrendingUp(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M23 6l-7 7-4-4-7 7" />
      <path d="M17 6h6v6" />
    </svg>
  );
}

export function IconAward(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <circle cx="12" cy="8" r="6" />
      <path d="M15.5 14l.5 8-4-2-4 2 .5-8" />
    </svg>
  );
}

export function IconFileText(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <path d="M14 2v6h6" />
      <path d="M16 13H8M16 17H8M10 9H8" />
    </svg>
  );
}

export function IconSettings(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...baseProps(props)}>
      <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-1.41 3.41h-.2a2 2 0 01-1.73-1l-.04-.07a1.65 1.65 0 00-1.43-.83 1.65 1.65 0 00-1.43.83l-.04.07a2 2 0 01-1.73 1h-.2a2 2 0 01-1.41-3.41l.06-.06A1.65 1.65 0 004.6 15a1.65 1.65 0 00-1.57-1.1H3a2 2 0 010-4h.03A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06A2 2 0 015.62 3.7h.2a2 2 0 011.73 1l.04.07c.3.5.86.83 1.43.83s1.13-.33 1.43-.83l.04-.07a2 2 0 011.73-1h.2a2 2 0 011.41 3.41l-.06.06c-.39.39-.52.97-.33 1.82.16.48.46.85.86 1.1H21a2 2 0 010 4h-.03a1.65 1.65 0 00-1.57 1.1z" />
    </svg>
  );
}

