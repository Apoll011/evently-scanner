import { useState, useCallback } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { QRScanner } from '../components/scanner/QRScanner';
import {parseTickeCodetQr, parseTicketQr} from '../utils/qr';
import { api } from '../api/client';
import type { Ticket, CheckInResponse } from '../types';
import { DigitalTicket } from '../components/DigitalTicket';
import { X, Check, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Mode = 'validate' | 'check-in';

export function ScannerPage() {
  const { event, gate } = useScanner();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>('validate');
  const [result, setResult] = useState<{ type: 'success' | 'error' | 'ticket'; data: any } | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const handleScan = useCallback(async (text: string) => {
    if (!isScanning) return;
    let codeMode = false;

    let payload;
    if (text.startsWith('ticket://')) {
      payload = parseTicketQr(text);
    } else if (text.startsWith('t://')) {
      payload = parseTickeCodetQr(text)
      codeMode = true;
    } else {
      try {
        const json = JSON.parse(text);
        if (json.payload && json.signature) {
          payload = json;
        }
      } catch (e) {
        showError('Invalid QR format');
        return;
      }
    }

    if (!payload) {
      showError('Invalid QR format');
      return;
    }

    setIsScanning(false);

    try {
      if (mode === 'validate') {
        let res;
        if (codeMode) {
          res = await api.get<Ticket>(`/tickets/code?code=${payload}`);
        } else {
          res = await api.get<Ticket>(`/tickets?o=${payload.payload}&s=${payload.signature}`);
        }
        setResult({ type: 'ticket', data: res.data });
      } else {
        let res;
        if (codeMode) {
          res = await api.post<CheckInResponse>(`/tickets/code/check-in?code=${payload}${gate ? `&gate=${encodeURIComponent(gate)}` : ''}`);
        } else {
          res = await api.post<CheckInResponse>(`/tickets/check-in?o=${payload.payload}&s=${payload.signature}${gate ? `&gate=${encodeURIComponent(gate)}` : ''}`);
        }
        setResult({ type: 'success', data: res.data });
      }

      // Vibrate if supported
      if ('vibrate' in navigator) navigator.vibrate(200);
      
    } catch (err: any) {
      showError(err.response?.data?.message || 'Server error');
      if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
    }

    codeMode = false;
    // Auto-return after 5 seconds for ticket view, 2 seconds for others
    const timeout = mode === 'validate' ? 5000 : 2000;
    setTimeout(() => {
      setResult(null);
      setIsScanning(true);
    }, timeout);
  }, [isScanning, mode, gate]);

  const showError = (message: string) => {
    setResult({ type: 'error', data: message });
    setTimeout(() => {
      setResult(null);
      setIsScanning(true);
    }, 2000);
  };

  return (
    <div className="flex flex-col h-dvh bg-black text-white overflow-hidden">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-md p-4 flex flex-col items-center gap-4">
        <div className="w-full flex items-center justify-between">
           <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-full">
              <ArrowLeft size={24} />
           </button>
           <h1 className="font-bold truncate px-4">{event?.name || 'Scanner'}</h1>
           {gate && (
             <div className="absolute top-16 right-4 bg-primary text-primary-foreground px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
               Gate: {gate}
             </div>
           )}
           <div className="w-10" />
        </div>

        <div className="flex bg-white/10 p-1 rounded-xl w-full max-w-xs">
           <button
             onClick={() => setMode('validate')}
             className={cn(
               "flex-1 py-2 px-4 rounded-lg font-bold transition-all",
               mode === 'validate' ? "bg-white text-black shadow-lg" : "text-white/60"
             )}
           >
             Validate
           </button>
           <button
             onClick={() => setMode('check-in')}
             className={cn(
               "flex-1 py-2 px-4 rounded-lg font-bold transition-all",
               mode === 'check-in' ? "bg-white text-black shadow-lg" : "text-white/60"
             )}
           >
             Check-In
           </button>
        </div>
      </header>

      {/* Camera */}
      <div className="flex-1">
        <QRScanner onScan={handleScan} active={isScanning} />
      </div>

      {/* Overlay Results */}
      {result && (
        <div className={cn(
          "fixed inset-0 z-50 flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200",
          result.type === 'error' ? "bg-red-600/90" : 
          result.type === 'success' ? "bg-green-600/90" : 
          "bg-black/80"
        )}>
          {result.type === 'error' && (
            <div className="text-center space-y-4">
               <div className="bg-white/20 p-6 rounded-full inline-block">
                  <X size={64} strokeWidth={3} />
               </div>
               <h2 className="text-3xl font-black uppercase">Failed</h2>
               <p className="text-xl font-bold">{result.data}</p>
            </div>
          )}

          {result.type === 'success' && (
             <div className="text-center space-y-4 max-w-sm">
                <div className="bg-white/20 p-6 rounded-full inline-block">
                   <Check size={64} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black uppercase">Checked In</h2>
                <div className="bg-white/10 p-6 rounded-[2rem] border border-white/10 text-left space-y-4 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-4 opacity-10">
                      <Check size={80} />
                   </div>
                   <div>
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">Holder</p>
                      <p className="text-2xl font-black">{result.data.holderName}</p>
                   </div>
                   <div>
                      <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.2em]">Ticket Type</p>
                      <p className="text-lg font-bold text-green-400">{result.data.ticketType}</p>
                   </div>
                </div>
             </div>
          )}

          {result.type === 'ticket' && (
             <div className="w-full">
                <DigitalTicket ticket={result.data as Ticket} />
             </div>
          )}
        </div>
      )}
    </div>
  );
}
