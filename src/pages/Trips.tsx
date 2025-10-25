import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Calendar, Truck } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Trips() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const trips = [
    {
      id: "VJ-001",
      operator: "Juan Pérez",
      unit: "TRC-001",
      origin: "Monterrey, NL",
      destination: "CDMX",
      startDate: "2024-10-20",
      endDate: "2024-10-22",
      distance: "920 km",
      status: "completed",
    },
    {
      id: "VJ-002",
      operator: "María González",
      unit: "TRC-002",
      origin: "Guadalajara, JAL",
      destination: "Tijuana, BC",
      startDate: "2024-10-24",
      endDate: null,
      distance: "2,150 km",
      status: "in-transit",
    },
    {
      id: "VJ-003",
      operator: "Carlos Rodríguez",
      unit: "TRC-005",
      origin: "CDMX",
      destination: "Mérida, YUC",
      startDate: "2024-10-26",
      endDate: null,
      distance: "1,550 km",
      status: "scheduled",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Viaje registrado exitosamente");
    setIsDialogOpen(false);
  };

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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Viaje</DialogTitle>
              <DialogDescription>Complete la información del viaje</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operator">Operador</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar operador" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="op1">Juan Pérez García</SelectItem>
                      <SelectItem value="op2">María González López</SelectItem>
                      <SelectItem value="op3">Carlos Rodríguez</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trc1">TRC-001</SelectItem>
                      <SelectItem value="trc2">TRC-002</SelectItem>
                      <SelectItem value="trc3">TRC-005</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="origin">Origen</Label>
                  <Input id="origin" placeholder="Ciudad, Estado" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="destination">Destino</Label>
                  <Input id="destination" placeholder="Ciudad, Estado" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de Salida</Label>
                  <Input id="start-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="estimated-arrival">Llegada Estimada</Label>
                  <Input id="estimated-arrival" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="distance">Distancia (km)</Label>
                  <Input id="distance" type="number" placeholder="920" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="freight">Flete ($)</Label>
                  <Input id="freight" type="number" placeholder="25000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client">Cliente</Label>
                  <Input id="client" placeholder="Nombre del cliente" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="branch">Sucursal</Label>
                  <Input id="branch" placeholder="Sucursal" required />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Registrar Viaje
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
            <div className="text-3xl font-bold text-foreground">156</div>
            <p className="text-xs text-muted-foreground mt-1">142 completados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Tránsito</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">12</div>
            <p className="text-xs text-muted-foreground mt-1">Activos ahora</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 7 días</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Km Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">143K</div>
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
          <div className="space-y-3">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{trip.id}</h4>
                      {trip.status === "completed" && (
                        <Badge className="bg-accent text-accent-foreground">Completado</Badge>
                      )}
                      {trip.status === "in-transit" && (
                        <Badge className="bg-primary text-primary-foreground">En Tránsito</Badge>
                      )}
                      {trip.status === "scheduled" && (
                        <Badge variant="outline">Programado</Badge>
                      )}
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{trip.origin} → {trip.destination}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4" />
                          <span>{trip.unit} • {trip.operator}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Salida: {trip.startDate}</span>
                        </div>
                        <span>•</span>
                        <span>{trip.distance}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Ver Detalles
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
