import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Wine, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Breathalyzer() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const tests = [
    {
      id: "AL-001",
      person: "Juan Pérez García",
      type: "operator",
      date: "2024-10-25",
      time: "08:00",
      result: "0.00",
      status: "pass",
    },
    {
      id: "AL-002",
      person: "María González López",
      type: "operator",
      date: "2024-10-25",
      time: "08:15",
      result: "0.00",
      status: "pass",
    },
    {
      id: "AL-003",
      person: "Carlos Rodríguez",
      type: "visitor",
      date: "2024-10-25",
      time: "09:30",
      result: "0.02",
      status: "fail",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Prueba de alcoholímetro registrada exitosamente");
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Wine className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pruebas de Alcoholímetro</h1>
            <p className="text-muted-foreground">Control de alcohol para personal que ingresa</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Wine className="h-4 w-4 mr-2" />
              Nueva Prueba
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Prueba de Alcoholímetro</DialogTitle>
              <DialogDescription>Complete la información de la prueba</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="person-type">Tipo de Personal</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operator">Operador</SelectItem>
                      <SelectItem value="visitor">Visitante</SelectItem>
                      <SelectItem value="provider">Proveedor</SelectItem>
                      <SelectItem value="staff">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="person-name">Nombre Completo</Label>
                  <Input id="person-name" placeholder="Nombre de la persona" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-date">Fecha</Label>
                  <Input id="test-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-time">Hora</Label>
                  <Input id="test-time" type="time" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result">Resultado (g/dL)</Label>
                  <Input id="result" type="number" step="0.01" placeholder="0.00" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device">Dispositivo</Label>
                  <Input id="device" placeholder="ID del alcoholímetro" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="tester">Aplicador de Prueba</Label>
                  <Input id="tester" placeholder="Nombre del guardia/aplicador" required />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Límite permitido:</strong> 0.00 g/dL para operadores. Cualquier resultado positivo 
                  debe ser documentado y seguir el protocolo de seguridad.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Registrar Prueba
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">45</div>
            <p className="text-xs text-muted-foreground mt-1">43 aprobadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">43</div>
            <p className="text-xs text-muted-foreground mt-1">95.6% de cumplimiento</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">No Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">2</div>
            <p className="text-xs text-muted-foreground mt-1">Protocolo aplicado</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1,234</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Pruebas</CardTitle>
          <CardDescription>Historial de pruebas de alcoholímetro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tests.map((test) => (
              <div
                key={test.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{test.person}</h4>
                      {test.status === "pass" && (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Aprobado
                        </Badge>
                      )}
                      {test.status === "fail" && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          No Aprobado
                        </Badge>
                      )}
                      {test.status === "warning" && (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Advertencia
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground capitalize">• {test.type}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{test.date} • {test.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Wine className="h-4 w-4" />
                        <span>Resultado: {test.result} g/dL • {test.id}</span>
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
