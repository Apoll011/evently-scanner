import type { ScannerState, ScannerSession, Event } from '../types';

const STORAGE_KEYS = {
  SERVER_URL: 'ticket_scanner_server_url',
  SESSION: 'ticket_scanner_session',
  EVENT: 'ticket_scanner_event',
  GATE: 'ticket_scanner_gate',
};

export const storage = {
  getServerUrl: (): string | null => localStorage.getItem(STORAGE_KEYS.SERVER_URL),
  setServerUrl: (url: string) => localStorage.setItem(STORAGE_KEYS.SERVER_URL, url),
  
  getSession: (): ScannerSession | null => {
    const session = localStorage.getItem(STORAGE_KEYS.SESSION);
    return session ? JSON.parse(session) : null;
  },
  setSession: (session: ScannerSession) => localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session)),
  
  getEvent: (): Event | null => {
    const event = localStorage.getItem(STORAGE_KEYS.EVENT);
    return event ? JSON.parse(event) : null;
  },
  setEvent: (event: Event) => localStorage.setItem(STORAGE_KEYS.EVENT, JSON.stringify(event)),
  
  getGate: (): string | null => localStorage.getItem(STORAGE_KEYS.GATE),
  setGate: (gate: string) => localStorage.setItem(STORAGE_KEYS.GATE, gate),

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.EVENT);
    localStorage.removeItem(STORAGE_KEYS.GATE);
  },

  forgetServer: () => {
    localStorage.clear();
  },

  getState: (): ScannerState => ({
    serverUrl: storage.getServerUrl(),
    session: storage.getSession(),
    event: storage.getEvent(),
    gate: storage.getGate(),
  }),
};
