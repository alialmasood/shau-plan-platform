"use client";

import Link from "next/link";
import { useMemo } from "react";
import Card from "./Card";
import {
  IconActivity,
  IconAward,
  IconBookOpen,
  IconBuilding,
  IconCalendar,
  IconFileText,
  IconHome,
  IconSettings,
  IconUsers,
  IconX,
} from "./icons";

type SidebarItem = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
};

export default function Sidebar({
  open,
  onClose,
  activeKey,
}: {
  open: boolean;
  onClose: () => void;
  activeKey: string;
}) {
  const items = useMemo<SidebarItem[]>(
    () => [
      { key: "dashboard", label: "الرئيسية", href: "/admin", icon: <IconHome /> },
      { key: "researchers", label: "الباحثون", href: "/admin", icon: <IconUsers /> },
      { key: "departments", label: "الأقسام العلمية", href: "/admin/departments", icon: <IconBuilding /> },
      { key: "publishing", label: "البحوث والنشر", href: "/admin", icon: <IconBookOpen /> },
      { key: "conferences", label: "المؤتمرات", href: "/admin", icon: <IconCalendar /> },
      {
        key: "activities",
        label: "النشاطات العلمية",
        href: "/admin",
        icon: <IconActivity />,
      },
      {
        key: "scoring",
        label: "نقاط وتقييم الأداء",
        href: "/admin",
        icon: <IconAward />,
      },
      { key: "reports", label: "التقارير", href: "/admin", icon: <IconFileText /> },
      {
        key: "settings",
        label: "الإعدادات والصلاحيات",
        href: "/admin",
        icon: <IconSettings />,
      },
    ],
    []
  );

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={[
          "fixed inset-0 bg-slate-900/35 backdrop-blur-sm z-40 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
          "transition-opacity",
        ].join(" ")}
        onClick={onClose}
      />

      <aside
        className={[
          "z-50 lg:z-auto",
          "fixed lg:sticky top-0",
          "h-screen",
          "w-[280px]",
          "p-3",
          "transition-transform duration-200",
          "bg-transparent",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200/70">
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-slate-900">
                المنصة البحثية
              </div>
              <div className="text-xs text-slate-500">لوحة الإدارة</div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="lg:hidden inline-flex items-center justify-center h-9 w-9 rounded-xl hover:bg-slate-100 text-slate-700"
              aria-label="إغلاق القائمة"
            >
              <IconX />
            </button>
          </div>

          <nav className="flex-1 px-2 py-3 overflow-auto">
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = item.key === activeKey;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={[
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl",
                      "text-sm font-medium",
                      isActive
                        ? "bg-blue-50 text-blue-700 border border-blue-100"
                        : "text-slate-700 hover:bg-slate-100",
                    ].join(" ")}
                    onClick={onClose}
                  >
                    <span
                      className={[
                        "inline-flex items-center justify-center h-9 w-9 rounded-xl",
                        isActive ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700",
                      ].join(" ")}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className="px-4 py-4 border-t border-slate-200/70">
            <div className="text-xs text-slate-500 leading-relaxed">
              تصميم حديث مع دعم RTL وتهيئة لربط قاعدة البيانات لاحقاً.
            </div>
          </div>
        </Card>
      </aside>
    </>
  );
}

