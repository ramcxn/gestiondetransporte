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
import { Truck, AlertCircle, Clock, User, CheckCircle, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import QRScanner from "@/components/QRScanner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Capacitor } from "@capacitor/core";

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
  tracto?: {
    numero_economico: string;
    marca: string;
    modelo: string;
    placas: string;
  } | null;
  dolly?: {
    numero_economico: string;
    marca: string;
    modelo: string;
    placas: string;
  } | null;
  remolque_1?: {
    numero_economico: string;
    marca: string;
    modelo: string;
    placas: string;
  } | null;
  remolque_2?: {
    numero_economico: string;
    marca: string;
    modelo: string;
    placas: string;
  } | null;
  operador_data?: {
    nombre: string;
    numero_empleado: string;
  } | null;
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
    operador_id: "",
    tipo_unidad: "tracto",
    numero_economico: "",
    tracto_id: "",
    dolly_id: "",
    remolque_1_id: "",
    remolque_2_id: "",
    odometro: "",
    requiere_mantenimiento: false,
    incidente: false,
    descripcion_incidente: "",
  });

  const [equipos, setEquipos] = useState<any[]>([]);
  const [operadores, setOperadores] = useState<any[]>([]);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanningFor, setScanningFor] = useState<"equipo" | "operador">("equipo");
  const [tractoSearchQuery, setTractoSearchQuery] = useState("");
  
  useEffect(() => {
    fetchEquipos();
    fetchOperadores();
  }, []);

  const fetchEquipos = async () => {
    const { data } = await supabase
      .from("inventario_equipos")
      .select("*")
      .order("numero_economico");
    
    if (data) setEquipos(data);
  };

  const handleTractoSearch = async (numeroEconomico: string) => {
    setTractoSearchQuery(numeroEconomico);
    
    if (numeroEconomico.length < 2) return;

    // Buscar tracto por número económico
    const equipo = equipos.find(
      e => e.tipo_equipo?.toLowerCase() === 'tracto' && 
      e.numero_economico.toLowerCase().includes(numeroEconomico.toLowerCase())
    );

    if (equipo) {
      // Autocompletar información del tracto
      setFormData({ 
        ...formData, 
        tracto_id: equipo.id,
        numero_economico: equipo.numero_economico,
        numero_unidad: equipo.numero_economico
      });
      
      toast({
        title: "Tracto encontrado",
        description: `${equipo.numero_economico} - ${equipo.marca} ${equipo.modelo}`,
      });
    }
  };

  const handleQRScan = async (qrData: string) => {
    try {
      // Check if scanning equipment or operator
      if (qrData.startsWith('EQUIPO-')) {
        // Extract equipment ID from QR code (format: EQUIPO-{id})
        const equipmentId = qrData.replace('EQUIPO-', '');
        
        // Fetch equipment data
        const { data: equipo, error } = await supabase
          .from("inventario_equipos")
          .select("*")
          .eq("id", equipmentId)
          .single();

        if (error || !equipo) {
          toast({
            title: "Error",
            description: "No se encontró el equipo con este código QR",
            variant: "destructive",
          });
          return;
        }

        // Auto-fill form based on equipment type
        if (equipo.tipo_equipo?.toLowerCase() === 'tracto') {
          setFormData({
            ...formData,
            tracto_id: equipo.id,
            numero_economico: equipo.numero_economico,
            numero_unidad: equipo.numero_economico
          });
        } else if (equipo.tipo_equipo?.toLowerCase() === 'dolly') {
          setFormData({
            ...formData,
            dolly_id: equipo.id
          });
        } else if (equipo.tipo_equipo?.toLowerCase() === 'remolque') {
          if (!formData.remolque_1_id) {
            setFormData({
              ...formData,
              remolque_1_id: equipo.id
            });
          } else {
            setFormData({
              ...formData,
              remolque_2_id: equipo.id
            });
          }
        }

        toast({
          title: "Éxito",
          description: `Equipo ${equipo.numero_economico} escaneado correctamente`,
        });
      } else if (qrData.startsWith('OPERADOR-')) {
        // Extract operator ID from QR code (format: OPERADOR-{id})
        const operatorId = qrData.replace('OPERADOR-', '');
        
        // Fetch operator data
        const { data: operador, error } = await supabase
          .from("operadores")
          .select("*")
          .eq("id", operatorId)
          .single();

        if (error || !operador) {
          toast({
            title: "Error",
            description: "No se encontró el operador con este código QR",
            variant: "destructive",
          });
          return;
        }

        // Auto-fill operator data
        setFormData({
          ...formData,
          operador_id: operador.id,
          operador: operador.nombre
        });

        toast({
          title: "Éxito",
          description: `Operador ${operador.nombre} escaneado correctamente`,
        });
      } else {
        toast({
          title: "Error",
          description: "Código QR no reconocido",
          variant: "destructive",
        });
        return;
      }

      setShowQRScanner(false);
    } catch (error) {
      console.error("Error processing QR:", error);
      toast({
        title: "Error",
        description: "Error al procesar el código QR",
        variant: "destructive",
      });
    }
  };

  const fetchOperadores = async () => {
    const { data } = await supabase
      .from("operadores")
      .select("*")
      .eq("estado", "activo")
      .order("nombre");
    
    if (data) setOperadores(data);
  };

  const [selectedImage1, setSelectedImage1] = useState<File | null>(null);
  const [selectedImage2, setSelectedImage2] = useState<File | null>(null);
  const [imagePreview1, setImagePreview1] = useState<string | null>(null);
  const [imagePreview2, setImagePreview2] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

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
        .select(`
          *,
          tracto:inventario_equipos!tracto_id(numero_economico, marca, modelo, placas),
          dolly:inventario_equipos!dolly_id(numero_economico, marca, modelo, placas),
          remolque_1:inventario_equipos!remolque_1_id(numero_economico, marca, modelo, placas),
          remolque_2:inventario_equipos!remolque_2_id(numero_economico, marca, modelo, placas),
          operador_data:operadores!operador_id(nombre, numero_empleado)
        `)
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

  const handleImageChange = (imageNumber: 1 | 2) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imageNumber === 1) {
        setSelectedImage1(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview1(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        setSelectedImage2(file);
        const reader = new FileReader();
        reader.onloadend = () => setImagePreview2(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const uploadImages = async (): Promise<{ foto1: string | null; foto2: string | null }> => {
    if (!user) return { foto1: null, foto2: null };

    setUploadingImages(true);
    try {
      let foto1Url = null;
      let foto2Url = null;

      if (selectedImage1) {
        const fileExt1 = selectedImage1.name.split('.').pop();
        const fileName1 = `${user.id}-${Date.now()}-1.${fileExt1}`;
        const { error: uploadError1 } = await supabase.storage
          .from('fotos-unidades')
          .upload(fileName1, selectedImage1);

        if (uploadError1) throw uploadError1;

        const { data: { publicUrl: url1 } } = supabase.storage
          .from('fotos-unidades')
          .getPublicUrl(fileName1);
        foto1Url = url1;
      }

      if (selectedImage2) {
        const fileExt2 = selectedImage2.name.split('.').pop();
        const fileName2 = `${user.id}-${Date.now()}-2.${fileExt2}`;
        const { error: uploadError2 } = await supabase.storage
          .from('fotos-unidades')
          .upload(fileName2, selectedImage2);

        if (uploadError2) throw uploadError2;

        const { data: { publicUrl: url2 } } = supabase.storage
          .from('fotos-unidades')
          .getPublicUrl(fileName2);
        foto2Url = url2;
      }

      return { foto1: foto1Url, foto2: foto2Url };
    } catch (error) {
      console.error("Error uploading images:", error);
      toast({
        title: "Error",
        description: "No se pudieron subir las imágenes",
        variant: "destructive",
      });
      return { foto1: null, foto2: null };
    } finally {
      setUploadingImages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validar campos requeridos
    if (!formData.tracto_id) {
      toast({
        title: "Error",
        description: "Por favor seleccione un tracto",
        variant: "destructive",
      });
      return;
    }

    if (!formData.operador_id) {
      toast({
        title: "Error",
        description: "Por favor seleccione un operador",
        variant: "destructive",
      });
      return;
    }

    if (!formData.odometro || parseInt(formData.odometro) <= 0) {
      toast({
        title: "Error",
        description: "Por favor ingrese un odómetro válido",
        variant: "destructive",
      });
      return;
    }

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
      // Verificar si estamos en una plataforma nativa (Android/iOS)
      const isNative = Capacitor.isNativePlatform();

      if (isNative) {
        // ===== MODO OFFLINE - Guardar localmente con plugin nativo =====
        
        // Obtener los números económicos de los equipos
        const tracto = equipos.find(e => e.id === formData.tracto_id);
        const dolly = equipos.find(e => e.id === formData.dolly_id);
        const remolque1 = equipos.find(e => e.id === formData.remolque_1_id);
        const remolque2 = equipos.find(e => e.id === formData.remolque_2_id);

        // Construir resumen de puntos de inspección
        const puntosInspeccionTexto = `${checkedCount}/${ctpatPoints.length} OK`;

        // Obtener las rutas de las imágenes (si existen)
        // En Capacitor, las imágenes deben ser capturadas con el plugin de Camera
        // y ya tendrás las rutas locales. Por ahora usamos las previsualizaciones.
        const fotoFrontal = imagePreview1 || "";
        const fotoLateral = imagePreview2 || "";

        // Guardar datos offline en localStorage
        const datosOffline = {
          id: Date.now().toString(),
          tractoNumeroEconomico: tracto?.numero_economico || "",
          dolly: dolly?.numero_economico || "",
          operador: formData.operador,
          remolque1: remolque1?.numero_economico || "",
          remolque2: remolque2?.numero_economico || "",
          puntosInspeccion: puntosInspeccionTexto,
          odometro: parseInt(formData.odometro),
          fotoVistaFrontalPath: fotoFrontal,
          fotoVistaLateralPath: fotoLateral,
          requiereMantenimiento: formData.requiere_mantenimiento,
          reportarAccidente: formData.incidente,
          timestamp: new Date().toISOString(),
          formData: formData // Guardar todos los datos del formulario
        };

        // Obtener datos offline existentes
        const offlineData = localStorage.getItem('unidades_offline');
        const unidadesOffline = offlineData ? JSON.parse(offlineData) : [];
        unidadesOffline.push(datosOffline);
        localStorage.setItem('unidades_offline', JSON.stringify(unidadesOffline));

        console.log('Unidad guardada offline:', datosOffline);

        toast({
          title: "Guardado Localmente",
          description: "Unidad guardada en el dispositivo. Se sincronizará cuando haya conexión.",
        });

      } else {
        // ===== MODO ONLINE - Guardar en Supabase directamente =====
        
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

        if (!finalClientId) throw new Error("No se pudo determinar el cliente");

        const { foto1, foto2 } = await uploadImages();

        const { error } = await supabase
          .from("ingreso_unidades")
          .insert({
            tipo_movimiento: entryType,
            numero_unidad: formData.numero_unidad,
            operador: formData.operador,
            operador_id: formData.operador_id || null,
            tipo_unidad: formData.tipo_unidad,
            numero_economico: formData.numero_economico,
            tracto_id: formData.tracto_id || null,
            dolly_id: formData.dolly_id || null,
            remolque_1_id: formData.remolque_1_id || null,
            remolque_2_id: formData.remolque_2_id || null,
            odometro: parseInt(formData.odometro),
            requiere_mantenimiento: formData.requiere_mantenimiento,
            incidente: formData.incidente,
            descripcion_incidente: formData.incidente ? formData.descripcion_incidente : null,
            foto_1_url: foto1,
            foto_2_url: foto2,
            puntos_seguridad: checkedPoints,
            client_id: finalClientId,
            created_by: user.id,
          });

        if (error) {
          console.error("Error inserting unit:", error);
          throw error;
        }

        toast({
          title: "Éxito",
          description: `Unidad registrada exitosamente (${entryType})`,
        });
      }

      // Reset form (común para ambos modos)
      setFormData({
        numero_unidad: "",
        operador: "",
        operador_id: "",
        tipo_unidad: "tracto",
        numero_economico: "",
        tracto_id: "",
        dolly_id: "",
        remolque_1_id: "",
        remolque_2_id: "",
        odometro: "",
        requiere_mantenimiento: false,
        incidente: false,
        descripcion_incidente: "",
      });
      setCheckedPoints({});
      setSelectedImage1(null);
      setSelectedImage2(null);
      setImagePreview1(null);
      setImagePreview2(null);
      
    } catch (error: any) {
      console.error("Error submitting entry:", error);
      toast({
        title: "Error",
        description: error.message || "No se pudo registrar la unidad",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getMonthlyEntries = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    return entries.filter(entry => {
      const entryDate = new Date(entry.created_at);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });
  };

  const monthlyEntries = getMonthlyEntries();
  const monthlyEntrances = monthlyEntries.filter(e => e.tipo_movimiento === "entrada");
  const monthlyExits = monthlyEntries.filter(e => e.tipo_movimiento === "salida");

  const todayEntries = entries.filter(
    (e) => new Date(e.created_at).toDateString() === new Date().toDateString()
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Truck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ingreso de Unidades</h1>
            <p className="text-muted-foreground">Registro basado en 17 puntos de seguridad CTPAT</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={() => setShowMonthlyReport(!showMonthlyReport)}
            className="w-full sm:w-auto"
          >
            {showMonthlyReport ? "Ocultar Reporte Mensual" : "Ver Reporte Mensual"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowHistory(!showHistory)}
            className="w-full sm:w-auto"
          >
            {showHistory ? "Ocultar Historial" : "Ver Historial"}
          </Button>
        </div>
      </div>

      {showMonthlyReport && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Reporte Mensual - {new Date().toLocaleDateString("es-MX", { month: "long", year: "numeric" })}</CardTitle>
            <CardDescription>Resumen de entradas y salidas del mes actual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Movimientos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">{monthlyEntries.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Entradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-accent">{monthlyEntrances.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Salidas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-secondary">{monthlyExits.length}</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Movimientos del Mes</h4>
              {monthlyEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay registros este mes
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {monthlyEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-lg border border-border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant={entry.tipo_movimiento === "entrada" ? "default" : "secondary"}>
                            {entry.tipo_movimiento}
                          </Badge>
                          <span className="font-medium">Unidad {entry.numero_unidad}</span>
                          <span className="text-sm text-muted-foreground">• {entry.operador}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(entry.created_at).toLocaleDateString("es-MX", { 
                            day: "2-digit", 
                            month: "2-digit" 
                          })} {new Date(entry.created_at).toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Registros Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold text-foreground">{todayEntries.length}</div>
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
                            <span>Operador: {entry.operador_data?.nombre || entry.operador} - {entry.operador_data?.numero_empleado || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">
                                Tracto: {entry.tracto?.numero_economico || entry.numero_economico} - {entry.tracto?.marca} {entry.tracto?.modelo}
                              </span>
                              {entry.dolly && (
                                <span className="text-xs">
                                  Dolly: {entry.dolly.numero_economico} - {entry.dolly.marca} {entry.dolly.modelo}
                                </span>
                              )}
                              {entry.remolque_1 && (
                                <span className="text-xs">
                                  Remolque 1: {entry.remolque_1.numero_economico} - {entry.remolque_1.marca} {entry.remolque_1.modelo}
                                </span>
                              )}
                              {entry.remolque_2 && (
                                <span className="text-xs">
                                  Remolque 2: {entry.remolque_2.numero_economico} - {entry.remolque_2.marca} {entry.remolque_2.modelo}
                                </span>
                              )}
                              <span className="text-xs">Odómetro: {entry.odometro.toLocaleString()} km</span>
                            </div>
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

      <Card className="shadow-card min-h-[800px]">
        <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Nueva Inspección de Unidad</CardTitle>
              <CardDescription>Complete todos los campos requeridos y los 17 puntos CTPAT</CardDescription>
            </div>
            <Select value={entryType} onValueChange={(value: "entrada" | "salida") => setEntryType(value)}>
              <SelectTrigger className="w-full sm:w-32">
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
              <TabsList className="w-full grid grid-cols-3 h-auto">
                <TabsTrigger value="basico" className="text-xs sm:text-sm px-2 py-2">Datos Básicos</TabsTrigger>
                <TabsTrigger value="inspeccion" className="text-xs sm:text-sm px-2 py-2">Inspección CTPAT</TabsTrigger>
                <TabsTrigger value="adicional" className="text-xs sm:text-sm px-2 py-2">Info Adicional</TabsTrigger>
              </TabsList>

              <TabsContent value="basico" className="space-y-4 min-h-[600px]">
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setScanningFor("equipo");
                      setShowQRScanner(true);
                    }}
                    className="w-full sm:flex-1"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Escanear QR de Equipo
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setScanningFor("operador");
                      setShowQRScanner(true);
                    }}
                    className="w-full sm:flex-1"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Escanear QR de Operador
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="numero_economico">Tracto (Número Económico) *</Label>
                    <div className="space-y-2">
                      <Input
                        placeholder="Escribe el número de tracto..."
                        value={tractoSearchQuery}
                        onChange={(e) => handleTractoSearch(e.target.value)}
                        className="mb-2"
                      />
                      <Select
                        value={formData.tracto_id}
                        onValueChange={(value) => {
                          const equipo = equipos.find(e => e.id === value);
                          setFormData({ 
                            ...formData, 
                            tracto_id: value,
                            numero_economico: equipo?.numero_economico || '',
                            numero_unidad: equipo?.numero_economico || ''
                          });
                          setTractoSearchQuery(equipo?.numero_economico || '');
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="O seleccionar de la lista" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipos
                            .filter(e => e.tipo_equipo?.toLowerCase() === 'tracto')
                            .filter(e => tractoSearchQuery === '' || e.numero_economico.toLowerCase().includes(tractoSearchQuery.toLowerCase()))
                            .map((equipo) => (
                            <SelectItem key={equipo.id} value={equipo.id}>
                              {equipo.numero_economico} - {equipo.marca} {equipo.modelo}
                              {equipo.estado !== 'disponible' && ` (${equipo.estado})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {formData.numero_economico && (
                        <p className="text-sm text-muted-foreground">
                          Seleccionado: <span className="font-semibold">{formData.numero_economico}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="operador">Operador *</Label>
                    <Select
                      value={formData.operador_id}
                      onValueChange={(value) => {
                        const operador = operadores.find(o => o.id === value);
                        setFormData({ 
                          ...formData, 
                          operador_id: value,
                          operador: operador?.nombre || ''
                        });
                      }}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar operador" />
                      </SelectTrigger>
                      <SelectContent>
                        {operadores.map((operador) => (
                          <SelectItem key={operador.id} value={operador.id}>
                            {operador.nombre} - {operador.numero_empleado}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dolly">Dolly (Número Económico)</Label>
                    <Select
                      value={formData.dolly_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, dolly_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin dolly (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipos.filter(e => e.tipo_equipo?.toLowerCase() === 'dolly').map((equipo) => (
                          <SelectItem key={equipo.id} value={equipo.id}>
                            {equipo.numero_economico} - {equipo.marca} {equipo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remolque_1">Remolque 1 (Número Económico)</Label>
                    <Select
                      value={formData.remolque_1_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, remolque_1_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin remolque (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipos.filter(e => e.tipo_equipo?.toLowerCase() === 'remolque').map((equipo) => (
                          <SelectItem key={equipo.id} value={equipo.id}>
                            {equipo.numero_economico} - {equipo.marca} {equipo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="remolque_2">Remolque 2 (Número Económico)</Label>
                    <Select
                      value={formData.remolque_2_id || undefined}
                      onValueChange={(value) => setFormData({ ...formData, remolque_2_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sin remolque (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipos.filter(e => e.tipo_equipo?.toLowerCase() === 'remolque').map((equipo) => (
                          <SelectItem key={equipo.id} value={equipo.id}>
                            {equipo.numero_economico} - {equipo.marca} {equipo.modelo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

              <TabsContent value="inspeccion" className="space-y-4 min-h-[600px]">
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

              <TabsContent value="adicional" className="space-y-4 min-h-[600px]">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Fotografías de la Unidad</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="photo1" className="text-sm">Foto 1 - Vista Frontal</Label>
                        <Input
                          id="photo1"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange(1)}
                          className="cursor-pointer"
                        />
                        {imagePreview1 && (
                          <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                            <img 
                              src={imagePreview1} 
                              alt="Vista frontal" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="photo2" className="text-sm">Foto 2 - Vista Lateral</Label>
                        <Input
                          id="photo2"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange(2)}
                          className="cursor-pointer"
                        />
                        {imagePreview2 && (
                          <div className="relative w-full h-32 border rounded-lg overflow-hidden">
                            <img 
                              src={imagePreview2} 
                              alt="Vista lateral" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
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
                  operador_id: "",
                  tipo_unidad: "tracto",
                  numero_economico: "",
                  tracto_id: "",
                  dolly_id: "",
                  remolque_1_id: "",
                  remolque_2_id: "",
                  odometro: "",
                  requiere_mantenimiento: false,
                  incidente: false,
                  descripcion_incidente: "",
                });
                setCheckedPoints({});
              }}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary hover:bg-primary/90" disabled={submitting || uploadingImages}>
                {submitting ? "Registrando..." : uploadingImages ? "Subiendo imágenes..." : `Registrar ${entryType === "entrada" ? "Entrada" : "Salida"}`}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showQRScanner} onOpenChange={setShowQRScanner}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Escanear Código QR {scanningFor === "equipo" ? "del Equipo" : "del Operador"}
            </DialogTitle>
          </DialogHeader>
          <QRScanner
            onScan={handleQRScan}
            onClose={() => setShowQRScanner(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
