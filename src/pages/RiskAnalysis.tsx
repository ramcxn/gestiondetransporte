import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Plus, Calendar, Camera, Download, FileText } from "lucide-react";
import { generateRiskAnalysisPDF } from "@/lib/pdfUtils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { z } from "zod";

const riskSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200, "Máximo 200 caracteres"),
  descripcion: z.string().min(1, "La descripción es requerida").max(1000, "Máximo 1000 caracteres"),
  tipo_riesgo: z.enum(["operativo", "financiero", "seguridad", "ambiental", "legal"], { required_error: "Selecciona un tipo de riesgo" }),
  nivel_riesgo: z.enum(["bajo", "medio", "alto", "critico"], { required_error: "Selecciona un nivel de riesgo" }),
  probabilidad: z.enum(["baja", "media", "alta"], { required_error: "Selecciona una probabilidad" }),
  impacto: z.enum(["bajo", "medio", "alto", "critico"], { required_error: "Selecciona un impacto" }),
  medidas_mitigacion: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  responsable: z.string().max(100, "Máximo 100 caracteres").optional(),
  fecha_identificacion: z.string().min(1, "La fecha es requerida"),
});

const incidentSchema = z.object({
  titulo: z.string().min(1, "El título es requerido").max(200, "Máximo 200 caracteres"),
  descripcion: z.string().min(1, "La descripción es requerida").max(1000, "Máximo 1000 caracteres"),
  tipo_incidente: z.enum(["accidente", "robo", "daño_equipo", "incumplimiento", "otro"], { required_error: "Selecciona un tipo de incidente" }),
  gravedad: z.enum(["baja", "media", "alta", "critica"], { required_error: "Selecciona una gravedad" }),
  ubicacion: z.string().max(255, "Máximo 255 caracteres"),
  unidad: z.string().max(50, "Máximo 50 caracteres"),
  operador: z.string().max(100, "Máximo 100 caracteres"),
  fecha_incidente: z.string().min(1, "La fecha es requerida"),
  acciones_tomadas: z.string().max(1000, "Máximo 1000 caracteres"),
  costo_estimado: z.string().transform((val) => val === "" ? undefined : val).pipe(z.coerce.number().min(0, "El costo debe ser mayor a 0").max(9999999, "Costo máximo 9,999,999").optional()),
});

