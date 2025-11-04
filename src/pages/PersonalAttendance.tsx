import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Clock, Users, LogOut, Calendar, QrCode, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import QRScanner from "@/components/QRScanner";

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
}

export default function PersonalAttendance() {
  const [personal, setPersonal] = useState<Personal[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [selectedPersonal, setSelectedPersonal] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
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

      setPersonal(personalData || []);
      setAttendances(attendanceData || []);
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
      // Get user's client_id from profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("client_id")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      const { error } = await supabase
        .from("asistencia_personal")
        .insert({
          personal_id: selectedPersonal,
          created_by: user.id,
          client_id: profile.client_id,
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

  const handleExit = async (attendanceId: string) => {
    try {
      const { error } = await supabase
        .from("asistencia_personal")
        .update({
          fecha_salida: new Date().toISOString(),
          estado: 'salio'
        })
        .eq('id', attendanceId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Salida registrada exitosamente",
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

  const handleQRScan = async (qrData: string) => {
    setShowQRScanner(false);
    
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

      if (personalData) {
        setSelectedPersonal(personalData.id);
        toast({
          title: "Personal identificado",
          description: `${personalData.nombre} - ${personalData.numero_empleado}`,
        });
        return;
      }

      toast({
        title: "No encontrado",
        description: "No se encontró personal con este código QR",
        variant: "destructive",
      });
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
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Clock className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Control de Asistencia</h1>
          <p className="text-muted-foreground">Registro de entrada y salida del personal</p>
        </div>
      </div>

      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Asistencias Hoy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{todayAttendances.length}</div>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">Puntualidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-accent">
                {todayAttendances.length > 0 ? Math.round((onTimeToday.length / todayAttendances.length) * 100) : 0}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">Hoy</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registrar Entrada</CardTitle>
          <CardDescription>Seleccione el personal para registrar su entrada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowQRScanner(true)}
                className="flex items-center gap-2"
              >
                <QrCode className="h-4 w-4" />
                Escanear QR
              </Button>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label>Personal</Label>
                <Select value={selectedPersonal} onValueChange={setSelectedPersonal}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar personal" />
                  </SelectTrigger>
                  <SelectContent>
                    {personal.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nombre} - {p.numero_empleado} ({p.departamento})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleEntry}
                disabled={!selectedPersonal || submitting}
                className="mt-8"
              >
                {submitting ? "Registrando..." : "Registrar Entrada"}
              </Button>
            </div>
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
              {presentNow.map((attendance) => (
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
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleExit(attendance.id)}
                      className="w-full sm:w-auto"
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      Registrar Salida
                    </Button>
                  </div>
                </div>
              ))}
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

      {showQRScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
}
