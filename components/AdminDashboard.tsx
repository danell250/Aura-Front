import React from 'react';
import { User } from '../types';

interface AdminDashboardProps {
  allUsers: User[];
  onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ allUsers, onBack }) => {
  const totalUsers = allUsers.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative mb-8 transition-colors">
        <div className="absolute top-0 right-0 p-8">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-slate-50 dark:bg-slate-800 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-900 hover:text-white transition-all border border-slate-100 dark:border-slate-700"
          >
            Exit Terminal
          </button>
        </div>

        <div className="flex items-center gap-6 mb-12">
          <div className="w-20 h-20 aura-bg-gradient rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl shadow-emerald-200">
            🛡️
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">System Oversight</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Aura Global Network Statistics
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <AdminStatCard 
            title="Total Nodes" 
            value={totalUsers.toString()} 
            subtitle="Active Sync Entries"
            icon="🌐"
            color="emerald"
          />
          <AdminStatCard 
            title="System Pulse" 
            value="Optimal" 
            subtitle="Network Fidelity"
            icon="👤"
            color="emerald"
          />
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8 flex items-center gap-3">
            <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
            Network Audit Log
          </h3>
          
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-50 dark:border-slate-800">
                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Node Identity</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Sync Status</th>
                  <th className="pb-4 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Registration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {allUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-5">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-100 dark:border-slate-700" alt="" />
                        <div>
                          <p className="text-sm font-black text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-5">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Synchronized</span>
                      </div>
                    </td>
                    <td className="py-5">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{user.dob || 'System Legacy'}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      
      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 blur-[100px] -z-0"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h4 className="text-lg font-black uppercase tracking-widest mb-2">Network Health Protocol</h4>
            <p className="text-slate-400 font-medium text-sm max-w-xl leading-relaxed">
              Global synchronization is currently optimal. All node frequencies are operating within high-fidelity parameters. Security handshake protocols are 100% verified across all regional hubs.
            </p>
          </div>
          <div className="flex gap-4">
             <div className="text-center px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Latency</p>
                <p className="text-xl font-black text-emerald-400">14ms</p>
             </div>
             <div className="text-center px-6 py-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 mb-1">Uptime</p>
                <p className="text-xl font-black text-emerald-400">99.9%</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminStatCard = ({ title, value, subtitle, icon, color }: any) => {
  const colors = {
    emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-600 border-emerald-100',
    amber: 'from-amber-500/10 to-amber-600/5 text-amber-600 border-amber-100'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color as keyof typeof colors]} p-8 rounded-[2.5rem] border-2 shadow-sm transition-all hover:scale-105`}>
      <div className="flex justify-between items-start mb-6">
        <span className="text-3xl">{icon}</span>
        <span className="text-[10px] font-black bg-white/50 px-2 py-0.5 rounded uppercase tracking-widest border border-white/50">Pulse Log</span>
      </div>
      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{title}</h4>
      <div className="flex items-baseline gap-3">
        <p className="text-4xl font-black text-slate-900">{value}</p>
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{subtitle}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;