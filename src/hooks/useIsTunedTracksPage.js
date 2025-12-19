export const useIsTunedTracksPage = () => {
  // Hook này sẽ trả về true nếu đang ở trang tuned-tracks
  if (typeof window === 'undefined') return false;
  return window.location.pathname === '/tuned-tracks';
};