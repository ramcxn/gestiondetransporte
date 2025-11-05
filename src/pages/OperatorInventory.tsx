import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardCheck, Plus, Search, CheckCircle, XCircle, AlertCircle, PenTool } from "lucide-react";
import SignatureCanvas from "react-signature-canvas";

const equipmentItems = [
  { key: "chaleco_reflejante", label: "Chaleco reflejante" },
  { key: "casco", label: "Casco" },
  { key: "botas_seguridad", label: "Botas de seguridad" },
  { key: "extintor", label: "Extintor" },
  { key: "gato_hidraulico", label: "Gato hidráulico" },
  { key: "triangulos_emergencia", label: "Triángulos de emergencia" },
  { key: "herramienta_basica", label: "Herramienta básica" },
  { key: "cinturones_seguridad", label: "Cinturones de seguridad" },
  { key: "lampara", label: "Lámpara" },
];

export default function OperatorInventory() {
  const { user, clientId } = useAuth();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("lista");
  
  const sigOperadorRef = useRef<SignatureCanvas>(null);
  const sigSupervisorRef = useRef<SignatureCanvas>(null);
  
  const [formData, setFormData] = useState({
    operador_nombre: "",
    numero_unidad: "",
    tipo_revision: "ingreso",
    chaleco_reflejante: false,
    casco: false,
    botas_seguridad: false,
    extintor: false,
    gato_hidraulico: false,
    triangulos_emergencia: false,
    herramienta_basica: false,
    cinturones_seguridad: false,
    lampara: false,
    observaciones: "",
    estado: "pendiente",
  });

  const { data: operadores } = useQuery({
    queryKey: ["operadores", clientId],
    queryFn: async () => {
      let query = supabase
        .from("operadores")
        .select("id, nombre, numero_empleado")
        .eq("estado", "activo")
        .order("nombre");
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades } = useQuery({
    queryKey: ["inventario_equipos", clientId],
    queryFn: async () => {
      let query = supabase
        .from("inventario_equipos")
        .select("id, numero_economico")
        .eq("estado", "disponible")
        .order("numero_economico");
      
      if (clientId) {
        query = query.eq("client_id", clientId);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    },
  });

  const { data: revisiones, isLoading } = useQuery({
    queryKey: ["inventario_operador"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_operador")
        .select("*")
        .order("fecha_hora", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const uploadSignature = async (canvas: SignatureCanvas | null, type: string) => {
    if (!canvas || canvas.isEmpty()) return null;
    
    const dataUrl = canvas.toDataURL("image/png");
    const blob = await fetch(dataUrl).then(r => r.blob());
    const fileName = `${user?.id}/${type}_${Date.now()}.png`;
    
    const { error: uploadError } = await supabase.storage
      .from("firmas-inventario")
      .upload(fileName, blob);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from("firmas-inventario")
      .getPublicUrl(fileName);
    
    return publicUrl;
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (!user || !clientId) throw new Error("No authenticated user");
      
      const firmaOperador = await uploadSignature(sigOperadorRef.current, "operador");
      const firmaSupervisor = await uploadSignature(sigSupervisorRef.current, "supervisor");
      
      const { error } = await supabase
        .from("inventario_operador")
        .insert({
          ...data,
          firma_operador_url: firmaOperador,
          firma_supervisor_url: firmaSupervisor,
          supervisor_id: user.id,
          client_id: clientId,
          created_by: user.id,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Revisión registrada exitosamente");
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["inventario_operador"] });
      resetForm();
    },
    onError: (error) => {
      toast.error("Error al registrar revisión");
      console.error(error);
    },
  });

  const resetForm = () => {
    setFormData({
      operador_nombre: "",
      numero_unidad: "",
      tipo_revision: "ingreso",
      chaleco_reflejante: false,
      casco: false,
      botas_seguridad: false,
      extintor: false,
      gato_hidraulico: false,
      triangulos_emergencia: false,
      herramienta_basica: false,
      cinturones_seguridad: false,
      lampara: false,
      observaciones: "",
      estado: "pendiente",
    });
    sigOperadorRef.current?.clear();
    sigSupervisorRef.current?.clear();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calcular estado automáticamente
    const allChecked = equipmentItems.every(item => formData[item.key as keyof typeof formData]);
    const newEstado = allChecked ? "aprobado" : "requiere_correccion";
    
    createMutation.mutate({ ...formData, estado: newEstado });
  };

  const filteredRevisiones = revisiones?.filter(rev =>
    rev.operador_nombre?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rev.numero_unidad?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: revisiones?.length || 0,
    aprobados: revisiones?.filter(r => r.estado === "aprobado").length || 0,
    requiereCorreccion: revisiones?.filter(r => r.estado === "requiere_correccion").length || 0,
    cumplimiento: revisiones?.length ? 
      Math.round((revisiones.filter(r => r.estado === "aprobado").length / revisiones.length) * 100) : 0,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <ClipboardCheck className="h-8 w-8" />
            Inventario del Operador
          </h1>
          <p className="text-muted-foreground mt-1">
            Revisión de equipo obligatorio por operador
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Revisión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registro de Inventario del Operador</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="operador_nombre">Operador *</Label>
                  <Select
                    value={formData.operador_nombre}
                    onValueChange={(value) => {
                      setFormData({ 
                        ...formData, 
                        operador_nombre: value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {operadores?.map((operador) => (
                        <SelectItem key={operador.id} value={operador.nombre}>
                          {operador.nombre} ({operador.numero_empleado})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numero_unidad">Número de Unidad *</Label>
                  <Select
                    value={formData.numero_unidad}
                    onValueChange={(value) => setFormData({ ...formData, numero_unidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {unidades?.map((unidad) => (
                        <SelectItem key={unidad.id} value={unidad.numero_economico}>
                          {unidad.numero_economico}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_revision">Tipo de Revisión *</Label>
                <select
                  id="tipo_revision"
                  className="w-full border rounded-md p-2"
                  value={formData.tipo_revision}
                  onChange={(e) => setFormData({ ...formData, tipo_revision: e.target.value })}
                >
                  <option value="ingreso">Ingreso</option>
                  <option value="salida">Salida</option>
                </select>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Lista de Verificación de Equipo</h3>
                <div className="grid grid-cols-2 gap-3">
                  {equipmentItems.map((item) => (
                    <div key={item.key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={item.key}
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => setFormData({ ...formData, [item.key]: e.target.checked })}
                        className="h-4 w-4"
                      />
                      <Label htmlFor={item.key} className="cursor-pointer">{item.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Firma del Operador</Label>
                  <div className="border rounded-md">
                    <SignatureCanvas
                      ref={sigOperadorRef}
                      canvasProps={{ className: "w-full h-32 border rounded" }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigOperadorRef.current?.clear()}
                  >
                    Limpiar
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Firma del Supervisor</Label>
                  <div className="border rounded-md">
                    <SignatureCanvas
                      ref={sigSupervisorRef}
                      canvasProps={{ className: "w-full h-32 border rounded" }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => sigSupervisorRef.current?.clear()}
                  >
                    Limpiar
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  <ClipboardCheck className="h-4 w-4 mr-2" />
                  Registrar Revisión
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revisiones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.aprobados}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Requieren Corrección</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.requiereCorreccion}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">% Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.cumplimiento}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            <Input
              placeholder="Buscar por operador o unidad..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRevisiones?.map((revision) => (
                <Card key={revision.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{revision.operador_nombre}</h3>
                          <Badge variant={revision.tipo_revision === "ingreso" ? "default" : "secondary"}>
                            {revision.tipo_revision.toUpperCase()}
                          </Badge>
                          <Badge variant={
                            revision.estado === "aprobado" ? "default" :
                            revision.estado === "requiere_correccion" ? "destructive" : "secondary"
                          }>
                            {revision.estado === "aprobado" ? <CheckCircle className="h-3 w-3 mr-1" /> :
                             revision.estado === "requiere_correccion" ? <XCircle className="h-3 w-3 mr-1" /> :
                             <AlertCircle className="h-3 w-3 mr-1" />}
                            {revision.estado.replace("_", " ").toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p>Unidad: {revision.numero_unidad}</p>
                          <p>Fecha: {new Date(revision.fecha_hora).toLocaleString("es-MX")}</p>
                          {revision.observaciones && <p className="mt-1">Obs: {revision.observaciones}</p>}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {equipmentItems.map((item) => (
                            revision[item.key] ? (
                              <Badge key={item.key} variant="outline" className="text-xs bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {item.label}
                              </Badge>
                            ) : null
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRevisiones?.length === 0 && (
                <div className="text-center p-8 text-muted-foreground">
                  No se encontraron revisiones
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
