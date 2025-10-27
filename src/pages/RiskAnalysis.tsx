import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Shield, Plus, Calendar, Camera } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function RiskAnalysis() {
  const [risks, setRisks] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const [isRiskDialogOpen, setIsRiskDialogOpen] = useState(false);
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [riskForm, setRiskForm] = useState({
    titulo: "", descripcion: "", tipo_riesgo: "operativo", nivel_riesgo: "medio",
    probabilidad: "media", impacto: "medio", medidas_mitigacion: "", responsable: "",
    fecha_identificacion: new Date().toISOString().split('T')[0],
  });

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
      await supabase.from("analisis_riesgos").insert({ ...riskForm, created_by: user.id });
      toast({ title: "Éxito", description: "Riesgo registrado" });
      setIsRiskDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleIncidentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      let fotoUrl = null;
      if (selectedImage) {
        const fileName = `${user.id}-${Date.now()}.${selectedImage.name.split('.').pop()}`;
        await supabase.storage.from('fotos-incidentes').upload(fileName, selectedImage);
        const { data } = supabase.storage.from('fotos-incidentes').getPublicUrl(fileName);
        fotoUrl = data.publicUrl;
      }
      await supabase.from("incidentes").insert({ 
        ...incidentForm, 
        costo_estimado: incidentForm.costo_estimado ? parseFloat(incidentForm.costo_estimado) : null,
        foto_url: fotoUrl,
        created_by: user.id 
      });
      toast({ title: "Éxito", description: "Incidente registrado" });
      setIsIncidentDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const highRisks = risks.filter(r => r.nivel_riesgo === 'alto' || r.nivel_riesgo === 'critico');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg"><Shield className="h-6 w-6 text-primary-foreground" /></div>
          <div><h1 className="text-2xl font-bold">Análisis de Riesgos</h1><p className="text-muted-foreground">Gestión de riesgos e incidentes</p></div>
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
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />Nuevo Peritaje</Button></DialogTrigger>
            <DialogContent className="max-w-2xl">
              <form onSubmit={handleRiskSubmit} className="space-y-4">
                <Input placeholder="Título" value={riskForm.titulo} onChange={(e) => setRiskForm({...riskForm, titulo: e.target.value})} required />
                <Textarea placeholder="Descripción" value={riskForm.descripcion} onChange={(e) => setRiskForm({...riskForm, descripcion: e.target.value})} required />
                <Button type="submit">Registrar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Riesgos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{risks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Riesgo Alto</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{highRisks.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Incidentes</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-secondary">{incidents.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Recientes</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{incidents.slice(0, 5).length}</div></CardContent></Card>
      </div>

      <Tabs defaultValue="risks">
        <TabsList><TabsTrigger value="risks">Riesgos</TabsTrigger><TabsTrigger value="incidents">Incidentes</TabsTrigger></TabsList>
        <TabsContent value="risks"><Card><CardHeader><CardTitle>Análisis de Riesgos</CardTitle></CardHeader><CardContent><div className="space-y-3">{risks.map(r => <div key={r.id} className="p-4 border rounded"><div className="flex justify-between"><div><h4 className="font-semibold">{r.titulo}</h4><p className="text-sm text-muted-foreground">{r.descripcion}</p></div><Badge variant={r.nivel_riesgo === 'alto' || r.nivel_riesgo === 'critico' ? 'destructive' : 'secondary'}>{r.nivel_riesgo}</Badge></div></div>)}</div></CardContent></Card></TabsContent>
        <TabsContent value="incidents"><Card><CardHeader><CardTitle>Incidentes Recientes</CardTitle></CardHeader><CardContent><div className="space-y-3">{incidents.map(i => <div key={i.id} className="p-4 border rounded"><div className="flex justify-between"><div><h4 className="font-semibold">{i.titulo}</h4><p className="text-sm text-muted-foreground">{i.descripcion}</p><p className="text-xs text-muted-foreground mt-1">{new Date(i.fecha_incidente).toLocaleString("es-MX")}</p></div><Badge variant={i.gravedad === 'alta' || i.gravedad === 'critica' ? 'destructive' : 'secondary'}>{i.gravedad}</Badge></div>{i.foto_url && <img src={i.foto_url} className="mt-2 w-full h-48 object-cover rounded" />}</div>)}</div></CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
