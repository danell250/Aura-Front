
import React from 'react';
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
  return (
    <div className="space-y-4 mb-8 px-2 animate-in fade-in duration-700">
      {/* Feed Vibe Selector */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 mb-4 ml-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-white tracking-tight">Feed Experience</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <VibeChip 
            label="✨ Global Pulse" 
            active={activeEnergy === 'all'} 
            onClick={() => onEnergyChange('all')}
            activeClass="bg-slate-900 dark:bg-emerald-600 text-white border-slate-900 dark:border-emerald-500"
          />
          <VibeChip 
            label="⚡ High Energy" 
            active={activeEnergy === EnergyType.HIGH_ENERGY} 
            onClick={() => onEnergyChange(EnergyType.HIGH_ENERGY)}
            activeClass="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
          />
          <VibeChip 
            label="🌿 Calm" 
            active={activeEnergy === EnergyType.CALM} 
            onClick={() => onEnergyChange(EnergyType.CALM)}
            activeClass="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
          />
          <VibeChip 
            label="💡 Deep Dive" 
            active={activeEnergy === EnergyType.DEEP_DIVE} 
            onClick={() => onEnergyChange(EnergyType.DEEP_DIVE)}
            activeClass="bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
          />
        </div>
      </div>

      {/* Content Type Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip label="Everything" active={activeMediaType === 'all'} onClick={() => onMediaTypeChange('all')} />
        <FilterChip label="Visuals" active={activeMediaType === 'image'} onClick={() => onMediaTypeChange('image')} />
        <FilterChip label="Motion" active={activeMediaType === 'video'} onClick={() => onMediaTypeChange('video')} />
        <FilterChip label="Knowledge" active={activeMediaType === 'document'} onClick={() => onMediaTypeChange('document')} />
        
        {(activeMediaType !== 'all' || activeEnergy !== 'all') && (
            <button 
              onClick={() => { onMediaTypeChange('all'); onEnergyChange('all'); }}
              className="text-xs font-semibold text-slate-500 hover:text-rose-500 px-3 py-2 rounded-xl transition-colors ml-auto"
            >
              Clear Filters
            </button>
          )}
      </div>
    </div>
  );
};

const VibeChip = ({ label, active, onClick, activeClass }: any) => (
  <button 
    onClick={onClick}
    className={`px-3 py-2.5 rounded-2xl text-[13px] font-semibold transition-all duration-200 border ${
      active 
        ? `${activeClass} shadow-sm` 
        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
    }`}
  >
    {label}
  </button>
);

const FilterChip = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 border whitespace-nowrap ${
      active 
        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm' 
        : 'bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-emerald-800'
    }`}
  >
    {label}
  </button>
);

export default FeedFilters;
