import React, { useState } from 'react';

interface AIContentGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (prompt: string) => Promise<string>;
  onUseContent: (content: string) => void;
}

const AIContentGenerator: React.FC<AIContentGeneratorProps> = ({ 
  isOpen, 
  onClose, 
  onGenerate,
  onUseContent 
}) => {
  const [prompt, setPrompt] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for content generation');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const content = await onGenerate(prompt);
      setGeneratedContent(content);
    } catch (err) {
      setError('Failed to generate content. Please try again.');
      console.error('Error generating content:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseContent = () => {
    if (generatedContent) {
      onUseContent(generatedContent);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl p-6 md:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter flex items-center gap-2">
              <span>🤖</span> AI Content Generator
            </h2>
            <p className="text-xs font-black uppercase text-emerald-600 tracking-[0.2em] mt-1">Get inspiration for your post</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label htmlFor="prompt" className="block text-sm font-black text-slate-700 dark:text-slate-300 mb-2">
              Describe what you'd like to write about:
            </label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Write a motivational post about overcoming challenges', 'Create a professional update about my recent achievements', 'Craft an engaging question to spark conversations'"
              className="w-full h-32 px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
            </div>
          ) : generatedContent ? (
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                <h3 className="font-black text-slate-900 dark:text-white mb-2">Generated Content:</h3>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{generatedContent}</p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setGeneratedContent('')}
                  className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black rounded-xl text-xs uppercase tracking-widest transition-all hover:bg-slate-200 dark:hover:bg-slate-700"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleUseContent}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-xs uppercase tracking-widest transition-all"
                >
                  Use This
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black rounded-xl text-sm uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Generate Content
            </button>
          )}

          {!generatedContent && !isLoading && (
            <div className="pt-4">
              <h3 className="font-black text-slate-900 dark:text-white mb-2">Suggestions:</h3>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>"Write a motivational post about overcoming challenges"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>"Create a professional update about my recent achievements"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>"Craft an engaging question to spark conversations"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500">•</span>
                  <span>"Help me write about industry trends I'm excited about"</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIContentGenerator;
