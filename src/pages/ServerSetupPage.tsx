import { useCallback, useState } from 'react';
import { useScanner } from '../contexts/ScannerContext';
import { QRScanner } from '../components/scanner/QRScanner';
import { parseServerQr } from '../utils/qr';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex-1 relative">
        <QRScanner onScan={handleScan} />
        {(isValidating || error) && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <div className="bg-card p-6 rounded-lg shadow-xl border text-center max-w-xs mx-4">
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                  <p className="font-medium">Validating server...</p>
                </>
              ) : (
                <>
                  <div className="text-destructive mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                  </div>
                  <p className="font-medium text-destructive mb-4">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
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
