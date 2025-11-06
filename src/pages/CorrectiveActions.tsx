import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Plus, CheckCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateCorrectiveActionPDF } from "@/lib/pdfUtils";

interface CorrectiveAction {
  id: string;
  folio: string;
  titulo: string;
  descripcion_problema: string;
  equipo_responsable: string;
  lider_equipo: string;
  miembros_equipo: any;
  descripcion_detallada: string;
  fecha_deteccion: string;
  area_afectada: string;
  acciones_contencion: string | null;
  fecha_contencion: string | null;
  responsable_contencion: string | null;
  analisis_causa_raiz: string | null;
  herramientas_utilizadas: string | null;
  acciones_correctivas: string;
  responsable_accion: string;
  fecha_compromiso: string;
  fecha_implementacion: string | null;
  evidencia_implementacion: string | null;
  acciones_preventivas: string | null;
  actualizacion_procedimientos: string | null;
  reconocimiento: string | null;
  lecciones_aprendidas: string | null;
  estado: string;
  prioridad: string;
  created_at: string;
}

export default function CorrectiveActions() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [actions, setActions] = useState<CorrectiveAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion_problema: "",
    equipo_responsable: "",
    lider_equipo: "",
    descripcion_detallada: "",
    fecha_deteccion: "",
    area_afectada: "",
    acciones_contencion: "",
    fecha_contencion: "",
    responsable_contencion: "",
    analisis_causa_raiz: "",
    herramientas_utilizadas: "",
    acciones_correctivas: "",
    responsable_accion: "",
    fecha_compromiso: "",
    acciones_preventivas: "",
    prioridad: "media",
  });

  useEffect(() => {
    fetchActions();

    const channel = supabase
      .channel('corrective-actions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'acciones_correctivas'
        },
        () => {
          fetchActions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchActions = async () => {
    try {
      const { data, error } = await supabase
        .from("acciones_correctivas")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setActions(data || []);
    } catch (error) {
      console.error("Error fetching actions:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las acciones correctivas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // Generate folio
      const { data: folioData, error: folioError } = await supabase
        .rpc('generate_accion_correctiva_folio');

      if (folioError) throw folioError;

      // Get client_id using RPC function
      const { data: rpcClientId } = await supabase.rpc('get_client_id_by_email_domain');
      
      let finalClientId = rpcClientId;
      
      // Fallback to profile client_id if RPC returns null
      if (!finalClientId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("client_id")
          .eq("id", user.id)
          .single();
        finalClientId = profile?.client_id;
      }

      if (!finalClientId) throw new Error("No client_id found");

      const { error } = await supabase
        .from("acciones_correctivas")
        .insert({
          folio: folioData,
          titulo: formData.titulo,
          descripcion_problema: formData.descripcion_problema,
          equipo_responsable: formData.equipo_responsable,
          lider_equipo: formData.lider_equipo,
          descripcion_detallada: formData.descripcion_detallada,
          fecha_deteccion: formData.fecha_deteccion,
          area_afectada: formData.area_afectada,
          acciones_contencion: formData.acciones_contencion || null,
          fecha_contencion: formData.fecha_contencion || null,
          responsable_contencion: formData.responsable_contencion || null,
          analisis_causa_raiz: formData.analisis_causa_raiz || null,
          herramientas_utilizadas: formData.herramientas_utilizadas || null,
          acciones_correctivas: formData.acciones_correctivas,
          responsable_accion: formData.responsable_accion,
          fecha_compromiso: formData.fecha_compromiso,
          acciones_preventivas: formData.acciones_preventivas || null,
          prioridad: formData.prioridad,
          client_id: finalClientId,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Acción correctiva registrada exitosamente",
      });

      setFormData({
        titulo: "",
        descripcion_problema: "",
        equipo_responsable: "",
        lider_equipo: "",
        descripcion_detallada: "",
        fecha_deteccion: "",
        area_afectada: "",
        acciones_contencion: "",
        fecha_contencion: "",
        responsable_contencion: "",
        analisis_causa_raiz: "",
        herramientas_utilizadas: "",
        acciones_correctivas: "",
        responsable_accion: "",
        fecha_compromiso: "",
        acciones_preventivas: "",
        prioridad: "media",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting action:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la acción correctiva",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (action: CorrectiveAction) => {
    const doc = generateCorrectiveActionPDF(action);
    doc.save(`8D_${action.folio}.pdf`);
    
    toast({
      title: "PDF Generado",
      description: `Reporte 8D ${action.folio} descargado exitosamente`,
    });
  };

  const abiertas = actions.filter(a => a.estado === 'abierto');
  const enProgreso = actions.filter(a => a.estado === 'en_progreso');
  const cerradas = actions.filter(a => a.estado === 'cerrado');
  const criticas = actions.filter(a => a.prioridad === 'critica' && a.estado !== 'cerrado');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FileText className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Acciones Correctivas (8D's)</h1>
            <p className="text-muted-foreground">Metodología de resolución de problemas</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Acción 8D
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Acción Correctiva 8D</DialogTitle>
              <DialogDescription>Complete las 8 disciplinas del proceso</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="d0" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="d0">D0-D2</TabsTrigger>
                  <TabsTrigger value="d3">D3-D4</TabsTrigger>
                  <TabsTrigger value="d5">D5-D6</TabsTrigger>
                  <TabsTrigger value="d7">D7-D8</TabsTrigger>
                </TabsList>

                <TabsContent value="d0" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>D0: Título del Problema</Label>
                    <Input
                      placeholder="Título descriptivo del problema"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Prioridad</Label>
                      <Select
                        value={formData.prioridad}
                        onValueChange={(value) => setFormData({ ...formData, prioridad: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baja">Baja</SelectItem>
                          <SelectItem value="media">Media</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="critica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>D1: Líder del Equipo</Label>
                      <Input
                        placeholder="Nombre del líder"
                        value={formData.lider_equipo}
                        onChange={(e) => setFormData({ ...formData, lider_equipo: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>D1: Equipo Responsable</Label>
                    <Input
                      placeholder="Nombres de los miembros del equipo"
                      value={formData.equipo_responsable}
                      onChange={(e) => setFormData({ ...formData, equipo_responsable: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>D2: Fecha de Detección</Label>
                      <Input
                        type="date"
                        value={formData.fecha_deteccion}
                        onChange={(e) => setFormData({ ...formData, fecha_deteccion: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>D2: Área Afectada</Label>
                      <Input
                        placeholder="Área o departamento"
                        value={formData.area_afectada}
                        onChange={(e) => setFormData({ ...formData, area_afectada: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>D2: Descripción Detallada del Problema</Label>
                    <Textarea
                      placeholder="Describa el problema de manera específica y cuantificable..."
                      value={formData.descripcion_detallada}
                      onChange={(e) => setFormData({ ...formData, descripcion_detallada: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Resumen del Problema</Label>
                    <Textarea
                      placeholder="Resumen breve del problema"
                      value={formData.descripcion_problema}
                      onChange={(e) => setFormData({ ...formData, descripcion_problema: e.target.value })}
                      rows={2}
                      required
                    />
                  </div>
                </TabsContent>

                <TabsContent value="d3" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>D3: Acciones de Contención Inmediata</Label>
                    <Textarea
                      placeholder="¿Qué acciones inmediatas se tomaron para contener el problema?"
                      value={formData.acciones_contencion}
                      onChange={(e) => setFormData({ ...formData, acciones_contencion: e.target.value })}
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>D3: Fecha de Contención</Label>
                      <Input
                        type="date"
                        value={formData.fecha_contencion}
                        onChange={(e) => setFormData({ ...formData, fecha_contencion: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>D3: Responsable de Contención</Label>
                      <Input
                        placeholder="Nombre del responsable"
                        value={formData.responsable_contencion}
                        onChange={(e) => setFormData({ ...formData, responsable_contencion: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>D4: Análisis de Causa Raíz</Label>
                    <Textarea
                      placeholder="¿Cuál es la causa raíz del problema? (Use 5 Porqués, Ishikawa, etc.)"
                      value={formData.analisis_causa_raiz}
                      onChange={(e) => setFormData({ ...formData, analisis_causa_raiz: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>D4: Herramientas Utilizadas</Label>
                    <Input
                      placeholder="5 Porqués, Diagrama Ishikawa, etc."
                      value={formData.herramientas_utilizadas}
                      onChange={(e) => setFormData({ ...formData, herramientas_utilizadas: e.target.value })}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="d5" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>D5: Acciones Correctivas Permanentes *</Label>
                    <Textarea
                      placeholder="¿Qué acciones permanentes eliminarán la causa raíz?"
                      value={formData.acciones_correctivas}
                      onChange={(e) => setFormData({ ...formData, acciones_correctivas: e.target.value })}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>D5: Responsable de la Acción *</Label>
                      <Input
                        placeholder="Nombre del responsable"
                        value={formData.responsable_accion}
                        onChange={(e) => setFormData({ ...formData, responsable_accion: e.target.value })}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>D5: Fecha Compromiso *</Label>
                      <Input
                        type="date"
                        value={formData.fecha_compromiso}
                        onChange={(e) => setFormData({ ...formData, fecha_compromiso: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="d7" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>D7: Acciones Preventivas</Label>
                    <Textarea
                      placeholder="¿Cómo prevenir que este problema ocurra nuevamente? ¿Qué procedimientos se actualizarán?"
                      value={formData.acciones_preventivas}
                      onChange={(e) => setFormData({ ...formData, acciones_preventivas: e.target.value })}
                      rows={4}
                    />
                  </div>

                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Nota:</strong> Los campos D6 (Implementación) y D8 (Reconocimiento) 
                      se completarán cuando se actualice el progreso de la acción correctiva.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-primary hover:bg-primary/90"
                  disabled={submitting}
                >
                  {submitting ? "Registrando..." : "Registrar 8D"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Abiertas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{abiertas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Por iniciar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Progreso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{enProgreso.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Activas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cerradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{cerradas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Completadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Críticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{criticas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Urgentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Acciones Correctivas Registradas</CardTitle>
          <CardDescription>Reportes 8D del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : actions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay acciones correctivas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{action.folio}</h4>
                        {action.estado === "cerrado" && (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Cerrado
                          </Badge>
                        )}
                        {action.estado === "en_progreso" && (
                          <Badge className="bg-primary text-primary-foreground">En Progreso</Badge>
                        )}
                        {action.estado === "abierto" && (
                          <Badge variant="outline">Abierto</Badge>
                        )}
                        {action.prioridad === "critica" && (
                          <Badge variant="destructive">Crítica</Badge>
                        )}
                        {action.prioridad === "alta" && (
                          <Badge className="bg-orange-500">Alta</Badge>
                        )}
                      </div>
                      <h5 className="text-lg font-medium mb-2">{action.titulo}</h5>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <p><strong>Líder:</strong> {action.lider_equipo}</p>
                        <p><strong>Área:</strong> {action.area_afectada}</p>
                        <p><strong>Fecha Detección:</strong> {new Date(action.fecha_deteccion).toLocaleDateString('es-MX')}</p>
                        <p><strong>Responsable Acción:</strong> {action.responsable_accion}</p>
                        <p className="mt-2">{action.descripcion_problema}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadPDF(action)}
                      className="ml-4"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
