'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

type ListingMode = 'rent' | 'sell';

interface ListingModeContextType {
  mode: ListingMode;
  setMode: (mode: ListingMode) => void;
  toggleMode: () => void;
}

const ListingModeContext = createContext<ListingModeContextType | undefined>(undefined);

// ── ModeUrlSync: Separate component for URL ↔ mode sync ──────────────────────
// Uses useSearchParams() so MUST be rendered inside <Suspense> by the caller.
// Renders nothing — pure side-effect component.
export function ModeUrlSync() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { mode, setMode } = useListingMode();

  // Read ?mode= from URL on mount / URL change → apply to context
  useEffect(() => {
    const urlMode = searchParams.get('mode') as ListingMode | null;
    if (urlMode && (urlMode === 'rent' || urlMode === 'sell') && urlMode !== mode) {
      setMode(urlMode);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // When mode changes via toggle → update URL (homepage only)
  useEffect(() => {
    if (pathname !== '/') return;
    const currentUrlMode = searchParams.get('mode');
    const expectedUrlMode = mode === 'rent' ? null : 'sell';
    // Skip if URL is already correct
    if ((currentUrlMode ?? null) === expectedUrlMode) return;

    const params = new URLSearchParams(searchParams.toString());
    if (mode === 'rent') {
      params.delete('mode'); // Clean URL for default mode
    } else {
      params.set('mode', mode);
    }
    const newUrl = params.toString() ? `/?${params.toString()}` : '/';
    router.replace(newUrl, { scroll: false });
  }, [mode, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

// ── ListingModeProvider: Pure localStorage-based provider (no useSearchParams) ─
export function ListingModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ListingMode>('rent');

  useEffect(() => {
    const savedMode = localStorage.getItem('nbf_listing_mode') as ListingMode;
    if (savedMode && (savedMode === 'rent' || savedMode === 'sell')) {
      setModeState(savedMode);
    }
  }, []);

  const setMode = useCallback((newMode: ListingMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('nbf_listing_mode', newMode);
    }
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'rent' ? 'sell' : 'rent');
  }, [mode, setMode]);

  return (
    <ListingModeContext.Provider value={{ mode, setMode, toggleMode }}>
      {children}
    </ListingModeContext.Provider>
  );
}

export function useListingMode() {
  const context = useContext(ListingModeContext);
  if (context === undefined) {
    throw new Error('useListingMode must be used within a ListingModeProvider');
  }
  return context;
}
