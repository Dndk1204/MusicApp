"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { GlitchText, CyberButton, ScanlineOverlay } from "@/components/CyberComponents";
import { Camera, User, ArrowRight, LayoutGrid, ShieldCheck, Phone, FileText } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", phone: "", bio: "", avatar_url: null, banner_url: null });

  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (!currentUser) return router.replace("/");
        setUser(currentUser);

        const { data } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
        
        if (data) {
          if (data.is_completed) return router.replace("/");
          
          // FIX: Đảm bảo các giá trị null chuyển thành chuỗi rỗng ""
          setProfile({
            ...data,
            full_name: data.full_name || "",
            phone: data.phone || "",
            bio: data.bio || "",
            avatar_url: data.avatar_url || "",
            banner_url: data.banner_url || ""
          });

          setAvatarPreview(data.avatar_url);
          setBannerPreview(data.banner_url);
        } 
      } catch (err) {
        console.error(err);
      } finally {
        setIsInitialLoading(false); // <--- TẮT LOADING KHI XONG
      }
    })();
  }, [router]);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "avatar") { setAvatarFile(file); setAvatarPreview(preview); }
    else { setBannerFile(file); setBannerPreview(preview); }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    if (!profile.full_name) return alert("REQUIRED: SYSTEM_IDENTITY (FULL_NAME)");
    setLoading(true);

    try {
      let newAvatarUrl = profile.avatar_url;
      let newBannerUrl = profile.banner_url;
      const uniqueID = Date.now().toString(36);

      // Upload logic (giữ nguyên của bạn)
      if (avatarFile) {
        const { data } = await supabase.storage.from("images").upload(`avatar-${user.id}-${uniqueID}`, avatarFile);
        if (data) newAvatarUrl = supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl;
      }
      if (bannerFile) {
        const { data } = await supabase.storage.from("images").upload(`banner-${user.id}-${uniqueID}`, bannerFile);
        if (data) newBannerUrl = supabase.storage.from("images").getPublicUrl(data.path).data.publicUrl;
      }

      const { error } = await supabase.from("profiles").upsert({
        id: user.id,
        ...profile,
        avatar_url: newAvatarUrl,
        banner_url: newBannerUrl,
        is_completed: true // Đánh dấu hoàn tất
      });

      if (error) throw error;
      
      // Thành công -> Đẩy về trang chủ hoặc profile
      router.push(`/user/${user.id}`);
      router.refresh();
    } catch (err) {
      alert(err.message);
    } finally { setLoading(false); }
  };

  const CompleteProfileSkeleton = () => (
    <div className="w-full max-w-6xl mx-auto h-full animate-pulse p-4">
      <div className="bg-neutral-100 dark:bg-neutral-900/40 border border-neutral-200 dark:border-white/5 relative overflow-hidden">
        <div className="h-48 md:h-72 w-full bg-neutral-200 dark:bg-neutral-800/50"></div>
        <div className="p-8 pt-24 space-y-8">
            <div className="h-10 w-64 bg-neutral-200 dark:bg-neutral-800"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="h-32 bg-neutral-200 dark:bg-neutral-800"></div>
                <div className="h-32 bg-neutral-200 dark:bg-neutral-800"></div>
            </div>
        </div>
      </div>
    </div>
  );

  if (isInitialLoading) return <CompleteProfileSkeleton />;
  if (!user) return null;

  return (
    <div className="w-full max-w-6xl mx-auto h-full p-0 md:p-4">
      {/* Main System Frame */}
      <div className="bg-white dark:bg-neutral-900/40 border border-neutral-200 dark:border-emerald-500/10 relative backdrop-blur-md overflow-hidden shadow-2xl dark:shadow-none">
        
        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-neutral-400 dark:text-emerald-500/20 hidden md:block uppercase tracking-tighter">
          System_Core: V.1.0.4 // NODE_AUTH_SUCCESS
        </div>
        <div className="absolute -top-[1px] -left-[1px] w-12 h-12 border-t-2 border-l-2 border-emerald-500/40"></div>
        <div className="absolute -bottom-[1px] -right-[1px] w-12 h-12 border-b-2 border-r-2 border-emerald-500/40"></div>

        <form onSubmit={handleSave}>
          {/* --- SECTION 1: VISUAL ASSETS --- */}
          <div className="relative group">
            <div className="h-48 md:h-72 w-full bg-neutral-100 dark:bg-black/80 relative overflow-hidden border-b border-neutral-200 dark:border-emerald-500/20">
              <input type="file" id="banner-upload" className="hidden" onChange={(e) => handleFileChange(e, "banner")} />
              <label htmlFor="banner-upload" className="cursor-pointer block h-full w-full">
                {bannerPreview ? (
                  <img src={bannerPreview} className="w-full h-full object-cover opacity-80 dark:opacity-50 group-hover:opacity-100 dark:group-hover:opacity-70 transition-all duration-700" alt="banner"/>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 dark:from-emerald-500/5 via-transparent to-transparent">
                    <LayoutGrid size={40} className="text-emerald-600/20 dark:text-emerald-500/20 mb-2" />
                    <span className="text-[10px] font-mono text-neutral-400 dark:text-emerald-500/40 tracking-[0.3em]">UPLOAD_ENVIRONMENT_MAP</span>
                  </div>
                )}
                <ScanlineOverlay />
              </label>
              <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-neutral-900 to-transparent pointer-events-none opacity-60"></div>
            </div>

            {/* Avatar Positioned Over Banner */}
            <div className="absolute -bottom-16 left-6 md:left-12 flex items-end gap-6">
              <div className="relative group/avatar">
                <input type="file" id="avatar-upload" className="hidden" onChange={(e) => handleFileChange(e, "avatar")} />
                <label htmlFor="avatar-upload" className="block w-32 h-32 md:w-40 md:h-40 bg-white dark:bg-black border-2 border-white dark:border-emerald-500/30 overflow-hidden cursor-pointer relative shadow-xl dark:shadow-[0_0_30px_rgba(16,185,129,0.1)] transition-transform active:scale-95">
                  {avatarPreview ? (
                    <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar"/>
                  ) : (
                    <div className="h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-900"><User size={48} className="text-neutral-300 dark:text-emerald-500/20"/></div>
                  )}
                  <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                    <Camera size={24} className="text-white" />
                  </div>
                </label>
              </div>
              
              <div className="mb-4 pb-2">
                <h2 className="text-2xl md:text-3xl font-black font-mono text-neutral-900 dark:text-white tracking-tighter flex items-center gap-3 italic uppercase">
                  <div className="w-2 h-8 bg-emerald-500 animate-pulse"></div>
                  {profile.full_name || "NEW_ENTITY"}
                </h2>
                <p className="text-[10px] font-mono text-neutral-400 dark:text-emerald-500/60 uppercase tracking-widest mt-1">
                  ID: {user?.id?.substring(0, 18).toUpperCase()}
                </p>
              </div>
            </div>
          </div>

          {/* --- SECTION 2: DATA INPUTS --- */}
          <div className="p-6 md:p-12 pt-24 md:pt-28 space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* Left Column */}
              <div className="lg:col-span-5 space-y-8">
                <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">01_IDENTIFICATION</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2"><User size={10}/> Display_Name</label>
                    <input 
                      required 
                      value={profile.full_name || ""} 
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                      className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-emerald-500/10 p-4 text-sm font-mono text-neutral-800 dark:text-white focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-neutral-800" 
                      placeholder="ENTER_NAME..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest flex items-center gap-2"><Phone size={10}/> Comm_Link</label>
                    <input 
                      value={profile.phone || ""} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})} 
                      className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-emerald-500/10 p-4 text-sm font-mono text-neutral-800 dark:text-white focus:border-emerald-500 outline-none transition-all placeholder:text-neutral-300 dark:placeholder:text-neutral-800" 
                      placeholder="+84_MOBILE_INT"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-7 space-y-8">
                <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                  <span className="text-xs font-mono text-emerald-600 dark:text-emerald-500 font-bold uppercase tracking-widest">02_NEURAL_BIOGRAPHY</span>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-mono text-neutral-400 dark:text-neutral-500 uppercase tracking-widest italic flex justify-between items-center">
                     <span className="flex items-center gap-2"><FileText size={10}/> System_Description_Data</span>
                     <span>{profile.bio?.length || 0} / 500</span>
                   </label>
                   <textarea 
                     rows={6} 
                     value={profile.bio || ""} 
                     onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                     className="w-full bg-neutral-50 dark:bg-black/40 border border-neutral-200 dark:border-emerald-500/10 p-4 text-sm font-mono text-neutral-800 dark:text-white focus:border-emerald-500 outline-none resize-none transition-all leading-relaxed placeholder:text-neutral-300 dark:placeholder:text-neutral-800" 
                     placeholder="INITIATING_BIO_UPLOAD..."
                   />
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-neutral-100 dark:border-emerald-500/10 pt-10">
              <div className="flex items-center gap-4 text-emerald-600/70 dark:text-emerald-500/70">
                 <ShieldCheck size={24} className="shrink-0" />
                 <p className="text-[9px] font-mono leading-tight uppercase tracking-tight">
                   By committing, you authorize the central core to synchronize <br className="hidden md:block"/>
                   your identity across the distributed neural network nodes.
                 </p>
              </div>
              
              <CyberButton type="submit" disabled={loading} className="w-full md:w-64 h-14 group">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-black/30 dark:border-white/30 border-t-black dark:border-t-white animate-spin rounded-full"></div>
                    <span className="tracking-[0.2em] text-xs">UPLOADING_CORES...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-xl font-black italic tracking-tighter">EXECUTE_SYNC</span>
                    <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </CyberButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}