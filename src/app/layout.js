import { Space_Mono } from "next/font/google"; // Import font mới
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthModal from "@/components/AuthModal";
import Player from "@/components/Player";
import SupabaseProvider from "@/providers/SupabaseProvider";
import { ModalProvider } from "@/context/ModalContext";
import GlobalPopup from "@/components/GlobalPopup";

// Cấu hình font Monospace
const font = Space_Mono({ 
  weight: ['400', '700'],
  subsets: ["latin"] 
});

export const metadata = {
  title: "V O I D - Music App",
  description: "Nghe nhạc trực tuyến",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* --- SCRIPT CHỐNG FLASH --- */}
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
      <body className={font.className}>
        <SupabaseProvider>
          <ModalProvider>
            <Sidebar>
              {children}
            </Sidebar>
            <Player />
            <AuthModal />
            <GlobalPopup />
          </ModalProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}