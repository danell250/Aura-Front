import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { subscriptionService, Subscription } from '../services/subscriptionService';

interface SubscriptionManagerProps {
  currentUser: User;
  onClose: () => void;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ currentUser, onClose }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Load user subscriptions on component mount
  useEffect(() => {
    const loadSubscriptions = async () => {
      try {
        setLoading(true);
        const userSubscriptions = await subscriptionService.getUserSubscriptions(currentUser.id);
        setSubscriptions(userSubscriptions);
      } catch (error) {
        console.error('Failed to load subscriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSubscriptions();
  }, [currentUser.id]);

  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancellingId(subscriptionId);
    
    try {
      await subscriptionService.cancelSubscription(subscriptionId);
      
      // Update local state to reflect cancellation
      setSubscriptions(prev => 
        prev.map(sub => 
          sub.id === subscriptionId 
            ? { ...sub, status: 'cancelled' as const, cancelledDate: new Date().toISOString() }
            : sub
        )
      );
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      // You could show an error message to the user here
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-8 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800 no-scrollbar relative">
        
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Subscription Manager</h2>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-75 border border-slate-100 dark:border-slate-700">✕</button>
        </div>

        <div className="animate-in fade-in duration-500">
          {loading ? (
            <div className="py-48 text-center">
              <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-400">Loading subscriptions...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="py-48 text-center bg-slate-50 dark:bg-slate-950/20 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
              <div className="text-8xl mb-12 opacity-10">🔄</div>
              <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700">No active subscriptions</p>
            </div>
          ) : (
            <div className="space-y-8">
              {subscriptions.map(subscription => (
                <div key={subscription.id} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-700 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${
                    subscription.status === 'active' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                    subscription.status === 'cancelled' ? 'bg-gradient-to-r from-rose-500 to-red-500' :
                    'bg-gradient-to-r from-slate-400 to-slate-500'
                  }`}></div>
                  
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                          {subscription.planName}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                          subscription.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          subscription.status === 'cancelled' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-400'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Amount</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white">{subscription.amount}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Next Billing</p>
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">
                            {subscription.status === 'active' ? formatDate(subscription.nextBillingDate) : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Started</p>
                          <p className="text-[10px] font-bold text-slate-600 dark:text-slate-300">{formatDate(subscription.createdDate)}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Subscription ID</p>
                          <p className="text-[10px] font-mono text-slate-600 dark:text-slate-300">{subscription.id}</p>
                        </div>
                      </div>
                    </div>
                    
                    {subscription.status === 'active' && (
                      <div className="ml-6">
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          disabled={cancellingId === subscription.id}
                          className="px-6 py-3 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-rose-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {cancellingId === subscription.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Cancelling...
                            </div>
                          ) : (
                            'Cancel'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {subscription.status === 'cancelled' && (
                    <div className="mt-4 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                      <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest">
                        Subscription cancelled • Access continues until {formatDate(subscription.nextBillingDate)}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;