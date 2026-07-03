import { useCallback, useState } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { QRScanner } from '../components/scanner/QRScanner';
import { parseServerQr } from '../utils/qr';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { X } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ServerSetupPage() {
  const { setServerUrl } = useScanner();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleScan = useCallback(async (result: string) => {
    const url = parseServerQr(result);
    if (url) {
      setIsValidating(true);
      setError(null);
      try {
        const response = await axios.get(`${url}/`, { timeout: 5000 });
        if (response.data?.name === 'evently') {
          setServerUrl(url);
          navigate('/');
        } else {
          setError('Invalid server: Unexpected response');
        }
      } catch (err) {
        setError('Could not connect to server');
        console.error('Server validation failed:', err);
      } finally {
        setIsValidating(false);
      }
    }
  }, [setServerUrl, navigate]);

  return (
    <div className="flex flex-col h-dvh bg-background overflow-hidden">
      <div className="flex-1 relative">
        <QRScanner onScan={handleScan} />
        {(isValidating || error) && (
          <div className={cn(
            "absolute inset-0 flex items-center justify-center z-50 animate-in fade-in zoom-in duration-200",
            isValidating ? "bg-background/80" : "bg-red-600/90 text-white"
          )}>
            {isValidating ? (
              <div className="bg-card p-6 rounded-lg shadow-xl border text-center max-w-xs mx-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="font-medium">Validating server...</p>
              </div>
            ) : (
              <div className="text-center space-y-4 cursor-pointer" onClick={() => setError(null)}>
                 <div className="bg-white/20 p-6 rounded-full inline-block">
                    <X size={64} strokeWidth={3} />
                 </div>
                 <h2 className="text-3xl font-black uppercase">Failed</h2>
                 <p className="text-xl font-bold">{error}</p>
                 <p className="text-sm opacity-70">Tap to try again</p>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="p-8 text-center bg-card border-t shadow-lg">
        <h1 className="text-xl font-bold mb-2">Setup Required</h1>
        <p className="text-muted-foreground">Scan your server QR code to continue</p>
      </div>
    </div>
  );
}
