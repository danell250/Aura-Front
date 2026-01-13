import React, { useState, useEffect } from 'react';
import { User, EnergyType } from '../types';

interface TimeCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TimeCapsuleData) => void;
  currentUser: User;
  allUsers: User[];
}

export interface TimeCapsuleData {
  content: string;
  unlockDate: number;
  timeCapsuleType: 'personal' | 'group';
  invitedUsers: string[];
  timeCapsuleTitle: string;
  energy: EnergyType;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'document';
}

const TimeCapsuleModal: React.FC<TimeCapsuleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  currentUser,
  allUsers
}) => {
  const [formData, setFormData] = useState<TimeCapsuleData>({
    content: '',
    unlockDate: 0,
    timeCapsuleType: 'personal',
    invitedUsers: [],
    timeCapsuleTitle: '',
    energy: EnergyType.NEUTRAL
  });
  
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [minDate, setMinDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Set minimum date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setMinDate(tomorrow.toISOString().split('T')[0]);
      
      // Reset form
      setFormData({
        content: '',
        unlockDate: 0,
        timeCapsuleType: 'personal',
        invitedUsers: [],
        timeCapsuleTitle: '',
        energy: EnergyType.NEUTRAL
      });
      setSelectedUsers([]);
      setUserSearch('');
    }
  }, [isOpen]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setFormData({ ...formData, unlockDate: date.getTime() });
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.find(u => u.id === user.id)) {
      const newSelectedUsers = [...selectedUsers, user];
      setSelectedUsers(newSelectedUsers);
      setFormData({
        ...formData,
        invitedUsers: newSelectedUsers.map(u => u.id)
      });
    }
    setUserSearch('');
  };

  const handleUserRemove = (userId: string) => {
    const newSelectedUsers = selectedUsers.filter(u => u.id !== userId);
    setSelectedUsers(newSelectedUsers);
    setFormData({
      ...formData,
      invitedUsers: newSelectedUsers.map(u => u.id)
    });
  };

  const filteredUsers = allUsers.filter(user =>
    user.id !== currentUser.id &&
    !selectedUsers.find(u => u.id === user.id) &&
    ((user.name || '').toLowerCase().includes(userSearch.toLowerCase()) ||
     (user.handle || '').toLowerCase().includes(userSearch.toLowerCase()))
  ).slice(0, 5);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      alert('Please write your time capsule message');
      return;
    }
    
    if (!formData.unlockDate) {
      alert('Please select an unlock date');
      return;
    }
    
    if (!formData.timeCapsuleTitle.trim()) {
      alert('Please give your time capsule a title');
      return;
    }
    
    if (formData.timeCapsuleType === 'group' && formData.invitedUsers.length === 0) {
      alert('Please invite at least one person to your group time capsule');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  const formatUnlockDate = () => {
    if (!formData.unlockDate) return '';
    const date = new Date(formData.unlockDate);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeUntilUnlock = () => {
    if (!formData.unlockDate) return '';
    const now = Date.now();
    const diff = formData.unlockDate - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 365) return `${Math.ceil(days / 30)} months`;
    return `${Math.ceil(days / 365)} years`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                <span className="text-2xl">⏰</span>
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Create Time Capsule
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Send a message to the future
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Time Capsule Title */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Time Capsule Title *
            </label>
            <input
              type="text"
              value={formData.timeCapsuleTitle}
              onChange={(e) => setFormData({ ...formData, timeCapsuleTitle: e.target.value })}
              placeholder="e.g., 'Future Me in 2027' or 'College Reunion Memories'"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              maxLength={100}
            />
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">{formData.timeCapsuleTitle.length}/100</span>
            </div>
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
              Time Capsule Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, timeCapsuleType: 'personal', invitedUsers: [] })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.timeCapsuleType === 'personal'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👤</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Personal</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Just for you</p>
                  </div>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, timeCapsuleType: 'group' })}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.timeCapsuleType === 'group'
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👥</span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Group</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Share with friends</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Group Invites */}
          {formData.timeCapsuleType === 'group' && (
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                Invite Friends *
              </label>
              
              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedUsers.map(user => (
                    <div
                      key={user.id}
                      className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-full text-sm font-medium"
                    >
                      <img src={user.avatar} className="w-5 h-5 rounded-full object-cover" alt="" />
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => handleUserRemove(user.id)}
                        className="ml-1 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                      >
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {/* User Search */}
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search friends to invite..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                />
                
                {/* Search Results */}
                {userSearch && filteredUsers.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-10 max-h-48 overflow-y-auto">
                    {filteredUsers.map(user => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left"
                      >
                        <img src={user.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                        <div>
                          <p className="font-medium text-sm text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{user.handle}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Unlock Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Unlock Date *
            </label>
            <input
              type="date"
              min={minDate}
              onChange={handleDateChange}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            />
            {formData.unlockDate > 0 && (
              <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
                <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                  📅 Will unlock on {formatUnlockDate()}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  ⏱️ That's {getTimeUntilUnlock()} from now
                </p>
              </div>
            )}
          </div>

          {/* Energy Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Energy Type
            </label>
            <select
              value={formData.energy}
              onChange={(e) => setFormData({ ...formData, energy: e.target.value as EnergyType })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
            >
              {Object.values(EnergyType).map(energy => (
                <option key={energy} value={energy}>{energy}</option>
              ))}
            </select>
          </div>

          {/* Message Content */}
          <div>
            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Your Message *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your message to the future... What do you hope to achieve? What memories do you want to preserve? What questions do you have for your future self?"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
              rows={6}
              maxLength={1000}
            />
            <div className="text-right mt-1">
              <span className="text-xs text-slate-400">{formData.content.length}/1000</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
            >
              Create Time Capsule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TimeCapsuleModal;