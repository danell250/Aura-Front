import React, { useEffect, useState } from 'react';
import { getApiBaseUrl } from '../constants';
import Logo from './Logo';

interface MagicLoginProps {
  onLogin: (userData: any) => void;
}

const MagicLogin: React.FC<MagicLoginProps> = ({ onLogin }) => {
  const [status, setStatus] = useState<'verifying' | 'error' | 'success'>('verifying');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    if (!token || !email) {
      setStatus('error');
      setErrorMessage('Invalid login link. Missing parameters.');
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/auth/magic-link/verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ token, email }),
        });
        
        const data = await res.json();
        
        if (data.success && data.user) {
            setStatus('success');
            setTimeout(() => {
                onLogin(data.user);
                // Clear URL params to clean up history
                window.history.replaceState({}, '', '/');
            }, 1000);
        } else {
            setStatus('error');
            setErrorMessage(data.message || 'Login failed');
        }
      } catch (err) {
        console.error('Magic login error:', err);
        setStatus('error');
        setErrorMessage('Network error occurred. Please try again.');
      }
    };

    verify();
  }, [onLogin]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFDFF] dark:bg-slate-950 p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800 text-center">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto"></div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Verifying Magic Link...</h2>
            <p className="text-slate-500">Please wait while we log you in securely.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl">✓</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Login Successful!</h2>
            <p className="text-slate-500">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl">✕</div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Login Failed</h2>
            <p className="text-red-500 font-medium">{errorMessage}</p>
            <button 
                onClick={() => window.location.href = '/login'}
                className="mt-4 px-6 py-2 bg-slate-100 dark:bg-slate-800 rounded-full font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
                Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MagicLogin;
