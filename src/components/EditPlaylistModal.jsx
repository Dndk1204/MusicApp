"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, Check, Trash2 } from "lucide-react";

export default function EditPlaylistModal({ playlist, onClose, onUpdated, onDeleted }) {
  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(playlist.cover_url);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleUpdate = async () => {
    try {
      setLoading(true);
      let cover_url = playlist.cover_url;

      if (file) {
        const ext = file.name.split(".").pop();
        const fileName = `playlist_${playlist.id}_${Date.now()}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("images/playlists")
          .upload(fileName, file, { upsert: true });
        if (uploadErr) throw uploadErr;

        cover_url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/playlists/${fileName}`;
      }

      const { error } = await supabase
        .from("playlists")
        .update({ name, description, cover_url })
        .eq("id", playlist.id);
      if (error) throw error;

      onUpdated?.();
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa playlist này?")) return;
    try {
      setLoading(true);
      const { error } = await supabase.from("playlists").delete().eq("id", playlist.id);
      if (error) throw error;
      onDeleted?.();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[999] p-4">
      <div className="bg-neutral-900 text-white rounded-lg w-full max-w-3xl p-6 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-center relative mb-6">
          <h2 className="text-xl font-bold">Chỉnh sửa playlist</h2>
          <button onClick={onClose} className="absolute right-0 top-0 p-1 hover:text-red-500">
            <X />
          </button>
        </div>

        {/* Body */}
        <div className="flex gap-6 overflow-y-auto flex-1">
        {/* Left: preview + upload */}
        <div className="flex flex-col items-center gap-3 shrink-0">
            <div className="w-48 h-48 rounded overflow-hidden border border-gray-600 shadow-md">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
            <label className="cursor-pointer bg-green-500 hover:bg-green-600 px-3 py-1 text-sm rounded font-semibold transition">
            Chọn ảnh
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
            />
            </label>
        </div>

        {/* Right: name + description */}
        <div className="flex-1 flex flex-col gap-3">
            <label className="text-sm font-mono">Tên playlist</label>
            <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="bg-neutral-800 p-2 rounded text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <label className="text-sm font-mono">Mô tả</label>
            <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-neutral-800 p-2 rounded text-white h-32 resize-none focus:outline-none focus:ring-2 focus:ring-green-500"
            />
        </div>
        </div>


        {/* Footer */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold"
          >
            <Trash2 /> Xóa
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded font-bold"
            >
              Thoát
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded font-bold flex items-center gap-1"
            >
              <Check /> Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
