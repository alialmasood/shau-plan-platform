"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "./Card";
import {
  IconBell,
  IconChevronDown,
  IconMenu,
  IconSearch,
} from "./icons";

export default function Topbar({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
    window.location.href = "/";
  }

  return (
    <div className="sticky top-0 z-30 px-4 pt-4 md:px-6 md:pt-6 lg:px-8">
      <Card className="px-3 py-3 md:px-4 md:py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-700"
            aria-label="فتح القائمة"
          >
            <IconMenu />
          </button>

          <div className="min-w-0">
            <div className="text-sm md:text-base font-extrabold text-slate-900 truncate">
              لوحة الإدارة - المنصة البحثية
            </div>
            <div className="text-xs text-slate-500 mt-0.5 hidden md:block">
              إدارة الباحثين، الأقسام، النشاطات، والتحليلات
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:block w-[420px] max-w-[45vw]">
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                <IconSearch />
              </span>
              <input
                placeholder="بحث عن باحث/قسم/بحث"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl hover:bg-slate-100 text-slate-700"
            aria-label="الإشعارات"
          >
            <IconBell />
            <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
          </button>

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 hover:bg-slate-100"
              aria-label="قائمة المستخدم"
              title="مسؤول النظام"
            >
              <div className="h-9 w-9 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center">
                <Image
                  src="/logo-light.png"
                  alt="شعار الكلية"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-sm font-bold text-slate-900 leading-5">admin</div>
              </div>
              <span className="text-slate-500">
                <IconChevronDown />
              </span>
            </button>

            {menuOpen ? (
              <div className="absolute left-0 mt-2 w-56">
                <Card className="p-2">
                  <button
                    type="button"
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 text-sm"
                  >
                    الملف الشخصي
                  </button>
                  <button
                    type="button"
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-slate-100 text-sm"
                  >
                    الإعدادات
                  </button>
                  <div className="my-2 border-t border-slate-200/70" />
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full text-right px-3 py-2 rounded-xl hover:bg-rose-50 text-sm text-rose-600"
                  >
                    تسجيل الخروج
                  </button>
                </Card>
              </div>
            ) : null}
          </div>
        </div>

        {/* Mobile search */}
        <div className="mt-3 md:hidden">
          <div className="relative">
            <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
              <IconSearch />
            </span>
            <input
              placeholder="بحث عن باحث/قسم/بحث"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-11 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

