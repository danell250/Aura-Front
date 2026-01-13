import React, { useState } from 'react';
import { APP_NAME } from '../constants';
import { User } from '../types';
import Logo from './Logo';
import { auth, googleProvider, signInWithPopup } from '../../services/firebase';

// Mock authentication functions
const authenticateWithGoogle = async (userData: any) => {
  // This would typically integrate with Firebase Google auth
  console.warn('authenticateWithGoogle is mocked for TypeScript compatibility');
  return { success: false, user: userData, error: 'AuthService not implemented' };
};

const loginWithEmailAndPassword = async (email: string, password: string) => {
  // This would typically integrate with Firebase email/password auth
  console.warn('loginWithEmailAndPassword is mocked for TypeScript compatibility');
  return { success: false, user: null, error: 'AuthService not implemented' };
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
    setIsProcessing(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const googleAuthResult = await authenticateWithGoogle({
        googleId: user.uid,
        email: user.email!,
        name: user.displayName!,
        picture: user.photoURL || undefined,
      });
      
      if (googleAuthResult.success) {
        // Update user context
        onLogin(googleAuthResult.user);
      } else {
        setError(googleAuthResult.error || 'Failed to authenticate with Google');
      }
    } catch (err: any) {
      console.error("Google Auth Error:", err);
      setError(err.message || "Failed to authenticate with Google");
    } finally {
      setIsProcessing(false);
    }
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

  const inputClasses = "w-full bg-slate-100 dark:bg-slate-800 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-semibold outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-400 transition-all text-slate-900 dark:text-white placeholder-slate-400";
  const labelClasses = "text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block ml-1";
  const socialButtonClasses = "w-full py-4 px-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-200 hover:border-emerald-200 dark:hover:border-emerald-500 transition-all active:scale-95 shadow-sm mb-3";

  return (
    <div className="min-h-screen bg-[#FDFDFF] dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden transition-colors">
      <div className="absolute top-[-10%] right-[-5%] w-[60%] h-[60%] bg-emerald-100/30 dark:bg-emerald-900/10 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[50%] h-[50%] bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-[120px] -z-10"></div>

      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="text-center mb-10">
          <Logo size="lg" className="mb-4" />
        </div>

        <div className="bg-white dark:bg-slate-900 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] border border-white/50 dark:border-slate-800 p-10 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 aura-bg-gradient"></div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          {mode === 'login_selection' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-10">Log in to {APP_NAME}</h2>
              
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
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
                    <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/>
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
                  </svg>
                  {isProcessing ? 'Connecting...' : 'Login with Google'}
                </button>
              </div>

              <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Don't have an account yet?</p>
                <button onClick={() => {}} className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest hover:underline underline-offset-8 transition-all">Sign up</button>
              </div>
            </div>
          )}

          {mode === 'login_manual' && (
            <form onSubmit={handleManualLogin} className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-8">Secure Login</h3>
              <div className="space-y-5">
                <div>
                  <label className={labelClasses}>Email or Username</label>
                  <input 
                    name="identifier" 
                    value={formData.identifier} 
                    onChange={handleInputChange} 
                    placeholder="e.g. @alex or alex@example.com" 
                    className={inputClasses} 
                    required 
                  />
                </div>
                <div>
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
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    placeholder="••••••••" 
                    className={inputClasses} 
                    required 
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4"
                >
                  {isProcessing ? 'Logging In...' : 'Log In'}
                </button>
                <button 
                  type="button" 
                  onClick={() => setMode('login_selection')} 
                  className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Options
                </button>
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
        
        <p className="text-center mt-12 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] animate-pulse">{APP_NAME} © 2024</p>
      </div>
    </div>
  );
};

export default Login;