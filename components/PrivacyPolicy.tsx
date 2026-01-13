import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            Privacy Policy
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
              Aura Social Platform – Privacy Policy
            </h3>
            
            <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">1. Data Collection</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Account info (email, username)</li>
                  <li>Usage data (interactions, posts, activity)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">2. How We Use Data</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>To provide, maintain, and improve Aura</li>
                  <li>To communicate important updates</li>
                  <li>For analytics and platform improvement</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">3. Data Sharing</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>We do not sell or trade your data</li>
                  <li>We may share data with service providers strictly to operate Aura</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">4. Your Rights</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Access your data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt-out of non-essential communications</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">5. Security</h4>
                <p>We use industry-standard measures to protect your data</p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">6. Updates</h4>
                <p>Policy may be updated. Significant changes will be communicated.</p>
              </div>

              <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                  [View Full Privacy Policy Online]
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;