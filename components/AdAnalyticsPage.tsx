import React, { useState, useEffect } from 'react';
import { User, Ad } from '../types';
import { adAnalyticsService, CampaignPerformance } from '../services/adAnalyticsService';

interface AdAnalyticsPageProps {
  currentUser: User;
  ads: Ad[];
  onDeleteAd: (id: string) => Promise<void>;
}

const AdAnalyticsPage: React.FC<AdAnalyticsPageProps> = ({ currentUser, ads, onDeleteAd }) => {
  const [campaignData, setCampaignData] = useState<CampaignPerformance | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, [currentUser.id, selectedTimeframe]);

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      const performance = await adAnalyticsService.getCampaignPerformance(currentUser.id);
      setCampaignData(performance);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Progress Ring Component
  const ProgressRing = ({ percentage, size = 120, strokeWidth = 8, label, value, color = "emerald" }: {
    percentage: number;
    size?: number;
    strokeWidth?: number;
    label: string;
    value: string;
    color?: string;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    const colorClasses = {
      emerald: "stroke-emerald-500",
      teal: "stroke-teal-500",
      green: "stroke-green-500"
    };

    return (
      <div className="flex flex-col items-center">
        <div className="relative" style={{ width: size, height: size }}>
          <svg
            className="transform -rotate-90"
            width={size}
            height={size}
          >
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-gray-200"
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`${colorClasses[color as keyof typeof colorClasses]} transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-900">{value}</span>
            <span className="text-xs text-gray-500 text-center">{label}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 font-medium">Failed to load analytics data.</p>
          <button
            onClick={loadAnalyticsData}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Campaign Analytics</h1>
              <p className="text-gray-600">Comprehensive insights into your advertising performance</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value as '7d' | '30d' | '90d')}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <button
                onClick={loadAnalyticsData}
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-lg font-medium hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-green-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12.5%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {campaignData.totalImpressions.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm font-medium">Total Impressions</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-teal-100 to-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <span className="text-xs font-medium text-teal-600 bg-teal-50 px-2 py-1 rounded-full">+8.3%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {campaignData.totalClicks.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm font-medium">Total Clicks</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">+15.2%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {campaignData.averageCTR.toFixed(2)}%
            </h3>
            <p className="text-gray-600 text-sm font-medium">Click-Through Rate</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+5.7%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {campaignData.totalSpend.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm font-medium">Total Spend</p>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Score Ring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Performance Score</h3>
            <div className="flex justify-center">
              <ProgressRing
                percentage={campaignData.performanceScore}
                size={140}
                strokeWidth={10}
                label="Overall Score"
                value={`${campaignData.performanceScore}`}
                color="emerald"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {campaignData.performanceScore >= 80 ? 'Excellent' : 
                 campaignData.performanceScore >= 60 ? 'Good' : 
                 campaignData.performanceScore >= 40 ? 'Average' : 'Needs Improvement'}
              </p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Reach</span>
                <span className="text-sm font-bold text-gray-900">{campaignData.totalReach.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Engagement</span>
                <span className="text-sm font-bold text-gray-900">{campaignData.totalEngagement.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Ads</span>
                <span className="text-sm font-bold text-gray-900">{campaignData.activeAds}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-teal-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
          </div>

          {/* ROI Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">ROI Breakdown</h3>
            <div className="space-y-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-emerald-600 mb-1">324%</div>
                <div className="text-sm text-gray-600">Return on Investment</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per Click</span>
                  <span className="text-sm font-semibold text-gray-900">$0.45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Cost per Impression</span>
                  <span className="text-sm font-semibold text-gray-900">$0.02</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Conversion Rate</span>
                  <span className="text-sm font-semibold text-emerald-600">12.8%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Performance Trend</h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span className="text-gray-600">Impressions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-teal-500 rounded-full"></div>
                  <span className="text-gray-600">Clicks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-gray-600">Engagement</span>
                </div>
              </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2">
              {campaignData.trendData.map((data, index) => {
                const maxValue = Math.max(...campaignData.trendData.map(d => Math.max(d.impressions, d.clicks * 10, d.engagement * 5)));
                const impressionHeight = (data.impressions / maxValue) * 100;
                const clickHeight = (data.clicks * 10 / maxValue) * 100;
                const engagementHeight = (data.engagement * 5 / maxValue) * 100;
                
                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end gap-1 h-48">
                      <div 
                        className="flex-1 bg-gradient-to-t from-emerald-400 to-emerald-500 rounded-t-sm hover:brightness-110 transition-all cursor-pointer relative group" 
                        style={{ height: `${impressionHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.impressions.toLocaleString()}
                        </div>
                      </div>
                      <div 
                        className="flex-1 bg-gradient-to-t from-teal-400 to-teal-500 rounded-t-sm hover:brightness-110 transition-all cursor-pointer relative group" 
                        style={{ height: `${clickHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.clicks.toLocaleString()}
                        </div>
                      </div>
                      <div 
                        className="flex-1 bg-gradient-to-t from-green-400 to-green-500 rounded-t-sm hover:brightness-110 transition-all cursor-pointer relative group" 
                        style={{ height: `${engagementHeight}%` }}
                      >
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {data.engagement.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 font-medium">
                      {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Campaign Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Campaign Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Social Media</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">45%</div>
                  <div className="text-xs text-gray-600">$89,450</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-emerald-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-teal-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Display Ads</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">32%</div>
                  <div className="text-xs text-gray-600">$63,680</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">Search Ads</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">23%</div>
                  <div className="text-xs text-gray-600">$45,770</div>
                </div>
              </div>
            </div>
            
            {/* Donut Chart Visualization */}
            <div className="mt-6 flex justify-center">
              <div className="relative w-32 h-32">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeDasharray="45, 100"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="2"
                    strokeDasharray="32, 100"
                    strokeDashoffset="-45"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="23, 100"
                    strokeDashoffset="-77"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        {/* Detailed Analytics Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Campaign Performance Details</h3>
              <button className="px-4 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                Export Data
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-green-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Campaign</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Impressions</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Clicks</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">CTR</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Spend</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">ROI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { name: 'Summer Product Launch', status: 'Active', impressions: 45680, clicks: 2340, ctr: 5.12, spend: 1250, roi: 340 },
                  { name: 'Brand Awareness Q4', status: 'Active', impressions: 38920, clicks: 1890, ctr: 4.86, spend: 980, roi: 285 },
                  { name: 'Holiday Special Offer', status: 'Paused', impressions: 52340, clicks: 2680, ctr: 5.12, spend: 1450, roi: 420 },
                  { name: 'New Customer Acquisition', status: 'Active', impressions: 29870, clicks: 1560, ctr: 5.22, spend: 750, roi: 310 },
                  { name: 'Retargeting Campaign', status: 'Active', impressions: 18450, clicks: 1120, ctr: 6.07, spend: 560, roi: 380 }
                ].map((campaign, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{campaign.name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        campaign.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{campaign.impressions.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-900 font-medium">{campaign.clicks.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-600 font-semibold">{campaign.ctr}%</span>
                    </td>
                    <td className="px-6 py-4 text-gray-900 font-medium">${campaign.spend.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="text-green-600 font-semibold">{campaign.roi}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Top Performer</h4>
            </div>
            <p className="text-2xl font-bold mb-2">Holiday Special Offer</p>
            <p className="text-emerald-100 text-sm">420% ROI • 52.3K impressions</p>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Best CTR</h4>
            </div>
            <p className="text-2xl font-bold mb-2">6.07%</p>
            <p className="text-teal-100 text-sm">Retargeting Campaign</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold">Cost Efficiency</h4>
            </div>
            <p className="text-2xl font-bold mb-2">$0.45</p>
            <p className="text-green-100 text-sm">Average cost per click</p>
          </div>
        </div>

        {/* Active Ads Management */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Quick Management</h3>
            <p className="text-sm text-gray-500 mt-1">Manage your active ads directly from analytics</p>
          </div>
          <div className="p-6">
            {ads.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active ads found.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ads.map(ad => (
                  <div key={ad.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 truncate pr-2">{ad.headline}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ad.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm('Are you sure you want to delete this ad?')) {
                            onDeleteAd(ad.id);
                          }
                        }}
                        className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 rounded transition-colors"
                        title="Delete Ad"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{ad.description}</p>
                    <div className="text-xs text-gray-400">
                      ID: {ad.id.slice(0, 8)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdAnalyticsPage;