
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message } from '../types';
import { MessageService } from '../services/messageService';
import Logo from './Logo';

interface ChatViewProps {
  currentUser: User;
  acquaintances: User[];
  allUsers: User[]; // Add all users prop
  onBack: () => void;
  initialContactId?: string;
  onViewProfile?: (userId: string) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ currentUser, acquaintances, allUsers, onBack, initialContactId, onViewProfile }) => {
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'recent' | 'all' | 'search'>('recent');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  // Load conversations and messages from backend
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await MessageService.getConversations(currentUser.id);
        if (response.success) {
          setConversations(response.data);
        }
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    loadConversations();
  }, [currentUser.id]);

  // Load messages when active contact changes
  useEffect(() => {
    const loadMessages = async () => {
      if (!activeContact) return;
      
      setIsLoading(true);
      try {
        const response = await MessageService.getMessages(currentUser.id, activeContact.id);
        if (response.success) {
          setMessages(response.data);
          // Mark messages as read
          await MessageService.markAsRead(activeContact.id, currentUser.id);
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [activeContact, currentUser.id]);



  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeContact]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(event.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle initial contact selection
  useEffect(() => {
    if (initialContactId) {
      const contact = allUsers.find(u => u.id === initialContactId);
      if (contact) {
        setActiveContact(contact);
        if (archivedIds.includes(contact.id)) setSidebarTab('recent');
      }
    }
  }, [initialContactId, allUsers, archivedIds]);

  // Handle search functionality
  useEffect(() => {
    if (contactSearch.trim()) {
      const filtered = allUsers.filter(u => 
        u.id !== currentUser.id && // Exclude current user
        ((u.name || '').toLowerCase().includes(contactSearch.toLowerCase()) || 
         (u.handle || '').toLowerCase().includes(contactSearch.toLowerCase()))
      );
      setSearchResults(filtered);
      setSidebarTab('search');
    } else {
      setSearchResults([]);
      if (sidebarTab === 'search') {
        setSidebarTab('recent');
      }
    }
  }, [contactSearch, allUsers, currentUser.id, sidebarTab]);

  const handleSend = async () => {
    if (!inputText.trim() || !activeContact || isSending) return;
    
    setIsSending(true);
    try {
      const response = await MessageService.sendMessage(
        currentUser.id,
        activeContact.id,
        inputText.trim()
      );
      
      if (response.success) {
        // Add message to local state immediately for better UX
        const newMessage: Message = response.data;
        setMessages(prev => [...prev, newMessage]);
        setInputText('');
        
        // Update conversations list
        const updatedConversations = await MessageService.getConversations(currentUser.id);
        if (updatedConversations.success) {
          setConversations(updatedConversations.data);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Show error to user
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleArchive = () => {
    if (!activeContact) return;
    if (archivedIds.includes(activeContact.id)) {
      setArchivedIds(prev => prev.filter(id => id !== activeContact.id));
    } else {
      setArchivedIds(prev => [...prev, activeContact.id]);
    }
    setShowHeaderMenu(false);
    setActiveContact(null);
  };

  const handleDeleteChat = () => {
    if (!activeContact) return;
    if (window.confirm(`Are you sure you want to purge all conversation data with ${activeContact.name}?`)) {
      setMessages(prev => prev.filter(m => 
        !( (m.senderId === currentUser.id && m.receiverId === activeContact.id) ||
           (m.senderId === activeContact.id && m.receiverId === currentUser.id) )
      ));
      setDeletedIds(prev => [...prev, activeContact.id]);
      setShowHeaderMenu(false);
      setActiveContact(null);
    }
  };

  const filteredContacts = useMemo(() => {
    if (sidebarTab === 'search') {
      return searchResults;
    }
    
    if (sidebarTab === 'all') {
      // Only show users when actively searching - completely empty by default
      return contactSearch.trim() ? allUsers.filter(u => u.id !== currentUser.id) : [];
    }
    
    // Recent conversations - only users who have actual conversation history
    const recentUserIds = conversations.map(conv => conv._id);
    return allUsers.filter(u => 
      u.id !== currentUser.id && 
      recentUserIds.includes(u.id)
    );
  }, [sidebarTab, searchResults, allUsers, currentUser.id, conversations, contactSearch]);

  const getLastMessage = (userId: string) => {
    // Find conversation data from backend
    const conversation = conversations.find(conv => conv._id === userId);
    if (conversation?.lastMessage) {
      return conversation.lastMessage;
    }
    
    return null;
  };

  return (
    <div className="flex h-[850px] bg-white dark:bg-slate-900 rounded-[3rem] sm:rounded-[4rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-[0_50px_100px_-30px_rgba(0,0,0,0.15)] animate-in fade-in zoom-in-95 duration-1000 max-w-7xl mx-auto transition-colors">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/20 dark:bg-slate-900/40">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">Aura Direct</h2>
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-900 dark:hover:bg-emerald-600 hover:text-white rounded-[1.25rem] transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          </div>

          {/* Sidebar Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
            <button 
              onClick={() => setSidebarTab('recent')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'recent' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setSidebarTab('all')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'all' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              All Users
            </button>
          </div>

          <div className="relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </span>
            <input 
              type="text" 
              placeholder="Search people to message..." 
              value={contactSearch} 
              onChange={e => setContactSearch(e.target.value)} 
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl pl-11 pr-4 py-3.5 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-400/30 transition-all text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-8 space-y-2">
          {filteredContacts.length === 0 ? (
            <div className="py-10 text-center opacity-30">
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                {sidebarTab === 'search' ? 'No users found' : 
                 sidebarTab === 'recent' ? 'No conversations yet' : 
                 contactSearch.trim() ? 'No users found' : 'Search to find people'}
              </p>
              {(sidebarTab === 'recent' || (sidebarTab === 'all' && !contactSearch.trim())) && (
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-slate-300 mt-2">
                  {sidebarTab === 'recent' ? 'Start a conversation to see it here' : 'Type a name to find someone to message'}
                </p>
              )}
            </div>
          ) : (
            filteredContacts.map(user => {
              const lastMsg = getLastMessage(user.id);
              const isAcquaintance = acquaintances.some(acq => acq.id === user.id);
              
              return (
                <button 
                  key={user.id} 
                  onClick={() => setActiveContact(user)} 
                  className={`w-full flex items-center gap-4 p-4 rounded-[1.75rem] transition-all active:scale-[0.97] duration-300 group relative ${activeContact?.id === user.id ? 'aura-bg-gradient text-white shadow-xl shadow-emerald-500/20' : 'hover:bg-white dark:hover:bg-slate-800/60 text-slate-600'}`}
                >
                  <div className="relative flex-shrink-0">
                    <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white/10 group-hover:scale-110 transition-transform" alt="" />
                    {user.trustScore > 80 && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg"></div>
                    )}
                    {!isAcquaintance && (
                      <div className="absolute -top-1 -left-1 w-4 h-4 bg-blue-500 border-2 border-white dark:border-slate-900 rounded-full shadow-lg" title="Not connected"></div>
                    )}
                  </div>
                  <div className="text-left overflow-hidden flex-1">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onViewProfile?.(user.id);
                      }}
                      className={`font-black truncate text-sm leading-none uppercase tracking-tight hover:text-emerald-400 transition-colors text-left ${activeContact?.id === user.id ? 'text-white hover:text-emerald-200' : 'text-slate-900 dark:text-slate-100'}`}
                    >
                      {user.name}
                    </button>
                    <p className={`text-[9px] truncate tracking-wide mt-2 font-bold ${activeContact?.id === user.id ? 'text-white/70' : 'text-slate-400'}`}>
                      {lastMsg ? lastMsg.text : 
                       isAcquaintance ? 'Connected • Ready to message' : 
                       'Click to start conversation'}
                    </p>
                  </div>
                  {lastMsg && (
                    <span className={`text-[8px] font-black uppercase ${activeContact?.id === user.id ? 'text-white/50' : 'text-slate-300'}`}>
                      {new Date(lastMsg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-950 transition-colors">
        {activeContact ? (
          <>
            {/* Header */}
            <div className="p-8 sm:px-14 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl h-32 relative z-10">
              <div className="flex items-center gap-8">
                <div className="relative group/avatar">
                    <img src={activeContact.avatar} className="w-16 h-16 rounded-[1.75rem] object-cover shadow-2xl border-4 border-white dark:border-slate-800 transition-all group-hover/avatar:scale-105" alt="" />
                    <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg shadow-emerald-500/20"></div>
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white text-lg leading-none">{activeContact.name}</h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em]">Live Synchronization</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 relative">
                 <button className="w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-900 dark:hover:bg-emerald-600 hover:text-white transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                 </button>
                 <div ref={headerMenuRef}>
                    <button 
                      onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                      className={`w-12 h-12 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl hover:bg-slate-900 dark:hover:bg-emerald-600 hover:text-white transition-all active:scale-90 border border-slate-100 dark:border-slate-700 shadow-sm ${showHeaderMenu ? 'bg-slate-900 text-white' : ''}`}
                    >
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                    </button>
                    {showHeaderMenu && (
                      <div className="absolute right-0 mt-3 w-56 bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl z-50 py-3 overflow-hidden animate-in fade-in zoom-in-95 origin-top-right">
                        <button 
                          onClick={handleArchive}
                          className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-between"
                        >
                          {archivedIds.includes(activeContact.id) ? 'Restore Sync' : 'Archive Stream'}
                          <span className="opacity-40">{archivedIds.includes(activeContact.id) ? '📤' : '📥'}</span>
                        </button>
                        <button 
                          onClick={handleDeleteChat}
                          className="w-full text-left px-6 py-4 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex items-center justify-between"
                        >
                          Purge Logs
                          <span className="opacity-40">🗑️</span>
                        </button>
                      </div>
                    )}
                 </div>
              </div>
            </div>
            
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-14 space-y-8 no-scrollbar bg-slate-50/10 dark:bg-slate-950/20">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4"></div>
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Loading Messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale scale-90">
                  <Logo size="lg" showText={false} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-8 text-slate-400">Security Clearance Verified. Begin Sync.</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.senderId === currentUser.id;
                  const prevMsg = messages[idx - 1];
                  const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId;
                  const timestamp = typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.timestamp).getTime();
                  
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-500`}>
                      <div className={`max-w-[80%] sm:max-w-[70%] p-6 sm:p-8 rounded-[2.5rem] text-[15px] font-bold shadow-2xl leading-relaxed transition-all hover:scale-[1.01] ${isMe ? 'aura-bg-gradient text-white shadow-emerald-500/10' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800 shadow-slate-200/20 dark:shadow-black/20'} ${isMe ? 'rounded-br-none' : 'rounded-bl-none'} ${!isFirstInSequence && (isMe ? 'rounded-tr-xl' : 'rounded-tl-xl')}`}>
                        <div className="break-words">{msg.text}</div>
                        <div className={`text-[8px] mt-4 font-black uppercase tracking-[0.2em] flex items-center gap-2 ${isMe ? 'text-white/50 justify-end' : 'text-slate-300 dark:text-slate-600'}`}>
                          {new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric' }).format(timestamp)}
                          {msg.isEdited && <span className="opacity-60">(edited)</span>}
                          {isMe && (
                             <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Bar */}
            <div className="px-8 sm:px-14 py-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-6 max-w-6xl mx-auto">
                <button className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-90 shadow-sm">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                </button>
                <div className="flex-1 relative group">
                  <input 
                    type="text" 
                    value={inputText} 
                    onChange={e => setInputText(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && !isSending && handleSend()} 
                    placeholder="Synthesize neural message..." 
                    disabled={isSending}
                    className="w-full pl-8 pr-32 py-5 bg-slate-50/50 dark:bg-slate-800/50 rounded-[2.2rem] border-2 border-transparent outline-none focus:ring-12 focus:ring-emerald-500/5 dark:focus:ring-emerald-500/10 focus:bg-white dark:focus:bg-slate-800 focus:border-emerald-400/20 transition-all text-base font-bold text-slate-900 dark:text-white shadow-inner disabled:opacity-50" 
                  />
                  <button 
                    onClick={handleSend} 
                    disabled={!inputText.trim() || isSending} 
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 px-10 py-3.5 aura-bg-gradient text-white rounded-[1.75rem] shadow-xl shadow-emerald-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-20 text-[11px] font-black uppercase tracking-[0.3em] min-w-[80px]"
                  >
                    {isSending ? (
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    ) : (
                      'Sync'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-20 animate-in fade-in duration-1000 bg-slate-50/30 dark:bg-slate-950/30">
            <div className="relative mb-16">
               <div className="absolute inset-0 bg-emerald-500/20 blur-[80px] rounded-full animate-pulse"></div>
               <Logo size="xl" className="relative z-10 animate-float" />
            </div>
            <h3 className="text-4xl font-black uppercase tracking-[0.5em] text-slate-900 dark:text-white leading-none">Aura Direct</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.4em] mt-8 max-w-sm leading-relaxed">
              Search for people above to start a conversation. <br/>Your messages are encrypted and secure.
            </p>
            <div className="mt-16 flex gap-10 opacity-20">
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Protocol</p>
                  <p className="text-sm font-black text-slate-600 dark:text-slate-300">P2P Encryption</p>
               </div>
               <div className="text-center">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Bandwidth</p>
                  <p className="text-sm font-black text-slate-600 dark:text-slate-300">Lossless Sync</p>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatView;