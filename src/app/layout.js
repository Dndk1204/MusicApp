import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthModal from "@/components/AuthModal";
import UploadModal from "@/components/UploadModal"; // <--- Đã thêm lại từ Layout 1
import Player from "@/components/Player";
import SupabaseProvider from "@/providers/SupabaseProvider";
import { ModalProvider } from "@/context/ModalContext";
import GlobalPopup from "@/components/GlobalPopup";
import AuthWrapper from "@/components/AuthWrapper";
import CyberCursor from "@/components/CyberCursor";
import CyberContextMenu from "@/components/CyberContextMenu";

export const metadata = {
  title: "V O I D - Music App",
  description: "Nghe nhạc trực tuyến",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- SCRIPT CHỐNG FLASH (Giữ lại version có comment chi tiết của Layout 2) --- */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Kiểm tra localStorage
                  var localTheme = localStorage.getItem('theme');
                  // Kiểm tra cài đặt hệ thống
                  var supportDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  
                  // Ưu tiên Dark Mode: Nếu đã lưu 'dark' HOẶC chưa lưu gì cả (mặc định là Dark)
                  if (localTheme === 'dark' || (!localTheme)) {
                    document.documentElement.classList.add('dark');
                    // Cập nhật lại localStorage nếu chưa có để đồng bộ
                    if (!localTheme) localStorage.setItem('theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <SupabaseProvider>
          <ModalProvider>
            <AuthWrapper>
              <Sidebar>
                {children}
              </Sidebar>
              <Player />

              {/* --- CÁC MODAL PHẢI NẰM Ở ĐÂY --- */}
              <AuthModal />
              <UploadModal /> {/* <--- Đảm bảo thành phần này xuất hiện */}
              <GlobalPopup />
              <CyberCursor />
              <CyberContextMenu />
              {/* -------------------------------- */}
            </AuthWrapper>
          </ModalProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}
