"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom"; 
import { X, Search, Sliders } from "lucide-react";
import { useRouter } from "next/navigation";
import qs from "query-string";

const AdvancedSearchModal = ({ onClose, currentSearch }) => {
  const router = useRouter();
  const [title, setTitle] = useState(currentSearch || "");
  const [artist, setArtist] = useState("");
  const [tag, setTag] = useState("");
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSearch = () => {
    const query = {};
    if (title) query.title = title;
    if (tag) query.tag = tag;
    
    if (artist && !title) {
        query.title = artist;
    } else if (artist && title) {
        query.title = `${title} ${artist}`;
    }

    const url = qs.stringifyUrl({ 
        url: '/search', 
        query: query 
    }, { skipEmptyString: true });

    router.push(url);
    onClose();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-24 p-4">
      
      {/* BACKDROP */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-neutral-900/95 via-neutral-900/80 to-neutral-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* MODAL CONTENT COMPACT */}
      <div 
        className="
          relative z-10 
          w-full max-w-sm
          bg-white dark:bg-neutral-900 
          border border-neutral-200 dark:border-white/10 
          rounded-xl shadow-2xl 
          flex flex-col 
          max-h-[80vh]
          animate-in slide-in-from-top-10 duration-300
          overflow-hidden
        "
        onClick={(e) => e.stopPropagation()} 
      >
          
          {/* HEADER */}
          {/* Giảm padding p-6 -> p-4 */}
          <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-white/5 bg-white/50 dark:bg-neutral-900/50 shrink-0">
             <div className="flex items-center gap-2 text-emerald-500">
                 <Sliders size={18}/> {/* Giảm icon 24 -> 18 */}
                 <h2 className="text-base font-bold font-mono tracking-tighter">ADVANCED SEARCH</h2> {/* text-xl -> text-base */}
             </div>
             
             <button 
                 onClick={onClose} 
                 className="text-neutral-400 hover:text-red-500 transition hover:rotate-90 duration-300 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-white/5"
             >
                 <X size={18} />
             </button>
          </div>

          {/* BODY */}
          {/* Giảm padding p-6 -> p-4, space-y-5 -> space-y-3 */}
          <div className="p-4 overflow-y-auto custom-scrollbar space-y-3 font-mono text-xs">
             
             <div className="flex flex-col gap-1.5">
                 <label className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Song Title</label>
                 <input 
                     value={title} 
                     onChange={(e) => setTitle(e.target.value)} 
                     placeholder="e.g. Shape of You"
                     autoFocus
                     /* Giảm padding p-3 -> p-2.5 */
                     className="p-2.5 rounded-md bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition"
                 />
             </div>

             <div className="flex flex-col gap-1.5">
                 <label className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Artist Name</label>
                 <input 
                     value={artist} 
                     onChange={(e) => setArtist(e.target.value)} 
                     placeholder="e.g. Ed Sheeran"
                     className="p-2.5 rounded-md bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition"
                 />
             </div>

             <div className="flex flex-col gap-1.5">
                 <label className="text-neutral-500 dark:text-neutral-400 text-[10px] uppercase tracking-widest font-bold">Genre / Tag</label>
                 <select 
                     value={tag} 
                     onChange={(e) => setTag(e.target.value)} 
                     className="p-2.5 rounded-md bg-neutral-100 dark:bg-black/40 border border-neutral-200 dark:border-white/10 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-neutral-900 dark:text-white transition cursor-pointer appearance-none"
                 >
                     <option value="">All Genres</option>
                     <option value="pop">Pop</option>
                     <option value="rock">Rock</option>
                     <option value="electronic">Electronic</option>
                     <option value="hiphop">HipHop</option>
                     <option value="jazz">Jazz</option>
                     <option value="indie">Indie</option>
                     <option value="classical">Classical</option>
                     <option value="soundtrack">Soundtrack</option>
                 </select>
             </div>

             <div className="pt-3 pb-1">
                 <button 
                     onClick={handleSearch} 
                     className="w-full bg-emerald-500 hover:bg-emerald-400 text-white dark:text-black font-bold py-2.5 rounded-md flex items-center justify-center gap-2 transition shadow-lg hover:shadow-emerald-500/20 active:scale-95"
                 >
                     <Search size={14} strokeWidth={3}/> 
                     SEARCH NOW
                 </button>
             </div>

          </div>
      </div>
    </div>,
    document.body 
  );
};

export default AdvancedSearchModal;