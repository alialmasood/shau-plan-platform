"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/app/components/Logo";

export default function TeachersLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  // Validate email format and domain
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    // Check if email ends with @shau.edu.iq
    return email.toLowerCase().endsWith("@shau.edu.iq");
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setIsLoading(true);

    // Validate email
    if (!email.trim()) {
      setErrors({ email: "البريد الإلكتروني مطلوب" });
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setErrors({ email: "يجب أن يكون البريد الإلكتروني بالامتداد @shau.edu.iq" });
      setIsLoading(false);
      return;
    }

    // Validate password
    if (!password.trim()) {
      setErrors({ password: "كلمة المرور مطلوبة" });
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrors({ password: "كلمة المرور يجب أن تكون 6 أحرف على الأقل" });
      setIsLoading(false);
      return;
    }

    // Authenticate with backend
    try {
      const response = await fetch("/api/teachers/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "حدث خطأ أثناء تسجيل الدخول");
      }

      // Store user data in localStorage (optional, can use cookies)
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Redirect to teacher dashboard
      router.push("/teachers/dashboard");
    } catch (error: any) {
      setErrors({ general: error.message || "حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Header with Logo */}
      <header className="flex justify-center items-center py-2 px-4 bg-white shadow-sm flex-shrink-0">
        <div className="flex justify-center items-center">
          <Logo size="small" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-4 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1">
              نظام إدارة الخطة العلمية للتدريسيين
            </h1>
            <p className="text-gray-600 text-xs md:text-sm">
              كلية الشرق للعلوم التنقنية التخصصية
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrors({ ...errors, email: undefined });
                    }}
                    placeholder="example@shau.edu.iq"
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    dir="ltr"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="أدخل كلمة المرور"
                    className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition"
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Remember Me */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="rememberMe" className="mr-2 text-sm text-gray-700">
                  تذكرني
                </label>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm md:text-base"
              >
                {isLoading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>
            </form>

            {/* Additional Links */}
            <div className="mt-4 md:mt-5 space-y-2 text-center">
              <p className="text-sm text-gray-600">
                ليس لديك حساب؟{" "}
                <Link
                  href="/teachers/register"
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  سجل حساب جديد
                </Link>
              </p>
              <div className="pt-3 border-t border-gray-200">
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-800 font-medium"
                >
                  ← العودة للصفحة الرئيسية
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
