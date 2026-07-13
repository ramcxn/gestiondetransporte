import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VisitPassProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  visit: {
    id: string;
    nombre: string;
    empresa: string;
    tipo: string;
    motivo: string;
    area_visita: string;
    created_at: string;
    creator_name?: string;
  } | null;
  companyName?: string;
}

// Wrap text to fit within maxWidth
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export default function VisitPass({ open, onOpenChange, visit, companyName = "GESTIÓN DE TRANSPORTE" }: VisitPassProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !visit) return;

    const render = async () => {
      const W = 720;
      const H = 1180;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = "#FFC72C";
      ctx.fillRect(0, 0, W, H);

      // Decorative frame (thin dark border with corner offsets)
      ctx.strokeStyle = "#0F1720";
      ctx.lineWidth = 4;
      const m = 40;
      ctx.strokeRect(m, m + 80, W - m * 2, H - m * 2 - 200);

      // Header text (company)
      ctx.fillStyle = "#0F1720";
      ctx.textAlign = "center";
      ctx.font = "bold 34px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(companyName, W / 2, 100);
      ctx.font = "500 18px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText("PASE DE ACCESO", W / 2, 130);

      // QR code
      const qrPayload = JSON.stringify({
        type: "VISITA",
        id: visit.id,
        nombre: visit.nombre,
        empresa: visit.empresa,
      });
      const qrSize = 380;
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: qrSize,
        margin: 2,
        color: { dark: "#0F1720", light: "#FFFFFF" },
        errorCorrectionLevel: "M",
      });
      const qrImg = new Image();
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
      });
      // White card behind QR
      const qrX = (W - qrSize) / 2;
      const qrY = 180;
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX - 20, qrY - 20, qrSize + 40, qrSize + 40);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Info block
      let y = qrY + qrSize + 70;
      ctx.textAlign = "left";
      ctx.fillStyle = "#0F1720";
      const labelFont = "bold 22px 'Helvetica Neue', Arial, sans-serif";
      const valueFont = "22px 'Helvetica Neue', Arial, sans-serif";
      const leftX = 90;

      const created = new Date(visit.created_at);
      const createdStr = `${created.toLocaleDateString("es-MX")} ${created.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;

      const drawRow = (label: string, value: string) => {
        ctx.font = labelFont;
        ctx.fillText(label, leftX, y);
        const labelWidth = ctx.measureText(label).width + 12;
        ctx.font = valueFont;
        const maxWidth = W - leftX - 60 - labelWidth;
        const lines = wrapText(ctx, value, maxWidth);
        lines.forEach((line, i) => {
          ctx.fillText(line, leftX + labelWidth, y + i * 28);
        });
        y += Math.max(38, lines.length * 28 + 10);
      };

      drawRow("Creado:", createdStr);
      ctx.font = "bold 24px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText(visit.tipo?.toUpperCase() === "PROVEEDOR" ? "PROVEEDOR" : "VISITANTE", leftX, y);
      y += 40;
      drawRow("Invitado:", visit.nombre.toUpperCase());
      drawRow("Empresa:", visit.empresa.toUpperCase());
      drawRow("Área:", visit.area_visita.toUpperCase());
      drawRow("Código:", visit.id.slice(0, 12).toUpperCase());

      // Footer indications bar
      ctx.fillStyle = "#0F1720";
      ctx.fillRect(0, H - 90, W, 90);
      ctx.fillStyle = "#FFC72C";
      ctx.textAlign = "center";
      ctx.font = "bold 20px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText("MOSTRAR ESTE CÓDIGO QR AL INGRESAR", W / 2, H - 55);
      ctx.font = "16px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText("Respeta las indicaciones de seguridad del sitio", W / 2, H - 28);

      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
    };

    render();
  }, [open, visit, companyName]);

  const download = () => {
    if (!dataUrl || !visit) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `pase-${visit.nombre.replace(/\s+/g, "_")}.png`;
    link.click();
  };

  const share = async () => {
    if (!dataUrl || !visit) return;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `pase-${visit.nombre.replace(/\s+/g, "_")}.png`, { type: "image/png" });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "Pase de acceso",
          text: `Pase de acceso para ${visit.nombre}`,
        });
      } else {
        // Fallback: open WhatsApp Web with text
        const text = encodeURIComponent(
          `Pase de acceso para ${visit.nombre} (${visit.empresa}). Descarga la imagen y muéstrala al ingresar.`,
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
        toast({
          title: "Compartir no soportado",
          description: "Descarga la imagen y adjúntala manualmente.",
        });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({
        title: "Error",
        description: "No se pudo compartir el pase",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pase de acceso</DialogTitle>
          <DialogDescription>
            Descarga o comparte esta imagen con el {visit?.tipo === "proveedor" ? "proveedor" : "visitante"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <canvas ref={canvasRef} className="hidden" />
          {dataUrl ? (
            <img
              src={dataUrl}
              alt="Pase de acceso"
              className="w-full rounded-lg border shadow-sm"
            />
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={download} className="flex-1" disabled={!dataUrl}>
              <Download className="h-4 w-4 mr-2" />
              Descargar
            </Button>
            <Button onClick={share} variant="secondary" className="flex-1" disabled={!dataUrl}>
              <Share2 className="h-4 w-4 mr-2" />
              Compartir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
