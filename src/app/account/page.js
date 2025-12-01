"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { User, Camera, Loader2, Pencil, X, Save, ShieldCheck } from "lucide-react";
import { GlitchButton, HoloButton, CyberCard, DecoderText } from "@/components/CyberComponents";

const Account = () => {
  const router = useRouter();
  
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

  useEffect(() => {
    const getProfile = async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push("/"); return; }
        setUser(session.user);
        const { data, error } = await supabase.from('profiles').select('full_name, avatar_url, phone').eq('id', session.user.id).single();
        if (error && error.code !== 'PGRST116') throw error;
        if (data) {
          setFullName(data.full_name || ""); setAvatarUrl(data.avatar_url || ""); setPhone(data.phone || "");
          setOriginalData({ fullName: data.full_name || "", phone: data.phone || "", avatarUrl: data.avatar_url || "" });
        }
      } catch (error) { console.log("Lỗi tải profile:", error); } finally { setLoading(false); }
    };
    getProfile();
  }, [router]);

  const handleUploadAvatar = async (event) => {
    try {
      setMessage(null);
      const file = event.target.files[0];
      if (!file) return;
      const fileExt = file.name.split('.').pop();
      const fileName = `avatar-${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);
    } catch (error) { setMessage({ type: 'error', text: 'Upload failed: ' + error.message }); }
  };

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const { error } = await supabase.from('profiles').upsert({
          id: user?.id, full_name: fullName, phone: phone, avatar_url: avatarUrl, updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      setMessage({ type: 'success', text: ':: SYSTEM_UPDATED ::' });
      setOriginalData({ fullName, phone, avatarUrl }); setIsEditing(false);
      if (typeof window !== 'undefined') { window.dispatchEvent(new Event("profile-updated")); }
      setTimeout(() => setMessage(null), 3000); router.refresh();
    } catch (error) { setMessage({ type: 'error', text: 'ERR: ' + error.message }); } finally { setSaving(false); }
  };

  const handleCancel = () => {
    setFullName(originalData.fullName); setPhone(originalData.phone); setAvatarUrl(originalData.avatarUrl); setIsEditing(false); setMessage(null);
  };

  return (
    // SỬA: Theme Switcher Support
    <div className="w-full h-full flex flex-col items-center pt-8 px-4 bg-neutral-100 dark:bg-black text-neutral-900 dark:text-white min-h-screen transition-colors duration-500"> 
      
      {loading ? (
        <div className="flex items-center gap-x-2 text-emerald-500 font-mono animate-pulse text-xs mt-20">
          <Loader2 className="animate-spin" size={16} /> <DecoderText text="ACCESSING_USER_DATABASE..." />
        </div>
      ) : (
        <div className="w-full max-w-3xl animate-in fade-in zoom-in-95 duration-500 pb-[100px]"> 
            
            {/* TIÊU ĐỀ TRANG */}
            <div className="mb-6 text-center">
                <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white mb-2">
                    <DecoderText text="ACCOUNT_SETTINGS" />
                </h1>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500/80 tracking-[0.5em] mt-1 font-mono uppercase">
                    :: Secure_Connection_Established ::
                </p>
            </div>

            {/* FORM CONTAINER */}
            <CyberCard className="w-full p-6 rounded-xl shadow-2xl">
                {/* HEADER FORM */}
                <div className="flex justify-between items-center mb-6 border-b border-neutral-300 dark:border-white/10 pb-4">
                   <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                      <ShieldCheck size={14} className="text-emerald-500"/>
                      ID: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{user?.id?.slice(0, 8)}...</span>
                   </div>
                   <div>
                      {!isEditing ? (
                        <HoloButton onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-[10px] rounded-sm border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:text-black dark:hover:text-white">
                          <Pencil size={12} className="mr-2"/> EDIT_MODE
                        </HoloButton>
                      ) : (
                        <HoloButton onClick={handleCancel} className="px-4 py-1.5 text-[10px] rounded-sm border-red-500/30 text-red-600 dark:text-red-400 hover:text-black dark:hover:text-white hover:border-red-500">
                          <X size={12} className="mr-2"/> CANCEL
                        </HoloButton>
                      )}
                   </div>
                </div>

                {message && (
                  <div className={`w-full p-2 rounded-sm text-center text-[10px] font-mono font-bold mb-6 border ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30'}`}>
                    {message.text}
                  </div>
                )}

                <div className="flex flex-col md:flex-row gap-8 items-start">
                    {/* CỘT TRÁI: AVATAR */}
                    <div className="flex flex-col items-center gap-4 w-full md:w-auto md:sticky md:top-0">
                        <div className="relative group">
                          <div className={`h-32 w-32 rounded-full bg-neutral-200 dark:bg-black/50 border-2 overflow-hidden flex items-center justify-center relative transition-all duration-300 ${isEditing ? 'border-emerald-500 cursor-pointer shadow-[0_0_20px_rgba(16,185,129,0.3)] animate-pulse' : 'border-neutral-300 dark:border-white/10'}`} onClick={() => isEditing && fileInputRef.current.click()}>
                              {avatarUrl ? <img src={avatarUrl} alt="Avatar" className="object-cover w-full h-full" /> : <User size={60} className="text-neutral-400 dark:text-neutral-600" />}
                              <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:100%_4px] opacity-20 pointer-events-none"></div>
                              {isEditing && (<div className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"><Camera className="text-emerald-400" size={24} /></div>)}
                          </div>
                          <input type="file" ref={fileInputRef} onChange={handleUploadAvatar} accept="image/*" className="hidden" />
                        </div>
                        {isEditing && <p className="text-[9px] text-emerald-600 dark:text-emerald-500 font-mono tracking-widest uppercase animate-pulse">:: UPLOAD_NEW_IMG ::</p>}
                    </div>

                    {/* CỘT PHẢI: INPUT FIELDS */}
                    <div className="flex-1 w-full flex flex-col gap-y-5">
                        <div className="flex flex-col gap-y-1.5">
                            <label className="text-[10px] font-bold text-neutral-500 tracking-widest uppercase font-mono">Email Identity</label>
                            <input disabled value={user?.email || ""} className="bg-neutral-200 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 cursor-not-allowed px-4 py-2.5 rounded-md border border-neutral-300 dark:border-white/5 outline-none font-mono text-xs w-full"/>
                        </div>
                        <div className="flex flex-col gap-y-1.5">
                            <label className={`text-[10px] font-bold tracking-widest uppercase font-mono transition-colors ${isEditing ? 'text-emerald-600 dark:text-emerald-500' : 'text-neutral-500'}`}>Display Name</label>
                            <input disabled={!isEditing} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter designation..." className={`px-4 py-2.5 rounded-md outline-none transition-all font-mono text-xs w-full ${isEditing ? 'bg-white dark:bg-black/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] focus:border-emerald-400' : 'bg-transparent text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10'}`}/>
                        </div>
                        <div className="flex flex-col gap-y-1.5">
                            <label className={`text-[10px] font-bold tracking-widest uppercase font-mono transition-colors ${isEditing ? 'text-emerald-600 dark:text-emerald-500' : 'text-neutral-500'}`}>Comm Link (Phone)</label>
                            <input disabled={!isEditing} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+84..." className={`px-4 py-2.5 rounded-md outline-none transition-all font-mono text-xs w-full ${isEditing ? 'bg-white dark:bg-black/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 focus:shadow-[0_0_15px_rgba(16,185,129,0.15)] focus:border-emerald-400' : 'bg-transparent text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/10'}`}/>
                        </div>
                        {isEditing && (
                            <div className="pt-4">
                              <GlitchButton onClick={handleSave} disabled={saving} className="w-full flex items-center justify-center gap-2 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white">
                                  {saving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} SAVE_CHANGES
                              </GlitchButton>
                            </div>
                        )}
                    </div>
                </div>
            </CyberCard>
        </div>
      )}
    </div>
  );
}

export default Account;