import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, RefreshCcw, ChevronDown, ChevronRight } from "lucide-react";

type Intento = {
  id: string;
  accion: string;
  resultado: "exito" | "error";
  error_code: string | null;
  error_message: string | null;
  payload: any;
  server_response: any;
  lat: number | null;
  lng: number | null;
  fuente_ubicacion: string | null;
  user_agent: string | null;
  created_at: string;
};

const accionLabel: Record<string, string> = {
  en_zona_carga: "En zona de carga",
  en_transito: "Iniciar recorrido",
  completado: "Finalizar viaje",
};

export default function TripAuditLog({ viajeId }: { viajeId: string }) {
  const [rows, setRows] = useState<Intento[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("viaje_bitacora_intentos")
      .select("*")
      .eq("viaje_id", viajeId)
      .order("created_at", { ascending: false })
      .limit(100);
    setRows((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [viajeId]);

  if (loading) return <p className="text-sm text-muted-foreground">Cargando bitácora…</p>;
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">Sin intentos registrados.</p>;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-muted-foreground">{rows.length} intento(s) registrado(s)</span>
        <Button size="sm" variant="ghost" onClick={load}>
          <RefreshCcw className="h-3 w-3 mr-1" /> Actualizar
        </Button>
      </div>
      <div className="border rounded-md divide-y max-h-96 overflow-auto">
        {rows.map((r) => {
          const open = expanded[r.id];
          return (
            <div key={r.id} className="p-2 text-xs">
              <button
                onClick={() => setExpanded((s) => ({ ...s, [r.id]: !open }))}
                className="w-full flex justify-between items-center gap-2 text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {open ? <ChevronDown className="h-3 w-3 shrink-0" /> : <ChevronRight className="h-3 w-3 shrink-0" />}
                  {r.resultado === "exito" ? (
                    <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3 text-green-600" />Éxito</Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Error</Badge>
                  )}
                  <span className="font-medium truncate">{accionLabel[r.accion] || r.accion}</span>
                </div>
                <span className="text-muted-foreground shrink-0">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </button>
              {r.resultado === "error" && r.error_message && (
                <div className="mt-1 text-destructive">
                  {r.error_code ? `[${r.error_code}] ` : ""}{r.error_message}
                </div>
              )}
              {r.lat != null && r.lng != null && (
                <div className="mt-1 text-muted-foreground">
                  GPS: {r.lat.toFixed(5)}, {r.lng.toFixed(5)} ({r.fuente_ubicacion || "n/d"})
                </div>
              )}
              {open && (
                <div className="mt-2 space-y-2">
                  <div>
                    <div className="font-medium text-muted-foreground">Payload enviado</div>
                    <pre className="bg-muted rounded p-2 overflow-auto text-[10px]">
{JSON.stringify(r.payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="font-medium text-muted-foreground">Respuesta del servidor</div>
                    <pre className="bg-muted rounded p-2 overflow-auto text-[10px]">
{JSON.stringify(r.server_response, null, 2)}
                    </pre>
                  </div>
                  {r.user_agent && (
                    <div className="text-[10px] text-muted-foreground break-all">
                      UA: {r.user_agent}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
