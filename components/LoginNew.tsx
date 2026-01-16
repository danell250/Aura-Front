import React, { useState } from 'react';
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

const LoginNew: React.FC<LoginProps> = ({ onLogin }) => {
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleGoogleLogin = async () => {
    try {
      sessionStorage.setItem('oauth_in_progress', 'true');
    } catch {}
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier) {
      setError("Email address is required");
      return;
    }
    setStep('password');
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.password) {
      setError("Password is required");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const loginResult = await loginWithEmailAndPassword(
        formData.identifier,
        formData.password
      );

      if (loginResult.success) {
        setSuccess(true);
        if (loginResult.token) {
          localStorage.setItem('aura_auth_token', loginResult.token);
        }
        setTimeout(() => {
          onLogin(loginResult.user);
        }, 800);
      } else {
        setError(loginResult.error || 'Login failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel - Login Form */}
      <div className="w-full lg:w-[40%] flex flex-col justify-between p-8 lg:p-12">
        {/* Logo */}
        <div className="mb-8">
          <Logo size="md" />
        </div>

        {/* Main Content */}
        <div className="flex-1 max-w-md">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Log in to your account
          </h1>
          <p className="text-slate-600 mb-8">
            Don't have an account?{' '}
            <a href="/signup" className="text-emerald-600 hover:text-emerald-700 font-semibold">
              Sign Up
            </a>
          </p>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded flex items-start gap-2">
              <span className="text-lg">✓</span>
              <span className="text-sm font-medium">You have successfully logged out.</span>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-800 rounded text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center gap-3 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C12.955 4 4 12.955 4 24s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4C16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Google
              </button>

              <button
                type="button"
                onClick={() => window.location.href = `${API_BASE_URL}/auth/github`}
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-white border-2 border-slate-200 rounded-lg flex items-center justify-center gap-3 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </button>

              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-slate-200"></div>
                <span className="text-xs text-slate-500">Or with email and password</span>
                <div className="flex-1 h-px bg-slate-200"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  name="identifier"
                  value={formData.identifier}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                Next
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email Address
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={formData.identifier}
                    disabled
                    className="flex-1 px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setStep('email')}
                    className="px-4 py-3 text-emerald-600 hover:text-emerald-700 font-semibold"
                  >
                    Edit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
              >
                {isProcessing ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-xs text-slate-500">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </div>
      </div>

      {/* Right Panel - Visual */}
      <div className="hidden lg:flex lg:w-[60%] bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="relative z-10 p-12 flex flex-col justify-center text-white">
          <h2 className="text-4xl font-bold mb-4">
            Introducing the<br />
            {APP_NAME} Ad Platform
          </h2>
          <p className="text-lg text-emerald-50 mb-8 max-w-md">
            Connect to your audience with AI tools & IDEs like Cursor, Claude, Windsurf, Copilot, and more for natural language campaign generation.
          </p>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all"
          >
            Try now <span>→</span>
          </a>
        </div>

        {/* Isometric Illustration */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[70%] h-[80%]">
          <svg viewBox="0 0 800 600" className="w-full h-full">
            {/* Database cylinders */}
            <g transform="translate(100, 300)">
              <ellipse cx="60" cy="0" rx="60" ry="20" fill="#FFF" opacity="0.9"/>
              <rect x="0" y="0" width="120" height="80" fill="#FFF" opacity="0.8"/>
              <ellipse cx="60" cy="80" rx="60" ry="20" fill="#FFF" opacity="0.7"/>
            </g>

            {/* Platform blocks */}
            <g transform="translate(300, 200)">
              <polygon points="0,50 100,0 200,50 100,100" fill="#34D399" opacity="0.9"/>
              <polygon points="100,100 200,50 200,150 100,200" fill="#10B981" opacity="0.8"/>
              <polygon points="0,50 100,100 100,200 0,150" fill="#059669" opacity="0.7"/>
            </g>

            {/* Floating elements */}
            <g transform="translate(500, 150)">
              <polygon points="50,0 100,25 75,75 25,75 0,25" fill="#A78BFA" opacity="0.9"/>
              <polygon points="50,0 75,75 50,100 25,75" fill="#8B5CF6" opacity="0.8"/>
            </g>

            {/* Connection lines */}
            <path d="M 160 340 Q 300 300 400 250" stroke="#FFF" strokeWidth="3" fill="none" opacity="0.5" strokeDasharray="10,5"/>
            <path d="M 400 300 Q 500 250 550 200" stroke="#FFF" strokeWidth="3" fill="none" opacity="0.5" strokeDasharray="10,5"/>

            {/* Decorative dots */}
            <circle cx="150" cy="100" r="8" fill="#FFF" opacity="0.8"/>
            <circle cx="650" cy="400" r="8" fill="#FFF" opacity="0.8"/>
            <circle cx="200" cy="500" r="6" fill="#FFF" opacity="0.6"/>
            <circle cx="700" cy="150" r="6" fill="#FFF" opacity="0.6"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LoginNew;
