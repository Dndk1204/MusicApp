"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUploadModal from "@/hooks/useUploadModal";
import useUI from "@/hooks/useUI";
import { X, UploadCloud, Lock, Globe, Loader2, Music, Image as ImageIcon, CheckCircle, XCircle, Info, AlertTriangle } from "lucide-react";


// Hàm xử lý tên file an toàn
const sanitizeString = (str) => {
  if (!str) return "";
  return str
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/Đ/g, "D")
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9-]/g, "")
    .toLowerCase();
};

const UploadModal = () => {
  // Lấy từ Mock (hoặc Hook thật trong dự án)
  const { isOpen, onClose } = useUploadModal();
  const { alert: showAlert, ToastComponent } = useUI(); // Lấy hàm alert và Component hiển thị
  
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // --- WRAPPER FUNCTIONS (Để khớp với logic success/error) ---
  const success = (msg) => showAlert(msg, 'success', 'THÀNH CÔNG');
  const error = (msg) => showAlert(msg, 'error', 'CÓ LỖI XẢY RA');

  // Form State
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isPublic, setIsPublic] = useState("true");
  const [songFile, setSongFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  // Reset form khi đóng modal
  useEffect(() => {
    if (!isOpen) {
      setTitle("");
      setAuthor("");
      setIsPublic("true");
      setSongFile(null);
      setImageFile(null);
      setIsLoading(false);
    }
  }, [isOpen]);

  // Kiểm tra quyền Admin khi Modal mở
  useEffect(() => {
    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
            if (data?.role === 'admin') setIsAdmin(true);
        }
    };
    if(isOpen) checkUser();
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      if (!songFile || !imageFile || !title || !author) {
        error("Vui lòng điền đầy đủ thông tin và chọn file!");
        setIsLoading(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        error("Bạn cần đăng nhập để thực hiện thao tác này.");
        setIsLoading(false);
        return;
      }

      const uniqueID = crypto.randomUUID();
      const safeTitle = sanitizeString(title);

      // 1. Upload MP3
      const songPath = `song-${safeTitle}-${uniqueID}`;
      const { data: songData, error: songError } = await supabase.storage
        .from('songs')
        .upload(songPath, songFile, { cacheControl: '3600', upsert: false });
      
      if (songError) throw new Error("Lỗi upload nhạc: " + songError.message);

      // 2. Upload Ảnh
      const imagePath = `image-${safeTitle}-${uniqueID}`;
      const { data: imageData, error: imageError } = await supabase.storage
        .from('images')
        .upload(imagePath, imageFile, { cacheControl: '3600', upsert: false });
      
      if (imageError) throw new Error("Lỗi upload ảnh: " + imageError.message);

      // Lấy URL Public
      const { data: songUrlData } = supabase.storage.from('songs').getPublicUrl(songData.path);
      const { data: imageUrlData } = supabase.storage.from('images').getPublicUrl(imageData.path);

      // 3. Lưu vào Database
      const { error: dbError } = await supabase.from('songs').insert({
        user_id: user.id,
        title: title,
        author: author,
        image_url: imageUrlData.publicUrl,
        song_url: songUrlData.publicUrl,
        is_public: isAdmin ? true : (isPublic === 'true'),
        play_count: 0
      });

      if (dbError) throw dbError;

      router.refresh();
      
      // --- GỌI HÀM SUCCESS ĐÃ BỌC ALERT ---
      success("Upload thành công!"); 
      
      // Đợi 1.5 giây rồi đóng modal
      setTimeout(() => {
          onClose();
      }, 1500);

    } catch (err) {
      console.error(err);
      error("Lỗi: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Nếu modal không mở thì không render gì cả
  if (!isOpen) return null;

  return (
    <>
      {/* Toast Notification (Chỉ dùng cho preview này, thực tế useUI của bạn sẽ tự render global) */}
      {ToastComponent && <ToastComponent />}

      <div className="fixed inset-0 z-[9999] bg-neutral-900/80 backdrop-blur-sm flex justify-center items-center p-4 font-sans">
        <div className="bg-neutral-800 border border-neutral-700 w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-300">
          
          <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white transition">
              <X size={24}/>
          </button>

          <div className="mb-6">
              <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <UploadCloud className="text-emerald-500"/> {isAdmin ? "Add New Song (Admin)" : "Upload Your Music"}
              </h2>
              <p className="text-xs text-neutral-400">
                  {isAdmin ? "Bài hát sẽ được hiển thị ở mục 'New Songs Added'." : "Chia sẻ âm nhạc của bạn với cộng đồng."}
              </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="flex flex-col gap-3">
                  <input 
                      disabled={isLoading} 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Tên bài hát" 
                      className="bg-neutral-700 p-3 rounded text-white text-sm focus:border-emerald-500 border border-transparent outline-none transition placeholder:text-neutral-500"
                      required
                  />
                  <input 
                      disabled={isLoading} 
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Tên nghệ sĩ" 
                      className="bg-neutral-700 p-3 rounded text-white text-sm focus:border-emerald-500 border border-transparent outline-none transition placeholder:text-neutral-500"
                      required
                  />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 flex flex-col items-center gap-2 cursor-pointer relative hover:border-emerald-500/50 transition group">
                      <Music size={24} className={`transition ${songFile ? 'text-emerald-400' : 'text-neutral-500 group-hover:text-emerald-500'}`}/>
                      <span className="text-[10px] text-neutral-400 text-center truncate w-full">{songFile ? songFile.name : "Chọn file MP3"}</span>
                      <input 
                          type="file" 
                          accept=".mp3,audio/*" 
                          disabled={isLoading} 
                          onChange={(e) => setSongFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          required
                      />
                  </div>
                  <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-700 flex flex-col items-center gap-2 cursor-pointer relative hover:border-pink-500/50 transition group">
                      <ImageIcon size={24} className={`transition ${imageFile ? 'text-pink-400' : 'text-neutral-500 group-hover:text-pink-500'}`}/>
                      <span className="text-[10px] text-neutral-400 text-center truncate w-full">{imageFile ? imageFile.name : "Chọn ảnh bìa"}</span>
                      <input 
                          type="file" 
                          accept="image/*" 
                          disabled={isLoading} 
                          onChange={(e) => setImageFile(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          required
                      />
                  </div>
              </div>

              {!isAdmin && (
                  <div className="flex items-center gap-4 bg-neutral-900/50 p-3 rounded-lg border border-neutral-700">
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                              type="radio" 
                              value="true" 
                              checked={isPublic === "true"}
                              onChange={(e) => setIsPublic(e.target.value)}
                              className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-white flex items-center gap-1 group-hover:text-emerald-400 transition"><Globe size={12}/> Công khai</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer group">
                          <input 
                              type="radio" 
                              value="false" 
                              checked={isPublic === "false"}
                              onChange={(e) => setIsPublic(e.target.value)}
                              className="accent-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs text-white flex items-center gap-1 group-hover:text-emerald-400 transition"><Lock size={12}/> Riêng tư</span>
                      </label>
                  </div>
              )}

              <button disabled={isLoading} type="submit" className="w-full bg-emerald-500 text-black font-bold py-3 rounded-full hover:opacity-80 disabled:opacity-50 flex justify-center gap-2 mt-2 transition transform active:scale-95">
                  {isLoading ? <Loader2 className="animate-spin"/> : <UploadCloud size={20}/>} 
                  {isLoading ? 'Đang tải lên...' : 'Tải lên'}
              </button>
          </form>
        </div>
      </div>
      
      <style>{`
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.9) translateY(-20px); }
          70% { transform: scale(1.05) translateY(5px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-bounce-in {
          animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </>
  );
}

export default UploadModal;
