
import React, { useState, useRef } from 'react';
import { BusinessPage } from '../types';
import { INDUSTRIES, COUNTRIES } from '../constants';
import { uploadService } from '../services/upload';

interface CreateBusinessModalProps {
  onClose: () => void;
  onCreate: (data: Partial<BusinessPage>) => void;
}

const CreateBusinessModal: React.FC<CreateBusinessModalProps> = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    location: 'United States',
    industry: 'Technology & Software',
    employeeCount: 1,
    logo: '',
    logoType: 'image' as 'image' | 'video',
    coverImage: '',
    coverType: 'image' as 'image' | 'video'
  });
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
    const maxSizeBytes = 10 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Allowed: JPG, PNG, WEBP, MP4');
      e.target.value = '';
      return;
    }

    if (file.size > maxSizeBytes) {
      alert('File size must be less than 10MB');
      e.target.value = '';
      return;
    }

    try {
      const result = await uploadService.uploadFile(file);
      const type = result.mimetype.startsWith('video') ? 'video' : 'image';
      const typeProperty = field === 'logo' ? 'logoType' : 'coverType';

      setForm(prev => ({
        ...prev,
        [field]: result.url,
        [typeProperty]: type
      }));
    } catch (error) {
      console.error('Upload failed', error);
      alert('Upload failed');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(form);
  };

  const renderPreview = (url: string, type: 'image' | 'video', fallbackIcon: string) => {
    if (!url) return <span className="text-3xl opacity-30">{fallbackIcon}</span>;
    
    // Robust check
    const isVideo = type === 'video' || url.toLowerCase().includes('.mp4') || url.toLowerCase().includes('.mov');
    
    if (isVideo) {
      return (
        <video 
          key={url}
          src={url} 
          className="w-full h-full object-cover" 
          autoPlay 
          loop 
          muted 
          playsInline 
        />
      );
    }
    // img tag naturally supports GIFs
    return (
      <img 
        key={url}
        src={url} 
        className="w-full h-full object-cover" 
        alt="Preview" 
      />
    );
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[3rem] p-8 sm:p-12 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Create Business Page</h2>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest mt-1">Establish your business identity</p>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl hover:bg-rose-500 hover:text-white transition-all active:scale-90">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Business Identity</label>
              <input 
                required 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all shadow-inner" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                placeholder="e.g. Acme Corporation"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Industry Sector</label>
              <select 
                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all appearance-none cursor-pointer shadow-inner"
                value={form.industry}
                onChange={e => setForm({...form, industry: e.target.value})}
              >
                {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Headquarters Location</label>
            <select 
              required
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl outline-none font-bold text-sm text-slate-900 dark:text-white transition-all appearance-none cursor-pointer shadow-inner"
              value={form.location}
              onChange={e => setForm({...form, location: e.target.value})}
            >
              {COUNTRIES.map(country => <option key={country} value={country}>{country}</option>)}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Mission Manifesto</label>
            <textarea 
              required 
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-2xl h-32 outline-none font-medium text-sm text-slate-900 dark:text-white resize-none transition-all shadow-inner" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              placeholder="What is your business's core purpose?..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Logo (GIF/MP4/IMG)</label>
              <div 
                onClick={() => logoInputRef.current?.click()}
                className="w-32 h-32 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-all overflow-hidden shadow-inner group"
              >
                {renderPreview(form.logo, form.logoType, '📸')}
              </div>
              <input type="file" ref={logoInputRef} hidden accept="image/*,video/*" onChange={e => handleFile(e, 'logo')} />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 block ml-1">Cover (GIF/MP4/IMG)</label>
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="w-full h-32 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-all overflow-hidden shadow-inner"
              >
                {renderPreview(form.coverImage, form.coverType, '🏞️')}
              </div>
              <input type="file" ref={coverInputRef} hidden accept="image/*,video/*" onChange={e => handleFile(e, 'coverImage')} />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button type="button" onClick={onClose} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black uppercase rounded-3xl text-[10px] tracking-widest hover:bg-slate-200 transition-all active:scale-95">Cancel</button>
            <button type="submit" className="flex-1 py-5 aura-bg-gradient text-white font-black uppercase rounded-3xl text-[10px] tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all">Launch Page</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBusinessModal;
