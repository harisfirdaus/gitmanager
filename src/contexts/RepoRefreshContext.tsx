import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface RepoRefreshContextType {
  repoDetailsKey: number;
  triggerRepoDetailsRefresh: () => void;
}

const RepoRefreshContext = createContext<RepoRefreshContextType | undefined>(undefined);

export const useRepoRefresh = () => {
  const context = useContext(RepoRefreshContext);
  if (!context) {
    throw new Error('useRepoRefresh must be used within a RepoRefreshProvider');
  }
  return context;
};

interface RepoRefreshProviderProps {
  children: ReactNode;
}

export const RepoRefreshProvider: React.FC<RepoRefreshProviderProps> = ({ children }) => {
  const [repoDetailsKey, setRepoDetailsKey] = useState(0);

  const triggerRepoDetailsRefresh = useCallback(() => {
    setRepoDetailsKey(prevKey => prevKey + 1);
  }, []);

  const value = {
    repoDetailsKey,
    triggerRepoDetailsRefresh
  };

  return (
    <RepoRefreshContext.Provider value={value}>
      {children}
    </RepoRefreshContext.Provider>
  );
}; 