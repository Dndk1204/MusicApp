"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const usePlayer = create(
  persist(
    (set, get) => ({
      // ===========================================
      // STATE CHÍNH
      // ===========================================
      ids: [],                // Queue bài hát
      activeId: undefined,    // ID bài đang phát
      songData: null,         // Dữ liệu đầy đủ bài hát hiện tại
      isPlaying: false,       // Trạng thái phát nhạc

      // ===========================================
      // VOLUME
      // ===========================================
      volume: 1,
      setVolume: (val) => set({ volume: val }),

      // ===========================================
      // SETTERS
      // ===========================================
      setId: (id, fromHistory = false) =>
        set((state) => {
          const newState = { activeId: id, isPlaying: true }; // Mặc định khi set bài mới là phát luôn

          // Lưu lịch sử nếu không gọi từ "quay lại"
          if (!fromHistory && state.activeId && state.activeId !== id) {
            newState.history = [...state.history, state.activeId];
          }

          return newState;
        }),

      setIds: (ids) => set({ ids }),

      setSongData: (song) => set({ songData: song }),

      setIsPlaying: (isPlaying) => set({ isPlaying }),

      // ===========================================
      // RESET PLAYER
      // ===========================================
      reset: () =>
        set({
          ids: [],
          activeId: undefined,
          songData: null,
          history: [],
          seekHistory: {},
          isPlaying: false,
        }),

      // ===========================================
      // HISTORY
      // ===========================================
      history: [],
      pushHistory: (id) =>
        set((state) => ({ history: [...state.history, id] })),

      popHistory: () => {
        const h = get().history;
        if (!h.length) return undefined;

        const newHistory = [...h];
        const last = newHistory.pop();

        set({ history: newHistory });
        return last;
      },

      // ===========================================
      // SEEK POSITION
      // ===========================================
      seekHistory: {},
      setSeekForId: (id, seek) =>
        set((state) => ({
          seekHistory: { ...state.seekHistory, [id]: seek },
        })),

      // ===========================================
      // SHUFFLE + REPEAT
      // ===========================================
      isShuffle: false,
      setIsShuffle: (val) => set({ isShuffle: val }),

      repeatMode: 1, // 0 = off, 1 = all, 2 = one
      setRepeatMode: (val) => set({ repeatMode: val }),

      // ===========================================
      // NEXT BÀI
      // ===========================================
      next: () => {
        const { ids, activeId, isShuffle, repeatMode } = get();

        if (!ids.length) return;

        // Lặp 1 bài
        if (repeatMode === 2) {
          return get().setId(activeId);
        }

        // Shuffle: random bài
        if (isShuffle) {
          const randomId = ids[Math.floor(Math.random() * ids.length)];
          return get().setId(randomId);
        }

        // Lặp theo queue
        const index = ids.findIndex((x) => x === activeId);
        const nextIndex = index + 1;

        if (nextIndex < ids.length) {
          return get().setId(ids[nextIndex]);
        }

        // Nếu repeat all
        if (repeatMode === 1) {
          return get().setId(ids[0]);
        }
      },

      // ===========================================
      // PREVIOUS BÀI
      // ===========================================
      previous: () => {
        const { ids, activeId } = get();
        if (!ids.length) return;

        const index = ids.findIndex((x) => x === activeId);
        const prevIndex = index - 1;

        if (prevIndex >= 0) {
          return get().setId(ids[prevIndex]);
        }

        // Nếu đầu danh sách → quay về cuối
        return get().setId(ids[ids.length - 1]);
      },
    }),

    {
      name: "player-storage",
      storage: createJSONStorage(() => localStorage),
      
      // ⚠️ PHẦN QUAN TRỌNG NHẤT ĐÂY ⚠️
      // Chỉ lưu những trường cần thiết, bỏ qua activeId để không tự phát lại
      partialize: (state) => ({
        volume: state.volume,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
        // ids: state.ids, // (Tùy chọn) Bỏ comment nếu muốn giữ lại danh sách phát cũ
        // KHÔNG LƯU: activeId, isPlaying, songData
      }),
    }
  )
);

export default usePlayer;