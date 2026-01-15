import React, { useState } from 'react';

interface TimeCapsuleTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TimeCapsuleTutorial: React.FC<TimeCapsuleTutorialProps> = ({
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Welcome to Time Capsules",
      subtitle: "Send messages to your future self and friends",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl">
            <span className="text-4xl">⏰</span>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Time Capsules let you create posts that unlock at a future date you choose. 
              Perfect for setting goals, preserving memories, or creating shared experiences with friends.
            </p>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-2xl p-4">
              <p className="text-sm text-emerald-700 dark:text-emerald-300 font-medium">
                💡 Imagine posting "Future me in 2027, hope you achieved your startup dream!" 
                and having it unlock exactly when you planned.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Two Types of Time Capsules",
      subtitle: "Choose between personal and group experiences",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👤</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Personal</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Just for you</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Future goal tracking
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Personal reflections
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Memory preservation
                </li>
              </ul>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border-2 border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👥</span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Group</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Share with friends</p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Reunion planning
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Shared memories
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  Group challenges
                </li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      subtitle: "Simple steps to create your time capsule",
      content: (
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                1
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Write Your Message</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Craft a meaningful message to your future self or friends. Share goals, memories, or questions.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                2
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Choose Unlock Date</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Select when you want the time capsule to unlock - from tomorrow to years in the future.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                3
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Invite Friends (Optional)</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  For group capsules, invite friends who will receive the message when it unlocks.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                4
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">Wait for the Magic</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Your time capsule will automatically unlock on the chosen date and appear in your feed.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Creative Ideas",
      subtitle: "Inspiration for your time capsules",
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎯</span> Personal Goals
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>"Did I launch my startup by 2026?"</li>
                <li>"Hope I'm still running marathons!"</li>
                <li>"Future me: Did we buy that house?"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-lg">👨‍👩‍👧‍👦</span> Family Moments
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>"Kids' first day of school memories"</li>
                <li>"Wedding anniversary predictions"</li>
                <li>"Family vacation time capsule"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎓</span> Milestones
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>"College graduation wishes"</li>
                <li>"Career change reflections"</li>
                <li>"Retirement countdown"</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="text-lg">🎉</span> Group Fun
              </h3>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                <li>"High school reunion predictions"</li>
                <li>"Friend group challenges"</li>
                <li>"Travel bucket list check-ins"</li>
              </ul>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Privacy & Security",
      subtitle: "Your time capsules are safe and secure",
      content: (
        <div className="space-y-6">
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="font-bold text-emerald-800 dark:text-emerald-300">Secure & Private</h3>
            </div>
            <ul className="space-y-3 text-sm text-emerald-700 dark:text-emerald-300">
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Encrypted Storage:</strong> All time capsules are securely encrypted until unlock date</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Private by Default:</strong> Only you and invited friends can see group capsules</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>No Early Access:</strong> Even we can't unlock your capsules before the date</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></span>
                <span><strong>Delete Anytime:</strong> You can delete your time capsules before they unlock</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      title: "Ready to Start?",
      subtitle: "Create your first time capsule now",
      content: (
        <div className="text-center space-y-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl animate-pulse">
            <span className="text-4xl">🚀</span>
          </div>
          <div className="space-y-4">
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              You're all set! Time Capsules add a magical dimension to your social experience. 
              Start with something simple - maybe a message to yourself one year from now.
            </p>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-950/20 dark:to-emerald-900/20 rounded-2xl p-6">
              <h3 className="font-bold text-emerald-700 dark:text-emerald-300 mb-2">Pro Tip</h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400">
                The most meaningful time capsules are specific and personal. Instead of "Hope I'm happy," 
                try "I hope I finally learned to play guitar and can play 'Wonderwall' for the kids."
              </p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTutorial = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const currentStepData = steps[currentStep];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 p-6 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <span className="text-2xl">⏰</span>
                </div>
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-tight">Time Capsules</h1>
                  <p className="text-white/80 text-sm font-medium">Send messages to the future</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Progress Bar */}
            <div className="flex items-center gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index <= currentStep ? 'bg-white' : 'bg-white/30'
                  }`}
                  style={{ width: `${100 / steps.length}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
              {currentStepData.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {currentStepData.subtitle}
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {currentStepData.content}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 dark:border-slate-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Step {currentStep + 1} of {steps.length}
              </span>
              {currentStep > 0 && (
                <button
                  onClick={prevStep}
                  className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium transition-colors"
                >
                  ← Previous
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={skipTutorial}
                className="px-6 py-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-bold text-sm uppercase tracking-wider transition-colors"
              >
                Skip Tutorial
              </button>
              <button
                onClick={nextStep}
                className="px-8 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg"
              >
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimeCapsuleTutorial;
