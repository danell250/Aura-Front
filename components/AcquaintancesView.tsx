
import React, { useState } from 'react';
import { User } from '../types';
import Logo from './Logo';
import { UserService } from '../services/userService';

interface AcquaintancesViewProps {
  currentUser: User;
  acquaintances: User[];
  allUsers: User[];
  onViewProfile: (userId: string) => void;
  onViewChat: (userId: string) => void;
  onRemoveAcquaintance: (userId: string) => void;
  onBack: () => void;
}

const AcquaintancesView: React.FC<AcquaintancesViewProps> = ({ 
  currentUser, 
  acquaintances,
  allUsers,
  onViewProfile, 
  onViewChat, 
  onRemoveAcquaintance,
  onBack
}) => {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'acquaintances' | 'blocked'>('acquaintances');
  const [blockedList, setBlockedList] = useState<string[]>(currentUser.blockedUsers || []);
  const [unblockLoadingId, setUnblockLoadingId] = useState<string | null>(null);

  const filteredAcquaintances = acquaintances.filter(u => 
    (u.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (u.handle || '').toLowerCase().includes(search.toLowerCase())
  );

  const blockedUsers = (blockedList || [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is User => !!u);

  const filteredBlocked = blockedUsers.filter(u =>
    (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.handle || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleUnblock = async (targetUserId: string) => {
    if (unblockLoadingId) return;
    setUnblockLoadingId(targetUserId);
    try {
      const result = await UserService.unblockUser(currentUser.id, targetUserId);
      if (result.success) {
        setBlockedList(prev => prev.filter(id => id !== targetUserId));
      } else {
        alert(result.error || 'Failed to unblock user. Please try again.');
      }
    } catch (error) {
      console.error('Failed to unblock user:', error);
      alert('Failed to unblock user. Please check your connection and try again.');
    } finally {
      setUnblockLoadingId(null);
    }
  };

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
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Network</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              {acquaintances.length} Acquaintances • {blockedUsers.length} Blocked
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="inline-flex bg-slate-100 rounded-2xl p-1">
            <button
              onClick={() => setViewMode('acquaintances')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                viewMode === 'acquaintances'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              Acquaintances
            </button>
            <button
              onClick={() => setViewMode('blocked')}
              className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                viewMode === 'blocked'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400'
              }`}
            >
              Blocked
            </button>
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

      {viewMode === 'acquaintances' ? (
        filteredAcquaintances.length === 0 ? (
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
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredAcquaintances.map(user => {
              let memberSinceLabel = 'Member';
              if (user.createdAt) {
                const created = new Date(user.createdAt);
                if (!Number.isNaN(created.getTime())) {
                  memberSinceLabel = `Member since ${created.getFullYear()}`;
                }
              }

              const isBlocked = blockedList.includes(user.id);
              const statusLabel = isBlocked ? 'Blocked' : 'Acquaintance';

              return (
                <div key={user.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <img 
                    src={user.avatar} 
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-50 dark:bg-slate-800 border border-slate-200" 
                    alt="" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <button 
                          onClick={() => onViewProfile(user.id)}
                          className="font-semibold text-slate-900 truncate text-sm hover:text-emerald-600 text-left"
                        >
                          {user.name}
                        </button>
                        <div className="flex items-center gap-2 mt-0.5">
                          <button 
                            onClick={() => onViewProfile(user.id)}
                            className="text-[11px] text-indigo-600 font-semibold tracking-wide hover:text-emerald-600"
                          >
                            {user.handle}
                          </button>
                          <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-widest">
                            {memberSinceLabel}
                          </span>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest ${
                        statusLabel === 'Blocked'
                          ? 'bg-rose-50 text-rose-600 border border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <button 
                        onClick={() => onViewProfile(user.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-slate-200"
                      >
                        View profile
                      </button>
                      <button 
                        onClick={() => onViewChat(user.id)}
                        className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-slate-200"
                      >
                        Message
                      </button>
                      {statusLabel === 'Blocked' ? (
                        <button 
                          onClick={() => handleUnblock(user.id)}
                          disabled={unblockLoadingId === user.id}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold tracking-wide hover:bg-emerald-700"
                        >
                          {unblockLoadingId === user.id ? 'Unblocking...' : 'Unblock'}
                        </button>
                      ) : (
                        <button 
                          onClick={() => onRemoveAcquaintance(user.id)}
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-rose-600 hover:text-white border border-rose-100"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )) : viewMode === 'blocked' ? (
        filteredBlocked.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center border border-slate-100 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-3xl mb-6 grayscale opacity-50">🛡️</div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-widest mb-2">No Blocked Users</h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest max-w-xs leading-relaxed">
              {search ? "No blocked users matching your search." : "You have not blocked anyone. Your network is fully open."}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {filteredBlocked.map(user => {
                const isLoading = unblockLoadingId === user.id;
                return (
                  <div key={user.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                    <img 
                      src={user.avatar} 
                      className="w-12 h-12 rounded-2xl object-cover bg-slate-50 dark:bg-slate-800 border border-slate-200" 
                      alt="" 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-4">
                        <div className="min-w-0">
                          <button 
                            onClick={() => onViewProfile(user.id)}
                            className="font-semibold text-slate-900 truncate text-sm hover:text-emerald-600 text-left"
                          >
                            {user.name}
                          </button>
                          <div className="flex items-center gap-2 mt-0.5">
                            <button 
                              onClick={() => onViewProfile(user.id)}
                              className="text-[11px] text-indigo-600 font-semibold tracking-wide hover:text-emerald-600"
                            >
                              {user.handle}
                            </button>
                          </div>
                        </div>
                        <span className="px-2 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-rose-50 text-rose-600 border border-rose-100">
                          Blocked
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <button 
                          onClick={() => onViewProfile(user.id)}
                          className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold tracking-wide hover:bg-slate-200"
                        >
                          View profile
                        </button>
                        <button 
                          onClick={() => handleUnblock(user.id)}
                          disabled={isLoading}
                          className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-[11px] font-semibold tracking-wide hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {isLoading ? 'Unblocking...' : 'Unblock'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )
      ) : null}
    </div>
  );
};

export default AcquaintancesView;
