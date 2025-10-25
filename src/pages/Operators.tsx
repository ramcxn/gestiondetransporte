import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserCheck, Upload, Calendar, FileText, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Operators() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const operators = [
    {
      id: "OP-001",
      name: "Juan Pérez García",
      contract: "Vigente",
      startDate: "2023-01-15",
      endDate: "2025-01-15",
      address: "Calle Principal #123, Monterrey, NL",
      status: "active",
    },
    {
      id: "OP-002",
      name: "María González López",
      contract: "Por vencer",
      startDate: "2022-06-01",
      endDate: "2024-12-01",
      address: "Av. Reforma #456, Guadalajara, JAL",
      status: "expiring",
    },
    {
      id: "OP-003",
      name: "Carlos Rodríguez Sánchez",
      contract: "Vigente",
      startDate: "2023-09-10",
      endDate: "2025-09-10",
      address: "Col. Industrial #789, CDMX",
      status: "active",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Operador registrado exitosamente");
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <UserCheck className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión del Operador</h1>
            <p className="text-muted-foreground">Control de contratos y documentación</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <UserCheck className="h-4 w-4 mr-2" />
              Nuevo Operador
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevo Operador</DialogTitle>
              <DialogDescription>Complete la información del operador y su contrato</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="operator-name">Nombre Completo</Label>
                  <Input id="operator-name" placeholder="Nombre del operador" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="operator-id">ID Empleado</Label>
                  <Input id="operator-id" placeholder="OP-XXX" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-date">Fecha de Alta</Label>
                  <Input id="start-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-date">Vencimiento de Contrato</Label>
                  <Input id="end-date" type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input id="address" placeholder="Dirección completa" required />
              </div>
              <div className="space-y-2">
                <Label>Documentos del Contrato (PDF)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click para subir documentos en PDF</p>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Registrar Operador
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Operadores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">32</div>
            <p className="text-xs text-muted-foreground mt-1">28 activos</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contratos por Vencer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">4</div>
            <p className="text-xs text-muted-foreground mt-1">Próximos 60 días</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En Capacitación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-1">Nuevos ingresos</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Operadores</CardTitle>
          <CardDescription>Información de contratos y documentación</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {operators.map((operator) => (
              <div
                key={operator.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{operator.name}</h4>
                      <Badge variant={operator.status === "active" ? "default" : "secondary"}>
                        {operator.contract}
                      </Badge>
                      <span className="text-sm text-muted-foreground">• {operator.id}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Alta: {operator.startDate} • Vence: {operator.endDate}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{operator.address}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Ver Documentos
                    </Button>
                    <Button size="sm" variant="outline">
                      Editar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
