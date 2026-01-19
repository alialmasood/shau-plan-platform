"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import Logo from "@/app/components/Logo";

type AcademicTitle = "professor" | "associate_professor" | "lecturer" | "assistant_lecturer";
type Department = string;

const academicTitles = [
  { value: "professor", label: "أستاذ" },
  { value: "associate_professor", label: "أستاذ مساعد" },
  { value: "lecturer", label: "مدرس" },
  { value: "assistant_lecturer", label: "مدرس مساعد" },
];

type DepartmentOption = { id: number; code: string; nameAr: string };

export default function TeachersRegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nameArabic: "",
    nameEnglish: "",
    phone: "+964",
    academicTitle: "" as AcademicTitle | "",
    department: "" as Department | "",
  });
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadDepartments() {
      try {
        setDepartmentsLoading(true);
        const res = await fetch("/api/departments");
        const json = (await res.json()) as { ok: boolean; items: DepartmentOption[] };
        if (!mounted) return;
        setDepartments(Array.isArray(json.items) ? json.items : []);
      } catch {
        if (!mounted) return;
        setDepartments([]);
      } finally {
        if (!mounted) return;
        setDepartmentsLoading(false);
      }
    }
    loadDepartments();
    return () => {
      mounted = false;
    };
  }, []);

  // Validate email format and domain
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return false;
    }
    return email.toLowerCase().endsWith("@shau.edu.iq");
  };

  // Validate phone number (Iraqi format: +964)
  const validatePhone = (phone: string): boolean => {
    if (!phone.startsWith("+964")) {
      return false;
    }
    // +964 followed by 9 or 10 digits
    const phoneRegex = /^\+964[0-9]{9,10}$/;
    return phoneRegex.test(phone);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "يجب أن يكون البريد الإلكتروني بالامتداد @shau.edu.iq";
    }

    // Password validation
    if (!formData.password.trim()) {
      newErrors.password = "كلمة المرور مطلوبة";
    } else if (formData.password.length < 8) {
      newErrors.password = "كلمة المرور يجب أن تكون 8 أحرف على الأقل";
    }

    // Confirm password validation
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = "تأكيد كلمة المرور مطلوب";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "كلمة المرور غير متطابقة";
    }

    // Arabic name validation
    if (!formData.nameArabic.trim()) {
      newErrors.nameArabic = "الاسم بالعربية مطلوب";
    }

    // English name validation
    if (!formData.nameEnglish.trim()) {
      newErrors.nameEnglish = "الاسم بالإنجليزية مطلوب";
    }

    // Phone validation
    if (!formData.phone.trim() || formData.phone === "+964") {
      newErrors.phone = "رقم الهاتف مطلوب";
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = "يجب أن يبدأ رقم الهاتف بـ +964 متبوعاً بـ 9 أو 10 أرقام";
    }

    // Academic title validation
    if (!formData.academicTitle) {
      newErrors.academicTitle = "اللقب العلمي مطلوب";
    }

    // Department validation
    if (!formData.department) {
      newErrors.department = "القسم مطلوب";
    }

    // Terms agreement
    if (!agreeToTerms) {
      newErrors.terms = "يجب الموافقة على الشروط والأحكام";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/teachers/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          nameArabic: formData.nameArabic,
          nameEnglish: formData.nameEnglish,
          phone: formData.phone,
          academicTitle: formData.academicTitle,
          department: formData.department,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "حدث خطأ أثناء إنشاء الحساب");
      }

      if (data.user) {
        setSuccess(true);
      }
    } catch (error: any) {
      setErrors({ general: error.message || "حدث خطأ أثناء إنشاء الحساب. يرجى المحاولة مرة أخرى." });
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is complete for enabling terms checkbox
  const isFormComplete = () => {
    return (
      formData.email.trim() &&
      formData.password.trim() &&
      formData.confirmPassword.trim() &&
      formData.nameArabic.trim() &&
      formData.nameEnglish.trim() &&
      formData.phone.trim() &&
      formData.phone !== "+964" &&
      formData.academicTitle &&
      formData.department
    );
  };

  if (success) {
    return (
      <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden max-[639px]:overflow-x-hidden">
        <header className="flex justify-center items-center py-2 px-4 bg-white shadow-sm flex-shrink-0">
          <div className="flex justify-center items-center">
            {/* Mobile-only logo size target: 56–72px */}
            <div className="max-[639px]:scale-110 origin-center">
              <Logo size="small" />
            </div>
          </div>
        </header>
        <main className="flex-1 flex items-center justify-center px-4 py-4 overflow-y-auto max-[639px]:items-start max-[639px]:justify-start max-[639px]:pt-3">
          <div className="w-full max-w-md max-[639px]:max-w-[420px] max-[639px]:mx-auto bg-white rounded-lg shadow-lg p-8 text-center max-[639px]:rounded-3xl max-[639px]:p-5 max-[639px]:shadow-sm max-[639px]:border max-[639px]:border-slate-200/70">
            <div className="mb-4">
              <svg className="mx-auto w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">تم إنشاء الحساب بنجاح!</h2>
            <p className="text-gray-600 mb-6">
              تم إنشاء حسابك بنجاح في النظام: <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              تم حفظ بياناتك في قاعدة البيانات. يمكنك الآن تسجيل الدخول باستخدام بريدك الإلكتروني وكلمة المرور.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 max-[639px]:p-3 max-[639px]:text-[13px]">
              <p className="text-sm text-blue-800">
                <strong>معلومة:</strong> تم حفظ جميع بياناتك في قاعدة البيانات ويمكن استخدامها للمصادقة مباشرة.
              </p>
            </div>
            <Link
              href="/teachers/login"
              className="inline-block w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 max-[639px]:h-14 max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:text-base max-[639px]:flex max-[639px]:items-center max-[639px]:justify-center max-[639px]:hover:scale-100"
            >
              الانتقال إلى تسجيل الدخول
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-b from-blue-50 to-white overflow-hidden max-[639px]:overflow-x-hidden">
      {/* Header with Logo */}
      <header className="flex justify-center items-center py-2 px-4 bg-white shadow-sm flex-shrink-0">
        <div className="flex justify-center items-center">
          {/* Mobile-only logo size target: 56–72px */}
          <div className="max-[639px]:scale-110 origin-center">
            <Logo size="small" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4 max-[639px]:pt-3">
        <div className="max-w-4xl mx-auto max-[639px]:max-w-[420px]">
          {/* Title */}
          <div className="text-center mb-6 max-[639px]:mb-4">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 max-[639px]:text-2xl max-[639px]:leading-[1.3]">
              انضم إلى نظام إدارة الخطة العلمية
            </h1>
            <p className="text-gray-600 text-xs md:text-sm max-[639px]:text-sm">
              كلية الشرق للعلوم التنقنية التخصصية
            </p>
          </div>

          {/* Register Form */}
          <div className="bg-white rounded-lg shadow-lg p-6 md:p-8 max-[639px]:rounded-3xl max-[639px]:p-5 max-[639px]:shadow-sm max-[639px]:border max-[639px]:border-slate-200/70">
            <form onSubmit={handleSubmit} className="space-y-6 max-[639px]:space-y-5">
              {/* Personal Information Section */}
              <div className="border-b border-gray-200 pb-6 mb-6 max-[639px]:pb-4 max-[639px]:mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 max-[639px]:text-base max-[639px]:mb-3">
                  المعلومات الشخصية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-[639px]:gap-3.5">
                  {/* Email */}
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      البريد الإلكتروني <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="example@shau.edu.iq"
                        className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                          errors.email ? "border-red-500" : "border-gray-300"
                        } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                        dir="ltr"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 max-[639px]:leading-relaxed">
                      يجب أن يكون البريد الإلكتروني بالامتداد @shau.edu.iq
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="أدخل كلمة المرور"
                        className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                          errors.password ? "border-red-500" : "border-gray-300"
                        } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px] max-[639px]:pr-12 max-[639px]:pl-4`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition"
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">8 أحرف على الأقل</p>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      تأكيد كلمة المرور <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="أعد إدخال كلمة المرور"
                        className={`w-full px-4 py-3 pl-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                          errors.confirmPassword ? "border-red-500" : "border-gray-300"
                        } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px] max-[639px]:pr-12 max-[639px]:pl-4`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none transition"
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Arabic Name */}
                  <div>
                    <label htmlFor="nameArabic" className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم باللغة العربية <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nameArabic"
                      name="nameArabic"
                      value={formData.nameArabic}
                      onChange={handleChange}
                      placeholder="أدخل الاسم الكامل بالعربية"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.nameArabic ? "border-red-500" : "border-gray-300"
                      } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                      dir="rtl"
                    />
                    {errors.nameArabic && (
                      <p className="mt-1 text-sm text-red-600">{errors.nameArabic}</p>
                    )}
                  </div>

                  {/* English Name */}
                  <div>
                    <label htmlFor="nameEnglish" className="block text-sm font-medium text-gray-700 mb-2">
                      الاسم باللغة الإنجليزية <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="nameEnglish"
                      name="nameEnglish"
                      value={formData.nameEnglish}
                      onChange={handleChange}
                      placeholder="Enter full name in English"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.nameEnglish ? "border-red-500" : "border-gray-300"
                      } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                      dir="ltr"
                    />
                    {errors.nameEnglish && (
                      <p className="mt-1 text-sm text-red-600">{errors.nameEnglish}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="md:col-span-2">
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      رقم الهاتف <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+964XXXXXXXXX"
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.phone ? "border-red-500" : "border-gray-300"
                      } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                      dir="ltr"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500 max-[639px]:leading-relaxed">
                      يجب أن يبدأ بـ +964 متبوعاً بـ 9 أو 10 أرقام
                    </p>
                  </div>
                </div>
              </div>

              {/* Academic Information Section */}
              <div className="border-b border-gray-200 pb-6 mb-6 max-[639px]:pb-4 max-[639px]:mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-4 max-[639px]:text-base max-[639px]:mb-3">
                  المعلومات الأكاديمية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-[639px]:gap-3.5">
                  {/* Academic Title */}
                  <div>
                    <label htmlFor="academicTitle" className="block text-sm font-medium text-gray-700 mb-2">
                      اللقب العلمي <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="academicTitle"
                      name="academicTitle"
                      value={formData.academicTitle}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.academicTitle ? "border-red-500" : "border-gray-300"
                      } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                      dir="rtl"
                    >
                      <option value="">اختر اللقب العلمي</option>
                      {academicTitles.map((title) => (
                        <option key={title.value} value={title.value}>
                          {title.label}
                        </option>
                      ))}
                    </select>
                    {errors.academicTitle && (
                      <p className="mt-1 text-sm text-red-600">{errors.academicTitle}</p>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                      القسم أو التشكيل <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        errors.department ? "border-red-500" : "border-gray-300"
                      } max-[639px]:h-12 max-[639px]:py-0 max-[639px]:text-[15px]`}
                      dir="rtl"
                    >
                      <option value="">
                        {departmentsLoading ? "جارٍ تحميل الأقسام..." : "اختر القسم"}
                      </option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.code}>
                          {dept.nameAr}
                        </option>
                      ))}
                    </select>
                    {errors.department && (
                      <p className="mt-1 text-sm text-red-600">{errors.department}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="mb-6 max-[639px]:mb-4">
                <div className="flex items-start max-[639px]:gap-2 max-[639px]:px-3 max-[639px]:py-2.5 max-[639px]:rounded-xl max-[639px]:border max-[639px]:border-slate-200/70">
                  <input
                    type="checkbox"
                    id="agreeToTerms"
                    checked={agreeToTerms}
                    onChange={(e) => {
                      setAgreeToTerms(e.target.checked);
                      if (errors.terms) {
                        setErrors((prev) => ({ ...prev, terms: "" }));
                      }
                    }}
                    disabled={!isFormComplete()}
                    className={`mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 ${
                      !isFormComplete() ? "opacity-50 cursor-not-allowed" : ""
                    } max-[639px]:w-5 max-[639px]:h-5`}
                  />
                  <label
                    htmlFor="agreeToTerms"
                    className={`mr-2 text-sm text-gray-700 ${!isFormComplete() ? "opacity-50" : ""} max-[639px]:mr-0 max-[639px]:text-[13px] max-[639px]:leading-relaxed`}
                  >
                    أوافق على <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">الشروط والأحكام</Link> و{" "}
                    <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">سياسة الخصوصية</Link>
                  </label>
                </div>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-600">{errors.terms}</p>
                )}
                {!isFormComplete() && (
                  <p className="mt-1 text-xs text-gray-500">يرجى إكمال جميع الحقول أولاً</p>
                )}
              </div>

              {/* Important Message */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 max-[639px]:p-3 max-[639px]:mb-4">
                <p className="text-sm text-yellow-800 max-[639px]:text-[13px] max-[639px]:leading-relaxed">
                  <strong>معلومة مهمة:</strong> سيتم التحقق من بياناتك من قبل إدارة النظام قبل تفعيل الحساب
                </p>
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
                disabled={isLoading || !isFormComplete() || !agreeToTerms}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none max-[639px]:mt-4 max-[639px]:h-14 max-[639px]:py-0 max-[639px]:rounded-2xl max-[639px]:text-base max-[639px]:shadow-lg max-[639px]:flex max-[639px]:items-center max-[639px]:justify-center max-[639px]:hover:scale-100"
              >
                {isLoading ? "جاري إنشاء الحساب..." : "إنشاء الحساب"}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center pt-6 border-t border-gray-200 max-[639px]:mt-5 max-[639px]:pt-4">
              <p className="text-sm text-gray-600 max-[639px]:text-[13px]">
                لديك حساب بالفعل؟{" "}
                <Link href="/teachers/login" className="text-blue-600 hover:text-blue-700 font-medium max-[639px]:inline-flex max-[639px]:items-center max-[639px]:justify-center max-[639px]:px-3 max-[639px]:py-2 max-[639px]:rounded-xl">
                  تسجيل الدخول
                </Link>
              </p>
              <div className="mt-3 max-[639px]:mt-2">
                <Link href="/" className="text-sm text-gray-600 hover:text-gray-800 font-medium max-[639px]:text-[13px] max-[639px]:inline-flex max-[639px]:items-center max-[639px]:justify-center max-[639px]:px-3 max-[639px]:py-2 max-[639px]:rounded-xl">
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
