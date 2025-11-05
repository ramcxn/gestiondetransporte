import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
}

export function QRCodeGenerator({ value, size = 200 }: QRCodeGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(
        canvasRef.current,
        value,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
        },
        (error) => {
          if (error) console.error("Error generating QR code:", error);
        }
      );
    }
  }, [value, size]);

  return <canvas ref={canvasRef} data-qr={value} />;
}

export async function generateQRCodeDataURL(value: string): Promise<string> {
  try {
    return await QRCode.toDataURL(value, {
      width: 300,
      margin: 2,
    });
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw error;
  }
}
