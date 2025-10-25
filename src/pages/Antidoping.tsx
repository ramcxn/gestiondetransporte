import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FlaskConical, Calendar, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function Antidoping() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const tests = [
    {
      id: "AD-001",
      operator: "Juan Pérez García",
      date: "2024-10-20",
      time: "08:30",
      result: "negative",
      type: "Random",
      lab: "Laboratorio Certificado SA",
    },
    {
      id: "AD-002",
      operator: "María González López",
      date: "2024-10-19",
      time: "09:15",
      result: "negative",
      type: "Pre-employment",
      lab: "Laboratorio Certificado SA",
    },
    {
      id: "AD-003",
      operator: "Carlos Rodríguez",
      date: "2024-10-18",
      time: "14:00",
      result: "pending",
      type: "Random",
      lab: "Laboratorio Certificado SA",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Prueba de antidoping registrada exitosamente");
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <FlaskConical className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Antidoping</h1>
            <p className="text-muted-foreground">Control de pruebas según requisitos CTPAT</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <FlaskConical className="h-4 w-4 mr-2" />
              Nueva Prueba
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Prueba de Antidoping</DialogTitle>
              <DialogDescription>Complete la información según requisitos CTPAT</DialogDescription>
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
                  <Label htmlFor="test-type">Tipo de Prueba</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="pre-employment">Pre-employment</SelectItem>
                      <SelectItem value="post-accident">Post-accident</SelectItem>
                      <SelectItem value="reasonable-suspicion">Reasonable Suspicion</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-date">Fecha de Prueba</Label>
                  <Input id="test-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="test-time">Hora</Label>
                  <Input id="test-time" type="time" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="lab">Laboratorio Certificado</Label>
                  <Input id="lab" placeholder="Nombre del laboratorio" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sample-id">ID de Muestra</Label>
                  <Input id="sample-id" placeholder="Número de muestra" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="collector">Recolector</Label>
                  <Input id="collector" placeholder="Nombre del recolector" required />
                </div>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Pruebas este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">28</div>
            <p className="text-xs text-muted-foreground mt-1">25 completadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">25</div>
            <p className="text-xs text-muted-foreground mt-1">100% de cumplimiento</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">3</div>
            <p className="text-xs text-muted-foreground mt-1">En laboratorio</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Próximas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">5</div>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Registro de Pruebas</CardTitle>
          <CardDescription>Historial de pruebas de antidoping CTPAT</CardDescription>
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
                      <h4 className="font-semibold text-foreground">{test.operator}</h4>
                      {test.result === "negative" && (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Negativo
                        </Badge>
                      )}
                      {test.result === "positive" && (
                        <Badge variant="destructive">
                          <XCircle className="h-3 w-3 mr-1" />
                          Positivo
                        </Badge>
                      )}
                      {test.result === "pending" && (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">• {test.type}</span>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{test.date} • {test.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FlaskConical className="h-4 w-4" />
                        <span>{test.lab} • {test.id}</span>
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
