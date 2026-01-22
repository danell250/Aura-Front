import React, { useEffect, useState } from 'react';
import { APP_NAME, getApiBaseUrl } from '../constants';
import { User } from '../types';
import Logo from './Logo';

const API_BASE_URL = getApiBaseUrl();

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
  const [mode, setMode] = useState<LoginMode>('login_selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [time, setTime] = useState(new Date());

  const [formData, setFormData] = useState({ email: '' });

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
      setError('Please enter your email address.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.email }),
      });

      let data: any = null;
      try { data = await res.json(); } catch { }

      if (!res.ok || data?.success === false) {
        setError(data?.message || 'Failed to send link. Please try again.');
        return;
      }

      setMode('magic_link_sent');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const slides = [
    '/images/slideshow/Image 2026-01-22 at 20.34.png',
    '/images/slideshow/Image 2026-01-22 at 20.50.png',
    '/images/slideshow/Image 2026-01-22 at 20.58.png',
    '/images/slideshow/Image 2026-01-22 at 20.27.png',
    '/images/slideshow/Image 2026-01-22 at 20.30.png',

  ];

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
      setTime(new Date());
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Aura token-based styles (works in light + dark)
  const page = `
    min-h-screen
    bg-[rgb(var(--bg))]
    text-[rgb(var(--text))]
    dark:bg-[rgb(var(--bg-dark))]
    dark:text-[rgb(var(--text-dark))]
    flex items-center justify-center
    p-4 md:p-6
    relative overflow-hidden
    font-sans
    selection:bg-[rgb(var(--aura)/0.25)]
  `;

  const glassPanel = `
    bg-[rgb(var(--panel))]
    dark:bg-[rgb(var(--panel-dark)/0.60)]
    backdrop-blur-2xl
    border border-slate-200/80 dark:border-white/10
    shadow-[0_18px_50px_rgba(0,0,0,0.12)]
    rounded-3xl
    overflow-hidden
    relative
    transition-all duration-500
  `;

  const labelClasses = `
    text-[10px] font-black uppercase tracking-widest
    text-slate-500 dark:text-slate-400
    mb-2 block ml-1
  `;

  const inputClasses = `
    w-full
    bg-white dark:bg-slate-900/55
    border border-slate-200 dark:border-slate-700/50
    rounded-xl
    px-5 py-4
    text-sm font-medium
    text-slate-900 dark:text-white
    placeholder-slate-400 dark:placeholder-slate-500
    outline-none
    transition-all
    focus:border-[rgb(var(--aura))]
    focus:ring-2 focus:ring-[rgb(var(--aura)/0.25)]
  `;

  const socialButtonClasses = `
    w-full py-3.5 px-6 rounded-xl
    flex items-center justify-center gap-4
    text-[11px] font-black uppercase tracking-widest
    transition-all duration-150

    bg-emerald-500
    text-white
    border border-emerald-400
    shadow-[0_10px_24px_rgba(16,185,129,0.25)]

    hover:brightness-110
    hover:-translate-y-[2px]
    hover:shadow-[0_18px_40px_rgba(16,185,129,0.35)]
    active:translate-y-[1px]
  `;

  const googleButtonClasses = `
  w-full py-3.5 px-6 rounded-xl
  flex items-center justify-center gap-3
  text-[12px] font-semibold
  bg-white text-slate-800
  border border-slate-200
  shadow-sm
  hover:bg-slate-50 hover:-translate-y-[1px]
  active:translate-y-0
  transition-all duration-150
`;


  const primaryButtonClasses = `
    w-full py-4 mt-2 rounded-xl
    bg-emerald-500
    text-white
    text-[11px] font-black uppercase tracking-[0.25em]
    shadow-[0_14px_30px_rgba(16,185,129,0.25)]
    hover:brightness-110 hover:-translate-y-[2px]
    active:translate-y-[1px]
    transition-all duration-150
  `;

  return (
    <div className={page}>
      {/* Background Ambience */}
      <div className="absolute top-[-25%] left-[-15%] w-[70%] h-[70%] bg-[rgb(var(--aura)/0.12)] blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-25%] right-[-15%] w-[65%] h-[65%] bg-indigo-500/10 blur-[160px] rounded-full pointer-events-none" />

      <div className="w-full max-w-[1100px] grid grid-cols-1 md:grid-cols-12 grid-rows-[auto_auto_auto] md:grid-rows-2 gap-5 animate-in fade-in zoom-in duration-700">
        {/* TILE 1: LOGIN FORM */}
        <div
          className={`
    ${glassPanel}
    md:col-span-5 md:row-span-2
    p-6 md:p-7
    flex flex-col
    order-2 md:order-2
    md:self-start
    md:max-h-[520px]
    mt-6 md:mt-20
    disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0

  `}
        >


          {/* Aura top accent */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[rgb(var(--aura))] via-purple-500 to-[rgb(var(--aura))] opacity-90" />
          <div className="absolute inset-0 rounded-3xl ring-1 ring-[rgb(var(--aura)/0.10)] pointer-events-none" />

          <div className="mb-5 flex flex-col items-center text-center">
            <h1 className="text-2xl font-black tracking-tight leading-none mb-2 text-[#0B1F3A] dark:text-slate-100">
              Welcome Back
            </h1>

          </div>

          {error && (
            <div className="mb-6 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest text-center backdrop-blur-md">
              {error}
            </div>
          )}

          {mode === 'login_selection' && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
              <button onClick={() => setMode('magic_link_request')} className={primaryButtonClasses}>
                <span className="text-lg mr-2">✨</span> Send me a magic link
              </button>

              <div className="flex items-center gap-4 py-1 opacity-70">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Or</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
              </div>

              <button onClick={handleGoogleLogin} disabled={isProcessing} className={googleButtonClasses}>
                <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.62l6.86-6.86C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.02 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.5 24.5c0-1.64-.15-3.22-.43-4.75H24v9.01h12.7c-.55 2.97-2.2 5.48-4.7 7.18l7.19 5.58c4.2-3.88 6.31-9.6 6.31-17.02z" />
                  <path fill="#FBBC05" d="M10.54 28.59c-.49-1.47-.77-3.04-.77-4.59s.28-3.12.77-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.98-6.19z" />
                  <path fill="#34A853" d="M24 48c6.47 0 11.9-2.13 15.86-5.78l-7.19-5.58c-2 1.35-4.56 2.15-8.67 2.15-6.26 0-11.57-3.52-13.46-8.41l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continue with Google
              </button>


              <button
                onClick={() => (window.location.href = `${API_BASE_URL}/auth/github`)}
                disabled={isProcessing}
                className={socialButtonClasses}
              >
                <svg className="w-4 h-4 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
                </svg>
                Github
              </button>
            </div>
          )}

          {mode === 'magic_link_request' && (
            <form onSubmit={handleMagicLink} className="animate-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Magic Link</h3>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mb-6">
                We'll send a secure login link to your registered comms.
              </p>

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

                <button type="submit" disabled={isProcessing} className={primaryButtonClasses}>
                  {isProcessing ? 'Sending...' : 'Send Magic Link'}
                </button>

                <button
                  type="button"
                  onClick={() => setMode('login_selection')}
                  className="w-full text-center text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {mode === 'magic_link_sent' && (
            <div className="text-center animate-in zoom-in">
              <div className="w-16 h-16 bg-[rgb(var(--aura)/0.12)] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 border border-[rgb(var(--aura)/0.25)]">
                ✓
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-6">
                Check your email for a secure login link.
              </p>
              <button
                onClick={() => setMode('login_selection')}
                className="text-xs text-[rgb(var(--aura))] font-black uppercase tracking-widest hover:brightness-110"
              >
                Return
              </button>
            </div>
          )}

          <div className="absolute bottom-4 left-0 w-full text-center">
            <p className="text-[9px] text-slate-500 dark:text-slate-600 font-medium">
              Protected by {APP_NAME} Guard v4.2
            </p>
          </div>
        </div>

        {/* TILE 2: LOGO BANNER */}
        <div className="
  md:col-span-7 md:row-span-1
  h-[200px] md:h-[140px]
  relative overflow-hidden
  order-1 md:order-1
  rounded-3xl
  bg-white dark:bg-white/5
  flex items-center justify-center
">
          <img
            src="/images/slideshow/Image 2026-01-22 at 19.26.png"
            alt="Aura Social - Connect & Radiate"
            className="max-h-[60px] md:max-h-[150px] w-auto object-contain"
          />
        </div>


        {/* TILE 3: SLIDESHOW (moved up + sized) */}
        <div
          className="
  md:col-span-7
  md:row-span-2
  md:row-start-2
  relative overflow-hidden
  order-3 md:order-3
  rounded-3xl
  bg-white dark:bg-white/5
 + -mt-[10px] md:-mt-[115px] h-[320px] md:h-[420px]
"
        >
          {/* Slides */}
          {slides.map((slide, index) => (
            <div
              key={slide}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
            >
              <img
                src={slide}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover object-center"
                draggable={false}
              />

              {/* Optional: subtle readability overlay */}
            </div>
          ))}

          {/* Dots (optional) */}
          <div className="absolute bottom-5 left-6 right-6 z-10 flex items-center justify-between">
            

            <div className="flex gap-1.5">
              {slides.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-6 bg-white' : 'w-2 bg-white/50'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>



        
       
        
      </div>
    </div>
  );
};

export default Login;
