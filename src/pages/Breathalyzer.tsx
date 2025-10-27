import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Wine, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface BreathalyzerTest {
  id: string;
  nombre: string;
  tipo_persona: string;
  resultado: string;
  nivel: number | null;
  observaciones: string | null;
  created_at: string;
  created_by: string;
  creator_name?: string;
}

export default function Breathalyzer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tests, setTests] = useState<BreathalyzerTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    nombre: "",
    tipo_persona: "operator",
    nivel: "0.00",
    observaciones: "",
  });

  useEffect(() => {
    fetchTests();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('breathalyzer-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'pruebas_alcoholimetro'
        },
        () => {
          fetchTests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTests = async () => {
    try {
      const { data: testsData, error: testsError } = await supabase
        .from("pruebas_alcoholimetro")
        .select("*")
        .order("created_at", { ascending: false });

      if (testsError) throw testsError;

      // Fetch creator names
      const userIds = [...new Set(testsData?.map(t => t.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);
      
      const enrichedTests = testsData?.map(test => ({
        ...test,
        creator_name: profilesMap.get(test.created_by) || "Usuario"
      })) || [];

      setTests(enrichedTests);
    } catch (error) {
      console.error("Error fetching tests:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las pruebas",
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
      const nivel = parseFloat(formData.nivel);
      const resultado = nivel === 0 ? "Negativo" : nivel < 0.08 ? "Positivo Bajo" : "Positivo Alto";

      const { error } = await supabase
        .from("pruebas_alcoholimetro")
        .insert({
          nombre: formData.nombre,
          tipo_persona: formData.tipo_persona,
          nivel: nivel,
          resultado: resultado,
          observaciones: formData.observaciones || null,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Prueba de alcoholímetro registrada exitosamente",
      });

      setFormData({
        nombre: "",
        tipo_persona: "operator",
        nivel: "0.00",
        observaciones: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting test:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la prueba",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const todayTests = tests.filter(
    (t) => new Date(t.created_at).toDateString() === new Date().toDateString()
  );
  const passedTests = todayTests.filter((t) => t.resultado === "Negativo");
  const failedTests = todayTests.filter((t) => t.resultado !== "Negativo");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Wine className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pruebas de Alcoholímetro</h1>
            <p className="text-muted-foreground">Control de alcohol para personal que ingresa</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Wine className="h-4 w-4 mr-2" />
              Nueva Prueba
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Prueba de Alcoholímetro</DialogTitle>
              <DialogDescription>Complete la información de la prueba</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-type">Tipo de Personal</Label>
                  <Select
                    value={formData.tipo_persona}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_persona: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="visitor">Visitante</SelectItem>
                      <SelectItem value="provider">Proveedor</SelectItem>
                      <SelectItem value="staff">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person-name">Nombre Completo</Label>
                  <Input
                    id="person-name"
                    placeholder="Nombre de la persona"
                    value={formData.nombre}
                    onChange={(e) =>
                      setFormData({ ...formData, nombre: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="result">Resultado (g/dL)</Label>
                  <Input
                    id="result"
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    value={formData.nivel}
                    onChange={(e) =>
                      setFormData({ ...formData, nivel: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="observaciones">Observaciones</Label>
                  <Textarea
                    id="observaciones"
                    placeholder="Observaciones adicionales (opcional)"
                    value={formData.observaciones}
                    onChange={(e) =>
                      setFormData({ ...formData, observaciones: e.target.value })
                    }
                  />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Límite permitido:</strong> 0.00 g/dL para operadores. Cualquier resultado positivo 
                  debe ser documentado y seguir el protocolo de seguridad.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
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
                  {submitting ? "Registrando..." : "Registrar Prueba"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{todayTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{passedTests.length} aprobadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">{passedTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {todayTests.length > 0
                ? `${((passedTests.length / todayTests.length) * 100).toFixed(1)}% de cumplimiento`
                : "Sin datos"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{failedTests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {failedTests.length > 0 ? "Protocolo aplicado" : "Ninguna"}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Registradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{tests.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Todas las pruebas</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de Pruebas</CardTitle>
          <CardDescription>Registro completo de pruebas de alcoholímetro</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : tests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay pruebas registradas
            </div>
          ) : (
            <div className="space-y-3">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{test.nombre}</h4>
                        {test.resultado === "Negativo" && (
                          <Badge className="bg-accent text-accent-foreground">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprobado
                          </Badge>
                        )}
                        {test.resultado !== "Negativo" && (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            {test.resultado}
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground capitalize">
                          • {test.tipo_persona}
                        </span>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>
                            {new Date(test.created_at).toLocaleDateString("es-MX")} •{" "}
                            {new Date(test.created_at).toLocaleTimeString("es-MX", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wine className="h-4 w-4" />
                          <span>Resultado: {test.nivel !== null ? test.nivel.toFixed(3) : '0.000'} g/dL</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>Aplicado por: {test.creator_name}</span>
                        </div>
                        {test.observaciones && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            <strong>Observaciones:</strong> {test.observaciones}
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
    </div>
  );
}
