import Logo from "./components/Logo";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-blue-50 to-white overflow-x-hidden sm:overflow-visible">
      {/* Header with Logo */}
      <header className="flex justify-center items-center py-4 px-4 bg-white shadow-sm">
        <div className="flex justify-center items-center">
          {/* Mobile-only logo size */}
          <div className="sm:hidden">
            <Logo size="small" />
          </div>
          <div className="hidden sm:block">
            <Logo />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-start sm:justify-center px-4 py-4 sm:py-6 max-w-4xl mx-auto w-full">
        {/* Mobile-only container + card (no layout change on >=640px) */}
        <div className="w-full max-w-[420px] mx-auto sm:contents">
          <div className="bg-white rounded-[24px] p-5 shadow-[0_1px_0_rgba(15,23,42,0.04),0_14px_40px_rgba(15,23,42,0.08)] border border-slate-200/70 sm:contents">
            {/* Title Section */}
            <div className="text-center mb-6 sm:mb-8 space-y-3">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 leading-[1.3] sm:leading-tight">
            نظام إدارة الخطة العلمية
              </h1>
              <h2 className="text-base sm:text-xl md:text-2xl font-semibold text-blue-700">
            كلية الشرق للعلوم التنقنية التخصصية
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-gray-600 mt-3 sm:mt-4 max-w-[34ch] sm:max-w-3xl mx-auto leading-relaxed line-clamp-3 sm:line-clamp-none">
            منصة متكاملة لإدارة البحوث العلمية والخطة البحثية باشراف مباشر من مكتب المساعد العلمي
              </p>
            </div>

            {/* Buttons Section */}
            <div className="flex flex-col md:flex-row gap-3 sm:gap-4 w-full max-w-3xl justify-center items-stretch md:items-center">
              <Link
                href="/teachers/login"
                className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base w-full md:w-auto rounded-2xl sm:rounded-full shadow-sm sm:shadow-md transition-all duration-200 sm:duration-300 transform sm:hover:scale-105 hover:shadow-md sm:hover:shadow-lg h-14 sm:h-auto px-6 sm:px-8 sm:py-3"
              >
                <div className="h-full flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <span>بوابة التدريسيين</span>
                </div>
              </Link>

              <button className="group bg-green-600 hover:bg-green-700 text-white font-semibold text-base w-full md:w-auto rounded-2xl sm:rounded-full shadow-sm sm:shadow-md transition-all duration-200 sm:duration-300 transform sm:hover:scale-105 hover:shadow-md sm:hover:shadow-lg h-14 sm:h-auto px-6 sm:px-8 sm:py-3">
                <div className="h-full flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>بوابة رؤساء الأقسام</span>
                </div>
              </button>

              <Link
                href="/admin"
                className="group bg-purple-600 hover:bg-purple-700 text-white font-semibold text-base w-full md:w-auto rounded-2xl sm:rounded-full shadow-sm sm:shadow-md transition-all duration-200 sm:duration-300 transform sm:hover:scale-105 hover:shadow-md sm:hover:shadow-lg h-14 sm:h-auto px-6 sm:px-8 sm:py-3"
              >
                <div className="h-full flex items-center justify-center gap-3">
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>الإدارة</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4 sm:py-6 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center space-y-2 sm:space-y-3">
          <div className="space-y-1.5 sm:space-y-1.5">
            <p className="text-sm sm:text-lg font-bold text-blue-300">نظام إدارة الخطة العلمية والبحث العلمي</p>
            <p className="text-xs sm:text-base font-semibold">كلية الشرق للعلوم التقنية التخصصية</p>
            <p className="text-[12px] sm:text-sm text-gray-300">
              باشراف مباشر من مكتب المساعد العلمي - قسم الشؤون العلمية
            </p>
          </div>
          <div className="pt-3 border-t border-gray-700">
            <p className="text-[12px] sm:text-xs text-gray-400">
              برمجة وتصميم و تنفيذ م.م. علي حسين مزهر المسعود
            </p>
            <p className="text-[12px] sm:text-xs text-gray-400 mt-1">
              جميع الحقوق محفوظة © 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
