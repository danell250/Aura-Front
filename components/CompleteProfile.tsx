import React, { useEffect, useState } from 'react';
import Logo from './Logo';
import { INDUSTRIES } from '../constants';
import { apiFetch } from '../utils/api';

interface CompleteProfileProps {
  onComplete: (userData: any) => void;
}

const CompleteProfile: React.FC<CompleteProfileProps> = ({ onComplete }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bio, setBio] = useState('');
  const [industry, setIndustry] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [handle, setHandle] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState('');
  const [sourceLabel, setSourceLabel] = useState('OAuth');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [isCheckingHandle, setIsCheckingHandle] = useState(false);

  const normalizeHandleInput = (rawHandle: string): string => {
    const base = (rawHandle || '').trim().toLowerCase();
    const withoutAt = base.startsWith('@') ? base.slice(1) : base;
    const cleaned = withoutAt.replace(/[^a-z0-9_-]/g, '');
    if (!cleaned) return '';
    return `@${cleaned}`;
  };

  const validateHandleInput = (rawHandle: string): string | null => {
    const normalized = normalizeHandleInput(rawHandle);
    if (!normalized) return 'Please choose a handle.';
    const core = normalized.slice(1);
    if (core.length < 3 || core.length > 21) {
      return 'Handle must be between 3 and 21 characters.';
    }
    if (!/^[a-z0-9_-]+$/.test(core)) {
      return 'Handle can only use letters, numbers, underscores and hyphens.';
    }
    return null;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const source = params.get('source') || '';
    if (source.toLowerCase() === 'google') setSourceLabel('Google');
    else if (source.toLowerCase() === 'github') setSourceLabel('GitHub');

    const qpFirst = params.get('firstName') || '';
    const qpLast = params.get('lastName') || '';
    const qpName = params.get('name') || '';
    const qpEmail = params.get('email') || '';
    const qpAvatar = params.get('avatar') || '';

    if (qpFirst) setFirstName(qpFirst);
    if (qpLast) setLastName(qpLast);

    if (qpName) {
      setDisplayName(qpName);
      if (!qpFirst || !qpLast) {
        const parts = qpName.split(' ');
        if (!qpFirst && parts[0]) setFirstName(parts[0]);
        if (!qpLast && parts.length > 1) setLastName(parts.slice(1).join(' '));
      }
    } else if (qpFirst || qpLast) {
      const combined = `${qpFirst} ${qpLast}`.trim();
      if (combined) setDisplayName(combined);
    }

    if (qpEmail) setEmail(qpEmail);
    if (qpAvatar) setAvatar(qpAvatar);
  }, []);

  useEffect(() => {
    if (!handle.trim()) {
      setHandleAvailable(null);
      setIsCheckingHandle(false);
      return;
    }

    const timeoutId = window.setTimeout(async () => {
      const validationMessage = validateHandleInput(handle);
      if (validationMessage) {
        setHandleAvailable(false);
        return;
      }

      const normalizedHandle = normalizeHandleInput(handle);
      if (!normalizedHandle) {
        setHandleAvailable(false);
        return;
      }

      try {
        setIsCheckingHandle(true);
        const response = await apiFetch('/auth/check-handle', {
          method: 'POST',
          body: JSON.stringify({ handle: normalizedHandle })
        });
        const data = await response.json().catch(() => ({} as any));

        if (!response.ok) {
          setHandleAvailable(false);
          return;
        }

        setHandleAvailable(!!data.available);
      } catch {
        setHandleAvailable(null);
      } finally {
        setIsCheckingHandle(false);
      }
    }, 400);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [handle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required.');
      return;
    }

    const validationMessage = validateHandleInput(handle);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    if (handleAvailable === false) {
      setError('This handle is already taken. Please try another one.');
      return;
    }

    const normalizedHandle = normalizeHandleInput(handle);

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch('/auth/complete-oauth-profile', {
        method: 'POST',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio.trim(),
          industry: industry || 'Other',
          companyName: companyName.trim(),
          handle: normalizedHandle
        })
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok || !data?.success) {
        setError(data?.message || 'Failed to complete profile. Please try again.');
        return;
      }

      // Token is handled via cookies now
      // if (data.token) {
      //   localStorage.setItem('aura_auth_token', data.token);
      // }

      onComplete(data.user || {});
    } catch (err: any) {
      setError(err?.message || 'Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 sm:px-6 py-6 relative overflow-hidden">
      <div className="absolute -top-40 right-[-10%] w-[60%] h-[60%] bg-emerald-500/30 blur-[140px] -z-10" />
      <div className="absolute bottom-[-30%] left-[-10%] w-[55%] h-[55%] bg-sky-500/25 blur-[140px] -z-10" />
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-purple-500/25 blur-[120px] rounded-full" />
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-emerald-400/25 blur-[110px] rounded-full" />
      </div>

      <div className="w-full max-w-3xl relative">
        <div className="mb-8 flex items-center justify-center">
          <Logo size="md" />
        </div>

        <div className="p-[2px] rounded-[3rem] aura-bg-gradient shadow-[0_40px_100px_-24px_rgba(15,23,42,0.75)]">
          <div className="bg-slate-950/80 backdrop-blur-2xl rounded-[3rem] p-8 md:p-10 border border-white/10">
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="md:w-1/3 flex flex-col items-center text-center md:text-left">
                <div className="w-24 h-24 rounded-3xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden mb-4">
                  {avatar ? (
                    <img src={avatar} alt={displayName || 'Avatar'} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">✨</span>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-400">
                    {sourceLabel} Linked
                  </p>
                  <p className="text-lg font-black text-white">
                    {displayName || 'New Aura Member'}
                  </p>
                  {email && (
                    <p className="text-[11px] font-medium text-slate-400 break-all">
                      {email}
                    </p>
                  )}
                </div>
                <p className="mt-4 text-[11px] font-semibold text-slate-400 leading-relaxed max-w-xs">
                  Add a short bio and industry so your profile feels ready on day one.
                </p>
              </div>

              <div className="md:flex-1">
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-[0.25em] text-white mb-6 text-center md:text-left">
                  Complete Your Aura Profile
                </h1>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                        First Name
                      </label>
                      <input
                        required
                        value={firstName}
                        onChange={e => {
                          setFirstName(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                        Last Name
                      </label>
                      <input
                        required
                        value={lastName}
                        onChange={e => {
                          setLastName(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      Handle
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-slate-400 select-none">
                        @
                      </span>
                      <input
                        required
                        value={handle}
                        onChange={e => {
                          setHandle(e.target.value);
                          if (error) setError(null);
                        }}
                        className={`flex-1 px-4 py-3.5 rounded-2xl bg-slate-900 border text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-emerald-500/30 ${
                          handleAvailable === false
                            ? 'border-rose-500'
                            : handleAvailable === true
                            ? 'border-emerald-400'
                            : 'border-slate-700'
                        }`}
                        placeholder="yourname"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const baseName = (firstName || lastName || displayName || 'auramember')
                            .toLowerCase()
                            .replace(/[^a-z0-9]/g, '');
                          let core = baseName || 'auramember';
                          if (core.length < 3) core = `${core}user`;
                          core = core.slice(0, 15);
                          const suffix = Math.floor(100 + Math.random() * 900);
                          const suggestion = `${core}${suffix}`.slice(0, 21);
                          setHandle(suggestion);
                          if (error) setError(null);
                        }}
                        className="px-3 py-2 rounded-2xl bg-slate-800 border border-slate-700 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        🎲 Random
                      </button>
                    </div>
                    <p className="mt-1 text-[10px] font-medium text-slate-500">
                      3–21 characters. Letters, numbers, underscores and hyphens only.
                      {handle && handleAvailable === false && !isCheckingHandle && (
                        <span className="ml-1 text-rose-400 font-semibold">Handle taken.</span>
                      )}
                      {handle && handleAvailable === true && (
                        <span className="ml-1 text-emerald-400 font-semibold">Handle available.</span>
                      )}
                      {isCheckingHandle && (
                        <span className="ml-1 text-slate-400 font-semibold">Checking availability...</span>
                      )}
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                      Bio
                    </label>
                    <textarea
                      required
                      value={bio}
                      onChange={e => {
                        setBio(e.target.value);
                        if (error) setError(null);
                      }}
                      rows={4}
                      className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30 resize-none"
                      placeholder="Tell the network what you do and what you are here for."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                        Industry
                      </label>
                      <select
                        required
                        value={industry}
                        onChange={e => {
                          setIndustry(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                      >
                        <option value="">Select your industry</option>
                        {INDUSTRIES.map(option => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">
                        Company Name (optional)
                      </label>
                      <input
                        value={companyName}
                        onChange={e => {
                          setCompanyName(e.target.value);
                          if (error) setError(null);
                        }}
                        className="w-full px-4 py-3.5 rounded-2xl bg-slate-900 border border-slate-700 text-sm font-semibold text-white outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/30"
                        placeholder="Only if you are opening a company profile"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/40 rounded-2xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 rounded-2xl aura-bg-gradient text-white font-black uppercase tracking-[0.25em] text-[11px] shadow-xl hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Syncing Profile...' : 'Enter Aura'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
