import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, X, Keyboard } from 'lucide-react';

interface QRScannerProps {
  onScan: (data: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string>('');
  const [isScanning, setIsScanning] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  const addDebug = (message: string) => {
    console.log('[QRScanner]', message);
    setDebugInfo(prev => [...prev.slice(-4), message]);
  };

  useEffect(() => {
    if (manualEntry) return; // No iniciar cámara si modo manual está activo

    const startScanner = async () => {
      try {
        addDebug('Iniciando escáner...');
        setIsScanning(true);
        const codeReader = new BrowserMultiFormatReader();
        readerRef.current = codeReader;

        addDebug('Solicitando permisos de cámara...');
        const videoInputDevices = await codeReader.listVideoInputDevices();
        addDebug(`Cámaras encontradas: ${videoInputDevices.length}`);
        
        if (videoInputDevices.length === 0) {
          setError('No se encontró ninguna cámara en el dispositivo');
          addDebug('ERROR: No hay cámaras disponibles');
          return;
        }

        // Listar todas las cámaras
        videoInputDevices.forEach((device, index) => {
          addDebug(`Cámara ${index + 1}: ${device.label}`);
        });

        // Preferir cámara trasera en dispositivos móviles
        const backCamera = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('trasera') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('environment')
        ) || videoInputDevices[0];

        addDebug(`Usando cámara: ${backCamera.label}`);

        if (videoRef.current) {
          addDebug('Iniciando decodificación...');
          let lastScan = 0;
          
          codeReader.decodeFromVideoDevice(
            backCamera.deviceId,
            videoRef.current,
            (result, error) => {
              if (result) {
                const now = Date.now();
                if (now - lastScan < 2000) return; // Evitar escaneos duplicados
                lastScan = now;
                
                const code = result.getText();
                console.log(`[QRScanner] Código detectado: ${code}`);
                onScan(code);
                stopScanner();
              }
              // No mostrar errores de escaneo normal al usuario
            }
          );
          addDebug('Escáner activo, esperando código QR...');
        }
      } catch (err: any) {
        console.error('Error starting scanner:', err);
        const errorMsg = err.message || 'Error desconocido';
        addDebug(`ERROR: ${errorMsg}`);
        setError(`Error al iniciar la cámara: ${errorMsg}. Verifica los permisos.`);
      }
    };

    startScanner();

    return () => {
      stopScanner();
    };
  }, [manualEntry]);

  const stopScanner = () => {
    if (readerRef.current) {
      readerRef.current.reset();
      readerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleManualSubmit = () => {
    if (manualCode.trim()) {
      addDebug(`Código manual ingresado: ${manualCode}`);
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {manualEntry ? <Keyboard className="h-5 w-5" /> : <Camera className="h-5 w-5" />}
            <h3 className="text-lg font-semibold">
              {manualEntry ? 'Ingresar Código Manualmente' : 'Escanear Código QR'}
            </h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {manualEntry ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manual-code">Código QR</Label>
              <Input
                id="manual-code"
                placeholder="Ej: EQUIPO-123 o OPERADOR-456"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleManualSubmit();
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Ingresa el código en el formato: EQUIPO-[ID] o OPERADOR-[ID]
            </p>
          </div>
        ) : (
          <>
            {error ? (
              <div className="p-4 bg-destructive/10 text-destructive rounded-lg space-y-2">
                <p className="font-medium">{error}</p>
                {debugInfo.length > 0 && (
                  <div className="text-xs space-y-1 mt-2 p-2 bg-background/50 rounded">
                    <p className="font-semibold">Información de depuración:</p>
                    {debugInfo.map((info, i) => (
                      <p key={i}>{info}</p>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  autoPlay
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
          </>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="flex-1" 
            onClick={() => setManualEntry(!manualEntry)}
          >
            {manualEntry ? <Camera className="h-4 w-4 mr-2" /> : <Keyboard className="h-4 w-4 mr-2" />}
            {manualEntry ? 'Usar Cámara' : 'Ingresar Manualmente'}
          </Button>
          {manualEntry ? (
            <Button 
              className="flex-1" 
              onClick={handleManualSubmit}
              disabled={!manualCode.trim()}
            >
              Confirmar
            </Button>
          ) : (
            <Button variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
