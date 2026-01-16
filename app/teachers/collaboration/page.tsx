"use client";

import { useLayout } from "../layout";

export default function CollaborationPage() {
  const { user } = useLayout();

  if (!user) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <h1 className="text-2xl font-bold mb-4" style={{ color: '#1F2937' }}>نظام التعاون</h1>
      <p className="text-gray-600">سيتم إضافة المحتوى هنا لاحقاً</p>
    </div>
  );
}
