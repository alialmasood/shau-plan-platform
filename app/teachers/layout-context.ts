"use client";

import { createContext, useContext } from "react";

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: string;
  department: string;
  phone?: string;
  academic_title?: string;
  is_active: boolean;
  profile_picture?: string;
  created_at: string;
}

export interface LayoutContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeMenuItem: string;
  setActiveMenuItem: (item: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  activitiesDropdownOpen: boolean;
  setActivitiesDropdownOpen: (open: boolean) => void;
  user: User | null;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within TeachersLayout");
  }
  return context;
}

