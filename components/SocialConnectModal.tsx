import React, { useState, useEffect } from 'react';

interface SocialConnectModalProps {
  provider: string;
  initialData: {
    firstName: string;
    lastName: string;
    email: string;
  };
  onConfirm: (data: { firstName: string; lastName: string; phone: string; dob: string }) => void;
  onCancel: () => void;
}

const SocialConnectModal: React.FC<SocialConnectModalProps> = ({ provider, initialData, onConfirm, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName,
    lastName: initialData.lastName,
    phone: '',
    dob: '',
    acceptedTerms: false
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.dob) {
      setError("All fields are required.");
      return;
    }
    if (!formData.acceptedTerms) {
      setError(`You must accept the terms and conditions of ${provider}.`);
      return;
    }
    onConfirm({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      dob: formData.dob
    });
  };

  const inputClasses = "w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all text-slate-900 dark:text-white placeholder-slate-400";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block ml-1";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-2">Connect with {provider}</h2>
        <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] text-center mb-8">Confirm your node details</p>
        
        {error && (
          <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClasses}>First Name</label>
              <input 
                value={formData.firstName} 
                onChange={e => setFormData({...formData, firstName: e.target.value})} 
                className={inputClasses} 
                required 
              />
            </div>
            <div>
              <label className={labelClasses}>Last Name</label>
              <input 
                value={formData.lastName} 
                onChange={e => setFormData({...formData, lastName: e.target.value})} 
                className={inputClasses} 
                required 
              />
            </div>
          </div>
          <div>
            <label className={labelClasses}>Cell Phone</label>
            <input 
              type="tel" 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              placeholder="+1 (555) 000-0000" 
              className={inputClasses} 
              required 
            />
          </div>
          <div>
            <label className={labelClasses}>Date of Birth</label>
            <input 
              type="date" 
              value={formData.dob} 
              onChange={e => setFormData({...formData, dob: e.target.value})} 
              className={inputClasses} 
              required 
            />
          </div>
          
          <div className="flex items-start gap-3 py-2">
            <input 
              type="checkbox" 
              id="terms" 
              checked={formData.acceptedTerms} 
              onChange={e => setFormData({...formData, acceptedTerms: e.target.checked})}
              className="mt-1 w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-slate-700 text-emerald-600 focus:ring-emerald-500/20 transition-all"
            />
            <label htmlFor="terms" className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-widest">
              I accept the terms and conditions of {provider} and Aura Network
            </label>
          </div>

          <button type="submit" className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4">
            Establish Acquaintance
          </button>
          <button type="button" onClick={onCancel} className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors">
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default SocialConnectModal;
