import React, { useState, useEffect, useRef } from 'react';
import { User, Message } from '../types';

interface MessagingSystemProps {
  currentUser: User;
  allUsers: User[];
  isOpen: boolean;
  onClose: () => void;
  onSendMessage: (receiverId: string, text: string) => void;
  messages: Message[];
  unreadCounts: Record<string, number>;
  onMarkAsRead: (senderId: string) => void;
}

const MessagingSystem: React.FC<MessagingSystemProps> = ({ 
  currentUser, 
  allUsers, 
  isOpen, 
  onClose, 
  onSendMessage, 
  messages, 
  unreadCounts,
  onMarkAsRead
}) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter users for messaging (excluding current user)
  const messagingUsers = allUsers.filter(user => user.id !== currentUser.id);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!selectedUser || !messageText.trim()) return;

    onSendMessage(selectedUser.id, messageText);
    setMessageText('');
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    // Mark messages as read when user opens the chat
    onMarkAsRead(user.id);
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
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <span>💬</span> Messages
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto">
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
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                      {hasUnread && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center text-xs text-white font-bold">
                          {unreadCounts[user.id]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <h3 className="font-black text-slate-900 dark:text-white truncate">{user.name}</h3>
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
          </div>
        </div>

        {/* Chat area */}
        <div className="w-2/3 flex flex-col">
          {selectedUser ? (
            <>
              {/* Chat header */}
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
                <img 
                  src={selectedUser.avatar} 
                  alt={selectedUser.name} 
                  className="w-10 h-10 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">{selectedUser.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Online now</p>
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
                      
                      return (
                        <div 
                          key={msg.id}
                          className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div 
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                              isCurrentUser 
                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-br-none' 
                                : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-bl-none'
                            }`}
                          >
                            {!isCurrentUser && sender && (
                              <p className="text-xs font-bold mb-1">{sender.name}</p>
                            )}
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${isCurrentUser ? 'text-purple-200' : 'text-slate-500 dark:text-slate-400'} text-right`}>
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
                <div className="flex gap-2">
                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Message ${selectedUser.name}...`}
                    className="flex-1 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Select a conversation</h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Choose a contact from the list to start messaging
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