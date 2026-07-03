import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ClipboardList, Search, CheckCircle, XCircle, Clock, ArrowLeft, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

export default function WarehouseRequests() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState<any>(null);
  const [selectedRefacciones, setSelectedRefacciones] = useState<Array<{ id: string; cantidad: number }>>([{ id: "", cantidad: 1 }]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    const { data } = await supabase.rpc("is_admin");
    setIsAdmin(data || false);
  };

  const { data: solicitudes, isLoading } = useQuery({
    queryKey: ["solicitudes_refacciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitudes_refacciones")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: refacciones } = useQuery({
    queryKey: ["refacciones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refacciones")
        .select("*")
        .eq("activa", true)
        .order("numero_parte");
      
      if (error) throw error;
      return data;
    },
  });

  const { data: unidades } = useQuery({
    queryKey: ["unidades_inventario_equipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_equipos")
        .select("id, numero_economico, tipo_equipo, marca, modelo")
        .order("numero_economico");
      if (error) throw error;
      return data;
    },
  });


  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Generar folio
      const { data: folioData } = await supabase.rpc("generate_solicitud_folio");
      
      // Get client_id basado en el dominio del email
      const { data: clientId } = await supabase.rpc('get_client_id_by_email_domain');

      if (!clientId) throw new Error("No se pudo determinar el cliente");

      const { data: solicitud, error: solicitudError } = await supabase
        .from("solicitudes_refacciones")
        .insert([
          {
            folio: folioData,
            unidad: formData.unidad,
            prioridad: formData.prioridad,
            mantenimiento_id: formData.mantenimiento_id || null,
            fecha_requerida: formData.fecha_requerida || null,
            observaciones: formData.observaciones,
            solicitante: user.id,
            client_id: clientId,
            created_by: user.id,
          },
        ])
        .select()
        .single();

      if (solicitudError) throw solicitudError;

      // Insertar detalles
      const detalles = formData.refacciones
        .filter((r: any) => r.refaccion_id && r.cantidad > 0)
        .map((r: any) => ({
          solicitud_id: solicitud.id,
          refaccion_id: r.refaccion_id,
          cantidad_solicitada: r.cantidad,
          client_id: clientId,
        }));

      if (detalles.length > 0) {
        const { error: detallesError } = await supabase
          .from("detalle_solicitudes_refacciones")
          .insert(detalles);

        if (detallesError) throw detallesError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes_refacciones"] });
      toast({ title: "Solicitud creada exitosamente" });
      setIsDialogOpen(false);
      setSelectedRefacciones([{ id: "", cantidad: 1 }]);
    },
    onError: (error: any) => {
      toast({
        title: "Error al crear solicitud",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const refaccionesData = selectedRefacciones
      .map((_, index) => ({
        refaccion_id: formData.get(`refaccion_${index}`),
        cantidad: parseInt(formData.get(`cantidad_${index}`) as string),
      }))
      .filter(r => r.refaccion_id);

    if (refaccionesData.length === 0) {
      toast({
        title: "Error",
        description: "Debes agregar al menos una refacción",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate({
      unidad: formData.get("unidad"),
      prioridad: formData.get("prioridad"),
      fecha_requerida: formData.get("fecha_requerida") || null,
      observaciones: formData.get("observaciones"),
      refacciones: refaccionesData,
    });
  };

  const addRefaccion = () => {
    setSelectedRefacciones([...selectedRefacciones, { id: "", cantidad: 1 }]);
  };

  const removeRefaccion = (index: number) => {
    setSelectedRefacciones(selectedRefacciones.filter((_, i) => i !== index));
  };

  const registerPurchaseMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { error } = await supabase
        .from("solicitudes_refacciones")
        .update({
          estado_compra: "comprado",
          fecha_compra: new Date().toISOString(),
          comprador_id: user.id,
          monto_compra: parseFloat(formData.monto_compra),
          proveedor_compra: formData.proveedor_compra,
        })
        .eq("id", formData.solicitud_id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitudes_refacciones"] });
      toast({ title: "Compra registrada exitosamente" });
      setPurchaseDialogOpen(false);
      setSelectedSolicitud(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error al registrar compra",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handlePurchaseSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    registerPurchaseMutation.mutate({
      solicitud_id: selectedSolicitud.id,
      monto_compra: formData.get("monto_compra"),
      proveedor_compra: formData.get("proveedor_compra"),
    });
  };

  const getStatusBadge = (estado: string) => {
    const variants: Record<string, any> = {
      pendiente: { variant: "outline", icon: Clock },
      aprobada: { variant: "default", icon: CheckCircle },
      en_picking: { variant: "secondary", icon: ClipboardList },
      completada: { variant: "default", icon: CheckCircle },
      cancelada: { variant: "destructive", icon: XCircle },
    };
    const config = variants[estado] || variants.pendiente;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {estado.replace("_", " ").toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (prioridad: string) => {
    const colors: Record<string, string> = {
      baja: "secondary",
      normal: "outline",
      alta: "default",
      urgente: "destructive",
    };
    return <Badge variant={colors[prioridad] as any}>{prioridad.toUpperCase()}</Badge>;
  };

  const filteredSolicitudes = solicitudes?.filter((s) =>
    s.folio.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.unidad.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/almacen">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Almacén
        </Button>
      </Link>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar solicitudes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Solicitud de Refacciones</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad *</Label>
                  <Input id="unidad" name="unidad" required placeholder="Número económico" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prioridad">Prioridad *</Label>
                  <Select name="prioridad" defaultValue="normal" required>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baja">Baja</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_requerida">Fecha Requerida</Label>
                <Input id="fecha_requerida" name="fecha_requerida" type="date" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Refacciones *</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addRefaccion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar
                  </Button>
                </div>
                
                {selectedRefacciones.map((refaccion, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-8">
                      <Select name={`refaccion_${index}`} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar refacción" />
                        </SelectTrigger>
                        <SelectContent>
                          {refacciones?.map((r) => (
                            <SelectItem key={r.id} value={r.id}>
                              {r.numero_parte} - {r.descripcion}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Input
                        name={`cantidad_${index}`}
                        type="number"
                        min="1"
                        defaultValue="1"
                        placeholder="Cant"
                        required
                      />
                    </div>
                    {selectedRefacciones.length > 1 && (
                      <div className="col-span-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeRefaccion(index)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea id="observaciones" name="observaciones" />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Crear Solicitud</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {filteredSolicitudes?.map((solicitud) => (
          <Card key={solicitud.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{solicitud.folio}</CardTitle>
                  <p className="text-sm text-muted-foreground">Unidad: {solicitud.unidad}</p>
                </div>
                <div className="flex gap-2">
                  {getPriorityBadge(solicitud.prioridad)}
                  {getStatusBadge(solicitud.estado)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Fecha Solicitud:</span>
                  <p className="font-medium">{format(new Date(solicitud.fecha_solicitud), "dd/MM/yyyy HH:mm")}</p>
                </div>
                {solicitud.fecha_requerida && (
                  <div>
                    <span className="text-muted-foreground">Fecha Requerida:</span>
                    <p className="font-medium">{format(new Date(solicitud.fecha_requerida), "dd/MM/yyyy")}</p>
                  </div>
                )}
              </div>
              {solicitud.observaciones && (
                <div>
                  <span className="text-sm text-muted-foreground">Observaciones:</span>
                  <p className="text-sm">{solicitud.observaciones}</p>
                </div>
              )}
              {solicitud.estado_compra && (
                <div>
                  <span className="text-sm text-muted-foreground">Estado de Compra:</span>
                  <Badge variant={solicitud.estado_compra === "comprado" ? "default" : "outline"}>
                    {solicitud.estado_compra === "comprado" ? "Comprado" : "Pendiente de Compra"}
                  </Badge>
                  {solicitud.proveedor_compra && (
                    <p className="text-sm mt-1">Proveedor: {solicitud.proveedor_compra}</p>
                  )}
                  {solicitud.monto_compra && (
                    <p className="text-sm">Monto: ${solicitud.monto_compra}</p>
                  )}
                </div>
              )}
              {isAdmin && solicitud.estado === "aprobada" && solicitud.estado_compra !== "comprado" && (
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedSolicitud(solicitud);
                    setPurchaseDialogOpen(true);
                  }}
                  className="mt-2"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Registrar Compra
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSolicitudes?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No se encontraron solicitudes</p>
            <p className="text-sm text-muted-foreground">Crea tu primera solicitud de refacciones</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={purchaseDialogOpen} onOpenChange={setPurchaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Compra de Solicitud</DialogTitle>
          </DialogHeader>
          {selectedSolicitud && (
            <form onSubmit={handlePurchaseSubmit} className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Folio: {selectedSolicitud.folio}</p>
                <p className="text-sm text-muted-foreground">Unidad: {selectedSolicitud.unidad}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proveedor_compra">Proveedor *</Label>
                <Input id="proveedor_compra" name="proveedor_compra" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="monto_compra">Monto Total de Compra *</Label>
                <Input 
                  id="monto_compra" 
                  name="monto_compra" 
                  type="number" 
                  step="0.01" 
                  min="0"
                  required 
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setPurchaseDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Registrar Compra</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}