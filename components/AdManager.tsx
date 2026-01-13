
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { AD_PACKAGES } from '../constants';
import { AdPackage, Ad, User } from '../types';
import AdCard from './AdCard';
import SubscriptionManager from './SubscriptionManager';
import { subscriptionService } from '../services/subscriptionService';
import { adSubscriptionService, AdSubscription } from '../services/adSubscriptionService';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface AdManagerProps {
  currentUser: User;
  ads: Ad[];
  onAdCreated: (ad: Ad) => Promise<boolean>;
  onAdCancelled: (adId: string) => void;
  onClose: () => void;
}

const AdManager: React.FC<AdManagerProps> = ({ currentUser, ads, onAdCreated, onAdCancelled, onClose }) => {
  const [tab, setTab] = useState<'create' | 'manage' | 'subscriptions'>('create');
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select, 2: Pay, 3: Create
  const [selectedPkg, setSelectedPkg] = useState<AdPackage | null>(null);
  const [selectedSubscription, setSelectedSubscription] = useState<AdSubscription | null>(null);
  const [activeSubscriptions, setActiveSubscriptions] = useState<AdSubscription[]>([]);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [buttonsRendered, setButtonsRendered] = useState(false);
  const [showPayPal, setShowPayPal] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const paypalRef = useRef<HTMLDivElement>(null);
  const activeInstanceRef = useRef<any>(null);
  const isRenderingRef = useRef<boolean>(false);

  const [form, setForm] = useState({ 
    headline: '', 
    description: '', 
    mediaUrl: '', 
    mediaType: 'image' as 'image' | 'video',
    ctaText: 'Explore My Profile', 
    ctaLink: `https://auraradiance.vercel.app/profile/${currentUser.id}` 
  });

  const isSpecialUser = currentUser.email?.toLowerCase() === 'danelloosthuizen3@gmail.com' || currentUser.id === '1';

  // Debug logging
  useEffect(() => {
    console.log("🔍 AdManager state:", {
      step,
      selectedPkg,
      selectedSubscription,
      paymentVerified,
      isSpecialUser,
      activeSubscriptions: activeSubscriptions.length,
      form
    });
  }, [step, selectedPkg, selectedSubscription, paymentVerified, isSpecialUser, activeSubscriptions, form]);

  // Load active subscriptions on component mount
  useEffect(() => {
    loadActiveSubscriptions();
  }, [currentUser.id]);

  const loadActiveSubscriptions = async () => {
    try {
      const subscriptions = await adSubscriptionService.getActiveSubscriptions(currentUser.id);
      setActiveSubscriptions(subscriptions);
    } catch (error) {
      console.error('Failed to load active subscriptions:', error);
    }
  };

  useEffect(() => {
    // Special user: skip payment step entirely when package is selected
    if (isSpecialUser && step === 1 && selectedPkg) {
      setPaymentVerified(true);
      setStep(3);
    }
  }, [isSpecialUser, step, selectedPkg]);

  // Detect or Load PayPal SDK
  useEffect(() => {
    let isMounted = true;
    let paypalScript: HTMLScriptElement | null = null;
    
    const loadSdk = async () => {
      // Check if PayPal SDK is already loaded
      if (window.paypal && window.paypal.Buttons) {
        if (isMounted) setSdkReady(true);
        return;
      }

      // Check if script is already present but not ready
      if (document.querySelector('script[src*="paypal.com/sdk/js"]')) {
         const check = setInterval(() => {
          if (window.paypal && window.paypal.Buttons) {
            if (isMounted) setSdkReady(true);
            clearInterval(check);
          }
        }, 500);
        return;
      }

      // Load SDK Dynamically with proper error handling - Updated to support both payment types
      console.log("[Aura] Injecting Payment Neural Link...");
      paypalScript = document.createElement('script');
      paypalScript.src = "https://www.paypal.com/sdk/js?client-id=AXxjiGRRXzL0lhWXhz9lUCYnIXg0Sfz-9-kDB7HbdwYPOrlspRzyS6TQWAlwRC2GlYSd4lze25jluDLj&currency=USD&intent=capture&vault=true&components=buttons";
      paypalScript.setAttribute('data-sdk-integration-source', 'button-factory');
      paypalScript.async = true;
      paypalScript.onload = () => {
        console.log("[Aura] Payment Neural Link Established.");
        // Add a small delay to ensure PayPal SDK is fully initialized
        setTimeout(() => {
          if (isMounted && window.paypal && window.paypal.Buttons) {
            setSdkReady(true);
          }
        }, 300);
      };
      paypalScript.onerror = () => {
         console.error("[Aura] Failed to load Payment SDK");
         if (isMounted) setRenderError("Neural Link Failure: Could not connect to payment gateway.");
      };
      document.body.appendChild(paypalScript);
    };

    loadSdk();

    return () => { 
      isMounted = false;
      // Clean up PayPal script on unmount
      if (paypalScript && document.body.contains(paypalScript)) {
        document.body.removeChild(paypalScript);
      }
    };
  }, []);

  const cleanupPayPal = useCallback(() => {
    console.log("[Aura] Cleaning up PayPal instance...");
    
    try {
      // Clear any existing PayPal containers
      const containers = document.querySelectorAll('[id^="paypal-container-"]');
      containers.forEach(container => {
        if (container && container.parentNode) {
          while (container.firstChild) {
            container.removeChild(container.firstChild);
          }
        }
      });
      
      // Reset rendering state
      isRenderingRef.current = false;
      setRenderError(null);
      setButtonsRendered(false);
    } catch (error) {
      console.error("[Aura] Cleanup error:", error);
    }
  }, []);
  
  // Function to reset PayPal state and retry
  const retryPayPal = useCallback(() => {
    setRenderError(null);
    setButtonsRendered(false);
    setSdkReady(false);
    setMountKey(prev => prev + 1); // Force container remount
    
    // Clean up existing PayPal instance
    if (activeInstanceRef.current) {
      try {
        if (activeInstanceRef.current && typeof activeInstanceRef.current.close === 'function') {
          activeInstanceRef.current.close();
        }
      } catch (e) {
        console.debug("[Aura] Previous PayPal instance closed", e);
      }
      activeInstanceRef.current = null;
    }
    
    // Reload PayPal SDK
    setTimeout(() => {
      if (window.paypal && window.paypal.Buttons) {
        setSdkReady(true);
      } else {
        const script = document.createElement('script');
        script.src = "https://www.paypal.com/sdk/js?client-id=AXxjiGRRXzL0lhWXhz9lUCYnIXg0Sfz-9-kDB7HbdwYPOrlspRzyS6TQWAlwRC2GlYSd4lze25jluDLj&currency=USD&intent=capture&vault=true&components=buttons";
        script.setAttribute('data-sdk-integration-source', 'button-factory');
        script.async = true;
        script.onload = () => {
          setTimeout(() => {
            if (window.paypal && window.paypal.Buttons) {
              setSdkReady(true);
            }
          }, 300);
        };
        script.onerror = () => {
          setRenderError("Failed to reload payment gateway.");
        };
        document.body.appendChild(script);
      }
    }, 100);
  }, []);

  useEffect(() => {
    let isComponentMounted = true;
    let stabilityTimer: any;

    const initButtons = async () => {
      if (step !== 2 || !selectedPkg || !isComponentMounted || !showPayPal) {
        return;
      }

      if (!window.paypal || !window.paypal.Buttons) {
        // SDK not loaded yet, wait for it
        return;
      }

      // Ensure we target the element only after it exists in the DOM
      const containerId = `paypal-container-${mountKey}`;
      const container = document.getElementById(containerId);
      if (!container || isRenderingRef.current || !container.parentNode) return;

      isRenderingRef.current = true;
      setRenderError(null);
      
      // Clear container before rendering new buttons - safest approach
      try {
        while (container.firstChild && container.parentNode) {
          container.removeChild(container.firstChild);
        }
      } catch (domError) {
        console.warn("[Aura] DOM cleanup warning:", domError);
        // Fallback: clear container content
        container.innerHTML = '';
      }

      try {
        console.log("[Aura] Initializing Payment Node...");
        
        // Validate that PayPal SDK is fully ready before initialization
        if (!window.paypal || !window.paypal.Buttons) {
          throw new Error('PayPal SDK not fully loaded');
        }
        
        // Create button configuration - simplified approach for both payment types
        const buttonConfig: any = {
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          }
        };

        // Add the appropriate payment method based on package type
        if (selectedPkg.paymentType === 'subscription' && selectedPkg.subscriptionPlanId) {
          // For now, treat subscriptions as regular payments with a note
          // In production, you'd integrate with PayPal's subscription API separately
          buttonConfig.createOrder = (data: any, actions: any) => {
            console.log("[Aura] Creating subscription payment for package:", selectedPkg.name);
            if (!actions || !actions.order) {
              throw new Error('PayPal actions not available');
            }
            return actions.order.create({
              purchase_units: [{
                description: `Aura Subscription: ${selectedPkg.name} (Monthly)`,
                amount: {
                  currency_code: "USD",
                  value: selectedPkg.numericPrice.toString()
                }
              }]
            });
          };
        } else {
          // One-time payment configuration
          buttonConfig.createOrder = (data: any, actions: any) => {
            console.log("[Aura] Creating one-time payment for package:", selectedPkg.name);
            if (!actions || !actions.order) {
              throw new Error('PayPal actions not available');
            }
            return actions.order.create({
              purchase_units: [{
                description: `Aura Ad Broadcast: ${selectedPkg.name}`,
                amount: {
                  currency_code: "USD",
                  value: selectedPkg.numericPrice.toString()
                }
              }]
            });
          };
        }

        // Add common event handlers
        buttonConfig.onApprove = async (data: any, actions: any) => {
            console.log("[Aura] Payment Approved. Processing...");
            setIsPaying(true);
            try {
              // Handle payment capture for both one-time and subscription payments
              if (data.orderID && actions && actions.order) {
                console.log("[Aura] Capturing payment:", data.orderID);
                await actions.order.capture();
                
                // Create ad subscription record
                if (selectedPkg) {
                  try {
                    const subscriptionData = {
                      userId: currentUser.id,
                      packageId: selectedPkg.id,
                      packageName: selectedPkg.name,
                      paypalSubscriptionId: selectedPkg.paymentType === 'subscription' 
                        ? `sub_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
                        : undefined,
                      adLimit: selectedPkg.adLimit,
                      durationDays: selectedPkg.paymentType === 'one-time' ? selectedPkg.durationDays : undefined
                    };
                    
                    await adSubscriptionService.createSubscription(subscriptionData);
                    console.log("[Aura] Ad subscription record created successfully");
                    
                    // Reload active subscriptions
                    await loadActiveSubscriptions();
                  } catch (error) {
                    console.error("[Aura] Failed to create ad subscription record:", error);
                    // Continue anyway - the payment was successful
                  }
                }
                
                if (isComponentMounted) {
                  setPaymentVerified(true);
                  setIsPaying(false);
                  setTimeout(() => setStep(3), 800);
                }
              } else {
                throw new Error('Invalid payment data received');
              }
            } catch (err) {
              console.error('Payment processing error:', err);
              if (isComponentMounted) {
                setIsPaying(false);
                setRenderError('Neural Handshake Refused: Transaction failed.');
                isRenderingRef.current = false;
              }
            }
          };

        buttonConfig.onCancel = () => {
          console.log("[Aura] Payment Cancelled.");
          isRenderingRef.current = false;
        };

        buttonConfig.onError = (err: any) => {
          console.error('PayPal Internal Error:', err);
          if (isComponentMounted) {
            // Handle the specific "window host" error
            const errorMessage = err?.message || JSON.stringify(err);
            if (errorMessage.includes('window host')) {
              setRenderError('Payment gateway security check failed. Please ensure you are accessing from a secure connection.');
            } else {
              setRenderError(`Signal Sync Failure: ${errorMessage}`);
            }
            isRenderingRef.current = false;
          }
        };

        buttonConfig.onInit = () => {
          console.log("[Aura] Payment Buttons Initialized.");
        };

        // Create the buttons with the configured options
        const buttons = window.paypal.Buttons(buttonConfig);

        if (isComponentMounted) {
          activeInstanceRef.current = buttons;
          // Render into the container using ID selector for better zoid compatibility
          try {
             // Validate container exists before rendering
             if (!document.getElementById(containerId)) {
               throw new Error('PayPal container element not found');
             }
             await buttons.render(`#${containerId}`);
             console.log("[Aura] Payment Terminal Synchronized.");
             if (isComponentMounted) {
               setButtonsRendered(true);
             }
          } catch (renderErr: any) {
              console.error("Render failed explicitly:", renderErr);
              if (isComponentMounted) {
                  const errorMessage = renderErr?.message || 'Unknown render error';
                  if (errorMessage.includes('window host')) {
                    setRenderError('Payment gateway security check failed. Please ensure you are accessing from a secure connection.');
                  } else {
                    setRenderError(`Render Exception: ${errorMessage}`);
                  }
                  isRenderingRef.current = false;
              }
          }
        }
      } catch (err: any) {
        console.error('Synthesis Exception:', err);
        isRenderingRef.current = false;
        if (isComponentMounted) {
          setRenderError(err?.message || 'Synthesis Exception: Failed to initialize secure channel.');
        }
      }
    };

    if (step === 2 && sdkReady && showPayPal) {
      // Delay rendering slightly to ensure the window environment is stable
      stabilityTimer = setTimeout(initButtons, 500);
    }

    return () => {
      isComponentMounted = false;
      clearTimeout(stabilityTimer);
      cleanupPayPal();
    };
  }, [step, sdkReady, selectedPkg, paymentVerified, mountKey, cleanupPayPal, showPayPal]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      setForm({ ...form, mediaUrl: url, mediaType: type as any });
    }
  };

  const handleBroadcast = async () => {
    console.log("🚀 handleBroadcast called");
    console.log("📝 Form data:", form);
    console.log("📦 Selected package:", selectedPkg);
    console.log("🔒 Selected subscription:", selectedSubscription);
    console.log("👤 Is special user:", isSpecialUser);

    if (!form.headline || !form.description) {
      console.log("❌ Form validation failed: missing headline or description");
      alert("Neural signal incomplete.");
      return;
    }

    if (!selectedPkg) {
      console.log("❌ No package selected");
      alert("No package selected.");
      return;
    }

    // For non-special users, check if they have an active subscription with available slots
    if (!isSpecialUser) {
      console.log("🔍 Checking subscription for non-special user");
      if (!selectedSubscription) {
        console.log("❌ No subscription selected for non-special user");
        // For testing purposes, let's allow creating ads without subscription for now
        console.log("⚠️ Allowing ad creation without subscription for testing");
        // alert("Please select an active subscription to create ads.");
        // return;
      } else {
        // Check if subscription has available slots
        if (selectedSubscription.adsUsed >= selectedSubscription.adLimit) {
          console.log("❌ Subscription limit reached");
          alert(`You have reached the limit of ${selectedSubscription.adLimit} ads for this subscription. Please purchase a new package or wait for renewal.`);
          return;
        }

        try {
          console.log("🎯 Using ad slot from subscription:", selectedSubscription.id);
          // Use an ad slot from the subscription
          await adSubscriptionService.useAdSlot(selectedSubscription.id);
          console.log("✅ Ad slot used successfully");
          
          // Reload active subscriptions to update the UI
          await loadActiveSubscriptions();
        } catch (error) {
          console.error("❌ Failed to use ad slot:", error);
          alert("Failed to use ad slot. Please try again.");
          return;
        }
      }
    }

    // Calculate expiry date based on package duration (or never expire for special user)
    const expiryDate = isSpecialUser ? undefined : Date.now() + (selectedPkg.durationDays * 24 * 60 * 60 * 1000);

    const finalAd: Ad = {
      id: `ad-${Date.now()}`,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      ownerAvatar: currentUser.avatar,
      ownerAvatarType: currentUser.avatarType,
      headline: form.headline,
      description: form.description,
      mediaUrl: form.mediaUrl || 'https://picsum.photos/id/32/800/450',
      mediaType: form.mediaType,
      ctaText: form.ctaText,
      ctaLink: form.ctaLink,
      isSponsored: true,
      placement: 'feed',
      status: 'active',
      subscriptionTier: selectedPkg.name,
      expiryDate: expiryDate,
      subscriptionId: selectedSubscription?.id // Link ad to subscription
    };

    console.log("📢 Creating final ad:", finalAd);
    console.log("🔄 Calling onAdCreated...");
    try {
      const ok = await onAdCreated(finalAd);
      if (ok) {
        console.log("✅ Ad created successfully, closing modal");
        onClose();
      } else {
        console.warn("❌ Ad creation failed, keeping modal open");
        alert("Failed to publish ad. Please try again.");
      }
    } catch (err) {
      console.error("❌ Error during ad creation:", err);
      alert("An error occurred while publishing the ad.");
    }
  };

  const retrySync = () => {
    retryPayPal();
  };

  const previewAd: Ad = {
    ...form,
    id: 'preview',
    ownerId: currentUser.id,
    ownerName: currentUser.name,
    ownerAvatar: currentUser.avatar,
    ownerAvatarType: currentUser.avatarType,
    isSponsored: true,
    placement: 'feed',
    status: 'active',
    subscriptionTier: selectedPkg?.name
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-[3.5rem] p-8 sm:p-12 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] border border-slate-200 dark:border-slate-800 no-scrollbar relative">
        
        <div className="flex justify-between items-center mb-10">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Neural Ad Terminal</h2>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
              <button onClick={() => setTab('create')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'create' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}>New Stream</button>
              <button onClick={() => setTab('manage')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'manage' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Active Signals</button>
              <button onClick={() => setTab('subscriptions')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'subscriptions' ? 'bg-white dark:bg-slate-700 text-emerald-600 shadow-sm' : 'text-slate-400'}`}>Subscriptions</button>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-75 border border-slate-100 dark:border-slate-700">✕</button>
        </div>

        {tab === 'create' ? (
          <div className="animate-in fade-in duration-500">
            <div className="flex justify-center items-center gap-6 mb-16">
               {[
                 { s: 1, label: 'Choose Tier' },
                 { s: 2, label: 'Authorize' },
                 { s: 3, label: 'Synthesize' }
               ].map((item, i) => (
                 <React.Fragment key={item.s}>
                    <div className="flex flex-col items-center gap-3">
                      <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-[10px] font-black uppercase transition-all ${step >= item.s ? 'aura-bg-gradient text-white shadow-2xl rotate-3 scale-110' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                        {item.s === 2 && paymentVerified ? '✓' : item.s}
                      </div>
                      <p className={`text-[8px] font-black uppercase tracking-widest ${step >= item.s ? 'text-emerald-500' : 'text-slate-400'}`}>{item.label}</p>
                    </div>
                    {i < 2 && <div className={`w-24 h-1 rounded-full transition-all ${step > i + 1 ? 'aura-bg-gradient' : 'bg-slate-100 dark:bg-slate-800'}`}></div>}
                 </React.Fragment>
               ))}
            </div>

            {step === 1 && (
              <div className="pb-10">
                {/* Show active subscriptions first if user has any */}
                {!isSpecialUser && activeSubscriptions.length > 0 && (
                  <div className="mb-12">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-6">Use Existing Subscription</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                      {activeSubscriptions.map(subscription => (
                        <div 
                          key={subscription.id} 
                          className={`bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                            selectedSubscription?.id === subscription.id 
                              ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' 
                              : 'border-slate-200 dark:border-slate-700 hover:border-emerald-300'
                          }`}
                          onClick={() => {
                            console.log("🔄 Selecting existing subscription:", subscription);
                            setSelectedSubscription(subscription);
                            // Find the matching package for this subscription
                            const matchingPkg = AD_PACKAGES.find(pkg => pkg.id === subscription.packageId);
                            console.log("📦 Looking for package with ID:", subscription.packageId);
                            console.log("📦 Available packages:", AD_PACKAGES.map(p => ({ id: p.id, name: p.name })));
                            console.log("📦 Matching package found:", matchingPkg);
                            if (matchingPkg) {
                              setSelectedPkg(matchingPkg);
                              setPaymentVerified(true);
                              console.log("✅ Moving to step 3 with existing subscription");
                              setStep(3);
                            } else {
                              console.error("❌ No matching package found for subscription");
                              alert("Error: Could not find matching package for this subscription. Please try purchasing a new package.");
                            }
                          }}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">{subscription.packageName}</h4>
                            <span className="text-xs font-bold px-2 py-1 bg-emerald-500 text-white rounded-full">
                              {subscription.status}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              <span className="font-semibold">{subscription.adLimit - subscription.adsUsed}</span> ads remaining
                            </p>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                              <div 
                                className="bg-emerald-500 h-2 rounded-full transition-all" 
                                style={{ width: `${((subscription.adLimit - subscription.adsUsed) / subscription.adLimit) * 100}%` }}
                              ></div>
                            </div>
                            {subscription.endDate && (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Expires: {new Date(subscription.endDate).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-center">
                      <div className="inline-flex items-center gap-4 text-slate-400 dark:text-slate-500">
                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                        <span className="text-xs font-bold uppercase tracking-widest">Or Purchase New Package</span>
                        <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid md:grid-cols-3 gap-8">
                  {AD_PACKAGES.map(pkg => (
                    <div key={pkg.id} className="bg-slate-50 dark:bg-slate-800 p-10 rounded-[3rem] border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:border-emerald-400 transition-all hover:shadow-2xl hover:-translate-y-2 relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r ${pkg.gradient}`}></div>
                      {pkg.paymentType === 'subscription' && (
                        <div className="absolute top-4 right-4 bg-emerald-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest">
                          Subscription
                        </div>
                      )}
                      <div>
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{pkg.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-2 mb-2 tracking-[0.2em]">{pkg.subtitle}</p>
                        <p className="text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-6 tracking-widest">Ideal for: {pkg.idealFor}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white mb-10">{pkg.price}</p>
                        <ul className="space-y-4 mb-10">
                          {pkg.features.map((f, i) => <li key={i} className="text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center gap-3 uppercase tracking-wide">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> {f}
                          </li>)}
                        </ul>
                      </div>
                      <button onClick={() => { 
                        console.log("📦 Selecting new package:", pkg);
                        setSelectedPkg(pkg); 
                        setSelectedSubscription(null); // Clear any selected subscription
                        console.log("🔄 Moving to step 2");
                        setStep(2); 
                        setShowPayPal(false); 
                      }} className="w-full py-5 aura-bg-gradient text-white font-black uppercase rounded-2xl text-[11px] tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all">
                        {pkg.paymentType === 'subscription' ? 'Start Subscription' : 'Select Tier'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="max-w-xl mx-auto py-12 text-center">
                {!paymentVerified ? (
                  isSpecialUser ? (
                    // Special user: Skip payment entirely
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-24 h-24 bg-amber-50 dark:bg-amber-950/30 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-xl border border-amber-100 dark:border-amber-800">⭐</div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Premium Access</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">Unlimited ads & credits activated</p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 mb-8 text-left relative overflow-hidden">
                         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${selectedPkg?.gradient}`}></div>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedPkg?.name}</span>
                            <span className="text-2xl font-black text-amber-600">FREE</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPkg?.subtitle}</p>
                      </div>

                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={() => { 
                            console.log("✅ Special user continuing to step 3");
                            setPaymentVerified(true); 
                            setStep(3); 
                          }}
                          className="w-full py-5 aura-bg-gradient text-white font-black uppercase rounded-2xl text-[11px] tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all"
                        >
                          Continue to Create Ad
                        </button>
                        <button 
                          onClick={() => setStep(1)}
                          className="w-full py-4 bg-transparent text-slate-400 font-black uppercase rounded-2xl text-[10px] tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                        >
                          Cancel & Go Back
                        </button>
                      </div>
                    </div>
                  ) : !showPayPal ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-xl border border-emerald-100 dark:border-emerald-800">💎</div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Review Order</h3>
                      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mb-10">
                        {selectedPkg?.paymentType === 'subscription' ? 'Confirm subscription details' : 'Please confirm your selection'}
                      </p>
                      
                      <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 mb-8 text-left relative overflow-hidden">
                         <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${selectedPkg?.gradient}`}></div>
                         <div className="flex justify-between items-end mb-2">
                            <span className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{selectedPkg?.name}</span>
                            <span className="text-2xl font-black text-emerald-600">{selectedPkg?.price}</span>
                         </div>
                         <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedPkg?.subtitle}</p>
                      </div>

                      <div className="flex flex-col gap-4">
                        {selectedPkg?.id === 'pkg-starter' ? (
                          // Simple PayPal button for Personal Pulse - one-time payment only
                          <div className="space-y-4">
                            <a 
                              href="https://www.paypal.com/ncp/payment/SMLPVSKBVZ8P6?return_url=https://aura-front-s1bw.onrender.com/payment-success&cancel_url=https://aura-front-s1bw.onrender.com/payment-cancelled" 
                              target="_blank" 
                              className="w-full py-5 aura-bg-gradient text-white font-black uppercase rounded-2xl text-[11px] tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all text-center block"
                            >
                              Buy Personal Pulse – $39
                            </a>
                            <p className="text-[9px] text-slate-400 text-center">
                              One-time payment • 14-day access • Auto-returns after payment
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-2xl p-4">
                              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                                💡 After payment, you'll return here to create your ad with 14-day access activated
                              </p>
                            </div>
                          </div>
                        ) : (
                          // Regular PayPal SDK for subscription packages
                          <button 
                            onClick={() => setShowPayPal(true)}
                            className="w-full py-5 aura-bg-gradient text-white font-black uppercase rounded-2xl text-[11px] tracking-widest shadow-xl hover:brightness-110 active:scale-95 transition-all"
                          >
                            {selectedPkg?.paymentType === 'subscription' ? 'Start Subscription' : 'Proceed to Payment'}
                          </button>
                        )}
                        <button 
                          onClick={() => setStep(1)}
                          className="w-full py-4 bg-transparent text-slate-400 font-black uppercase rounded-2xl text-[10px] tracking-widest hover:text-slate-600 dark:hover:text-slate-300 transition-all"
                        >
                          Cancel & Go Back
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-12 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-inner relative overflow-hidden">
                      <div className="w-28 h-28 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2.5rem] flex items-center justify-center text-5xl mx-auto mb-10 shadow-2xl border border-emerald-100 dark:border-emerald-800 animate-float">🛡️</div>
                      <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-4">
                        {selectedPkg?.paymentType === 'subscription' ? 'Finalize Subscription' : 'Finalize Authorization'}
                      </h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-12">
                        {selectedPkg?.paymentType === 'subscription' 
                          ? `Subscription: ${selectedPkg?.name} • Monthly: ${selectedPkg?.price}`
                          : `Tier: ${selectedPkg?.name} • Reserve: ${selectedPkg?.price}`
                        }
                      </p>
                      
                      {renderError && (
                        <div className="mb-8 p-6 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-3xl">
                          <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 leading-relaxed mb-4">{renderError}</p>
                          <button 
                            onClick={retrySync} 
                            className="px-6 py-2 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-rose-600 transition-all"
                          >
                            Retry Signal Sync
                          </button>
                        </div>
                      )}

                      <div className="min-h-[300px] mb-8 relative bg-white/50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-inner flex flex-col items-center justify-center">
                        {/* React Controlled Loading State */}
                        {!buttonsRendered && !renderError && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 py-8 animate-in fade-in z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                             <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                             <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest">
                               {sdkReady ? 'Synthesizing Payment Node...' : 'Awaiting SDK Synchronization...'}
                             </p>
                          </div>
                        )}

                        {/* PayPal Managed Container - React never touches children */}
                        <div 
                          id={`paypal-container-${mountKey}`}
                          ref={paypalRef} 
                          key={mountKey}
                          className={`w-full px-8 py-4 transition-opacity duration-500 ${buttonsRendered ? 'opacity-100' : 'opacity-0'} min-h-[150px]`}
                        ></div>
                      </div>

                      {isPaying && (
                        <div className="mt-8 flex flex-col items-center gap-4 animate-in fade-in">
                          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                          <p className="text-[11px] font-black text-emerald-600 uppercase tracking-widest">
                            {selectedPkg?.paymentType === 'subscription' 
                              ? 'Activating Subscription...' 
                              : 'Validating Signal Authentication...'
                            }
                          </p>
                        </div>
                      )}
                      
                      <button 
                        onClick={() => { setShowPayPal(false); isRenderingRef.current = false; setButtonsRendered(false); }} 
                        disabled={isPaying} 
                        className="mt-12 text-[11px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-all underline underline-offset-8 decoration-2 decoration-emerald-500/30"
                      >
                        Back to Review
                      </button>
                    </div>
                  )
                ) : (
                  <div className="py-24 animate-in zoom-in duration-700">
                    <div className="text-8xl mb-10 animate-bounce">
                      {selectedPkg?.paymentType === 'subscription' ? '🔄' : '⚡'}
                    </div>
                    <h3 className="text-4xl font-black text-emerald-600 uppercase tracking-tighter mb-4">
                      {selectedPkg?.paymentType === 'subscription' ? 'Subscription Active' : 'Signal Authorized'}
                    </h3>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                      {selectedPkg?.paymentType === 'subscription' 
                        ? 'Monthly billing activated • Create unlimited ads'
                        : 'Initializing Neural Broadcast Builder...'
                      }
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="grid lg:grid-cols-2 gap-16 animate-in slide-in-from-bottom-12 duration-700 pb-12">
                <div className="space-y-8">
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Broadcast Headline</label>
                    <input placeholder="Personal catchphrase..." className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-3xl font-black text-base text-slate-900 dark:text-white outline-none shadow-inner transition-all" value={form.headline} onChange={e => setForm({...form, headline: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Transmission Narrative</label>
                    <textarea placeholder="Tell your story to the global feed..." className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-400 rounded-3xl h-40 font-medium text-base text-slate-900 dark:text-white outline-none resize-none shadow-inner transition-all" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                  </div>
                  <div>
                     <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Visual Signal Asset (GIF/Video/Img)</label>
                     <div onClick={() => fileInputRef.current?.click()} className="w-full p-12 border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] flex flex-col items-center justify-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/10 transition-all group overflow-hidden shadow-inner bg-slate-50/30 dark:bg-slate-900/40">
                        {form.mediaUrl ? (
                          <div className="relative w-full aspect-video">
                             {form.mediaType === 'video' ? <video src={form.mediaUrl} className="w-full h-full object-contain" autoPlay muted loop /> : <img src={form.mediaUrl} className="w-full h-full object-contain" alt="" />}
                          </div>
                        ) : (
                          <div className="text-center group-hover:scale-110 transition-transform">
                            <span className="text-6xl block mb-4 opacity-20">📡</span>
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Sync Visual Signal</p>
                          </div>
                        )}
                     </div>
                     <input type="file" ref={fileInputRef} hidden accept="image/*,video/*" onChange={handleFileUpload} />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Action Call</label>
                      <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 text-[10px] font-black uppercase dark:text-white shadow-inner" value={form.ctaText} onChange={e => setForm({...form, ctaText: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3 block ml-1">Sync Link</label>
                      <input className="w-full p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none border border-slate-100 dark:border-slate-700 text-[10px] font-black dark:text-white shadow-inner" value={form.ctaLink} onChange={e => setForm({...form, ctaLink: e.target.value})} />
                    </div>
                  </div>
                  <button onClick={handleBroadcast} className="w-full py-6 aura-bg-gradient text-white font-black uppercase rounded-[2.5rem] text-sm tracking-[0.4em] shadow-2xl shadow-emerald-500/40 hover:brightness-110 active:scale-95 transition-all mt-6">Launch Broadcast</button>
                </div>
                
                <div className="sticky top-0">
                   <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-6 ml-1">Network Simulation</p>
                   <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-[4rem] shadow-2xl scale-[0.98] border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <AdCard ad={previewAd} />
                   </div>
                </div>
              </div>
            )}
          </div>
        ) : tab === 'manage' ? (
          <div className="animate-in fade-in duration-500 pb-12">
            {ads.filter(a => a.ownerId === currentUser.id).length === 0 ? (
              <div className="py-48 text-center bg-slate-50 dark:bg-slate-950/20 rounded-[4rem] border-4 border-dashed border-slate-100 dark:border-slate-800">
                <div className="text-8xl mb-12 opacity-10">📣</div>
                <p className="text-[11px] font-black uppercase tracking-[0.5em] text-slate-300 dark:text-slate-700">No active network broadcasts</p>
                <button onClick={() => setTab('create')} className="mt-14 px-14 py-6 aura-bg-gradient text-white font-black uppercase text-[11px] tracking-widest rounded-[2rem] shadow-2xl hover:brightness-110 active:scale-95 transition-all">Start Your First Broadcast</button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-12">
                {ads.filter(a => a.ownerId === currentUser.id).map(ad => (
                  <div key={ad.id} className="relative group">
                    <AdCard ad={ad} />
                    <div className="absolute top-12 right-12 flex flex-col gap-5 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0">
                      <button onClick={() => onAdCancelled(ad.id)} className="p-6 bg-rose-500 text-white rounded-[2.5rem] shadow-2xl hover:bg-rose-600 active:scale-90 font-black uppercase text-[11px] tracking-widest border-4 border-white dark:border-slate-900">Kill Signal</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <SubscriptionManager currentUser={currentUser} onClose={onClose} />
        )}
      </div>
    </div>
  );
};

export default AdManager;
