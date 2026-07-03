import { useScanner } from '../contexts/ScannerContext';
import { QRScanner } from '../scanner/QRScanner';
import { parseServerQr } from '../utils/qr';
import { useNavigate } from 'react-router-dom';

export function ServerSetupPage() {
  const { setServerUrl } = useScanner();
  const navigate = useNavigate();

  const handleScan = (result: string) => {
    const url = parseServerQr(result);
    if (url) {
      setServerUrl(url);
      navigate('/');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <div className="flex-1 relative">
        <QRScanner onScan={handleScan} />
      </div>
      <div className="p-8 text-center bg-card border-t shadow-lg">
        <h1 className="text-xl font-bold mb-2">Setup Required</h1>
        <p className="text-muted-foreground">Scan your server QR code to continue</p>
      </div>
    </div>
  );
}
