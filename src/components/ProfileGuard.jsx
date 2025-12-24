"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ProfileGuard({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkProfile = async (currentUser) => {
      // 1. Không check nếu đang ở trang hoàn thành profile
      if (pathname === "/complete-profile") return;

      const user = currentUser || (await supabase.auth.getUser()).data.user;
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_completed")
        .eq("id", user.id)
        .single();

      // 2. Nếu chưa hoàn thành -> Chuyển hướng
      if (!data || !data.is_completed) {
        console.log(":: SYSTEM_CHECK: Profile incomplete. Redirecting...");
        router.replace("/complete-profile");
      }
    };

    // Chạy check lần đầu khi mount
    checkProfile();

    // LẮNG NGHE SỰ KIỆN AUTH: Quan trọng để bắt được lúc vừa đăng nhập xong
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        checkProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router]);

  return children;
}