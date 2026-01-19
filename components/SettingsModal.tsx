
import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';
import { COUNTRIES, INDUSTRIES } from '../constants';
import { uploadService } from '../services/upload';
import { apiFetch } from '../utils/api';
import { UserService } from '../services/userService';

interface SettingsModalProps {
  currentUser: User;
  onUpdate: (updates: Partial<User>) => void;
  onClose: () => void;
  requireCompletion?: boolean;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ currentUser, onUpdate, onClose, requireCompletion = false }) => {
  const [form, setForm] = useState({
    firstName: currentUser.firstName,
    lastName: currentUser.lastName,
    handle: currentUser.handle,
    bio: currentUser.bio || '',
    avatar: currentUser.avatar,
    avatarType: currentUser.avatarType || 'image',
    coverImage: currentUser.coverImage || '',
    coverType: currentUser.coverType || 'image',
    isPrivate: currentUser.isPrivate || false,
    dob: currentUser.dob || '',
    country: currentUser.country || '',
    industry: currentUser.industry || '',
    companyName: currentUser.companyName || '',
    companyWebsite: currentUser.companyWebsite || '',
    isCompany: currentUser.isCompany || false
  });

  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);
  const originalHandleRef = useRef(currentUser.handle || '');

  const normalizeHandleInput = (rawHandle: string): string => {
    const base = (rawHandle || '').trim().toLowerCase();
    const withoutAt = base.startsWith('@') ? base.slice(1) : base;
    const cleaned = withoutAt.replace(/[^a-z0-9_-]/g, '');
    if (!cleaned) return '';
    return `@${cleaned}`;
  };

  const validateHandleInput = (rawHandle: string): string | null => {
    const normalized = normalizeHandleInput(rawHandle);
    if (!normalized) return 'Handle is required.';
    const core = normalized.slice(1);
    if (core.length < 3 || core.length > 21) {
      return 'Handle must be between 3 and 21 characters.';
    }
    if (!/^[a-z0-9_-]+$/.test(core)) {
      return 'Handle can only use letters, numbers, underscores and hyphens.';
    }
    return null;
  };

  const getZodiacSign = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries ♈";
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus ♉";
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini ♊";
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer ♋";
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo ♌";
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo ♍";
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra ♎";
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio ♏";
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius ♐";
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn ♑";
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius ♒";
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces ♓";
    return "";
  };

  const [resetState, setResetState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [uploadingField, setUploadingField] = useState<'avatar' | 'coverImage' | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set uploading state
    setUploadingField(field);
    
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      setUploadingField(null);
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, GIF, MP4');
      setUploadingField(null);
      return;
    }
    
    try {
      // Optimistic update
      const previewUrl = URL.createObjectURL(file);
      const isVideoFile = file.type.startsWith('video/') || file.name.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
      const type = isVideoFile ? 'video' : 'image';
      const typeProperty = field === 'avatar' ? 'avatarType' : 'coverType';

      setForm(prev => ({ 
        ...prev, 
        [field]: previewUrl, 
        [typeProperty]: type 
      }));

      // Upload file directly to S3
      console.log('Starting S3 upload...');
      
      const folder = field === 'avatar' ? 'avatars' : 'covers';
      const result = await uploadService.uploadFile(file, folder);
      
      // Update user in backend with new URL
      const keyProperty = field === 'avatar' ? 'avatarKey' : 'coverKey';
      const updates: Partial<User> = {
          [field]: result.url,
          [typeProperty]: type,
          [keyProperty]: result.key
      };

      const updateResult = await UserService.updateUser(currentUser.id, updates);
      
      if (updateResult.success && updateResult.user) {
        console.log('Upload successful:', updateResult.user);
        
        // Update form with real URL from backend
        setForm(prev => ({ 
          ...prev, 
          [field]: updateResult.user![field], 
          [typeProperty]: updateResult.user![typeProperty] 
        }));
        
        // Propagate update to parent
        onUpdate({
          [field]: updateResult.user![field],
          [typeProperty]: updateResult.user![typeProperty],
          [keyProperty]: updateResult.user![keyProperty as keyof User]
        });
      } else {
        throw new Error(updateResult.error || 'Upload failed');
      }
      
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed. Please try again.');
      // Revert optimistic update if needed, or handle error gracefully
    } finally {
      // Clear uploading state
      setUploadingField(null);
      e.target.value = ''; // Reset input
    }
  };

  const handlePasswordReset = () => {
    setResetState('sending');
    setTimeout(() => {
      setResetState('sent');
      setTimeout(() => setResetState('idle'), 5000);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const handleValidationMessage = validateHandleInput(form.handle);
    if (handleValidationMessage) {
      setHandleError(handleValidationMessage);
      return;
    }

    const normalizedHandle = normalizeHandleInput(form.handle);
    const originalNormalized = normalizeHandleInput(originalHandleRef.current || '');

    if (normalizedHandle !== originalNormalized && handleAvailable === false) {
      setHandleError('This handle is already taken. Please try another one.');
      return;
    }

    const finalForm = {
      ...form,
      handle: normalizedHandle || originalHandleRef.current,
      // Ensure we don't save blob URLs to the backend if the user clicks Save after a failed upload
      avatar: form.avatar?.startsWith('blob:') ? currentUser.avatar : form.avatar,
      coverImage: form.coverImage?.startsWith('blob:') ? currentUser.coverImage : form.coverImage
    };

    onUpdate(finalForm);
    onClose();
  };

  const renderPreview = (url: string, type: 'image' | 'video' | undefined, fallback: string, className: string, isAvatar: boolean = false) => {
    if (!url) return <div className={`${className} bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl`}>{fallback}</div>;
    
    const isVideo = type === 'video' || url.toLowerCase().match(/\.(mp4|webm|ogg|mov|gifv)$/) !== null;
    const objectClass = isAvatar ? 'object-contain bg-slate-50 dark:bg-slate-800' : 'object-cover';

    if (isVideo) {
      return (
        <video 
          key={`prev-video-${url}`}
          src={url} 
          className={`${className} ${objectClass} w-full h-full`} 
          autoPlay 
          loop 
          muted 
          playsInline 
          preload="auto"
          onError={(e) => console.error('Video error:', e)}
        />
      );
    }
    return (
      <img 
        key={`prev-img-${url}`}
        src={url} 
        className={`${className} ${objectClass} w-full h-full`} 
        alt="Preview" 
        loading="eager"
        onError={(e) => console.error('Image error:', e)}
      />
    );
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !requireCompletion) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, requireCompletion]);

  useEffect(() => {
    if (!form.handle.trim()) {
      setHandleAvailable(null);
      setHandleError(null);
      setIsCheckingHandle(false);
      return;
    }

    const normalized = normalizeHandleInput(form.handle);
    const originalNormalized = normalizeHandleInput(originalHandleRef.current || '');

    if (!normalized) {
      setHandleAvailable(false);
      setHandleError('Handle is required.');
      return;
    }

    if (normalized === originalNormalized) {
      setHandleAvailable(true);
      setHandleError(null);
      setIsCheckingHandle(false);
      return;
    }

    const validationMessage = validateHandleInput(form.handle);
    if (validationMessage) {
      setHandleAvailable(false);
      setHandleError(validationMessage);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsCheckingHandle(true);
        const response = await apiFetch('/auth/check-handle', {
          method: 'POST',
          body: JSON.stringify({ handle: normalized })
        });
        const data = await response.json().catch(() => ({} as any));

        if (!response.ok) {
          setHandleAvailable(false);
          setHandleError(data?.message || 'Failed to check handle.');
          return;
        }

        setHandleAvailable(!!data.available);
        setHandleError(!data.available ? 'This handle is already taken. Please try another one.' : null);
      } catch {
        setHandleAvailable(null);
      } finally {
        setIsCheckingHandle(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [form.handle]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !requireCompletion) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-10 shadow-2xl border border-slate-200/50 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Edit Profile</h2>
          {!requireCompletion && (
            <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-full hover:bg-rose-500 hover:text-white transition-all">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">Profile Photo (GIF/MP4/IMG)</label>
              <div 
                onClick={() => !uploadingField && avatarInputRef.current?.click()}
                className={`w-24 h-24 rounded-3xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-all shadow-inner relative group bg-slate-50 dark:bg-slate-800 ${uploadingField === 'avatar' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingField === 'avatar' ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-transparent animate-spin rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {renderPreview(form.avatar, form.avatarType as any, '📸', 'w-full h-full', true)}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest transition-opacity">Update</div>
                  </>
                )}
              </div>
              <input type="file" ref={avatarInputRef} hidden accept="image/*,video/*" onChange={e => handleFile(e, 'avatar')} />
            </div>
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block ml-1">Cover (GIF/MP4/IMG)</label>
              <div 
                onClick={() => !uploadingField && coverInputRef.current?.click()}
                className={`w-full h-24 rounded-3xl overflow-hidden cursor-pointer border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-400 transition-all shadow-inner relative group ${uploadingField === 'coverImage' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {uploadingField === 'coverImage' ? (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-3xl">
                    <div className="w-8 h-8 border-3 border-white/30 border-t-transparent animate-spin rounded-full"></div>
                  </div>
                ) : (
                  <>
                    {renderPreview(form.coverImage, form.coverType as any, '🏞️', 'w-full h-full', false)}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[9px] font-black uppercase tracking-widest transition-opacity">Update</div>
                  </>
                )}
              </div>
              <input type="file" ref={coverInputRef} hidden accept="image/*,video/*" onChange={e => handleFile(e, 'coverImage')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">First Name</label>
              <input
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
                value={form.firstName}
                onChange={e => setForm({...form, firstName: e.target.value})}
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Last Name</label>
              <input
                required
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
                value={form.lastName}
                onChange={e => setForm({...form, lastName: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Username (@)</label>
            <input
              required
              className={`w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border transition-all font-bold text-sm text-slate-900 dark:text-white ${
                handleAvailable === false
                  ? 'border-rose-400'
                  : handleAvailable === true
                  ? 'border-emerald-400'
                  : 'border-slate-100 dark:border-slate-700'
              }`}
              value={form.handle}
              onChange={e => {
                setForm({ ...form, handle: e.target.value });
                setHandleError(null);
              }}
            />
            <p className="mt-1 text-[9px] font-bold text-slate-500">
              3–21 characters. Letters, numbers, underscores and hyphens only.
              {form.handle && isCheckingHandle && (
                <span className="ml-1 text-slate-400">Checking availability...</span>
              )}
              {form.handle && handleAvailable === false && !isCheckingHandle && (
                <span className="ml-1 text-rose-500">Handle taken.</span>
              )}
              {form.handle && handleAvailable === true && !isCheckingHandle && normalizeHandleInput(form.handle) !== normalizeHandleInput(originalHandleRef.current || '') && (
                <span className="ml-1 text-emerald-500">Handle available.</span>
              )}
            </p>
            {handleError && (
              <p className="mt-1 text-[9px] font-bold text-rose-500">
                {handleError}
              </p>
            )}
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Email</label>
            <input
              type="email"
              readOnly
              className="w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 font-bold text-sm text-slate-900 dark:text-white cursor-not-allowed"
              value={currentUser.email || ''}
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Birthday</label>
            <input
              type="date"
              required
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
              value={form.dob}
              onChange={e => setForm({...form, dob: e.target.value})}
            />
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Country</label>
            <select
              required
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
              value={form.country}
              onChange={e => setForm({ ...form, country: e.target.value })}
            >
              <option value="">Select your country</option>
              {COUNTRIES.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Industry</label>
            <select
              required
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
              value={form.industry}
              onChange={e => setForm({ ...form, industry: e.target.value })}
            >
              <option value="">Select your industry</option>
              {INDUSTRIES.map(industry => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Biography</label>
            <textarea
              required
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm h-32 resize-none text-slate-900 dark:text-white"
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
              placeholder="Tell the network about yourself..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Company Name (optional)</label>
              <input
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
                value={form.companyName}
                onChange={e => setForm({ ...form, companyName: e.target.value })}
                placeholder="Only if you are opening a company profile"
              />
            </div>
            <div>
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Company Website (optional)</label>
              <input
                type="url"
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 focus:border-emerald-400 transition-all font-bold text-sm text-slate-900 dark:text-white"
                value={form.companyWebsite}
                onChange={e => setForm({ ...form, companyWebsite: e.target.value })}
                placeholder="https://your-company.com"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Private Profile</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Only acquaintances can see your posts.</p>
            </div>
            <button
              type="button"
              onClick={() => setForm({...form, isPrivate: !form.isPrivate})}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.isPrivate ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.isPrivate ? 'right-1' : 'left-1'}`}></div>
            </button>
          </div>

          <div className="pt-8 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-lg">🛡️</span> Security Protocol
            </h3>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-800/30 rounded-3xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-xs font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">Neural Password Reset</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Dispatch a secure identity recovery link to your registered email.</p>
              </div>
              
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetState !== 'idle'}
                className={`px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  resetState === 'idle' 
                    ? 'bg-slate-900 dark:bg-slate-700 text-white hover:bg-black dark:hover:bg-emerald-600 shadow-lg' 
                    : resetState === 'sending'
                    ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-wait'
                    : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                }`}
              >
                {resetState === 'idle' && 'Request Reset Link'}
                {resetState === 'sending' && 'Syncing...'}
                {resetState === 'sent' && 'Link Dispatched ✨'}
              </button>
            </div>
          </div>

          <button type="submit" className="w-full py-5 aura-bg-gradient text-white font-black uppercase rounded-2xl shadow-xl transition-all tracking-widest text-xs">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
