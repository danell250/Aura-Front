import React, { useState } from 'react';
import { User } from '../types';
import SuccessNotification from './SuccessNotification';

interface BoostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBoost: (credits: number) => void;
  currentUser: User;
  postAuthor: string;
  onOpenCreditStore?: () => void;
}

const BoostModal: React.FC<BoostModalProps> = ({
  isOpen,
  onClose,
  onBoost,
  currentUser,
  postAuthor,
  onOpenCreditStore
}) => {
  const [selectedCredits, setSelectedCredits] = useState(50);
  const [customCredits, setCustomCredits] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successDetails, setSuccessDetails] = useState<{
    radianceBoost: number;
    creditsSpent: number;
    remainingCredits: number;
  } | null>(null);

  const presetOptions = [
    { credits: 50, label: 'Small Boost', description: '+100 radiance', color: 'from-emerald-500 to-teal-500' },
    { credits: 100, label: 'Medium Boost', description: '+200 radiance', color: 'from-blue-500 to-indigo-500' },
    { credits: 200, label: 'Large Boost', description: '+400 radiance', color: 'from-purple-500 to-pink-500' },
    { credits: 500, label: 'Mega Boost', description: '+1000 radiance', color: 'from-orange-500 to-red-500' }
  ];

  const handleBoost = () => {
    const creditsToSpend = isCustom ? parseInt(customCredits) : selectedCredits;
    
    if (creditsToSpend <= 0) {
      return;
    }
    
    if (creditsToSpend > (currentUser.auraCredits || 0)) {
      if (onOpenCreditStore) {
        onOpenCreditStore();
        onClose();
      }
      return;
    }
    
    onBoost(creditsToSpend);
    
    // Show success notification with credit deduction details
    const radianceBoost = creditsToSpend * 2;
    const remainingCredits = (currentUser.auraCredits || 0) - creditsToSpend;
    
    setSuccessDetails({
      radianceBoost,
      creditsSpent: creditsToSpend,
      remainingCredits
    });
    setShowSuccess(true);
    
    onClose();
    // Reset state
    setSelectedCredits(50);
    setCustomCredits('');
    setIsCustom(false);
  };

  const handleCustomCreditsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (value === '' || /^\d+$/.test(value)) {
      setCustomCredits(value);
    }
  };

  if (!isOpen) return (
    <>
      <SuccessNotification
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Post Boosted Successfully!"
        message={`Amplified ${postAuthor}'s reach`}
        details={successDetails ? [
          { label: 'Radiance boost', value: `+${successDetails.radianceBoost}`, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Credits spent', value: `${successDetails.creditsSpent}`, color: 'text-slate-900 dark:text-white' },
          { label: 'Credits remaining', value: `${successDetails.remainingCredits.toLocaleString()}`, color: 'text-slate-900 dark:text-white' }
        ] : []}
      />
    </>
  );

  return (
    <>
      <div className="fixed inset-0 z-[200] flex items-start sm:items-center justify-center p-2 sm:p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 relative animate-in zoom-in-95 duration-300 my-2 sm:my-4">
        <div className="flex justify-between items-start mb-4 sm:mb-6">
          <div className="flex-1 pr-3 sm:pr-4">
            <h2 className="text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Boost Post</h2>
            <p className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mt-1">Amplify {postAuthor}'s reach</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 sm:p-2 md:p-3 bg-slate-50 dark:bg-slate-800 rounded-xl md:rounded-2xl text-slate-400 hover:text-rose-500 transition-all flex-shrink-0"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Your Credits</span>
            <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              {currentUser.auraCredits?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(((currentUser.auraCredits || 0) / 1000) * 100, 100)}%` 
              }}
            ></div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
          <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Choose Boost Amount</h3>
          
          {/* Preset Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {presetOptions.map((option) => {
              const canAfford = (currentUser.auraCredits || 0) >= option.credits;
              return (
                <button
                  key={option.credits}
                  onClick={() => {
                    if (canAfford) {
                      setSelectedCredits(option.credits);
                      setIsCustom(false);
                    }
                  }}
                  disabled={!canAfford}
                  className={`p-3 sm:p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left relative overflow-hidden ${
                    !canAfford
                      ? 'border-slate-200 dark:border-slate-700 opacity-50 cursor-not-allowed'
                      : !isCustom && selectedCredits === option.credits
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
                  }`}
                >
                  <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${option.color}`}></div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white mb-1">
                    {option.credits} Credits
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {option.label}
                  </div>
                  <div className="text-[9px] sm:text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                    {option.description}
                  </div>
                  {!canAfford && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/20 dark:bg-slate-100/20 rounded-xl md:rounded-2xl">
                      <span className="text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg">
                        Insufficient Credits
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Amount */}
          <div className="pt-2 sm:pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsCustom(true)}
              className={`w-full p-3 sm:p-3 md:p-4 rounded-xl md:rounded-2xl border-2 transition-all text-left ${
                isCustom
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white mb-1">
                    Custom Amount
                  </div>
                  <div className="text-[10px] sm:text-xs font-semibold text-slate-600 dark:text-slate-400">
                    Choose your own boost level
                  </div>
                </div>
                <div className="text-lg sm:text-xl md:text-2xl">⚡</div>
              </div>
            </button>
            
            {isCustom && (
              <div className="mt-2 sm:mt-3 animate-in slide-in-from-top-2 duration-200">
                <input
                  type="text"
                  value={customCredits}
                  onChange={handleCustomCreditsChange}
                  placeholder="Enter credits amount"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/30 transition-all"
                  autoFocus
                />
                <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Radiance boost: +{customCredits ? (parseInt(customCredits) * 2) : 0}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl md:rounded-2xl p-3 sm:p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Credits to spend:</span>
              <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white">
                {isCustom ? (customCredits || '0') : selectedCredits}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Radiance boost:</span>
              <span className="text-sm sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400">
                +{isCustom ? ((parseInt(customCredits) || 0) * 2) : (selectedCredits * 2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400">Remaining credits:</span>
              <span className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-white">
                {((currentUser.auraCredits || 0) - (isCustom ? (parseInt(customCredits) || 0) : selectedCredits)).toLocaleString()}
              </span>
            </div>
          </div>

          <button
            onClick={handleBoost}
            disabled={
              (isCustom && (!customCredits || parseInt(customCredits) <= 0)) ||
              (isCustom ? (parseInt(customCredits) || 0) : selectedCredits) > (currentUser.auraCredits || 0)
            }
            className="w-full py-3 sm:py-3 md:py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-400 disabled:to-slate-500 text-white font-black rounded-xl md:rounded-2xl text-xs sm:text-sm uppercase tracking-[0.3em] shadow-xl hover:shadow-2xl active:scale-95 transition-all disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            <span>🚀</span>
            <span className="truncate">
              {(isCustom ? (parseInt(customCredits) || 0) : selectedCredits) > (currentUser.auraCredits || 0)
                ? 'Insufficient Credits'
                : 'Boost Post'
              }
            </span>
          </button>
        </div>
      </div>
      </div>
      
      <SuccessNotification
        isVisible={showSuccess}
        onClose={() => setShowSuccess(false)}
        title="Post Boosted Successfully!"
        message={`Amplified ${postAuthor}'s reach`}
        details={successDetails ? [
          { label: 'Radiance boost', value: `+${successDetails.radianceBoost}`, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Credits spent', value: `${successDetails.creditsSpent}`, color: 'text-slate-900 dark:text-white' },
          { label: 'Credits remaining', value: `${successDetails.remainingCredits.toLocaleString()}`, color: 'text-slate-900 dark:text-white' }
        ] : []}
      />
    </>
  );
};

export default BoostModal;