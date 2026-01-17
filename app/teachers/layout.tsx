"use client";

import { useEffect, useState, createContext, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { getAcademicTitleLabel } from "@/lib/utils/academic";

interface User {
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

// Get academic year based on current year
function getAcademicYear(): string {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12
  
  // If we're in the second half of the year (Aug-Dec), show next year
  // Otherwise show current year
  if (currentMonth >= 8) {
    return `${currentYear}-${currentYear + 1}`;
  } else {
    return `${currentYear - 1}-${currentYear}`;
  }
}


// Context for layout state
interface LayoutContextType {
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

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export function useLayout() {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error("useLayout must be used within TeachersLayout");
  }
  return context;
}

export default function TeachersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMenuItem, setActiveMenuItem] = useState("home");
  const [notificationCount, setNotificationCount] = useState(3);
  const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
  const [profilePictureMenuOpen, setProfilePictureMenuOpen] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [totalPoints, setTotalPoints] = useState<number | null>(null);
  const [collegeRank, setCollegeRank] = useState<number | null>(null);
  const [departmentRank, setDepartmentRank] = useState<number | null>(null);
  const [onlineUsersCount, setOnlineUsersCount] = useState<number>(0);
  const [onlineUsersList, setOnlineUsersList] = useState<Array<{ id: number; name: string }>>([]);
  const [onlineUsersMenuOpen, setOnlineUsersMenuOpen] = useState(false);

  // Determine active menu item based on pathname and close dropdown when pathname changes
  useEffect(() => {
    // Close activities dropdown when pathname changes
    setActivitiesDropdownOpen(false);
    
    if (pathname === "/teachers/dashboard") {
      setActiveMenuItem("home");
    } else if (pathname === "/teachers/researcher-links") {
      setActiveMenuItem("researcher-links");
    } else if (pathname === "/teachers/profile") {
      setActiveMenuItem("profile");
    } else if (pathname === "/teachers/positions") {
      setActiveMenuItem("positions");
    } else if (pathname === "/teachers/research") {
      setActiveMenuItem("research");
    } else if (pathname === "/teachers/publications") {
      setActiveMenuItem("publications");
    } else if (pathname === "/teachers/courses") {
      setActiveMenuItem("courses");
    } else if (pathname === "/teachers/seminars") {
      setActiveMenuItem("seminars");
    } else if (pathname === "/teachers/workshops") {
      setActiveMenuItem("training-workshops");
    } else if (pathname === "/teachers/conferences") {
      setActiveMenuItem("conferences");
    } else if (pathname === "/teachers/committees") {
      setActiveMenuItem("committees");
    } else if (pathname === "/teachers/thank-you-books") {
      setActiveMenuItem("thank-you-books");
    } else if (pathname === "/teachers/assignments") {
      setActiveMenuItem("assignments");
    } else if (pathname === "/teachers/participation-certificates") {
      setActiveMenuItem("participation-certificates");
    } else if (pathname === "/teachers/supervision") {
      setActiveMenuItem("supervision");
    } else if (pathname === "/teachers/scientific-evaluation") {
      setActiveMenuItem("scientific-evaluation");
    } else if (pathname === "/teachers/journals-management") {
      setActiveMenuItem("journals-management");
    } else if (pathname === "/teachers/volunteer-work") {
      setActiveMenuItem("volunteer-work");
    } else if (pathname === "/teachers/evaluation") {
      setActiveMenuItem("evaluation");
    } else if (pathname === "/teachers/analytics") {
      setActiveMenuItem("analytics");
    } else if (pathname === "/teachers/comparison") {
      setActiveMenuItem("comparison");
    } else if (pathname === "/teachers/cv") {
      setActiveMenuItem("cv");
    } else if (pathname === "/teachers/collaboration") {
      setActiveMenuItem("collaboration");
    } else if (pathname === "/teachers/communication") {
      setActiveMenuItem("communication");
    } else if (pathname === "/teachers/users-management") {
      setActiveMenuItem("users-management");
    }
  }, [pathname]);

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Fetch latest user data from database to ensure profile picture is up to date
      const fetchLatestUserData = async () => {
        try {
          const response = await fetch(`/api/teachers/profile?userId=${parsedUser.id}`);
          if (response.ok) {
            const latestUserData = await response.json();
            // Update localStorage and state with latest data (especially profile_picture)
            const updatedUser = { ...parsedUser, ...latestUserData };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            setUser(updatedUser);
          }
        } catch (error) {
          console.error("Error fetching latest user data:", error);
          // Continue with localStorage data if fetch fails
        }
      };
      
      fetchLatestUserData();
      setIsLoading(false);
    } else {
      // Redirect to login if not logged in (except for login/register pages)
      if (!pathname?.includes("/login") && !pathname?.includes("/register")) {
        router.push("/teachers/login");
      } else {
        setIsLoading(false);
      }
    }

    // Listen for user updates
    const handleUserUpdate = (event: CustomEvent) => {
      setUser(event.detail);
    };

    window.addEventListener("userUpdated", handleUserUpdate as EventListener);

    return () => {
      window.removeEventListener("userUpdated", handleUserUpdate as EventListener);
    };
  }, [router, pathname]);

  // Fetch total points
  useEffect(() => {
    const fetchPoints = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/teachers/points?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setTotalPoints(data.totalPoints || 0);
        }
      } catch (error) {
        console.error("Error fetching points:", error);
      }
    };

    fetchPoints();
  }, [user]);

  // Fetch ranking data
  useEffect(() => {
    const fetchRanking = async () => {
      if (!user) return;

      try {
        const response = await fetch(`/api/teachers/ranking?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setCollegeRank(data.collegeRank || null);
          setDepartmentRank(data.departmentRank || null);
        }
      } catch (error) {
        console.error("Error fetching ranking:", error);
      }
    };

    fetchRanking();
  }, [user]);

  // Register user as online and update online users list
  useEffect(() => {
    if (!user) return;

    // Register current user as online
    const registerOnline = async () => {
      try {
        await fetch('/api/teachers/online-users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });
      } catch (error) {
        console.error("Error registering online user:", error);
      }
    };

    // Fetch online users list
    const fetchOnlineUsers = async () => {
      try {
        const response = await fetch('/api/teachers/online-users');
        if (response.ok) {
          const data = await response.json();
          setOnlineUsersCount(data.count || 0);
          setOnlineUsersList(data.users || []);
        }
      } catch (error) {
        console.error("Error fetching online users:", error);
      }
    };

    // Initial registration and fetch
    registerOnline();
    fetchOnlineUsers();

    // Update online status every 30 seconds
    const onlineInterval = setInterval(() => {
      registerOnline();
      fetchOnlineUsers();
    }, 30000);

    // Cleanup on unmount
    return () => {
      clearInterval(onlineInterval);
    };
  }, [user]);

  // Close online users menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (onlineUsersMenuOpen && !target.closest('.online-users-container')) {
        setOnlineUsersMenuOpen(false);
      }
    };

    if (onlineUsersMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onlineUsersMenuOpen]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/teachers/login");
  };

  const handleProfilePictureClick = () => {
    setProfilePictureMenuOpen(!profilePictureMenuOpen);
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('حجم الصورة يجب أن يكون أقل من 5 ميجابايت');
      return;
    }

    setIsUploadingPicture(true);
    setProfilePictureMenuOpen(false);

    try {
      // Convert image to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64Image = event.target?.result as string;

        try {
          const response = await fetch('/api/teachers/profile', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId: user.id,
              profilePicture: base64Image,
            }),
          });

          if (!response.ok) {
            throw new Error('فشل تحديث الصورة الشخصية');
          }

          const result = await response.json();
          
          // Update local storage and state
          const updatedUser = { ...user, profile_picture: result.user.profile_picture };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setUser(updatedUser);

          // Dispatch event to notify other components
          window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          alert('حدث خطأ أثناء رفع الصورة. يرجى المحاولة مرة أخرى.');
        } finally {
          setIsUploadingPicture(false);
        }
      };

      reader.onerror = () => {
        console.error('Error reading file');
        alert('حدث خطأ أثناء قراءة الملف');
        setIsUploadingPicture(false);
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('حدث خطأ أثناء معالجة الملف');
      setIsUploadingPicture(false);
    }

    // Reset input
    e.target.value = '';
  };

  // Close profile picture menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (profilePictureMenuOpen && !target.closest('.profile-picture-container')) {
        setProfilePictureMenuOpen(false);
      }
    };

    if (profilePictureMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profilePictureMenuOpen]);

  // Don't show layout for login/register pages
  if (pathname?.includes("/login") || pathname?.includes("/register")) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <LayoutContext.Provider
      value={{
        sidebarOpen,
        setSidebarOpen,
        activeMenuItem,
        setActiveMenuItem,
        searchQuery,
        setSearchQuery,
        notificationCount,
        setNotificationCount,
        activitiesDropdownOpen,
        setActivitiesDropdownOpen,
        user,
      }}
    >
      <div className="flex h-screen flex-col bg-[#FAFBFC] overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm flex-shrink-0 border-b border-gray-100">
          <div className="w-full">
            <div className="flex justify-between items-center py-3 pr-4 sm:pr-6 lg:pr-8">
              {/* Sidebar Toggle Button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors flex-shrink-0"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" style={{ color: '#1F2937' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Platform Name */}
              <div className="flex-shrink-0 mr-4">
                <h3 className="text-xl font-bold tracking-wide whitespace-nowrap" style={{ color: '#1F2937' }}>
                  المنصة البحثية
                </h3>
              </div>

              {/* User Profile Section */}
              <div className="flex items-center gap-2 flex-1">
                {/* User Info */}
                <div className="flex-1" style={{ marginRight: 'calc(256px - 16px - 12.5rem)', marginLeft: '2.5rem' }}>
                  <div className="pl-4">
                    <div className="space-y-1">
                    {/* First Line: Academic Title and Name */}
                    <h2 className="text-xl md:text-2xl font-bold" style={{ color: '#1F2937' }}>
                      <span className="text-indigo-600 font-extrabold">
                        {getAcademicTitleLabel(user.academic_title)}
                      </span>{" "}
                      <span style={{ color: '#1F2937' }}>
                        {user.full_name?.split(" / ")[0] || user.username}
                      </span>
                    </h2>
                    
                    {/* Second Line: Welcome Message */}
                    <p className="text-xs md:text-sm font-medium" style={{ color: '#6B7280' }}>
                      مرحباً بك في{" "}
                      <span className="text-indigo-600 font-semibold">منصتك البحثية</span>
                      {" "}للعام الدراسي{" "}
                      <span className="font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: '#EEF2FF', color: '#6366F1' }}>
                        {getAcademicYear()}
                      </span>
                    </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="flex-1 max-w-xs mx-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-1.5 pr-8 border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-transparent text-xs md:text-sm transition-all duration-300 ease-in-out"
                    style={{ 
                      color: '#1F2937',
                      backgroundColor: '#F3F4F6'
                    }}
                  />
                  <svg
                    className="absolute right-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
                    style={{ color: '#6B7280' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {/* User Profile Picture */}
              <div className="flex-shrink-0 ml-4 relative profile-picture-container self-center flex items-center">
                <div 
                  onClick={handleProfilePictureClick}
                  className="w-20 h-20 max-h-full rounded-full overflow-hidden bg-gray-200 border-2 border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 relative"
                >
                  {isUploadingPicture ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-300">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : user.profile_picture ? (
                    <Image
                      src={user.profile_picture}
                      alt="الصورة الشخصية"
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  ) : user.full_name ? (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {user.full_name.split(" / ")[0]?.charAt(0) || user.username?.charAt(0).toUpperCase()}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold text-lg">
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>

                {/* Profile Picture Menu */}
                {profilePictureMenuOpen && (
                  <div className="absolute left-full ml-2 top-0 mt-0 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 py-2">
                    <label className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileInputChange}
                        disabled={isUploadingPicture}
                      />
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>رفع صورة جديدة</span>
                      </div>
                    </label>
                    {user.profile_picture && (
                      <button
                        onClick={async () => {
                          if (!user) return;
                          try {
                            const response = await fetch('/api/teachers/profile', {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                userId: user.id,
                                profilePicture: null,
                              }),
                            });

                            if (response.ok) {
                              const result = await response.json();
                              const updatedUser = { ...user, profile_picture: undefined };
                              localStorage.setItem('user', JSON.stringify(updatedUser));
                              setUser(updatedUser);
                              window.dispatchEvent(new CustomEvent('userUpdated', { detail: updatedUser }));
                              setProfilePictureMenuOpen(false);
                            }
                          } catch (error) {
                            console.error('Error removing profile picture:', error);
                            alert('حدث خطأ أثناء حذف الصورة');
                          }
                        }}
                        className="w-full text-right px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>حذف الصورة</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Layout with Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <aside
            className={`shadow-xl flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out ${
              sidebarOpen ? "w-64" : "w-0 overflow-hidden"
            }`}
            style={{ backgroundColor: '#6366F1', zIndex: 1000, position: 'relative' }}
          >
            {/* Sidebar Navigation */}
            <nav className={`flex-1 p-4 space-y-1 ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
              <a
                href="/teachers/dashboard"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("home"); router.push("/teachers/dashboard"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "home" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "home" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="font-medium text-sm">الصفحة الرئيسية</span>
              </a>

              <a
                href="/teachers/researcher-links"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("researcher-links"); router.push("/teachers/researcher-links"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "researcher-links" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "researcher-links" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="font-medium text-sm">روابط الباحث</span>
              </a>

              <a
                href="/teachers/profile"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("profile"); router.push("/teachers/profile"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "profile" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "profile" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-sm">المعلومات الشخصية والأكاديمية</span>
              </a>

              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    setActivitiesDropdownOpen(!activitiesDropdownOpen);
                  }}
                  className={`flex items-center justify-between w-full gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                    activitiesDropdownOpen || ["positions", "research", "publications", "courses", "seminars", "training-workshops", "conferences", "committees", "thank-you-books", "assignments", "participation-certificates", "supervision", "scientific-evaluation", "journals-management", "volunteer-work"].includes(activeMenuItem)
                      ? "bg-white/20 shadow-sm"
                      : "hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                    <span className="font-medium text-sm">نشاطاتك العلمية والأكاديمية</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform duration-300 ${activitiesDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activitiesDropdownOpen && (
                  <div className="absolute right-full -top-4 mt-0 w-64 bg-indigo-700/90 backdrop-blur-sm rounded-lg shadow-lg z-50 py-2 pb-4 mr-2 max-h-[80vh] overflow-y-auto overflow-x-hidden custom-scrollbar" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.3) rgba(255,255,255,0.1)', overscrollBehavior: 'contain' }}>
                    <a
                      href="/teachers/positions"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("positions"); setActivitiesDropdownOpen(false); router.push("/teachers/positions"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "positions" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "positions" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-sm">المناصب</span>
                    </a>
                    <a
                      href="/teachers/research"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("research"); setActivitiesDropdownOpen(false); router.push("/teachers/research"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "research" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "research" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span className="font-medium text-sm">البحوث</span>
                    </a>
                    <a
                      href="/teachers/publications"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("publications"); setActivitiesDropdownOpen(false); router.push("/teachers/publications"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "publications" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "publications" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium text-sm">المؤلفات</span>
                    </a>
                    <a
                      href="/teachers/courses"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("courses"); setActivitiesDropdownOpen(false); router.push("/teachers/courses"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "courses" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "courses" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium text-sm">الدورات</span>
                    </a>
                    <a
                      href="/teachers/seminars"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("seminars"); setActivitiesDropdownOpen(false); router.push("/teachers/seminars"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "seminars" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "seminars" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-sm">الندوات</span>
                    </a>
                    <a
                      href="/teachers/workshops"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("training-workshops"); setActivitiesDropdownOpen(false); router.push("/teachers/workshops"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "training-workshops" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "training-workshops" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      <span className="font-medium text-sm">ورش العمل</span>
                    </a>
                    <a
                      href="/teachers/conferences"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("conferences"); setActivitiesDropdownOpen(false); router.push("/teachers/conferences"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "conferences" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "conferences" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium text-sm">المؤتمرات</span>
                    </a>
                    <a
                      href="/teachers/committees"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("committees"); setActivitiesDropdownOpen(false); router.push("/teachers/committees"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "committees" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "committees" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span className="font-medium text-sm">اللجان</span>
                    </a>
                    <a
                      href="/teachers/thank-you-books"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("thank-you-books"); setActivitiesDropdownOpen(false); router.push("/teachers/thank-you-books"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "thank-you-books" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "thank-you-books" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium text-sm">كتب الشكر والتقدير</span>
                    </a>
                    <a
                      href="/teachers/assignments"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("assignments"); setActivitiesDropdownOpen(false); router.push("/teachers/assignments"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "assignments" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "assignments" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                      </svg>
                      <span className="font-medium text-sm">التكليفات</span>
                    </a>
                    <a
                      href="/teachers/participation-certificates"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("participation-certificates"); setActivitiesDropdownOpen(false); router.push("/teachers/participation-certificates"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "participation-certificates" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "participation-certificates" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium text-sm">شهادات المشاركة</span>
                    </a>
                    <a
                      href="/teachers/supervision"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("supervision"); setActivitiesDropdownOpen(false); router.push("/teachers/supervision"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "supervision" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "supervision" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      <span className="font-medium text-sm">الإشراف على الطلبة</span>
                    </a>
                    <a
                      href="/teachers/scientific-evaluation"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("scientific-evaluation"); setActivitiesDropdownOpen(false); router.push("/teachers/scientific-evaluation"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "scientific-evaluation" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "scientific-evaluation" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="font-medium text-sm">التقويم العلمي واللغوي</span>
                    </a>
                    <a
                      href="/teachers/journals-management"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("journals-management"); setActivitiesDropdownOpen(false); router.push("/teachers/journals-management"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "journals-management" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "journals-management" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span className="font-medium text-sm">إدارة المجلات العلمية</span>
                    </a>
                    <a
                      href="/teachers/volunteer-work"
                      onClick={(e) => { e.preventDefault(); setActiveMenuItem("volunteer-work"); setActivitiesDropdownOpen(false); router.push("/teachers/volunteer-work"); }}
                      className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                        activeMenuItem === "volunteer-work" 
                          ? "bg-white/20 shadow-sm" 
                          : "hover:bg-white/10"
                      }`}
                    >
                      {activeMenuItem === "volunteer-work" && (
                        <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                      )}
                      <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="font-medium text-sm">الأعمال الطوعية</span>
                    </a>
                    {/* Extra padding at the bottom for better scrolling */}
                    <div className="h-2"></div>
                  </div>
                )}
              </div>

              <a
                href="/teachers/evaluation"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("evaluation"); router.push("/teachers/evaluation"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "evaluation" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "evaluation" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="font-medium text-sm">التقييم</span>
              </a>

              <a
                href="/teachers/analytics"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("analytics"); router.push("/teachers/analytics"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "analytics" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "analytics" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-sm">التحليلات الزمنية والإنتاجية</span>
              </a>

              <a
                href="/teachers/comparison"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("comparison"); router.push("/teachers/comparison"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "comparison" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "comparison" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="font-medium text-sm">المقارنات</span>
              </a>

              <a
                href="/teachers/cv"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("cv"); router.push("/teachers/cv"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "cv" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "cv" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-sm">السيرة الذاتية</span>
              </a>

              <a
                href="/teachers/collaboration"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("collaboration"); router.push("/teachers/collaboration"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "collaboration" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "collaboration" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="font-medium text-sm">نظام التعاون</span>
              </a>

              <a
                href="/teachers/communication"
                onClick={(e) => { e.preventDefault(); setActiveMenuItem("communication"); router.push("/teachers/communication"); }}
                className={`flex items-center gap-3 px-4 py-1.5 text-white rounded-lg transition-all duration-300 ease-in-out group relative ${
                  activeMenuItem === "communication" 
                    ? "bg-white/20 shadow-sm" 
                    : "hover:bg-white/10"
                }`}
              >
                {activeMenuItem === "communication" && (
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full"></div>
                )}
                <svg className="w-4 h-4 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="font-medium text-sm">نظام التواصل</span>
              </a>
            </nav>

            {/* Messages, Notifications and Logout Buttons */}
            <div className={`mt-auto p-4 border-t ${sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`} style={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}>
              <div className="flex items-center justify-center gap-3">
                {/* Messages Button */}
                <button
                  className="w-10 h-10 flex items-center justify-center border-2 border-white text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="الرسائل"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </button>

                {/* Notifications Button */}
                <button
                  className="w-10 h-10 flex items-center justify-center border-2 border-white text-white hover:bg-white/10 rounded-lg transition-colors relative"
                  aria-label="الإشعارات"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[#6366F1]">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </button>

                {/* Online Users Button */}
                <div className="relative online-users-container" style={{ zIndex: 10000 }}>
                  <button
                    onClick={() => setOnlineUsersMenuOpen(!onlineUsersMenuOpen)}
                    className="w-10 h-10 flex items-center justify-center border-2 border-white text-white hover:bg-white/10 rounded-lg transition-colors relative"
                    aria-label="المتصلين"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {onlineUsersCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-green-500 text-white text-[10px] font-bold rounded-full border-2 border-[#6366F1]">
                        {onlineUsersCount > 99 ? '99+' : onlineUsersCount}
                      </span>
                    )}
                  </button>

                  {/* Online Users Dropdown Menu */}
                  {onlineUsersMenuOpen && (
                    <div className="absolute bottom-full right-0 mb-2 mr-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 max-h-96 overflow-y-auto" style={{ zIndex: 10001 }}>
                      <div className="p-3 border-b border-gray-200 sticky top-0 bg-white">
                        <h3 className="text-sm font-bold" style={{ color: '#1F2937' }}>
                          المتصلون حالياً ({onlineUsersCount})
                        </h3>
                      </div>
                      <div className="py-2">
                        {onlineUsersList.length > 0 ? (
                          onlineUsersList.map((onlineUser) => (
                            <div
                              key={onlineUser.id}
                              className="px-4 py-2 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                              <span className="text-sm" style={{ color: '#1F2937' }}>
                                {onlineUser.name}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-center text-sm text-gray-500">
                            لا يوجد متصلون حالياً
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-10 h-10 flex items-center justify-center border-2 border-white text-white hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="تسجيل الخروج"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#FAFBFC' }}>
            {/* Stats Bar / News Bar */}
            <div className="bg-white border-b border-gray-100 flex-shrink-0">
              <div className="px-4 sm:px-6 lg:px-8 py-3">
                <div className="flex items-center justify-between gap-4">
                  {/* News Ticker */}
                  <div className="flex-1 flex items-center gap-3 border-l border-gray-200 pl-4">
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                      </svg>
                      <span className="text-xs font-bold uppercase" style={{ color: '#6366F1' }}>الأخبار</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center gap-4 animate-marquee">
                        <span className="text-sm whitespace-nowrap" style={{ color: '#6B7280' }}>مرحباً بك في منصة البحث العلمي - آخر الأخبار والتحديثات</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    {/* College Rank */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        ترتيبه بالكلية: <span className="font-bold text-indigo-600">{collegeRank !== null ? collegeRank : "..."}</span>
                      </span>
                    </div>

                    {/* Department Rank */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        ترتيبه بالقسم: <span className="font-bold text-indigo-600">{departmentRank !== null ? departmentRank : "..."}</span>
                      </span>
                    </div>

                    {/* Points */}
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
                        نقاطه: <span className="font-bold text-indigo-600">{totalPoints !== null ? totalPoints : "..."}</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Page Content Area */}
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <div className="max-w-full mx-auto px-2">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
}
