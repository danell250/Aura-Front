
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { CreditBundle, User } from '../types';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface CreditStoreModalProps {
  currentUser: User;
  bundles: CreditBundle[];
  onPurchase: (bundle: CreditBundle) => void;
  onClose: () => void;
}

const CreditStoreModal: React.FC<CreditStoreModalProps> = ({ currentUser, bundles, onPurchase, onClose }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedBundle, setSelectedBundle] = useState<CreditBundle | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [mountKey, setMountKey] = useState(0);
  const [buttonsRendered, setButtonsRendered] = useState(false);

  const paypalRef = useRef<HTMLDivElement>(null);
  const activeInstanceRef = useRef<any>(null);
  const isRenderingRef = useRef<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadSdk = async () => {
      try {
        // Load PayPal SDK with popup-friendly configuration
        const script = document.createElement('script');
        script.src = `https://www.paypal.com/sdk/js?client-id=AeHnqoH5sPvK2X4xLgYQnZ3p8rFk7mNqLwXj4vBt6yCg9hD2eRf5kLp8mNqXj4vBt&currency=USD&disable-funding=credit,card`;
        script.async = true;
        script.onload = () => {
          if (isMounted) setSdkReady(true);
        };
        script.onerror = () => {
          console.error('PayPal SDK failed to load');
          if (isMounted) setRenderError("Payment Gateway Connection Failed.");
        };
        document.body.appendChild(script);
      } catch (error) {
        console.error('Error loading PayPal SDK:', error);
        if (isMounted) setRenderError("Payment Gateway Connection Failed.");
      }
    };
    loadSdk();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (step === 2 && sdkReady && selectedBundle && !buttonsRendered) {
      const initButtons = async () => {
        const containerId = `paypal-credits-container-${mountKey}`;
        const container = document.getElementById(containerId);
        if (!container || isRenderingRef.current) return;

        isRenderingRef.current = true;
        try {
          const buttons = window.paypal.Buttons({
            style: { layout: 'vertical', color: 'blue', shape: 'rect' },
            fundingSource: undefined, // Allow all funding sources
            createOrder: (data: any, actions: any) => {
              return actions.order.create({
                purchase_units: [{
                  description: `Aura Credit Bundle: ${selectedBundle.name}`,
                  amount: { currency_code: "USD", value: selectedBundle.numericPrice.toString() }
                }]
              });
            },
            onApprove: async (data: any, actions: any) => {
              setIsPaying(true);
              await actions.order.capture();
              onPurchase(selectedBundle);
              setIsPaying(false);
              onClose();
            },
            onError: (err: any) => {
              console.error('PayPal button error:', err);
              setRenderError('Payment failed. Please try again.');
            },
            onCancel: () => {
              console.log('PayPal payment cancelled');
            }
          });
          await buttons.render(`#${containerId}`);
          setButtonsRendered(true);
        } catch (e) {
          isRenderingRef.current = false;
        }
      };
      initButtons();
    }
  }, [step, sdkReady, selectedBundle, mountKey, buttonsRendered, onPurchase, onClose]);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300">
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
            
            {renderError && <p className="text-rose-500 text-[10px] mb-4 font-black uppercase">{renderError}</p>}
            
            <div id={`paypal-credits-container-${mountKey}`} className="min-h-[150px] mb-8 bg-slate-50 dark:bg-slate-800/50 rounded-3xl p-6">
              {!buttonsRendered && !renderError && <div className="animate-pulse py-10 text-[10px] font-black uppercase text-slate-400">Syncing Payment Node...</div>}
            </div>

            {isPaying && <p className="text-emerald-500 text-[10px] font-black uppercase animate-pulse">Capturing Transaction...</p>}

            <button onClick={() => { setStep(1); setButtonsRendered(false); isRenderingRef.current = false; }} className="mt-8 text-[10px] font-black uppercase text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all underline">Back to bundles</button>
          </div>
        )}

        <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8 opacity-40 grayscale">
          <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-6" alt="PayPal" />
          <div className="h-6 w-px bg-slate-300"></div>
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500">Secure Neural Encryption</p>
        </div>
      </div>
    </div>
  );
};

export default CreditStoreModal;
