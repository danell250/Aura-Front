import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { PrivacyService, PrivacySettings as PrivacySettingsType } from '../services/privacyService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PrivacySettingsProps {
  user: User;
  onClose: () => void;
  onSettingsUpdate?: (settings: PrivacySettingsType) => void;
}

const PrivacySettings: React.FC<PrivacySettingsProps> = ({ user, onClose, onSettingsUpdate }) => {
  const [settings, setSettings] = useState<PrivacySettingsType>(PrivacyService.getDefaultPrivacySettings());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPrivacySettings();
  }, [user.id]);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);
      const result = await PrivacyService.getPrivacySettings(user.id);
      if (result.success && result.data) {
        setSettings(result.data);
      } else {
        setError(result.error || 'Failed to load privacy settings');
      }
    } catch (error) {
      setError('Failed to load privacy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key: keyof PrivacySettingsType, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setError(null);
    setSuccessMessage(null);
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const result = await PrivacyService.updatePrivacySettings(user.id, settings);
      if (result.success && result.data) {
        setSettings(result.data);
        setSuccessMessage('Privacy settings updated successfully!');
        onSettingsUpdate?.(result.data);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        setError(result.error || 'Failed to update privacy settings');
      }
    } catch (error) {
      setError('Failed to update privacy settings');
    } finally {
      setSaving(false);
    }
  };

  const SettingToggle: React.FC<{
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    icon?: string;
  }> = ({ label, description, checked, onChange, icon }) => (
    <div className="flex items-start justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          {icon && <span className="text-lg">{icon}</span>}
          <h3 className="font-bold text-slate-900 dark:text-white">{label}</h3>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">{description}</p>
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
          checked ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );

  const SettingSelect: React.FC<{
    label: string;
    description: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
    icon?: string;
  }> = ({ label, description, value, options, onChange, icon }) => (
    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
      <div className="flex items-center gap-3 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <h3 className="font-bold text-slate-900 dark:text-white">{label}</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{description}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full mx-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-slate-600 dark:text-slate-400">Loading privacy settings...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white">Privacy Settings</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Control how others can interact with you and your content
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
              <p className="text-red-600 dark:text-red-400 text-sm font-medium">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-medium">{successMessage}</p>
            </div>
          )}

          <div className="space-y-6">
            {/* Discovery & Visibility */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🔍</span>
                Discovery & Visibility
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="🔎"
                  label="Show Profile in Search"
                  description="Allow others to find your profile in search results"
                  checked={settings.showInSearch}
                  onChange={(checked) => handleSettingChange('showInSearch', checked)}
                />
                
                <SettingToggle
                  icon="🟢"
                  label="Show Online Status"
                  description="Display when you're active on the platform"
                  checked={settings.showOnlineStatus}
                  onChange={(checked) => handleSettingChange('showOnlineStatus', checked)}
                />
                
                <SettingToggle
                  icon="👁️"
                  label="Show Profile Views"
                  description="Let others see who viewed their profile"
                  checked={settings.showProfileViews}
                  onChange={(checked) => handleSettingChange('showProfileViews', checked)}
                />

                <SettingSelect
                  icon="🌐"
                  label="Profile Visibility"
                  description="Who can see your full profile"
                  value={settings.profileVisibility}
                  options={[
                    { value: 'public', label: 'Everyone' },
                    { value: 'friends', label: 'Friends Only' },
                    { value: 'private', label: 'Only Me' }
                  ]}
                  onChange={(value) => handleSettingChange('profileVisibility', value)}
                />
              </div>
            </div>

            {/* Interactions */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">💬</span>
                Interactions
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="🏷️"
                  label="Allow Tagging"
                  description="Let others tag you in posts and comments"
                  checked={settings.allowTagging}
                  onChange={(checked) => handleSettingChange('allowTagging', checked)}
                />

                <SettingSelect
                  icon="💌"
                  label="Direct Messages"
                  description="Who can send you direct messages"
                  value={settings.allowDirectMessages}
                  options={[
                    { value: 'everyone', label: 'Everyone' },
                    { value: 'friends', label: 'Friends Only' },
                    { value: 'none', label: 'No One' }
                  ]}
                  onChange={(value) => handleSettingChange('allowDirectMessages', value)}
                />
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🔔</span>
                Notifications
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="📱"
                  label="Push Notifications"
                  description="Receive push notifications on your device"
                  checked={settings.pushNotifications}
                  onChange={(checked) => handleSettingChange('pushNotifications', checked)}
                />
              </div>
            </div>

            {/* Data & Analytics */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📊</span>
                Data & Analytics
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="📈"
                  label="Analytics Consent"
                  description="Allow anonymous usage analytics to improve the platform"
                  checked={settings.analyticsConsent}
                  onChange={(checked) => handleSettingChange('analyticsConsent', checked)}
                />

                <SettingToggle
                  icon="🎯"
                  label="Activity Tracking"
                  description="Track your activity to personalize your experience"
                  checked={settings.activityTracking}
                  onChange={(checked) => handleSettingChange('activityTracking', checked)}
                />

                <SettingToggle
                  icon="📍"
                  label="Location Tracking"
                  description="Use your location for location-based features"
                  checked={settings.locationTracking}
                  onChange={(checked) => handleSettingChange('locationTracking', checked)}
                />
              </div>
            </div>

            {/* Marketing & Ads */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📢</span>
                Marketing & Advertising
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="📬"
                  label="Marketing Communications"
                  description="Receive marketing emails and updates"
                  checked={settings.marketingConsent}
                  onChange={(checked) => handleSettingChange('marketingConsent', checked)}
                />

                <SettingToggle
                  icon="🎯"
                  label="Personalized Ads"
                  description="Show ads based on your interests and activity"
                  checked={settings.personalizedAds}
                  onChange={(checked) => handleSettingChange('personalizedAds', checked)}
                />

                <SettingToggle
                  icon="🤝"
                  label="Third-Party Sharing"
                  description="Share anonymized data with trusted partners"
                  checked={settings.thirdPartySharing}
                  onChange={(checked) => handleSettingChange('thirdPartySharing', checked)}
                />
              </div>
            </div>

            {/* Data Processing */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">🛡️</span>
                Data Processing
              </h3>
              <div className="space-y-4">
                <SettingToggle
                  icon="✅"
                  label="Data Processing Consent"
                  description="Allow processing of your data for core platform features"
                  checked={settings.dataProcessingConsent}
                  onChange={(checked) => handleSettingChange('dataProcessingConsent', checked)}
                />
              </div>
            </div>

            {/* Data Export & Rights */}
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-xl">📦</span>
                Your Data Rights
              </h3>
              <div className="space-y-4">
                {/* Data Export */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">📥</span>
                        <h4 className="font-bold text-blue-900 dark:text-blue-100">Export Your Data</h4>
                      </div>
                      <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                        Download a complete copy of your personal data including profile information, posts, acquaintances, and privacy settings.
                      </p>
                      <div className="text-xs text-blue-700 dark:text-blue-300 mb-4">
                        <strong>Data Included:</strong>
                        <br />• Personal information and profile data
                        <br />• Account settings and preferences  
                        <br />• Posts, comments, and reactions
                        <br />• Acquaintances and blocked users
                        <br />• Privacy settings and consent records
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const doc = new jsPDF();
                      
                      // Header
                      doc.setFontSize(22);
                      doc.setTextColor(16, 185, 129); // Emerald 600
                      doc.text('Aura Social', 14, 22);
                      
                      doc.setFontSize(16);
                      doc.setTextColor(33, 41, 54); // Slate 800
                      doc.text('Personal Data Export', 14, 32);
                      
                      doc.setFontSize(10);
                      doc.setTextColor(100, 116, 139); // Slate 500
                      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 40);
                      doc.text(`User ID: ${user.id}`, 14, 45);
                      
                      // Line separator
                      doc.setDrawColor(226, 232, 240); // Slate 200
                      doc.setLineWidth(0.5);
                      doc.line(14, 50, 196, 50);
                      
                      // Profile Section
                      doc.setFontSize(14);
                      doc.setTextColor(15, 23, 42); // Slate 900
                      doc.text('Profile Information', 14, 60);
                      
                      const profileData = [
                        ['Full Name', `${user.firstName} ${user.lastName}`],
                        ['Display Name', user.name],
                        ['Handle', user.handle],
                        ['Bio', user.bio || 'N/A'],
                        ['Email', user.email || 'N/A'],
                        ['Phone', user.phone || 'N/A'],
                        ['Country', user.country || 'N/A'],
                        ['Industry', user.industry || 'N/A'],
                        ['Company Name', user.companyName || 'N/A'],
                        ['Company Website', user.companyWebsite || 'N/A'],
                        ['Trust Score', `${user.trustScore} / 100`],
                        ['Aura Credits', user.auraCredits.toString()],
                        ['Account Type', user.isCompany ? 'Business' : 'Personal'],
                        ['Date of Birth', user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A']
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
                      
                      // Privacy Settings Section
                      const finalY = (doc as any).lastAutoTable.finalY || 65;
                      
                      // Check if we need a new page
                      if (finalY > 220) {
                        doc.addPage();
                        doc.text('Privacy Configuration', 14, 20);
                      } else {
                        doc.setFontSize(14);
                        doc.setTextColor(15, 23, 42);
                        doc.text('Privacy Configuration', 14, finalY + 15);
                      }
                      
                      const privacyData = Object.entries(settings)
                        .filter(([key]) => key !== 'id' && key !== 'userId' && key !== 'updatedAt')
                        .map(([key, value]) => {
                          // Format key from camelCase to Title Case
                          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                          return [label, typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value)];
                        });

                      autoTable(doc, {
                        startY: finalY > 220 ? 25 : finalY + 20,
                        head: [['Setting', 'Value']],
                        body: privacyData,
                        theme: 'grid',
                        headStyles: { 
                          fillColor: [59, 130, 246], // Blue 500
                          textColor: 255,
                          fontStyle: 'bold'
                        },
                        styles: { 
                          fontSize: 10,
                          cellPadding: 6,
                          lineColor: [226, 232, 240]
                        },
                        alternateRowStyles: {
                          fillColor: [239, 246, 255] // Blue 50
                        }
                      });

                      // Footer
                      const pageCount = doc.getNumberOfPages();
                      for(let i = 1; i <= pageCount; i++) {
                        doc.setPage(i);
                        doc.setFontSize(8);
                        doc.setTextColor(148, 163, 184); // Slate 400
                        doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
                        doc.text(`© ${new Date().getFullYear()} Aura Social - Confidential Personal Data Export`, 14, 285);
                      }

                      doc.save(`aura-data-export-${user.handle}-${new Date().toISOString().split('T')[0]}.pdf`);
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>📦</span>
                    Export PDF Report
                  </button>
                </div>

                {/* Data Deletion */}
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-200 dark:border-red-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg">🗑️</span>
                        <h4 className="font-bold text-red-900 dark:text-red-100">Delete All Data</h4>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="text-xs text-red-700 dark:text-red-300 mb-4">
                        <strong>This will delete:</strong>
                        <br />• Your profile and account information
                        <br />• All posts, comments, and reactions
                        <br />• Messages and conversations
                        <br />• Acquaintances and social data
                        <br />• Privacy settings and preferences
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // In production, this would open a confirmation modal
                      alert('Account deletion feature would be implemented here with proper confirmation flow.');
                    }}
                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>⚠️</span>
                    Request Account Deletion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Last updated: {new Date(settings.updatedAt).toLocaleDateString()}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveSettings}
                disabled={saving}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacySettings;