export default function RiskAnalysis() {
  const [risks, setRisks] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [isPeritajeDialogOpen, setIsPeritajeDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [riskForm, setRiskForm] = useState({
    titulo: "", descripcion: "", tipo_riesgo: "operativo", nivel_riesgo: "medio",
    probabilidad: "media", impacto: "medio", medidas_mitigacion: "", responsable: "",
    fecha_identificacion: new Date().toISOString().split('T')[0],
  });

  const [peritajeForm, setPeritajeForm] = useState({
    titulo: "",
    descripcion: "",
    fecha_hora_accidente: "",
    lugar_exacto: "",
    descripcion_entorno: "",
    condiciones_via: "",
    iluminacion: "",
    condiciones_meteorologicas: "",
    estudio_escena: "",
    vehiculos: [] as any[],
    conductores: [] as any[],
    testigos: [] as any[],
    lesionados: [] as any[],
    descripcion_impacto: "",
    velocidad_estimada: "",
    trayectoria: "",
    factores_externos: "",
    declaraciones: "",
  });

  const [peritajeFiles, setPeritajeFiles] = useState<File[]>([]);

  const handlePeritajeFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPeritajeFiles(Array.from(e.target.files));
    }
  };

  const uploadPeritajeFiles = async (userId: string): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    
    for (const file of peritajeFiles) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('archivos-peritajes')
        .upload(fileName, file);
      
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from('archivos-peritajes')
          .getPublicUrl(fileName);
        uploadedUrls.push(publicUrl);
      }
    }
    
    return uploadedUrls;
  };

  const [incidentForm, setIncidentForm] = useState({
    titulo: "", descripcion: "", tipo_incidente: "accidente", gravedad: "media",
    ubicacion: "", unidad: "", operador: "", fecha_incidente: new Date().toISOString(),
    acciones_tomadas: "", costo_estimado: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: r } = await supabase.from("analisis_riesgos").select("*").order("created_at", { ascending: false });
    const { data: i } = await supabase.from("incidentes").select("*").order("fecha_incidente", { ascending: false });
    setRisks(r || []);
    setIncidents(i || []);
    setLoading(false);
  };

  const handleRiskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Validate form data
      const validatedData = riskSchema.parse(riskForm);
      
      await supabase.from("analisis_riesgos").insert({ 
        ...validatedData, 
        tipo_analisis: 'riesgo' as any,
        created_by: user.id 
      } as any);
      toast({ title: "Éxito", description: "Riesgo registrado" });
      setIsRiskDialogOpen(false);
      fetchData();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ 
          title: "Error de validación", 
          description: error.errors[0].message,
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", variant: "destructive" });
      }
    }
  };

  const handlePeritajeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const uploadedFiles = await uploadPeritajeFiles(user.id);
      
      await supabase.from("analisis_riesgos").insert({ 
        tipo_analisis: 'peritaje' as any,
        titulo: peritajeForm.titulo,
        descripcion: peritajeForm.descripcion,
        fecha_hora_accidente: peritajeForm.fecha_hora_accidente,
        lugar_exacto: peritajeForm.lugar_exacto,
        descripcion_entorno: peritajeForm.descripcion_entorno,
        condiciones_via: peritajeForm.condiciones_via,
        iluminacion: peritajeForm.iluminacion,
        condiciones_meteorologicas: peritajeForm.condiciones_meteorologicas,
        estudio_escena: peritajeForm.estudio_escena,
        vehiculos: JSON.stringify(peritajeForm.vehiculos),
        conductores: JSON.stringify(peritajeForm.conductores),
        testigos: JSON.stringify(peritajeForm.testigos),
        lesionados: JSON.stringify(peritajeForm.lesionados),
        descripcion_impacto: peritajeForm.descripcion_impacto,
        velocidad_estimada: peritajeForm.velocidad_estimada,
        trayectoria: peritajeForm.trayectoria,
        factores_externos: peritajeForm.factores_externos,
        declaraciones: peritajeForm.declaraciones,
        archivos_adjuntos: uploadedFiles,
        created_by: user.id 
      } as any);
      toast({ title: "Éxito", description: "Peritaje registrado exitosamente" });
      setPeritajeFiles([]);
      setIsPeritajeDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo registrar el peritaje", variant: "destructive" });
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      // Validate form data
      const validatedData = incidentSchema.parse(incidentForm);
      
      let fotoUrl = null;
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('fotos-incidentes')
          .upload(fileName, selectedImage);
        
        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('fotos-incidentes')
            .getPublicUrl(fileName);
          fotoUrl = publicUrl;
        }
      }

      const insertData: any = {
        titulo: validatedData.titulo,
        descripcion: validatedData.descripcion,
        tipo_incidente: validatedData.tipo_incidente,
        gravedad: validatedData.gravedad,
        ubicacion: validatedData.ubicacion || null,
        unidad: validatedData.unidad || null,
        operador: validatedData.operador || null,
        fecha_incidente: validatedData.fecha_incidente,
        acciones_tomadas: validatedData.acciones_tomadas || null,
        costo_estimado: validatedData.costo_estimado || null,
        foto_url: fotoUrl,
        created_by: user.id,
      };

      await supabase.from("incidentes").insert([insertData]);
      toast({ title: "Éxito", description: "Incidente registrado" });
      setIsIncidentDialogOpen(false);
      setSelectedImage(null);
      fetchData();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({ 
          title: "Error de validación", 
          description: error.errors[0].message,
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", variant: "destructive" });
      }
    }
  };
  const downloadPeritajePDF = (peritaje: any) => {
    const doc = generateRiskAnalysisPDF(peritaje);
    doc.save(`Peritaje_${peritaje.titulo.replace(/\s+/g, '_')}.pdf`);
    toast({
      title: "PDF Generado",
      description: "El informe se ha descargado exitosamente",
    });
  };

  const downloadRiskPDF = (risk: any) => {
    const doc = generateRiskAnalysisPDF(risk);
    doc.save(`Riesgo_${risk.titulo.replace(/\s+/g, '_')}.pdf`);
    toast({
      title: "PDF Generado",
      description: "El reporte se ha descargado exitosamente",
    });
  };

  const highRisks = risks.filter(r => r.nivel_riesgo === 'alto' || r.nivel_riesgo === 'critico');
  const peritajes = risks.filter(r => r.tipo_analisis === 'peritaje');
  const riesgos = risks.filter(r => r.tipo_analisis === 'riesgo' || !r.tipo_analisis);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div><h1 className="text-2xl font-bold">Análisis de Riesgos y Peritajes</h1><p className="text-muted-foreground">Gestión de riesgos, peritajes e incidentes</p></div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isIncidentDialogOpen} onOpenChange={setIsIncidentDialogOpen}>
            <DialogTrigger asChild><Button variant="outline"><AlertTriangle className="h-4 w-4 mr-2" />Reportar Incidente</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Reportar Incidente</DialogTitle></DialogHeader>
              <form onSubmit={handleIncidentSubmit} className="space-y-4">
                <Input placeholder="Título" value={incidentForm.titulo} onChange={(e) => setIncidentForm({...incidentForm, titulo: e.target.value})} required />
                <Textarea placeholder="Descripción" value={incidentForm.descripcion} onChange={(e) => setIncidentForm({...incidentForm, descripcion: e.target.value})} required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={incidentForm.tipo_incidente} onValueChange={(v) => setIncidentForm({...incidentForm, tipo_incidente: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="accidente">Accidente</SelectItem>
                      <SelectItem value="robo">Robo</SelectItem>
                      <SelectItem value="averia">Avería</SelectItem>
                      <SelectItem value="retraso">Retraso</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={incidentForm.gravedad} onValueChange={(v) => setIncidentForm({...incidentForm, gravedad: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="critica">Crítica</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Ubicación" value={incidentForm.ubicacion} onChange={(e) => setIncidentForm({...incidentForm, ubicacion: e.target.value})} />
                  <Input type="file" accept="image/*" onChange={(e) => setSelectedImage(e.target.files?.[0] || null)} />
                </div>
                <Button type="submit">Registrar</Button>
              </form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isRiskDialogOpen} onOpenChange={setIsRiskDialogOpen}>
            <DialogTrigger asChild><Button variant="outline"><Shield className="h-4 w-4 mr-2" />Nuevo Riesgo</Button></DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo Análisis de Riesgo</DialogTitle></DialogHeader>
              <form onSubmit={handleRiskSubmit} className="space-y-4">
                <Input placeholder="Título" value={riskForm.titulo} onChange={(e) => setRiskForm({...riskForm, titulo: e.target.value})} required />
                <Textarea placeholder="Descripción" value={riskForm.descripcion} onChange={(e) => setRiskForm({...riskForm, descripcion: e.target.value})} required />
                <div className="grid gap-4 md:grid-cols-2">
                  <Select value={riskForm.nivel_riesgo} onValueChange={(v) => setRiskForm({...riskForm, nivel_riesgo: v})}>
                    <SelectTrigger><SelectValue placeholder="Nivel de riesgo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bajo">Bajo</SelectItem>
                      <SelectItem value="medio">Medio</SelectItem>
                      <SelectItem value="alto">Alto</SelectItem>
                      <SelectItem value="critico">Crítico</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={riskForm.probabilidad} onValueChange={(v) => setRiskForm({...riskForm, probabilidad: v})}>
                    <SelectTrigger><SelectValue placeholder="Probabilidad" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Textarea placeholder="Medidas de mitigación" value={riskForm.medidas_mitigacion} onChange={(e) => setRiskForm({...riskForm, medidas_mitigacion: e.target.value})} />
                <Button type="submit">Registrar Riesgo</Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isPeritajeDialogOpen} onOpenChange={setIsPeritajeDialogOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo Peritaje</Button></DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nuevo Peritaje de Accidente</DialogTitle><DialogDescription>Complete toda la información del peritaje</DialogDescription></DialogHeader>
              <form onSubmit={handlePeritajeSubmit} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información General</h3>
                  <Input placeholder="Título del peritaje" value={peritajeForm.titulo} onChange={(e) => setPeritajeForm({...peritajeForm, titulo: e.target.value})} required />
                  <Textarea placeholder="Descripción general" value={peritajeForm.descripcion} onChange={(e) => setPeritajeForm({...peritajeForm, descripcion: e.target.value})} required />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Datos del Accidente y Lugar</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Fecha y Hora del Accidente</Label>
                      <Input type="datetime-local" value={peritajeForm.fecha_hora_accidente} onChange={(e) => setPeritajeForm({...peritajeForm, fecha_hora_accidente: e.target.value})} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Lugar Exacto</Label>
                      <Input placeholder="Ubicación precisa" value={peritajeForm.lugar_exacto} onChange={(e) => setPeritajeForm({...peritajeForm, lugar_exacto: e.target.value})} required />
                    </div>
                  </div>
                  <Textarea placeholder="Descripción del entorno (ancho de vía, señalización, etc.)" value={peritajeForm.descripcion_entorno} onChange={(e) => setPeritajeForm({...peritajeForm, descripcion_entorno: e.target.value})} />
                  <div className="grid gap-4 md:grid-cols-3">
                    <Input placeholder="Condiciones de la vía" value={peritajeForm.condiciones_via} onChange={(e) => setPeritajeForm({...peritajeForm, condiciones_via: e.target.value})} />
                    <Input placeholder="Iluminación" value={peritajeForm.iluminacion} onChange={(e) => setPeritajeForm({...peritajeForm, iluminacion: e.target.value})} />
                    <Input placeholder="Condiciones meteorológicas" value={peritajeForm.condiciones_meteorologicas} onChange={(e) => setPeritajeForm({...peritajeForm, condiciones_meteorologicas: e.target.value})} />
                  </div>
                  <Textarea placeholder="Estudio de la escena (restos, vestigios, indicios)" value={peritajeForm.estudio_escena} onChange={(e) => setPeritajeForm({...peritajeForm, estudio_escena: e.target.value})} />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Análisis Técnico y Reconstrucción</h3>
                  <Textarea placeholder="Descripción del impacto (frontal, lateral, trasera, vuelco, etc.)" value={peritajeForm.descripcion_impacto} onChange={(e) => setPeritajeForm({...peritajeForm, descripcion_impacto: e.target.value})} />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input placeholder="Velocidad estimada" value={peritajeForm.velocidad_estimada} onChange={(e) => setPeritajeForm({...peritajeForm, velocidad_estimada: e.target.value})} />
                    <Input placeholder="Trayectoria" value={peritajeForm.trayectoria} onChange={(e) => setPeritajeForm({...peritajeForm, trayectoria: e.target.value})} />
                  </div>
                  <Textarea placeholder="Factores externos (tráfico, obstáculos, etc.)" value={peritajeForm.factores_externos} onChange={(e) => setPeritajeForm({...peritajeForm, factores_externos: e.target.value})} />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Declaraciones</h3>
                  <Textarea placeholder="Resumen de declaraciones de conductores y testigos" rows={4} value={peritajeForm.declaraciones} onChange={(e) => setPeritajeForm({...peritajeForm, declaraciones: e.target.value})} />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Archivos Adjuntos</h3>
                  <div className="space-y-2">
                    <Label htmlFor="peritaje_files">Subir archivos (Fotos, PDFs, documentos)</Label>
                    <Input
                      id="peritaje_files"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handlePeritajeFileChange}
                    />
                    {peritajeFiles.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {peritajeFiles.length} archivo(s) seleccionado(s)
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsPeritajeDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit">Registrar Peritaje</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Riesgos</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold">{riesgos.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Riesgo Alto</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold text-destructive">{highRisks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Peritajes</CardTitle></CardHeader><CardContent><div className="text-2xl sm:text-3xl font-bold text-primary">{peritajes.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Incidentes</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-secondary">{incidents.length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="risks">
        <TabsList>
          <TabsTrigger value="risks">Riesgos</TabsTrigger>
          <TabsTrigger value="peritajes">Peritajes</TabsTrigger>
          <TabsTrigger value="incidents">Incidentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="risks">
          <Card>
            <CardHeader><CardTitle>Análisis de Riesgos</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {riesgos.map(r => (
                  <div key={r.id} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{r.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{r.descripcion}</p>
                        {r.medidas_mitigacion && (
                          <p className="text-sm mt-2"><strong>Mitigación:</strong> {r.medidas_mitigacion}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={r.nivel_riesgo === 'alto' || r.nivel_riesgo === 'critico' ? 'destructive' : 'secondary'}>{r.nivel_riesgo}</Badge>
                        <Button size="sm" variant="outline" onClick={() => downloadRiskPDF(r)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="peritajes">
          <Card>
            <CardHeader><CardTitle>Peritajes de Accidentes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {peritajes.map(p => (
                  <div key={p.id} className="p-4 border rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{p.titulo}</h4>
                        <p className="text-sm text-muted-foreground mb-2">{p.descripcion}</p>
                        {p.fecha_hora_accidente && (
                          <p className="text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 inline mr-1" />
                            {new Date(p.fecha_hora_accidente).toLocaleString("es-MX")}
                          </p>
                        )}
                        {p.lugar_exacto && (
                          <p className="text-xs text-muted-foreground">📍 {p.lugar_exacto}</p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => downloadPeritajePDF(p)}>
                        <Download className="h-4 w-4 mr-1" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidents">
          <Card>
            <CardHeader><CardTitle>Incidentes Recientes</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                {incidents.map(i => (
                  <div key={i.id} className="p-4 border rounded">
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-semibold">{i.titulo}</h4>
                        <p className="text-sm text-muted-foreground">{i.descripcion}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(i.fecha_incidente).toLocaleString("es-MX")}</p>
                      </div>
                      <Badge variant={i.gravedad === 'alta' || i.gravedad === 'critica' ? 'destructive' : 'secondary'}>{i.gravedad}</Badge>
                    </div>
                    {i.foto_url && <img src={i.foto_url} className="mt-2 w-full h-48 object-cover rounded" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
