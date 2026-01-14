
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, Message } from '../types';
import { MessageService } from '../services/messageService';
import { uploadService } from '../services/upload';
import { soundService } from '../services/soundService';
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
  const AURA_ADMIN_EMAIL = 'aurasocialradiate@gmail.com';
  const [activeContact, setActiveContact] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [sidebarTab, setSidebarTab] = useState<'recent' | 'all' | 'search' | 'archived'>('recent');
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const messagesInitRef = useRef(false);
  const lastMessageIdRef = useRef<string | null>(null);
  const shouldStickToBottomRef = useRef(true);

  const auraAdminUser = useMemo(
    () => allUsers.find(u => (u.email || '').toLowerCase() === AURA_ADMIN_EMAIL),
    [allUsers, AURA_ADMIN_EMAIL]
  );


  // Load conversations and keep them updated
  useEffect(() => {
    let cancelled = false;

    const loadConversations = async () => {
      try {
        const response = await MessageService.getConversations(currentUser.id);
        if (!response.success) return;
        if (cancelled) return;
        const data = response.data || [];
        setConversations(data);
        const archivedFromBackend = data
          .filter((conv: any) => conv.isArchived)
          .map((conv: any) => conv._id as string);
        setArchivedIds(archivedFromBackend);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      }
    };

    const loop = async () => {
      if (cancelled) return;
      await loadConversations();
      if (cancelled) return;
      setTimeout(loop, 2000);
    };

    loop();

    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);

  // Load messages when active contact changes and keep them updated
  useEffect(() => {
    let cancelled = false;

    const loadMessages = async () => {
      if (!activeContact || cancelled) return;

      try {
        const response = await MessageService.getMessages(currentUser.id, activeContact.id);
        if (response.success && !cancelled) {
          setMessages(prev => {
            const previousLast = prev.length > 0 ? prev[prev.length - 1].id : null;
            const nextMessages = response.data;
            const nextLast = nextMessages.length > 0 ? nextMessages[nextMessages.length - 1].id : null;
            const hasPrevious = messagesInitRef.current;
            messagesInitRef.current = true;
            if (
              hasPrevious &&
              nextLast &&
              nextLast !== previousLast &&
              nextMessages.length > prev.length
            ) {
              const lastMessage = nextMessages[nextMessages.length - 1];
              if (lastMessage.senderId !== currentUser.id) {
                soundService.playMessage();
              }
            }
            lastMessageIdRef.current = nextLast;
            return nextMessages;
          });
          await MessageService.markAsRead(activeContact.id, currentUser.id);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load messages:', error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const loop = async () => {
      if (!activeContact || cancelled) return;
      setIsLoading(prev => prev || messages.length === 0);
      await loadMessages();
      if (cancelled) return;
      setTimeout(loop, 1200);
    };

    if (activeContact) {
      loop();
    }

    return () => {
      cancelled = true;
    };
  }, [activeContact, currentUser.id, messages.length]);



  useEffect(() => {
    if (!activeContact) return;
    if (!shouldStickToBottomRef.current && messagesInitRef.current) return;
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
    if ((!inputText.trim() && attachments.length === 0) || !activeContact || isSending) return;
    
    shouldStickToBottomRef.current = true;
    setIsSending(true);
    try {
      const isAuraSupport = activeContact.email && activeContact.email.toLowerCase() === AURA_ADMIN_EMAIL;
      const hasAuraReply = isAuraSupport && messages.some(
        msg => msg.senderId === (auraAdminUser?.id || activeContact.id) && msg.receiverId === currentUser.id
      );

      const createdMessages: Message[] = [];

      for (const file of attachments) {
        try {
          const result = await uploadService.uploadFile(file);
          const messageType = result.mimetype.startsWith('image') ? 'image' : 'file';
          const response = await MessageService.sendMessage(
            currentUser.id,
            activeContact.id,
            file.name,
            messageType,
            result.url
          );
          if (response.success) {
            createdMessages.push(response.data);
          }
        } catch (err) {
          console.error('Failed to upload or send attachment:', err);
          alert('Failed to send an attachment. Please try again.');
        }
      }

      let textMessage: Message | null = null;
      if (inputText.trim()) {
        const response = await MessageService.sendMessage(
          currentUser.id,
          activeContact.id,
          inputText.trim()
        );
        
        if (response.success) {
          textMessage = response.data;
        }
      }

      if (createdMessages.length > 0 || textMessage) {
        const newMessages = [
          ...createdMessages,
          ...(textMessage ? [textMessage] : [])
        ];

        setMessages(prev => [
          ...prev,
          ...newMessages
        ]);
        setInputText('');
        setAttachments([]);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }

        const updatedConversations = await MessageService.getConversations(currentUser.id);
        if (updatedConversations.success) {
          const data = updatedConversations.data || [];
          setConversations(data);
          const archivedFromBackend = data
            .filter((conv: any) => conv.isArchived)
            .map((conv: any) => conv._id as string);
          setArchivedIds(archivedFromBackend);
        }

        if (isAuraSupport && !hasAuraReply && newMessages.some(msg => msg.senderId === currentUser.id)) {
          setTimeout(async () => {
            try {
              const reply = await MessageService.sendMessage(
                auraAdminUser?.id || activeContact.id,
                currentUser.id,
                "Hi there, thanks for reaching out to Aura Support. Share any issues or ideas and we'll assist you as soon as possible."
              );
              if (reply.success) {
                setMessages(prev => [...prev, reply.data]);
              }
            } catch (error) {
              console.error('Failed to send Aura Support auto-response:', error);
            }
          }, 1000);
        }
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setAttachments(prev => [...prev, ...files]);
    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleMessagesScroll = () => {
    const el = messagesContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    shouldStickToBottomRef.current = distanceFromBottom < 120;
  };

  const handleArchive = async () => {
    if (!activeContact) return;
    const isArchived = archivedIds.includes(activeContact.id);
    setArchivedIds(prev =>
      isArchived ? prev.filter(id => id !== activeContact.id) : [...prev, activeContact.id]
    );
    setShowHeaderMenu(false);
    setActiveContact(null);

    try {
      await MessageService.setArchiveState(currentUser.id, activeContact.id, !isArchived);
      const updatedConversations = await MessageService.getConversations(currentUser.id);
      if (updatedConversations.success) {
        const data = updatedConversations.data || [];
        setConversations(data);
        const archivedFromBackend = data
          .filter((conv: any) => conv.isArchived)
          .map((conv: any) => conv._id as string);
        setArchivedIds(archivedFromBackend);
      }
    } catch (error) {
      console.error('Failed to update archive state:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (!activeContact) return;
    if (!window.confirm(`Are you sure you want to purge all conversation data with ${activeContact.name}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await MessageService.deleteConversation(currentUser.id, activeContact.id);

      setMessages([]);
      setDeletedIds(prev => [...prev, activeContact.id]);
      setActiveContact(null);
      setShowHeaderMenu(false);

      const updatedConversations = await MessageService.getConversations(currentUser.id);
      if (updatedConversations.success) {
        const data = updatedConversations.data || [];
        setConversations(data);
        const archivedFromBackend = data
          .filter((conv: any) => conv.isArchived)
          .map((conv: any) => conv._id as string);
        setArchivedIds(archivedFromBackend);
      }
    } catch (error) {
      console.error('Failed to purge conversation:', error);
      alert('Failed to purge conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextAreaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 320) + 'px';
    setInputText(el.value);
  };

  const insertEmoji = (emoji: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    const newValue = inputText.slice(0, start) + emoji + inputText.slice(end);
    setInputText(newValue);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + emoji.length;
      el.setSelectionRange(caret, caret);
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 320) + 'px';
    });
    setShowEmojiPicker(false);
  };

  const filteredContacts = useMemo(() => {
    const addAuraAdmin = (list: User[]) => {
      if (!auraAdminUser) return list;
      if (auraAdminUser.id === currentUser.id) return list;
      if (list.some(u => u.id === auraAdminUser.id)) return list;
      return [auraAdminUser, ...list];
    };

    if (sidebarTab === 'search') {
      return addAuraAdmin(searchResults);
    }
    
    if (sidebarTab === 'all') {
      const base = contactSearch.trim() ? allUsers.filter(u => u.id !== currentUser.id) : [];
      return addAuraAdmin(base);
    }

    const archivedSet = new Set(archivedIds);
    const deletedSet = new Set(deletedIds);

    const recentUserIds = conversations
      .filter(conv => !archivedSet.has(conv._id) && !deletedSet.has(conv._id))
      .map(conv => conv._id as string);

    const archivedUserIds = conversations
      .filter(conv => archivedSet.has(conv._id) && !deletedSet.has(conv._id))
      .map(conv => conv._id as string);

    const sourceIds = sidebarTab === 'recent' ? recentUserIds : archivedUserIds;

    const base = allUsers.filter(u => 
      u.id !== currentUser.id && 
      sourceIds.includes(u.id)
    );
    return addAuraAdmin(base);
  }, [sidebarTab, searchResults, allUsers, currentUser.id, conversations, contactSearch, archivedIds, auraAdminUser]);

  const getLastMessage = (userId: string) => {
    const conversation = conversations.find(conv => conv._id === userId);
    if (conversation?.lastMessage) {
      return conversation.lastMessage;
    }
    
    return null;
  };

  const isSameDay = (a: Date, b: Date) => {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  const getDaySeparatorLabel = (date: Date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(date, today)) {
      return 'Today';
    }

    if (isSameDay(date, yesterday)) {
      return 'Yesterday';
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  const renderMessages = () => {
    const items: React.ReactElement[] = [];
    let lastDateKey: string | null = null;

    messages.forEach((msg, idx) => {
      const isMe = msg.senderId === currentUser.id;
      const prevMsg = messages[idx - 1];
      const isFirstInSequence = !prevMsg || prevMsg.senderId !== msg.senderId;
      const timestamp = typeof msg.timestamp === 'number' ? msg.timestamp : new Date(msg.timestamp).getTime();
      const kind = msg.messageType || 'text';
      const messageDate = new Date(timestamp);
      const dateKey = messageDate.toDateString();

      if (dateKey !== lastDateKey) {
        const label = getDaySeparatorLabel(messageDate);
        items.push(
          <div
            key={`separator-${dateKey}`}
            className="flex items-center my-4"
          >
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
            <span className="mx-4 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500 whitespace-nowrap">
              {label}
            </span>
            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          </div>
        );
        lastDateKey = dateKey;
      }

      const dateLabel = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(timestamp);

      items.push(
        <div
          key={msg.id}
          className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}
        >
          <div
            className={`max-w-[78%] sm:max-w-[68%] px-5 py-4 sm:px-6 sm:py-5 rounded-3xl text-[14px] font-medium shadow-md leading-relaxed transition-all hover:translate-y-[1px] ${
              isMe
                ? 'aura-bg-gradient text-white shadow-emerald-500/10'
                : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-100 dark:border-slate-800 shadow-slate-200/40 dark:shadow-black/30'
            } ${isMe ? 'rounded-br-xl' : 'rounded-bl-xl'} ${
              !isFirstInSequence && (isMe ? 'rounded-tr-xl' : 'rounded-tl-xl')
            }`}
          >
            <div className="space-y-2.5">
              {kind === 'image' && msg.mediaUrl && (
                <a
                  href={msg.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block overflow-hidden rounded-3xl border border-white/10"
                >
                  <img
                    src={msg.mediaUrl}
                    alt={msg.text || 'Image'}
                    className="max-h-72 w-full object-cover"
                  />
                </a>
              )}
              {kind === 'file' && msg.mediaUrl && (
                <a
                  href={msg.mediaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl text-sm font-bold ${
                    isMe
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-50'
                  }`}
                >
                  <span className="text-lg">📎</span>
                  <span className="truncate max-w-[220px]">
                    {msg.text || 'Download file'}
                  </span>
                </a>
              )}
              {(kind === 'text' || !msg.mediaUrl) && msg.text && (
                <div className="break-words">
                  {msg.text}
                </div>
              )}
              {kind === 'image' && msg.mediaUrl && msg.text && (
                <div className="break-words text-[13px] opacity-90">
                  {msg.text}
                </div>
              )}
            </div>
            <div
              className={`text-[10px] mt-3 font-semibold tracking-wide flex items-center gap-2 ${
                isMe ? 'text-white/70 justify-end' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              <span>{dateLabel}</span>
              {msg.isEdited && <span className="opacity-70">· Edited</span>}
              {isMe && (
                <svg
                  className="w-3 h-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={4}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>
          </div>
        </div>
      );
    });

    return items;
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[600px] max-h-[900px] bg-white dark:bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] overflow-hidden border border-slate-200/60 dark:border-slate-800 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.2)] animate-in fade-in zoom-in-95 duration-700 max-w-7xl mx-auto transition-colors">
      
      {/* Sidebar */}
      <div className="w-80 border-r border-slate-100 dark:border-slate-800 flex flex-col bg-slate-50/20 dark:bg-slate-900/40">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-900 dark:text-white">Aura Direct</h2>
            <button onClick={onBack} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:bg-slate-900 dark:hover:bg-emerald-600 hover:text-white rounded-[1.25rem] transition-all active:scale-90">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </button>
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl mb-6">
            <button 
              onClick={() => setSidebarTab('recent')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'recent' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Recent
            </button>
            <button 
              onClick={() => setSidebarTab('archived')}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sidebarTab === 'archived' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 dark:text-slate-500'}`}
            >
              Archived
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
                 sidebarTab === 'archived' ? 'No archived conversations yet' :
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
                    {user.email && user.email.toLowerCase() === AURA_ADMIN_EMAIL ? (
                      <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center ring-4 ring-white/10 group-hover:scale-110 transition-transform">
                        <Logo size="sm" showText={false} />
                      </div>
                    ) : (
                      <img src={user.avatar} className="w-12 h-12 rounded-2xl object-cover ring-4 ring-white/10 group-hover:scale-110 transition-transform" alt="" />
                    )}
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
                      {user.email && user.email.toLowerCase() === AURA_ADMIN_EMAIL ? 'Aura Support' : user.name}
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
                  {activeContact.email && activeContact.email.toLowerCase() === AURA_ADMIN_EMAIL ? (
                    <div className="w-16 h-16 rounded-[1.75rem] overflow-hidden bg-white flex items-center justify-center shadow-2xl border-4 border-white dark:border-slate-800 transition-all group-hover/avatar:scale-105">
                      <Logo size="md" showText={false} />
                    </div>
                  ) : (
                    <img src={activeContact.avatar} className="w-16 h-16 rounded-[1.75rem] object-cover shadow-2xl border-4 border-white dark:border-slate-800 transition-all group-hover/avatar:scale-105" alt="" />
                  )}
                  <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 bg-emerald-500 border-4 border-white dark:border-slate-800 rounded-full shadow-lg shadow-emerald-500/20"></div>
                </div>
                <div>
                  <h3 className="font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white text-lg leading-none">
                    {activeContact.email && activeContact.email.toLowerCase() === AURA_ADMIN_EMAIL ? 'Aura Support' : activeContact.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-3">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-[0.2em]">Live Synchronization</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-4 relative">
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
            <div
              ref={messagesContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 overflow-y-auto px-6 sm:px-10 py-6 sm:py-10 space-y-6 no-scrollbar bg-slate-50/10 dark:bg-slate-950/20"
            >
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
                renderMessages()
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-6 sm:px-10 py-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="max-w-5xl mx-auto space-y-4">
                {attachments.length > 0 && (
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-3">
                    <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                      <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-lg flex-shrink-0">
                        📎
                      </div>
                      <div className="flex gap-2">
                        {attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 max-w-[180px]"
                          >
                            <span className="truncate">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-rose-500"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <span className="ml-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      {attachments.length} file{attachments.length > 1 ? 's' : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleAttachmentClick}
                    className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700 active:scale-90 shadow-sm"
                  >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                  </button>
                  <div className="flex-1 relative">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleAttachmentChange}
                    />
                    <div className="absolute left-3 top-2.5 text-slate-300 dark:text-slate-600 pointer-events-none">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m2 0a8 8 0 11-16 0 8 8 0 0116 0z" /></svg>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={inputText}
                      onChange={handleTextAreaInput}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isSending) handleSend();
                        }
                      }}
                      placeholder="Synthesize neural message..."
                      disabled={isSending}
                      rows={2}
                      className="w-full pl-10 pr-32 py-3 bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl border border-slate-200/60 dark:border-slate-700/70 outline-none focus:ring-8 focus:ring-emerald-500/10 dark:focus:ring-emerald-500/20 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm font-medium text-slate-900 dark:text-white disabled:opacity-50 resize-none overflow-y-auto max-h-60 min-h-[52px]"
                    />
                    <button
                      onClick={() => setShowEmojiPicker(v => !v)}
                      className="absolute right-24 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700"
                      title="Insert emoji"
                    >
                      😊
                    </button>
                    <button 
                      onClick={handleSend} 
                      disabled={(!inputText.trim() && attachments.length === 0) || isSending} 
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-7 py-2.5 aura-bg-gradient text-white rounded-xl shadow-lg shadow-emerald-500/30 flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 text-[11px] font-black uppercase tracking-[0.25em] min-w-[72px]"
                    >
                      {isSending ? (
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                      ) : (
                        'Send'
                      )}
                    </button>
                    {showEmojiPicker && (
                      <div className="absolute bottom-16 right-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl p-3 w-64 max-h-60 overflow-y-auto z-50">
                        <div className="grid grid-cols-8 gap-2 text-xl">
                          {['😀','😁','😂','🤣','😊','😍','😘','😜','🤔','😎','😇','🤗','👍','🙏','👏','🔥','🎉','💯','✅','✨','❤️','💪','🤝','🥳','😅','😭','😤','🥰','😏','🙌','🤩','😴','🤪','😬','😱','🤓','😔','🤷','👌','👀','👋','👑','🌟','🚀','🌈','🍀','🍕','☕','🧠'].map(e => (
                            <button key={e} onClick={() => insertEmoji(e)} className="hover:scale-125 transition-transform" title={e}>
                              {e}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
