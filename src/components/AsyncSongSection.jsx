// components/AsyncSongSection.jsx
import SongSection from "./SongSection";
import getSongs from "@/app/actions/getSongs";

export default async function AsyncSongSection({ title, query, moreLink, icon: Icon, iconColor }) {
  const data = await getSongs(query);
  const songs = data.songs || [];

  if (songs.length === 0) return null;

  return (
    <SongSection 
      title={
        <span className="flex items-center gap-2 text-sm md:text-base">
          <Icon size={16} className={iconColor}/> {title}
        </span>
      }
      songs={songs} 
      moreLink={moreLink}
    />
  );
}