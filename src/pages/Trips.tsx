import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Calendar, Truck, Navigation, Map as MapIcon, Trash2, Filter, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import TripsMap from "@/components/TripsMap";
import TripLocationHistoryMap from "@/components/TripLocationHistoryMap";
import TripAuditLog from "@/components/TripAuditLog";
import AddressPicker from "@/components/AddressPicker";
import { z } from "zod";

const tripSchema = z.object({
  operador: z.string().min(1, "El operador es requerido").max(100, "Máximo 100 caracteres"),
  unidad: z.string().min(1, "La unidad es requerida").max(50, "Máximo 50 caracteres"),
  origen: z.string().min(1, "El origen es requerido").max(255, "Máximo 255 caracteres"),
  destino: z.string().min(1, "El destino es requerido").max(255, "Máximo 255 caracteres"),
  fecha_salida: z.string().min(1, "La fecha de salida es requerida"),
  fecha_llegada_estimada: z.string().min(1, "La fecha de llegada estimada es requerida"),
  distancia_km: z.coerce.number().min(0, "La distancia debe ser mayor a 0").max(10000, "Distancia máxima 10,000 km"),
  flete: z.coerce.number().min(0, "El flete debe ser mayor a 0").max(9999999, "Flete máximo 9,999,999"),
  cliente: z.string().min(1, "El cliente es requerido").max(100, "Máximo 100 caracteres"),
  sucursal: z.string().min(1, "La sucursal es requerida").max(100, "Máximo 100 caracteres"),
  unidad_negocio: z.enum(["HH Express", "PORTECALESA"], { required_error: "Selecciona una unidad de negocio" }),
});

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
  unidad_negocio: string;
  direccion_carga?: string | null;
  lat_carga?: number | null;
  lng_carga?: number | null;
  direccion_descarga?: string | null;
  lat_descarga?: number | null;
  lng_descarga?: number | null;
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

interface Operador {
  id: string;
  nombre: string;
  numero_empleado: string;
  estado: string;
}

interface Unidad {
  id: string;
  numero_economico: string;
  tipo_equipo: string;
  marca: string;
  modelo: string;
  estado: string;
}

interface Cliente {
  id: string;
  nombre: string;
  activo: boolean;
}

