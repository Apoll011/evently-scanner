import { useCallback, useEffect, useRef, useState } from 'react';
import { BrowserQRCodeReader, type IScannerControls } from '@zxing/browser';
import { Camera, Zap, ZapOff, SwitchCamera, Settings } from 'lucide-react';
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

type PermissionState =
    | 'checking'      // figuring out current status on mount
    | 'prompt'        // not yet asked (or unknown) — needs a user tap
    | 'requesting'    // getUserMedia call in flight (inside a click handler)
    | 'granted'       // camera live
    | 'denied';       // user (or browser) blocked it — JS can't undo this

function getPlatformInstructions(): string {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
  const isAndroid = /Android/.test(ua);

  if (isIOS) {
    return 'Open Settings → Safari (or Chrome) → Camera, and set it to "Allow". Then come back and tap "Try Again".';
  }
  if (isAndroid) {
    return 'Tap the lock/info icon in your address bar → Permissions → Camera → Allow. Then tap "Try Again".';
  }
  return 'Click the camera icon in your browser\'s address bar and choose "Allow", then tap "Try Again".';
}

export function QRScanner({ onScan, onError, active = true }: QRScannerProps) {
  const [cameras, setCameras] = useState<VideoInputDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | undefined>(undefined);
  const [flashOn, setFlashOn] = useState(false);
  const [permissionState, setPermissionState] = useState<PermissionState>('checking');
  const [scannerError, setScannerError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const lastReadRef = useRef<{ text: string; time: number } | null>(null);

  const activeRef = useRef(active);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);

  useEffect(() => { activeRef.current = active; }, [active]);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  useEffect(() => {
    let cancelled = false;
    let permissionStatus: PermissionStatus | null = null;

    const check = async () => {
      try {
        if (navigator.permissions?.query) {
          permissionStatus = await navigator.permissions.query({
            name: 'camera' as PermissionName,
          });
          if (cancelled) return;

          const applyState = () => {
            if (!permissionStatus) return;
            if (permissionStatus.state === 'granted') setPermissionState('granted');
            else if (permissionStatus.state === 'denied') setPermissionState('denied');
            else setPermissionState('prompt');
          };
          applyState();
          permissionStatus.addEventListener('change', applyState);
        } else {
          // Safari / unsupported: we genuinely don't know, so ask the user to tap.
          setPermissionState('prompt');
        }
      } catch {
        setPermissionState('prompt');
      }
    };

    check();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadCameraList = useCallback(async () => {
    try {
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      setCameras(devices);
      if (devices.length > 0) {
        const backCamera = devices.find(
            (d) =>
                d.label.toLowerCase().includes('back') ||
                d.label.toLowerCase().includes('rear') ||
                d.label.toLowerCase().includes('environment')
        );
        setSelectedCameraId(backCamera ? backCamera.deviceId : devices[0].deviceId);
      }
    } catch (err) {
      console.error('Error listing cameras:', err);
      if (onErrorRef.current) onErrorRef.current(err as Error);
    }
  }, []);

  // Once we know we're granted, populate the device list.
  useEffect(() => {
    if (permissionState === 'granted') {
      loadCameraList();
    }
  }, [permissionState, loadCameraList]);

  const requestCameraAccess = async () => {
    setPermissionState('requesting');
    setScannerError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      stream.getTracks().forEach((track) => track.stop());
      setPermissionState('granted');
    } catch (err) {
      console.error('Camera permission request failed:', err);
      setPermissionState('denied');
      if (onErrorRef.current) onErrorRef.current(err as Error);
    }
  };

  // Start/stop the zxing scanner whenever we have permission + a selected camera.
  useEffect(() => {
    if (permissionState !== 'granted' || !videoRef.current || !selectedCameraId) {
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
      return;
    }

    const codeReader = new BrowserQRCodeReader();
    let cancelled = false;

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
                if (
                    lastReadRef.current?.text === text &&
                    now - lastReadRef.current.time < 1000
                ) {
                  return;
                }
                lastReadRef.current = { text, time: now };
                onScanRef.current(text);
              }
              if (error && error.name !== 'NotFoundException') {
                console.error(error);
              }
            }
        );
        if (!cancelled) {
          controlsRef.current = controls;
        } else {
          controls.stop();
        }
      } catch (err) {
        console.error('Failed to start scanner:', err);
        setScannerError('Could not start the camera stream. Try switching cameras or reloading.');
        if (onErrorRef.current) onErrorRef.current(err as Error);
      }
    };

    startScanner();

    return () => {
      cancelled = true;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [permissionState, selectedCameraId]);

  const toggleFlash = async () => {
    if (!videoRef.current || !videoRef.current.srcObject) return;
    const stream = videoRef.current.srcObject as MediaStream;
    const track = stream.getVideoTracks()[0];
    try {
      const capabilities = track.getCapabilities() as any;
      if (capabilities.torch) {
        await track.applyConstraints({ advanced: [{ torch: !flashOn } as any] });
        setFlashOn(!flashOn);
      }
    } catch (err) {
      console.error('Flashlight not supported:', err);
    }
  };

  return (
      <div className="relative w-full h-full bg-black overflow-hidden select-none touch-none">
        <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Initial / unknown state — explicit, tappable request. No auto-prompt. */}
        {permissionState === 'prompt' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black text-white text-center">
              <div className="bg-primary/20 p-4 rounded-full mb-4">
                <Camera size={48} className="text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Camera Access Needed</h3>
              <p className="text-white/60 mb-6 max-w-xs">
                Tap below to allow camera access so you can scan QR codes.
              </p>
              <button
                  onClick={requestCameraAccess}
                  className="px-6 py-3 bg-primary text-black rounded-xl font-bold"
              >
                Enable Camera
              </button>
            </div>
        )}

        {permissionState === 'checking' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black text-white">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium">Checking camera permissions...</p>
            </div>
        )}

        {permissionState === 'requesting' && (
            <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 bg-black text-white">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="font-medium">Requesting camera access...</p>
            </div>
        )}

        {permissionState === 'denied' && (
            <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black/95 text-white text-center">
              <div className="bg-red-500/20 p-4 rounded-full mb-4">
                <ZapOff size={48} className="text-red-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Camera Blocked</h3>
              <p className="text-white/60 mb-4 max-w-xs">
                Your browser is blocking camera access for this site. This can only be fixed in
                your browser settings — reloading won't bring the prompt back.
              </p>
              <div className="flex items-start gap-2 bg-white/5 rounded-lg p-3 mb-6 max-w-xs text-left">
                <Settings size={18} className="shrink-0 mt-0.5 text-white/60" />
                <p className="text-sm text-white/70">{getPlatformInstructions()}</p>
              </div>
              <button
                  onClick={requestCameraAccess}
                  className="px-6 py-3 bg-white text-black rounded-xl font-bold"
              >
                Try Again
              </button>
            </div>
        )}

        {scannerError && permissionState === 'granted' && (
            <div className="absolute bottom-4 left-4 right-4 z-30 bg-red-500/90 text-white text-sm rounded-lg p-3 text-center">
              {scannerError}
            </div>
        )}

        {/* Camera UI Controls — only meaningful once we're actually streaming */}
        {permissionState === 'granted' && (
            <div className="absolute top-20 right-4 z-20 flex flex-col gap-4">
              {cameras.length > 1 && (
                  <button
                      onClick={() => {
                        const currentIndex = cameras.findIndex((c) => c.deviceId === selectedCameraId);
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
                      'p-3 rounded-full border border-white/20 backdrop-blur-md transition-colors',
                      flashOn ? 'bg-primary text-black' : 'bg-black/50 text-white'
                  )}
              >
                {flashOn ? <Zap size={24} /> : <ZapOff size={24} />}
              </button>
            </div>
        )}

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