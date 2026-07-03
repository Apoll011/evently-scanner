import { createContext, useContext, useState, type ReactNode } from 'react';
import type { ScannerState, ScannerSession, Event } from '../types';
import { storage } from '../storage';

interface ScannerContextType extends ScannerState {
  setServerUrl: (url: string) => void;
  setSession: (session: ScannerSession) => void;
  setEvent: (event: Event) => void;
  setGate: (gate: string) => void;
  logout: () => void;
  forgetServer: () => void;
  isConfigured: boolean;
  isAuthenticated: boolean;
}

const ScannerContext = createContext<ScannerContextType | undefined>(undefined);

export function ScannerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ScannerState>(storage.getState());

  const setServerUrl = (url: string) => {
    storage.setServerUrl(url);
    setState(prev => ({ ...prev, serverUrl: url }));
  };

  const setSession = (session: ScannerSession) => {
    storage.setSession(session);
    setState(prev => ({ ...prev, session }));
  };

  const setEvent = (event: Event) => {
    storage.setEvent(event);
    setState(prev => ({ ...prev, event }));
  };

  const setGate = (gate: string) => {
    storage.setGate(gate);
    setState(prev => ({ ...prev, gate }));
  };

  const logout = () => {
    storage.logout();
    setState(prev => ({ ...prev, session: null, event: null, gate: null }));
  };

  const forgetServer = () => {
    storage.forgetServer();
    setState({ serverUrl: null, session: null, event: null, gate: null });
  };

  const isConfigured = !!state.serverUrl;
  const isAuthenticated = !!state.session?.accessToken;

  return (
    <ScannerContext.Provider
      value={{
        ...state,
        setServerUrl,
        setSession,
        setEvent,
        setGate,
        logout,
        forgetServer,
        isConfigured,
        isAuthenticated,
      }}
    >
      {children}
    </ScannerContext.Provider>
  );
}

export function useScanner() {
  const context = useContext(ScannerContext);
  if (context === undefined) {
    throw new Error('useScanner must be used within a ScannerProvider');
  }
  return context;
}
