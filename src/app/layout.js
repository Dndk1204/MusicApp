import "./globals.css";
import SupabaseProvider from "@/providers/SupabaseProvider";
import { ModalProvider } from "@/context/ModalContext";
import AuthModal from "@/components/AuthModal";
import UploadModal from "@/components/UploadModal";
import GlobalPopup from "@/components/GlobalPopup";
import AuthWrapper from "@/components/AuthWrapper";
import CyberCursor from "@/components/CyberCursor";
import CyberContextMenu from "@/components/CyberContextMenu";
import MainLayout from "@/components/MainLayout"; 

export const metadata = {
  title: "V O I D - Music App",
  description: "Nghe nhạc trực tuyến",
  // Thêm viewport để chặn zoom trên mobile, tạo cảm giác app native
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var localTheme=localStorage.getItem('theme');var supportDarkMode=window.matchMedia('(prefers-color-scheme: dark)').matches;if(localTheme==='dark'||(!localTheme)){document.documentElement.classList.add('dark');if(!localTheme)localStorage.setItem('theme','dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();` }} />
      </head>
      
      {/* BODY: 
          - h-[100dvh]: Fix lỗi thanh địa chỉ trên mobile che mất Player
          - overscroll-none: Chặn kéo nảy trang trên iOS
          - touch-pan-y: Tối ưu cho thao tác vuốt dọc
      */}
      <body className="bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white h-[100dvh] w-full overflow-hidden flex flex-col transition-colors duration-500 overscroll-none touch-pan-y">
        <SupabaseProvider>
          <ModalProvider>
            <AuthWrapper>
              
              {/* Sử dụng MainLayout để xử lý giao diện responsive */}
              <MainLayout>
                  {children}
              </MainLayout>

              {/* Các Modal Global */}
              <AuthModal />
              <UploadModal />
              <GlobalPopup />
              
              {/* Chỉ hiện CyberCursor trên Desktop (md trở lên) */}
              <div className="md:block">
                <CyberCursor />
              </div>
              
              <CyberContextMenu />
              
            </AuthWrapper>
          </ModalProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}