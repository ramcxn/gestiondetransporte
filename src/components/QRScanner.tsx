import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, X } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const startScanner = async () => {
      try {
        setIsScanning(true);
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        const videoInputDevices = await codeReader.listVideoInputDevices();
        
        if (videoInputDevices.length === 0) {
          setError('No se encontró ninguna cámara en el dispositivo');
          return;
        }

        // Preferir cámara trasera en dispositivos móviles
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('trasera')
        ) || videoInputDevices[0];

        if (videoRef.current) {
          codeReader.decodeFromVideoDevice(
            backCamera.deviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                onScan(result.getText());
                stopScanner();
              }
              if (error && error.name !== 'NotFoundException') {
                console.error('Scanner error:', error);
              }
            }
          );
        }
      } catch (err) {
        console.error('Error starting scanner:', err);
        setError('Error al iniciar la cámara. Verifica los permisos.');
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Escanear Código QR</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {error ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        ) : (
          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
            />
            {isScanning && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse" />
              </div>
            )}
          </div>
        )}

        <p className="text-sm text-muted-foreground text-center">
          Coloca el código QR dentro del marco
        </p>

        <Button variant="outline" className="w-full" onClick={onClose}>
          Cancelar
        </Button>
      </Card>
    </div>
  );
}
