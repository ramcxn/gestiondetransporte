import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plane, Users, CalendarCheck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays, isAfter, isBefore, isWithinInterval } from "date-fns";
import { es } from "date-fns/locale";

interface Vacacion {
  id: string;
  tipo_empleado: "personal" | "operador";
  empleado_id: string;
  empleado_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  dias_totales: number;
  estado: "programado" | "en_curso" | "completado" | "cancelado";
  motivo: string | null;
  observaciones: string | null;
  created_at: string;
}

interface EmpleadoOption {
  id: string;
  nombre: string;
}

export default function Vacaciones() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [personalList, setPersonalList] = useState<EmpleadoOption[]>([]);
  const [operadoresList, setOperadoresList] = useState<EmpleadoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    tipo_empleado: "personal" as "personal" | "operador",
    empleado_id: "",
    fecha_inicio: "",
    fecha_fin: "",
    motivo: "",
    observaciones: "",
  });

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('vacaciones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vacaciones'
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [vacacionesRes, personalRes, operadoresRes] = await Promise.all([
        supabase.from("vacaciones").select("*").order("fecha_inicio", { ascending: false }),
        supabase.from("personal").select("id, nombre").eq("estado", "activo"),
        supabase.from("operadores").select("id, nombre").eq("estado", "activo"),
      ]);

      if (vacacionesRes.error) throw vacacionesRes.error;
      if (personalRes.error) throw personalRes.error;
      if (operadoresRes.error) throw operadoresRes.error;

      setVacaciones((vacacionesRes.data || []) as Vacacion[]);
      setPersonalList(personalRes.data || []);
      setOperadoresList(operadoresRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fechaInicio = new Date(formData.fecha_inicio);
    const fechaFin = new Date(formData.fecha_fin);
    
    if (isAfter(fechaInicio, fechaFin)) {
      toast({
        title: "Error",
        description: "La fecha de inicio debe ser anterior a la fecha de fin",
        variant: "destructive",
      });
      return;
    }

    const diasTotales = differenceInDays(fechaFin, fechaInicio) + 1;

    setSubmitting(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile?.client_id) throw new Error("No client_id found");

      const empleadoList = formData.tipo_empleado === "personal" ? personalList : operadoresList;
      const empleado = empleadoList.find(e => e.id === formData.empleado_id);

      if (!empleado) throw new Error("Empleado no encontrado");

      const { error } = await supabase
        .from("vacaciones")
        .insert({
          tipo_empleado: formData.tipo_empleado,
          empleado_id: formData.empleado_id,
          empleado_nombre: empleado.nombre,
          fecha_inicio: formData.fecha_inicio,
          fecha_fin: formData.fecha_fin,
          dias_totales: diasTotales,
          motivo: formData.motivo || null,
          observaciones: formData.observaciones || null,
          client_id: profile.client_id,
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Vacaciones programadas exitosamente",
      });

      setFormData({
        tipo_empleado: "personal",
        empleado_id: "",
        fecha_inicio: "",
        fecha_fin: "",
        motivo: "",
        observaciones: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting vacaciones:", error);
      toast({
        title: "Error",
        description: "No se pudo programar las vacaciones",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case "programado": return "default";
      case "en_curso": return "secondary";
      case "completado": return "outline";
      case "cancelado": return "destructive";
      default: return "default";
    }
  };

  const updateEstado = async (vacacionId: string, nuevoEstado: string) => {
    try {
      const { error } = await supabase
        .from("vacaciones")
        .update({ estado: nuevoEstado })
        .eq("id", vacacionId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Estado actualizado exitosamente",
      });
    } catch (error) {
      console.error("Error updating estado:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      });
    }
  };

  const programadas = vacaciones.filter(v => v.estado === "programado");
  const enCurso = vacaciones.filter(v => v.estado === "en_curso");
  const hoy = new Date();
  const proximasVacaciones = vacaciones.filter(v => {
    const inicio = new Date(v.fecha_inicio);
    return v.estado === "programado" && differenceInDays(inicio, hoy) <= 30 && differenceInDays(inicio, hoy) >= 0;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Plane className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Vacaciones</h1>
            <p className="text-muted-foreground">Personal y Operadores</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Calendar className="h-4 w-4 mr-2" />
              Programar Vacaciones
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Programar Vacaciones</DialogTitle>
              <DialogDescription>Complete la información del período vacacional</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_empleado">Tipo de Empleado</Label>
                <Select
                  value={formData.tipo_empleado}
                  onValueChange={(value: "personal" | "operador") => {
                    setFormData({ ...formData, tipo_empleado: value, empleado_id: "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="empleado_id">Empleado</Label>
                <Select
                  value={formData.empleado_id}
                  onValueChange={(value) => setFormData({ ...formData, empleado_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.tipo_empleado === "personal" ? personalList : operadoresList).map((empleado) => (
                      <SelectItem key={empleado.id} value={empleado.id}>
                        {empleado.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha de Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo</Label>
                <Input
                  id="motivo"
                  placeholder="Ej: Vacaciones anuales, personales"
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  placeholder="Notas adicionales"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                />
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
                  {submitting ? "Programando..." : "Programar Vacaciones"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{programadas.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Pendientes de iniciar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Curso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{enCurso.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Actualmente de vacaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximas (30 días)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{proximasVacaciones.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Inician pronto</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Calendario de Vacaciones</CardTitle>
          <CardDescription>Períodos vacacionales programados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : vacaciones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay vacaciones programadas
            </div>
          ) : (
            <div className="space-y-3">
              {vacaciones.map((vacacion) => (
                <div
                  key={vacacion.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{vacacion.empleado_nombre}</h4>
                        <Badge variant={getEstadoBadgeVariant(vacacion.estado)}>
                          {vacacion.estado.replace("_", " ")}
                        </Badge>
                        <Badge variant="outline">
                          {vacacion.tipo_empleado}
                        </Badge>
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {format(new Date(vacacion.fecha_inicio), "d 'de' MMMM 'de' yyyy", { locale: es })} -{" "}
                            {format(new Date(vacacion.fecha_fin), "d 'de' MMMM 'de' yyyy", { locale: es })}
                          </span>
                          <span className="ml-2 font-medium">({vacacion.dias_totales} días)</span>
                        </div>
                        {vacacion.motivo && (
                          <div className="flex items-center gap-2">
                            <CalendarCheck className="h-4 w-4" />
                            <span>Motivo: {vacacion.motivo}</span>
                          </div>
                        )}
                        {vacacion.observaciones && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">Observaciones:</span> {vacacion.observaciones}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {vacacion.estado === "programado" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateEstado(vacacion.id, "en_curso")}
                          >
                            Iniciar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateEstado(vacacion.id, "cancelado")}
                          >
                            Cancelar
                          </Button>
                        </>
                      )}
                      {vacacion.estado === "en_curso" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateEstado(vacacion.id, "completado")}
                        >
                          Completar
                        </Button>
                      )}
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
