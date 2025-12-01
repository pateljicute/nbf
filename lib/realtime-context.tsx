'use client';

import { createContext, useContext, ReactNode } from 'react';

interface RealtimeContextType {
  notifications: any[];
  unreadCount: number;
  subscribeToPropertyUpdates: (propertyId?: string) => void;
  subscribeToUserNotifications: (userId: string) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined);

// Lightweight provider - realtime disabled to save bandwidth
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const value: RealtimeContextType = {
    notifications: [],
    unreadCount: 0,
    subscribeToPropertyUpdates: () => {},
    subscribeToUserNotifications: () => {},
    markAsRead: () => {},
    markAllAsRead: () => {},
  };

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtime() {
  const context = useContext(RealtimeContext);
  if (!context) {
    throw new Error('useRealtime must be used within a RealtimeProvider');
  }
  return context;
}
