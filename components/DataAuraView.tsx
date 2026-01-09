
import React, { useState, useEffect } from 'react';
import { User, Post } from '../types';
import { geminiService } from '../services/gemini';
import Logo from './Logo';

interface DataAuraViewProps {
  currentUser: User;
  allUsers: User[];
  posts: Post[];
  onBack: () => void;
  onPurchaseGlow: (glow: 'emerald' | 'cyan' | 'amber') => void;
  onClearData: () => void;
  onViewProfile: (userId: string) => void;
  onOpenCreditStore?: () => void;
}

const DataAuraView: React.FC<DataAuraViewProps> = ({ 
  currentUser, allUsers, posts, onBack, onPurchaseGlow, onClearData, onViewProfile, onOpenCreditStore
}) => {
  const [insight, setInsight] = useState<string>('Calibrating neural frequencies...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInsight = async () => {
      const res = await geminiService.analyzeDataAura(currentUser, posts);
      setInsight(res);
      setLoading(false);
    };
    getInsight();
  }, [currentUser, posts]);

  const observers = (currentUser.profileViews || [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is User => u !== undefined);

  const stats = [
    { label: 'Connections', value: currentUser.acquaintances?.length || 0, icon: '🤝' },
    { label: 'Radiance Generated', value: posts.reduce((acc, p) => acc + p.radiance, 0), icon: '✨' },
    { label: 'Total Posts', value: posts.length, icon: '📡' },
    { label: 'Trust Calibration', value: `${currentUser.trustScore}%`, icon: '🛡️' }
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
      <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-2xl relative overflow-hidden mb-8">
        <div className="absolute top-0 right-0 p-8">
          <button onClick={onBack} className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-900 hover:text-white transition-all">Exit Hub</button>
        </div>
        <div className="flex flex-col md:flex-row gap-10 items-start mb-14">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-white dark:border-slate-800 shadow-2xl transition-all duration-700 bg-slate-50 dark:bg-slate-800 ${currentUser.activeGlow === 'emerald' ? 'ring-8 ring-emerald-500/20 shadow-emerald-500/30' : currentUser.activeGlow === 'cyan' ? 'ring-8 ring-cyan-500/20 shadow-cyan-500/30' : currentUser.activeGlow === 'amber' ? 'ring-8 ring-amber-500/20 shadow-amber-500/30' : ''}`}>
              <img src={currentUser.avatar} className="w-full h-full object-contain" alt="" />
            </div>
            {currentUser.activeGlow !== 'none' && <div className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 shadow-sm animate-pulse">{currentUser.activeGlow} glow active</div>}
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-tighter">My Data Aura</h2>
            <p className="text-[11px] font-black text-emerald-600 uppercase tracking-[0.4em] mt-2">Privacy Transparency & Sovereignty</p>
            <div className="mt-8 flex items-center gap-6">
                <div onClick={onOpenCreditStore} className="bg-slate-900 dark:bg-slate-800 text-white px-8 py-4 rounded-3xl shadow-xl flex items-center gap-4 border border-white/5 cursor-pointer hover:scale-105 transition-transform">
                <span className="text-2xl">💎</span>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Neural Credits</p>
                  <p className="text-xl font-black">{currentUser?.auraCredits?.toLocaleString() || '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
          {stats.map((s, i) => (
            <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 text-center group hover:bg-white dark:hover:bg-slate-800 transition-all">
              <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">{s.icon}</span>
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
          <div className="flex items-center gap-3 mb-8">
            <span className="text-2xl">🧠</span>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Privacy Insights</h3>
          </div>
          <div className={`p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-800/30 relative overflow-hidden min-h-[120px] ${loading ? 'animate-pulse' : ''}`}>
             <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{insight}"</p>
             <div className="absolute top-0 right-0 p-4 opacity-5"><Logo size="lg" showText={false} /></div>
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-3"><span className="text-xl">🛰️</span> Recent Profile Viewers</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 leading-relaxed">People who have visited your profile recently.</p>
          <div className="space-y-4 max-h-[300px] overflow-y-auto no-scrollbar pr-2">
            {observers.length === 0 ? (<div className="py-10 text-center bg-slate-50 dark:bg-slate-800 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700"><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recent viewers</p></div>) : observers.map(observer => (
                <div key={observer.id} onClick={() => onViewProfile(observer.id)} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <img src={observer.avatar} className="w-10 h-10 rounded-xl object-contain bg-slate-50 dark:bg-slate-800" alt="" />
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{observer.name}</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{observer.handle}</p>
                    </div>
                  </div>
                  <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                </div>
              ))
            }
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8 flex items-center gap-3"><span className="text-xl">🎨</span> Enhance My Presence</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 leading-relaxed">Spend Neural Credits to unlock professional profile glows.</p>
          <div className="space-y-4">
            <GlowOption name="Emerald Brilliance" price={100} color="bg-emerald-500" onClick={() => onPurchaseGlow('emerald')} />
            <GlowOption name="Cyan Frequency" price={250} color="bg-cyan-500" onClick={() => onPurchaseGlow('cyan')} />
            <GlowOption name="Amber Resonance" price={500} color="bg-amber-500" onClick={() => onPurchaseGlow('amber')} />
          </div>
        </div>
      </div>
      <div className="bg-rose-50 dark:bg-rose-950/10 rounded-[3rem] p-10 border border-rose-100 dark:border-rose-900/30 shadow-xl">
        <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-8 flex items-center gap-3"><span className="text-xl">⚠️</span> Data Sovereignty</h3>
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Execute a total reset of your digital footprint on the network. This action cannot be reversed.</p>
        <button onClick={onClearData} className="w-full py-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-rose-900/20 active:scale-[0.96]">Clear My Data</button>
        <p className="text-[9px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest mt-6 text-center">Protocol 12-X Compliant</p>
      </div>
    </div>
  );
};

const GlowOption = ({ name, price, color, onClick }: any) => (
  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all">
    <div className="flex items-center gap-4">
      <div className={`w-8 h-8 rounded-xl ${color} shadow-lg shadow-current/20`}></div>
      <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{name}</p>
    </div>
    <button onClick={onClick} className="px-5 py-2.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-700 hover:bg-slate-900 hover:text-white transition-all">{price} Credits</button>
  </div>
);

export default DataAuraView;
