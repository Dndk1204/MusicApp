"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // Lấy tham số `next` từ URL, mặc định về trang chủ
    try {
      const url = new URL(window.location.href);
      const next = url.searchParams.get("next") || "/";

      // Supabase client được cấu hình với `detectSessionInUrl: true`
      // nên khi trang này load trên client, supabase sẽ cố gắng xử lý session
      // Chờ 700ms để Supabase xử lý rồi chuyển tiếp đến trang `next`.
      const t = setTimeout(() => {
        router.replace(next);
      }, 700);

      return () => clearTimeout(t);
    } catch (e) {
      router.replace("/");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-100 dark:bg-black">
      <div className="p-6 text-center">
        <h2 className="text-lg font-bold font-mono mb-2">Processing authentication...</h2>
        <p className="text-sm text-neutral-500">You will be redirected shortly.</p>
      </div>
    </div>
  );
}
