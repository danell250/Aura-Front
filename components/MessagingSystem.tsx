import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';
import { Avatar } from './MediaDisplay';

interface MessagingSystemProps {
  currentUser: User;
  allUsers: User[];
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (receiverId: string, text: string) => void;
  messages: Message[];
  unreadCounts: Record<string, number>;
  onMarkAsRead: (senderId: string) => void;
  onArchiveChat?: (userId: string) => void;
  onDeleteChat?: (userId: string) => void;
  initialUserId?: string; // Add prop to open conversation with specific user
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  currentUser, 
  allUsers, 
  isOpen, 
  onClose, 
  onSendMessage, 
  messages, 
  unreadCounts,
  onMarkAsRead,
  onArchiveChat,
  onDeleteChat,
  initialUserId
}) => {
  const AURA_ADMIN_EMAIL = 'aurasocialradiate@gmail.com';
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const auraAdminUser = allUsers.find(
    u => (u.email || '').toLowerCase() === AURA_ADMIN_EMAIL
  );

  const getDisplayName = (user: User) =>
    user.email && user.email.toLowerCase() === AURA_ADMIN_EMAIL ? 'Aura Admin' : user.name;

  // Filter users for messaging - show users with message history plus Aura Admin for support
  const messagingUsers = (() => {
    const base = allUsers.filter(user => {
      if (user.id === currentUser.id) return false;
      
      const hasMessages = messages.some(msg => 
        (msg.senderId === user.id && msg.receiverId === currentUser.id) || 
        (msg.senderId === currentUser.id && msg.receiverId === user.id)
      );
      
      return hasMessages;
    });

    if (
      auraAdminUser &&
      auraAdminUser.id !== currentUser.id &&
      !base.some(u => u.id === auraAdminUser.id)
    ) {
      return [auraAdminUser, ...base];
    }

    return base;
  })();

  // Filter connections for search (acquaintances + all users if searching)
  const searchableUsers = allUsers.filter(user => {
    if (user.id === currentUser.id) return false;
    
    if (!searchQuery.trim()) return false;
    
    const matchesSearch = 
      (user.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.handle || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  // Handle initial user selection
  useEffect(() => {
    if (initialUserId && isOpen) {
      const user = allUsers.find(u => u.id === initialUserId);
      if (user) {
        setSelectedUser(user);
        onMarkAsRead(user.id);
      }
    }
  }, [initialUserId, isOpen, allUsers, onMarkAsRead]);

  // Filter messages for the selected user
  const userMessages = selectedUser 
    ? messages.filter(msg => 
        (msg.senderId === selectedUser.id && msg.receiverId === currentUser.id) || 
        (msg.senderId === currentUser.id && msg.receiverId === selectedUser.id)
      ).sort((a, b) => a.timestamp - b.timestamp)
    : [];

  // Auto-scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [userMessages]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!selectedUser || !messageText.trim()) return;

    onSendMessage(selectedUser.id, messageText);
    setMessageText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    // Mark messages as read when user opens the chat
    onMarkAsRead(user.id);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) {
      setMessageText(prev => prev + emoji);
      return;
    }
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const current = messageText;
    const nextValue = current.slice(0, start) + emoji + current.slice(end);
    setMessageText(nextValue);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emoji.length;
      el.setSelectionRange(caret, caret);
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 240) + 'px';
    });
    setShowEmojiPicker(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[80vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex overflow-hidden">
        {/* User list sidebar */}
        <div className="w-1/3 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <span>💬</span> Messages
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                aria-label="Search users"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button 
                onClick={onClose}
                className="p-2 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors hover:bg-rose-50 dark:hover:bg-rose-900/20"
                aria-label="Close messages"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Search Bar */}
          {showSearch && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search people to message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto">
            {/* Show search results when searching */}
            {showSearch && searchQuery.trim() ? (
              <>
                {searchableUsers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-4xl mb-4 opacity-30">🔍</div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">No Users Found</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Try searching with a different name
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Search Results</h3>
                    </div>
                    {searchableUsers.map(user => (
                      <div 
                        key={user.id}
                        className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                          selectedUser?.id === user.id ? 'bg-slate-100 dark:bg-slate-800/50' : ''
                        }`}
                        onClick={() => handleSelectUser(user)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar 
                              src={user.avatar} 
                              type={user.avatarType} 
                              name={user.name} 
                              size="custom"
                              className="w-12 h-12 rounded-xl"
                            />
                            {currentUser.acquaintances?.includes(user.id) && (
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-black text-slate-900 dark:text-white truncate">{getDisplayName(user)}</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 truncate">{user.handle}</p>
                            {currentUser.acquaintances?.includes(user.id) && (
                              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Connected</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </>
            ) : (
              /* Show conversations when not searching */
              <>
                {messagingUsers.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="text-4xl mb-4 opacity-30">💬</div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">No Conversations</h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        Use the search button to find people to message
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Recent Conversations</h3>
                    </div>
                    {messagingUsers.map(user => {
                      const lastMessage = messages
                        .filter(msg => 
                          (msg.senderId === user.id && msg.receiverId === currentUser.id) || 
                          (msg.senderId === currentUser.id && msg.receiverId === user.id)
                        )
                        .sort((a, b) => b.timestamp - a.timestamp)[0];
                      
                      const hasUnread = unreadCounts[user.id] > 0;
                      
                      return (
                        <div 
                          key={user.id}
                          className={`p-4 border-b border-slate-100 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                            selectedUser?.id === user.id ? 'bg-slate-100 dark:bg-slate-800/50' : ''
                          }`}
                          onClick={() => handleSelectUser(user)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <Avatar 
                                src={user.avatar} 
                                type={user.avatarType} 
                                name={user.name} 
                                size="custom"
                                className="w-12 h-12 rounded-xl"
                              />
                              {hasUnread && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                                  {unreadCounts[user.id]}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <h3 className="font-black text-slate-900 dark:text-white truncate">{getDisplayName(user)}</h3>
                                {lastMessage && (
                                  <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                    {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                )}
                              </div>
                              {lastMessage && (
                                <p className={`text-sm truncate ${lastMessage.senderId === currentUser.id ? 'text-right' : 'text-left'} ${
                                  hasUnread ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  {lastMessage.senderId === currentUser.id ? 'You: ' : ''}
                                  {lastMessage.text.length > 30 ? lastMessage.text.substring(0, 30) + '...' : lastMessage.text}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar 
                    src={selectedUser.avatar} 
                    type={selectedUser.avatarType} 
                    name={getDisplayName(selectedUser)} 
                    size="custom"
                    className="w-10 h-10 rounded-xl"
                  />
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white">{getDisplayName(selectedUser)}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Online now</p>
                  </div>
                </div>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg transition-colors"
                    aria-label="Chat options"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                  </button>
                  
                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-50 py-2">
                      <button 
                        onClick={() => {
                          if (onArchiveChat && selectedUser) onArchiveChat(selectedUser.id);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                        </svg>
                        Archive Chat
                      </button>
                      <button 
                        onClick={() => {
                          if (onDeleteChat && selectedUser) onDeleteChat(selectedUser.id);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete Chat
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(null);
                          setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Close Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-800/30">
                {userMessages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-slate-500 dark:text-slate-400 text-center">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userMessages.map((msg) => {
                      const isCurrentUser = msg.senderId === currentUser.id;
                      const sender = allUsers.find(u => u.id === msg.senderId);
                      const kind = msg.messageType || 'text';
                      
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                              isCurrentUser 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                            }`}
                          >
                            {!isCurrentUser && sender && (
                              <p className="text-xs font-bold mb-1">{sender.name}</p>
                            )}
                            <div className="space-y-2">
                              {kind === 'image' && msg.mediaUrl && (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block overflow-hidden rounded-2xl border border-white/10"
                                >
                                  <img
                                    src={msg.mediaUrl}
                                    alt={msg.text || 'Image'}
                                    className="max-h-64 w-full object-cover"
                                  />
                                </a>
                              )}
                              {kind === 'file' && msg.mediaUrl && (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                                    isCurrentUser
                                      ? 'bg-white/10 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50'
                                  }`}
                                >
                                  <span className="text-base">📎</span>
                                  <span className="truncate max-w-[160px]">
                                    {msg.text || 'Download file'}
                                  </span>
                                </a>
                              )}
                              {(kind === 'text' || !msg.mediaUrl) && msg.text && (
                                <p>{msg.text}</p>
                              )}
                              {kind === 'image' && msg.mediaUrl && msg.text && (
                                <p className="text-xs opacity-90">
                                  {msg.text}
                                </p>
                              )}
                            </div>
                            <p className={`text-xs mt-2 ${isCurrentUser ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'} text-right`}>
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2 items-end relative">
                  <textarea
                    ref={textareaRef}
                    value={messageText}
                    onChange={(e) => {
                      const el = e.currentTarget;
                      el.style.height = 'auto';
                      el.style.height = Math.min(el.scrollHeight, 240) + 'px';
                      setMessageText(e.target.value);
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedUser.name}...`}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none overflow-y-auto max-h-60 min-h-[64px]"
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(v => !v)}
                    className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
                    title="Insert emoji"
                  >
                    😊
                  </button>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                  {showEmojiPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-[45]"
                        onClick={() => setShowEmojiPicker(false)}
                      />
                      <div className="absolute bottom-16 right-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 w-64 max-h-60 overflow-y-auto z-50">
                        <div className="grid grid-cols-8 gap-2 text-xl">
                          {['😀','😁','😂','🤣','😊','😍','😘','😜','🤔','😎','😇','🤗','👍','🙏','👏','🔥','🎉','💯','✅','✨','❤️','💪','🤝','🥳','😅','😭','😤','🥰','😏','🙌','🤩','😴','🤪','😬','😱','🤓','😔','🤷','👌','👀','👋','👑','🌟','🚀','🌈','🍀','🍕','☕','🧠'].map(e => (
                            <button key={e} onClick={() => insertEmoji(e)} className="hover:scale-125 transition-transform" title={e}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Select a Conversation</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  {messagingUsers.length === 0 
                    ? "No conversations yet. Start messaging someone from their profile!" 
                    : "Choose a conversation from the list to continue messaging"
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagingSystem;
