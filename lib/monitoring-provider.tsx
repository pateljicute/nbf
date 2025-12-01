'use client';

import { ReactNode } from 'react';

// Lightweight monitoring provider - analytics disabled to save bandwidth
export function MonitoringProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
