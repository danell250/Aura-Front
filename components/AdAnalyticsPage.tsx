import React, { useState, useEffect } from 'react';
import { User, Ad } from '../types';
import { adAnalyticsService, CampaignPerformance } from '../services/adAnalyticsService';

interface AdAnalyticsPageProps {
  currentUser: User;
  ads: Ad[];
}

const AdAnalyticsPage: React.FC<AdAnalyticsPageProps> = ({ currentUser, ads }) => {
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
              {campaignData?.totalImpressions.toLocaleString() || '0'}
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
              {campaignData?.totalClicks.toLocaleString() || '0'}
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
              {campaignData?.averageCTR.toFixed(2) || '0.00'}%
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
              ${campaignData?.totalSpend.toLocaleString() || '0'}
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
                percentage={campaignData?.performanceScore || 0}
                size={140}
                strokeWidth={10}
                label="Overall Score"
                value={`${campaignData?.performanceScore || 0}`}
                color="emerald"
              />
            </div>
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {(campaignData?.performanceScore || 0) >= 80 ? 'Excellent' : 
                 (campaignData?.performanceScore || 0) >= 60 ? 'Good' : 
                 (campaignData?.performanceScore || 0) >= 40 ? 'Average' : 'Needs Improvement'}
              </p>
            </div>
          </div>

          {/* Engagement Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Metrics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Reach</span>
                <span className="text-sm font-bold text-gray-900">{campaignData?.totalReach.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Engagement</span>
                <span className="text-sm font-bold text-gray-900">{campaignData?.totalEngagement.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-teal-500 to-emerald-500 h-2 rounded-full" style={{ width: '68%' }}></div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Active Ads</span>
                <span className="text-sm font-bold text-gray-900">{campaignData?.activeAds || 0}</span>
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