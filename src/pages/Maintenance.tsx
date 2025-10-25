import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wrench, Calendar, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Maintenance() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const maintenanceRecords = [
    {
      id: "MNT-001",
      unit: "TRC-001",
      type: "Preventivo",
      date: "2024-10-20",
      cost: "$15,000",
      status: "completed",
      description: "Cambio de aceite y filtros, revisión general",
    },
    {
      id: "MNT-002",
      unit: "REM-234",
      type: "Correctivo",
      date: "2024-10-22",
      cost: "$28,500",
      status: "in-progress",
      description: "Reparación de sistema de frenos",
    },
    {
      id: "MNT-003",
      unit: "TRC-005",
      type: "Rescate Carretero",
      date: "2024-10-24",
      cost: "$12,000",
      status: "completed",
      description: "Asistencia carretera km 450 autopista",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Mantenimiento registrado exitosamente");
    setIsDialogOpen(false);
  };

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
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trc1">TRC-001 - Tracto</SelectItem>
                      <SelectItem value="rem1">REM-234 - Remolque</SelectItem>
                      <SelectItem value="trc2">TRC-002 - Tracto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maintenance-type">Tipo de Mantenimiento</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
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
                  <Input id="maintenance-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="odometer">Odómetro (km)</Label>
                  <Input id="odometer" type="number" placeholder="150000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cost">Costo</Label>
                  <Input id="cost" type="number" placeholder="15000" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Proveedor/Taller</Label>
                  <Input id="provider" placeholder="Nombre del taller" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Servicio</Label>
                <Textarea
                  id="description"
                  placeholder="Detalle los trabajos realizados..."
                  rows={4}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="next-maintenance">Próximo Mantenimiento (km)</Label>
                <Input id="next-maintenance" type="number" placeholder="180000" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Registrar Mantenimiento
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
            <div className="text-3xl font-bold text-foreground">18</div>
            <p className="text-xs text-muted-foreground mt-1">12 preventivos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">3</div>
            <p className="text-xs text-muted-foreground mt-1">Unidades en taller</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Programados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">7</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 30 días</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Costo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$245K</div>
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
          <div className="space-y-3">
            {maintenanceRecords.map((record) => (
              <div
                key={record.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{record.unit}</h4>
                      <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                        {record.status === "completed" ? "Completado" : "En Proceso"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">• {record.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{record.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{record.date}</span>
                      </div>
                      <span>•</span>
                      <span>Costo: {record.cost}</span>
                      <span>•</span>
                      <span>{record.id}</span>
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