export default function Trips() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [operadores, setOperadores] = useState<Operador[]>([]);
  const [unidades, setUnidades] = useState<Unidad[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingOperadores, setLoadingOperadores] = useState(true);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [updatingLocation, setUpdatingLocation] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const { user, userRole } = useAuth();
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
    unidad_negocio: "HH Express",
    direccion_carga: "",
    lat_carga: null as number | null,
    lng_carga: null as number | null,
    direccion_descarga: "",
    lat_descarga: null as number | null,
    lng_descarga: null as number | null,
  });


  const [locationUpdate, setLocationUpdate] = useState("");

  const [filters, setFilters] = useState({
    fechaInicio: "",
    fechaFin: "",
    cliente: "all",
    operador: "all",
    ruta: "all",
    unidad_negocio: "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchRoutes();
    fetchTrips();
    fetchOperadores();
    fetchUnidades();
    fetchClientes();
    fetchMapboxToken();

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

  const fetchMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("get-mapbox-token");
      
      if (error) throw error;
      
      if (data?.token) {
        setMapboxToken(data.token);
      }
    } catch (error) {
      console.error("Error fetching Mapbox token:", error);
    }
  };

  const fetchOperadores = async () => {
    try {
      const { data, error } = await supabase
        .from("operadores")
        .select("id, nombre, numero_empleado, estado")
        .eq('estado', 'activo')
        .order("nombre", { ascending: true });

      if (error) throw error;
      setOperadores(data || []);
    } catch (error) {
      console.error("Error fetching operadores:", error);
    } finally {
      setLoadingOperadores(false);
    }
  };

  const fetchUnidades = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario_equipos")
        .select("id, numero_economico, tipo_equipo, marca, modelo, estado")
        .eq('estado', 'disponible')
        .order("numero_economico", { ascending: true });

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error("Error fetching unidades:", error);
    } finally {
      setLoadingUnidades(false);
    }
  };

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre, activo")
        .eq('activo', true)
        .order("nombre", { ascending: true });

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoadingClientes(false);
    }
  };

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
      // Validate form data with zod
      const validatedData = tripSchema.parse({
        operador: formData.operador,
        unidad: formData.unidad,
        origen: formData.origen,
        destino: formData.destino,
        fecha_salida: formData.fecha_salida,
        fecha_llegada_estimada: formData.fecha_llegada_estimada,
        distancia_km: formData.distancia_km,
        flete: formData.flete,
        cliente: formData.cliente,
        sucursal: formData.sucursal,
        unidad_negocio: formData.unidad_negocio,
      });

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

      const { error } = await supabase
        .from("viajes")
        .insert({
          operador: validatedData.operador,
          unidad: validatedData.unidad,
          origen: validatedData.origen,
          destino: validatedData.destino,
          fecha_salida: validatedData.fecha_salida,
          fecha_llegada_estimada: validatedData.fecha_llegada_estimada || null,
          distancia_km: validatedData.distancia_km,
          flete: validatedData.flete,
          cliente: validatedData.cliente,
          sucursal: validatedData.sucursal,
          unidad_negocio: validatedData.unidad_negocio,
          client_id: finalClientId,
          ruta_id: formData.ruta_id || null,
          estado: 'programado',
          created_by: user.id,
          direccion_carga: formData.direccion_carga || null,
          lat_carga: formData.lat_carga,
          lng_carga: formData.lng_carga,
          direccion_descarga: formData.direccion_descarga || null,
          lat_descarga: formData.lat_descarga,
          lng_descarga: formData.lng_descarga,
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
        unidad_negocio: "HH Express",
        direccion_carga: "",
        lat_carga: null,
        lng_carga: null,
        direccion_descarga: "",
        lat_descarga: null,
        lng_descarga: null,
      });
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting trip:", error);
      if (error instanceof z.ZodError) {
        toast({
          title: "Error de validación",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo registrar el viaje",
          variant: "destructive",
        });
      }
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

  const handleChangeStatus = async (tripId: string, newStatus: string) => {
    try {
      const updates: any = {
        estado: newStatus,
      };

      // Si se completa el viaje, agregar fecha de llegada real
      if (newStatus === 'completado') {
        updates.fecha_llegada_real = new Date().toISOString();
      }

      const { error } = await supabase
        .from("viajes")
        .update(updates)
        .eq('id', tripId);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: `Viaje marcado como ${newStatus === 'en_transito' ? 'en tránsito' : newStatus}`,
      });

      fetchTrips();
      setDetailsDialogOpen(false);
    } catch (error) {
      console.error("Error updating trip status:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del viaje",
        variant: "destructive",
      });
    }
  };

  const openDetails = (trip: Trip) => {
    setSelectedTrip(trip);
    setDetailsDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!tripToDelete) return;

    try {
      const { error } = await supabase
        .from("viajes")
        .delete()
        .eq("id", tripToDelete.id);

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Viaje eliminado exitosamente",
      });

      fetchTrips();
      setDeleteDialogOpen(false);
      setTripToDelete(null);
    } catch (error) {
      console.error("Error deleting trip:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el viaje",
        variant: "destructive",
      });
    }
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

  // Get unique values for filters
  const uniqueClientes = Array.from(new Set(trips.map(t => t.cliente).filter(Boolean)));
  const uniqueOperadores = Array.from(new Set(trips.map(t => t.operador).filter(Boolean)));
  const uniqueRutas = Array.from(new Set(trips.map(t => `${t.origen} → ${t.destino}`).filter(Boolean)));

  // Apply filters
  const filteredTrips = trips.filter(trip => {
    if (filters.fechaInicio) {
      const fechaSalida = new Date(trip.fecha_salida);
      const fechaInicio = new Date(filters.fechaInicio);
      if (fechaSalida < fechaInicio) return false;
    }
    
    if (filters.fechaFin) {
      const fechaSalida = new Date(trip.fecha_salida);
      const fechaFin = new Date(filters.fechaFin);
      fechaFin.setHours(23, 59, 59, 999);
      if (fechaSalida > fechaFin) return false;
    }
    
    if (filters.cliente !== "all" && trip.cliente !== filters.cliente) {
      return false;
    }
    
    if (filters.operador !== "all" && trip.operador !== filters.operador) {
      return false;
    }
    
    if (filters.ruta !== "all") {
      const ruta = `${trip.origen} → ${trip.destino}`;
      if (ruta !== filters.ruta) return false;
    }

    if (filters.unidad_negocio !== "all" && trip.unidad_negocio !== filters.unidad_negocio) {
      return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilters({
      fechaInicio: "",
      fechaFin: "",
      cliente: "all",
      operador: "all",
      ruta: "all",
      unidad_negocio: "all",
    });
  };

  const hasActiveFilters = filters.fechaInicio !== "" || filters.fechaFin !== "" || 
    filters.cliente !== "all" || filters.operador !== "all" || filters.ruta !== "all" || 
    filters.unidad_negocio !== "all";

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
        <div className="flex gap-2">
          <Button
            onClick={() => setShowMap(!showMap)}
            variant="outline"
            className="gap-2"
          >
            <MapIcon className="h-4 w-4" />
            {showMap ? "Ocultar Mapa" : "Ver Mapa"}
          </Button>
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
                  <Select
                    value={formData.operador}
                    onValueChange={(value) => setFormData({ ...formData, operador: value })}
                  >
                    <SelectTrigger id="operador">
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingOperadores ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : operadores.length === 0 ? (
                        <SelectItem value="empty" disabled>No hay operadores disponibles</SelectItem>
                      ) : (
                        operadores.map((operador) => (
                          <SelectItem key={operador.id} value={operador.nombre}>
                            {operador.nombre} - {operador.numero_empleado}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad</Label>
                  <Select
                    value={formData.unidad}
                    onValueChange={(value) => setFormData({ ...formData, unidad: value })}
                  >
                    <SelectTrigger id="unidad">
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingUnidades ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : unidades.length === 0 ? (
                        <SelectItem value="empty" disabled>No hay unidades disponibles</SelectItem>
                      ) : (
                        unidades.map((unidad) => (
                          <SelectItem key={unidad.id} value={unidad.numero_economico}>
                            {unidad.numero_economico} - {unidad.tipo_equipo} {unidad.marca} {unidad.modelo}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                <div className="md:col-span-2">
                  {mapboxToken ? (
                    <AddressPicker
                      label="Dirección de carga\u00a0"
                      mapboxToken={mapboxToken}
                      address={formData.direccion_carga}
                      lat={formData.lat_carga}
                      lng={formData.lng_carga}
                      markerColor="#16a34a"
                      onChange={(v) => setFormData((prev) => ({
                        ...prev,
                        direccion_carga: v.address,
                        lat_carga: v.lat,
                        lng_carga: v.lng,
                      }))}
                    />
                  ) : (
                    <p className="text-xs text-muted-foreground">Cargando mapa…</p>
                  )}
                </div>
                <div className="md:col-span-2">
                  {mapboxToken && (
                    <AddressPicker
                      label="Dirección de descarga"
                      mapboxToken={mapboxToken}
                      address={formData.direccion_descarga}
                      lat={formData.lat_descarga}
                      lng={formData.lng_descarga}
                      markerColor="#dc2626"
                      onChange={(v) => setFormData((prev) => ({
                        ...prev,
                        direccion_descarga: v.address,
                        lat_descarga: v.lat,
                        lng_descarga: v.lng,
                      }))}
                    />
                  )}
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
                  <Select
                    value={formData.cliente}
                    onValueChange={(value) => setFormData({ ...formData, cliente: value })}
                  >
                    <SelectTrigger id="cliente">
                      <SelectValue placeholder="Seleccionar cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingClientes ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                      ) : clientes.length === 0 ? (
                        <SelectItem value="empty" disabled>No hay clientes disponibles</SelectItem>
                      ) : (
                        clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.nombre}>
                            {cliente.nombre}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
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
                <div className="space-y-2">
                  <Label htmlFor="unidad-negocio">Unidad de Negocio</Label>
                  <Select
                    value={formData.unidad_negocio}
                    onValueChange={(value) => setFormData({ ...formData, unidad_negocio: value })}
                  >
                    <SelectTrigger id="unidad-negocio">
                      <SelectValue placeholder="Seleccionar unidad de negocio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HH Express">HH Express</SelectItem>
                      <SelectItem value="PORTECALESA">PORTECALESA</SelectItem>
                    </SelectContent>
                  </Select>
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

      {/* Mapa de ubicaciones */}
      {showMap && mapboxToken && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Ubicación de Viajes en Tiempo Real</CardTitle>
            <CardDescription>
              Mapa interactivo con las ubicaciones actuales de los viajes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TripsMap trips={trips} mapboxToken={mapboxToken} />
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Viajes Recientes</CardTitle>
              <CardDescription>Estado actual de las operaciones</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? "Ocultar Filtros" : "Filtrar"}
            </Button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 border rounded-lg space-y-4 bg-muted/30">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-sm">Filtros de Búsqueda</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Limpiar
                  </Button>
                )}
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                  <Input
                    id="fechaInicio"
                    type="date"
                    value={filters.fechaInicio}
                    onChange={(e) => setFilters({ ...filters, fechaInicio: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fechaFin">Fecha Fin</Label>
                  <Input
                    id="fechaFin"
                    type="date"
                    value={filters.fechaFin}
                    onChange={(e) => setFilters({ ...filters, fechaFin: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterCliente">Cliente</Label>
                  <Select
                    value={filters.cliente}
                    onValueChange={(value) => setFilters({ ...filters, cliente: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueClientes.map((cliente) => (
                        <SelectItem key={cliente} value={cliente}>
                          {cliente}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterOperador">Operador</Label>
                  <Select
                    value={filters.operador}
                    onValueChange={(value) => setFilters({ ...filters, operador: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {uniqueOperadores.map((operador) => (
                        <SelectItem key={operador} value={operador}>
                          {operador}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="filterRuta">Ruta</Label>
                  <Select
                    value={filters.ruta}
                    onValueChange={(value) => setFilters({ ...filters, ruta: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {uniqueRutas.map((ruta) => (
                        <SelectItem key={ruta} value={ruta}>
                          {ruta}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="filterUnidadNegocio">Unidad de Negocio</Label>
                  <Select
                    value={filters.unidad_negocio}
                    onValueChange={(value) => setFilters({ ...filters, unidad_negocio: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      <SelectItem value="HH Express">HH Express</SelectItem>
                      <SelectItem value="PORTECALESA">PORTECALESA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {hasActiveFilters && (
                <div className="text-sm text-muted-foreground">
                  Mostrando {filteredTrips.length} de {trips.length} viajes
                </div>
              )}
            </div>
          )}
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
          ) : filteredTrips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No se encontraron viajes con los filtros aplicados
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{trip.unidad}</h4>
                        <Badge variant="outline" className="text-xs">
                          {trip.unidad_negocio}
                        </Badge>
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
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => openDetails(trip)}
                        className="w-full sm:w-auto"
                      >
                        Ver Detalles
                      </Button>
                      {userRole === "admin" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setTripToDelete(trip);
                            setDeleteDialogOpen(true);
                          }}
                          className="w-full sm:w-auto"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Eliminar
                        </Button>
                      )}
                    </div>
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
                {selectedTrip.direccion_carga && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 text-green-600" /> Dirección de carga</Label>
                    <p className="text-sm">{selectedTrip.direccion_carga}</p>
                    {selectedTrip.lat_carga != null && selectedTrip.lng_carga != null && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedTrip.lat_carga},${selectedTrip.lng_carga}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Ver en mapa ({selectedTrip.lat_carga.toFixed(5)}, {selectedTrip.lng_carga.toFixed(5)})
                      </a>
                    )}
                  </div>
                )}
                {selectedTrip.direccion_descarga && (
                  <div className="md:col-span-2">
                    <Label className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3 text-red-600" /> Dirección de descarga</Label>
                    <p className="text-sm">{selectedTrip.direccion_descarga}</p>
                    {selectedTrip.lat_descarga != null && selectedTrip.lng_descarga != null && (
                      <a
                        href={`https://www.google.com/maps?q=${selectedTrip.lat_descarga},${selectedTrip.lng_descarga}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-primary underline"
                      >
                        Ver en mapa ({selectedTrip.lat_descarga.toFixed(5)}, {selectedTrip.lng_descarga.toFixed(5)})
                      </a>
                    )}
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

              {/* Historial de ubicaciones registradas por el operador */}
              <div className="pt-4 border-t">
                <Label className="text-muted-foreground mb-2 block">
                  Historial de ubicaciones (auditoría)
                </Label>
                {mapboxToken ? (
                  <TripLocationHistoryMap viajeId={selectedTrip.id} mapboxToken={mapboxToken} />
                ) : (
                  <p className="text-sm text-muted-foreground">Cargando mapa…</p>
                )}
              </div>

              <div className="pt-4 border-t">
                <Label className="text-muted-foreground mb-2 block">
                  Bitácora de acciones del operador (auditoría)
                </Label>
                <TripAuditLog viajeId={selectedTrip.id} />
              </div>



              
              {/* Botones de cambio de estado */}
              <div className="space-y-3 pt-4 border-t">
                <Label>Cambiar Estado del Viaje</Label>
                <div className="flex gap-2 flex-wrap">
                  {selectedTrip.estado === "programado" && (
                    <Button
                      onClick={() => handleChangeStatus(selectedTrip.id, "en_transito")}
                      className="bg-primary hover:bg-primary/90"
                    >
                      Iniciar Viaje (En Tránsito)
                    </Button>
                  )}
                  
                  {selectedTrip.estado === "en_transito" && (
                    <Button
                      onClick={() => handleChangeStatus(selectedTrip.id, "completado")}
                      className="bg-accent hover:bg-accent/90"
                    >
                      Finalizar Viaje (Completado)
                    </Button>
                  )}

                  {selectedTrip.estado === "programado" && (
                    <Button
                      onClick={() => handleChangeStatus(selectedTrip.id, "cancelado")}
                      variant="destructive"
                    >
                      Cancelar Viaje
                    </Button>
                  )}
                </div>
                {selectedTrip.estado === "completado" && (
                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-sm text-accent-foreground font-medium">
                      ✓ Viaje completado - Disponible para liquidación
                    </p>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar Viaje?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el viaje. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
