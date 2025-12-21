"use client"; // Bắt buộc phải có dòng này

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

// Import động các thành phần gây lỗi Hydration
const CyberCursor = dynamic(() => import("./CyberCursor"), { ssr: false });
const CyberContextMenu = dynamic(() => import("./CyberContextMenu"), { ssr: false });

export default function ClientOnlyWrapper() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Nếu chưa mount (đang ở server), không render gì cả
  if (!hasMounted) return null;

  return (
    <>
      <div className="hidden md:block">
        <CyberCursor />
      </div>
      <CyberContextMenu />
    </>
  );
}