"use client";

import { ShieldAlert, UploadCloud, Activity, Users } from "lucide-react";

const AdminDashboard = () => {
  return (
    <div className="h-full w-full p-6 pb-[120px] overflow-y-auto">
      
      {/* 1. TITLE SECTION */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tighter text-neutral-900 dark:text-white drop-shadow-sm dark:drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] transition-colors duration-300">
          ADMIN_CONTROL_PANEL
        </h1>
        <p className="text-[10px] text-emerald-600 dark:text-emerald-500 tracking-[0.3em] font-mono mt-2 animate-pulse">
          :: ROOT_ACCESS_GRANTED ::
        </p>
      </div>

      {/* 2. DASHBOARD GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Upload Music (Active) */}
        <div className="group cursor-pointer transition-all duration-300 
            /* Style Glass: Light (Trắng đục) | Dark (Đen mờ) */
            bg-white/60 dark:bg-black/40 
            border border-neutral-200 dark:border-white/10 
            backdrop-blur-xl rounded-2xl p-6 
            
            /* Hover Effects */
            hover:border-emerald-500/50 
            hover:bg-white/80 dark:hover:bg-white/5
            hover:shadow-[0_0_30px_rgba(16,185,129,0.15)]
        ">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white dark:group-hover:text-black transition">
               <UploadCloud size={24} />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-500 uppercase group-hover:text-emerald-500 transition">Module_01</span>
          </div>
          
          <h3 className="text-neutral-800 dark:text-white font-mono text-lg mb-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
            UPLOAD_MANAGER
          </h3>
          
          <p className="text-neutral-600 dark:text-neutral-400 text-xs font-mono leading-relaxed">
            [STATUS: PENDING]<br/>
            Initialize upload sequence for new audio tracks.
          </p>
        </div>

        {/* Card 2: Users (Inactive/Stat) */}
        <div className="
            bg-white/40 dark:bg-black/40 
            border border-neutral-200 dark:border-white/10 
            backdrop-blur-xl rounded-2xl p-6 opacity-70
        ">
           <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500">
               <Users size={24} />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">Module_02</span>
          </div>
          <h3 className="text-neutral-800 dark:text-white font-mono text-lg mb-2">USER_DATABASE</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-xs font-mono">
             Total Users: -- <br/>
             Active Sessions: --
          </p>
        </div>

        {/* Card 3: System Status */}
        <div className="
            bg-white/40 dark:bg-black/40 
            border border-neutral-200 dark:border-white/10 
            backdrop-blur-xl rounded-2xl p-6 opacity-70
        ">
           <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-full bg-red-500/10 text-red-600 dark:text-red-500">
               <Activity size={24} />
            </div>
            <span className="text-[10px] font-mono text-neutral-500 uppercase">System</span>
          </div>
          <h3 className="text-neutral-800 dark:text-white font-mono text-lg mb-2">SERVER_METRICS</h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-xs font-mono">
             CPU Load: 0% <br/>
             Memory: Stable
          </p>
        </div>

      </div>

      {/* Warning Footer */}
      <div className="mt-10 p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg flex items-center gap-3">
         <ShieldAlert className="text-yellow-600 dark:text-yellow-500" size={20} />
         <p className="text-xs text-yellow-700 dark:text-yellow-500/80 font-mono">
            WARNING: Authorized personnel only. All actions are logged.
         </p>
      </div>
    </div>
  );
}

export default AdminDashboard;