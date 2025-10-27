import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Calendar, AlertTriangle, Plus, X, Package } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Maintenance {
  id: string;
  unidad: string;
  tipo_mantenimiento: string;
  fecha_mantenimiento: string;
  odometro: number;
  costo: number;
  proveedor: string;
  descripcion: string;
  proximo_mantenimiento: number | null;
  estado: string;
  created_at: string;
}

export default function Maintenance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [refacciones, setRefacciones] = useState<any[]>([]);
  const [inventarioDisponible, setInventarioDisponible] = useState<any[]>([]);
  const [selectedRefacciones, setSelectedRefacciones] = useState<Array<{ inventario_id: string; cantidad: number; costo_unitario: number }>>([]);

  const [formData, setFormData] = useState({
    unidad: "",
    tipo_mantenimiento: "preventivo",
    fecha_mantenimiento: "",
    odometro: "",
    costo: "",
    proveedor: "",
    descripcion: "",
    proximo_mantenimiento: "",
  });

  useEffect(() => {
    fetchMaintenances();
    fetchInventarioDisponible();

    const channel = supabase
      .channel('maintenance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mantenimientos'
        },
        () => {
          fetchMaintenances();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchInventarioDisponible = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario_refacciones")
        .select(`
          *,
          refacciones (numero_parte, descripcion, precio_unitario)
        `)
        .eq("estado", "disponible")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setInventarioDisponible(data || []);
    } catch (error) {
      console.error("Error fetching inventario:", error);
    }
  };

  const fetchMaintenances = async () => {
    try {
      const { data, error } = await supabase
        .from("mantenimientos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMaintenances(data || []);
    } catch (error) {
      console.error("Error fetching maintenances:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los mantenimientos",
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
      // Insertar mantenimiento
      const { data: mantenimiento, error: maintenanceError } = await supabase
        .from("mantenimientos")
        .insert({
          unidad: formData.unidad,
          tipo_mantenimiento: formData.tipo_mantenimiento,
          fecha_mantenimiento: formData.fecha_mantenimiento,
          odometro: parseInt(formData.odometro),
          costo: parseFloat(formData.costo),
          proveedor: formData.proveedor,
          descripcion: formData.descripcion,
          proximo_mantenimiento: formData.proximo_mantenimiento ? parseInt(formData.proximo_mantenimiento) : null,
          created_by: user.id,
        })
        .select()
        .single();

      if (maintenanceError) throw maintenanceError;

      // Insertar refacciones usadas
      if (selectedRefacciones.length > 0) {
        const refaccionesData = selectedRefacciones.map(ref => ({
          mantenimiento_id: mantenimiento.id,
          inventario_id: ref.inventario_id,
          cantidad: ref.cantidad,
          costo_unitario: ref.costo_unitario,
          costo_total: ref.cantidad * ref.costo_unitario,
          created_by: user.id,
        }));

        const { error: refaccionesError } = await supabase
          .from("refacciones_mantenimiento")
          .insert(refaccionesData);

        if (refaccionesError) throw refaccionesError;

        // Actualizar estado del inventario
        for (const ref of selectedRefacciones) {
          await supabase
            .from("inventario_refacciones")
            .update({ 
              estado: "asignado",
              mantenimiento_id: mantenimiento.id 
            })
            .eq("id", ref.inventario_id);

          // Registrar movimiento
          await supabase
            .from("movimientos_refacciones")
            .insert({
              tipo_movimiento: "salida",
              refaccion_id: inventarioDisponible.find(i => i.id === ref.inventario_id)?.refaccion_id,
              inventario_id: ref.inventario_id,
              cantidad: ref.cantidad,
              mantenimiento_id: mantenimiento.id,
              costo_unitario: ref.costo_unitario,
              costo_total: ref.cantidad * ref.costo_unitario,
              created_by: user.id,
            });
        }
      }

      toast({
        title: "Éxito",
        description: "Mantenimiento registrado exitosamente",
      });

      setFormData({
        unidad: "",
        tipo_mantenimiento: "preventivo",
        fecha_mantenimiento: "",
        odometro: "",
        costo: "",
        proveedor: "",
        descripcion: "",
        proximo_mantenimiento: "",
      });
      setSelectedRefacciones([]);
      setIsDialogOpen(false);
      fetchInventarioDisponible();
    } catch (error) {
      console.error("Error submitting maintenance:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el mantenimiento",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const addRefaccion = () => {
    setSelectedRefacciones([...selectedRefacciones, { inventario_id: "", cantidad: 1, costo_unitario: 0 }]);
  };

  const removeRefaccion = (index: number) => {
    setSelectedRefacciones(selectedRefacciones.filter((_, i) => i !== index));
  };

  const updateRefaccion = (index: number, field: string, value: any) => {
    const updated = [...selectedRefacciones];
    if (field === "inventario_id") {
      const item = inventarioDisponible.find(i => i.id === value);
      updated[index] = {
        ...updated[index],
        inventario_id: value,
        costo_unitario: item?.costo_unitario || 0,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setSelectedRefacciones(updated);
  };

  const thisMonth = maintenances.filter(m => {
    const date = new Date(m.fecha_mantenimiento);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  const inProgress = maintenances.filter(m => m.estado === "en_proceso");
  const programmed = maintenances.filter(m => m.estado === "programado");
  const totalCostThisMonth = thisMonth.reduce((sum, m) => sum + Number(m.costo), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Wrench className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mantenimiento a Unidades</h1>
            <p className="text-muted-foreground">Preventivo, correctivo y rescates carreteros</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Wrench className="h-4 w-4 mr-2" />
              Nuevo Mantenimiento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Mantenimiento</DialogTitle>
              <DialogDescription>Complete la información del servicio realizado</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Input
                    id="unit"
                    placeholder="TRC-001"
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-type">Tipo de Mantenimiento</Label>
                  <Select
                    value={formData.tipo_mantenimiento}
                    onValueChange={(value) => setFormData({ ...formData, tipo_mantenimiento: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventivo">Preventivo</SelectItem>
                      <SelectItem value="correctivo">Correctivo</SelectItem>
                      <SelectItem value="rescate">Rescate Carretero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-date">Fecha</Label>
                  <Input
                    id="maintenance-date"
                    type="date"
                    value={formData.fecha_mantenimiento}
                    onChange={(e) => setFormData({ ...formData, fecha_mantenimiento: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odómetro (km)</Label>
                  <Input
                    id="odometer"
                    type="number"
                    placeholder="150000"
                    value={formData.odometro}
                    onChange={(e) => setFormData({ ...formData, odometro: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="15000"
                    value={formData.costo}
                    onChange={(e) => setFormData({ ...formData, costo: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Proveedor/Taller</Label>
                  <Input
                    id="provider"
                    placeholder="Nombre del taller"
                    value={formData.proveedor}
                    onChange={(e) => setFormData({ ...formData, proveedor: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Servicio</Label>
                <Textarea
                  id="description"
                  placeholder="Detalle los trabajos realizados..."
                  rows={4}
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-maintenance">Próximo Mantenimiento (km)</Label>
                <Input
                  id="next-maintenance"
                  type="number"
                  placeholder="180000"
                  value={formData.proximo_mantenimiento}
                  onChange={(e) => setFormData({ ...formData, proximo_mantenimiento: e.target.value })}
                />
              </div>

              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">Refacciones Utilizadas</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addRefaccion}>
                    <Plus className="h-4 w-4 mr-1" />
                    Agregar Refacción
                  </Button>
                </div>
                
                {selectedRefacciones.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No se han agregado refacciones</p>
                ) : (
                  <div className="space-y-2">
                    {selectedRefacciones.map((ref, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end">
                        <div className="col-span-6">
                          <Label className="text-xs">Refacción</Label>
                          <Select
                            value={ref.inventario_id}
                            onValueChange={(value) => updateRefaccion(index, "inventario_id", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                              {inventarioDisponible.map((item) => (
                                <SelectItem key={item.id} value={item.id}>
                                  <div className="flex items-center gap-2">
                                    <Package className="h-3 w-3" />
                                    {item.refacciones?.numero_parte} - {item.numero_serie || "S/N"}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            type="number"
                            min="1"
                            value={ref.cantidad}
                            onChange={(e) => updateRefaccion(index, "cantidad", parseInt(e.target.value))}
                          />
                        </div>
                        <div className="col-span-3">
                          <Label className="text-xs">Costo Unit.</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={ref.costo_unitario}
                            onChange={(e) => updateRefaccion(index, "costo_unitario", parseFloat(e.target.value))}
                          />
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => removeRefaccion(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right text-sm font-semibold pt-2 border-t">
                      Total Refacciones: ${selectedRefacciones.reduce((sum, ref) => sum + (ref.cantidad * ref.costo_unitario), 0).toFixed(2)}
                    </div>
                  </div>
                )}
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
                  {submitting ? "Registrando..." : "Registrar Mantenimiento"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{thisMonth.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {thisMonth.filter(m => m.tipo_mantenimiento === "preventivo").length} preventivos
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{inProgress.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades en taller</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{programmed.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              ${totalCostThisMonth.toLocaleString("es-MX")}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Mantenimientos</CardTitle>
          <CardDescription>Historial de servicios realizados</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : maintenances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay mantenimientos registrados
            </div>
          ) : (
            <div className="space-y-3">
              {maintenances.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-foreground">{record.unidad}</h4>
                        <Badge variant={record.estado === "completado" ? "default" : "secondary"}>
                          {record.estado === "completado" ? "Completado" : record.estado === "en_proceso" ? "En Proceso" : "Programado"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">• {record.tipo_mantenimiento}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{record.descripcion}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(record.fecha_mantenimiento).toLocaleDateString("es-MX")}</span>
                        </div>
                        <span>•</span>
                        <span>Costo: ${record.costo.toLocaleString("es-MX")}</span>
                        <span>•</span>
                        <span>Odómetro: {record.odometro.toLocaleString()} km</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-card bg-secondary/5 border-secondary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertTriangle className="h-5 w-5 text-secondary" />
            Mantenimientos Programados Próximos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div>
              <p className="font-medium text-foreground">TRC-003</p>
              <p className="text-sm text-muted-foreground">Mantenimiento preventivo - 185,450 km</p>
            </div>
            <Badge variant="secondary">5 días</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-background rounded-lg">
            <div>
              <p className="font-medium text-foreground">REM-456</p>
              <p className="text-sm text-muted-foreground">Cambio de llantas - 178,900 km</p>
            </div>
            <Badge variant="secondary">12 días</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
