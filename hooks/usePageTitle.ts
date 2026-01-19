import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const base = "Aura · Connect & Radiate";
    const map: Record<string, string> = {
      "/feed": "Feed · Aura",
      "/ads": "Ads · Aura",
      "/login": "Login · Aura",
      "/profile": "Profile · Aura",
      "/settings": "Settings · Aura",
      "/messages": "Messages · Aura",
      "/chat": "Messages · Aura",
      "/notifications": "Notifications · Aura",
      "/acquaintances": "Acquaintances · Aura",
      "/data-aura": "Data Aura · Aura",
      "/ads/analytics": "Ad Manager · Aura",
      "/terms": "Terms · Aura",
      "/privacy": "Privacy · Aura",
    };
    
    // Handle dynamic routes or exact matches
    if (map[pathname]) {
      document.title = map[pathname];
    } else if (pathname.startsWith('/profile/')) {
      document.title = "Profile · Aura";
    } else if (pathname.startsWith('/chat/')) {
      document.title = "Messages · Aura";
    } else {
      document.title = base;
    }
  }, [pathname]);
}
