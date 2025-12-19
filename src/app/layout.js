import "./globals.css";
import Navbar from "@/components/Navbar"; 
import Sidebar from "@/components/Sidebar"; 
import AuthModal from "@/components/AuthModal";
import UploadModal from "@/components/UploadModal";
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
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var localTheme=localStorage.getItem('theme');var supportDarkMode=window.matchMedia('(prefers-color-scheme: dark)').matches;if(localTheme==='dark'||(!localTheme)){document.documentElement.classList.add('dark');if(!localTheme)localStorage.setItem('theme','dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();` }} />
      </head>
      
      {/* BODY: Fixed Height, Flex Column */}
      <body className="bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white h-screen w-screen overflow-hidden flex flex-col transition-colors duration-500">
        <SupabaseProvider>
          <ModalProvider>
            <AuthWrapper>
              
              {/* 1. NAVBAR SECTION (Cố định chiều cao, z-index cao nhất) */}
              <header className="fixed h-[64px] shrink-0 w-full !z-[9999] shadow-md">
                 <Navbar />
              </header>

              {/* 2. MAIN LAYOUT (Sidebar + Page Content) */}
              <div className="flex flex-1 overflow-hidden w-full relative">
                 
                 {/* Sidebar bên trái */}
                 <div className="!mt-[64px]">
                   <Sidebar /> 
                 </div>
                 {/* Content bên phải (Scrollable) */}
                 {/* QUAN TRỌNG: id="main-content" để các trang con có thể target nếu cần */}
                 <main id="main-content" className="flex-1 min-h-full w-full overflow-y-auto relative scroll-smooth bg-transparent">
                    <div className="min-h-full w-full p-4 pb-[140px] !mt-[64px]">
                        {children}
                    </div>
                 </main>
              </div>

              {/* 3. PLAYER (Fixed Bottom, nằm trên cùng) */}
              <div className="fixed bottom-0 left-0 w-full z-[9998]">
                  <Player />
              </div>

              {/* --- GLOBAL COMPONENTS --- */}
              <AuthModal />
              <UploadModal />
              <GlobalPopup />
              <CyberCursor />
              <CyberContextMenu />
              
            </AuthWrapper>
          </ModalProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}