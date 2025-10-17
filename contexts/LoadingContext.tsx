import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingContextType {
  isDashboardLoading: boolean;
  setIsDashboardLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);

  return (
    <LoadingContext.Provider value={{ isDashboardLoading, setIsDashboardLoading }}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
}
