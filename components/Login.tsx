import React, { useEffect, useState } from 'react';
import { APP_NAME, getApiBaseUrl } from '../constants';
import { User } from '../types';
import Logo from './Logo';

const API_BASE_URL = getApiBaseUrl();

// --- Logic Helpers (Preserved) ---

interface LoginProps {
  onLogin: (userData: any) => void;
  allUsers: User[];
}

type LoginMode =
  | 'login_selection'
  | 'login_manual'
  | 'forgot_password'
  | 'reset_success'
  | 'magic_link_request'
  | 'magic_link_sent';

const Login: React.FC<LoginProps> = ({ onLogin, allUsers }) => {
  // --- State (Preserved) ---
  const [mode, setMode] = useState<LoginMode>('login_selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState(new Date());

  const [formData, setFormData] = useState({
    email: ''
  });

  // --- Handlers (Preserved) ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleGoogleLogin = async () => {
    try {
      sessionStorage.setItem('oauth_in_progress', 'true');
    } catch { }
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email address.");
      return;
    }
    
    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email })
      });

      let data: any = null;
      try { data = await res.json(); } catch {}

      if (!res.ok || data?.success === false) {
        setError(data?.message || 'Failed to send link. Please try again.');
        return;
      }

      setMode('reset_success');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Carousel Logic (Preserved) ---
  const featureCards = [
    { title: 'Neural Broadcasts', tag: 'AI-CORE', value: 'ACTIVE' },
    { title: 'Global Reach', tag: 'NETWORK', value: '40+ REGIONS' },
    { title: 'Creator Graph', tag: 'DB_SIZE', value: '10k+ NODES' },
  ];

  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % featureCards.length);
      setTime(new Date());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // --- Styles ---
  const glassPanel = "bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-3xl overflow-hidden relative transition-all duration-500";
  const inputClasses = "w-full bg-slate-900/50 border border-slate-700/50 rounded-xl px-5 py-4 text-sm font-medium outline-none focus:bg-slate-900/80 focus:border-emerald-500/50 transition-all text-white placeholder-slate-500 backdrop-blur-sm";
  const labelClasses = "text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2 block ml-1";

  // UPDATED: "Squishy" Button Classes
  // Uses a hard shadow (shadow-[0_4px_0_...]) to create thickness
  // On active click, translates Y down and removes shadow to simulate pressing
  const socialButtonClasses = "w-full py-3.5 px-6 rounded-xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest transition-all duration-150 bg-slate-800 text-slate-300 shadow-[0_4px_0_0_#0f172a] hover:brightness-110 hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#0f172a] active:translate-y-[4px] active:shadow-none";

  const primaryButtonClasses = "w-full py-4 mt-2 bg-emerald-500 text-white font-black rounded-xl text-[11px] uppercase tracking-[0.25em] shadow-[0_4px_0_0_#047857] hover:brightness-110 hover:-translate-y-[2px] hover:shadow-[0_6px_0_0_#047857] transition-all duration-150 active:translate-y-[4px] active:shadow-none";

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 flex items-center justify-center p-4 md:p-6 relative overflow-hidden font-sans selection:bg-emerald-500/30">

      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-indigo-900/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-900/10 blur-[150px] rounded-full pointer-events-none" />

      {/* THE BENTO GRID CONTAINER */}
      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 grid-rows-[auto_auto_auto] md:grid-rows-2 gap-4 animate-in fade-in zoom-in duration-700">

        {/* --- TILE 1: LOGIN FORM --- */}
        <div className={`${glassPanel} md:col-span-5 md:row-span-2 p-8 flex flex-col justify-center order-2 md:order-2`}>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-purple-500 to-emerald-500 opacity-50"></div>

          <div className="mb-8">
            <Logo size="sm" className="mb-6 opacity-90" />
            <h1 className="text-2xl font-black text-white tracking-tight leading-none mb-2">
              WELCOME BACK
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Authenticate to access the neural layer.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-center backdrop-blur-md">
              {error}
            </div>
          )}

          {/* Login Modes */}
          {mode === 'login_selection' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <button onClick={() => setMode('magic_link_request')} className={`${socialButtonClasses} !bg-emerald-500 !text-white !shadow-[0_4px_0_0_#047857] hover:!shadow-[0_6px_0_0_#047857]`}>
                <span className="text-lg">✨</span> Send me a magic link
              </button>

              <div className="flex items-center gap-4 py-2 opacity-50">
                <div className="flex-1 h-px bg-slate-700"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-slate-700"></div>
              </div>

              <button onClick={handleGoogleLogin} disabled={isProcessing} className={socialButtonClasses}>
                <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" /></svg>
                Google
              </button>
              <button onClick={() => (window.location.href = `${API_BASE_URL}/auth/github`)} disabled={isProcessing} className={socialButtonClasses}>
                <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                Github
              </button>
            </div>
          )}

          {mode === 'magic_link_request' && (
            <form onSubmit={handleMagicLink} className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-white mb-2">Magic Link</h3>
              <p className="text-[11px] text-slate-400 mb-6">We'll send a secure login link to your registered comms.</p>
              <div className="space-y-4">
                <div>
                  <label className={labelClasses}>Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="email@domain.com"
                    className={inputClasses}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className={primaryButtonClasses}
                >
                  {isProcessing ? 'Sending...' : 'Send Magic Link'}
                </button>

                <button type="button" onClick={() => setMode('login_selection')} className="w-full text-center text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 hover:text-slate-300">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {mode === 'magic_link_sent' && (
            <div className="text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-emerald-500/30">✓</div>
              <p className="text-sm font-bold text-white mb-6">Check your email for a secure login link.</p>
      <button onClick={() => setMode('login_selection')} className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Return</button>
    </div>
  )}

          <div className="absolute bottom-4 left-0 w-full text-center">
            <p className="text-[9px] text-slate-600 font-medium">
              Protected by {APP_NAME} Guard v4.2
            </p>
          </div>
        </div>

        {/* --- TILE 2: VISUAL "MASCOT" --- */}
        <div className={`${glassPanel} md:col-span-7 md:row-span-1 min-h-[280px] p-8 flex flex-col justify-between order-1 md:order-1 group`}>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-tr from-emerald-500/30 via-purple-500/30 to-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-white/10 rounded-full animate-[spin_10s_linear_infinite]"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border border-emerald-500/20 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              System Online
            </div>
          </div>

          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tighter mb-2">
              Next Gen <br /> Orchestration.
            </h2>
            <p className="text-sm text-slate-400 max-w-sm">
              Connect your neural ad broadcasts to the global influence graph.
            </p>
          </div>
        </div>

        {/* --- TILE 3: SYSTEM STATUS --- */}
        <div className={`${glassPanel} md:col-span-4 md:row-span-1 p-6 flex flex-col justify-between order-3 md:order-3 hover:bg-white/10 cursor-default`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Current Node</p>
              <p className="text-lg font-bold text-white">Johannesburg</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Latency</p>
              <p className="text-lg font-bold text-emerald-400">12ms</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-purple-300 bg-purple-500/10 px-2 py-1 rounded">
                {featureCards[activeFeatureIndex].tag}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {featureCards[activeFeatureIndex].value}
              </span>
            </div>
            <p className="text-xs font-semibold text-white mt-2">{featureCards[activeFeatureIndex].title}</p>
          </div>
        </div>

        {/* --- TILE 4: TIME/WEATHER --- */}
        <div className={`${glassPanel} md:col-span-3 md:row-span-1 p-6 flex flex-col justify-center items-center text-center order-4 md:order-4 hover:bg-white/10`}>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Local Time</p>
          <h3 className="text-3xl font-black text-white tracking-tight">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </h3>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;