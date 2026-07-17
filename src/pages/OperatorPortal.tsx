import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import QRScanner from "@/components/QRScanner";
import {
  Truck, DollarSign, Wrench, FileUp, Phone, Bell, LogOut, QrCode,
  MapPin, Calendar, AlertTriangle, CheckCircle2,
} from "lucide-react";
import logo from "@/assets/logo.png";

const STORAGE_KEY = "operador_portal_qr";

interface PortalData {
  operador: any;
  viajes: any[];
  liquidaciones: any[];
  unidad_actual: any;
  ultimo_mantenimiento: any;
  documentos: any[];
  contactos: any[];
  notificaciones: any;
}

export default function OperatorPortal() {
  const [qr, setQr] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [uploadForm, setUploadForm] = useState({ viaje_id: "", tipo: "carta_porte", notas: "" });
  const [uploading, setUploading] = useState(false);

  const login = async (code: string) => {
    setLoading(true);
    const { data: res, error } = await supabase.rpc("get_operador_portal_data", { _qr_code: code });
    setLoading(false);
    if (error || !res || (res as any).error) {
      toast({ title: "Acceso denegado", description: "Código QR no válido", variant: "destructive" });
      return;
    }
    localStorage.setItem(STORAGE_KEY, code);
    setQr(code);
    setData(res as unknown as PortalData);
  };

  const refresh = async () => {
    if (!qr) return;
    const { data: res } = await supabase.rpc("get_operador_portal_data", { _qr_code: qr });
    if (res && !(res as any).error) setData(res as unknown as PortalData);
  };

  useEffect(() => {
    if (qr && !data) login(qr);
  }, []);

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setQr(null);
    setData(null);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !qr || !data) return;
    setUploading(true);
    try {
      const path = `${data.operador.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("documentos-viaje-operador")
        .upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("documentos-viaje-operador").getPublicUrl(path);
      const { error: regErr } = await supabase.rpc("operador_registrar_documento", {
        _qr_code: qr,
        _viaje_id: uploadForm.viaje_id || null,
        _tipo: uploadForm.tipo,
        _archivo_url: pub.publicUrl,
        _notas: uploadForm.notas || null,
      });
      if (regErr) throw regErr;
      toast({ title: "Documento subido", description: file.name });
      setUploadForm({ viaje_id: "", tipo: "carta_porte", notas: "" });
      await refresh();
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // LOGIN VIEW
  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logo} alt="Logo" className="h-16 w-16 mx-auto mb-2 object-contain" />
            <CardTitle className="text-2xl">Portal del Operador</CardTitle>
            <p className="text-sm text-muted-foreground">Escanea tu código QR personal</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {scannerOpen ? (
              <QRScanner
                onScan={(code) => { setScannerOpen(false); login(code); }}
                onClose={() => setScannerOpen(false)}
              />
            ) : (
              <>
                <Button className="w-full" size="lg" onClick={() => setScannerOpen(true)} disabled={loading}>
                  <QrCode className="mr-2 h-5 w-5" /> Escanear QR
                </Button>
                <div className="text-center text-xs text-muted-foreground">o ingresa tu número de empleado</div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Núm. empleado / código"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                  />
                  <Button onClick={() => login(manualCode)} disabled={!manualCode || loading}>
                    Entrar
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  const op = data.operador;
  const notif = data.notificaciones || {};
  const alerts: string[] = [];
  const daysLeft = (d?: string) => d ? Math.floor((new Date(d).getTime() - Date.now()) / 86400000) : null;
  const licDays = daysLeft(notif.licencia_vence);
  const contDays = daysLeft(notif.contrato_vence);
  if (licDays !== null && licDays < 30) alerts.push(`Tu licencia vence en ${licDays} días`);
  if (contDays !== null && contDays < 60) alerts.push(`Tu contrato vence en ${contDays} días`);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-contain bg-white/10 rounded p-1" />
            <div>
              <h1 className="font-bold">{op.nombre}</h1>
              <p className="text-xs opacity-80">Empleado #{op.numero_empleado}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4 mr-1" /> Salir
          </Button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 space-y-4">
        {alerts.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc pl-4">{alerts.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="viajes">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="viajes"><Truck className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="pagos"><DollarSign className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="unidad"><Wrench className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="documentos"><FileUp className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="contactos"><Phone className="h-4 w-4" /></TabsTrigger>
            <TabsTrigger value="notif"><Bell className="h-4 w-4" /></TabsTrigger>
          </TabsList>

          <TabsContent value="viajes" className="space-y-3">
            <h2 className="text-lg font-semibold">Mis viajes</h2>
            {data.viajes.length === 0 && <p className="text-sm text-muted-foreground">Sin viajes registrados.</p>}
            {data.viajes.map((v) => (
              <TripCard
                key={v.id}
                viaje={v}
                qr={qr!}
                operadorId={op.id}
                onChanged={refresh}
              />
            ))}
          </TabsContent>

          <TabsContent value="pagos" className="space-y-3">
            <h2 className="text-lg font-semibold">Mis pagos / liquidaciones</h2>
            {data.liquidaciones.length === 0 && <p className="text-sm text-muted-foreground">Sin liquidaciones.</p>}
            {data.liquidaciones.map((l) => (
              <Card key={l.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-semibold">{l.folio}</p>
                      <p className="text-xs text-muted-foreground">
                        {l.viaje?.origen} → {l.viaje?.destino}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {l.fecha_liquidacion ? new Date(l.fecha_liquidacion).toLocaleDateString() : "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-primary">
                        ${Number(l.monto_operador || 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant={l.estado === "pagada" ? "default" : "secondary"}>{l.estado}</Badge>
                    </div>
                  </div>
                  {Number(l.deduccion) > 0 && (
                    <p className="text-xs text-destructive mt-1">Deducción: ${l.deduccion}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="unidad" className="space-y-3">
            <h2 className="text-lg font-semibold">Mi unidad</h2>
            {data.unidad_actual ? (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="text-2xl font-bold">{data.unidad_actual.numero_economico}</p>
                      <p className="text-sm text-muted-foreground">
                        {data.unidad_actual.marca} {data.unidad_actual.modelo} · {data.unidad_actual.año}
                      </p>
                    </div>
                    <Badge>{data.unidad_actual.estado}</Badge>
                  </div>
                  <p className="text-sm">Placas: <strong>{data.unidad_actual.placas}</strong></p>
                  {data.unidad_actual.proximo_mantenimiento && (
                    <p className="text-sm">
                      Próximo mantenimiento: {new Date(data.unidad_actual.proximo_mantenimiento).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Sin unidad asignada actualmente.</p>
            )}

            <h3 className="text-md font-semibold pt-3">Último mantenimiento</h3>
            {data.ultimo_mantenimiento ? (
              <Card>
                <CardContent className="p-4 space-y-1">
                  <div className="flex justify-between">
                    <p className="font-medium">{data.ultimo_mantenimiento.tipo_mantenimiento}</p>
                    <Badge variant="secondary">{data.ultimo_mantenimiento.estado}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(data.ultimo_mantenimiento.fecha_mantenimiento).toLocaleDateString()} · {data.ultimo_mantenimiento.proveedor || "-"}
                  </p>
                  <p className="text-sm">{data.ultimo_mantenimiento.descripcion}</p>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground">Sin registros.</p>
            )}
          </TabsContent>

          <TabsContent value="documentos" className="space-y-3">
            <h2 className="text-lg font-semibold">Subir documento de viaje</h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label>Viaje (opcional)</Label>
                  <Select value={uploadForm.viaje_id} onValueChange={(v) => setUploadForm({ ...uploadForm, viaje_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona un viaje" /></SelectTrigger>
                    <SelectContent>
                      {data.viajes.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.origen} → {v.destino} ({v.fecha_salida ? new Date(v.fecha_salida).toLocaleDateString() : "-"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Tipo de documento</Label>
                  <Select value={uploadForm.tipo} onValueChange={(v) => setUploadForm({ ...uploadForm, tipo: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="carta_porte">Carta porte</SelectItem>
                      <SelectItem value="factura_combustible">Factura combustible</SelectItem>
                      <SelectItem value="factura_peaje">Factura peaje / caseta</SelectItem>
                      <SelectItem value="evidencia_entrega">Evidencia de entrega</SelectItem>
                      <SelectItem value="foto_incidente">Foto de incidente</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea value={uploadForm.notas} onChange={(e) => setUploadForm({ ...uploadForm, notas: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="doc-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-muted transition-colors">
                      <FileUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">{uploading ? "Subiendo..." : "Tomar fotografía o seleccionar archivo"}</p>
                    </div>
                  </Label>
                  <Input
                    id="doc-upload"
                    type="file"
                    accept="image/*,application/pdf"
                    capture="environment"
                    className="sr-only"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                </div>
              </CardContent>
            </Card>

            <h3 className="text-md font-semibold pt-3">Mis documentos ({data.documentos.length})</h3>
            {data.documentos.map((d) => (
              <Card key={d.id}>
                <CardContent className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium text-sm">{d.tipo.replace(/_/g, " ")}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleString()}</p>
                    {d.notas && <p className="text-xs">{d.notas}</p>}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={d.archivo_url} target="_blank" rel="noopener noreferrer">Ver</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="contactos" className="space-y-3">
            <h2 className="text-lg font-semibold">Contactos de atención</h2>
            {data.contactos.length === 0 && <p className="text-sm text-muted-foreground">Sin contactos configurados.</p>}
            {data.contactos.map((c) => (
              <Card key={c.id}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{c.nombre}</p>
                    <p className="text-xs text-muted-foreground">{c.categoria}{c.descripcion ? ` · ${c.descripcion}` : ""}</p>
                  </div>
                  <Button asChild size="sm">
                    <a href={`tel:${c.telefono}`}><Phone className="h-4 w-4 mr-1" />{c.telefono}</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="notif" className="space-y-3">
            <h2 className="text-lg font-semibold">Mis alertas y vencimientos</h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <NotifRow
                  label="Licencia de manejo"
                  fecha={notif.licencia_vence}
                  warn={30}
                />
                <NotifRow
                  label="Contrato"
                  fecha={notif.contrato_vence}
                  warn={60}
                />
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm">Días de vacaciones disponibles</span>
                  <Badge variant="secondary" className="text-base">{notif.dias_vacaciones_disponibles ?? 0}</Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function NotifRow({ label, fecha, warn }: { label: string; fecha?: string; warn: number }) {
  if (!fecha) return (
    <div className="flex justify-between items-center">
      <span className="text-sm">{label}</span>
      <span className="text-xs text-muted-foreground">Sin fecha</span>
    </div>
  );
  const days = Math.floor((new Date(fecha).getTime() - Date.now()) / 86400000);
  const isWarn = days < warn;
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs">{new Date(fecha).toLocaleDateString()}</span>
        {isWarn ? (
          <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />{days} d</Badge>
        ) : (
          <Badge variant="secondary"><CheckCircle2 className="h-3 w-3 mr-1" />{days} d</Badge>
        )}
      </div>
    </div>
  );
}

function TripCard({
  viaje, qr, operadorId, onChanged,
}: { viaje: any; qr: string; operadorId: string; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const setEstado = async (nuevo: string) => {
    setBusy(true);
    const { data, error } = await supabase.rpc("operador_actualizar_estado_viaje", {
      _qr_code: qr, _viaje_id: viaje.id, _nuevo_estado: nuevo,
    });
    setBusy(false);
    if (error || (data as any)?.error) {
      toast({ title: "Error", description: (data as any)?.error || error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Estado actualizado" });
    onChanged();
  };

  const handleEvidence = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const path = `${operadorId}/${viaje.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage
        .from("documentos-viaje-operador").upload(path, file);
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("documentos-viaje-operador").getPublicUrl(path);
      const { error: regErr } = await supabase.rpc("operador_registrar_documento", {
        _qr_code: qr, _viaje_id: viaje.id, _tipo: "evidencia_viaje",
        _archivo_url: pub.publicUrl, _notas: null,
      });
      if (regErr) throw regErr;
      toast({ title: "Evidencia adjuntada" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Error al subir", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const finalizado = viaje.estado === "completado";
  const estadoLabel: Record<string, string> = {
    programado: "Programado", activo: "Asignado", en_zona_carga: "En zona de carga",
    en_transito: "En recorrido", completado: "Finalizado",
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between items-start">
          <div className="font-medium flex items-center gap-1">
            <MapPin className="h-4 w-4" /> {viaje.origen} → {viaje.destino}
          </div>
          <Badge variant={finalizado ? "secondary" : "default"}>
            {estadoLabel[viaje.estado] || viaje.estado}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Unidad: {viaje.unidad} · Cliente: {viaje.cliente || "-"}</p>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="h-3 w-3" /> Salida: {viaje.fecha_salida ? new Date(viaje.fecha_salida).toLocaleDateString() : "-"}
        </p>

        {!finalizado && (
          <div className="grid grid-cols-3 gap-2 pt-2">
            <Button size="sm" variant={viaje.estado === "en_zona_carga" ? "default" : "outline"}
              disabled={busy} onClick={() => setEstado("en_zona_carga")}>
              En zona de carga
            </Button>
            <Button size="sm" variant={viaje.estado === "en_transito" ? "default" : "outline"}
              disabled={busy} onClick={() => setEstado("en_transito")}>
              Iniciar recorrido
            </Button>
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => setEstado("completado")}>
              Finalizar viaje
            </Button>
          </div>
        )}

        <div>
          <Label htmlFor={`ev-${viaje.id}`} className="cursor-pointer">
            <div className="border border-dashed rounded-md p-3 text-center text-sm hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <FileUp className="h-4 w-4" />
              {uploading ? "Subiendo..." : "Adjuntar evidencia del viaje"}
            </div>
          </Label>
          <Input
            id={`ev-${viaje.id}`}
            type="file"
            accept="image/*,application/pdf"
            capture="environment"
            className="sr-only"
            onChange={handleEvidence}
            disabled={uploading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
