import { cookies } from "next/headers";
import AdminLoginForm from "./AdminLoginForm";

const ADMIN_COOKIE_NAME = "spsh_admin";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const isAuthed = cookieStore.get(ADMIN_COOKIE_NAME)?.value === "1";

  if (!isAuthed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            صفحة الإدارة
          </h1>
          <p className="text-sm text-gray-600 text-center mt-2">
            للدخول أدخل الرقم المخصص.
          </p>

          <div className="mt-6">
            <AdminLoginForm />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

