import React, { useEffect, useState } from 'react';
import { APP_NAME, getApiBaseUrl } from '../constants';
import { User } from '../types';
import Logo from './Logo';

const API_BASE_URL = getApiBaseUrl();

const loginWithEmailAndPassword = async (identifier: string, password: string) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ identifier, password })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, user: null, error: data.message || 'Login failed' };
    }
    return { success: true, user: data.user, token: data.token };
  } catch (err: any) {
    return { success: false, user: null, error: err.message || 'Network error' };
  }
};

interface LoginProps {
  onLogin: (userData: any) => void;
  allUsers: User[];
}

type LoginMode =
  | 'login_selection'
  | 'login_manual'
  | 'forgot_password'
  | 'reset_success';

const Login: React.FC<LoginProps> = ({ onLogin, allUsers }) => {
  const [mode, setMode] = useState<LoginMode>('login_selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isCapsLockOn, setIsCapsLockOn] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    email: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const simulateProcess = (callback: () => void) => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      callback();
    }, 1200);
  };

  const handleGoogleLogin = async () => {
    try {
      sessionStorage.setItem('oauth_in_progress', 'true');
    } catch {
    }
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setError("Credentials required to log in.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const loginResult = await loginWithEmailAndPassword(
        formData.identifier, // Treat identifier as email for now
        formData.password
      );

      if (loginResult.success) {
        // Update user context
        if (loginResult.token) {
          localStorage.setItem('aura_auth_token', loginResult.token);
        }
        onLogin(loginResult.user);
      } else {
        setError(loginResult.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleForgotPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email) {
      setError("Please enter your email address.");
      return;
    }
    simulateProcess(() => {
      setMode('reset_success');
    });
  };

  const handlePasswordKeyEvent = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (typeof e.getModifierState === 'function') {
      const caps = e.getModifierState('CapsLock');
      setIsCapsLockOn(caps);
    }
  };

  const inputClasses = "w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all text-slate-900 dark:text-white placeholder-slate-400";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block ml-1";
  const socialButtonClasses = "w-full py-4 px-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:border-emerald-200 dark:hover:border-emerald-500 transition-all active:scale-95 shadow-sm mb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900";

  const featureCards = [
    {
      title: 'Neural Ad Broadcasts',
      description: 'Spin up synchronized campaigns that feel 1:1 at global scale.',
      tag: 'AI-ORCHESTRATED',
      accent: 'from-emerald-500/20 via-emerald-400/10 to-transparent'
    },
    {
      title: 'Influence Marketplace',
      description: 'Match with aligned creators and brands in a single dashboard.',
      tag: 'CREATOR GRAPH',
      accent: 'from-purple-500/20 via-purple-400/10 to-transparent'
    },
    {
      title: 'Premium Credits',
      description: 'Route spend into boosts, retargeting and time-locked capsules.',
      tag: 'AURA CREDITS',
      accent: 'from-amber-500/20 via-amber-400/10 to-transparent'
    },
    {
      title: 'Global Reach',
      description: 'Ship stories into 40+ regions with smart pacing and caps.',
      tag: 'WORLDWIDE',
      accent: 'from-sky-500/20 via-sky-400/10 to-transparent'
    },
    {
      title: '10,000+ Creators',
      description: 'Active partners across niches delivering consistent growth.',
      tag: 'SOCIAL PROOF',
      accent: 'from-pink-500/20 via-pink-400/10 to-transparent'
    },
    {
      title: '$5,000+/m Earnings',
      description: 'Top creators sustain recurring earnings using Aura routing.',
      tag: 'RESULTS',
      accent: 'from-indigo-500/20 via-indigo-400/10 to-transparent'
    }
  ];

  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex(prev => (prev + 1) % featureCards.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4 sm:px-6 py-4 md:py-6 relative overflow-hidden transition-colors">
      <div className="absolute -top-40 right-[-10%] w-[60%] h-[60%] bg-emerald-500/30 blur-[140px] -z-10"></div>
      <div className="absolute bottom-[-30%] left-[-10%] w-[55%] h-[55%] bg-sky-500/25 blur-[140px] -z-10"></div>
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute top-10 left-1/4 w-72 h-72 bg-purple-500/25 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-10 right-1/4 w-64 h-64 bg-emerald-400/25 blur-[110px] rounded-full"></div>
      </div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-stretch gap-6 lg:gap-10 animate-in fade-in zoom-in duration-700">
        <div className="hidden lg:flex flex-col flex-[1.1] bg-slate-900/80 backdrop-blur-3xl text-white rounded-[2.75rem] p-6 xl:p-8 relative overflow-hidden border border-slate-700/80 shadow-[0_40px_120px_-24px_rgba(15,23,42,0.95)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-24 w-80 h-80 bg-emerald-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-16 w-96 h-96 bg-purple-500/25 rounded-full blur-3xl" />
          </div>
          <div className="relative flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Logo size="sm" />
            </div>
          </div>

          <div className="relative mb-4">
            <h2 className="text-2xl xl:text-3xl font-black tracking-tight leading-snug mb-3">
              Orchestrate campaigns that sound human,
              <span className="text-emerald-300"> even at scale.</span>
            </h2>
            <p className="text-[11px] xl:text-[12px] text-slate-300 font-medium leading-relaxed">
              Aura stacks neural broadcasts, creator signals and premium credits into one operating layer for your social reach.
            </p>
          </div>

          <div className="relative grid grid-cols-2 gap-3 mb-4">
            {featureCards.map((feature, index) => {
              const isActive = index === activeFeatureIndex;
              return (
                <button
                  key={feature.title}
                  type="button"
                  onClick={() => setActiveFeatureIndex(index)}
                  className={[
                    "group relative text-left rounded-2xl border px-4 py-3 transition-all duration-300 overflow-hidden will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900",
                    isActive
                      ? "border-emerald-400/80 bg-gradient-to-br from-emerald-500/15 via-emerald-400/10 to-transparent shadow-[0_22px_60px_-22px_rgba(16,185,129,0.9)] scale-[1.02]"
                      : "border-white/5 bg-white/0 hover:border-emerald-300/70 hover:bg-white/5 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-22px_rgba(15,23,42,0.9)]"
                  ].join(" ")}
                >
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br ${feature.accent}`} />
                  <div className="relative flex flex-col gap-1">
                    <span className={`text-[9px] font-black uppercase tracking-[0.28em] ${isActive ? "text-emerald-200" : "text-slate-400"}`}>
                      {feature.tag}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {feature.title}
                    </span>
                    <span className="text-[11px] text-slate-300 leading-snug">
                      {feature.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 mt-1">
            <div className="rounded-2xl border border-emerald-400/70 bg-gradient-to-br from-emerald-500/10 via-emerald-400/5 to-transparent shadow-[0_18px_45px_-18px_rgba(16,185,129,0.8)] transition-all p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] text-emerald-200 mb-1">Ad Plans</p>
              <p className="text-[11px] text-slate-100 font-semibold mb-1">Starter • Growth • Enterprise</p>
              <p className="text-[11px] text-slate-300 leading-snug">
                Scale from smart 100k tests to global pacing with safety rules baked in.
              </p>
            </div>
            <div className="rounded-2xl bg-slate-950/70 border border-slate-700/80 p-4 transition-all">
              <p className="text-[9px] font-black uppercase tracking-[0.32em] text-slate-300 mb-1">Aura Credits & Benefits</p>
              <p className="text-[11px] text-slate-200 mb-1">Boosts, retargeting, and time-locked capsules.</p>
              <p className="text-[11px] text-slate-400 leading-snug">
                Route spend into outcomes, align with creators, and keep pacing compliant.
              </p>
            </div>
          </div>
        </div>
        <div className="w-full max-w-md mx-auto lg:max-w-none lg:flex-[0.9]">
          <div className="text-center mb-8 lg:mb-10 lg:hidden">
            <Logo size="lg" className="mb-4" />
          </div>

          <div className="p-[2px] rounded-[3rem] aura-bg-gradient transition-all duration-500 hover:shadow-[0_70px_140px_-26px_rgba(0,0,0,0.35)] hover:brightness-110 hover:-translate-y-1 will-change-transform">
            <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-3xl supports-[backdrop-filter]:backdrop-blur-3xl rounded-[3rem] shadow-[0_40px_100px_-24px_rgba(15,23,42,0.45)] dark:shadow-[0_40px_110px_-28px_rgba(0,0,0,0.9)] border border-white/60 dark:border-slate-700 p-6 md:p-8 relative overflow-hidden transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-2 aura-bg-gradient"></div>
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-400/18 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-28 -left-24 w-72 h-72 bg-sky-400/18 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute inset-0 opacity-40 pointer-events-none">
                <div className="absolute top-12 -left-10 w-32 h-32 bg-emerald-300/25 blur-2xl rounded-full"></div>
                <div className="absolute bottom-6 -right-8 w-28 h-28 bg-sky-300/25 blur-2xl rounded-full"></div>
              </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {mode === 'login_selection' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-6">Log in to {APP_NAME}</h2>

              <button
                onClick={() => setMode('login_manual')}
                className={`${socialButtonClasses} !bg-slate-900 dark:!bg-emerald-600 !text-white !border-none shadow-xl shadow-slate-900/20 dark:shadow-emerald-900/20 mb-6`}
              >
                <span className="text-lg">📧</span> Use Email / Username
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Or login with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="space-y-3">
                <button onClick={handleGoogleLogin} disabled={isProcessing} className={socialButtonClasses}>
                  <svg className="w-5 h-5" viewBox="0 0 48 48">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                  </svg>
                  {isProcessing ? 'Connecting...' : 'Continue with Google'}
                </button>
                <button
                  onClick={() => (window.location.href = `${API_BASE_URL}/auth/github`)}
                  disabled={isProcessing}
                  className={socialButtonClasses}
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                    <path d="M12 .5A11.5 11.5 0 0 0 .5 12c0 5.08 3.29 9.38 7.86 10.9.58.1.8-.25.8-.56v-2.1c-3.2.7-3.88-1.38-3.88-1.38-.53-1.36-1.3-1.72-1.3-1.72-1.07-.73.08-.72.08-.72 1.18.08 1.8 1.22 1.8 1.22 1.05 1.8 2.75 1.28 3.42.98.1-.77.41-1.28.74-1.58-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.04 0 0 .97-.31 3.17 1.18.93-.26 1.93-.39 2.93-.39s2 .13 2.93.39c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.75.81 1.2 1.84 1.2 3.1 0 4.41-2.7 5.38-5.27 5.67.42.36.79 1.08.79 2.18v3.24c0 .31.22.67.81.56A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
                  </svg>
                  {isProcessing ? 'Connecting...' : 'Continue with GitHub'}
                </button>
              </div>

              <div className="mt-8 text-center pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                  By logging in, you agree to Aura's{' '}
                  <a
                    href="/terms"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-colors"
                  >
                    Terms & Conditions
                  </a>
                  {' '}and{' '}
                  <a
                    href="/privacy"
                    className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-colors"
                  >
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          )}

          {mode === 'login_manual' && (
            <form onSubmit={handleManualLogin} className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-6">Secure Login</h3>
              <div className="space-y-5">
                <div className="relative">
                  <label className={labelClasses}>Email or Username</label>
                  <svg className="absolute left-4 top-[50%] translate-y-[-25%] w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none">
                    <path d="M12 12c2.761 0 5-2.239 5-5s-2.239-5-5-5-5 2.239-5 5 2.239 5 5 5Z" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M3 20.5c0-3.59 3.582-6.5 9-6.5s9 2.91 9 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <input
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    placeholder="e.g. @alex or alex@example.com"
                    className={`${inputClasses} pl-12`}
                    required
                  />
                </div>
                <div className="relative">
                  <div className="flex justify-between items-center mb-2 mr-1">
                    <label className={labelClasses}>Password</label>
                    <button
                      type="button"
                      onClick={() => setMode('forgot_password')}
                      className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline transition-colors"
                    >
                      Forgot?
                    </button>
                  </div>
                  <svg className="absolute left-4 top-[52%] -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" viewBox="0 0 24 24" fill="none">
                    <path d="M12 5c-7 0-9 7-9 7s2 7 9 7 9-7 9-7-2-7-9-7Z" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyDown={handlePasswordKeyEvent}
                    onKeyUp={handlePasswordKeyEvent}
                    onBlur={() => setIsCapsLockOn(false)}
                    placeholder="••••••••"
                    className={`${inputClasses} pl-12 pr-12`}
                    required
                  />
                  {isCapsLockOn && (
                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-500">
                      Caps Lock is on
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-[52%] -translate-y-1/2 w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:border-emerald-300 dark:hover:border-emerald-500 transition-all active:scale-95"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M2 12s2-7 10-7 10 7 10 7-2 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M15.5 12a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <path d="M17.94 17.94C16.18 19.02 14.2 19.7 12 19.7 5 19.7 2 12 2 12c.73-1.74 1.77-3.28 3.06-4.59M21.94 12.94c-.73 1.74-1.77 3.28-3.06 4.59M9.88 9.88a3 3 0 1 0 4.24 4.24" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-[0_24px_70px_-26px_rgba(16,185,129,0.95)] hover:brightness-110 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-300 mt-4 will-change-transform"
                >
                  {isProcessing ? 'Launching...' : 'Launch Broadcast'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login_selection')}
                  className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Options
                </button>

                {/* Terms & Conditions and Privacy Policy */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                  <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed">
                    By logging in, you agree to Aura's{' '}
                    <a
                      href="/terms"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-colors"
                    >
                      Terms & Conditions
                    </a>
                    {' '}and{' '}
                    <a
                      href="/privacy"
                      className="text-emerald-600 dark:text-emerald-400 hover:underline underline-offset-4 transition-colors"
                    >
                      Privacy Policy
                    </a>
                    .
                  </p>
                </div>
              </div>
            </form>
          )}

          {mode === 'forgot_password' && (
            <form onSubmit={handleForgotPassword} className="animate-in fade-in duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-4">Reset Password</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-10 leading-relaxed">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="space-y-6">
                <div>
                  <label className={labelClasses}>Registration Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="recovery@example.com"
                    className={inputClasses}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  {isProcessing ? 'Sending...' : 'Send Link'}
                </button>
                <button
                  type="button"
                  onClick={() => setMode('login_manual')}
                  className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Login
                </button>
              </div>
            </form>
          )}

          {mode === 'reset_success' && (
            <div className="text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/20 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-emerald-100 dark:border-emerald-800">✅</div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-4">Recovery Sent</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-10 leading-relaxed">
                Check your inbox. A reset link has been dispatched to {formData.email}.
              </p>
              <button
                onClick={() => setMode('login_manual')}
                className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
              >
                Return to Login
              </button>
            </div>
          )}
        </div>
        </div>
        </div>

      <p className="absolute bottom-3 inset-x-0 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] animate-pulse">{APP_NAME} © 2025</p>
      </div>

      </div>
  );
};

export default Login;
