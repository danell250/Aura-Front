import React, { useEffect, useMemo, useState } from 'react';
import { User, Ad } from '../types';
import { adAnalyticsService, AdAnalytics, AdPerformanceMetrics, CampaignPerformance } from '../services/adAnalyticsService';
import { adSubscriptionService, AdSubscription } from '../services/adSubscriptionService';

interface AdAnalyticsPageProps {
  currentUser: User;
  ads: Ad[];
  onDeleteAd?: (id: string) => void | Promise<void>;
}

type AnalyticsTab = 'overview' | 'ads' | 'details';

const AdAnalyticsPage: React.FC<AdAnalyticsPageProps> = ({ currentUser, ads, onDeleteAd }) => {
  const card = 'bg-white rounded-2xl border border-slate-200 shadow-sm';
  const cardPad = 'p-5';
  const label =
    'text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.14em] sm:tracking-[0.18em] text-slate-500 whitespace-nowrap';
  const value = 'mt-2 text-2xl font-black text-slate-900';
  const sub = 'mt-1 text-xs text-slate-500';

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview');
  const [campaignPerformance, setCampaignPerformance] = useState<CampaignPerformance | null>(null);
  const [adPerformance, setAdPerformance] = useState<AdPerformanceMetrics[]>([]);
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [selectedAdAnalytics, setSelectedAdAnalytics] = useState<AdAnalytics | null>(null);
  const [loadingCampaign, setLoadingCampaign] = useState(false);
  const [loadingAds, setLoadingAds] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sortBy, setSortBy] = useState<'impressions' | 'clicks' | 'ctr' | 'spend' | 'roi'>('impressions');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paused' | 'completed'>('all');
  const [subscription, setSubscription] = useState<AdSubscription | null>(null);

  useEffect(() => {
    if (!currentUser.id) return;
    setLoadingCampaign(true);
    setLoadingAds(true);
    adAnalyticsService.getCampaignPerformance(currentUser.id).then(setCampaignPerformance).finally(() => {
      setLoadingCampaign(false);
    });
    adAnalyticsService.getUserAdPerformance(currentUser.id).then(setAdPerformance).finally(() => {
      setLoadingAds(false);
    });
  }, [currentUser.id]);

  useEffect(() => {
    if (!currentUser.id) return;

    (async () => {
      try {
        const sub = await adSubscriptionService.getActiveSubscription(currentUser.id);
        setSubscription(sub);
      } catch (e) {
        console.error('[AdAnalyticsPage] Failed to load active subscription', e);
        setSubscription(null);
      }
    })();
  }, [currentUser.id]);

  useEffect(() => {
    if (!selectedAdId) {
      setSelectedAdAnalytics(null);
      return;
    }
    setLoadingDetails(true);
    adAnalyticsService.getAdAnalytics(selectedAdId).then(setSelectedAdAnalytics).finally(() => {
      setLoadingDetails(false);
    });
  }, [selectedAdId]);

  const totalImpressions = campaignPerformance?.totalImpressions ?? adPerformance.reduce((sum, p) => sum + (p.impressions || 0), 0);
  const totalClicks = campaignPerformance?.totalClicks ?? adPerformance.reduce((sum, p) => sum + (p.clicks || 0), 0);
  const totalReach = campaignPerformance?.totalReach ?? Math.round(totalImpressions * 0.65);
  const totalEngagement = campaignPerformance?.totalEngagement ?? adPerformance.reduce((sum, p) => sum + (p.engagement || 0), 0);
  const totalSpend = campaignPerformance?.totalSpend ?? adPerformance.reduce((sum, p) => sum + (p.spend || 0), 0);
  const averageCTR = campaignPerformance?.averageCTR ?? (adPerformance.length > 0 ? adPerformance.reduce((sum, p) => sum + (p.ctr || 0), 0) / adPerformance.length : 0);
  const activeAdsCount = campaignPerformance?.activeAds ?? adPerformance.filter(p => p.status === 'active').length;
  const performanceScore = campaignPerformance?.performanceScore ?? 0;
  const remainingAds = subscription ? subscription.adLimit - subscription.adsUsed : null;
  const canCreate = remainingAds !== null && remainingAds > 0;

  const ctrRatio = averageCTR > 1 ? averageCTR / 100 : averageCTR;
  const formattedAverageCTR = (ctrRatio * 100).toFixed(2);
  const fatigueIndex = Math.min(100, totalImpressions > 0 ? ((totalImpressions - totalClicks) / Math.max(1, totalImpressions)) * 100 : 0);
  const momentumScore = Math.min(100, activeAdsCount * 10 + (totalClicks / Math.max(1, totalImpressions || 1)) * 50);
  const attentionHalfLifeDays = Math.max(1, Math.round(30 - momentumScore / 2));

  const nextAction =
    ctrRatio < 0.01
      ? 'Rewrite your headline: add outcome and a clear timeframe.'
      : fatigueIndex > 65
      ? 'Rotate your image or video today; creative fatigue is likely.'
      : momentumScore > 70
      ? 'Scale slowly by increasing reach or budget about 10–20%.'
      : 'Test a new CTA verb such as Book, Preview, Claim, or Watch.';

  const primaryAd = useMemo(() => {
    if (adPerformance.length === 0) {
      return ads.find(a => a.ownerId === currentUser.id) || null;
    }
    const topMetric = [...adPerformance].sort((a, b) => b.impressions - a.impressions)[0];
    return ads.find(a => a.id === topMetric.adId) || null;
  }, [ads, adPerformance, currentUser.id]);

  const adSummaries = useMemo(() => {
    const metricsById = new Map(adPerformance.map(m => [m.adId, m]));
    const myAds = ads.filter(a => a.ownerId === currentUser.id);

    return myAds.map(ad => {
      const m = metricsById.get(ad.id);
      return {
        id: ad.id,
        headline: ad.headline || 'Untitled Signal',
        status: (m?.status || ad.status || 'active') as 'active' | 'paused' | 'completed',
        createdAt: m?.createdAt ?? Date.now(),
        impressions: m?.impressions ?? 0,
        clicks: m?.clicks ?? 0,
        ctr: m?.ctr ?? 0,
        engagement: m?.engagement ?? 0,
        spend: m?.spend ?? 0,
        roi: m?.roi ?? 0
      };
    });
  }, [ads, adPerformance, currentUser.id]);

  const overviewSummaries = useMemo(() => {
    let list = adSummaries;
    if (statusFilter !== 'all') {
      list = list.filter(x => x.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      const aValue = (a as any)[sortBy] ?? 0;
      const bValue = (b as any)[sortBy] ?? 0;
      return bValue - aValue;
    });
  }, [adSummaries, sortBy, statusFilter]);

  const visibleAdPerformance = useMemo(() => {
    let list = adPerformance;
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }
    const sorted = [...list].sort((a, b) => {
      const aValue = (a[sortBy] as number | undefined) ?? 0;
      const bValue = (b[sortBy] as number | undefined) ?? 0;
      return bValue - aValue;
    });
    return sorted;
  }, [adPerformance, sortBy, statusFilter]);

  const selectedAd = useMemo(() => {
    if (!selectedAdId) return null;
    return ads.find(a => a.id === selectedAdId) || null;
  }, [ads, selectedAdId]);

  const isLoadingOverview = loadingCampaign || loadingAds;

  const hasData = adPerformance.length > 0 || totalImpressions > 0 || totalClicks > 0 || totalEngagement > 0;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl p-8 border border-slate-200 bg-white shadow-[0_20px_60px_-30px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 mb-2">
              AuraSocialConnect • Ad Intelligence
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">
              Campaign Analytics
            </h2>
            <p className="mt-3 text-sm md:text-base text-slate-500 max-w-xl">
              Monitor how your signals perform across the network with live reach, engagement, and efficiency insights.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-500">
              Active Signals
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900">
                {activeAdsCount}
              </span>
              <span className="text-sm text-slate-500">
                running
              </span>
            </div>
            {subscription ? (
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  {subscription.packageName}
                </p>
                <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                  {subscription.adsUsed}/{subscription.adLimit} ads used
                </p>
              </div>
            ) : (
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  No active plan
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Purchase a plan to unlock quota
                </p>
              </div>
            )}
            {campaignPerformance?.daysToNextExpiry != null && (
              <p className="text-[11px] font-semibold text-slate-500">
                Next expiry in <span className="font-bold">{campaignPerformance.daysToNextExpiry}</span> days
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-2 flex items-center gap-2 text-xs font-semibold">
        <button
          className={`flex-1 px-4 py-2 rounded-xl transition-all ${activeTab === 'overview' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-xl transition-all ${activeTab === 'ads' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          onClick={() => setActiveTab('ads')}
        >
          All Ads
        </button>
        <button
          className={`flex-1 px-4 py-2 rounded-xl transition-all ${activeTab === 'details' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          onClick={() => setActiveTab('details')}
        >
          Single Ad
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {isLoadingOverview && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
              <p className="text-sm text-slate-500 dark:text-slate-300">
                Loading analytics for {currentUser.name}...
              </p>
            </div>
          )}
          {!isLoadingOverview && !hasData && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-10 text-center">
              <div className="text-5xl mb-4">📡</div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                No campaign data yet
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Launch a signal to start seeing reach, engagement, and efficiency metrics in real time.
              </p>
            </div>
          )}
          {hasData && (
            <>
              {primaryAd && (
                <div className="sticky top-4 z-20">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-[0_25px_70px_-40px_rgba(0,0,0,0.35)] overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-500">
                          Your Posted Signal
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-900 line-clamp-1">
                          {primaryAd.headline}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-[0.2em]">
                          {primaryAd.status === 'active' ? 'Live' : 'Not Live'}
                        </span>
                        <a
                          href={primaryAd.ctaLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-2 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-800 transition"
                        >
                          {primaryAd.ctaText || 'View'}
                        </a>
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="text-xs text-slate-600 line-clamp-3">{primaryAd.description}</p>

                      <div className="mt-4 grid grid-cols-3 gap-3">
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Plan</p>
                          <p className="mt-1 text-sm font-black text-slate-900 line-clamp-1">
                            {primaryAd.subscriptionTier || 'Custom'}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Placement</p>
                          <p className="mt-1 text-sm font-black text-slate-900">Feed</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Badge</p>
                          <p className="mt-1 text-sm font-black text-amber-700">Gold Aura</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Impressions
                  </p>
                  <p className={value}>
                    {totalImpressions.toLocaleString()}
                  </p>
                  <p className={sub}>
                    Total views across all ads
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Clicks
                  </p>
                  <p className={value}>
                    {totalClicks.toLocaleString()}
                  </p>
                  <p className={sub}>
                    Interactions with your calls to action
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <div className="flex items-center justify-between">
                    <p className={label}>
                      Average CTR
                    </p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold uppercase tracking-[0.2em]">
                      Rate
                    </span>
                  </div>
                  <p className={value}>
                    {formattedAverageCTR}%
                  </p>
                  <p className={sub}>
                    Click-through performance across all signals
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Engagement
                  </p>
                  <p className={value}>
                    {totalEngagement.toLocaleString()}
                  </p>
                  <p className={sub}>
                    Reactions, comments, and shares
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className={`${card} ${cardPad}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className={label}>
                      Spend
                    </p>
                    <span className="text-[10px] px-2 py-1 rounded-full bg-slate-100 text-slate-700 font-bold uppercase tracking-[0.2em]">
                      Credits
                    </span>
                  </div>
                  <p className="text-3xl font-black text-slate-900">
                    {totalSpend.toFixed(2)}
                  </p>
                  <p className={sub}>
                    Approximate total signal spend
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Reach
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {totalReach.toLocaleString()}
                  </p>
                  <p className={sub}>
                    Estimated unique people touched by your ads
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Performance Score
                  </p>
                  <p className="text-3xl font-black text-slate-900">
                    {performanceScore.toFixed(0)}
                  </p>
                  <p className={sub}>
                    Composite health indicator across your active campaigns
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Momentum
                  </p>
                  <p className={value}>
                    {momentumScore.toFixed(0)} / 100
                  </p>
                  <p className={sub}>
                    Blend of active signals and fresh engagement.
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Fatigue Index
                  </p>
                  <p className={value}>
                    {fatigueIndex.toFixed(0)}%
                  </p>
                  <p className={sub}>
                    Higher values suggest repeated views without action.
                  </p>
                </div>
                <div className={`${card} ${cardPad}`}>
                  <p className={label}>
                    Attention Half-Life
                  </p>
                  <p className={value}>
                    {attentionHalfLifeDays} days
                  </p>
                  <p className={sub}>
                    Rough estimate before performance naturally decays.
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                      All Signals Summary
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Every ad you’ve posted — scan performance at a glance.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-900 text-xs text-slate-700 dark:text-slate-200"
                    >
                      <option value="impressions">Impressions</option>
                      <option value="clicks">Clicks</option>
                      <option value="ctr">CTR</option>
                      <option value="spend">Spend</option>
                      <option value="roi">ROI</option>
                    </select>
                  </div>
                </div>

                {overviewSummaries.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-300">
                    No ads found.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {overviewSummaries.map(ad => (
                      <div
                        key={ad.id}
                        className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                              {ad.headline}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                              {new Date(ad.createdAt).toLocaleDateString()} • {ad.status}
                            </p>
                          </div>

                          <button
                            onClick={() => {
                              setSelectedAdId(ad.id);
                              setActiveTab('details');
                            }}
                            className="shrink-0 px-3 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-emerald-600"
                          >
                            View
                          </button>
                        </div>

                        <div className="grid grid-cols-4 gap-3 mt-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                              Impr
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {ad.impressions.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                              Clicks
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {ad.clicks.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                              CTR
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {ad.ctr.toFixed(2)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500 whitespace-nowrap">
                              Eng
                            </p>
                            <p className="text-lg font-black text-slate-900 dark:text-white">
                              {ad.engagement.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${card} ${cardPad}`}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
                    Next Best Action
                  </p>
                  <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold uppercase tracking-[0.2em]">
                    Recommendation
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">
                  {nextAction}
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'ads' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                All Signals
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Compare performance across all your active and past ads.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">
                  Sort by
                </span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200"
                >
                  <option value="impressions">Impressions</option>
                  <option value="clicks">Clicks</option>
                  <option value="ctr">CTR</option>
                  <option value="spend">Spend</option>
                  <option value="roi">ROI</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-1">
                {(['all', 'active', 'paused', 'completed'] as const).map(value => (
                  <button
                    key={value}
                    onClick={() => setStatusFilter(value)}
                    className={`px-2 py-1 rounded-full text-[10px] font-semibold border ${
                      statusFilter === value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900'
                    }`}
                  >
                    {value === 'all' ? 'All' : value.charAt(0).toUpperCase() + value.slice(1)}
                  </button>
                ))}
              </div>
              <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                {visibleAdPerformance.length} tracked ads
              </span>
            </div>
          </div>
          {loadingAds && (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              Loading ad performance...
            </p>
          )}
          {!loadingAds && visibleAdPerformance.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-300">
              No tracked ads yet.
            </p>
          )}
          {!loadingAds && visibleAdPerformance.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Ad</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Status</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Impr.</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Clicks</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">CTR</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Eng.</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">Spend</th>
                    <th className="py-2 pr-4 font-semibold text-slate-500 dark:text-slate-400">ROI</th>
                    <th className="py-2 pl-4 font-semibold text-slate-500 dark:text-slate-400 text-right">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAdPerformance.map(metric => {
                    const ad = ads.find(a => a.id === metric.adId);
                    const isSelected = selectedAdId === metric.adId;
                    return (
                      <tr
                        key={metric.adId}
                        className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${isSelected ? 'bg-emerald-50/40 dark:bg-emerald-900/20' : ''}`}
                      >
                        <td className="py-3 pr-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {metric.adName || ad?.headline || 'Untitled Signal'}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {(ad?.subscriptionTier || 'Custom') + ' • ' + new Date(metric.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] ${
                              metric.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                : metric.status === 'paused'
                                ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {metric.status}
                          </span>
                        </td>
                        <td className="py-3 pr-4">
                          {metric.impressions.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          {metric.clicks.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          {metric.ctr.toFixed(2)}%
                        </td>
                        <td className="py-3 pr-4">
                          {metric.engagement.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4">
                          {metric.spend.toFixed(2)}
                        </td>
                        <td className="py-3 pr-4">
                          {metric.roi.toFixed(2)}
                        </td>
                        <td className="py-3 pl-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                              onClick={() => {
                                setSelectedAdId(metric.adId);
                                setActiveTab('details');
                              }}
                            >
                              View
                            </button>
                            <button
                              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
                              onClick={() => {
                                if (onDeleteAd) {
                                  onDeleteAd(metric.adId);
                                }
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'details' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Monthly quota
              </p>
              {subscription ? (
                <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                  {remainingAds} remaining <span className="text-slate-500 font-medium">of {subscription.adLimit}</span>
                </p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">
                  No active plan found.
                </p>
              )}
            </div>
            <button
              disabled={!subscription || !canCreate}
              onClick={() => {
                window.location.href = '/ad-plans';
              }}
              className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                !subscription || !canCreate
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-500 text-white hover:bg-emerald-600'
              }`}
            >
              Create Ad
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">
                    Single Signal Analytics
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Choose an ad from the list to see its detailed performance.
                  </p>
                </div>
                {selectedAd && (
                  <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {selectedAd.headline}
                  </span>
                )}
              </div>
              {subscription && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl p-5 text-white mb-2">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.25em] text-emerald-100">
                        {subscription.packageName}
                      </p>
                      <h3 className="text-xl font-black">
                        Ad Usage This Month
                      </h3>
                      <p className="text-sm text-emerald-100">
                        Your plan resets on {subscription.endDate ? new Date(subscription.endDate).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm uppercase tracking-widest text-emerald-100">
                        Remaining
                      </p>
                      <p className="text-4xl font-black">
                        {subscription.adLimit - subscription.adsUsed}
                        <span className="text-lg font-semibold ml-1">/ {subscription.adLimit}</span>
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 w-full bg-emerald-700/40 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-white h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (subscription.adsUsed / subscription.adLimit) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
              {!selectedAdId && (
                <div className="py-8 text-sm text-slate-500 dark:text-slate-300">
                  Select an ad from the table to inspect its metrics.
                </div>
              )}
              {selectedAdId && loadingDetails && (
                <div className="py-8 text-sm text-slate-500 dark:text-slate-300">
                  Loading analytics for the selected ad...
                </div>
              )}
              {selectedAdId && !loadingDetails && selectedAdAnalytics && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Impressions
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.impressions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Clicks
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.clicks.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      CTR
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.ctr.toFixed(2)}%
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Engagement
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.engagement.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Reach
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.reach.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Conversions
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.conversions.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Spend
                    </p>
                    <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                      {selectedAdAnalytics.spend.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-0">
                    <p className={`${label} dark:text-slate-400 overflow-hidden text-ellipsis`}>
                      Last Updated
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-900 dark:text-white">
                      {new Date(selectedAdAnalytics.lastUpdated).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                Pick a signal
              </h4>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {visibleAdPerformance.length === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    No tracked ads available.
                  </p>
                )}
                {visibleAdPerformance.map(metric => {
                  const ad = ads.find(a => a.id === metric.adId);
                  const isSelected = selectedAdId === metric.adId;
                  return (
                    <button
                      key={metric.adId}
                      className={`w-full text-left px-3 py-2 rounded-xl border text-xs mb-1 transition-colors ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-200'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                      onClick={() => setSelectedAdId(metric.adId)}
                    >
                      <div className="font-semibold truncate">
                        {metric.adName || ad?.headline || 'Untitled Signal'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between mt-1">
                        <span>
                          {metric.impressions.toLocaleString()} views
                        </span>
                        <span>
                          {metric.ctr.toFixed(2)}% CTR
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdAnalyticsPage;
