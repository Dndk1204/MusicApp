import "./globals.css";
import SupabaseProvider from "@/providers/SupabaseProvider";
import { ModalProvider } from "@/context/ModalContext";
import AuthWrapper from "@/components/AuthWrapper";
import AuthModal from "@/components/AuthModal";
import UploadModal from "@/components/UploadModal";
import GlobalPopup from "@/components/GlobalPopup";
import MainLayout from "@/components/MainLayout";
import ClientOnlyWrapper from "@/components/ClientOnlyWrapper";
import TitleUpdater from "@/components/TitleUpdater";
import ProfileGuard from "@/components/ProfileGuard";

export const viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: 0,
};

export const metadata = {
  title: "V O I D - Music App",
  description: "Nghe nhạc trực tuyến phong cách Cyberpunk",
  icons: {
    icon: [
      { url: "/VOID_favicon.ico" },
      { url: "/VOID_favicon.ico", sizes: "32x32" }
    ],
    shortcut: "/VOID_favicon.ico",
    apple: "/VOID_favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var localTheme=localStorage.getItem('theme');var supportDarkMode=window.matchMedia('(prefers-color-scheme: dark)').matches;if(localTheme==='dark'||(!localTheme && supportDarkMode)){document.documentElement.classList.add('dark');if(!localTheme)localStorage.setItem('theme','dark');}else{document.documentElement.classList.remove('dark');}}catch(e){}})();`,
          }}
        />
      </head>
      
      <body className="bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white h-[100dvh] w-full overflow-hidden flex flex-col transition-colors duration-500 overscroll-none touch-pan-y">
        <SupabaseProvider>
          <ModalProvider>
            <AuthWrapper>
              <TitleUpdater />
              
              <ProfileGuard> 
                <MainLayout>
                  {children}
                </MainLayout>
              </ProfileGuard>

              <AuthModal />
              <UploadModal />
              <GlobalPopup />
              
              {/* Thành phần này sẽ tự xử lý việc chỉ hiện trên Client */}
              <ClientOnlyWrapper />
              
            </AuthWrapper>
          </ModalProvider>
        </SupabaseProvider>
      </body>
    </html>
  );
}