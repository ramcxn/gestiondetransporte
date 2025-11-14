import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Shield, QrCode, CheckCircle2, Clock, MapPin, AlertTriangle, Download, Calendar, Play, Square } from "lucide-react";
import QRScanner from "@/components/QRScanner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { z } from "zod";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const securityRoundSchema = z.object({
  zona_id: z.string().min(1, "Debes seleccionar una zona"),
  incidente: z.boolean(),
  descripcion_incidente: z.string().max(1000, "Máximo 1000 caracteres").optional(),
}).refine((data) => {
  if (data.incidente && (!data.descripcion_incidente || data.descripcion_incidente.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "La descripción del incidente es requerida cuando hay un incidente",
  path: ["descripcion_incidente"],
});

interface Rondin {
  id: string;
  folio: string;
  fecha_inicio: string;
  fecha_fin: string | null;
  estado: string;
  zonas_totales: number;
  zonas_visitadas: number;
  incidentes_reportados: number;
  observaciones: string | null;
  client_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator_name?: string;
}

interface VisitaZona {
  id: string;
  rondin_id: string;
  ubicacion: string;
  codigo_qr: string;
  incidente: boolean;
  descripcion_incidente: string | null;
  foto_url: string | null;
  created_at: string;
  created_by: string;
}

interface SecurityZone {
  id: string;
  nombre: string;
  codigo_qr: string;
  ubicacion: string;
  activa: boolean;
}

export default function SecurityRounds() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [currentRondin, setCurrentRondin] = useState<Rondin | null>(null);
  const [rondines, setRondines] = useState<Rondin[]>([]);
  const [visitas, setVisitas] = useState<VisitaZona[]>([]);
  const [zones, setZones] = useState<SecurityZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [generatingReport, setGeneratingReport] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    zona_id: "",
    incidente: false,
    descripcion_incidente: "",
  });

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    fetchZones();
    fetchCurrentRondin();
    fetchRondines();

    const channel = supabase
      .channel('rondines-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rondines' }, () => {
        fetchRondines();
        fetchCurrentRondin();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visitas_zonas' }, () => {
        if (currentRondin) fetchVisitasRondin(currentRondin.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchZones = async () => {
    try {
      const { data, error } = await supabase.from("zonas_seguridad").select("*").eq('activa', true).order("nombre", { ascending: true });
      if (error) throw error;
      setZones(data || []);
    } catch (error) {
      console.error("Error fetching zones:", error);
    }
  };

  const fetchCurrentRondin = async () => {
    try {
      const { data, error } = await supabase.from("rondines").select("*").eq('estado', 'en_progreso').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      if (data) {
        setCurrentRondin(data);
        fetchVisitasRondin(data.id);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisitasRondin = async (rondinId: string) => {
    try {
      const { data, error } = await supabase.from("visitas_zonas").select("*").eq('rondin_id', rondinId).order('created_at', { ascending: false });
      if (error) throw error;
      setVisitas(data || []);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchRondines = async () => {
    try {
      const { data: rondinesData, error } = await supabase.from("rondines").select("*").order("created_at", { ascending: false });
      if (error) throw error;

      const userIds = [...new Set(rondinesData?.map(r => r.created_by) || [])];
      const { data: profilesData } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedRondines = rondinesData?.map(rondin => ({ ...rondin, creator_name: profilesMap.get(rondin.created_by) || "Usuario" })) || [];
      setRondines(enrichedRondines);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleStartRondin = async () => {
    console.log('[SecurityRounds] Iniciando rondín...', { user, currentRondin, zonesLength: zones.length });
    if (!user) {
      console.log('[SecurityRounds] Error: No hay usuario autenticado');
      toast({ title: "Error", description: "Usuario no autenticado", variant: "destructive" });
      return;
    }
    if (currentRondin) {
      console.log('[SecurityRounds] Error: Ya hay un rondín en progreso');
      toast({ title: "Error", description: "Ya hay un rondín en progreso", variant: "destructive" });
      return;
    }
    try {
      // Obtener el client_id del usuario
      const { data: profile } = await supabase
        .from('profiles')
        .select('client_id')
        .eq('id', user.id)
        .single();

      console.log('[SecurityRounds] Client ID obtenido:', profile?.client_id);
      
      if (!profile?.client_id) {
        throw new Error('No se pudo obtener el client_id del usuario');
      }

      console.log('[SecurityRounds] Insertando rondín en base de datos...');
      const { data, error } = await supabase
        .from("rondines")
        .insert({ 
          folio: '', // Se genera automáticamente por el trigger
          zonas_totales: zones.length, 
          zonas_visitadas: 0, 
          incidentes_reportados: 0, 
          estado: 'en_progreso', 
          created_by: user.id,
          client_id: profile.client_id
        } as any)
        .select()
        .single();
      
      if (error) {
        console.error('[SecurityRounds] Error al insertar:', error);
        throw error;
      }
      
      console.log('[SecurityRounds] Rondín creado exitosamente:', data);
      setCurrentRondin(data);
      toast({ title: "Rondín iniciado", description: `Folio: ${data.folio}` });
    } catch (error: any) {
      console.error('[SecurityRounds] Error en handleStartRondin:', error);
      toast({ 
        title: "Error al iniciar rondín", 
        description: error.message || "Error desconocido", 
        variant: "destructive" 
      });
    }
  };

  const handleFinishRondin = async () => {
    if (!currentRondin) return;
    if (currentRondin.zonas_visitadas < currentRondin.zonas_totales) {
      toast({ title: "Rondín incompleto", description: `Completa todas las zonas (${currentRondin.zonas_visitadas}/${currentRondin.zonas_totales})`, variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.from("rondines").update({ estado: 'completado', fecha_fin: new Date().toISOString() }).eq('id', currentRondin.id);
      if (error) throw error;
      toast({ title: "Rondín completado" });
      setCurrentRondin(null);
      setVisitas([]);
      fetchRondines();
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedImage || !user) return null;
    setUploadingImage(true);
    try {
      const fileName = `${user.id}-${Date.now()}.${selectedImage.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('fotos-rondines').upload(fileName, selectedImage);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('fotos-rondines').getPublicUrl(fileName);
      return publicUrl;
    } catch (error) {
      console.error("Error:", error);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentRondin || !user) return;

    try {
      securityRoundSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ title: "Error", description: error.errors[0].message, variant: "destructive" });
      }
      return;
    }

    const selectedZone = zones.find(z => z.id === formData.zona_id);
    if (!selectedZone) return;

    const alreadyVisited = visitas.some(v => v.codigo_qr === selectedZone.codigo_qr);
    if (alreadyVisited) {
      toast({ title: "Zona ya visitada", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const fotoUrl = await uploadImage();
      await supabase.from("visitas_zonas").insert({ rondin_id: currentRondin.id, ubicacion: selectedZone.ubicacion, codigo_qr: selectedZone.codigo_qr, incidente: formData.incidente, descripcion_incidente: formData.descripcion_incidente || null, foto_url: fotoUrl, created_by: user.id });
      
      const newZonasVisitadas = currentRondin.zonas_visitadas + 1;
      const newIncidentes = currentRondin.incidentes_reportados + (formData.incidente ? 1 : 0);
      await supabase.from("rondines").update({ zonas_visitadas: newZonasVisitadas, incidentes_reportados: newIncidentes }).eq('id', currentRondin.id);
      
      setCurrentRondin({ ...currentRondin, zonas_visitadas: newZonasVisitadas, incidentes_reportados: newIncidentes });
      toast({ title: "Visita registrada", description: `${newZonasVisitadas}/${currentRondin.zonas_totales}` });
      
      setFormData({ zona_id: "", incidente: false, descripcion_incidente: "" });
      setSelectedImage(null);
      setImagePreview(null);
      setIsDialogOpen(false);
      fetchVisitasRondin(currentRondin.id);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQRScan = (result: string) => {
    const zone = zones.find((z) => z.codigo_qr === result);
    if (zone) {
      setFormData({ ...formData, zona_id: zone.id });
      setShowQRScanner(false);
      toast({ title: "Zona identificada", description: `${zone.nombre}` });
    }
  };

  const generatePDFReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      toast({ title: "Error", description: "Selecciona ambas fechas", variant: "destructive" });
      return;
    }
    setGeneratingReport(true);
    try {
      const startDate = new Date(reportStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(reportEndDate);
      endDate.setHours(23, 59, 59, 999);

      const { data: rondinesData } = await supabase.from("rondines").select("*").gte("created_at", startDate.toISOString()).lte("created_at", endDate.toISOString()).order("created_at", { ascending: false });
      if (!rondinesData || rondinesData.length === 0) {
        toast({ title: "Sin datos", variant: "destructive" });
        setGeneratingReport(false);
        return;
      }

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.text("Reporte de Rondines", 105, 20, { align: "center" });
      doc.setFontSize(12);
      doc.text(`Total: ${rondinesData.length}`, 105, 30, { align: "center" });

      const tableData = rondinesData.map(r => [r.folio, new Date(r.created_at).toLocaleDateString(), r.estado, `${r.zonas_visitadas}/${r.zonas_totales}`, r.incidentes_reportados.toString()]);
      autoTable(doc, { startY: 40, head: [["Folio", "Fecha", "Estado", "Zonas", "Incidentes"]], body: tableData });

      doc.save(`reporte-rondines-${reportStartDate}.pdf`);
      toast({ title: "Reporte generado" });
      setIsReportDialogOpen(false);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Shield className="h-12 w-12 animate-pulse" /></div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const completedToday = rondines.filter(r => r.estado === 'completado' && new Date(r.created_at) >= today);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div>
            <h1 className="text-2xl font-bold">Rondines de Seguridad</h1>
            <p className="text-muted-foreground">{zones.length} zonas</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => setIsReportDialogOpen(true)}><Download className="mr-2 h-4 w-4" />Reporte</Button>
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generar Reporte</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Fecha Inicial</Label><Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} /></div>
            <div><Label>Fecha Final</Label><Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} /></div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsReportDialogOpen(false)}>Cancelar</Button>
            <Button onClick={generatePDFReport} disabled={generatingReport}>Generar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {currentRondin ? (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex justify-between">
              <div><CardTitle><Clock className="inline h-5 w-5 mr-2" />Rondín en Progreso</CardTitle><CardDescription>{currentRondin.folio}</CardDescription></div>
              <Button onClick={handleFinishRondin} size="sm"><Square className="mr-2 h-4 w-4" />Finalizar</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div><p className="text-sm text-muted-foreground">Progreso</p><p className="text-2xl font-bold">{currentRondin.zonas_visitadas}/{currentRondin.zonas_totales}</p></div>
              <div><p className="text-sm text-muted-foreground">Incidentes</p><p className="text-2xl font-bold text-destructive">{currentRondin.incidentes_reportados}</p></div>
              <div><Badge>En Progreso</Badge></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card><CardContent className="flex flex-col items-center py-12"><Shield className="h-12 w-12 text-muted-foreground mb-4" /><Button onClick={handleStartRondin}><Play className="mr-2 h-4 w-4" />Iniciar Rondín</Button></CardContent></Card>
      )}

      <div className="grid grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Rondines Hoy</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{completedToday.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Meta Diaria</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">3</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm">Total</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{rondines.length}</div></CardContent></Card>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild><Button className="w-full" disabled={!currentRondin}><QrCode className="mr-2 h-4 w-4" />Visitar Zona</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Visita</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><Label>Zona</Label>
              <div className="flex gap-2">
                <Select value={formData.zona_id} onValueChange={(v) => setFormData({ ...formData, zona_id: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{zones.map(z => <SelectItem key={z.id} value={z.id}>{z.nombre}</SelectItem>)}</SelectContent>
                </Select>
                <Button type="button" variant="outline" onClick={() => setShowQRScanner(!showQRScanner)}><QrCode /></Button>
              </div>
            </div>
            {showQRScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowQRScanner(false)} />}
            <div className="flex items-center gap-2"><Checkbox checked={formData.incidente} onCheckedChange={(c) => setFormData({ ...formData, incidente: c as boolean })} /><Label>Reportar incidente</Label></div>
            {formData.incidente && <div><Label>Descripción</Label><Textarea value={formData.descripcion_incidente} onChange={(e) => setFormData({ ...formData, descripcion_incidente: e.target.value })} /></div>}
            <div><Label>Foto</Label><Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setSelectedImage(file); const reader = new FileReader(); reader.onloadend = () => setImagePreview(reader.result as string); reader.readAsDataURL(file); } }} />{imagePreview && <img src={imagePreview} className="mt-2 h-48 object-cover rounded-lg" />}</div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button><Button type="submit" disabled={submitting}>Registrar</Button></div>
          </form>
        </DialogContent>
      </Dialog>

      <Card><CardHeader><CardTitle>Historial de Rondines</CardTitle></CardHeader><CardContent><div className="space-y-4">{rondines.map(r => <div key={r.id} className="p-4 border rounded-lg"><div className="flex justify-between mb-2"><div><p className="font-medium">{r.folio}</p><p className="text-sm text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p></div><Badge variant={r.estado === 'completado' ? 'default' : 'secondary'}>{r.estado}</Badge></div><div className="grid grid-cols-3 gap-4 text-sm"><div>Zonas: {r.zonas_visitadas}/{r.zonas_totales}</div><div>Incidentes: {r.incidentes_reportados}</div></div></div>)}</div></CardContent></Card>
    </div>
  );
}
