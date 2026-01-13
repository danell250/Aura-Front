import React from 'react';

interface TermsAndConditionsProps {
  onClose: () => void;
}

const TermsAndConditions: React.FC<TermsAndConditionsProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Terms & Conditions
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            ✕
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              Aura Social Platform – Full Terms & Conditions
            </h3>
            
            <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Introduction</h4>
                <p>Welcome to Aura. By creating an account or using the platform, you agree to these terms.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. Accounts</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You must provide accurate information.</li>
                  <li>Keep your password secure.</li>
                  <li>You are responsible for all activity under your account.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">3. Platform Use</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Aura is for social networking, sharing, and connecting.</li>
                  <li>Do not post illegal, abusive, or offensive content.</li>
                  <li>You may not attempt to harm or exploit the platform.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">4. Content</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>You retain ownership of your content.</li>
                  <li>By posting, you grant Aura a worldwide license to display, host, and distribute your content on the platform.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">5. Privacy</h4>
                <p>Data collection, use, and storage are governed by our Privacy Policy.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">6. Termination</h4>
                <p>Aura may suspend or delete accounts violating terms or policies.</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">7. Disclaimers & Limitation of Liability</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Aura is provided "as-is."</li>
                  <li>We are not responsible for user-generated content or any damages from using the platform.</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">8. Updates to Terms</h4>
                <p>We may update these terms at any time. Users will be notified of significant changes.</p>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  [View Full Terms & Conditions Online]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;