import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Search, Truck, Package, Trash2, Edit, Plane, List, QrCode, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRCodeGenerator, generateQRCodeDataURL } from "@/components/QRCodeGenerator";

export default function EquipmentInventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [operacionFilter, setOperacionFilter] = useState<string>("all");
  const [estadoFilter, setEstadoFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [equipmentToDelete, setEquipmentToDelete] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "airport">("airport");
  const { toast } = useToast();
  const { userRole } = useAuth();
  const queryClient = useQueryClient();

  const { data: equipos, isLoading } = useQuery({
    queryKey: ["inventario_equipos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_equipos")
        .select("*")
        .order("numero_economico");
      
      if (error) throw error;
      return data;
    },
  });

  // Realtime updates for equipment status changes
  useEffect(() => {
    const channel = supabase
      .channel('equipment-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventario_equipos'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["inventario_equipos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      // Insert equipment and get the generated ID
      const { data: newEquipment, error } = await supabase
        .from("inventario_equipos")
        .insert([{ ...formData, created_by: user.id }])
        .select()
        .single();

      if (error) throw error;

      // Generate QR code with equipment ID
      const qrCode = `EQUIPO-${newEquipment.id}`;
      
      // Update with QR code
      const { error: updateError } = await supabase
        .from("inventario_equipos")
        .update({ qr_code: qrCode })
        .eq("id", newEquipment.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario_equipos"] });
      toast({ title: "Éxito", description: "Equipo registrado exitosamente" });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from("inventario_equipos")
        .update(data)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario_equipos"] });
      toast({ title: "Éxito", description: "Equipo actualizado exitosamente" });
      setIsEditDialogOpen(false);
      setEditingEquipment(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventario_equipos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario_equipos"] });
      toast({ title: "Éxito", description: "Equipo eliminado exitosamente" });
      setDeleteDialogOpen(false);
      setEquipmentToDelete(null);
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const quickStatusUpdateMutation = useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase
        .from("inventario_equipos")
        .update({ estado })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario_equipos"] });
      toast({ title: "Éxito", description: "Estado actualizado" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createMutation.mutate({
      numero_economico: formData.get("numero_economico"),
      tipo_equipo: formData.get("tipo_equipo"),
      marca: formData.get("marca"),
      modelo: formData.get("modelo"),
      año: formData.get("año") ? parseInt(formData.get("año") as string) : null,
      placas: formData.get("placas"),
      numero_serie: formData.get("numero_serie"),
      color: formData.get("color"),
      capacidad_carga: formData.get("capacidad_carga") ? parseFloat(formData.get("capacidad_carga") as string) : null,
      ubicacion: formData.get("ubicacion"),
      observaciones: formData.get("observaciones"),
      operacion: formData.get("operacion"),
    });
  };

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!editingEquipment) return;
    
    updateMutation.mutate({
      id: editingEquipment.id,
      data: {
        numero_economico: formData.get("numero_economico"),
        tipo_equipo: formData.get("tipo_equipo"),
        marca: formData.get("marca"),
        modelo: formData.get("modelo"),
        año: formData.get("año") ? parseInt(formData.get("año") as string) : null,
        placas: formData.get("placas"),
        numero_serie: formData.get("numero_serie"),
        color: formData.get("color"),
        capacidad_carga: formData.get("capacidad_carga") ? parseFloat(formData.get("capacidad_carga") as string) : null,
        ubicacion: formData.get("ubicacion"),
        observaciones: formData.get("observaciones"),
        operacion: formData.get("operacion"),
        estado: formData.get("estado"),
      },
    });
  };

  const filteredEquipos = equipos?.filter((e) => {
    const matchesSearch = e.numero_economico.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.marca.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.modelo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOperacion = operacionFilter === "all" || e.operacion === operacionFilter;
    const matchesEstado = estadoFilter === "all" || e.estado === estadoFilter;
    return matchesSearch && matchesOperacion && matchesEstado;
  });

  const disponibles = equipos?.filter(e => e.estado === 'disponible').length || 0;
  const enUso = equipos?.filter(e => e.estado === 'en_uso').length || 0;
  const mantenimiento = equipos?.filter(e => e.estado === 'mantenimiento').length || 0;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventario de Equipos</h1>
          <p className="text-muted-foreground">Tractos, Dollies y Remolques</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nuevo Equipo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Registrar Nuevo Equipo</DialogTitle></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2"><Label>Número Económico *</Label><Input name="numero_economico" required /></div>
                  <div className="space-y-2">
                    <Label>Operación *</Label>
                    <Select name="operacion" required defaultValue="HH Express">
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="HH Express">HH Express</SelectItem>
                        <SelectItem value="Portecalesa">Portecalesa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo de Equipo *</Label>
                    <Select name="tipo_equipo" required>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tracto">Tracto</SelectItem>
                        <SelectItem value="dolly">Dolly</SelectItem>
                        <SelectItem value="remolque">Remolque</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Marca *</Label><Input name="marca" required /></div>
                  <div className="space-y-2"><Label>Modelo *</Label><Input name="modelo" required /></div>
                  <div className="space-y-2"><Label>Año</Label><Input name="año" type="number" /></div>
                  <div className="space-y-2"><Label>Placas</Label><Input name="placas" /></div>
                  <div className="space-y-2"><Label>Número de Serie</Label><Input name="numero_serie" /></div>
                  <div className="space-y-2"><Label>Color</Label><Input name="color" /></div>
                  <div className="space-y-2"><Label>Capacidad Carga (ton)</Label><Input name="capacidad_carga" type="number" step="0.01" /></div>
                  <div className="space-y-2"><Label>Ubicación</Label><Input name="ubicacion" /></div>
                </div>
                <div className="space-y-2"><Label>Observaciones</Label><Textarea name="observaciones" /></div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Registrando..." : "Registrar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Total Equipos</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{equipos?.length || 0}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Disponibles</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-accent">{disponibles}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">En Uso</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{enUso}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Mantenimiento</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-secondary">{mantenimiento}</div></CardContent></Card>
      </div>

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "airport")} className="space-y-4">
        <TabsList>
          <TabsTrigger value="airport" className="gap-2"><Plane className="h-4 w-4" />Vista Aeropuerto</TabsTrigger>
          <TabsTrigger value="list" className="gap-2"><List className="h-4 w-4" />Vista Lista</TabsTrigger>
        </TabsList>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar equipos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
          <Select value={operacionFilter} onValueChange={setOperacionFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por operación" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las operaciones</SelectItem>
              <SelectItem value="HH Express">HH Express</SelectItem>
              <SelectItem value="Portecalesa">Portecalesa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Filtrar por estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="disponible">Disponible</SelectItem>
              <SelectItem value="en_uso">En Uso</SelectItem>
              <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <TabsContent value="airport" className="space-y-4">
          {filteredEquipos && filteredEquipos.length === 0 ? (
            <Card><CardContent className="text-center py-8 text-muted-foreground">No se encontraron equipos</CardContent></Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredEquipos?.map((equipo) => (
                <Card key={equipo.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {equipo.tipo_equipo === 'tracto' && <Truck className="h-6 w-6 text-primary" />}
                        {equipo.tipo_equipo === 'dolly' && <Package className="h-6 w-6 text-secondary" />}
                        {equipo.tipo_equipo === 'remolque' && <Package className="h-6 w-6 text-accent" />}
                        <div>
                          <CardTitle className="text-xl">{equipo.numero_economico}</CardTitle>
                          <CardDescription className="text-xs">{equipo.tipo_equipo.toUpperCase()}</CardDescription>
                        </div>
                      </div>
                      {userRole === "admin" && (
                        <Button size="sm" variant="ghost" onClick={() => {
                          setEditingEquipment(equipo);
                          setIsEditDialogOpen(true);
                        }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Badge variant="outline" className={equipo.operacion === 'HH Express' ? 'border-primary text-primary' : 'border-secondary text-secondary'}>
                        {equipo.operacion}
                      </Badge>
                      <Badge variant={equipo.estado === 'disponible' ? 'default' : equipo.estado === 'en_uso' ? 'secondary' : 'destructive'}>
                        {equipo.estado === 'disponible' ? 'Disponible' : equipo.estado === 'en_uso' ? 'En Uso' : 'Mantenimiento'}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      <p className="font-medium">{equipo.marca} {equipo.modelo}</p>
                      {equipo.placas && <p className="text-muted-foreground">Placas: {equipo.placas}</p>}
                      {equipo.ubicacion && <p className="text-muted-foreground">📍 {equipo.ubicacion}</p>}
                    </div>
                    {equipo.qr_code && (
                      <div className="flex flex-col items-center gap-2 p-3 bg-muted rounded-lg">
                        <QRCodeGenerator value={equipo.qr_code} size={120} />
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={async () => {
                            try {
                              const dataUrl = await generateQRCodeDataURL(equipo.qr_code);
                              const link = document.createElement('a');
                              link.download = `QR-${equipo.numero_economico}.png`;
                              link.href = dataUrl;
                              link.click();
                              toast({ title: "Éxito", description: "Código QR descargado" });
                            } catch (error) {
                              toast({ title: "Error", description: "No se pudo descargar el QR", variant: "destructive" });
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Descargar QR
                        </Button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => quickStatusUpdateMutation.mutate({ id: equipo.id, estado: 'disponible' })}>
                        Disponible
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => quickStatusUpdateMutation.mutate({ id: equipo.id, estado: 'en_uso' })}>
                        En Uso
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => quickStatusUpdateMutation.mutate({ id: equipo.id, estado: 'mantenimiento' })}>
                        Mantto
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader><CardTitle>Equipos Registrados</CardTitle></CardHeader>
            <CardContent>
              {filteredEquipos && filteredEquipos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No se encontraron equipos</div>
              ) : (
                <div className="space-y-3">
                  {filteredEquipos?.map((equipo) => (
                    <div key={equipo.id} className="p-4 border rounded-lg hover:shadow-card transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {equipo.tipo_equipo === 'tracto' && <Truck className="h-5 w-5 text-primary" />}
                            {equipo.tipo_equipo === 'dolly' && <Package className="h-5 w-5 text-secondary" />}
                            {equipo.tipo_equipo === 'remolque' && <Package className="h-5 w-5 text-accent" />}
                            <h4 className="font-semibold text-lg">{equipo.numero_economico}</h4>
                            <Badge variant={equipo.estado === 'disponible' ? 'default' : 'secondary'}>{equipo.estado}</Badge>
                            <Badge variant="outline" className={equipo.operacion === 'HH Express' ? 'border-primary text-primary' : 'border-secondary text-secondary'}>
                              {equipo.operacion}
                            </Badge>
                          </div>
                          <div className="grid gap-2 text-sm text-muted-foreground">
                            <p><strong>Tipo:</strong> {equipo.tipo_equipo.toUpperCase()}</p>
                            <p><strong>Marca/Modelo:</strong> {equipo.marca} {equipo.modelo}</p>
                            {equipo.placas && <p><strong>Placas:</strong> {equipo.placas}</p>}
                            {equipo.ubicacion && <p><strong>Ubicación:</strong> {equipo.ubicacion}</p>}
                            {equipo.observaciones && <p className="mt-2">{equipo.observaciones}</p>}
                          </div>
                        </div>
                        {userRole === "admin" && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => {
                              setEditingEquipment(equipo);
                              setIsEditDialogOpen(true);
                            }}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => {
                              setEquipmentToDelete(equipo);
                              setDeleteDialogOpen(true);
                            }}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Equipo</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2"><Label>Número Económico *</Label><Input name="numero_economico" required defaultValue={editingEquipment?.numero_economico} /></div>
              <div className="space-y-2">
                <Label>Operación *</Label>
                <Select name="operacion" required defaultValue={editingEquipment?.operacion}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HH Express">HH Express</SelectItem>
                    <SelectItem value="Portecalesa">Portecalesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de Equipo *</Label>
                <Select name="tipo_equipo" required defaultValue={editingEquipment?.tipo_equipo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tracto">Tracto</SelectItem>
                    <SelectItem value="dolly">Dolly</SelectItem>
                    <SelectItem value="remolque">Remolque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado *</Label>
                <Select name="estado" required defaultValue={editingEquipment?.estado}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="disponible">Disponible</SelectItem>
                    <SelectItem value="en_uso">En Uso</SelectItem>
                    <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Marca *</Label><Input name="marca" required defaultValue={editingEquipment?.marca} /></div>
              <div className="space-y-2"><Label>Modelo *</Label><Input name="modelo" required defaultValue={editingEquipment?.modelo} /></div>
              <div className="space-y-2"><Label>Año</Label><Input name="año" type="number" defaultValue={editingEquipment?.año} /></div>
              <div className="space-y-2"><Label>Placas</Label><Input name="placas" defaultValue={editingEquipment?.placas} /></div>
              <div className="space-y-2"><Label>Número de Serie</Label><Input name="numero_serie" defaultValue={editingEquipment?.numero_serie} /></div>
              <div className="space-y-2"><Label>Color</Label><Input name="color" defaultValue={editingEquipment?.color} /></div>
              <div className="space-y-2"><Label>Capacidad Carga (ton)</Label><Input name="capacidad_carga" type="number" step="0.01" defaultValue={editingEquipment?.capacidad_carga} /></div>
              <div className="space-y-2"><Label>Ubicación</Label><Input name="ubicacion" defaultValue={editingEquipment?.ubicacion} /></div>
            </div>
            <div className="space-y-2"><Label>Observaciones</Label><Textarea name="observaciones" defaultValue={editingEquipment?.observaciones} /></div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Actualizando..." : "Actualizar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Equipo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el equipo {equipmentToDelete?.numero_economico}. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => equipmentToDelete && deleteMutation.mutate(equipmentToDelete.id)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
