import { api } from '../api/client';
import { offlineDb, type OfflineCheckIn } from '../storage/offlineDb';

export async function syncOfflineCheckIns() {
  const checkIns = offlineDb.getCheckIns();
  if (checkIns.length === 0) return;

  console.log(`Attempting to sync ${checkIns.length} offline check-ins`);
  
  const successful: OfflineCheckIn[] = [];

  for (const checkIn of checkIns) {
    try {
      await api.post(`/tickets/check-in?o=${checkIn.payload}&s=${checkIn.signature}${checkIn.gate ? `&gate=${encodeURIComponent(checkIn.gate)}` : ''}`);
      successful.push(checkIn);
    } catch (error: any) {
      console.error('Failed to sync check-in', checkIn, error.message);
      // If it's already checked in on server, we can consider it successful for cleanup
      if (error.response?.data?.message?.includes('already checked in')) {
          successful.push(checkIn);
      }
    }
  }

  if (successful.length > 0) {
    offlineDb.removeCheckIns(successful);
    console.log(`Successfully synced ${successful.length} check-ins`);
  }
}

let syncInterval: number | null = null;

export function startSyncInterval() {
  if (syncInterval) return;
  
  // Try sync immediately on start
  syncOfflineCheckIns();

  // Every 10 minutes
  syncInterval = window.setInterval(syncOfflineCheckIns, 10 * 60 * 1000);
}

export function stopSyncInterval() {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
}
