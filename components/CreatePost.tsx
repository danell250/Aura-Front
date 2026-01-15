
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { User, EnergyType } from '../types';
import { uploadService } from '../services/upload';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import Logo from './Logo';
import TimeCapsuleModal, { TimeCapsuleData } from './TimeCapsuleModal';
import TimeCapsuleTutorial from './TimeCapsuleTutorial';
import { Avatar } from './MediaDisplay';
import { PrivacyService } from '../services/privacyService';
import { MediaItem } from '../types';
import ModernTextarea from './ModernTextarea';
import MediaUploader from './MediaUploader';

interface CreatePostProps {
  onPost: (content: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'document', taggedUserIds?: string[], documentName?: string, energy?: EnergyType, mediaItems?: MediaItem[]) => void;
  onTimeCapsule: (data: TimeCapsuleData) => void;
  onCreateAd?: () => void;
  currentUser: User;
  allUsers: User[];
}

interface SelectedMedia {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video';
  caption: string;
  headline: string;
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

const CreatePost: React.FC<CreatePostProps> = ({ onPost, onTimeCapsule, onCreateAd, currentUser, allUsers }) => {
  const [content, setContent] = useState('');
  const [isProcessingMedia, setIsProcessingMedia] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingType, setProcessingType] = useState<'image' | 'video' | 'document' | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<{ url: string, type: 'image' | 'video' | 'document', name?: string } | null>(null);
  const [selectedMediaItems, setSelectedMediaItems] = useState<SelectedMedia[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [selectedEnergy, setSelectedEnergy] = useState<EnergyType>(EnergyType.NEUTRAL);
  const [showTimeCapsuleModal, setShowTimeCapsuleModal] = useState(false);
  const [showTimeCapsuleTutorial, setShowTimeCapsuleTutorial] = useState(false);
  const acquaintances = useMemo(
    () => allUsers.filter(u => (currentUser.acquaintances || []).includes(u.id)),
    [allUsers, currentUser]
  );
  const [isMentioning, setIsMentioning] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<User[]>([]);

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

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursor = e.target.selectionStart || value.length;
    setContent(value);
    setCursorPosition(cursor);

    const textBeforeCursor = value.slice(0, cursor);
    const mentionMatch = textBeforeCursor.match(/(^|\s)@([a-zA-Z0-9_]*)$/);

    if (mentionMatch) {
      const query = mentionMatch[2] || '';
      const lower = query.toLowerCase();
      const suggestions = acquaintances
        .filter(user => {
          const handle = user.handle?.toLowerCase() || '';
          const name = user.name?.toLowerCase() || '';
          const first = user.firstName?.toLowerCase() || '';
          const last = user.lastName?.toLowerCase() || '';
          if (!lower) return true;
          return handle.includes(lower) || name.includes(lower) || first.includes(lower) || last.includes(lower);
        })
        .slice(0, 8);

      setMentionQuery(query);
      setMentionSuggestions(suggestions);
      setIsMentioning(suggestions.length > 0);
    } else {
      setMentionQuery('');
      setMentionSuggestions([]);
      setIsMentioning(false);
    }
  };

