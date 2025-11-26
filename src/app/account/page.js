"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User, Camera, Loader2, Pencil, X, Save } from "lucide-react";

const Account = () => {
  const router = useRouter();
  
  // --- STATES ---
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState(null);

  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  const [originalData, setOriginalData] = useState({}); 
  const fileInputRef = useRef(null);

  // 1. TẢI DỮ LIỆU
  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/");
          return;
        }

        setUser(session.user);

        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, phone')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') throw error;

        if (data) {
          setFullName(data.full_name || "");
          setAvatarUrl(data.avatar_url || "");
          setPhone(data.phone || "");
          
          setOriginalData({
            fullName: data.full_name || "",
            phone: data.phone || "",
            avatarUrl: data.avatar_url || ""
          });
        }
      } catch (error) {
        console.log("Lỗi tải profile:", error);
      } finally {
        setLoading(false);
      }
    };

    getProfile();
  }, [router]);

  // 2. XỬ LÝ UPLOAD ẢNH
  const handleUploadAvatar = async (event) => {
    try {
      setMessage(null);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed: ' + error.message });
    }
  };

  // 3. XỬ LÝ LƯU THÔNG TIN
  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          full_name: fullName,
          phone: phone,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      
      setMessage({ type: 'success', text: ':: PROFILE UPDATED SUCCESSFULLY ::' });
      
      setOriginalData({ fullName, phone, avatarUrl });
      setIsEditing(false);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event("profile-updated"));
      }
      
      setTimeout(() => setMessage(null), 3000);
      router.refresh();

    } catch (error) {
      setMessage({ type: 'error', text: 'Error: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(originalData.fullName);
    setPhone(originalData.phone);
    setAvatarUrl(originalData.avatarUrl);
    setIsEditing(false);
    setMessage(null);
  };

  return (
    <div className="w-full h-full flex flex-col items-center pt-10 px-4">
      
      {loading ? (
        <div className="flex items-center gap-x-2 text-emerald-600 dark:text-emerald-500 font-mono animate-pulse">
          <Loader2 className="animate-spin" /> LOADING_USER_DATA...
        </div>
      ) : (
        <div className="w-full max-w-4xl animate-in fade-in zoom-in-95 duration-500 pb-20">
            
            {/* TIÊU ĐỀ TRANG */}
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white">ACCOUNT_SETTINGS</h1>
                <p className="text-[10px] text-neutral-600 dark:text-neutral-500 tracking-[0.5em] mt-2">:: PERSONAL INFORMATION ::</p>
            </div>

            {/* FORM CONTAINER: Thêm bg-white/60 cho Light mode */}
            <div className="w-full bg-white/60 dark:bg-black/40 backdrop-blur-xl rounded-2xl p-8 border border-neutral-200 dark:border-white/10 shadow-2xl flex flex-col transition-colors duration-300">
            
            {/* HEADER FORM */}
            <div className="flex justify-between items-center mb-6 border-b border-neutral-200 dark:border-white/5 pb-4">
               <div className="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                  ID: <span className="text-emerald-600 dark:text-emerald-500">{user?.id?.slice(0, 8)}...</span>
               </div>
               
               <div>
                  {!isEditing ? (
                    <button 
                      onClick={() => setIsEditing(true)}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition py-2 px-4 bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 rounded-full border border-neutral-200 dark:border-white/5 font-mono text-xs"
                    >
                      <span>EDIT_MODE</span>
                      <Pencil size={14} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleCancel}
                      className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-red-500 transition py-2 px-4 bg-neutral-100 dark:bg-white/5 hover:bg-red-500/10 rounded-full border border-neutral-200 dark:border-white/5 font-mono text-xs"
                    >
                      <span>CANCEL</span>
                      <X size={14} />
                    </button>
                  )}
               </div>
            </div>

            {/* --- THÔNG BÁO --- */}
            {message && (
              <div className={`w-full p-3 rounded-md text-center text-xs font-mono font-bold mb-6 ${
                message.type === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                  : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30'
              }`}>
                {message.text}
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-10 items-start">
                
                {/* --- CỘT TRÁI: AVATAR --- */}
                <div className="flex flex-col items-center gap-4 w-full md:w-auto md:sticky md:top-0">
                    <div className="relative group">
                      {/* Avatar container: Light (bg-neutral-200) | Dark (bg-black/50) */}
                      <div className={`h-40 w-40 rounded-full bg-neutral-200 dark:bg-black/50 border-2 ${isEditing ? 'border-emerald-500 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'border-neutral-300 dark:border-white/10'} overflow-hidden flex items-center justify-center relative transition-all duration-300`}
                          onClick={() => isEditing && fileInputRef.current.click()}
                      >
                          {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" />
                          ) : (
                          <User size={80} className="text-neutral-400 dark:text-neutral-600" />
                          )}
                          
                          {/* Overlay khi sửa */}
                          {isEditing && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Camera className="text-emerald-400" size={30} />
                          </div>
                          )}
                      </div>
                      <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleUploadAvatar} 
                          accept="image/*" 
                          className="hidden" 
                      />
                    </div>
                    {isEditing && <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-mono animate-pulse">:: CLICK_TO_CHANGE ::</p>}
                </div>

                {/* --- CỘT PHẢI: INPUT FIELDS --- */}
                <div className="flex-1 w-full flex flex-col gap-y-6">
                    
                    {/* Email */}
                    <div className="flex flex-col gap-y-2">
                        <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-500 tracking-widest uppercase">Email ID</label>
                        <input 
                            disabled 
                            value={user?.email || ""} 
                            // Disabled Input: Light (bg-neutral-100) | Dark (bg-white/5)
                            className="bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 cursor-not-allowed px-4 py-4 rounded-lg border border-neutral-200 dark:border-white/5 outline-none font-mono text-sm w-full"
                        />
                    </div>

                    {/* Họ tên */}
                    <div className="flex flex-col gap-y-2">
                        <label className={`text-[10px] font-bold tracking-widest uppercase ${isEditing ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>Display Name</label>
                        <input 
                            disabled={!isEditing}
                            value={fullName} 
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Enter your name..." 
                            className={`px-4 py-4 rounded-lg outline-none transition font-mono text-sm w-full ${
                            isEditing 
                                ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white border border-emerald-500/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                : 'bg-transparent text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10'
                            }`}
                        />
                    </div>

                    {/* Phone */}
                    <div className="flex flex-col gap-y-2">
                        <label className={`text-[10px] font-bold tracking-widest uppercase ${isEditing ? 'text-emerald-600 dark:text-emerald-400' : 'text-neutral-500'}`}>Phone Number</label>
                        <input 
                            disabled={!isEditing}
                            value={phone} 
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="+84..." 
                            className={`px-4 py-4 rounded-lg outline-none transition font-mono text-sm w-full ${
                            isEditing 
                                ? 'bg-white dark:bg-black/40 text-neutral-900 dark:text-white border border-emerald-500/50 focus:shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                : 'bg-transparent text-neutral-900 dark:text-white border border-neutral-200 dark:border-white/10'
                            }`}
                        />
                    </div>

                    {/* Nút Lưu */}
                    {isEditing && (
                        <div className="pt-4">
                          <button 
                              onClick={handleSave}
                              disabled={saving}
                              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-bold py-4 rounded-lg disabled:opacity-50 transition flex items-center justify-center gap-x-2 font-mono shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                          >
                              {saving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
                              SAVE_CHANGES
                          </button>
                        </div>
                    )}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Account;