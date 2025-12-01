"use client";

import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

export default function DeletePlaylistModal({ playlist, onClose, onDeleted }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await supabase.from("playlists").delete().eq("id", playlist.id);
      onDeleted();
    } catch (err) {
      console.error("Delete playlist lỗi:", err);
      alert("Không thể xóa playlist!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999]">
      <div className="bg-neutral-900 w-[400px] rounded-2xl p-6 border border-neutral-700 shadow-xl">
        <h2 className="text-2xl font-semibold text-center mb-6">Xác nhận xóa Playlist</h2>

        <p className="text-center text-gray-300 mb-6">
          Bạn có chắc chắn muốn xóa playlist <strong>{playlist.name}</strong>?
        </p>

        <div className="flex justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 rounded-lg"
          >
            Hủy
          </button>

          <button
            onClick={handleDelete}
            disabled={loading}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg disabled:bg-neutral-700"
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
