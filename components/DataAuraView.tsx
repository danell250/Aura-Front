
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { User, Post } from '../types';
import { geminiService } from '../services/gemini';
import Logo from './Logo';
import { BACKEND_URL } from '../constants';
import { apiFetch } from '../utils/api';
import { UserService } from '../services/userService';

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

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showOnlineStatus: boolean;
  allowDirectMessages: 'everyone' | 'friends' | 'none';
  showProfileViews: boolean;
  allowTagging: boolean;
  showInSearch: boolean;
  dataProcessingConsent: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  thirdPartySharing: boolean;
  locationTracking: boolean;
  activityTracking: boolean;
  personalizedAds: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
}

const DataAuraView: React.FC<DataAuraViewProps> = ({ 
  currentUser, allUsers, posts, onBack, onPurchaseGlow, onClearData, onViewProfile, onOpenCreditStore
}) => {
  const [insight, setInsight] = useState<string>('Calibrating neural frequencies...');
  const [loading, setLoading] = useState(true);
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings | null>(null);
  const [showPrivacySettings, setShowPrivacySettings] = useState(false);
  const [showDataExport, setShowDataExport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [profileViewIds, setProfileViewIds] = useState<string[]>(currentUser.profileViews || []);

  useEffect(() => {
    const getInsight = async () => {
      const res = await geminiService.analyzeDataAura(currentUser, posts);
      setInsight(res);
      setLoading(false);
    };
    getInsight();
    loadPrivacySettings();
    loadProfileViews();
  }, [currentUser, posts]);

  const loadPrivacySettings = async () => {
    try {
      const response = await apiFetch(`/users/${currentUser.id}/privacy-settings`);
      if (response.ok) {
        const data = await response.json();
        setPrivacySettings(data.data);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
      // Set default settings
      setPrivacySettings({
        profileVisibility: 'public',
        showOnlineStatus: true,
        allowDirectMessages: 'everyone',
        showProfileViews: true,
        allowTagging: true,
        showInSearch: true,
        dataProcessingConsent: true,
        marketingConsent: false,
        analyticsConsent: true,
        thirdPartySharing: false,
        locationTracking: false,
        activityTracking: true,
        personalizedAds: false,
        emailNotifications: true,
        pushNotifications: true
      });
    }
  };

  const loadProfileViews = async () => {
    try {
      const result = await UserService.getUserById(currentUser.id);
      if (result.success && result.user) {
        setProfileViewIds(result.user.profileViews || []);
      } else {
        setProfileViewIds(currentUser.profileViews || []);
      }
    } catch (error) {
      console.error('Failed to load profile views:', error);
      setProfileViewIds(currentUser.profileViews || []);
    }
  };

  const updatePrivacySetting = async (key: keyof PrivacySettings, value: any) => {
    if (!privacySettings) return;

    const updatedSettings = { ...privacySettings, [key]: value };
    setPrivacySettings(updatedSettings);

    try {
      await apiFetch(`/users/${currentUser.id}/privacy-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [key]: value })
      });
    } catch (error) {
      console.error('Failed to update privacy setting:', error);
      // Revert on error
      setPrivacySettings(privacySettings);
    }
  };

  const exportPrivacyData = async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129);
      doc.text('Aura Social', 14, 22);

      doc.setFontSize(16);
      doc.setTextColor(33, 41, 54);
      doc.text('Personal Data Export', 14, 32);

      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
      doc.text(`User ID: ${currentUser.id}`, 14, 45);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(14, 50, 196, 50);

      doc.setFontSize(14);
      doc.setTextColor(15, 23, 42);
      doc.text('Profile Information', 14, 60);

      const profileData = [
        ['Display Name', currentUser.name],
        ['Handle', currentUser.handle],
        ['Email', currentUser.email || 'N/A'],
        ['Phone', currentUser.phone || 'N/A'],
        ['Bio', currentUser.bio || 'N/A'],
        ['Industry', currentUser.industry || 'N/A'],
        ['Company Name', currentUser.companyName || 'N/A'],
        ['Trust Score', `${currentUser.trustScore} / 100`],
        ['Aura Credits', String(currentUser.auraCredits)],
        ['Account Type', currentUser.isCompany ? 'Business' : 'Personal'],
        ['Date of Birth', currentUser.dob ? new Date(currentUser.dob).toLocaleDateString() : 'N/A'],
        ['Active Glow', currentUser.activeGlow || 'None'],
        ['Total Posts', String(posts.length)],
        ['Acquaintances', String(currentUser.acquaintances?.length || 0)],
        ['Blocked Users', String(currentUser.blockedUsers?.length || 0)]
      ];

      autoTable(doc, {
        startY: 65,
        head: [['Field', 'Value']],
        body: profileData,
        theme: 'grid',
        headStyles: {
          fillColor: [16, 185, 129],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 6,
          lineColor: [226, 232, 240]
        },
        alternateRowStyles: {
          fillColor: [241, 245, 249]
        }
      });

      let finalY = (doc as any).lastAutoTable?.finalY || 65;

      if (finalY > 220) {
        doc.addPage();
        finalY = 20;
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Privacy Configuration', 14, finalY);
        finalY += 5;
      } else {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.text('Privacy Configuration', 14, finalY + 15);
        finalY = finalY + 20;
      }

      const settingsSource =
        privacySettings ||
        {
          profileVisibility: 'public',
          showOnlineStatus: true,
          allowDirectMessages: 'everyone',
          showProfileViews: true,
          allowTagging: true,
          showInSearch: true,
          dataProcessingConsent: true,
          marketingConsent: false,
          analyticsConsent: true,
          thirdPartySharing: false,
          locationTracking: false,
          activityTracking: true,
          personalizedAds: false,
          pushNotifications: true
        };

      const privacyData = Object.entries(settingsSource).map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        const formattedValue =
          typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
        return [label, formattedValue];
      });

      autoTable(doc, {
        startY: finalY,
        head: [['Setting', 'Value']],
        body: privacyData,
        theme: 'grid',
        headStyles: {
          fillColor: [59, 130, 246],
          textColor: 255,
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 6,
          lineColor: [226, 232, 240]
        },
        alternateRowStyles: {
          fillColor: [239, 246, 255]
        }
      });

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
        doc.text(
          `© ${new Date().getFullYear()} Aura Social - Confidential Personal Data Export`,
          14,
          285
        );
      }

      doc.save(
        `aura-data-export-${currentUser.handle}-${new Date()
          .toISOString()
          .split('T')[0]}.pdf`
      );

      alert('✅ Your privacy data PDF has been exported successfully!');
    } catch (error) {
      console.error('Failed to export privacy data:', error);
      alert('❌ Failed to export privacy data. Please try again.');
    } finally {
      setIsExporting(false);
      setShowDataExport(false);
    }
  };

  const clearAllData = async () => {
    if (deleteConfirmation !== 'CONFIRM_DELETE_ALL_DATA') {
      alert('Please type the exact confirmation code to proceed.');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiFetch(`/users/${currentUser.id}/clear-data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          confirmationCode: deleteConfirmation,
          reason: 'User requested data deletion via Privacy & Data panel'
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(`✅ ${data.message}

Data types deleted:
${data.dataTypes.join('\n')}`);
        
        // Clear session and redirect to login
        localStorage.removeItem('aura_session');
        sessionStorage.clear();
        window.location.href = '/';
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Failed to clear data:', error);
      alert('❌ Failed to clear data. Please try again or contact support.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteConfirmation('');
    }
  };

  const observers = (profileViewIds || [])
    .map(id => allUsers.find(u => u.id === id))
    .filter((u): u is User => u !== undefined);

  const stats = [
    { label: 'Acquaintances', value: currentUser.acquaintances?.length || 0 },
    { label: 'Radiance Generated', value: posts.reduce((acc, p) => acc + p.radiance, 0) },
    { label: 'Total Posts', value: posts.length },
    { label: 'Trust Calibration', value: `${currentUser.trustScore}%` }
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
                <span className="text-2xl">Neural Credits</span>
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
              <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{s.value}</p>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-slate-100 dark:border-slate-800 pt-10">
          <div className="flex items-center gap-3 mb-8">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100">Privacy Insights</h3>
          </div>
          <div className={`p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-[2.5rem] border border-emerald-100/50 dark:border-emerald-800/30 relative overflow-hidden min-h-[120px] ${loading ? 'animate-pulse' : ''}`}>
             <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed italic">"{insight}"</p>
             <div className="absolute top-0 right-0 p-4 opacity-5"><Logo size="lg" showText={false} /></div>
          </div>
        </div>
      </div>

      {/* Privacy Controls */}
      <div className="grid md:grid-cols-3 gap-8 mb-8">
        {/* Privacy Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
            Privacy Controls
          </h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 leading-relaxed">
            Manage your privacy settings and data preferences.
          </p>
          <button 
            onClick={() => setShowPrivacySettings(true)}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
          >
            Manage Settings
          </button>
        </div>

        {/* Data Export */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
            Data Export
          </h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 leading-relaxed">
            Download a complete copy of your personal data.
          </p>
          <button 
            onClick={() => setShowDataExport(true)}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg"
          >
            Export Data
          </button>
        </div>

        {/* Profile Viewers */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-slate-100 mb-6 flex items-center gap-3">
            Profile Viewers
          </h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 leading-relaxed">
            Recent visitors to your profile.
          </p>
          <div className="space-y-3 max-h-[200px] overflow-y-auto">
            {observers.length === 0 ? (
              <div className="py-6 text-center bg-slate-50 dark:bg-slate-800 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No recent viewers</p>
              </div>
            ) : observers.slice(0, 3).map(observer => (
              <div key={observer.id} onClick={() => onViewProfile(observer.id)} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 group hover:border-emerald-200 dark:hover:border-emerald-800 transition-all cursor-pointer">
                <img src={observer.avatar} className="w-8 h-8 rounded-lg object-contain bg-slate-50 dark:bg-slate-800" alt="" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight truncate">{observer.name}</p>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest truncate">{observer.handle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Glow Enhancement */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] p-10 border border-slate-200 dark:border-slate-800 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-8 flex items-center gap-3">Enhance My Presence</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-8 leading-relaxed">Spend Neural Credits to unlock professional profile glows.</p>
          <div className="space-y-4">
            <GlowOption name="Emerald Brilliance" price={100} color="bg-emerald-500" onClick={() => onPurchaseGlow('emerald')} />
            <GlowOption name="Cyan Frequency" price={250} color="bg-cyan-500" onClick={() => onPurchaseGlow('cyan')} />
            <GlowOption name="Amber Resonance" price={500} color="bg-amber-500" onClick={() => onPurchaseGlow('amber')} />
          </div>
        </div>

        {/* Data Sovereignty */}
        <div className="bg-rose-50 dark:bg-rose-950/10 rounded-[3rem] p-10 border border-rose-100 dark:border-rose-900/30 shadow-xl">
          <h3 className="text-sm font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 mb-8 flex items-center gap-3">Data Sovereignty</h3>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">Execute a total reset of your digital footprint on the network. This action cannot be reversed.</p>
          <button 
            onClick={() => setShowDeleteConfirm(true)} 
            className="w-full py-5 bg-rose-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-xl shadow-rose-200 dark:shadow-rose-900/20 active:scale-[0.96]"
          >
            Clear My Data
          </button>
          <p className="text-[9px] font-bold text-rose-400 dark:text-rose-500 uppercase tracking-widest mt-6 text-center">Protocol 12-X Compliant</p>
        </div>
      </div>

      {/* Privacy Settings Modal */}
      {showPrivacySettings && (
        <PrivacySettingsModal 
          settings={privacySettings || {
            profileVisibility: 'public',
            showOnlineStatus: true,
            allowDirectMessages: 'everyone',
            showProfileViews: true,
            allowTagging: true,
            showInSearch: true,
            dataProcessingConsent: true,
            marketingConsent: false,
            analyticsConsent: true,
            thirdPartySharing: false,
            locationTracking: false,
            activityTracking: true,
            personalizedAds: false,
            emailNotifications: true,
            pushNotifications: true
          }}
          onUpdate={updatePrivacySetting}
          onClose={() => setShowPrivacySettings(false)}
        />
      )}

      {/* Data Export Modal */}
      {showDataExport && (
        <DataExportModal 
          onExport={exportPrivacyData}
          onClose={() => setShowDataExport(false)}
          isExporting={isExporting}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal 
          onConfirm={clearAllData}
          onClose={() => setShowDeleteConfirm(false)}
          confirmationText={deleteConfirmation}
          onConfirmationChange={setDeleteConfirmation}
          isDeleting={isDeleting}
        />
      )}
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

const PrivacySettingsModal = ({ settings, onUpdate, onClose }: any) => (
  <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Privacy Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      <div className="p-6 space-y-6">
        <SettingToggle 
          label="Show Profile in Search" 
          description="Allow others to find your profile in search results"
          value={settings.showInSearch} 
          onChange={(value) => onUpdate('showInSearch', value)} 
        />
        <SettingToggle 
          label="Show Online Status" 
          description="Display when you're active on the platform"
          value={settings.showOnlineStatus} 
          onChange={(value) => onUpdate('showOnlineStatus', value)} 
        />
        <SettingToggle 
          label="Show Profile Views" 
          description="Let others see who viewed their profile"
          value={settings.showProfileViews} 
          onChange={(value) => onUpdate('showProfileViews', value)} 
        />
        <SettingToggle 
          label="Allow Tagging" 
          description="Let others tag you in posts and comments"
          value={settings.allowTagging} 
          onChange={(value) => onUpdate('allowTagging', value)} 
        />
        <SettingToggle 
          label="Analytics Consent" 
          description="Allow anonymous usage analytics to improve the platform"
          value={settings.analyticsConsent} 
          onChange={(value) => onUpdate('analyticsConsent', value)} 
        />
      </div>
    </div>
  </div>
);

const SettingToggle = ({ label, description, value, onChange }: any) => (
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">{label}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{description}</p>
    </div>
    <button
      onClick={() => onChange(!value)}
      className={`ml-4 relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        value ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          value ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const DataExportModal = ({ onExport, onClose, isExporting }: any) => (
  <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export Your Data</h3>
      </div>
      <div className="p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Download a complete copy of your personal data including profile information, posts, acquaintances, and privacy settings.
        </p>
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-slate-900 dark:text-white text-sm mb-2">Data Included:</h4>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Personal information and profile data</li>
            <li>• Account settings and preferences</li>
            <li>• Posts, comments, and reactions</li>
            <li>• Acquaintances and blocked users</li>
            <li>• Privacy settings and consent records</li>
          </ul>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onExport}
            disabled={isExporting}
            className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

const DeleteConfirmModal = ({ onConfirm, onClose, confirmationText, onConfirmationChange, isDeleting }: any) => (
  <div className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg">
      <div className="p-6 border-b border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-rose-600 dark:text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-rose-900 dark:text-rose-100">Delete All Data</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          This will permanently delete all your data including your profile, posts, messages, and acquaintances. This action cannot be undone.
        </p>
        <div className="bg-rose-50 dark:bg-rose-950/20 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-rose-900 dark:text-rose-100 mb-2">
            Type "CONFIRM_DELETE_ALL_DATA" to proceed:
          </p>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => onConfirmationChange(e.target.value)}
            className="w-full px-3 py-2 border border-rose-200 dark:border-rose-800 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
            placeholder="Type confirmation code..."
          />
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 px-4 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting || confirmationText !== 'CONFIRM_DELETE_ALL_DATA'}
            className="flex-1 py-3 px-4 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                Deleting...
              </>
            ) : (
              'Delete All Data'
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default DataAuraView;
