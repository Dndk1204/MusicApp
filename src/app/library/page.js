"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import Header from "@/components/Header";
import SearchContent from "@/components/SearchContent";
import { Loader2, Lock, Globe, Music } from "lucide-react";

const LibraryPage = () => {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getMyUploads = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('songs')
            .select('*')
            .eq('user_id', user.id) // Chỉ lấy bài của mình
            .order('created_at', { ascending: false });
        
        setSongs(data || []);
        setLoading(false);
    };
    getMyUploads();
  }, []);

  return (
     <div className="bg-neutral-900 rounded-lg h-full w-full overflow-hidden overflow-y-auto">
        <Header>
            <div className="mb-2">
                <h1 className="text-white text-3xl font-semibold">Uploaded by You</h1>
                <p className="text-neutral-400 text-sm">Kho nhạc cá nhân của bạn</p>
            </div>
        </Header>
        <div className="p-6">
            {loading ? <Loader2 className="animate-spin text-emerald-500"/> : (
                songs.length > 0 ? (
                    <div>
                        {/* Chú thích trạng thái */}
                        <div className="flex gap-4 mb-4 text-xs text-neutral-500 font-mono">
                            <span className="flex items-center gap-1"><Globe size={12}/> = Công khai</span>
                            <span className="flex items-center gap-1"><Lock size={12}/> = Riêng tư</span>
                        </div>
                        <SearchContent songs={songs}/>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-neutral-500 py-20 gap-4">
                        <Music size={50} className="opacity-20"/>
                        <p>Bạn chưa tải lên bài hát nào.</p>
                    </div>
                )
            )}
        </div>
     </div>
  )
}

export default LibraryPage;