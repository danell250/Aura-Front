
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
    <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200/70 dark:border-slate-800 mb-8 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.04)] overflow-visible relative">
      <div className="p-8">
        <div className="flex gap-5">
          <div className="w-14 h-14 rounded-3xl overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-md transition-transform hover:scale-105 shrink-0 bg-slate-50 dark:bg-slate-800">
            {currentUser.avatarType === 'video' || currentUser.avatar.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) ? (
              <video src={currentUser.avatar} className="w-full h-full object-cover" autoPlay loop muted playsInline />
            ) : (
              <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Me" />
            )}
          </div>
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => { setContent(e.target.value); setCursorPosition(e.target.selectionStart || 0); }}
              placeholder={`What's your orbit today, ${currentUser.firstName}?`}
              className="w-full border-none focus:ring-0 text-xl font-semibold placeholder-slate-300 dark:placeholder-slate-600 resize-none min-h-[120px] outline-none py-3 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 items-center px-1">
          <span className="text-[9px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest mr-2">Energy Aura:</span>
          {Object.values(EnergyType).map((energy) => (
            <button
              key={energy}
              onClick={() => setSelectedEnergy(energy)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border active:scale-95 ${
                selectedEnergy === energy 
                ? 'bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-600 shadow-md' 
                : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              {energy}
            </button>
          ))}
        </div>

        {mediaPreview && (
          <div className="mt-6 rounded-[2.5rem] overflow-hidden border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 relative group/preview shadow-inner">
            {mediaPreview.type === 'video' ? (
              <video src={mediaPreview.url} className="w-full h-auto max-h-[500px] object-contain" controls />
            ) : mediaPreview.type === 'document' ? (
               <div className="p-10 flex items-center gap-6 bg-white dark:bg-slate-900">
                  <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center text-xl font-black shadow-inner">DOC</div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-base font-black text-slate-900 dark:text-slate-100 truncate uppercase tracking-tight">{mediaPreview.name}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mt-1.5">Resource Synced & Ready</p>
                  </div>
               </div>
            ) : (
              <img src={mediaPreview.url} className="w-full h-auto max-h-[500px] object-contain mx-auto" alt="" />
            )}
            <button 
              onClick={() => setMediaPreview(null)}
              className="absolute top-6 right-6 p-3 bg-white/40 dark:bg-black/40 backdrop-blur-2xl text-slate-900 dark:text-white rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl active:scale-75"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {isProcessingMedia && (
          <div className="mt-8 p-6 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-[2rem] border border-emerald-100/50 dark:border-emerald-800/50 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.3em] animate-pulse">Syncing {processingType}...</p>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full h-2 bg-white dark:bg-slate-800 rounded-full overflow-hidden p-0.5 shadow-inner">
              <div className="h-full bg-emerald-600 rounded-full transition-all duration-500 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-slate-100/60 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <ActionButton onClick={() => imageInputRef.current?.click()} icon="🖼️" label="Image" color="text-emerald-500" />
              <ActionButton onClick={() => videoInputRef.current?.click()} icon="🎥" label="Video" color="text-blue-500" />
              <ActionButton onClick={() => docInputRef.current?.click()} icon="📄" label="Sync" color="text-rose-500" />
              <div className="relative" ref={emojiPickerRef}>
                <ActionButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} icon="😊" label="Pulse" color="text-amber-500" />
                {showEmojiPicker && (
                  <div className="absolute top-full left-0 mt-6 z-[100] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.2)] rounded-[2.5rem] overflow-hidden animate-in slide-in-from-top-8 duration-500 origin-top">
                    <EmojiPicker onEmojiClick={onEmojiClick} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} width={300} height={400} />
                  </div>
                )}
              </div>
              <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 mx-2 hidden sm:block"></div>
              <ActionButton onClick={() => setShowInspiration(!showInspiration)} icon="✨" label="Aura AI" color="text-emerald-600 dark:text-emerald-400" isSpecial />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={(!content.trim() && !mediaPreview) || isProcessingMedia}
              className="px-10 py-4.5 aura-bg-gradient text-white rounded-[1.75rem] text-[13px] font-black uppercase tracking-[0.25em] shadow-[0_15px_30px_-8px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-[0.96] transition-all disabled:opacity-20"
            >
              Broadcast
            </button>
          </div>
        </div>

        {showInspiration && (
          <div className="mt-8 p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100/60 dark:border-emerald-800/30 animate-in slide-in-from-top-6 duration-700 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Logo size="lg" showText={false} />
            </div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">✨</span>
              <p className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-[0.2em]">Neural Content Synthesis</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={topic}
                onChange={e => setTopic(e.target.value)}
                placeholder="Target topic for generation..."
                className="flex-1 bg-white/80 dark:bg-slate-800/80 backdrop-blur border border-emerald-200 dark:border-emerald-800 rounded-[1.5rem] px-6 py-4 text-sm outline-none focus:ring-8 focus:ring-emerald-500/5 focus:border-emerald-400 transition-all font-bold text-slate-900 dark:text-slate-100"
              />
              <button 
                onClick={handleInspiration}
                disabled={isGenerating || !topic.trim()}
                className="px-10 py-4 bg-emerald-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl transition-all active:scale-90 flex-shrink-0"
              >
                {isGenerating ? 'Syncing...' : 'Generate'}
              </button>
            </div>
          </div>
        )}
      </div>

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4" onChange={(e) => handleFileChange(e, 'video')} />
      <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'document')} />
    </div>
  );
};

const ActionButton = ({ icon, label, onClick, color, isSpecial }: any) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all hover:shadow-md active:scale-90 group border border-transparent ${isSpecial ? 'bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-sm' : 'hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-100 dark:hover:border-slate-700'}`}
  >
    <span className="text-2xl transition-transform group-hover:scale-125 duration-300">{icon}</span>
    <span className={`text-[11px] font-black uppercase tracking-[0.1em] hidden xl:block ${color}`}>{label}</span>
  </button>
);

export default CreatePost;
