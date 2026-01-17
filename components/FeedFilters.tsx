
import React, { useState } from 'react';
import { User, EnergyType } from '../types';

interface FeedFiltersProps {
  activeMediaType: 'all' | 'image' | 'video' | 'document';
  onMediaTypeChange: (type: 'all' | 'image' | 'video' | 'document') => void;
  activeAuthorId: string;
  onAuthorChange: (id: string) => void;
  authors: User[];
  activeEnergy: EnergyType | 'all';
  onEnergyChange: (energy: EnergyType | 'all') => void;
}

const FeedFilters: React.FC<FeedFiltersProps> = ({ 
  activeMediaType, 
  onMediaTypeChange, 
  activeEnergy,
  onEnergyChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasActiveFilters = activeMediaType !== 'all' || activeEnergy !== 'all';

  const energyFilters = [
    { 
      key: 'all', 
      label: 'All Content', 
      icon: '🌐', 
      description: 'Everything in your feed',
      gradient: 'from-slate-600 to-slate-700',
      bgColor: 'bg-slate-50 dark:bg-slate-800/50',
      textColor: 'text-slate-700 dark:text-slate-300'
    },
    { 
      key: EnergyType.HIGH_ENERGY, 
      label: 'High Energy', 
      icon: '⚡', 
      description: 'Dynamic and exciting content',
      gradient: 'from-amber-500 to-orange-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      textColor: 'text-amber-700 dark:text-amber-400'
    },
    { 
      key: EnergyType.MOTIVATED, 
      label: 'Motivated', 
      icon: '🔥', 
      description: 'Goal-driven, focused progress updates',
      gradient: 'from-red-500 to-orange-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      textColor: 'text-red-700 dark:text-red-400'
    },
    { 
      key: EnergyType.CALM, 
      label: 'Calm & Mindful', 
      icon: '🌿', 
      description: 'Peaceful and reflective posts',
      gradient: 'from-emerald-500 to-teal-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      textColor: 'text-emerald-700 dark:text-emerald-400'
    },
    { 
      key: EnergyType.HEALING, 
      label: 'Healing', 
      icon: '🤍', 
      description: 'Recovery, self-care and support',
      gradient: 'from-rose-400 to-amber-400',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20',
      textColor: 'text-rose-700 dark:text-rose-300'
    },
    { 
      key: EnergyType.DEEP_DIVE, 
      label: 'Deep Insights', 
      icon: '🧠', 
      description: 'Thoughtful analysis and learning',
      gradient: 'from-indigo-500 to-purple-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20',
      textColor: 'text-indigo-700 dark:text-indigo-400'
    },
    { 
      key: EnergyType.THINKING_OUT_LOUD, 
      label: 'Thinking out loud', 
      icon: '🤔', 
      description: 'Working through ideas in public',
      gradient: 'from-sky-500 to-indigo-500',
      bgColor: 'bg-sky-50 dark:bg-sky-900/20',
      textColor: 'text-sky-700 dark:text-sky-300'
    },
    { 
      key: EnergyType.VENTING, 
      label: 'Venting', 
      icon: '😔', 
      description: 'Letting off steam and sharing struggles',
      gradient: 'from-slate-500 to-slate-700',
      bgColor: 'bg-slate-50 dark:bg-slate-900/40',
      textColor: 'text-slate-700 dark:text-slate-300'
    },
    { 
      key: EnergyType.CELEBRATING, 
      label: 'Celebrating', 
      icon: '🎉', 
      description: 'Wins, milestones and good news',
      gradient: 'from-emerald-500 to-lime-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/30',
      textColor: 'text-emerald-700 dark:text-emerald-400'
    }
  ];

  const mediaFilters = [
    { key: 'all', label: 'All Types', icon: '📋', description: 'Every format' },
    { key: 'image', label: 'Visuals', icon: '🖼️', description: 'Photos & graphics' },
    { key: 'video', label: 'Motion', icon: '🎬', description: 'Videos & animations' },
    { key: 'document', label: 'Documents', icon: '📄', description: 'Files & resources' }
  ];

  return (
    <div className="space-y-4 mb-8 animate-in fade-in duration-700">
      {/* Main Filter Panel */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Content Filters</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Customize your feed experience</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {hasActiveFilters && (
                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                  {[activeMediaType !== 'all' ? 1 : 0, activeEnergy !== 'all' ? 1 : 0].reduce((a, b) => a + b, 0)} active
                </span>
              )}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg 
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filters (Always Visible) */}
        <div className="p-4">
          <div className="flex flex-wrap gap-2">
            {energyFilters.slice(0, 2).map((filter) => (
              <QuickFilterChip
                key={filter.key}
                label={`${filter.icon} ${filter.label}`}
                active={activeEnergy === filter.key}
                onClick={() => onEnergyChange(filter.key as any)}
                className={filter.key === 'all' ? 'border-slate-300 dark:border-slate-600' : ''}
              />
            ))}
            {mediaFilters.slice(0, 3).map((filter) => (
              <QuickFilterChip
                key={filter.key}
                label={`${filter.icon} ${filter.label}`}
                active={activeMediaType === filter.key}
                onClick={() => onMediaTypeChange(filter.key as any)}
                variant="secondary"
              />
            ))}
          </div>
        </div>

        {/* Expanded Filters */}
        {isExpanded && (
          <div className="border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
            {/* Energy Filters */}
            <div className="p-6">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Content Energy</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Filter by the vibe and energy level</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {energyFilters.map((filter) => (
                  <div key={filter.key}>
                  <EnergyFilterCard
                    filter={filter}
                    active={activeEnergy === filter.key}
                    onClick={() => onEnergyChange(filter.key as any)}
                  />
                  </div>
                ))}
              </div>
            </div>

            {/* Media Type Filters */}
            <div className="p-6 pt-0">
              <div className="mb-4">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">Content Format</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Choose the type of media you want to see</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {mediaFilters.map((filter) => (
                  <div key={filter.key}>
                  <MediaFilterCard
                    filter={filter}
                    active={activeMediaType === filter.key}
                    onClick={() => onMediaTypeChange(filter.key as any)}
                  />
                  </div>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => { 
                    onMediaTypeChange('all'); 
                    onEnergyChange('all'); 
                  }}
                  className="w-full py-2 px-4 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-medium text-sm rounded-xl transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const QuickFilterChip = ({ 
  label, 
  active, 
  onClick, 
  variant = 'primary',
  className = '' 
}: { 
  label: string; 
  active: boolean; 
  onClick: () => void; 
  variant?: 'primary' | 'secondary';
  className?: string;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 border ${
      active
        ? variant === 'primary'
          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
          : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
        : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 ${className}`
    }`}
  >
    {label}
  </button>
);

const EnergyFilterCard = ({ 
  filter, 
  active, 
  onClick 
}: { 
  filter: any; 
  active: boolean; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
      active
        ? `${filter.bgColor} border-current ${filter.textColor} shadow-sm`
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
    }`}
  >
    <div className="flex items-start gap-3">
      <div className={`text-2xl transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
        {filter.icon}
      </div>
      <div className="flex-1 min-w-0">
        <h5 className="font-semibold text-sm mb-1">{filter.label}</h5>
        <p className="text-xs opacity-75 leading-relaxed">{filter.description}</p>
      </div>
    </div>
  </button>
);

const MediaFilterCard = ({ 
  filter, 
  active, 
  onClick 
}: { 
  filter: any; 
  active: boolean; 
  onClick: () => void; 
}) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-xl border-2 transition-all duration-200 text-center group ${
      active
        ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-300 dark:border-indigo-700 text-indigo-700 dark:text-indigo-400 shadow-sm'
        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-400'
    }`}
  >
    <div className={`text-xl mb-2 transition-transform duration-200 ${active ? 'scale-110' : 'group-hover:scale-105'}`}>
      {filter.icon}
    </div>
    <h5 className="font-semibold text-xs mb-1">{filter.label}</h5>
    <p className="text-xs opacity-75">{filter.description}</p>
  </button>
);

export default FeedFilters;
