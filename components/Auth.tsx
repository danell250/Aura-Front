
import React, { useState } from 'react';
import { APP_NAME } from '../constants';
import { User } from '../types';
import Logo from './Logo';
import SocialConnectModal from './SocialConnectModal';
import { auth, googleProvider, signInWithPopup, signInWithRedirect } from '../services/firebase';
import { UserService } from '../services/userService';

interface AuthProps {
  onLogin: (userData: any) => void;
  allUsers: User[];
}

type AuthMode = 
  | 'login_selection' 
  | 'signup_selection' 
  | 'login_manual' 
  | 'signup_manual' 
  | 'profile_setup'
  | 'forgot_password' 
  | 'reset_success';

const Auth: React.FC<AuthProps> = ({ onLogin, allUsers }) => {
  const [mode, setMode] = useState<AuthMode>('login_selection');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [socialContext, setSocialContext] = useState<{ provider: string; data: any } | null>(null);
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    dob: '',
    bio: '',
    handle: '',
    industry: '',
    companyName: '',
    googleId: '',
    avatar: '',
    avatarType: 'image'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleGoogleLoginRedirect = async () => {
    setIsProcessing(true);
    setError(null);
    
    try {
      // Use redirect-based authentication (no COOP issues)
      await signInWithRedirect(auth, googleProvider);
      // The page will redirect, so no need to handle result here
      // Result will be handled by onAuthStateChanged listener
    } catch (err: any) {
      console.error("Firebase Auth Redirect Error:", err);
      setError(err.message || "Login failed. Please try again.");
      setIsProcessing(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsProcessing(true);
    setError(null);
    
    // Open popup manually to avoid COOP issues
    const popup = window.open(
      '',               // empty URL to avoid cross-origin issues
      'firebasePopup',  // name
      'width=500,height=600'
    );

    if (!popup) {
      setError("Popup blocked by browser. Please allow popups and try again.");
      setIsProcessing(false);
      return;
    }

    try {
      // Perform sign-in with popup
      const result = await signInWithPopup(auth, googleProvider);
      
      // Close popup safely
      popup.close();
      
      const user = result.user;
      
      if (!user.email) {
        throw new Error('Google account does not have an email address');
      }

      // Parse name from displayName
      const displayName = user.displayName || '';
      const nameParts = displayName.trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';
      const fullName = displayName || `${firstName} ${lastName}`.trim();

      // Check if user already exists by email
      const normalizedEmail = user.email.toLowerCase().trim();
      const existingUserResult = await UserService.findUserByEmail(normalizedEmail);
      
      if (existingUserResult.success && existingUserResult.user) {
        // Existing user - log them in with updated Google data
        onLogin({
          ...existingUserResult.user,
          avatar: user.photoURL || existingUserResult.user.avatar,
          avatarType: 'image' as const
        });
      } else {
        // New user - redirect to profile setup with Google data
        setMode('profile_setup');
        setFormData({
          ...formData,
          firstName,
          lastName,
          email: normalizedEmail,
          googleId: user.uid,
          avatar: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          avatarType: 'image'
        });
      }
    } catch (err: any) {
      console.error("Firebase Auth Error:", err);
      
      // Close popup if something went wrong
      if (!popup.closed) popup.close();
      
      // Handle specific error cases
      if (err.code === 'auth/popup-closed-by-user') {
        setError("Login cancelled. Please try again.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Popup blocked. Please allow popups for this site and try again.");
      } else {
        setError(err.message || "Login failed. Please try again.");
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier || !formData.password) {
      setError("Email/username and password are required to log in.");
      return;
    }
    
    const identifier = formData.identifier.trim().toLowerCase();
    
    simulateProcess(() => {
      // Search in all users by email or handle (case-insensitive)
      const user = allUsers.find(u => {
        const uEmail = u.email?.toLowerCase().trim();
        const uHandle = u.handle?.toLowerCase().trim();
        return uEmail === identifier || uHandle === identifier;
      });
      
      if (user) {
        onLogin(user);
      } else {
        setError("Account not found. Please check your credentials or create a new account.");
      }
    });
  };

  const handleManualSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, phone, dob, email } = formData;
    
    // Validate required fields
    if (!firstName || !lastName || !phone || !dob || !email) {
      setError("All fields are required.");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Check if user already exists (case-insensitive)
    const normalizedEmail = email.toLowerCase().trim();
    const existingUserResult = await UserService.findUserByEmail(normalizedEmail);
    
    if (existingUserResult.success && existingUserResult.user) {
      setError("An account with this email already exists. Try logging in.");
      return;
    }

    // Proceed to profile setup
    setFormData({
      ...formData,
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim()
    });
    setMode('profile_setup');
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

  const handleSocialConfirm = (confirmedData: any) => {
    if (!socialContext) return;
    const finalData = {
      ...socialContext.data,
      ...confirmedData,
      avatar: `https://ui-avatars.com/api/?name=${confirmedData.firstName}+${confirmedData.lastName}&background=10b981&color=fff`,
    };
    onLogin(finalData);
    setSocialContext(null);
  };

  const handleProfileSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    const { firstName, lastName, phone, dob, email, bio, handle, industry, companyName } = formData;
    
    // Validate required fields
    if (!firstName || !lastName || !phone || !dob || !email || !bio || !handle) {
      setError("Please fill in all required fields.");
      return;
    }

    // Validate handle format (must start with @)
    const cleanHandle = handle.startsWith('@') ? handle : `@${handle}`;
    if (cleanHandle.length < 3) {
      setError("Handle must be at least 2 characters long.");
      return;
    }

    // Check if handle is already taken
    const existingHandleResult = await UserService.userExists(undefined, cleanHandle);
    
    if (existingHandleResult.exists) {
      setError("This handle is already taken. Please choose another one.");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Create complete user profile
      const userData = {
        id: formData.googleId || `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        dob,
        bio: bio.trim(),
        handle: cleanHandle,
        industry: industry.trim() || undefined,
        companyName: companyName.trim() || undefined,
        avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}`,
        avatarType: formData.avatarType || 'image',
        acquaintances: [],
        blockedUsers: [],
        trustScore: 10,
        auraCredits: 100,
        activeGlow: 'none' as const
      };

      // Save user using UserService (saves to both MongoDB and Firestore)
      const saveResult = await UserService.saveUser(userData);
      
      if (saveResult.success) {
        console.log('✅ User profile created and saved successfully');
        onLogin(userData);
      } else {
        console.error('❌ Failed to save user profile:', saveResult.error);
        setError("Failed to create profile. Please try again.");
      }
    } catch (error) {
      console.error('❌ Error during profile setup:', error);
      setError("An error occurred while creating your profile. Please try again.");
    } finally {
      setIsProcessing(false);
    }
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-10">Log in to Aura</h2>
              
              <button 
                onClick={() => setMode('login_manual')} 
                className={`${socialButtonClasses} !bg-slate-900 dark:!bg-emerald-600 !text-white !border-none shadow-xl shadow-slate-900/20 dark:shadow-emerald-900/20 mb-6`}
              >
                <span className="text-lg">📧</span> Use phone / email / username
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Or login with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="space-y-3">
                <button onClick={handleGoogleLogin} disabled={isProcessing} className={socialButtonClasses}>
                  <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                  {isProcessing ? 'Connecting...' : 'Login with Google'}
                </button>
                
                {error && error.includes('popup') && (
                  <button onClick={handleGoogleLoginRedirect} disabled={isProcessing} className={`${socialButtonClasses} text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`}>
                    <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                    Try redirect login instead
                  </button>
                )}
              </div>

              <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Don’t have an account yet?</p>
                <button onClick={() => setMode('signup_selection')} className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest hover:underline underline-offset-8 transition-all">Sign up</button>
              </div>
            </div>
          )}

          {mode === 'signup_selection' && (
            <div className="animate-in fade-in slide-in-from-bottom-4">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-10">Create an Account</h2>
              
              <button 
                onClick={() => setMode('signup_manual')} 
                className={`${socialButtonClasses} !bg-emerald-600 !text-white !border-none shadow-xl shadow-emerald-600/20 mb-6`}
              >
                <span className="text-lg">📱</span> Sign up with phone / email
              </button>

              <div className="flex items-center gap-4 my-8">
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Or join with</span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800"></div>
              </div>

              <div className="space-y-3">
                <button onClick={handleGoogleLogin} disabled={isProcessing} className={socialButtonClasses}>
                  <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                  {isProcessing ? 'Connecting...' : 'Sign up with Google'}
                </button>
                
                {error && error.includes('popup') && (
                  <button onClick={handleGoogleLoginRedirect} disabled={isProcessing} className={`${socialButtonClasses} text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400`}>
                    <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
                    Try redirect signup instead
                  </button>
                )}
              </div>

              <div className="mt-12 text-center pt-8 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-4">Already have an account?</p>
                <button onClick={() => setMode('login_selection')} className="text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest hover:underline underline-offset-8 transition-all">Log in</button>
              </div>
            </div>
          )}

          {mode === 'login_manual' && (
            <form onSubmit={handleManualLogin} className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-8">Node Identity Login</h3>
              <div className="space-y-5">
                <div>
                  <label className={labelClasses}>Phone, Email, or Username</label>
                  <input name="identifier" value={formData.identifier} onChange={handleInputChange} placeholder="e.g. @alex or alex@aura.io" className={inputClasses} required />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2 mr-1">
                    <label className={labelClasses}>Password</label>
                    <button type="button" onClick={() => setMode('forgot_password')} className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:underline transition-colors">Forgot?</button>
                  </div>
                  <input type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" className={inputClasses} required />
                </div>
                <button type="submit" disabled={isProcessing} className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4">
                  {isProcessing ? 'Syncing...' : 'Log In'}
                </button>
                <button type="button" onClick={() => setMode('login_selection')} className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors">← Back to Options</button>
              </div>
            </form>
          )}

          {mode === 'signup_manual' && (
            <form onSubmit={handleManualSignup} className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-8">Personal Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>First Name</label>
                    <input name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="Alex" className={inputClasses} required />
                  </div>
                  <div>
                    <label className={labelClasses}>Last Name</label>
                    <input name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Rivera" className={inputClasses} required />
                  </div>
                </div>
                <div>
                  <label className={labelClasses}>Cell Phone</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" className={inputClasses} required />
                </div>
                <div>
                  <label className={labelClasses}>Email Address</label>
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="alex@aura.io" className={inputClasses} required />
                </div>
                <div>
                  <label className={labelClasses}>Date of Birth</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} className={inputClasses} required />
                </div>
                <button type="submit" disabled={isProcessing} className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all mt-4">
                  {isProcessing ? 'Establishing...' : 'Create Account'}
                </button>
                <button type="button" onClick={() => setMode('signup_selection')} className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors">← Back to Options</button>
              </div>
            </form>
          )}

          {mode === 'profile_setup' && (
            <form onSubmit={handleProfileSetup} className="animate-in slide-in-from-right-8 duration-500">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight text-center mb-2">Complete Your Profile</h3>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest text-center mb-8 leading-relaxed">
                Tell us about yourself to personalize your Aura experience
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>First Name *</label>
                    <input 
                      name="firstName" 
                      value={formData.firstName} 
                      onChange={handleInputChange} 
                      placeholder="Alex" 
                      className={inputClasses} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Last Name *</label>
                    <input 
                      name="lastName" 
                      value={formData.lastName} 
                      onChange={handleInputChange} 
                      placeholder="Rivera" 
                      className={inputClasses} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Username/Handle *</label>
                  <input 
                    name="handle" 
                    value={formData.handle} 
                    onChange={handleInputChange} 
                    placeholder="@alexrivera" 
                    className={inputClasses} 
                    required 
                  />
                </div>

                <div>
                  <label className={labelClasses}>Email Address *</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    placeholder="alex@company.com" 
                    className={inputClasses} 
                    required 
                    disabled={!!formData.googleId}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClasses}>Phone Number *</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleInputChange} 
                      placeholder="+1 (555) 000-0000" 
                      className={inputClasses} 
                      required 
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Date of Birth *</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formData.dob} 
                      onChange={handleInputChange} 
                      className={inputClasses} 
                      required 
                    />
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Professional Bio *</label>
                  <textarea 
                    name="bio" 
                    value={formData.bio} 
                    onChange={handleInputChange}
                    placeholder="Tell us about your professional background, expertise, and what you're passionate about..."
                    className={`${inputClasses} min-h-[100px] resize-none`}
                    maxLength={300}
                    required 
                  />
                  <div className="text-right mt-1">
                    <span className="text-[9px] text-slate-400">{formData.bio.length}/300</span>
                  </div>
                </div>

                <div>
                  <label className={labelClasses}>Industry</label>
                  <select 
                    name="industry" 
                    value={formData.industry} 
                    onChange={handleInputChange}
                    className={inputClasses}
                  >
                    <option value="">Select your industry</option>
                    <option value="Technology">Technology</option>
                    <option value="Finance">Finance</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Consulting">Consulting</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Retail">Retail</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Legal">Legal</option>
                    <option value="Media">Media</option>
                    <option value="Non-profit">Non-profit</option>
                    <option value="Government">Government</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className={labelClasses}>Company Name</label>
                  <input 
                    name="companyName" 
                    value={formData.companyName} 
                    onChange={handleInputChange} 
                    placeholder="Your current company or organization" 
                    className={inputClasses} 
                  />
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <button 
                  type="submit" 
                  disabled={isProcessing} 
                  className="w-full py-5 aura-bg-gradient text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all"
                >
                  {isProcessing ? 'Creating Profile...' : 'Complete Setup'}
                </button>
                
                <button 
                  type="button" 
                  onClick={() => setMode(formData.googleId ? 'login_selection' : 'signup_manual')} 
                  className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-2 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  ← Back
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
                  <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="recovery@aura.io" className={inputClasses} required />
                </div>
                <button type="submit" disabled={isProcessing} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all">
                  {isProcessing ? 'Sending...' : 'Send Link'}
                </button>
                <button type="button" onClick={() => setMode('login_manual')} className="w-full text-center text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest pt-6 hover:text-slate-900 dark:hover:text-white transition-colors">← Back to Login</button>
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
              <button onClick={() => setMode('login_manual')} className="w-full py-5 bg-slate-900 dark:bg-slate-800 text-white font-black rounded-2xl text-[12px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 active:scale-95 transition-all">
                Return to Login
              </button>
            </div>
          )}
        </div>
        
        <p className="text-center mt-12 text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] animate-pulse">Aura Social Network © 2024</p>
      </div>

      {socialContext && (
        <SocialConnectModal 
          provider={socialContext.provider}
          initialData={socialContext.data}
          onConfirm={handleSocialConfirm}
          onCancel={() => setSocialContext(null)}
        />
      )}
    </div>
  );
};

export default Auth;
