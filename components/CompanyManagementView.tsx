
import React, { useState } from 'react';
import { User } from '../types';

interface CompanyManagementViewProps {
  currentUser: User;
  onUpdate: (updates: Partial<User>) => void;
  onBack: () => void;
}

const CompanyManagementView: React.FC<CompanyManagementViewProps> = ({ currentUser, onUpdate, onBack }) => {
  const [form, setForm] = useState({
    companyName: currentUser.companyName || currentUser.name,
    industry: currentUser.industry || 'Technology',
    employeeCount: currentUser.employeeCount || 1,
    bio: currentUser.bio || ''
  });

  const handleSave = () => {
    onUpdate({
      ...form,
      isCompany: true
    });
    alert("Company configuration updated successfully.");
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl border border-slate-200 overflow-hidden relative mb-8">
        <div className="absolute top-0 right-0 p-8">
          <button 
            onClick={onBack}
            className="px-6 py-2 bg-slate-50 text-slate-400 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-slate-100 transition-all border border-slate-100"
          >
            Back to Feed
          </button>
        </div>

        <div className="flex items-center gap-6 mb-12">
          <div className="w-24 h-24 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white text-3xl font-black shadow-xl">
            {form.companyName.charAt(0)}
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Company Dashboard</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-1">
              Authorized Portal for {form.companyName}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <StatCard title="Page Views" value="2.4k" trend="+12%" />
          <StatCard title="Engagement" value="18.5%" trend="+2.4%" />
          <StatCard title="Acquaintances" value="482" trend="+34" />
        </div>

        <div className="space-y-8">
          <div className="border-t border-slate-100 pt-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 mb-6">Identity Configuration</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Legal Entity Name</label>
                <input 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-400 transition-all text-sm font-bold"
                  value={form.companyName}
                  onChange={e => setForm({...form, companyName: e.target.value})}
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Primary Industry</label>
                <select 
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-emerald-400 transition-all text-sm font-bold appearance-none"
                  value={form.industry}
                  onChange={e => setForm({...form, industry: e.target.value})}
                >
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Marketing</option>
                  <option>Health</option>
                  <option>Manufacturing</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2 block ml-1">Company Value Proposition (Bio)</label>
            <textarea 
              className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl h-32 outline-none focus:border-emerald-400 transition-all text-sm font-medium resize-none"
              placeholder="Describe your company's mission and expertise..."
              value={form.bio}
              onChange={e => setForm({...form, bio: e.target.value})}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              onClick={handleSave}
              className="px-10 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl hover:bg-black transition-all"
            >
              Update Company Profile
            </button>
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 rounded-[2.5rem] p-10 border border-emerald-100 border-dashed">
        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900 mb-4">Enterprise Features</h3>
        <p className="text-sm text-emerald-700 font-medium leading-relaxed mb-6">
          Your company profile is active. You can now post jobs, launch priority advertising campaigns from the Business Hub, and view advanced network insights.
        </p>
        <div className="flex gap-4">
           <FeatureBadge icon="⚡" text="Ad Retargeting" />
           <FeatureBadge icon="📈" text="Advanced CRM" />
           <FeatureBadge icon="🛡️" text="Brand Protection" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, trend }: { title: string, value: string, trend: string }) => (
  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
    <div className="flex items-baseline justify-between">
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">{trend}</span>
    </div>
  </div>
);

const FeatureBadge = ({ icon, text }: { icon: string, text: string }) => (
  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest text-emerald-600">
    <span>{icon}</span>
    <span>{text}</span>
  </div>
);

export default CompanyManagementView;
