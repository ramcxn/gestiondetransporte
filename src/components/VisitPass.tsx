import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logoUrl from "@/assets/logo.png";

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
    qr_expira_at?: string | null;
  } | null;
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = (text || "").split(/\s+/);
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

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Brand tokens (mirror index.css: --primary 215 85% 35%, --secondary 30 95% 55%)
const BRAND = {
  primary: "#0E4B99",
  primaryDark: "#0A3970",
  accent: "#F79320",
  ink: "#0B1220",
  paper: "#FFFFFF",
  soft: "#F1F5FB",
};

export default function VisitPass({ open, onOpenChange, visit }: VisitPassProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !visit) {
      setDataUrl(null);
      return;
    }

    const render = async () => {
      const W = 800;
      const H = 1300;
      const canvas = canvasRef.current || document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Background
      ctx.fillStyle = BRAND.paper;
      ctx.fillRect(0, 0, W, H);

      // Top brand banner
      const bannerH = 170;
      ctx.fillStyle = BRAND.primary;
      ctx.fillRect(0, 0, W, bannerH);
      // Accent stripe
      ctx.fillStyle = BRAND.accent;
      ctx.fillRect(0, bannerH, W, 8);

      // Logo (centered top)
      try {
        const logo = await loadImage(logoUrl);
        const logoH = 90;
        const logoW = (logo.width / logo.height) * logoH;
        ctx.drawImage(logo, 40, (bannerH - logoH) / 2, logoW, logoH);

        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "left";
        ctx.font = "700 30px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText("GESTIÓN DE TRANSPORTE", 40 + logoW + 24, bannerH / 2 - 4);
        ctx.font = "500 18px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.fillText("CTPAT COMPLIANCE", 40 + logoW + 24, bannerH / 2 + 24);
      } catch {
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.font = "700 34px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText("GESTIÓN DE TRANSPORTE", W / 2, bannerH / 2 + 10);
      }

      // Pass title
      ctx.textAlign = "center";
      ctx.fillStyle = BRAND.ink;
      ctx.font = "800 40px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText("PASE DE ACCESO", W / 2, bannerH + 70);
      ctx.font = "500 20px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "#4A5568";
      const tipoLabel = visit.tipo?.toUpperCase() === "PROVEEDOR" ? "Proveedor autorizado" : "Visitante autorizado";
      ctx.fillText(tipoLabel, W / 2, bannerH + 100);

      // QR block
      const qrPayload = JSON.stringify({
        type: "VISITA",
        id: visit.id,
        exp: visit.qr_expira_at || null,
      });
      const qrSize = 420;
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: qrSize,
        margin: 1,
        color: { dark: BRAND.ink, light: "#FFFFFF" },
        errorCorrectionLevel: "H",
      });
      const qrImg = await loadImage(qrDataUrl);

      const qrX = (W - qrSize) / 2;
      const qrY = bannerH + 140;
      // QR card
      ctx.fillStyle = BRAND.soft;
      ctx.strokeStyle = BRAND.primary;
      ctx.lineWidth = 3;
      const pad = 24;
      ctx.beginPath();
      const cardX = qrX - pad;
      const cardY = qrY - pad;
      const cardW = qrSize + pad * 2;
      const cardH = qrSize + pad * 2;
      const r = 20;
      ctx.moveTo(cardX + r, cardY);
      ctx.arcTo(cardX + cardW, cardY, cardX + cardW, cardY + cardH, r);
      ctx.arcTo(cardX + cardW, cardY + cardH, cardX, cardY + cardH, r);
      ctx.arcTo(cardX, cardY + cardH, cardX, cardY, r);
      ctx.arcTo(cardX, cardY, cardX + cardW, cardY, r);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(qrX, qrY, qrSize, qrSize);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      // Info block - each row on its own line, label above value
      let y = qrY + qrSize + pad + 60;
      const leftX = 60;
      const rightEdge = W - 60;
      const valueMaxWidth = rightEdge - leftX;

      const created = new Date(visit.created_at);
      const createdStr = `${created.toLocaleDateString("es-MX")} · ${created.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;

      let vigenciaStr = "Frecuente · No expira";
      let vigenciaColor = BRAND.primary;
      if (visit.qr_expira_at) {
        const exp = new Date(visit.qr_expira_at);
        vigenciaStr = `Válido hasta: ${exp.toLocaleDateString("es-MX")} · ${exp.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}`;
        if (exp.getTime() < Date.now()) {
          vigenciaStr = `EXPIRADO: ${exp.toLocaleDateString("es-MX")}`;
          vigenciaColor = "#B91C1C";
        }
      }

      const rows: Array<{ label: string; value: string; emphasize?: boolean; color?: string }> = [
        { label: "Invitado", value: visit.nombre, emphasize: true },
        { label: "Empresa", value: visit.empresa },
        { label: "Área a visitar", value: visit.area_visita },
        { label: "Motivo", value: visit.motivo },
        { label: "Emitido", value: createdStr },
        { label: "Vigencia", value: vigenciaStr, color: vigenciaColor, emphasize: true },
        { label: "Código", value: visit.id.slice(0, 8).toUpperCase() },
      ];

      ctx.textAlign = "left";
      for (const row of rows) {
        // Label
        ctx.fillStyle = "#6B7280";
        ctx.font = "600 15px 'Helvetica Neue', Arial, sans-serif";
        ctx.fillText(row.label.toUpperCase(), leftX, y);
        y += 22;

        // Value (wrapped)
        ctx.fillStyle = row.color || BRAND.ink;
        ctx.font = row.emphasize
          ? "700 24px 'Helvetica Neue', Arial, sans-serif"
          : "500 22px 'Helvetica Neue', Arial, sans-serif";
        const lines = wrapText(ctx, row.value, valueMaxWidth);
        for (const line of lines) {
          ctx.fillText(line, leftX, y);
          y += 28;
        }
        y += 12;
      }

      // Footer banner
      const footH = 90;
      ctx.fillStyle = BRAND.primaryDark;
      ctx.fillRect(0, H - footH, W, footH);
      ctx.fillStyle = BRAND.accent;
      ctx.fillRect(0, H - footH - 6, W, 6);
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "center";
      ctx.font = "700 22px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillText("MOSTRAR ESTE QR AL INGRESAR", W / 2, H - footH + 36);
      ctx.font = "400 16px 'Helvetica Neue', Arial, sans-serif";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText("Presenta una identificación oficial junto con este pase", W / 2, H - footH + 64);

      const url = canvas.toDataURL("image/png");
      setDataUrl(url);
    };

    render().catch((err) => {
      console.error("Error rendering pass:", err);
      toast({
        title: "Error",
        description: "No se pudo generar el pase",
        variant: "destructive",
      });
    });
  }, [open, visit, toast]);

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
        const text = encodeURIComponent(
          `Pase de acceso para ${visit.nombre} (${visit.empresa}). Descarga la imagen y muéstrala al ingresar.`,
        );
        window.open(`https://wa.me/?text=${text}`, "_blank");
        toast({
          title: "Compartir no soportado",
          description: "Se abrió WhatsApp. Descarga la imagen y adjúntala manualmente.",
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
            <img src={dataUrl} alt="Pase de acceso" className="w-full rounded-lg border shadow-sm" />
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
