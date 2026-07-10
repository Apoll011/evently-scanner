const OFFLINE_DB_KEY = 'ticket_scanner_offline_checkins';

export interface OfflineCheckIn {
  payload: string;
  signature: string;
  timestamp: string;
  gate: string | null;
}

export const offlineDb = {
  getCheckIns: (): OfflineCheckIn[] => {
    const data = localStorage.getItem(OFFLINE_DB_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  saveCheckIn: (checkIn: OfflineCheckIn) => {
    const checkIns = offlineDb.getCheckIns();
    checkIns.push(checkIn);
    localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify(checkIns));
  },

  removeCheckIns: (toRemove: OfflineCheckIn[]) => {
    const checkIns = offlineDb.getCheckIns();
    const remaining = checkIns.filter(c => 
      !toRemove.some(r => r.payload === c.payload && r.signature === c.signature)
    );
    localStorage.setItem(OFFLINE_DB_KEY, JSON.stringify(remaining));
  },

  clear: () => {
    localStorage.removeItem(OFFLINE_DB_KEY);
  }
};
