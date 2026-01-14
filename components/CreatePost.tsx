
import React, { useState, useRef, useEffect } from 'react';
import { User, EnergyType } from '../types';
import { uploadService } from '../services/upload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import Logo from './Logo';
import TimeCapsuleModal, { TimeCapsuleData } from './TimeCapsuleModal';
import TimeCapsuleTutorial from './TimeCapsuleTutorial';
import { Avatar } from './MediaDisplay';
import AIContentGenerator from './AIContentGenerator';

interface CreatePostProps {
  onPost: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document', taggedUserIds?: string[], documentName?: string, energy?: EnergyType) => void;
  onTimeCapsule: (data: TimeCapsuleData) => void;
  onGenerateAIContent: (prompt: string) => Promise<string>;
  onCreateAd?: () => void; // New prop for opening ad manager
  currentUser: User;
  allUsers: User[];
}

const ActionButton = ({ icon, label, onClick, color, isSpecial }: any) => (
  <button 
    onClick={onClick}
    className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 hover:shadow-md active:scale-95 border border-transparent overflow-hidden ${
      isSpecial 
        ? 'bg-white/90 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 hover:border-gray-200 dark:hover:border-gray-600 shadow-sm backdrop-blur-sm' 
        : 'bg-gray-50/80 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-white/10 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm'
    }`}
  >
    <span className="text-xl transition-transform duration-300 group-hover:scale-105">{icon}</span>
    <span className={`text-xs font-semibold hidden xl:block transition-colors duration-300 ${color}`}>{label}</span>
    {isSpecial && (
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/20 to-indigo-50/20 dark:from-blue-900/10 dark:to-indigo-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    )}
  </button>
);

const CreatePost: React.FC<CreatePostProps> = ({ onPost, onTimeCapsule, onGenerateAIContent, onCreateAd, currentUser, allUsers }) => {
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIContentGenerator, setShowAIContentGenerator] = useState(false);
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingType, setProcessingType] = useState<'image' | 'video' | 'document' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType>(EnergyType.NEUTRAL);
  const [showTimeCapsuleModal, setShowTimeCapsuleModal] = useState(false);
  const [showTimeCapsuleTutorial, setShowTimeCapsuleTutorial] = useState(false);

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



  const handleTimeCapsuleSubmit = (data: TimeCapsuleData) => {
    onTimeCapsule(data);
    setShowTimeCapsuleModal(false);
  };

  const handleTimeCapsuleClick = () => {
    // Check if user has seen tutorial
    const hasSeenTutorial = localStorage.getItem('aura_timecapsule_tutorial');
    if (!hasSeenTutorial) {
      setShowTimeCapsuleTutorial(true);
    } else {
      setShowTimeCapsuleModal(true);
    }
  };

  const handleTutorialComplete = () => {
    localStorage.setItem('aura_timecapsule_tutorial', 'true');
    setShowTimeCapsuleTutorial(false);
    setShowTimeCapsuleModal(true);
  };

  return (
    <div className="group relative">
      {/* Main card with professional styling */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 mb-8 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        
        <div className="relative p-6">
          <div className="flex gap-4">
            {/* Professional avatar */}
            <div className="relative shrink-0">
              <div className="w-12 h-12 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300 hover:shadow-md bg-white dark:bg-gray-800">
                <Avatar 
                  src={currentUser.avatar} 
                  type={currentUser.avatarType} 
                  name={currentUser.firstName} 
                  size="custom"
                  className="w-full h-full"
                />
              </div>
              {/* Status indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
            </div>
            
            <div className="flex-1 relative">
              {/* Professional textarea */}
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => { setContent(e.target.value); setCursorPosition(e.target.selectionStart || 0); }}
                  placeholder={`What's on your mind, ${currentUser.firstName}?`}
                  className="w-full border-0 bg-transparent focus:ring-0 text-lg placeholder-gray-400 dark:placeholder-gray-500 resize-none min-h-[120px] outline-none py-3 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  style={{ fieldSizing: 'content' }}
                />
                {/* Character count */}
                {content.length > 0 && (
                  <div className="absolute bottom-2 right-2 text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {content.length}/2000
                  </div>
                )}
              </div>
            </div>
          </div>

        {/* Professional energy selector */}
        <div className="mt-4 flex flex-wrap gap-2 items-center px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Mood:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.values(EnergyType).map((energy) => (
              <button
                key={energy}
                onClick={() => setSelectedEnergy(energy)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
                  selectedEnergy === energy 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm'
                }`}
              >
                {energy}
              </button>
            ))}
          </div>
        </div>

        {mediaPreview && (
          <div className="mt-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative group/preview">
            {mediaPreview.type === 'video' ? (
              <video src={mediaPreview.url} className="w-full h-auto max-h-[400px] object-contain" controls />
            ) : mediaPreview.type === 'document' ? (
              <>
                {mediaPreview.url.toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full flex flex-col bg-white dark:bg-gray-900">
                    <iframe
                      src={mediaPreview.url}
                      className="w-full h-[500px] border-none bg-white"
                      title="Document preview"
                    />
                    <div className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-sm flex-shrink-0">
                          PDF
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {mediaPreview.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Scroll to preview all pages
                          </p>
                        </div>
                      </div>
                      <a
                        href={mediaPreview.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 underline"
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex items-center gap-4 bg-white dark:bg-gray-800">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-lg flex items-center justify-center text-lg font-semibold shadow-sm flex-shrink-0">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{mediaPreview.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Document ready for sharing</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="relative">
                <img src={mediaPreview.url} className="w-full h-auto max-h-[400px] object-contain mx-auto" alt="" />
              </div>
            )}
            <button
              onClick={() => setMediaPreview(null)}
              className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* Professional upload progress */}
        {isProcessingMedia && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Uploading {processingType}...</p>
              </div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">{Math.round(uploadProgress)}%</p>
            </div>
            <div className="w-full h-2 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        )}

        {/* Professional action bar */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-1">
                <ActionButton onClick={() => imageInputRef.current?.click()} icon="📸" label="Photo" color="text-blue-600" />
                <ActionButton onClick={() => videoInputRef.current?.click()} icon="🎬" label="Video" color="text-purple-600" />
                <ActionButton onClick={() => docInputRef.current?.click()} icon="📎" label="File" color="text-green-600" />
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <ActionButton onClick={handleTimeCapsuleClick} icon="⏰" label="Time Capsule" color="text-purple-600" isSpecial={true} />
                {onCreateAd && (
                  <ActionButton onClick={onCreateAd} icon="📢" label="Create Ad" color="text-orange-600" isSpecial={true} />
                )}
                <div className="relative" ref={emojiPickerRef}>
                  <ActionButton onClick={() => setShowEmojiPicker(!showEmojiPicker)} icon="😄" label="Emoji" color="text-yellow-600" />
                  {showEmojiPicker && (
                    <div className="absolute top-full left-0 mt-2 z-[100] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <EmojiPicker onEmojiClick={onEmojiClick} theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT} width={320} height={400} />
                    </div>
                  )}
                </div>
              </div>
              <ActionButton
                onClick={() => setShowAIContentGenerator(true)}
                icon="🤖"
                label="AI Write"
                color="text-purple-600"
                isSpecial
              />
            </div>

            <button 
              onClick={handleSubmit}
              disabled={(!content.trim() && !mediaPreview) || isProcessingMedia}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600 disabled:hover:shadow-sm flex items-center gap-2"
            >
              <span>Post</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>


        </div>
      </div>

      <input type="file" ref={imageInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4" onChange={(e) => handleFileChange(e, 'video')} />
      <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'document')} />

      <AIContentGenerator
        isOpen={showAIContentGenerator}
        onClose={() => setShowAIContentGenerator(false)}
        onGenerate={onGenerateAIContent}
        onUseContent={(generated) => setContent(generated)}
      />

      <TimeCapsuleTutorial
        isOpen={showTimeCapsuleTutorial}
        onClose={() => setShowTimeCapsuleTutorial(false)}
        onComplete={handleTutorialComplete}
      />

      {/* Time Capsule Modal */}
      <TimeCapsuleModal
        isOpen={showTimeCapsuleModal}
        onClose={() => setShowTimeCapsuleModal(false)}
        onSubmit={handleTimeCapsuleSubmit}
        currentUser={currentUser}
        allUsers={allUsers}
      />
    </div>
  );
};

export default CreatePost;
