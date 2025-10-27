import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Truck, Navigation } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Trip {
  id: string;
  operador: string;
  unidad: string;
  origen: string;
  destino: string;
  fecha_salida: string;
  fecha_llegada_estimada: string | null;
  fecha_llegada_real: string | null;
  distancia_km: number;
  flete: number;
  cliente: string;
  sucursal: string;
  estado: string;
  ubicacion_actual: string | null;
  ultima_actualizacion_ubicacion: string | null;
  ruta_id: string | null;
  created_at: string;
}

interface Route {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  distancia_km: number;
  tiempo_estimado_horas: number;
  costo_estimado: number;
}

export default function Trips() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    operador: "",
    unidad: "",
    origen: "",
    destino: "",
    fecha_salida: "",
    fecha_llegada_estimada: "",
    distancia_km: "",
    flete: "",
    cliente: "",
    sucursal: "",
    ruta_id: "",
  });

  const [locationUpdate, setLocationUpdate] = useState("");

  useEffect(() => {
    fetchRoutes();
    fetchTrips();

    const channel = supabase
      .channel('trips-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'viajes'
        },
        () => {
          fetchTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from("rutas")
        .select("*")
        .eq('activa', true)
        .order("nombre", { ascending: true });

      if (error) throw error;
      setRoutes(data || []);
    } catch (error) {
      console.error("Error fetching routes:", error);
    }
  };

  const fetchTrips = async () => {
    try {
      const { data, error } = await supabase
        .from("viajes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTrips(data || []);
    } catch (error) {
      console.error("Error fetching trips:", error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los viajes",
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
      const { error } = await supabase
        .from("viajes")
        .insert({
          operador: formData.operador,
          unidad: formData.unidad,
          origen: formData.origen,
          destino: formData.destino,
          fecha_salida: formData.fecha_salida,
          fecha_llegada_estimada: formData.fecha_llegada_estimada || null,
          distancia_km: parseInt(formData.distancia_km),
          flete: parseFloat(formData.flete),
          cliente: formData.cliente,
          sucursal: formData.sucursal,
          ruta_id: formData.ruta_id || null,
          estado: 'programado',
          created_by: user.id,
        });

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Viaje registrado exitosamente",
      });

      setFormData({
        operador: "",
        unidad: "",
        origen: "",
        destino: "",
        fecha_salida: "",
        fecha_llegada_estimada: "",
        distancia_km: "",
        flete: "",
        cliente: "",
        sucursal: "",
        ruta_id: "",
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting trip:", error);
      toast({
        title: "Error",
        description: "No se pudo registrar el viaje",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateLocation = async (tripId: string) => {
    if (!locationUpdate.trim()) {
      toast({
        title: "Error",
        description: "Ingrese una ubicación",
        variant: "destructive",
      });
      return;
    }

    setUpdatingLocation(true);
    try {
      const { error } = await supabase
        .from("viajes")
        .update({
          ubicacion_actual: locationUpdate,
          ultima_actualizacion_ubicacion: new Date().toISOString(),
          estado: 'en_transito'
        })
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Ubicación actualizada exitosamente",
      });

      setLocationUpdate("");
      setDetailsDialogOpen(false);
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la ubicación",
        variant: "destructive",
      });
    } finally {
      setUpdatingLocation(false);
    }
  };

  const openDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsDialogOpen(true);
  };

  const handleRouteChange = (routeId: string) => {
    const route = routes.find(r => r.id === routeId);
    if (route) {
      setFormData({
        ...formData,
        ruta_id: routeId,
        origen: route.origen,
        destino: route.destino,
        distancia_km: route.distancia_km.toString(),
      });
    }
  };

  const monthTrips = trips.filter(t => {
    const tripDate = new Date(t.created_at);
    const now = new Date();
    return tripDate.getMonth() === now.getMonth() && tripDate.getFullYear() === now.getFullYear();
  });

  const inTransitTrips = trips.filter(t => t.estado === "en_transito");
  const scheduledTrips = trips.filter(t => t.estado === "programado");
  const completedTrips = monthTrips.filter(t => t.estado === "completado");
  const totalKmMonth = completedTrips.reduce((sum, t) => sum + t.distancia_km, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <MapPin className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Registro de Viajes</h1>
            <p className="text-muted-foreground">Control de rutas y operaciones</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <MapPin className="h-4 w-4 mr-2" />
              Nuevo Viaje
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Viaje</DialogTitle>
              <DialogDescription>Complete la información del viaje o seleccione una ruta predefinida</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="route">Ruta Predefinida (opcional)</Label>
                <Select
                  value={formData.ruta_id || undefined}
                  onValueChange={handleRouteChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin ruta predefinida - Ingresar datos manualmente" />
                  </SelectTrigger>
                  <SelectContent>
                    {routes.map((route) => (
                      <SelectItem key={route.id} value={route.id}>
                        {route.nombre} ({route.origen} → {route.destino})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operador">Operador</Label>
                  <Input
                    id="operador"
                    placeholder="Nombre del operador"
                    value={formData.operador}
                    onChange={(e) => setFormData({ ...formData, operador: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad</Label>
                  <Input
                    id="unidad"
                    placeholder="TRC-001"
                    value={formData.unidad}
                    onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origen">Origen</Label>
                  <Input
                    id="origen"
                    placeholder="Ciudad, Estado"
                    value={formData.origen}
                    onChange={(e) => setFormData({ ...formData, origen: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destino">Destino</Label>
                  <Input
                    id="destino"
                    placeholder="Ciudad, Estado"
                    value={formData.destino}
                    onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-salida">Fecha de Salida</Label>
                  <Input
                    id="fecha-salida"
                    type="date"
                    value={formData.fecha_salida}
                    onChange={(e) => setFormData({ ...formData, fecha_salida: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fecha-llegada">Llegada Estimada</Label>
                  <Input
                    id="fecha-llegada"
                    type="date"
                    value={formData.fecha_llegada_estimada}
                    onChange={(e) => setFormData({ ...formData, fecha_llegada_estimada: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distancia">Distancia (km)</Label>
                  <Input
                    id="distancia"
                    type="number"
                    placeholder="920"
                    value={formData.distancia_km}
                    onChange={(e) => setFormData({ ...formData, distancia_km: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="flete">Flete ($)</Label>
                  <Input
                    id="flete"
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    value={formData.flete}
                    onChange={(e) => setFormData({ ...formData, flete: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cliente">Cliente</Label>
                  <Input
                    id="cliente"
                    placeholder="Nombre del cliente"
                    value={formData.cliente}
                    onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sucursal">Sucursal</Label>
                  <Input
                    id="sucursal"
                    placeholder="Sucursal"
                    value={formData.sucursal}
                    onChange={(e) => setFormData({ ...formData, sucursal: e.target.value })}
                    required
                  />
                </div>
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
                  {submitting ? "Registrando..." : "Registrar Viaje"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{monthTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">{completedTrips.length} completados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Tránsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{inTransitTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Activos ahora</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{scheduledTrips.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos viajes</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Km Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {(totalKmMonth / 1000).toFixed(0)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Viajes Recientes</CardTitle>
          <CardDescription>Estado actual de las operaciones</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay viajes registrados
            </div>
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{trip.unidad}</h4>
                        {trip.estado === "completado" && (
                          <Badge className="bg-accent text-accent-foreground">Completado</Badge>
                        )}
                        {trip.estado === "en_transito" && (
                          <Badge className="bg-primary text-primary-foreground">En Tránsito</Badge>
                        )}
                        {trip.estado === "programado" && (
                          <Badge variant="outline">Programado</Badge>
                        )}
                        {trip.estado === "cancelado" && (
                          <Badge variant="destructive">Cancelado</Badge>
                        )}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{trip.origen} → {trip.destino}</span>
                        </div>
                        <div className="flex items-center gap-4 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            <span>{trip.operador}</span>
                          </div>
                          <span>•</span>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>Salida: {new Date(trip.fecha_salida).toLocaleDateString("es-MX")}</span>
                          </div>
                          <span>•</span>
                          <span>{trip.distancia_km} km</span>
                        </div>
                        {trip.ubicacion_actual && (
                          <div className="flex items-center gap-2 text-primary">
                            <Navigation className="h-4 w-4" />
                            <span>Última ubicación: {trip.ubicacion_actual}</span>
                            {trip.ultima_actualizacion_ubicacion && (
                              <span className="text-muted-foreground">
                                • {new Date(trip.ultima_actualizacion_ubicacion).toLocaleString("es-MX")}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => openDetails(trip)}
                    >
                      Ver Detalles
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trip Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Viaje</DialogTitle>
            <DialogDescription>Información completa del viaje y actualización de ubicación</DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Unidad</Label>
                  <p className="font-semibold">{selectedTrip.unidad}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Operador</Label>
                  <p className="font-semibold">{selectedTrip.operador}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Origen</Label>
                  <p className="font-semibold">{selectedTrip.origen}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Destino</Label>
                  <p className="font-semibold">{selectedTrip.destino}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Cliente</Label>
                  <p className="font-semibold">{selectedTrip.cliente}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Sucursal</Label>
                  <p className="font-semibold">{selectedTrip.sucursal}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Distancia</Label>
                  <p className="font-semibold">{selectedTrip.distancia_km} km</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Flete</Label>
                  <p className="font-semibold">${selectedTrip.flete.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fecha Salida</Label>
                  <p className="font-semibold">{new Date(selectedTrip.fecha_salida).toLocaleDateString("es-MX")}</p>
                </div>
                {selectedTrip.fecha_llegada_estimada && (
                  <div>
                    <Label className="text-muted-foreground">Llegada Estimada</Label>
                    <p className="font-semibold">{new Date(selectedTrip.fecha_llegada_estimada).toLocaleDateString("es-MX")}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label className="text-muted-foreground">Estado</Label>
                  <Badge className="mt-1" variant={selectedTrip.estado === "en_transito" ? "default" : "outline"}>
                    {selectedTrip.estado}
                  </Badge>
                </div>
                {selectedTrip.ubicacion_actual && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground">Última Ubicación</Label>
                    <p className="font-semibold">{selectedTrip.ubicacion_actual}</p>
                    {selectedTrip.ultima_actualizacion_ubicacion && (
                      <p className="text-sm text-muted-foreground">
                        Actualizado: {new Date(selectedTrip.ultima_actualizacion_ubicacion).toLocaleString("es-MX")}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              {selectedTrip.estado !== "completado" && selectedTrip.estado !== "cancelado" && (
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="location">Actualizar Ubicación</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      placeholder="Ej: Km 450 Autopista México-Monterrey"
                      value={locationUpdate}
                      onChange={(e) => setLocationUpdate(e.target.value)}
                    />
                    <Button
                      onClick={() => handleUpdateLocation(selectedTrip.id)}
                      disabled={updatingLocation}
                    >
                      <Navigation className="h-4 w-4 mr-2" />
                      {updatingLocation ? "Actualizando..." : "Actualizar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
