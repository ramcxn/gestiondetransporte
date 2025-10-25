import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tag, Plus, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function SecuritySeals() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const seals = [
    {
      folio: "SEL-2024-001",
      status: "available",
      assignedTo: null,
      date: null,
    },
    {
      folio: "SEL-2024-002",
      status: "assigned",
      assignedTo: "TRC-001",
      date: "2024-10-25",
    },
    {
      folio: "SEL-2024-003",
      status: "available",
      assignedTo: null,
      date: null,
    },
    {
      folio: "SEL-2024-004",
      status: "assigned",
      assignedTo: "REM-234",
      date: "2024-10-24",
    },
    {
      folio: "SEL-2024-005",
      status: "used",
      assignedTo: "TRC-002",
      date: "2024-10-20",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Sellos registrados exitosamente");
    setIsDialogOpen(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Tag className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inventario de Sellos de Seguridad</h1>
            <p className="text-muted-foreground">Control de folios y asignación</p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Registrar Sellos
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Registrar Nuevos Sellos</DialogTitle>
              <DialogDescription>Ingrese el rango de folios de los sellos</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="prefix">Prefijo</Label>
                  <Input id="prefix" placeholder="SEL-2024-" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="batch">Lote</Label>
                  <Input id="batch" placeholder="LOTE-001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="start-number">Número Inicial</Label>
                  <Input id="start-number" type="number" placeholder="001" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end-number">Número Final</Label>
                  <Input id="end-number" type="number" placeholder="100" required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="supplier">Proveedor</Label>
                  <Input id="supplier" placeholder="Nombre del proveedor" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchase-date">Fecha de Compra</Label>
                  <Input id="purchase-date" type="date" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad</Label>
                  <Input id="quantity" type="number" placeholder="100" required />
                </div>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Los sellos registrados estarán disponibles para asignación a las unidades.
                  Asegúrese de que los folios sean consecutivos y únicos.
                </p>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-primary hover:bg-primary/90">
                  Registrar Sellos
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sellos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">1,250</div>
            <p className="text-xs text-muted-foreground mt-1">En inventario</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">842</div>
            <p className="text-xs text-muted-foreground mt-1">Sin asignar</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Asignados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">358</div>
            <p className="text-xs text-muted-foreground mt-1">En uso activo</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Utilizados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">50</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Registro de Sellos</CardTitle>
              <CardDescription>Estado actual del inventario</CardDescription>
            </div>
            <Input placeholder="Buscar folio..." className="w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {seals.map((seal) => (
              <div
                key={seal.folio}
                className="flex items-center justify-between p-3 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-muted rounded-lg">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3">
                      <p className="font-medium text-foreground">{seal.folio}</p>
                      {seal.status === "available" && (
                        <Badge className="bg-accent text-accent-foreground">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Disponible
                        </Badge>
                      )}
                      {seal.status === "assigned" && (
                        <Badge className="bg-primary text-primary-foreground">Asignado</Badge>
                      )}
                      {seal.status === "used" && (
                        <Badge variant="secondary">Utilizado</Badge>
                      )}
                    </div>
                    {seal.assignedTo && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Asignado a: {seal.assignedTo} • {seal.date}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {seal.status === "available" && (
                    <Button size="sm" variant="outline">
                      Asignar
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Ver Historial
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <AlertCircle className="h-5 w-5 text-accent" />
            Reposición de Inventario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            El inventario actual está en nivel óptimo. Se recomienda realizar un pedido cuando
            el inventario disponible sea menor a 500 unidades.
          </p>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: "67%" }} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">842 de 1,250 sellos disponibles (67%)</p>
        </CardContent>
      </Card>
    </div>
  );
}
