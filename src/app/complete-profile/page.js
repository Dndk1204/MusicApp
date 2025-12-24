"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { GlitchText, CyberButton } from "@/components/CyberComponents";
import { Camera, User, ArrowRight, LayoutGrid, ShieldCheck } from "lucide-react";

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
    <div className="w-full max-w-6xl mx-auto h-full animate-pulse">
      <div className="bg-neutral-900/40 border border-white/5 relative backdrop-blur-md overflow-hidden">
        {/* Banner Skeleton */}
        <div className="h-48 md:h-72 w-full bg-neutral-800/50 border-b border-white/5"></div>

        {/* Avatar & Title Overlap */}
        <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
          <div className="w-32 h-32 md:w-40 md:h-40 bg-neutral-800 border-2 border-white/5 shadow-xl"></div>
          <div className="mb-4 pb-2 space-y-3">
            <div className="h-8 w-48 md:w-64 bg-neutral-800"></div>
            <div className="h-3 w-32 bg-neutral-800/60"></div>
          </div>
        </div>

        <div className="p-8 md:p-12 pt-24 md:pt-28 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Cột trái Skeleton */}
            <div className="lg:col-span-5 space-y-8">
              <div className="h-4 w-32 bg-emerald-500/20 mb-6"></div>
              <div className="space-y-6">
                {[1, 2].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-2 w-20 bg-neutral-800"></div>
                    <div className="h-12 w-full bg-neutral-800/40"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cột phải Skeleton */}
            <div className="lg:col-span-7 space-y-8">
              <div className="h-4 w-40 bg-emerald-500/20 mb-6"></div>
              <div className="space-y-2">
                <div className="h-2 w-28 bg-neutral-800"></div>
                <div className="h-40 w-full bg-neutral-800/40"></div>
              </div>
            </div>
          </div>

          {/* Footer Skeleton */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-neutral-800 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-2 w-48 bg-neutral-800"></div>
                <div className="h-2 w-32 bg-neutral-800"></div>
              </div>
            </div>
            <div className="h-12 w-full md:w-60 bg-emerald-500/10"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (isInitialLoading) return <CompleteProfileSkeleton />;
  if (!user) return null;

  return (
  <div className="w-full max-w-6xl mx-auto h-full">
    {/* Main System Frame */}
    <div className="bg-neutral-900/40 border border-emerald-500/10 relative backdrop-blur-md overflow-hidden">
      
      {/* Decorative Elements - Góc máy tính */}
      <div className="absolute top-0 right-0 p-2 text-[8px] font-mono text-emerald-500/20 hidden md:block">
        VOID_SYSTEM_V.1.0.4 // PROFILE_INIT
      </div>
      <div className="absolute -top-[1px] -left-[1px] w-12 h-12 border-t-2 border-l-2 border-emerald-500/40"></div>
      <div className="absolute -bottom-[1px] -right-[1px] w-12 h-12 border-b-2 border-r-2 border-emerald-500/40"></div>

      <form onSubmit={handleSave}>
        {/* --- SECTION 1: VISUAL ASSETS (Banner & Avatar) --- */}
        <div className="relative group">
          {/* Banner Container */}
          <div className="h-48 md:h-72 w-full bg-black/80 relative overflow-hidden border-b border-emerald-500/20">
            <input type="file" id="banner-upload" className="hidden" onChange={(e) => handleFileChange(e, "banner")} />
            <label htmlFor="banner-upload" className="cursor-pointer block h-full w-full">
              {bannerPreview ? (
                <img src={bannerPreview} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-all duration-500" alt="banner"/>
              ) : (
                <div className="h-full flex flex-col items-center justify-center bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent">
                  <LayoutGrid size={40} className="text-emerald-500/20 mb-2" />
                  <span className="text-[10px] font-mono text-emerald-500/40 tracking-[0.3em]">UPLOAD_ENVIRONMENT_MAP</span>
                </div>
              )}
            </label>
            
            {/* Gradient Overlay cho Banner */}
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 to-transparent pointer-events-none"></div>
          </div>

          {/* Avatar Positioned Over Banner */}
          <div className="absolute -bottom-16 left-8 md:left-12 flex items-end gap-6">
            <div className="relative group/avatar">
              <input type="file" id="avatar-upload" className="hidden" onChange={(e) => handleFileChange(e, "avatar")} />
              <label htmlFor="avatar-upload" className="block w-32 h-32 md:w-40 md:h-40 bg-black border-2 border-emerald-500/30 overflow-hidden cursor-pointer relative shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                {avatarPreview ? (
                  <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar"/>
                ) : (
                  <div className="h-full flex items-center justify-center bg-neutral-900"><User size={48} className="text-emerald-500/20"/></div>
                )}
                <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                  <Camera size={24} className="text-white" />
                </div>
              </label>
            </div>
            
            {/* User Title Information */}
            <div className="mb-4 pb-2">
              <h2 className="text-2xl md:text-3xl font-black font-mono text-white tracking-tighter flex items-center gap-3 italic">
                <div className="w-2 h-8 bg-emerald-500 animate-pulse"></div>
                {profile.full_name || "NEW_USER_ENTITY"}
              </h2>
              <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mt-1">
                UID: {user?.id?.substring(0, 18).toUpperCase()}...
              </p>
            </div>
          </div>
        </div>

        {/* --- SECTION 2: DATA INPUTS --- */}
        <div className="p-8 md:p-12 pt-24 md:pt-28 space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Cột trái: Thông tin định danh */}
            <div className="lg:col-span-5 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                  <span className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-widest">01_IDENTIFICATION</span>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Display_Name</label>
                    <input 
                      required 
                      value={profile.full_name || ""} 
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})} 
                      className="w-full bg-black/40 border border-emerald-500/10 p-4 text-sm font-mono text-white focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all" 
                      placeholder="ENTER_NAME..."
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Comm_Link_Primary</label>
                    <input 
                      value={profile.phone || ""} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})} 
                      className="w-full bg-black/40 border border-emerald-500/10 p-4 text-sm font-mono text-white focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none transition-all" 
                      placeholder="+84_MOBILE_INT"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cột phải: Bio & Metadata */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-6">
                <div className="flex items-center gap-2 border-l-2 border-emerald-500 pl-3">
                  <span className="text-xs font-mono text-emerald-500 font-bold uppercase tracking-widest">02_NEURAL_BIOGRAPHY</span>
                </div>

                <div className="space-y-2">
                   <label className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest italic flex justify-between">
                     <span>System_Description_Data</span>
                     <span>{profile.bio?.length || 0} / 500</span>
                   </label>
                   <textarea 
                     rows={6} 
                     value={profile.bio || ""} 
                     onChange={(e) => setProfile({...profile, bio: e.target.value})} 
                     className="w-full bg-black/40 border border-emerald-500/10 p-4 text-sm font-mono text-white focus:border-emerald-500/50 focus:bg-emerald-500/5 outline-none resize-none transition-all leading-relaxed" 
                     placeholder="INITIATING_BIO_UPLOAD..."
                   />
                </div>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-emerald-500/10 pt-10">
            <div className="flex items-center gap-4 text-emerald-500/70">
               <ShieldCheck size={20} />
               <p className="text-[9px] font-mono leading-tight uppercase tracking-tight">
                 By committing, you authorize VOID to synchronize <br/>
                 your neural profile data across all nodes.
               </p>
            </div>
            
            <CyberButton type="submit" disabled={loading} className="w-full md:w-60 h-12 group relative overflow-hidden">
              {loading ? (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full"></div>
                  <span className="tracking-[0.2em]">UPLOADING_CORES...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-lg font-black italic tracking-tighter group-hover:text-white">EXECUTE_SYNC</span>
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