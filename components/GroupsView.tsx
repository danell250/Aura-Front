
import React from 'react';

const GroupsView: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
       <div className="w-20 h-20 aura-bg-gradient rounded-[1.5rem] flex items-center justify-center text-3xl shadow-xl mb-6">🚫</div>
       <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Module Disabled</h2>
       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">The Hubs network has been decommissioned.</p>
    </div>
  );
};

export default GroupsView;
