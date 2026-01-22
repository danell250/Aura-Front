import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreditBundle, User } from '../types';

const log = (...args: any[]) => {
  if (import.meta.env.DEV) console.log(...args);
};

declare global {
  interface Window {
    paypal?: any;
  }
}

interface CreditStoreModalProps {
  currentUser: User;
  bundles: CreditBundle[];
  onPurchase: (bundle: CreditBundle, orderId: string) => void;
  onClose: () => void;
}

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || 'AXxjiGRRXzL0lhWXhz9lUCYnIXg0Sfz-9-kDB7HbdwYPOrlspRzyS6TQWAlwRC2GlYSd4lze25jluDLj';
const PAYPAL_SDK_URL = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD&intent=capture&disable-funding=credit,card`;

const CreditStoreModal: React.FC<CreditStoreModalProps> = ({ currentUser, bundles, onPurchase, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(true);

  const paypalRef = useRef<HTMLDivElement | null>(null);
  const buttonsInstanceRef = useRef<any>(null);

  const fixed = (v: any, digits = 2) => {
    const val = v ?? 0;
    const num = Number(val);
    return Number.isFinite(num) ? num.toFixed(digits) : (0).toFixed(digits);
  };
  const fmt2 = (v: any) => fixed(v, 2);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Clean up PayPal instance on unmount
  useEffect(() => {
    return () => {
      setMounted(false);
      if (buttonsInstanceRef.current) {
        try {
          buttonsInstanceRef.current.close?.();
        } catch (e) {
          log('Error closing PayPal buttons:', e);
        }
      }
    };
  }, []);

  const retryPayPal = useCallback(() => {
    log("[Aura] Retrying PayPal...");
    setRenderError(null);
    setSdkReady(false);

    // Force reload SDK
    if (window.paypal) {
      delete (window as any).paypal;
    }

    const script = document.querySelector('script[src*="paypal.com/sdk/js"]');
    if (script) script.remove();

    // Wait then reload
    setTimeout(() => {
      const newScript = document.createElement('script');
      newScript.src = PAYPAL_SDK_URL;
      newScript.async = true;
      newScript.onload = () => {
        setTimeout(() => {
          if (mounted && window.paypal?.Buttons) {
            setSdkReady(true);
          }
        }, 500);
      };
      newScript.onerror = () => {
        if (mounted) setRenderError("Failed to load PayPal SDK");
      };
      document.body.appendChild(newScript);
    }, 500);
  }, [mounted]);

  useEffect(() => {
    let isMounted = true;
    let scriptTag: HTMLScriptElement | null = null;

    const loadPayPal = async () => {
      // Check for existing script
      const existingScript = document.querySelector('script[src*="paypal.com/sdk/js"]') as HTMLScriptElement;
      
      if (existingScript) {
        // Verify if the existing script matches our configuration
        if (existingScript.src === PAYPAL_SDK_URL) {
          if (window.paypal?.Buttons) {
            if (isMounted) setSdkReady(true);
            return;
          }
          
          // Script exists but PayPal not ready yet, wait for it
          const waitForReady = setInterval(() => {
            if (window.paypal?.Buttons) {
              if (isMounted) setSdkReady(true);
              clearInterval(waitForReady);
            }
          }, 300);

          setTimeout(() => {
            clearInterval(waitForReady);
            if (isMounted && !window.paypal?.Buttons) {
              setRenderError("PayPal SDK timeout");
            }
          }, 8000);
          return;
        } else {
          // Wrong configuration (e.g. left over from AdManager), remove and reload
          log("[Aura] Switching PayPal SDK for Credit Store...");
          existingScript.remove();
          if (window.paypal) {
            // @ts-ignore
            delete window.paypal;
          }
        }
      }

      try {
        log("[Aura] Loading PayPal SDK...");
        scriptTag = document.createElement('script');
        scriptTag.src = PAYPAL_SDK_URL;
        scriptTag.async = true;

        scriptTag.onload = () => {
          setTimeout(() => {
            if (isMounted && window.paypal?.Buttons) {
              setSdkReady(true);
            } else if (isMounted) {
              setRenderError("PayPal SDK failed to initialize");
            }
          }, 400);
        };

        scriptTag.onerror = () => {
          if (isMounted) {
            setRenderError("Failed to load PayPal SDK. Check your internet connection.");
          }
        };

        document.body.appendChild(scriptTag);
      } catch (err) {
        console.error('Error loading PayPal:', err);
        if (isMounted) setRenderError("Error loading payment gateway");
      }
    };

    loadPayPal();

    return () => {
      isMounted = false;
    };
  }, []);

  // Render PayPal buttons
  useEffect(() => {
    if (step !== 2 || !sdkReady || !selectedBundle || !paypalRef.current) return;
    if (!window.paypal?.Buttons || !mounted) return;

    // Don't re-render if buttons already exist
    if (paypalRef.current.children.length > 0) {
      log('[Aura] PayPal buttons already rendered');
      return;
    }

    log('[Aura] Creating PayPal buttons...');
    setRenderError(null);

    try {
      const buttons = window.paypal.Buttons({
        style: {
          layout: 'vertical',
          color: 'gold',
          shape: 'rect',
          label: 'pay',
          tagline: false, // Remove tagline to reduce complexity
        },

        createOrder: (data: any, actions: any) => {
          log('[Aura] Creating order for:', selectedBundle.name);

          const price = fmt2(selectedBundle.numericPrice);

          if (!price || isNaN(Number(price))) {
            throw new Error('Invalid bundle price');
          }

          return actions.order.create({
            intent: 'CAPTURE',
            purchase_units: [
              {
                description: `Aura Credits: ${selectedBundle.name}`,
                amount: {
                  currency_code: 'USD',
                  value: price,
                },
              },
            ],
          });
        },

        onApprove: async (data: any, actions: any) => {
          if (!mounted) return;

          setIsPaying(true);
          try {
            const details = await actions.order.capture();
            const orderId = data.orderID || details?.id;

            if (!orderId) {
              throw new Error('No order ID returned');
            }

            log('[Aura] Payment successful:', orderId);
            if (mounted) {
              onPurchase(selectedBundle!, orderId);
              onClose();
            }
          } catch (err) {
            console.error('[Aura] Capture error:', err);
            if (mounted) {
              setIsPaying(false);
              setRenderError('Payment capture failed. Please contact support.');
            }
          }
        },

        onError: (err: any) => {
          console.error('[Aura] PayPal error:', err);
          if (mounted) {
            const msg = err?.message || 'Payment failed';
            setRenderError(`${msg}. Please try again.`);
          }
        },

        onCancel: () => {
          log('[Aura] Payment cancelled');
          if (mounted) {
            setRenderError('Payment cancelled. No charges were made.');
          }
        },
      });

      // Store reference for cleanup
      buttonsInstanceRef.current = buttons;

      // Render buttons
      buttons.render(paypalRef.current).catch((err: any) => {
        console.error('[Aura] Render error:', err);
        if (mounted) {
          setRenderError('Failed to render payment button. Please try again.');
        }
      });
    } catch (err) {
      console.error('[Aura] Button creation error:', err);
      if (mounted) {
        setRenderError('Failed to initialize payment. Please refresh and try again.');
      }
    }
  }, [step, sdkReady, selectedBundle, onPurchase, onClose, mounted]);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[3.5rem] p-10 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Neural Credit Store</h2>
            <p className="text-[10px] font-black uppercase text-emerald-600 tracking-[0.2em] mt-1">Upgrade your influence frequency</p>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-slate-400 hover:text-rose-500 transition-all">✕</button>
        </div>

        {step === 1 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 pb-6">
            {bundles.map(bundle => (
              <div key={bundle.id} className="bg-slate-50 dark:bg-slate-800 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 flex flex-col justify-between group hover:border-emerald-400 transition-all hover:shadow-xl relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${bundle.gradient}`}></div>
                <div className="text-center mb-6">
                  <span className="text-4xl block mb-4 group-hover:scale-125 transition-transform duration-500">{bundle.icon}</span>
                  <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{bundle.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">{bundle.description}</p>
                </div>
                <div className="text-center mb-8">
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{bundle.credits}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Credits</p>
                  <p className="mt-4 text-xl font-black text-slate-400">{bundle.price}</p>
                </div>
                <button
                  onClick={() => { setSelectedBundle(bundle); setStep(2); }}
                  className="w-full py-4 aura-bg-gradient text-white font-black uppercase rounded-2xl text-[10px] tracking-widest shadow-lg hover:brightness-110 active:scale-95 transition-all"
                >
                  Buy Bundle
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="max-w-md mx-auto py-10 text-center">
            <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8">💳</div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Secure Payment</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-10">Bundle: {selectedBundle?.name} • {selectedBundle?.price}</p>

            {renderError && (
              <div className="mb-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 leading-relaxed mb-3">{renderError}</p>
                <button
                  onClick={retryPayPal}
                  className="px-4 py-2 bg-rose-500 text-white font-black uppercase text-[9px] tracking-widest rounded-xl hover:bg-rose-600 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            )}

            <div ref={paypalRef} className="min-h-[150px] mb-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6 relative">
              {!sdkReady && !renderError && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                    Loading Payment Gateway...
                  </p>
                </div>
              )}
            </div>

            {isPaying && <p className="text-emerald-500 text-[10px] font-black uppercase animate-pulse">Processing Payment...</p>}

            <button onClick={() => {
              setStep(1);
              setRenderError(null);
            }} className="mt-8 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all underline">Back to bundles</button>
          </div>
        )}

        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8 opacity-40 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="PayPal" />
          <div className="h-6 w-px bg-slate-300"></div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Payment Processing</p>
        </div>
      </div>
    </div>
  );
};

export default CreditStoreModal;
