import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Truck, Search, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export default function Inventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { user, clientId } = useAuth();
  const queryClient = useQueryClient();

  const { data: units = [], isLoading } = useQuery({
    queryKey: ["unidades"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (!user || !clientId) throw new Error("No authenticated user");
      
      const { data, error } = await supabase
        .from("unidades")
        .insert({
          numero_economico: formData.get("unit-id") as string,
          tipo: formData.get("unit-type") as string,
          marca: formData.get("brand") as string,
          modelo: formData.get("model") as string,
          placas: formData.get("plates") as string,
          odometro: parseInt(formData.get("initial-odometer") as string),
          ubicacion: formData.get("location") as string,
          estado: formData.get("status") as string,
          client_id: clientId,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unidades"] });
      toast.success("Unidad agregada exitosamente");
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al agregar unidad");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createUnitMutation.mutate(formData);
  };

  const filteredUnits = units.filter((unit) =>
    unit.numero_economico?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.tipo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    unit.ubicacion?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: units.length,
    operational: units.filter(u => u.estado === 'disponible').length,
    tractos: units.filter(u => u.tipo?.toLowerCase().includes('tracto')).length,
    remolques: units.filter(u => u.tipo?.toLowerCase().includes('remolque')).length,
    maintenance: units.filter(u => u.requiere_mantenimiento).length,
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "disponible":
        return <Badge className="bg-accent text-accent-foreground">Disponible</Badge>;
      case "en_viaje":
        return <Badge className="bg-primary text-primary-foreground">En Viaje</Badge>;
      case "mantenimiento":
        return <Badge className="bg-secondary text-secondary-foreground">Mantenimiento</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Package className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventario de Equipo</h1>
            <p className="text-muted-foreground">Control de unidades, tractos y remolques</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Truck className="h-4 w-4 mr-2" />
              Agregar Unidad
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nueva Unidad</DialogTitle>
              <DialogDescription>Registre una nueva unidad en el inventario</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="unit-id">Número Económico</Label>
                  <Input id="unit-id" name="unit-id" placeholder="TRC-001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-type">Tipo de Unidad</Label>
                  <Select name="unit-type" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tracto">Tracto</SelectItem>
                      <SelectItem value="Remolque">Remolque</SelectItem>
                      <SelectItem value="Dolly">Dolly</SelectItem>
                      <SelectItem value="Caja">Caja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" name="brand" placeholder="Freightliner, Kenworth, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" name="model" placeholder="2020" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plates">Placas</Label>
                  <Input id="plates" name="plates" placeholder="ABC-123-D" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial-odometer">Odómetro Inicial (km)</Label>
                  <Input id="initial-odometer" name="initial-odometer" type="number" placeholder="0" defaultValue="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" name="location" placeholder="Patio Principal" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select name="status" defaultValue="disponible" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="disponible">Disponible</SelectItem>
                      <SelectItem value="en_viaje">En Viaje</SelectItem>
                      <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Agregar Unidad
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Unidades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.operational} disponibles</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tractos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.tractos}</div>
            <p className="text-xs text-muted-foreground mt-1">En inventario</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remolques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.remolques}</div>
            <p className="text-xs text-muted-foreground mt-1">En inventario</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.maintenance}</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Unidades</CardTitle>
              <CardDescription>Estado actual del inventario</CardDescription>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar unidad..." 
                className="pl-10 w-64"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando inventario...</div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "No se encontraron unidades" : "No hay unidades registradas. Agrega la primera unidad."}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg">
                        <Truck className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-foreground">{unit.numero_economico}</h4>
                          {getStatusBadge(unit.estado)}
                          <span className="text-sm text-muted-foreground">• {unit.tipo}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{unit.marca} {unit.modelo}</span>
                          {unit.placas && (
                            <>
                              <span>•</span>
                              <span>Placas: {unit.placas}</span>
                            </>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{unit.ubicacion}</span>
                          </div>
                          {unit.ultima_entrada && (
                            <>
                              <span>•</span>
                              <span>Última entrada: {new Date(unit.ultima_entrada).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver Detalles
                    </Button>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        {unit.requiere_mantenimiento ? (
                          <AlertCircle className="h-4 w-4 text-destructive" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-accent" />
                        )}
                        <span className="text-muted-foreground">
                          {unit.requiere_mantenimiento ? "Requiere mantenimiento" : "Mantenimiento al día"}
                        </span>
                      </div>
                      <div className="text-muted-foreground">
                        Odómetro: {unit.odometro?.toLocaleString() ?? 'N/A'} km
                      </div>
                    </div>
                    {unit.requiere_mantenimiento && (
                      <Badge variant="destructive">Atención requerida</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
