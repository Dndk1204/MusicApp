"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const EditPlaylistModal = ({ playlist, onClose, onUpdated }) => {
  const router = useRouter();

  const [name, setName] = useState(playlist.name);
  const [description, setDescription] = useState(playlist.description || "");
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(playlist.image_url || null);
  const [loading, setLoading] = useState(false);

  // --- Handle chọn ảnh ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // --- Handle cập nhật playlist ---
  const handleUpdate = async () => {
    if (!name) return alert("Tên playlist không được để trống");
    setLoading(true);

    try {
      let image_url = playlist.image_url;

      // Upload ảnh nếu có
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${playlist.id}.${fileExt}`;
        const { data, error: uploadError } = await supabase.storage
          .from("images")
          .upload(`playlists/${fileName}`, imageFile, { upsert: true });

        if (uploadError) throw uploadError;

        const { publicUrl } = supabase.storage
          .from("images")
          .getPublicUrl(`playlists/${fileName}`);
        image_url = publicUrl;
      }

      // Cập nhật playlist
      const { error: updateError } = await supabase
        .from("playlists")
        .update({ name, description, image_url })
        .eq("id", playlist.id);

      if (updateError) throw updateError;

      alert("Cập nhật playlist thành công!");
      onClose();

      if (onUpdated) onUpdated();

      // --- Redirect sang URL mới nếu tên thay đổi ---
      if (name !== playlist.name) {
        router.push(`/playlist/${encodeURIComponent(name)}`);
      }
    } catch (err) {
      console.error("Cập nhật playlist lỗi:", err.message);
      alert("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };

  // --- Handle xóa playlist ---
  const handleDelete = async () => {
    if (!confirm("Bạn có chắc muốn xóa playlist này?")) return;

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from("playlists")
        .delete()
        .eq("id", playlist.id);
      if (deleteError) throw deleteError;

      // Lấy playlist còn lại gần nhất
      const { data: remaining, error: fetchError } = await supabase
        .from("playlists")
        .select("id, name")
        .eq("user_id", playlist.user_id)
        .order("created_at", { ascending: true })
        .limit(1);
      if (fetchError) throw fetchError;

      onClose();

      if (remaining.length > 0) {
        router.push(`/playlist/${encodeURIComponent(remaining[0].name)}`);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Xóa playlist lỗi:", err.message);
      alert("Xóa playlist thất bại!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl h-auto p-6 relative text-white flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-4">Chỉnh sửa Playlist</h2>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex flex-col items-center gap-4">
            <div className="w-48 h-48 bg-neutral-800 flex items-center justify-center rounded overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold">{name[0].toUpperCase()}</span>
              )}
            </div>
            <label className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded cursor-pointer text-center">
              Chọn ảnh
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="text-sm text-neutral-400">Tên Playlist</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-neutral-800 text-white mt-1"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400">Mô tả</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2 rounded bg-neutral-800 text-white mt-1 h-24"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-between mt-6">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-full transition disabled:opacity-50"
          >
            Xóa
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={loading}
              className="bg-neutral-700 hover:bg-neutral-600 px-6 py-2 rounded-full transition disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdate}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 px-6 py-2 rounded-full transition disabled:opacity-50"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPlaylistModal;
