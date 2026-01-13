
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';

interface AcquaintancesViewProps {
  currentUser: User;
  acquaintances: User[];
  onViewProfile: (userId: string) => void;
  onViewChat: (userId: string) => void;
  onRemoveAcquaintance: (userId: string) => void;
  onBack: () => void;
}

const AcquaintancesView: React.FC<AcquaintancesViewProps> = ({ 
  currentUser, 
  acquaintances, 
  onViewProfile, 
  onViewChat, 
  onRemoveAcquaintance,
  onBack
}) => {
  const [search, setSearch] = useState('');

  const filtered = acquaintances.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.handle || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white rounded-[2.5rem] p-8 mb-8 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
          >
            Return to Feed
          </button>
        </div>

        <div className="flex items-center gap-6 mb-10">
          <div className="w-16 h-16 aura-bg-gradient rounded-[1.5rem] flex items-center justify-center text-white text-3xl shadow-xl shadow-indigo-100">
            🤝
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Acquaintances</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Your Synced Network • {acquaintances.length} Active Acquaintances
            </p>
          </div>
        </div>

        <div className="relative max-w-md">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input 
            type="text" 
            placeholder="Search your network..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-600/5 transition-all"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-6 grayscale opacity-50">📡</div>
          <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">Network Clear</h3>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
            {search ? "No acquaintances matching your search criteria." : "You haven't established any acquaintances yet. Explore the network to find people."}
          </p>
          {!search && (
            <button 
              onClick={onBack}
              className="mt-8 px-8 py-3 aura-bg-gradient text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg"
            >
              Discover People
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-6">
          {filtered.map(user => (
            <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-md transition-all group">
              <div className="flex items-center gap-4 mb-6">
                <img 
                  src={user.avatar} 
                  className="w-16 h-16 rounded-[1.5rem] object-contain bg-slate-50 dark:bg-slate-800 ring-4 ring-slate-50 group-hover:ring-indigo-50 transition-all" 
                  alt="" 
                />
                <div className="overflow-hidden">
                  <button 
                    onClick={() => onViewProfile(user.id)}
                    className="font-black text-slate-900 truncate uppercase text-sm leading-none hover:text-emerald-600 transition-colors cursor-pointer text-left"
                  >
                    {user.name}
                  </button>
                  <button 
                    onClick={() => onViewProfile(user.id)}
                    className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mt-1.5 hover:text-emerald-600 transition-colors cursor-pointer block text-left"
                  >
                    {user.handle}
                  </button>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">Member since 2024</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => onViewProfile(user.id)}
                  className="py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                >
                  View Profile
                </button>
                <button 
                  onClick={() => onViewChat(user.id)}
                  className="py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all"
                >
                  Message
                </button>
                <button 
                  onClick={() => onRemoveAcquaintance(user.id)}
                  className="col-span-2 py-2.5 bg-rose-50 text-rose-500 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600 hover:text-white transition-all border border-rose-100"
                >
                  Remove Acquaintance
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AcquaintancesView;
