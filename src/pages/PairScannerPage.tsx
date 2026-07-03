import { useState, useCallback } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { QRScanner } from '../components/scanner/QRScanner';
import { parsePairingQr } from '../utils/qr';
import { api } from '../api/client';
import type { ScannerSession, Event } from '../types';
import { useNavigate } from 'react-router-dom';
import { Loader2, Calendar, Users, Info, MapPin } from 'lucide-react';

export function PairScannerPage() {
  const { setSession, setEvent, setGate, gate, event } = useScanner();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pairedSession, setPairedSession] = useState<ScannerSession | null>(null);

  const handleScan = useCallback(async (result: string) => {
    if (loading || pairedSession) return;

    const token = parsePairingQr(result);
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      // 1. Scanner Login
      const loginRes = await api.post<{ accessToken: string }>('/auth/scanner-login', {
        pairingToken: token,
      });
      const accessToken = loginRes.data.accessToken;

      // Temporary update to api client for next calls
      api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

      // 2. Get Scanner Info
      const scannerRes = await api.get<{ id: string; eventId: string; organizerId: string }>('/auth/scanner', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const sessionData: ScannerSession = {
        accessToken,
        scannerId: scannerRes.data.id,
        eventId: scannerRes.data.eventId,
        organizerId: scannerRes.data.organizerId,
      };

      const eventRes = await api.get<Event>(`/events/${sessionData.eventId}`);
      
      setPairedSession(sessionData);
      setEvent(eventRes.data);
      setSession(sessionData);
      navigate("/");
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Authentication failed');
      setLoading(false);
    }
  }, [loading, pairedSession, navigate, setEvent, setSession]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-dvh bg-background p-6">
        <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
        <h2 className="text-xl font-bold">Pairing Scanner...</h2>
        <p className="text-muted-foreground text-center mt-2">Connecting to server and fetching event data.</p>
      </div>
    );
  }

  if (pairedSession && event) {
    return (
      <div className="flex flex-col h-dvh bg-background overflow-y-auto">
        <div className="relative w-full aspect-video bg-muted flex items-center justify-center">
           {event.bannerUrl ? (
             <img src={event.bannerUrl} alt={event.name} className="w-full h-full object-cover" />
           ) : (
             <div className="text-muted-foreground flex flex-col items-center">
                <Info size={48} className="mb-2" />
                <span>Event Banner Placeholder</span>
             </div>
           )}
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-3xl font-black mb-2">{event.name}</h1>
            <p className="text-muted-foreground">{event.description}</p>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div className="flex items-center gap-3 p-4 bg-card border rounded-xl shadow-sm">
                <Calendar className="text-primary" />
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-bold">Date & Time</p>
                   <p className="font-medium">{event.date} at {event.time}</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-card border rounded-xl shadow-sm">
                <Users className="text-primary" />
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-bold">Capacity & Status</p>
                   <p className="font-medium">{event.capacity} seats • {event.status}</p>
                </div>
             </div>
             <div className="flex items-center gap-3 p-4 bg-card border rounded-xl shadow-sm">
                <Info className="text-primary" />
                <div>
                   <p className="text-xs text-muted-foreground uppercase font-bold">Identifiers</p>
                   <p className="font-medium text-xs">Org: {event.organizerId}<br/>Event: {event.id}</p>
                </div>
             </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
               <MapPin size={16} /> Gate
            </label>
            <input
              type="text"
              placeholder="e.g. North Entrance"
              value={gate || ''}
              onChange={(e) => setGate(e.target.value)}
              className="w-full p-4 bg-background border-2 rounded-xl focus:border-primary outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => navigate('/scanner')}
            className="w-full py-4 bg-primary text-primary-foreground rounded-xl text-xl font-bold shadow-lg hover:opacity-90 transition-opacity"
          >
            Start Scanning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <div className="flex-1 relative">
        <QRScanner onScan={handleScan} />
        {error && (
          <div className="absolute top-4 left-4 right-4 p-4 bg-destructive text-destructive-foreground rounded-lg shadow-xl text-center font-bold">
             {error}
          </div>
        )}
      </div>
      <div className="p-8 text-center bg-card border-t shadow-lg">
        <h1 className="text-xl font-bold mb-2">Pair Scanner</h1>
        <p className="text-muted-foreground">Scan your scanner pairing QR code</p>
      </div>
    </div>
  );
}
