import { useEffect } from "react";

const BASE_TITLE = 'Aura · Connect & Radiate';

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const VIEW_TITLE_MAP: Record<string, string> = {
  'ad_manager': 'Ads',
  'data_aura': 'Data Aura',
  'acquaintances': 'Acquaintances',
  'chat': 'Messages',
};

export function usePageTitle(view?: string) {
  useEffect(() => {
    if (!view || view === 'feed') {
      document.title = BASE_TITLE;
      return;
    }

    const title = VIEW_TITLE_MAP[view] || capitalize(view);
    document.title = `${title} · Aura`;
  }, [view]);
}
