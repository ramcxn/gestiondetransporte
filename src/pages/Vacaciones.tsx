import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Plane, CheckCircle, XCircle, AlertCircle, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, differenceInDays, isAfter } from "date-fns";
import { es } from "date-fns/locale";
import { obtenerInfoVacaciones, validarDiasVacaciones } from "@/lib/vacacionesUtils";

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
  requiere_aprobacion: boolean;
  dias_disponibles_antes: number | null;
  excede_dias_disponibles: boolean;
  aprobado_por: string | null;
  fecha_aprobacion: string | null;
  created_at: string;
}

interface EmpleadoOption {
  id: string;
  nombre: string;
  fecha_alta: string;
  dias_vacaciones_disponibles: number;
  dias_vacaciones_tomados: number;
}

export default function Vacaciones() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [vacacionToApprove, setVacacionToApprove] = useState<Vacacion | null>(null);
  const [vacaciones, setVacaciones] = useState<Vacacion[]>([]);
  const [personalList, setPersonalList] = useState<EmpleadoOption[]>([]);
  const [operadoresList, setOperadoresList] = useState<EmpleadoOption[]>([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState<EmpleadoOption | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user, userRole } = useAuth();
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
        supabase.from("personal").select("id, nombre, fecha_alta, dias_vacaciones_disponibles, dias_vacaciones_tomados").eq("estado", "activo"),
        supabase.from("operadores").select("id, nombre, fecha_alta, dias_vacaciones_disponibles, dias_vacaciones_tomados").eq("estado", "activo"),
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

  const handleEmpleadoChange = (empleadoId: string) => {
    const empleadoList = formData.tipo_empleado === "personal" ? personalList : operadoresList;
    const empleado = empleadoList.find(e => e.id === empleadoId);
    setSelectedEmpleado(empleado || null);
    setFormData({ ...formData, empleado_id: empleadoId });
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

    if (!selectedEmpleado) {
      toast({
        title: "Error",
        description: "Debe seleccionar un empleado",
        variant: "destructive",
      });
      return;
    }

    // Get current vacation info
    const infoVacaciones = obtenerInfoVacaciones(
      selectedEmpleado.fecha_alta,
      selectedEmpleado.dias_vacaciones_tomados
    );

    // Validate vacation days
    const validacion = validarDiasVacaciones(diasTotales, infoVacaciones.diasDisponibles);
    const excedeDias = !validacion.valido;

    // Only admins can approve vacation requests that exceed available days
    if (excedeDias && userRole !== "admin") {
      toast({
        title: "Días insuficientes",
        description: `${validacion.mensaje}. Solo un administrador puede aprobar esta solicitud.`,
        variant: "destructive",
      });
      return;
    }

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

      const vacacionData: any = {
        tipo_empleado: formData.tipo_empleado,
        empleado_id: formData.empleado_id,
        empleado_nombre: empleado.nombre,
        fecha_inicio: formData.fecha_inicio,
        fecha_fin: formData.fecha_fin,
        dias_totales: diasTotales,
        motivo: formData.motivo || null,
        observaciones: formData.observaciones || null,
        dias_disponibles_antes: infoVacaciones.diasDisponibles,
        excede_dias_disponibles: excedeDias,
        requiere_aprobacion: excedeDias,
        client_id: profile.client_id,
        created_by: user.id,
      };

      // If admin and exceeds days, auto-approve
      if (userRole === "admin" && excedeDias) {
        vacacionData.aprobado_por = user.id;
        vacacionData.fecha_aprobacion = new Date().toISOString();
      }

      const { error } = await supabase
        .from("vacaciones")
        .insert(vacacionData);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: excedeDias && userRole === "admin"
          ? "Vacaciones programadas y aprobadas (excede días disponibles)"
          : "Vacaciones programadas exitosamente",
      });

      setFormData({
        tipo_empleado: "personal",
        empleado_id: "",
        fecha_inicio: "",
        fecha_fin: "",
        motivo: "",
        observaciones: "",
      });
      setSelectedEmpleado(null);
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

  const handleApproval = async (approve: boolean) => {
    if (!vacacionToApprove || !user) return;

    try {
      const updateData: any = {
        requiere_aprobacion: false,
        aprobado_por: user.id,
        fecha_aprobacion: new Date().toISOString(),
      };

      if (!approve) {
        updateData.estado = "cancelado";
      }

      const { error } = await supabase
        .from("vacaciones")
        .update(updateData)
        .eq("id", vacacionToApprove.id);

      if (error) throw error;

      toast({
        title: approve ? "Aprobado" : "Rechazado",
        description: approve
          ? "Vacaciones aprobadas exitosamente"
          : "Solicitud de vacaciones rechazada",
      });

      setApprovalDialogOpen(false);
      setVacacionToApprove(null);
    } catch (error) {
      console.error("Error updating approval:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la aprobación",
        variant: "destructive",
      });
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

  const eliminarVacacion = async (vacacionId: string) => {
    try {
      const { error } = await supabase
        .from("vacaciones")
        .delete()
        .eq("id", vacacionId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Vacación eliminada exitosamente",
      });
    } catch (error) {
      console.error("Error deleting vacation:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la vacación",
        variant: "destructive",
      });
    }
  };

  const programadas = vacaciones.filter(v => v.estado === "programado");
  const enCurso = vacaciones.filter(v => v.estado === "en_curso");
  const pendientesAprobacion = vacaciones.filter(v => v.requiere_aprobacion && v.estado !== "cancelado");
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
            <p className="text-muted-foreground">Personal y Operadores - Conforme a Ley Mexicana</p>
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
                    setSelectedEmpleado(null);
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
                  onValueChange={handleEmpleadoChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un empleado" />
                  </SelectTrigger>
                  <SelectContent>
                    {(formData.tipo_empleado === "personal" ? personalList : operadoresList).map((empleado) => (
                      <SelectItem key={empleado.id} value={empleado.id}>
                        {empleado.nombre} - {empleado.dias_vacaciones_disponibles} días disponibles
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedEmpleado && (
                <div className="p-3 bg-muted rounded-lg space-y-1 text-sm">
                  <p className="font-medium text-foreground">Información de Vacaciones:</p>
                  <p>Días disponibles: <span className="font-semibold">{selectedEmpleado.dias_vacaciones_disponibles}</span></p>
                  <p>Días tomados: <span className="font-semibold">{selectedEmpleado.dias_vacaciones_tomados}</span></p>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Los días de vacaciones se calculan conforme a la Ley Federal del Trabajo de México
                  </p>
                </div>
              )}

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

              {formData.fecha_inicio && formData.fecha_fin && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
                  <p className="font-medium text-blue-900 dark:text-blue-100">
                    Días solicitados: {differenceInDays(new Date(formData.fecha_fin), new Date(formData.fecha_inicio)) + 1}
                  </p>
                  {selectedEmpleado && differenceInDays(new Date(formData.fecha_fin), new Date(formData.fecha_inicio)) + 1 > selectedEmpleado.dias_vacaciones_disponibles && (
                    <p className="text-amber-700 dark:text-amber-300 mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Excede los días disponibles - Requiere aprobación de administrador
                    </p>
                  )}
                </div>
              )}

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

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Programadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{programadas.length}</div>
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

        {userRole === "admin" && (
          <Card className="shadow-card border-amber-200 dark:border-amber-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Pendientes Aprobación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700 dark:text-amber-400">{pendientesAprobacion.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Requieren autorización</p>
            </CardContent>
          </Card>
        )}
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
                  className={`p-4 rounded-lg border transition-shadow ${
                    vacacion.requiere_aprobacion && vacacion.estado !== "cancelado"
                      ? "border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
                      : "border-border hover:shadow-card"
                  }`}
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
                        {vacacion.excede_dias_disponibles && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Excede días disponibles
                          </Badge>
                        )}
                        {vacacion.requiere_aprobacion && vacacion.estado !== "cancelado" && (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Requiere aprobación
                          </Badge>
                        )}
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
                        {vacacion.dias_disponibles_antes !== null && (
                          <div className="text-xs">
                            Días disponibles antes de solicitud: <span className="font-medium">{vacacion.dias_disponibles_antes}</span>
                          </div>
                        )}
                        {vacacion.motivo && (
                          <div className="flex items-center gap-2">
                            <span>Motivo: {vacacion.motivo}</span>
                          </div>
                        )}
                        {vacacion.observaciones && (
                          <div className="text-xs mt-1">
                            <span className="font-medium">Observaciones:</span> {vacacion.observaciones}
                          </div>
                        )}
                        {vacacion.aprobado_por && vacacion.fecha_aprobacion && (
                          <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Aprobado el {format(new Date(vacacion.fecha_aprobacion), "d/MM/yyyy HH:mm")}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {vacacion.requiere_aprobacion && vacacion.estado !== "cancelado" && userRole === "admin" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setVacacionToApprove(vacacion);
                              setApprovalDialogOpen(true);
                            }}
                            className="text-green-600 hover:text-green-700 border-green-300"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateEstado(vacacion.id, "cancelado")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                      {vacacion.estado === "programado" && !vacacion.requiere_aprobacion && (
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
                      {userRole === "admin" && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Eliminar
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar vacación?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el registro de vacaciones de {vacacion.empleado_nombre}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => eliminarVacacion(vacacion.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprobar Solicitud de Vacaciones</AlertDialogTitle>
            <AlertDialogDescription>
              {vacacionToApprove && (
                <div className="space-y-2 mt-2">
                  <p><strong>Empleado:</strong> {vacacionToApprove.empleado_nombre}</p>
                  <p><strong>Período:</strong> {format(new Date(vacacionToApprove.fecha_inicio), "d/MM/yyyy")} - {format(new Date(vacacionToApprove.fecha_fin), "d/MM/yyyy")}</p>
                  <p><strong>Días solicitados:</strong> {vacacionToApprove.dias_totales}</p>
                  <p><strong>Días disponibles antes:</strong> {vacacionToApprove.dias_disponibles_antes}</p>
                  {vacacionToApprove.excede_dias_disponibles && (
                    <p className="text-amber-600 dark:text-amber-400 font-medium">
                      ⚠️ Esta solicitud excede los días disponibles
                    </p>
                  )}
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button variant="destructive" onClick={() => handleApproval(false)}>
              <XCircle className="h-4 w-4 mr-1" />
              Rechazar
            </Button>
            <AlertDialogAction onClick={() => handleApproval(true)} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-1" />
              Aprobar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
