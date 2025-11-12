import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { CameraCapture } from "@/components/CameraCapture";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { 
  Building2, 
  Plus, 
  Camera, 
  CheckCircle2, 
  XCircle,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  Download,
  Image as ImageIcon
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface PuntoVerificacion {
  codigo: string;
  criterio: string;
  objetivo: string;
  cumple: boolean | null;
  observaciones: string;
  foto_url?: string;
}

interface AccionCorrectiva {
  descripcion: string;
  responsable: string;
  fecha_compromiso: string;
  estado: string;
}

interface Inspeccion {
  id: string;
  folio: string;
  fecha_inspeccion: string;
  inspector_nombre: string;
  categoria: string;
  estado: string;
  puntos_verificacion: any;
  observaciones_generales?: string;
  acciones_correctivas?: any;
}

const CATEGORIAS = {
  SP: {
    nombre: "Seguridad Perimetral y de Accesos",
    icon: "🧱",
    puntos: [
      { codigo: "SP-01", criterio: "El perímetro de las instalaciones cuenta con cercado o muro en buen estado y sin vulnerabilidades.", objetivo: "Evitar accesos no autorizados." },
      { codigo: "SP-02", criterio: "Las puertas o portones de acceso son resistentes, se cierran correctamente y están bajo control.", objetivo: "Controlar entradas y salidas." },
      { codigo: "SP-03", criterio: "Se mantiene iluminación suficiente en todo el perímetro y accesos.", objetivo: "Aumentar visibilidad y disuasión." },
      { codigo: "SP-04", criterio: "Se cuenta con caseta o punto de control con personal de seguridad.", objetivo: "Supervisar el ingreso de personas y vehículos." },
      { codigo: "SP-05", criterio: "Se registra y controla el ingreso de visitantes, contratistas y proveedores.", objetivo: "Mantener trazabilidad de accesos." },
      { codigo: "SP-06", criterio: "Se utiliza bitácora o sistema electrónico de registro de accesos.", objetivo: "Evidencia documental." },
      { codigo: "SP-07", criterio: "Se emplean gafetes o credenciales para visitantes y personal.", objetivo: "Identificación visual." },
      { codigo: "SP-08", criterio: "Los puntos de acceso no autorizados están sellados o bloqueados.", objetivo: "Evitar intrusiones." },
      { codigo: "SP-09", criterio: "Se dispone de cámaras en accesos y perímetro (CCTV).", objetivo: "Monitoreo continuo." },
      { codigo: "SP-10", criterio: "Las grabaciones se conservan por al menos 30 días.", objetivo: "Evidencia ante incidentes." }
    ]
  },
  PC: {
    nombre: "Patio de Carga y Estacionamientos",
    icon: "🚛",
    puntos: [
      { codigo: "PC-01", criterio: "Se realizan inspecciones visuales a las unidades antes del ingreso y salida.", objetivo: "Detectar alteraciones o contrabando." },
      { codigo: "PC-02", criterio: "Se cuenta con área definida y señalizada para maniobras.", objetivo: "Evitar accidentes y desorden." },
      { codigo: "PC-03", criterio: "Se emplean sellos numerados registrados en control interno.", objetivo: "Garantizar integridad de la carga." },
      { codigo: "PC-04", criterio: "Se documenta el número de sello y se verifica su integridad.", objetivo: "Evidencia trazable." },
      { codigo: "PC-05", criterio: "El personal conoce el procedimiento de inspección de unidades.", objetivo: "Cumplimiento operativo." },
      { codigo: "PC-06", criterio: "El área de carga está bajo vigilancia física o por cámara.", objetivo: "Seguridad en operaciones." },
      { codigo: "PC-07", criterio: "Existen zonas segregadas (carga, descarga, espera, mantenimiento).", objetivo: "Control operativo." },
      { codigo: "PC-08", criterio: "Las unidades en espera están bajo supervisión o control visual.", objetivo: "Evitar manipulación indebida." },
      { codigo: "PC-09", criterio: "Se cuenta con rutas y accesos internos señalizados.", objetivo: "Orden y prevención de accidentes." },
      { codigo: "PC-10", criterio: "Se dispone de señalización de emergencia y extintores visibles.", objetivo: "Seguridad ante incidentes." }
    ]
  },
  OF: {
    nombre: "Oficinas Administrativas",
    icon: "🏢",
    puntos: [
      { codigo: "OF-01", criterio: "El acceso a oficinas se encuentra restringido al personal autorizado.", objetivo: "Control de acceso interno." },
      { codigo: "OF-02", criterio: "Se controla el ingreso de visitantes mediante registro.", objetivo: "Seguridad documental." },
      { codigo: "OF-03", criterio: "Se dispone de cerraduras o controles electrónicos en áreas críticas.", objetivo: "Protección de información." },
      { codigo: "OF-04", criterio: "Archivos físicos están bajo resguardo seguro (con llave o gabinete).", objetivo: "Evitar fuga de información." },
      { codigo: "OF-05", criterio: "Se aplican políticas de escritorio limpio (sin documentos expuestos).", objetivo: "Protección de datos." },
      { codigo: "OF-06", criterio: "Se cuenta con extintores y detectores de humo operativos.", objetivo: "Seguridad contra incendios." },
      { codigo: "OF-07", criterio: "Se encuentran señalizadas rutas de evacuación.", objetivo: "Cumplimiento de protección civil." },
      { codigo: "OF-08", criterio: "El personal conoce el plan de emergencia.", objetivo: "Respuesta ante incidentes." },
      { codigo: "OF-09", criterio: "Hay orden y limpieza general en oficinas.", objetivo: "Imagen y seguridad." },
      { codigo: "OF-10", criterio: "Los equipos informáticos están protegidos por contraseñas.", objetivo: "Seguridad informática." }
    ]
  },
  CA: {
    nombre: "Control de Accesos y Personal",
    icon: "🔐",
    puntos: [
      { codigo: "CA-01", criterio: "Se tiene un listado actualizado del personal autorizado.", objetivo: "Control de presencia." },
      { codigo: "CA-02", criterio: "El personal cuenta con credenciales de identificación.", objetivo: "Identificación inmediata." },
      { codigo: "CA-03", criterio: "Se verifican antecedentes del personal de nuevo ingreso.", objetivo: "Seguridad en contratación." },
      { codigo: "CA-04", criterio: "Se capacita al personal en seguridad OEA / CTPAT.", objetivo: "Conciencia y cumplimiento." },
      { codigo: "CA-05", criterio: "Se notifican y registran las bajas de empleados.", objetivo: "Prevención de accesos indebidos." },
      { codigo: "CA-06", criterio: "Se retiran llaves, gafetes y credenciales al momento de baja.", objetivo: "Control post–empleo." },
      { codigo: "CA-07", criterio: "Se revisan permisos de acceso temporales (proveedores / visitas).", objetivo: "Control externo." },
      { codigo: "CA-08", criterio: "Se llevan registros de entrega y recepción de llaves.", objetivo: "Trazabilidad." }
    ]
  },
  IT: {
    nombre: "Seguridad de la Información y Tecnología",
    icon: "🧳",
    puntos: [
      { codigo: "IT-01", criterio: "Se aplican contraseñas seguras en equipos y sistemas.", objetivo: "Protección informática." },
      { codigo: "IT-02", criterio: "Se realiza respaldo periódico de información.", objetivo: "Continuidad operativa." },
      { codigo: "IT-03", criterio: "Solo personal autorizado accede a información sensible.", objetivo: "Control de confidencialidad." },
      { codigo: "IT-04", criterio: "Se mantienen antivirus y software actualizado.", objetivo: "Prevención de vulnerabilidades." },
      { codigo: "IT-05", criterio: "Se controla el uso de memorias USB o dispositivos externos.", objetivo: "Evitar fuga de datos." },
      { codigo: "IT-06", criterio: "Se restringe acceso a redes Wi-Fi no autorizadas.", objetivo: "Ciberseguridad." },
      { codigo: "IT-07", criterio: "Se aplican políticas de acceso remoto seguro.", objetivo: "Prevención de intrusiones." }
    ]
  },
  AM: {
    nombre: "Seguridad Industrial, Salud y Medio Ambiente",
    icon: "🧯",
    puntos: [
      { codigo: "AM-01", criterio: "Se cuenta con plan de emergencia y simulacros realizados.", objetivo: "Preparación ante crisis." },
      { codigo: "AM-02", criterio: "Existen botiquines y equipos de primeros auxilios.", objetivo: "Atención inmediata." },
      { codigo: "AM-03", criterio: "Se dispone de equipo contra incendios (extintores, hidrantes).", objetivo: "Mitigación de riesgo." },
      { codigo: "AM-04", criterio: "Se mantienen pasillos y salidas libres de obstrucciones.", objetivo: "Evacuación segura." },
      { codigo: "AM-05", criterio: "Se gestionan adecuadamente los residuos peligrosos y comunes.", objetivo: "Cumplimiento ambiental." },
      { codigo: "AM-06", criterio: "No hay fugas o condiciones de riesgo visibles.", objetivo: "Control de accidentes." },
      { codigo: "AM-07", criterio: "Las áreas están limpias, ordenadas y ventiladas.", objetivo: "Seguridad y confort." }
    ]
  },
  CS: {
    nombre: "Seguridad en la Cadena de Suministro",
    icon: "📦",
    puntos: [
      { codigo: "CS-01", criterio: "Se verifican documentos de carga antes del embarque.", objetivo: "Evitar errores y fraude." },
      { codigo: "CS-02", criterio: "Se revisan sellos de seguridad y su número se documenta.", objetivo: "Trazabilidad." },
      { codigo: "CS-03", criterio: "Las unidades son inspeccionadas conforme a checklist de 7 puntos (CTPAT).", objetivo: "Seguridad vehicular." },
      { codigo: "CS-04", criterio: "Se verifica integridad del compartimento de carga.", objetivo: "Prevención de contrabando." },
      { codigo: "CS-05", criterio: "Se registra el nombre del operador asignado.", objetivo: "Identificación de responsable." },
      { codigo: "CS-06", criterio: "Se dispone de protocolo ante robo o pérdida de mercancía.", objetivo: "Respuesta inmediata." },
      { codigo: "CS-07", criterio: "Se realiza bitácora de entradas y salidas de vehículos.", objetivo: "Evidencia de tránsito." },
      { codigo: "CS-08", criterio: "Se garantiza comunicación continua con las unidades en ruta.", objetivo: "Monitoreo operativo." }
    ]
  },
  EV: {
    nombre: "Evidencia, Seguimiento y Mejora Continua",
    icon: "📸",
    puntos: [
      { codigo: "EV-01", criterio: "Cada inspección incluye evidencia fotográfica.", objetivo: "Validación visual." },
      { codigo: "EV-02", criterio: "Se asignan responsables a cada hallazgo o no conformidad.", objetivo: "Control de acciones." },
      { codigo: "EV-03", criterio: "Se da seguimiento a las acciones correctivas.", objetivo: "Mejora continua." },
      { codigo: "EV-04", criterio: "Se registra fecha de cierre y evidencia de corrección.", objetivo: "Control documental." },
      { codigo: "EV-05", criterio: "Los resultados se analizan en reuniones de seguridad.", objetivo: "Retroalimentación." }
    ]
  }
};

export default function FacilityInspections() {
  const navigate = useNavigate();
  const [inspecciones, setInspecciones] = useState<Inspeccion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<keyof typeof CATEGORIAS>("SP");
  const [puntosVerificacion, setPuntosVerificacion] = useState<Record<string, PuntoVerificacion>>({});
  const [accionesCorrectivas, setAccionesCorrectivas] = useState<AccionCorrectiva[]>([]);
  const [observacionesGenerales, setObservacionesGenerales] = useState("");
  const [showCamera, setShowCamera] = useState(false);
  const [currentPuntoCodigo, setCurrentPuntoCodigo] = useState<string>("");
  const [fotosCategoria, setFotosCategoria] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchInspecciones();
  }, []);

  const fetchInspecciones = async () => {
    try {
      const { data, error } = await supabase
        .from("inspecciones_instalaciones")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInspecciones((data || []) as Inspeccion[]);
    } catch (error) {
      console.error("Error fetching inspecciones:", error);
      toast.error("Error al cargar las inspecciones");
    } finally {
      setLoading(false);
    }
  };

  const inicializarPuntosVerificacion = () => {
    const puntos: Record<string, PuntoVerificacion> = {};
    Object.entries(CATEGORIAS).forEach(([key, categoria]) => {
      categoria.puntos.forEach(punto => {
        puntos[punto.codigo] = {
          ...punto,
          cumple: null,
          observaciones: ""
        };
      });
    });
    setPuntosVerificacion(puntos);
  };

  const handleNuevaInspeccion = () => {
    inicializarPuntosVerificacion();
    setAccionesCorrectivas([]);
    setObservacionesGenerales("");
    setCategoriaSeleccionada("SP");
    setFotosCategoria({});
    setShowForm(true);
  };

  const handleTomarFoto = (codigo: string) => {
    setCurrentPuntoCodigo(codigo);
    setShowCamera(true);
  };

  const handleCameraCapture = async (blob: Blob) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const fileName = `${Date.now()}_${currentPuntoCodigo}.jpg`;
      const filePath = `${userData.user.id}/${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from("fotos-instalaciones")
        .upload(filePath, blob);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("fotos-instalaciones")
        .getPublicUrl(filePath);

      handlePuntoChange(currentPuntoCodigo, "foto_url", urlData.publicUrl);
      
      setFotosCategoria(prev => ({
        ...prev,
        [categoriaSeleccionada]: [...(prev[categoriaSeleccionada] || []), urlData.publicUrl]
      }));

      toast.success("Foto capturada exitosamente");
      setShowCamera(false);
      setCurrentPuntoCodigo("");
    } catch (error) {
      console.error("Error al subir foto:", error);
      toast.error("Error al guardar la foto");
    }
  };

  const handlePuntoChange = (codigo: string, field: keyof PuntoVerificacion, value: any) => {
    setPuntosVerificacion(prev => ({
      ...prev,
      [codigo]: {
        ...prev[codigo],
        [field]: value
      }
    }));
  };

  const handleSubmit = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuario no autenticado");

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, client_id")
        .eq("id", userData.user.id)
        .single();

      const { data: folioData } = await supabase.rpc("generate_inspeccion_instalaciones_folio");

      const puntosArray = Object.values(puntosVerificacion);

      const { error } = await supabase
        .from("inspecciones_instalaciones")
        .insert([{
          folio: folioData as string,
          inspector_nombre: profileData?.full_name || userData.user.email || "",
          inspector_id: userData.user.id,
          categoria: categoriaSeleccionada,
          puntos_verificacion: puntosArray as any,
          observaciones_generales: observacionesGenerales,
          acciones_correctivas: accionesCorrectivas as any,
          estado: "completado",
          client_id: profileData?.client_id || "",
          created_by: userData.user.id
        }]);

      if (error) throw error;

      toast.success("Inspección registrada exitosamente");
      setShowForm(false);
      fetchInspecciones();
    } catch (error) {
      console.error("Error al guardar inspección:", error);
      toast.error("Error al guardar la inspección");
    }
  };

  const calcularCumplimiento = (puntos: PuntoVerificacion[]) => {
    const total = puntos.length;
    const cumplidos = puntos.filter(p => p.cumple === true).length;
    return total > 0 ? Math.round((cumplidos / total) * 100) : 0;
  };

  const generarReportePDF = async (inspeccion: Inspeccion) => {
    try {
      const doc = new jsPDF();
      const categoria = CATEGORIAS[inspeccion.categoria as keyof typeof CATEGORIAS];
      
      // Header
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text("Reporte de Inspección de Instalaciones", 105, 20, { align: "center" });
      
      // Info general
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`Folio: ${inspeccion.folio}`, 20, 35);
      doc.text(`Fecha: ${format(new Date(inspeccion.fecha_inspeccion), "dd/MM/yyyy HH:mm", { locale: es })}`, 20, 42);
      doc.text(`Inspector: ${inspeccion.inspector_nombre}`, 20, 49);
      doc.text(`Categoría: ${categoria?.nombre || inspeccion.categoria}`, 20, 56);
      
      const cumplimiento = calcularCumplimiento(inspeccion.puntos_verificacion);
      doc.text(`Cumplimiento: ${cumplimiento}%`, 20, 63);

      // Tabla de puntos
      const tableData = inspeccion.puntos_verificacion.map((punto: any) => [
        punto.codigo,
        punto.criterio,
        punto.cumple === true ? "✓ Sí" : punto.cumple === false ? "✗ No" : "N/A",
        punto.observaciones || "-"
      ]);

      autoTable(doc, {
        startY: 75,
        head: [["Código", "Criterio", "Cumple", "Observaciones"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8, cellPadding: 3 },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 80 },
          2: { cellWidth: 25 },
          3: { cellWidth: 55 }
        }
      });

      // Observaciones generales
      if (inspeccion.observaciones_generales) {
        const finalY = (doc as any).lastAutoTable.finalY || 75;
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones Generales:", 20, finalY + 15);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(inspeccion.observaciones_generales, 170);
        doc.text(splitText, 20, finalY + 23);
      }

      doc.save(`Inspeccion_${inspeccion.folio}.pdf`);
      toast.success("Reporte generado exitosamente");
    } catch (error) {
      console.error("Error al generar PDF:", error);
      toast.error("Error al generar el reporte");
    }
  };

  if (showCamera) {
    return (
      <CameraCapture 
        onCapture={handleCameraCapture}
        onClose={() => {
          setShowCamera(false);
          setCurrentPuntoCodigo("");
        }}
      />
    );
  }

  if (showForm) {
    return (
      <Layout>
        <div className="container mx-auto py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                Nueva Inspección de Instalaciones
              </h1>
              <p className="text-muted-foreground mt-1">
                Selecciona la categoría y verifica cada punto
              </p>
            </div>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>

          <Tabs value={categoriaSeleccionada} onValueChange={(v) => setCategoriaSeleccionada(v as keyof typeof CATEGORIAS)}>
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full gap-1 h-auto p-2">
              {Object.entries(CATEGORIAS).map(([key, cat]) => (
                <TabsTrigger 
                  key={key} 
                  value={key} 
                  className="text-xs flex flex-col sm:flex-row items-center justify-center gap-1 px-2 py-2 h-auto whitespace-normal"
                >
                  <span className="text-base flex-shrink-0">{cat.icon}</span>
                  <span className="text-center leading-tight">{cat.nombre}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {Object.entries(CATEGORIAS).map(([key, categoria]) => (
              <TabsContent key={key} value={key} className="space-y-4">
                <Card className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <span className="text-2xl">{categoria.icon}</span>
                    {categoria.nombre}
                  </h2>

                  <div className="space-y-6">
                    {categoria.puntos.map((punto) => (
                      <div key={punto.codigo} className="border rounded-lg p-4 space-y-3">
                      <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{punto.codigo}</Badge>
                                <span className="text-sm font-medium">{punto.criterio}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                <strong>Objetivo:</strong> {punto.objetivo}
                              </p>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={puntosVerificacion[punto.codigo]?.cumple === true ? "default" : "outline"}
                                onClick={() => handlePuntoChange(punto.codigo, "cumple", true)}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant={puntosVerificacion[punto.codigo]?.cumple === false ? "destructive" : "outline"}
                                onClick={() => handlePuntoChange(punto.codigo, "cumple", false)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTomarFoto(punto.codigo)}
                              >
                                <Camera className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>

                          {puntosVerificacion[punto.codigo]?.foto_url && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                              <ImageIcon className="h-4 w-4" />
                              <span>Evidencia fotográfica capturada</span>
                            </div>
                          )}
                        </div>

                        {puntosVerificacion[punto.codigo]?.cumple === false && (
                          <Textarea
                            placeholder="Observaciones sobre el incumplimiento..."
                            value={puntosVerificacion[punto.codigo]?.observaciones || ""}
                            onChange={(e) => handlePuntoChange(punto.codigo, "observaciones", e.target.value)}
                            className="mt-2"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Observaciones Generales</h3>
            <Textarea
              placeholder="Observaciones generales de la inspección..."
              value={observacionesGenerales}
              onChange={(e) => setObservacionesGenerales(e.target.value)}
              rows={4}
            />
          </Card>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <FileText className="mr-2 h-4 w-4" />
              Guardar Inspección
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Building2 className="h-8 w-8 text-primary" />
              Mantenimiento de Instalaciones
            </h1>
            <p className="text-muted-foreground mt-1">
              Inspecciones de seguridad y cumplimiento
            </p>
          </div>
          <Button onClick={handleNuevaInspeccion}>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Inspección
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">Cargando inspecciones...</div>
        ) : inspecciones.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay inspecciones registradas</h3>
            <p className="text-muted-foreground mb-4">
              Comienza creando tu primera inspección de instalaciones
            </p>
            <Button onClick={handleNuevaInspeccion}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Inspección
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4">
            {inspecciones.map((inspeccion) => {
              const cumplimiento = calcularCumplimiento(inspeccion.puntos_verificacion);
              const categoria = CATEGORIAS[inspeccion.categoria as keyof typeof CATEGORIAS];
              
              return (
                <Card key={inspeccion.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{categoria?.icon}</span>
                        <div>
                          <h3 className="text-lg font-semibold">{inspeccion.folio}</h3>
                          <p className="text-sm text-muted-foreground">{categoria?.nombre}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(inspeccion.fecha_inspeccion), "dd/MM/yyyy HH:mm", { locale: es })}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {inspeccion.inspector_nombre}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-2">
                      <Badge variant={cumplimiento >= 80 ? "default" : cumplimiento >= 60 ? "secondary" : "destructive"}>
                        {cumplimiento}% Cumplimiento
                      </Badge>
                      <div className="text-sm text-muted-foreground">
                        {inspeccion.puntos_verificacion.filter((p: any) => p.cumple === true).length} / {inspeccion.puntos_verificacion.length} puntos
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => generarReportePDF(inspeccion)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Descargar PDF
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
