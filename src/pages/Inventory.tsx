import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Package, Truck, Search, AlertCircle, CheckCircle, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Inventory() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Unidad agregada exitosamente");
    setIsDialogOpen(false);
  };

  const units = [
    {
      id: "TRC-001",
      type: "Tracto",
      status: "operational",
      location: "Patio Principal",
      maintenance: "ok",
      lastEntry: "Hoy 08:30",
      odometer: 145000,
    },
    {
      id: "REM-234",
      type: "Remolque",
      status: "maintenance",
      location: "Taller",
      maintenance: "due",
      lastEntry: "Ayer 16:45",
      odometer: 182000,
    },
    {
      id: "TRC-002",
      type: "Tracto",
      status: "in-transit",
      location: "Ruta Nacional",
      maintenance: "ok",
      lastEntry: "Hace 2 días",
      odometer: 98000,
    },
    {
      id: "REM-567",
      type: "Remolque",
      status: "operational",
      location: "Patio Principal",
      maintenance: "ok",
      lastEntry: "Hoy 09:15",
      odometer: 156000,
    },
    {
      id: "DOL-089",
      type: "Dolly",
      status: "operational",
      location: "Patio B",
      maintenance: "scheduled",
      lastEntry: "Hoy 07:00",
      odometer: 67000,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-accent text-accent-foreground">Operativo</Badge>;
      case "maintenance":
        return <Badge className="bg-secondary text-secondary-foreground">Mantenimiento</Badge>;
      case "in-transit":
        return <Badge className="bg-primary text-primary-foreground">En Ruta</Badge>;
      default:
        return null;
    }
  };

  const getMaintenanceIcon = (maintenance: string) => {
    switch (maintenance) {
      case "ok":
        return <CheckCircle className="h-4 w-4 text-accent" />;
      case "due":
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      case "scheduled":
        return <AlertCircle className="h-4 w-4 text-secondary" />;
      default:
        return null;
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
                  <Label htmlFor="unit-id">ID de Unidad</Label>
                  <Input id="unit-id" placeholder="TRC-XXX o REM-XXX" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit-type">Tipo de Unidad</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tracto">Tracto</SelectItem>
                      <SelectItem value="remolque">Remolque</SelectItem>
                      <SelectItem value="dolly">Dolly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Marca</Label>
                  <Input id="brand" placeholder="Freightliner, Kenworth, etc." required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input id="model" placeholder="2020" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plates">Placas</Label>
                  <Input id="plates" placeholder="ABC-123-D" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="initial-odometer">Odómetro Inicial (km)</Label>
                  <Input id="initial-odometer" type="number" placeholder="0" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Ubicación</Label>
                  <Input id="location" placeholder="Patio Principal" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Estado</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operativo</SelectItem>
                      <SelectItem value="maintenance">Mantenimiento</SelectItem>
                      <SelectItem value="in-transit">En Ruta</SelectItem>
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
            <div className="text-3xl font-bold text-foreground">45</div>
            <p className="text-xs text-muted-foreground mt-1">38 operativas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tractos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">18</div>
            <p className="text-xs text-muted-foreground mt-1">16 disponibles</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Remolques</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">24</div>
            <p className="text-xs text-muted-foreground mt-1">20 disponibles</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">3</div>
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
              <Input placeholder="Buscar unidad..." className="pl-10 w-64" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {units.map((unit) => (
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
                        <h4 className="font-semibold text-foreground">{unit.id}</h4>
                        {getStatusBadge(unit.status)}
                        <span className="text-sm text-muted-foreground">• {unit.type}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{unit.location}</span>
                        </div>
                        <span>•</span>
                        <span>Último ingreso: {unit.lastEntry}</span>
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
                      {getMaintenanceIcon(unit.maintenance)}
                      <span className="text-muted-foreground">
                        {unit.maintenance === "ok"
                          ? "Mantenimiento al día"
                          : unit.maintenance === "due"
                          ? "Requiere mantenimiento"
                          : "Mantenimiento programado"}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      Odómetro: {unit.odometer.toLocaleString()} km
                    </div>
                  </div>
                  {unit.maintenance === "due" && (
                    <Badge variant="destructive">Atención requerida</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