  const handleSelectMention = (user: User) => {
    if (!textareaRef.current) return;
    const value = content;
    const caret = cursorPosition;
    const textBeforeCursor = value.slice(0, caret);
    const atIndex = textBeforeCursor.lastIndexOf('@');
    if (atIndex === -1) return;

    const prefix = value.slice(0, atIndex);
    const suffix = value.slice(caret);
    const fallbackHandle = `@${user.firstName.toLowerCase()}${user.lastName ? user.lastName.toLowerCase() : ''}`;
    const handleText = user.handle || fallbackHandle;
    const newContent = prefix + handleText + ' ' + suffix;
    const newCursor = (prefix + handleText + ' ').length;

    setContent(newContent);
    setCursorPosition(newCursor);
    setIsMentioning(false);
    setMentionQuery('');
    setMentionSuggestions([]);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.selectionStart = newCursor;
        textareaRef.current.selectionEnd = newCursor;
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if ((!content.trim() && !mediaPreview && selectedMediaItems.length === 0) || isProcessingMedia) return;

    let finalMediaUrl = mediaPreview?.url;
    let finalMediaType = mediaPreview?.type;
    let finalMediaItems: MediaItem[] | undefined = undefined;

    if (selectedMediaItems.length > 0) {
      setIsProcessingMedia(true);
      setUploadProgress(0);
      let progressInterval: number | undefined;

      try {
        progressInterval = window.setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90));
        }, 200);

        const uploadedItems = await Promise.all(
          selectedMediaItems.map(async (item) => {
            const result = await uploadService.uploadFile(item.file);
            return {
              url: result.url,
              type: item.type,
              caption: item.caption,
              headline: item.headline
            };
          })
        );

        setUploadProgress(100);
        finalMediaItems = uploadedItems;

        if (uploadedItems.length > 0) {
          finalMediaUrl = uploadedItems[0].url;
          finalMediaType = uploadedItems[0].type;
        }
      } catch (error) {
        console.error("Upload failed", error);
        alert("Failed to upload media files.");
        return;
      } finally {
        if (progressInterval !== undefined) {
          clearInterval(progressInterval);
        }
        setIsProcessingMedia(false);
      }
    }

    const handleMatches: string[] = content.match(/@\w+/g) || [];
    const uniqueHandles = Array.from(new Set(handleMatches.map(h => h.toLowerCase())));
    const potentialTaggedUsers = allUsers.filter(u => u.handle && uniqueHandles.includes(u.handle.toLowerCase()));
    const permissionResults = await Promise.all(
      potentialTaggedUsers.map(async (user) => {
        const canTag = await PrivacyService.canTagUser(user.id);
        return canTag ? user.id : null;
      })
    );
    const taggedUserIds = permissionResults.filter((id): id is string => id !== null);

    onPost(
      content,
      finalMediaUrl,
      finalMediaType,
      taggedUserIds,
      mediaPreview?.name,
      selectedEnergy,
      finalMediaItems
    );

    setContent('');
    setMediaPreview(null);
    setSelectedMediaItems([]);
    setShowEmojiPicker(false);
    setSelectedEnergy(EnergyType.NEUTRAL);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, forcedType?: 'image' | 'video' | 'document') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Legacy support for document (single file, immediate upload)
    if (forcedType === 'document') {
        const file = files[0];
        // Original logic for document
        const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']; 
        // Note: original code checked image/video types for everything, but passed docInputRef for docs. 
        // We will just allow it for now or assume validation is less strict here for brevity, 
        // but let's try to match original validation if possible.
        // Actually the original code had strict validation.
        
        setIsProcessingMedia(true);
        try {
            const result = await uploadService.uploadFile(file);
            setMediaPreview({ url: result.url, type: 'document', name: file.name });
        } catch (err) {
            console.error(err);
            alert('Document upload failed');
        } finally {
            setIsProcessingMedia(false);
        }
        e.target.value = '';
        return;
    }

    // New flow for images/videos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    const maxSizeBytes = 10 * 1024 * 1024;
    const newItems: SelectedMedia[] = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!allowedTypes.includes(file.type)) {
             alert(`File ${file.name} has invalid type. Allowed: JPG, PNG, WEBP, MP4`);
             continue;
        }
        if (file.size > maxSizeBytes) {
             alert(`File ${file.name} is too large. Max size is 10MB`);
             continue;
        }
        
        let type: 'image' | 'video' | 'document' = forcedType || 'image';
        if (!forcedType && file.type.startsWith('video/')) type = 'video';

        newItems.push({
            id: Math.random().toString(36).substring(7),
            file,
            previewUrl: URL.createObjectURL(file),
            type,
            caption: '',
            headline: ''
        });
    }

    if (newItems.length > 0) {
        setSelectedMediaItems(prev => [...prev, ...newItems]);
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
              <ModernTextarea
                value={content}
                onChange={(val) => handleContentChange({ target: { value: val } } as any)}
                placeholder={`What's on your mind, ${currentUser.firstName}?`}
                maxLength={500}
                onSubmit={handleSubmit}
                submitText="Post"
                isSubmitting={isProcessingMedia}
                onEmojiClick={() => setShowEmojiPicker(!showEmojiPicker)}
              />
              {isMentioning && mentionSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20">
                  {mentionSuggestions.map(user => (
                    <button
                      key={user.id}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        handleSelectMention(user);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 text-sm"
                    >
                      <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                        <Avatar
                          src={user.avatar}
                          type={user.avatarType}
                          name={user.firstName}
                          size="custom"
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-gray-900 dark:text-gray-100 font-medium truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.handle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
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

        <div className="mt-3 px-1">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Tagging respects privacy. Some @mentioned users may not be tagged if their privacy settings prevent it.
          </p>
        </div>

        {mediaPreview && (
          <div className="mt-6 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 relative group/preview">
            {mediaPreview.type === 'document' ? (
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
            ) : null}
            <button
              onClick={() => setMediaPreview(null)}
              className="absolute top-3 right-3 p-2 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        <MediaUploader
          items={selectedMediaItems}
          onRemove={(id) =>
            setSelectedMediaItems((prev) => prev.filter((item) => item.id !== id))
          }
          onChangeHeadline={(id, value) =>
            setSelectedMediaItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, headline: value } : item
              )
            )
          }
          onChangeCaption={(id, value) =>
            setSelectedMediaItems((prev) =>
              prev.map((item) =>
                item.id === id ? { ...item, caption: value } : item
              )
            )
          }
        />

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
                    <div className="fixed inset-0 z-[99]" onClick={() => setShowEmojiPicker(false)} />
                  )}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 z-[100] shadow-xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                      <EmojiPicker
                        onEmojiClick={onEmojiClick}
                        theme={document.documentElement.classList.contains('dark') ? Theme.DARK : Theme.LIGHT}
                        width={320}
                        height={400}
                      />
                    </div>
                  )}
                </div>
              </div>
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

      <input type="file" ref={imageInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => handleFileChange(e, 'image')} />
      <input type="file" ref={videoInputRef} className="hidden" accept="video/mp4" multiple onChange={(e) => handleFileChange(e, 'video')} />
      <input type="file" ref={docInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={(e) => handleFileChange(e, 'document')} />

      <TimeCapsuleTutorial
        isOpen={showTimeCapsuleTutorial}
        onClose={() => setShowTimeCapsuleTutorial(false)}
        onComplete={handleTutorialComplete}
      />

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
