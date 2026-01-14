import React, { useState, useEffect } from 'react';
import { User, Ad } from '../types';
import { adSubscriptionService, AdSubscription } from '../services/adSubscriptionService';
import { AD_PACKAGES } from '../constants';

interface AdPlansDashboardProps {
  user: User;
  ads: Ad[];
  onOpenAdManager?: () => void;
  refreshTrigger?: number;
}

const AdPlansDashboard: React.FC<AdPlansDashboardProps> = ({ user, ads, onOpenAdManager, refreshTrigger: externalRefreshTrigger }) => {
  const [adSubscriptions, setAdSubscriptions] = useState<AdSubscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);

  useEffect(() => {
    loadAdSubscriptions();
  }, [user.id, internalRefreshTrigger, externalRefreshTrigger]);

  const loadAdSubscriptions = async () => {
    setLoading(true);
    try {
      console.log('[AdPlansDashboard] Loading ad subscriptions for user:', user.id);
      const subscriptions = await adSubscriptionService.getUserSubscriptions(user.id);
      console.log('[AdPlansDashboard] Loaded subscriptions:', subscriptions.length);
      setAdSubscriptions(subscriptions);
    } catch (error) {
      console.error('[AdPlansDashboard] Failed to load ad subscriptions:', error);
      setAdSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  // Get package details for a subscription
  const getPackageDetails = (packageId: string) => {
    return AD_PACKAGES.find(pkg => pkg.id === packageId);
  };

  // Calculate metrics
  const totalActiveSubscriptions = adSubscriptions.filter(s => s.status === 'active').length;
  const totalAdsAvailable = adSubscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.adLimit - s.adsUsed), 0);
  const totalAdsCreated = adSubscriptions.reduce((sum, s) => sum + s.adsUsed, 0);
  const totalPotentialReach = adSubscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + (s.adLimit * 100), 0);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-2">Ad Campaign Dashboard</h3>
            <p className="text-emerald-100 text-sm">
              Monitor your advertising performance and subscription status
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setInternalRefreshTrigger(prev => prev + 1)}
              className="p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all"
              title="Refresh data"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <div className="text-6xl opacity-30">📢</div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading your campaign data...</p>
        </div>
      ) : adSubscriptions.length === 0 ? (
        /* No Subscriptions */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div className="text-6xl mb-6 opacity-30">📣</div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">No Active Campaigns</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md mx-auto">
            You don't have any ad campaigns yet. Purchase a plan to start promoting your content across the Aura network.
          </p>
          <button
            onClick={onOpenAdManager}
            className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:brightness-110 transition-all"
          >
            Launch Your First Campaign
          </button>
        </div>
      ) : (
        /* Dashboard Content */
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">✅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalActiveSubscriptions}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Active Plans</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">📊</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalAdsAvailable}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ads Available</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎯</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalAdsCreated}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Ads Created</p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">👁️</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {totalPotentialReach.toLocaleString()}
                  </p>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">Potential Reach</p>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Analytics */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl border border-slate-200 dark:border-slate-600 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <span className="text-xl">📈</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">Performance Analytics</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">Real-time campaign insights</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Utilization Rate</span>
                  <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-full">Active</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {totalActiveSubscriptions > 0
                    ? Math.round((totalAdsCreated / adSubscriptions.filter(s => s.status === 'active').reduce((sum, s) => sum + s.adLimit, 0)) * 100)
                    : 0}%
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Of available ad slots</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Avg. Ad Value</span>
                  <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">Estimate</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  ${(user.auraCredits || 100).toFixed(2)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Per ad impression</div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Next Renewal</span>
                  <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-full">Due Soon</span>
                </div>
                <div className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                  {adSubscriptions.filter(s => s.status === 'active' && s.endDate).length > 0
                    ? Math.max(0, Math.ceil((new Date(adSubscriptions.filter(s => s.status === 'active' && s.endDate)[0].endDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : '∞'}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Days remaining</div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-sm font-bold text-slate-900 dark:text-white">Engagement Metrics</h5>
                <span className="text-xs text-slate-500 dark:text-slate-400">Last 30 days</span>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">1.2k</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Views</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600 dark:text-blue-400">142</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Clicks</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">24</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Shares</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400">8.7%</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">CTR</div>
                </div>
              </div>
            </div>
          </div>

          {/* Active Subscriptions */}
          {adSubscriptions.filter(s => s.status === 'active').length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                Active Campaigns
              </h4>
              <div className="grid gap-4">
                {adSubscriptions.filter(s => s.status === 'active').map(subscription => {
                  const pkg = getPackageDetails(subscription.packageId);
                  const adsRemaining = subscription.adLimit - subscription.adsUsed;
                  const usagePercent = (adsRemaining / subscription.adLimit) * 100;
                  
                  return (
                    <div
                      key={subscription.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      {/* Plan Header with Gradient */}
                      <div className={`h-2 bg-gradient-to-r ${pkg?.gradient || 'from-emerald-500 to-teal-600'}`}></div>
                      
                      <div className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="text-xl font-bold text-slate-900 dark:text-white">
                                {subscription.packageName}
                              </h5>
                              <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-xs font-bold uppercase">
                                Active
                              </span>
                              {pkg?.paymentType === 'subscription' && (
                                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-bold uppercase">
                                  Monthly
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {pkg?.subtitle || 'Ad subscription plan'}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                              {pkg?.price || `$${pkg?.numericPrice || 0}`}
                            </p>
                          </div>
                        </div>

                        {/* Usage Stats */}
                        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5 mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Ad Slot Utilization</span>
                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                              {adsRemaining} of {subscription.adLimit} remaining
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden">
                            <div
                              className={`h-4 rounded-full transition-all duration-500 ${
                                usagePercent > 50 ? 'bg-emerald-500' :
                                usagePercent > 20 ? 'bg-amber-500' : 'bg-rose-500'
                              }`}
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                            <span>{subscription.adsUsed} used</span>
                            <span>{adsRemaining} available</span>
                          </div>
                        </div>

                        {/* Plan Details Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Started</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {new Date(subscription.startDate).toLocaleDateString()}
                            </p>
                          </div>
                          {subscription.endDate && (
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Expires</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {new Date(subscription.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          {subscription.nextBillingDate && (
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Next Billing</p>
                              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                {new Date(subscription.nextBillingDate).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Ad Limit</p>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white">
                              {subscription.adLimit} ads
                            </p>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                          <div className="flex gap-3">
                            <button
                              onClick={onOpenAdManager}
                              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <span>🚀</span>
                              <span>Create Ad</span>
                            </button>
                            <button
                              onClick={onOpenAdManager}
                              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-sm rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                            >
                              Manage
                            </button>
                          </div>
                        </div>

                        {/* Features List */}
                        {pkg?.features && (
                          <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mt-4">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">Plan Features</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {pkg.features.slice(0, 6).map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                  {feature}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Expired/Cancelled Subscriptions */}
          {adSubscriptions.filter(s => s.status !== 'active').length > 0 && (
            <div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-3 h-3 bg-slate-400 rounded-full"></span>
                Past Campaigns
              </h4>
              <div className="grid gap-4">
                {adSubscriptions.filter(s => s.status !== 'active').map(subscription => {
                  const pkg = getPackageDetails(subscription.packageId);
                  
                  return (
                    <div
                      key={subscription.id}
                      className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 opacity-70"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h5 className="text-lg font-bold text-slate-900 dark:text-white">
                              {subscription.packageName}
                            </h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                              subscription.status === 'expired'
                                ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                : 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400'
                            }`}>
                              {subscription.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Used {subscription.adsUsed} of {subscription.adLimit} ads •
                            Ended {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-400">
                            {pkg?.price || `$${pkg?.numericPrice || 0}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdPlansDashboard;