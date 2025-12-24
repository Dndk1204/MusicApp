"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { GlitchText, CyberButton, GlitchButton } from "@/components/CyberComponents";
import { Camera, User, Save, LayoutGrid, FileText, Mail, Lock } from "lucide-react";

export default function CompleteProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: "", phone: "", bio: "", avatar_url: null, banner_url: null });

  const [avatarFile, setAvatarFile] = useState(null);
  const [bannerFile, setBannerFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        router.replace("/");
        return;
      }
      setUser(currentUser);

      const { data, error } = await supabase.from("profiles").select("*").eq("id", currentUser.id).single();
      if (!error && data) {
        setProfile({
          full_name: data.full_name || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || null,
          banner_url: data.banner_url || null,
        });
        setAvatarPreview(data.avatar_url || null);
        setBannerPreview(data.banner_url || null);
      }
    })();
  }, [router]);

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    if (type === "avatar") {
      setAvatarFile(file);
      setAvatarPreview(preview);
    } else {
      setBannerFile(file);
      setBannerPreview(preview);
    }
  };

  const handleSave = async (e) => {
    e?.preventDefault();
    setLoading(true);
    try {
      if (!user) throw new Error("NO_USER");

      let newAvatarUrl = profile.avatar_url;
      let newBannerUrl = profile.banner_url;
      const uniqueID = Date.now().toString(36);

      if (avatarFile) {
        const path = `avatar-${user.id}-${uniqueID}`;
        const { data, error } = await supabase.storage.from("images").upload(path, avatarFile, { upsert: true });
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path);
        newAvatarUrl = publicUrl.publicUrl;
      }

      if (bannerFile) {
        const path = `banner-${user.id}-${uniqueID}`;
        const { data, error } = await supabase.storage.from("images").upload(path, bannerFile, { upsert: true });
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from("images").getPublicUrl(data.path);
        newBannerUrl = publicUrl.publicUrl;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({ id: user.id, full_name: profile.full_name, phone: profile.phone, bio: profile.bio, avatar_url: newAvatarUrl, banner_url: newBannerUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      router.replace(`/user/${user.id}`);
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-black pb-24">
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-neutral-900 rounded-md border border-white/5">
          <h1 className="text-2xl font-bold font-mono text-white mb-2 flex items-center gap-3"><LayoutGrid size={18} className="text-emerald-500"/> COMPLETE PROFILE</h1>
          <p className="text-sm text-neutral-400 mb-6">Hoàn thiện thông tin tài khoản để bắt đầu sử dụng.</p>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <label className="block text-xs text-neutral-400 mb-2">Banner</label>
              <label className="relative h-40 w-full bg-neutral-800 border-2 border-dashed border-neutral-700 block cursor-pointer overflow-hidden">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "banner")} />
                {bannerPreview ? <img src={bannerPreview} className="w-full h-full object-cover" alt="banner"/> : <div className="flex items-center justify-center h-full text-neutral-600">Upload banner</div>}
                <div className="absolute right-3 bottom-3 bg-black/50 px-3 py-2 rounded-md text-emerald-400 flex items-center gap-2"><Camera size={14}/> CHANGE</div>
              </label>
            </div>

            <div className="flex gap-6">
              <div className="w-36">
                <label className="block text-xs text-neutral-400 mb-2">Avatar</label>
                <label className="relative w-36 h-36 bg-neutral-800 border-2 border-dashed border-neutral-700 block cursor-pointer overflow-hidden rounded-full">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange(e, "avatar")} />
                  {avatarPreview ? <img src={avatarPreview} className="w-full h-full object-cover" alt="avatar"/> : <div className="flex items-center justify-center h-full text-neutral-600"><User size={34}/></div>}
                  <div className="absolute right-2 bottom-2 bg-black/50 px-2 py-1 rounded-md text-emerald-400"><Camera size={12}/></div>
                </label>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Email (locked)</label>
                  <input readOnly value={user.email} className="w-full bg-neutral-900 p-3 rounded-none text-neutral-400" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Full name</label>
                    <input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} className="w-full p-3 bg-neutral-900" />
                  </div>
                  <div>
                    <label className="block text-xs text-neutral-400 mb-1">Phone</label>
                    <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} className="w-full p-3 bg-neutral-900" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-400 mb-1">Bio</label>
                  <textarea value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} rows={4} className="w-full p-3 bg-neutral-900" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <GlitchButton onClick={() => router.replace("/")}>CANCEL</GlitchButton>
              <CyberButton type="submit" disabled={loading}>{loading ? 'SAVING...' : <span className="flex items-center gap-2"><Save size={14}/> SAVE</span>}</CyberButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
