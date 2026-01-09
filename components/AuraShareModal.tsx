import React, { useState } from 'react';
import { User } from '../types';

interface AuraShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  postContent: string;
  postUrl: string;
  currentUser: User;
  allUsers: User[];
  onShare: (selectedUsers: User[]) => void;
}

const AuraShareModal: React.FC<AuraShareModalProps> = ({ 
  isOpen, 
  onClose, 
  postContent, 
  postUrl, 
  currentUser, 
  allUsers, 
  onShare 
}) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out current user and get acquaintances
  const availableUsers = allUsers.filter(user => 
    user.id !== currentUser.id && 
    currentUser.acquaintances?.includes(user.id)
  );

  const filteredUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.handle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserToggle = (user: User) => {
    setSelectedUsers(prev => 
      prev.find(u => u.id === user.id)
        ? prev.filter(u => u.id !== user.id)
        : [...prev, user]
    );
  };

  const handleShare = () => {
    if (selectedUsers.length === 0) {
      alert('Please select at least one user to share with.');
      return;
    }
    onShare(selectedUsers);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] p-10 shadow-2xl border border-white/50 dark:border-slate-800 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-3">
            <span className="text-3xl">✨</span>
            Share on Aura
          </h2>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors text-2xl">✕</button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Share this post with your Aura connections:
          </p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-4 mb-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-3">
              "{postContent}"
            </p>
          </div>
        </div>

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-100 dark:bg-slate-700 border-none rounded-2xl px-5 py-4 text-sm outline-none focus:ring-4 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="mb-6 max-h-60 overflow-y-auto">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-slate-400">No users found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  onClick={() => handleUserToggle(user)}
                  className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
                    selectedUsers.find(u => u.id === user.id)
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 border-2 border-emerald-500'
                      : 'bg-slate-50 dark:bg-slate-800 border-2 border-transparent hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white/50 dark:border-slate-600">
                    {user.avatarType === 'video' || user.avatar.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) ? (
                      <video src={user.avatar} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                    ) : (
                      <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">@{user.handle}</p>
                  </div>
                  <div className="w-6 h-6 rounded-full border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center">
                    {selectedUsers.find(u => u.id === user.id) && (
                      <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center gap-4">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 rounded-2xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={selectedUsers.length === 0}
              className="px-6 py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-emerald-500 to-blue-500 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:from-emerald-600 hover:to-blue-600 transition-all"
            >
              Share to Selected
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuraShareModal;
