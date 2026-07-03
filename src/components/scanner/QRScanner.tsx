import { useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { Zap, ZapOff, SwitchCamera } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface VideoInputDevice {
    deviceId: string;
    label: string;
}

interface QRScannerProps {
  onScan: (result: string) => void;
  onError?: (error: Error) => void;
  active?: boolean;
}

export function QRScanner({ onScan, onError, active = true }: QRScannerProps) {
  const [cameras, setCameras] = useState<VideoInputDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [flashOn, setFlashOn] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [requestingPermission, setRequestingPermission] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastReadRef = useRef<{ text: string; time: number } | null>(null);

  useEffect(() => {
    const fetchCameras = async () => {
      try {
        let devices = await BrowserQRCodeReader.listVideoInputDevices();
        
        // On some browsers, listVideoInputDevices might return devices with empty labels if permission not granted
        const hasPermission = devices.length > 0 && devices.some(d => d.label);

        if (!hasPermission) {
          setRequestingPermission(true);
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            // If successful, stop the tracks immediately so we can re-open with the reader
            stream.getTracks().forEach(track => track.stop());
            
            // Re-fetch devices to get labels
            devices = await BrowserQRCodeReader.listVideoInputDevices();
            setPermissionDenied(false);
          } catch (err) {
            console.error('Permission denied or camera error:', err);
            // If we have no devices at all, it's definitely a permission or hardware issue
            if (devices.length === 0) {
              setPermissionDenied(true);
            }
            if (onError) onError(err as Error);
          } finally {
            setRequestingPermission(false);
          }
        }

        setCameras(devices);
        if (devices.length > 0) {
          // Prefer back camera if available
          const backCamera = devices.find(d => 
            d.label.toLowerCase().includes('back') || 
            d.label.toLowerCase().includes('rear') ||
            d.label.toLowerCase().includes('environment')
          );
          setSelectedCameraId(backCamera ? backCamera.deviceId : devices[0].deviceId);
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        if (onError) onError(err as Error);
      }
    };
    fetchCameras();
  }, [onError]);

  const activeRef = useRef(active);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!videoRef.current || !selectedCameraId) {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserQRCodeReader();

    const startScanner = async () => {
      if (!videoRef.current) return;
      try {
        const controls = await codeReader.decodeFromVideoDevice(
          selectedCameraId,
          videoRef.current,
          (result, error) => {
            if (!activeRef.current) return;
            if (result) {
              const text = result.getText();
              const now = Date.now();

              // Debounce duplicate reads (1 second)
              if (
                lastReadRef.current?.text === text &&
                now - lastReadRef.current.time < 1000
              ) {
                return;
              }

              lastReadRef.current = { text, time: now };
              onScanRef.current(text);
            }
            if (error && !(error.name === 'NotFoundException')) {
              // Ignore NotFoundException as it's normal when no QR is in view
              console.error(error);
            }
          }
        );
        controlsRef.current = controls;
      } catch (err) {
        console.error('Failed to start scanner:', err);
        if (onErrorRef.current) onErrorRef.current(err as Error);
      }
    };

    startScanner();

    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [selectedCameraId]);

  const toggleFlash = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !flashOn } as any]
        });
        setFlashOn(!flashOn);
      }
    } catch (err) {
      console.error('Flashlight not supported:', err);
    }
  };

  const retryPermission = () => {
    window.location.reload();
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none touch-none">
      <video
        ref={videoRef}
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {permissionDenied && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/90 text-white text-center">
          <div className="bg-red-500/20 p-4 rounded-full mb-4">
             <ZapOff size={48} className="text-red-500" />
          </div>
          <h3 className="text-xl font-bold mb-2">Camera Permission Required</h3>
          <p className="text-white/60 mb-6 max-w-xs">
            The scanner needs camera access to work. Please grant permission in your browser settings.
          </p>
          <button 
            onClick={retryPermission}
            className="px-6 py-3 bg-white text-black rounded-xl font-bold"
          >
            Retry
          </button>
        </div>
      )}

      {requestingPermission && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black text-white">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-medium">Requesting Camera Access...</p>
        </div>
      )}
      
      {/* Camera UI Controls */}
      <div className="absolute top-20 right-4 z-20 flex flex-col gap-4">
        {cameras.length > 1 && (
          <button 
            onClick={() => {
              const currentIndex = cameras.findIndex(c => c.deviceId === selectedCameraId);
              const nextIndex = (currentIndex + 1) % cameras.length;
              setSelectedCameraId(cameras[nextIndex].deviceId);
            }}
            className="p-3 bg-black/50 backdrop-blur-md rounded-full text-white border border-white/20"
          >
            <SwitchCamera size={24} />
          </button>
        )}
        <button 
          onClick={toggleFlash}
          className={cn(
            "p-3 rounded-full border border-white/20 backdrop-blur-md transition-colors",
            flashOn ? "bg-primary text-black" : "bg-black/50 text-white"
          )}
        >
          {flashOn ? <Zap size={24} /> : <ZapOff size={24} />}
        </button>
      </div>

      <div className="absolute inset-0 border-2 border-primary/50 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-white/80 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
           <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div>
           <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div>
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div>
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
        </div>
      </div>
    </div>
  );
}
