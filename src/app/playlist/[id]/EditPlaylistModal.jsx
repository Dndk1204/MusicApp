"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X } from "lucide-react";

export default function EditPlaylistModal({ playlist, onClose, onUpdated, onDelete }) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [preview, setPreview] = useState(playlist.cover_url || "");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImage = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const deleteOldImage = async () => {
    if (!playlist.cover_url) return;
    try {
      const path = playlist.cover_url.split("images/playlists/")[1];
      if (path) {
        await supabase.storage.from("images/playlists").remove([path]);
      }
    } catch (err) {
      console.warn("Không thể xóa ảnh cũ:", err);
    }
  };

  const uploadImage = async () => {
    if (!file) return playlist.cover_url;
    const ext = file.name.split(".").pop();
    const filename = `${playlist.id}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("images/playlists")
      .upload(filename, file, { upsert: true });
    if (error) throw error;

    const { data } = supabase.storage
      .from("images/playlists")
      .getPublicUrl(filename);
    return data.publicUrl;
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      let newCover = playlist.cover_url;
      if (file) {
        await deleteOldImage();
        newCover = await uploadImage();
      }
      const { error } = await supabase
        .from("playlists")
        .update({ name, description, cover_url: newCover })
        .eq("id", playlist.id);
      if (error) throw error;
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Update playlist lỗi:", err);
      alert("Không thể cập nhật playlist!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-neutral-900 w-[700px] rounded-2xl p-6 relative border border-neutral-700 shadow-xl">

        {/* CLOSE */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-neutral-400 hover:text-white"
        >
          <X size={22} />
        </button>

        {/* HEADER */}
        <h2 className="text-2xl font-semibold text-center mb-6">Chỉnh sửa Playlist</h2>

        {/* BODY */}
        <div className="flex gap-8">
          <div className="w-1/3 flex flex-col items-center">
            <div className="relative w-full h-40 rounded-xl overflow-hidden border border-neutral-700">
              {preview && (
                <img
                  src={preview}
                  className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-30"
                />
              )}
              <img
                src={preview || "/no-image.png"}
                className="relative w-full h-full object-cover rounded-xl"
              />
            </div>

            <label className="mt-4 w-full">
              <div className="w-full bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-center py-2 rounded-lg cursor-pointer">
                Chọn ảnh
              </div>
              <input type="file" accept="image/*" onChange={handleImage} className="hidden" />
            </label>
          </div>

          <div className="w-2/3 space-y-4">
            <div>
              <label className="text-sm text-neutral-300">Tên playlist</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 bg-neutral-800 border border-neutral-700 p-2 rounded-lg outline-none focus:border-neutral-400"
              />
            </div>

            <div>
              <label className="text-sm text-neutral-300">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="w-full mt-1 bg-neutral-800 border border-neutral-700 p-2 rounded-lg outline-none focus:border-neutral-400 resize-none"
              ></textarea>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onDelete}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg"
          >
            Xóa playlist
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
            >
              Hủy
            </button>

            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg disabled:bg-neutral-700"
            >
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
