
import React, { useState, useRef, useEffect } from 'react';
import { User, EnergyType } from '../types';
import { geminiService } from '../services/gemini';
import { uploadService } from '../services/upload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import Logo from './Logo';

interface CreatePostProps {
  onPost: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document', taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => void;
  currentUser: User;
  allUsers: User[];
}

const ActionButton = ({ icon, label, onClick, color, isSpecial }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 hover:shadow-lg active:scale-95 border border-transparent overflow-hidden ${
      isSpecial 
        ? 'bg-gradient-to-r from-emerald-50/80 to-blue-50/80 dark:from-emerald-950/60 dark:to-blue-950/60 hover:from-emerald-100/80 hover:to-blue-100/80 dark:hover:from-emerald-900/60 dark:hover:to-blue-900/60 hover:border-emerald-300/50 dark:hover:border-emerald-700/50 shadow-md backdrop-blur-sm' 
        : 'hover:bg-slate-100/70 dark:hover:bg-slate-800/70 hover:border-slate-200/50 dark:hover:border-slate-700/50'
    }`}
  >
    <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{icon}</span>
    <span className={`text-[11px] font-black uppercase tracking-wide hidden xl:block transition-colors duration-300 ${color}`}>{label}</span>
    {isSpecial && (
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    )}
  </button>
);

const CreatePost: React.FC<CreatePostProps> = ({ onPost, currentUser, allUsers }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingType, setProcessingType] = useState<'image' | 'video' | 'document' | null>(null);
  const [showInspiration, setShowInspiration] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [topic, setTopic] = useState('');
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType>(EnergyType.NEUTRAL);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = () => {
    if ((!content.trim() && !mediaPreview) || isProcessingMedia) return;
    const handles: string[] = content.match(/@\w+/g) || [];
    const taggedUserIds = allUsers.filter(u => handles.includes(u.handle)).map(u => u.id);
    onPost(content, mediaPreview?.url, mediaPreview?.type, taggedUserIds, mediaPreview?.name, selectedEnergy);
    setContent('');
    setMediaPreview(null);
    setShowInspiration(false);
    setShowEmojiPicker(false);
    setSelectedEnergy(EnergyType.NEUTRAL);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, forcedType?: 'image' | 'video' | 'document') => {
    const file = e.target.files?.[0];
    if (file) {
      let type: 'image' | 'video' | 'document' = forcedType || 'image';
      if (!forcedType) {
        if (file.type.startsWith('video/')) type = 'video';
        else if (file.type === 'application/pdf' || file.type.includes('msword') || file.type.includes('officedocument')) type = 'document';
      }
      setIsProcessingMedia(true);
      setUploadProgress(0);
      setProcessingType(type);

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + 5;
          return next >= 90 ? 90 : next;
        });
      }, 100);

      try {
        const result = await uploadService.uploadFile(file);
        
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setTimeout(() => {
          setMediaPreview({ url: result.url, type, name: result.filename });
          setIsProcessingMedia(false);
          setUploadProgress(0);
          setProcessingType(null);
        }, 300);
      } catch (error) {
        console.error('Upload failed:', error);
        clearInterval(progressInterval);
        setIsProcessingMedia(false);
        setUploadProgress(0);
        setProcessingType(null);
        alert('Failed to upload file. Please try again.');
      }
    }
    e.target.value = '';
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    const { emoji } = emojiData;
    const start = content.substring(0, cursorPosition);
    const end = content.substring(cursorPosition);
    setContent(start + emoji + end);
    setCursorPosition(cursorPosition + emoji.length);
  };

  const handleInspiration = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    const suggestion = await geminiService.generatePostInspiration(topic);
    setContent(suggestion);
    setIsGenerating(false);
    setShowInspiration(false);
  };

  return (
    <div className="group relative">
      {/* Main card with glassmorphism effect */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] border border-slate-200/50 dark:border-slate-700/50 mb-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.08)] hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.12)] transition-all duration-500 overflow-hidden">
        {/* Gradient accent border */}
        <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-r from-emerald-500/20 via-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative p-8">
          <div className="flex gap-6">
            {/* Enhanced avatar with glow effect */}
            <div className="relative shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border-3 border-white/50 dark:border-slate-800/50 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl bg-gradient-to-br from-emerald-400 to-blue-500 p-0.5">
                <div className="w-full h-full rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  {currentUser.avatarType === 'video' || currentUser.avatar.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) ? (
                    <video src={currentUser.avatar} className="w-full h-full object-cover" autoPlay loop muted playsInline />
                  ) : (
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Me" />
                  )}
                </div>
              </div>
              {/* Online status indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-3 border-white dark:border-slate-900 animate-pulse"></div>
            </div>
            
            <div className="flex-1 relative">
              {/* Enhanced textarea with modern styling */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setCursorPosition(e.target.selectionStart || 0); }}
                  placeholder={`Share your cosmic thoughts, ${currentUser.firstName}... ✨`}
                  className="w-full border-0 bg-transparent focus:ring-0 text-xl font-medium placeholder-slate-300/60 dark:placeholder-slate-600/60 resize-none min-h-[140px] outline-none py-4 text-slate-900 dark:text-slate-100 transition-all duration-200"
                  style={{ fieldSizing: 'content' }}
                />
                {/* Character count */}
                {content.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-slate-400 dark:text-slate-600 font-medium">
                    {content.length}/2000
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Enhanced energy selector with pills */}
        <div className="mt-6 flex flex-wrap gap-3 items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">Vibe:</span>
            <div className="w-2 h-2 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-pulse"></div>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(EnergyType).map((energy) => (
              <button
                key={energy}
                onClick={() => setSelectedEnergy(energy)}
                className={`group relative px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-wide transition-all duration-300 border active:scale-95 overflow-hidden ${
                  selectedEnergy === energy 
                  ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-white border-transparent shadow-lg transform scale-105' 
                  : 'bg-white/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50 hover:border-emerald-300/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:shadow-md'
                }`}
              >
                <span className="relative z-10">{energy}</span>
                {selectedEnergy === energy && (
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-blue-400 opacity-20 animate-pulse"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced media preview */}
        {mediaPreview && (
          <div className="mt-8 rounded-[2rem] overflow-hidden border border-slate-200/50 dark:border-slate-700/50 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-800/50 relative group/preview shadow-lg">
            {mediaPreview.type === 'video' ? (
              <video src={mediaPreview.url} className="w-full h-auto max-h-[500px] object-contain" controls />
            ) : mediaPreview.type === 'document' ? (
               <div className="p-12 flex items-center gap-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
                  <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-blue-500 text-white rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg flex-shrink-0">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">{mediaPreview.name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">Document ready for sharing</p>
                  </div>
               </div>
            ) : (
              <div className="relative">
                <img src={mediaPreview.url} className="w-full h-auto max-h-[500px] object-contain mx-auto" alt="" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/preview:opacity-100 transition-opacity duration-300"></div>
              </div>
            )}
            <button 
              onClick={() => setMediaPreview(null)}
              className="absolute top-4 right-4 p-3 bg-white/90 dark:bg-black/90 backdrop-blur-xl text-slate-900 dark:text-white rounded-2xl hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-xl hover:shadow-2xl active:scale-90 group/remove"
            >
              <svg className="w-5 h-5 transition-transform duration-300 group-hover/remove:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Enhanced upload progress */}
        {isProcessingMedia && (
          <div className="mt-8 p-8 bg-gradient-to-br from-emerald-50/60 to-blue-50/60 dark:from-emerald-950/40 dark:to-blue-950/40 rounded-[2rem] border border-emerald-200/50 dark:border-emerald-800/50 shadow-lg backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest animate-pulse">Uploading {processingType}...</p>
              </div>
              <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full h-3 bg-white/70 dark:bg-slate-800/70 rounded-full overflow-hidden shadow-inner backdrop-blur">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all duration-700 ease-out relative overflow-hidden" style={{ width: `${uploadProgress}%` }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced action bar */}
        <div className="mt-12 pt-8 border-t border-slate-200/50 dark:border-slate-700/50">
          <div className="flex flex-wrap items-center justify-between gap-8">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 rounded-2xl p-1">
                <ActionButton onClick={() => imageInputRef.current?.click()} icon="📸" label="Photo" color="text-emerald-500" />
                <ActionButton onClick={() => videoInputRef.current?.click()} icon="🎬" label="Video" color="text-blue-500" />
                <ActionButton onClick={() => docInputRef.current?.click()} icon="📎" label="File" color="text-purple-500" />
                <div className="w-px h-6 bg-slate-300/50 dark:bg-slate-600/50 mx-1"></div>
                <div className="relative" ref={emojiPickerRef}>
                  <ActionButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} icon="😄" label="Emoji" color="text-amber-500" />
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-6 z-[100] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.25)] rounded-[2rem] overflow-hidden animate-in slide-in-from-top-8 duration-500 origin-top border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl">
                      <EmojiPicker onEmojiClick={onEmojiClick} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} width={320} height={420} />
                    </div>
                  )}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200/50 dark:bg-slate-700/50 mx-2 hidden lg:block"></div>
              <ActionButton onClick={() => setShowInspiration(!showInspiration)} icon="✨" label="AI Assist" color="text-gradient bg-gradient-to-r from-emerald-500 to-blue-500 bg-clip-text text-transparent" isSpecial />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={(!content.trim() && !mediaPreview) || isProcessingMedia}
              className="group relative px-12 py-5 bg-gradient-to-r from-emerald-500 via-blue-500 to-purple-500 text-white rounded-[2rem] text-[13px] font-black uppercase tracking-wider shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] hover:shadow-[0_25px_50px_-12px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-[0.95] transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:brightness-100 disabled:hover:shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)] overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <span>Launch</span>
                <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-blue-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>
        </div>

        {/* Enhanced AI inspiration section */}
        {showInspiration && (
          <div className="mt-10 p-10 bg-gradient-to-br from-emerald-50/70 via-blue-50/50 to-purple-50/70 dark:from-emerald-950/30 dark:via-blue-950/20 dark:to-purple-950/30 rounded-[2.5rem] border border-emerald-200/60 dark:border-emerald-800/30 animate-in slide-in-from-top-6 duration-700 shadow-lg backdrop-blur-sm relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Logo size="xl" showText={false} />
            </div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <p className="text-[12px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest">AI Content Generator</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Powered by neural networks</p>
                </div>
              </div>
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="What would you like to write about?"
                    className="w-full bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-emerald-200/50 dark:border-emerald-800/50 rounded-[1.75rem] px-8 py-5 text-base outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-400 transition-all font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500"
                  />
                </div>
                <button 
                  onClick={handleInspiration}
                  disabled={isGenerating || !topic.trim()}
                  className="group px-12 py-5 bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-[1.75rem] text-[12px] font-black uppercase tracking-wider hover:from-emerald-600 hover:to-blue-600 shadow-xl hover:shadow-2xl transition-all duration-300 active:scale-95 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    {isGenerating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <span>Create</span>
                        <svg className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                      </>
                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4" onChange={(e) => handleFileChange(e, 'video')} />
      <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'document')} />
    </div>
  );
};

export default CreatePost;
