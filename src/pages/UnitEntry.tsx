import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Truck, Camera, AlertCircle, Clock, User, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const ctpatPoints = [
  "1. Puertas y cerraduras de caja",
  "2. Sistema de iluminación exterior",
  "3. Sello de seguridad",
  "4. Puertas laterales",
  "5. Panel frontal",
  "6. Panel lateral izquierdo",
  "7. Panel lateral derecho",
  "8. Techo",
  "9. Piso interior",
  "10. Compartimento de carga",
  "11. Quinta rueda",
  "12. Neumáticos y llantas",
  "13. Tanque de combustible",
  "14. Batería y cableado",
  "15. Sistema de escape",
  "16. Chasis y suspensión",
  "17. Documentación y placas",
];

interface UnitEntry {
  id: string;
  tipo_movimiento: string;
  numero_unidad: string;
  operador: string;
  tipo_unidad: string;
  numero_economico: string;
  odometro: number;
  requiere_mantenimiento: boolean;
  incidente: boolean;
  descripcion_incidente: string | null;
  foto_1_url: string | null;
  foto_2_url: string | null;
  puntos_seguridad: Record<string, boolean>;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

export default function UnitEntry() {
  const [checkedPoints, setCheckedPoints] = useState<Record<string, boolean>>({});
  const [entryType, setEntryType] = useState<"entrada" | "salida">("entrada");
  const [entries, setEntries] = useState<UnitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    numero_unidad: "",
    operador: "",
    tipo_unidad: "tracto",
    numero_economico: "",
    odometro: "",
    requiere_mantenimiento: false,
    incidente: false,
    descripcion_incidente: "",
  });

  useEffect(() => {
    fetchEntries();

    // Subscribe to realtime updates
    const channel = supabase
      .channel('unit-entry-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ingreso_unidades'
        },
        () => {
          fetchEntries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEntries = async () => {
    try {
      const { data: entriesData, error: entriesError } = await supabase
        .from("ingreso_unidades")
        .select("*")
        .order("created_at", { ascending: false });

      if (entriesError) throw entriesError;

      // Fetch creator names
      const userIds = [...new Set(entriesData?.map(e => e.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedEntries = entriesData?.map(entry => ({
        ...entry,
        puntos_seguridad: (entry.puntos_seguridad as Record<string, boolean>) || {},
        creator_name: profilesMap.get(entry.created_by) || "Usuario"
      })) || [];

      setEntries(enrichedEntries);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los registros",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const checkedCount = Object.values(checkedPoints).filter(Boolean).length;
    
    if (checkedCount < ctpatPoints.length) {
      toast({
        title: "Error",
        description: "Por favor complete todos los 17 puntos de inspección CTPAT",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("ingreso_unidades")
        .insert({
          tipo_movimiento: entryType,
          numero_unidad: formData.numero_unidad,
          operador: formData.operador,
          tipo_unidad: formData.tipo_unidad,
          numero_economico: formData.numero_economico,
          odometro: parseInt(formData.odometro),
          requiere_mantenimiento: formData.requiere_mantenimiento,
          incidente: formData.incidente,
          descripcion_incidente: formData.incidente ? formData.descripcion_incidente : null,
          puntos_seguridad: checkedPoints,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Unidad registrada exitosamente (${entryType})`,
      });

      // Reset form
      setFormData({
        numero_unidad: "",
        operador: "",
        tipo_unidad: "tracto",
        numero_economico: "",
        odometro: "",
        requiere_mantenimiento: false,
        incidente: false,
        descripcion_incidente: "",
      });
      setCheckedPoints({});
    } catch (error) {
      console.error("Error submitting entry:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la unidad",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayEntries = entries.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ingreso de Unidades</h1>
            <p className="text-muted-foreground">Registro basado en 17 puntos de seguridad CTPAT</p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? "Ocultar Historial" : "Ver Historial"}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registros Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayEntries.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayEntries.filter((e) => e.tipo_movimiento === "entrada").length} entradas
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">
              {entries.filter((e) => e.requiere_mantenimiento).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Unidades programadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {entries.filter((e) => e.incidente).length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reportados</p>
          </CardContent>
        </Card>
      </div>

      {showHistory && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Historial de Ingresos</CardTitle>
            <CardDescription>Registro completo de entradas y salidas de unidades</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : entries.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay registros de unidades
              </div>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">
                            Unidad {entry.numero_unidad}
                          </h4>
                          <Badge variant={entry.tipo_movimiento === "entrada" ? "default" : "secondary"}>
                            {entry.tipo_movimiento}
                          </Badge>
                          {entry.requiere_mantenimiento && (
                            <Badge variant="outline" className="border-secondary text-secondary">
                              Mantenimiento
                            </Badge>
                          )}
                          {entry.incidente && (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Incidente
                            </Badge>
                          )}
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              {new Date(entry.created_at).toLocaleDateString("es-MX")} •{" "}
                              {new Date(entry.created_at).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Operador: {entry.operador}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>
                              {entry.tipo_unidad} - Eco: {entry.numero_economico} - Odómetro: {entry.odometro.toLocaleString()} km
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            <span>
                              CTPAT: {Object.values(entry.puntos_seguridad).filter(Boolean).length}/17 puntos
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>Registrado por: {entry.creator_name}</span>
                          </div>
                          {entry.incidente && entry.descripcion_incidente && (
                            <div className="mt-2 p-2 bg-destructive/10 rounded text-sm border border-destructive/20">
                              <strong className="text-destructive">Incidente:</strong>{" "}
                              {entry.descripcion_incidente}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Nueva Inspección de Unidad</CardTitle>
              <CardDescription>Complete todos los campos requeridos y los 17 puntos CTPAT</CardDescription>
            </div>
            <Select value={entryType} onValueChange={(value: "entrada" | "salida") => setEntryType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="salida">Salida</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basico" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basico">Datos Básicos</TabsTrigger>
                <TabsTrigger value="inspeccion">Inspección CTPAT</TabsTrigger>
                <TabsTrigger value="adicional">Información Adicional</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="numero_unidad">Número de Unidad</Label>
                    <Input
                      id="numero_unidad"
                      placeholder="MX-1234"
                      value={formData.numero_unidad}
                      onChange={(e) => setFormData({ ...formData, numero_unidad: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operador">Operador</Label>
                    <Input
                      id="operador"
                      placeholder="Nombre del operador"
                      value={formData.operador}
                      onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo_unidad">Tipo de Unidad</Label>
                    <Select
                      value={formData.tipo_unidad}
                      onValueChange={(value) => setFormData({ ...formData, tipo_unidad: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tracto">Tracto</SelectItem>
                        <SelectItem value="remolque">Remolque</SelectItem>
                        <SelectItem value="dolly">Dolly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numero_economico">Número Económico</Label>
                    <Input
                      id="numero_economico"
                      placeholder="ECO-123"
                      value={formData.numero_economico}
                      onChange={(e) => setFormData({ ...formData, numero_economico: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="odometro">Odómetro (km)</Label>
                    <Input
                      id="odometro"
                      type="number"
                      placeholder="150000"
                      value={formData.odometro}
                      onChange={(e) => setFormData({ ...formData, odometro: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="inspeccion" className="space-y-4">
                <div className="p-4 bg-muted rounded-lg flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">Inspección CTPAT Obligatoria</p>
                    <p className="text-muted-foreground mt-1">
                      Verifique cada uno de los 17 puntos de seguridad antes de aprobar el ingreso/salida de la unidad.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {ctpatPoints.map((point, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <Checkbox
                        id={`point-${index}`}
                        checked={checkedPoints[index] || false}
                        onCheckedChange={(checked) =>
                          setCheckedPoints((prev) => ({ ...prev, [index]: checked === true }))
                        }
                      />
                      <label
                        htmlFor={`point-${index}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {point}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between p-4 bg-accent/10 rounded-lg border border-accent/20">
                  <span className="text-sm font-medium text-foreground">Puntos completados:</span>
                  <Badge variant={Object.values(checkedPoints).filter(Boolean).length === ctpatPoints.length ? "default" : "secondary"}>
                    {Object.values(checkedPoints).filter(Boolean).length} / {ctpatPoints.length}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="adicional" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fotografías de la Unidad</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Foto 1 - Vista Frontal</p>
                      </div>
                      <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                        <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Foto 2 - Vista Lateral</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                    <Checkbox
                      id="mantenimiento"
                      checked={formData.requiere_mantenimiento}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, requiere_mantenimiento: checked as boolean })
                      }
                    />
                    <label htmlFor="mantenimiento" className="text-sm font-medium leading-none cursor-pointer">
                      Unidad requiere mantenimiento
                    </label>
                  </div>

                  <div className="flex items-center space-x-3 p-3 rounded-lg border border-border">
                    <Checkbox
                      id="incidente"
                      checked={formData.incidente}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, incidente: checked as boolean })
                      }
                    />
                    <label htmlFor="incidente" className="text-sm font-medium leading-none cursor-pointer">
                      Reportar accidente/siniestro/golpe
                    </label>
                  </div>

                  {formData.incidente && (
                    <div className="space-y-2">
                      <Label htmlFor="descripcion_incidente">Descripción del Incidente</Label>
                      <Textarea
                        id="descripcion_incidente"
                        placeholder="Ingrese los detalles del incidente..."
                        rows={4}
                        value={formData.descripcion_incidente}
                        onChange={(e) =>
                          setFormData({ ...formData, descripcion_incidente: e.target.value })
                        }
                        required={formData.incidente}
                      />
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => {
                setFormData({
                  numero_unidad: "",
                  operador: "",
                  tipo_unidad: "tracto",
                  numero_economico: "",
                  odometro: "",
                  requiere_mantenimiento: false,
                  incidente: false,
                  descripcion_incidente: "",
                });
                setCheckedPoints({});
              }}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting}>
                {submitting ? "Registrando..." : `Registrar ${entryType === "entrada" ? "Entrada" : "Salida"}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
