import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, LogOut, Calendar, QrCode, Trash2, FileText, Plus, History } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import QRScanner from "@/components/QRScanner";
import AttendanceReportDialog from "@/components/AttendanceReportDialog";
import { differenceInMinutes } from "date-fns";

interface Personal {
  id: string;
  nombre: string;
  numero_empleado: string;
  puesto: string;
  departamento: string;
}

interface Attendance {
  id: string;
  personal_id: string;
  fecha_entrada: string;
  fecha_salida: string | null;
  estado: string;
  personal?: Personal;
  vale_usado?: {
    motivo: string;
    hora_salida_autorizada: string;
  };
}

interface ValeSalida {
  id: string;
  personal_id: string;
  fecha_vale: string;
  hora_salida_autorizada: string;
  motivo: string;
  autorizado_por: string;
  estado: string;
  observaciones: string | null;
  personal?: {
    id: string;
    nombre: string;
    numero_empleado: string;
  };
}

export default function PersonalAttendance() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [vales, setVales] = useState<ValeSalida[]>([]);
  const [valesHistorial, setValesHistorial] = useState<ValeSalida[]>([]);
  const [selectedPersonal, setSelectedPersonal] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showValeDialog, setShowValeDialog] = useState(false);
  const [valeForm, setValeForm] = useState({
    personal_id: "",
    hora_salida_autorizada: "",
    motivo: "",
    observaciones: "",
  });
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const isAdmin = userRole === 'admin';

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('attendance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'asistencia_personal'
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
      const { data: personalData, error: personalError } = await supabase
        .from("personal")
        .select("*")
        .eq("estado", "activo")
        .order("nombre", { ascending: true });

      if (personalError) throw personalError;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from("asistencia_personal")
        .select(`
          *,
          personal:personal_id (
            id,
            nombre,
            numero_empleado,
            puesto,
            departamento
          )
        `)
        .order("fecha_entrada", { ascending: false })
        .limit(50);

      if (attendanceError) throw attendanceError;

      // Obtener vales usados para correlacionar con asistencias
      const { data: valesUsadosData } = await supabase
        .from("vales_salida")
        .select("*")
        .eq("estado", "usado");

      // Correlacionar vales con asistencias
      const attendanceWithVales = (attendanceData || []).map(attendance => {
        if (attendance.fecha_salida) {
          const fechaSalida = new Date(attendance.fecha_salida).toISOString().split('T')[0];
          const valeUsado = (valesUsadosData || []).find(
            vale => vale.personal_id === attendance.personal_id && 
                   vale.fecha_vale === fechaSalida &&
                   vale.estado === 'usado'
          );
          
          if (valeUsado) {
            return {
              ...attendance,
              vale_usado: {
                motivo: valeUsado.motivo,
                hora_salida_autorizada: valeUsado.hora_salida_autorizada
              }
            };
          }
        }
        return attendance;
      });

      const { data: valesData, error: valesError } = await supabase
        .from("vales_salida")
        .select(`
          *,
          personal:personal_id (
            id,
            nombre,
            numero_empleado
          )
        `)
        .eq("fecha_vale", new Date().toISOString().split('T')[0])
        .in("estado", ["activo", "usado"])
        .order("created_at", { ascending: false });

      if (valesError) throw valesError;

      // Obtener historial completo de vales para administradores
      const { data: valesHistorialData, error: valesHistorialError } = await supabase
        .from("vales_salida")
        .select(`
          *,
          personal:personal_id (
            id,
            nombre,
            numero_empleado
          )
        `)
        .order("created_at", { ascending: false })
        .limit(100);

      if (valesHistorialError) throw valesHistorialError;

      setPersonal(personalData || []);
      setAttendances(attendanceWithVales);
      setVales(valesData || []);
      setValesHistorial(valesHistorialData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEntry = async () => {
    if (!user || !selectedPersonal) return;

    setSubmitting(true);
    try {
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

      // Verificar si hay una entrada reciente (últimos 10 minutos)
      const { data: recentEntry, error: recentError } = await supabase
        .from("asistencia_personal")
        .select("fecha_entrada")
        .eq("personal_id", selectedPersonal)
        .order("fecha_entrada", { ascending: false })
        .limit(1);

      if (recentError) throw recentError;

      if (recentEntry && recentEntry.length > 0) {
        const lastEntryTime = new Date(recentEntry[0].fecha_entrada);
        const currentTime = new Date();
        const timeDiffMinutes = (currentTime.getTime() - lastEntryTime.getTime()) / (1000 * 60);

        if (timeDiffMinutes < 10) {
          const minutesRemaining = Math.ceil(10 - timeDiffMinutes);
          toast({
            title: "Entrada bloqueada",
            description: `Esta persona ya registró su entrada recientemente. Debe esperar ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''} más.`,
            variant: "destructive",
          });
          setSubmitting(false);
          return;
        }
      }

      const { error } = await supabase
        .from("asistencia_personal")
        .insert({
          personal_id: selectedPersonal,
          created_by: user.id,
          client_id: finalClientId,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Entrada registrada exitosamente",
      });

      setSelectedPersonal("");
      fetchData();
    } catch (error) {
      console.error("Error recording entry:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la entrada",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleExit = async (attendanceId: string, personalId: string) => {
    try {
      // Obtener la asistencia actual para verificar las horas trabajadas
      const attendance = attendances.find(a => a.id === attendanceId);
      if (!attendance) throw new Error("Asistencia no encontrada");

      const entryTime = new Date(attendance.fecha_entrada);
      const currentTime = new Date();
      const minutesWorked = differenceInMinutes(currentTime, entryTime);
      const hoursWorked = minutesWorked / 60;

      // Verificar si hay un vale activo
      const valeActivo = vales.find(v => v.personal_id === personalId && v.estado === 'activo');

      // Si no han pasado 8 horas y no hay vale, bloquear la salida
      if (hoursWorked < 8 && !valeActivo) {
        const hoursRemaining = (8 - hoursWorked).toFixed(1);
        toast({
          title: "Salida no autorizada",
          description: `Faltan ${hoursRemaining} horas para completar la jornada laboral de 8 horas. Se requiere un vale de salida para salir anticipadamente.`,
          variant: "destructive",
        });
        return;
      }

      // Registrar salida
      const { error } = await supabase
        .from("asistencia_personal")
        .update({
          fecha_salida: new Date().toISOString(),
          estado: 'salio'
        })
        .eq('id', attendanceId);

      if (error) throw error;

      // Marcar vale como usado si existe
      if (valeActivo) {
        await supabase
          .from("vales_salida")
          .update({ estado: 'usado' })
          .eq('id', valeActivo.id);
      }

      toast({
        title: "Éxito",
        description: valeActivo ? "Salida registrada con vale anticipado" : "Salida registrada exitosamente",
      });

      fetchData();
    } catch (error) {
      console.error("Error recording exit:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar la salida",
        variant: "destructive",
      });
    }
  };

  const handleCreateVale = async () => {
    if (!user || !valeForm.personal_id || !valeForm.hora_salida_autorizada || !valeForm.motivo) {
      toast({
        title: "Error",
        description: "Complete todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (!profile) throw new Error("No profile found");

      const { error } = await supabase
        .from("vales_salida")
        .insert({
          personal_id: valeForm.personal_id,
          hora_salida_autorizada: valeForm.hora_salida_autorizada,
          motivo: valeForm.motivo,
          observaciones: valeForm.observaciones || null,
          autorizado_por: user.id,
          created_by: user.id,
          client_id: profile.client_id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Vale de salida generado exitosamente",
      });

      setShowValeDialog(false);
      setValeForm({
        personal_id: "",
        hora_salida_autorizada: "",
        motivo: "",
        observaciones: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating vale:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el vale",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (attendanceId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este registro de asistencia?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("asistencia_personal")
        .delete()
        .eq('id', attendanceId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Registro de asistencia eliminado",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting attendance:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el registro",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVale = async (valeId: string) => {
    if (!confirm("¿Está seguro de que desea eliminar este vale de salida?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("vales_salida")
        .delete()
        .eq('id', valeId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Vale de salida eliminado",
      });

      fetchData();
    } catch (error) {
      console.error("Error deleting vale:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el vale",
        variant: "destructive",
      });
    }
  };

  const handleQRScan = async (qrData: string) => {
    setShowQRScanner(false);
    
    if (!user) return;
    
    try {
      // Buscar en personal por qr_code
      const { data: personalData, error: personalError } = await supabase
        .from("personal")
        .select("*")
        .eq("qr_code", qrData)
        .eq("estado", "activo")
        .single();

      if (personalError && personalError.code !== 'PGRST116') {
        throw personalError;
      }

      if (!personalData) {
        toast({
          title: "No encontrado",
          description: "No se encontró personal con este código QR",
          variant: "destructive",
        });
        return;
      }

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

      // Verificar si hay una entrada reciente (últimos 10 minutos)
      const { data: recentEntry, error: recentError } = await supabase
        .from("asistencia_personal")
        .select("fecha_entrada")
        .eq("personal_id", personalData.id)
        .order("fecha_entrada", { ascending: false })
        .limit(1);

      if (recentError) throw recentError;

      if (recentEntry && recentEntry.length > 0) {
        const lastEntryTime = new Date(recentEntry[0].fecha_entrada);
        const currentTime = new Date();
        const timeDiffMinutes = (currentTime.getTime() - lastEntryTime.getTime()) / (1000 * 60);

        if (timeDiffMinutes < 10) {
          const minutesRemaining = Math.ceil(10 - timeDiffMinutes);
          toast({
            title: "Entrada bloqueada",
            description: `Esta persona ya registró su entrada recientemente. Debe esperar ${minutesRemaining} minuto${minutesRemaining !== 1 ? 's' : ''} más.`,
            variant: "destructive",
          });
          return;
        }
      }

      // Registrar entrada
      const { error } = await supabase
        .from("asistencia_personal")
        .insert({
          personal_id: personalData.id,
          created_by: user.id,
          client_id: finalClientId,
        });

      if (error) throw error;

      toast({
        title: "Entrada registrada",
        description: `${personalData.nombre} - ${personalData.numero_empleado}`,
      });

      fetchData();
    } catch (error) {
      console.error("Error scanning QR:", error);
      toast({
        title: "Error",
        description: "Error al procesar el código QR",
        variant: "destructive",
      });
    }
  };

  const today = new Date().toDateString();
  const todayAttendances = attendances.filter(a => new Date(a.fecha_entrada).toDateString() === today);
  const presentNow = todayAttendances.filter(a => a.estado === "presente");
  const onTimeToday = todayAttendances.filter(a => {
    const entryTime = new Date(a.fecha_entrada);
    return entryTime.getHours() < 9; // Consideramos llegada antes de 9am como "a tiempo"
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Clock className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Control de Asistencia</h1>
            <p className="text-muted-foreground">Registro de entrada y salida del personal</p>
          </div>
        </div>
        <AttendanceReportDialog isAdmin={isAdmin} />
      </div>

      {isAdmin && (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Asistencias Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-foreground">{todayAttendances.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Registros del día</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Presentes Ahora</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">{presentNow.length}</div>
              <p className="text-xs text-muted-foreground mt-1">En instalaciones</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Llegadas a Tiempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{onTimeToday.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Antes de 9:00 AM</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Vales Activos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {vales.filter(v => v.estado === 'activo').length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hoy</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Registrar Entrada</CardTitle>
              <CardDescription>Seleccione el personal para registrar su entrada</CardDescription>
            </div>
            {isAdmin && (
              <Dialog open={showValeDialog} onOpenChange={setShowValeDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full sm:w-auto">
                    <FileText className="h-4 w-4 mr-2" />
                    Generar Vale
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generar Vale de Salida</DialogTitle>
                    <DialogDescription>
                      Autorizar salida anticipada del personal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Personal *</Label>
                      <Select
                        value={valeForm.personal_id}
                        onValueChange={(value) => setValeForm({ ...valeForm, personal_id: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar personal" />
                        </SelectTrigger>
                        <SelectContent>
                          {personal.map((p) => (
                            <SelectItem key={p.id} value={p.id}>
                              {p.nombre} - {p.numero_empleado}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora de Salida Autorizada *</Label>
                      <Input
                        type="time"
                        value={valeForm.hora_salida_autorizada}
                        onChange={(e) => setValeForm({ ...valeForm, hora_salida_autorizada: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Motivo *</Label>
                      <Textarea
                        value={valeForm.motivo}
                        onChange={(e) => setValeForm({ ...valeForm, motivo: e.target.value })}
                        placeholder="Describe el motivo de la salida anticipada"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Observaciones</Label>
                      <Textarea
                        value={valeForm.observaciones}
                        onChange={(e) => setValeForm({ ...valeForm, observaciones: e.target.value })}
                        placeholder="Observaciones adicionales (opcional)"
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleCreateVale}
                        className="flex-1"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Generar Vale
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowValeDialog(false)}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">
                Presione el botón para escanear el código QR del personal
              </p>
              <Button
                onClick={() => setShowQRScanner(true)}
                className="w-full gap-2"
                size="lg"
              >
                <QrCode className="h-5 w-5" />
                Escanear QR para Registrar Entrada
              </Button>
            </div>
            
            {selectedPersonal && (
              <div className="p-4 bg-accent/50 rounded-lg border border-accent">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Personal identificado:</p>
                    <p className="font-semibold text-foreground">
                      {personal.find(p => p.id === selectedPersonal)?.nombre}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {personal.find(p => p.id === selectedPersonal)?.numero_empleado} - {personal.find(p => p.id === selectedPersonal)?.departamento}
                    </p>
                  </div>
                  <Button
                    onClick={handleEntry}
                    disabled={submitting}
                  >
                    {submitting ? "Registrando..." : "Confirmar Entrada"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Personal Presente</CardTitle>
          <CardDescription>Personal actualmente en las instalaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : presentNow.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay personal presente actualmente
            </div>
          ) : (
            <div className="space-y-3">
              {presentNow.map((attendance) => {
                const valeActivo = vales.find(v => v.personal_id === attendance.personal_id && v.estado === 'activo');
                return (
                  <div
                    key={attendance.id}
                    className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="flex flex-col gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <h4 className="font-semibold text-foreground">
                            {attendance.personal?.nombre}
                          </h4>
                          <Badge variant="default">Presente</Badge>
                          {valeActivo && (
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                              <FileText className="h-3 w-3 mr-1" />
                              Vale hasta {valeActivo.hora_salida_autorizada}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            {attendance.personal?.departamento}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            • {attendance.personal?.numero_empleado}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Entrada: {new Date(attendance.fecha_entrada).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          <span className="hidden sm:inline">•</span>
                          <span>Puesto: {attendance.personal?.puesto}</span>
                        </div>
                        {valeActivo && (
                          <div className="mt-2 p-2 bg-blue-500/5 rounded text-sm">
                            <p className="text-blue-600 dark:text-blue-400">
                              <strong>Motivo:</strong> {valeActivo.motivo}
                            </p>
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant={valeActivo ? "default" : "outline"}
                        onClick={() => handleExit(attendance.id, attendance.personal_id)}
                        className="w-full sm:w-auto"
                      >
                        <LogOut className="h-4 w-4 mr-1" />
                        {valeActivo ? "Salida con Vale" : "Registrar Salida"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Historial de Asistencias</CardTitle>
          <CardDescription>Registro completo de entradas y salidas</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : attendances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay registros de asistencia
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {attendances.map((attendance) => (
                <div
                  key={attendance.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">
                          {attendance.personal?.nombre}
                        </h4>
                        <Badge variant={attendance.estado === "presente" ? "default" : "outline"}>
                          {attendance.estado === "presente" ? "Presente" : "Salió"}
                        </Badge>
                        {attendance.vale_usado && (
                          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 dark:text-blue-400">
                            <FileText className="h-3 w-3 mr-1" />
                            Salida con Vale
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {attendance.personal?.departamento}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          • {attendance.personal?.numero_empleado}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(attendance.fecha_entrada).toLocaleDateString("es-MX")}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>
                              Entrada: {new Date(attendance.fecha_entrada).toLocaleTimeString("es-MX", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          {attendance.fecha_salida && (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span>
                                Salida: {new Date(attendance.fecha_salida).toLocaleTimeString("es-MX", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {attendance.vale_usado && (
                        <div className="mt-2 p-2 bg-blue-500/5 rounded text-sm">
                          <p className="text-blue-600 dark:text-blue-400">
                            <strong>Motivo de salida anticipada:</strong> {attendance.vale_usado.motivo}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400 text-xs mt-1">
                            Hora autorizada: {attendance.vale_usado.hora_salida_autorizada}
                          </p>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(attendance.id)}
                        className="w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Eliminar
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Historial de Vales de Salida</CardTitle>
                <CardDescription>Registro de salidas anticipadas autorizadas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : valesHistorial.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay vales de salida registrados
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {valesHistorial.map((vale) => (
                  <div
                    key={vale.id}
                    className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h4 className="font-semibold text-foreground">
                              {vale.personal?.nombre}
                            </h4>
                            <Badge 
                              variant={
                                vale.estado === 'activo' ? 'default' : 
                                vale.estado === 'usado' ? 'secondary' : 
                                'outline'
                              }
                            >
                              {vale.estado === 'activo' ? 'Activo' : 
                               vale.estado === 'usado' ? 'Usado' : 
                               'Cancelado'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              • {vale.personal?.numero_empleado}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                Fecha: {new Date(vale.fecha_vale).toLocaleDateString("es-MX")}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                Hora autorizada: {vale.hora_salida_autorizada}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteVale(vale.id)}
                          className="flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </Button>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <p className="text-sm">
                          <strong className="text-foreground">Motivo:</strong>
                          <span className="text-muted-foreground ml-2">{vale.motivo}</span>
                        </p>
                        {vale.observaciones && (
                          <p className="text-sm mt-2">
                            <strong className="text-foreground">Observaciones:</strong>
                            <span className="text-muted-foreground ml-2">{vale.observaciones}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
