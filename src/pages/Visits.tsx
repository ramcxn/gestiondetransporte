import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, Camera, UserPlus, Building2 } from "lucide-react";

export default function Visits() {
  const [visitorType, setVisitorType] = useState<"visitante" | "proveedor">("visitante");

  const recentVisits = [
    {
      id: "V001",
      name: "Carlos Hernández",
      type: "visitante",
      company: "ABC Logistics",
      time: "09:30",
      status: "active",
    },
    {
      id: "V002",
      name: "María González",
      type: "proveedor",
      company: "Proveedora del Norte",
      time: "08:15",
      status: "completed",
    },
    {
      id: "V003",
      name: "Roberto Sánchez",
      type: "visitante",
      company: "Tech Solutions",
      time: "10:45",
      status: "active",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`${visitorType === "visitante" ? "Visitante" : "Proveedor"} registrado exitosamente`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Users className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Visitas y Proveedores</h1>
          <p className="text-muted-foreground">Control de acceso con registro fotográfico</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Visitas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">12</div>
            <p className="text-xs text-muted-foreground mt-1">5 activas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Proveedores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">2 en instalaciones</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Promedio Diario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">18</div>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Nuevo Registro</CardTitle>
                <CardDescription>Ingrese los datos del visitante o proveedor</CardDescription>
              </div>
              <Select value={visitorType} onValueChange={(value: "visitante" | "proveedor") => setVisitorType(value)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visitante">Visitante</SelectItem>
                  <SelectItem value="proveedor">Proveedor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input id="name" placeholder="Ingrese el nombre" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company">Empresa</Label>
                <Input id="company" placeholder="Nombre de la empresa" required />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="id-type">Tipo de Identificación</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ine">INE</SelectItem>
                      <SelectItem value="pasaporte">Pasaporte</SelectItem>
                      <SelectItem value="licencia">Licencia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="id-number">Número de Identificación</Label>
                  <Input id="id-number" placeholder="Número" required />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Fotografía de Identificación</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <Camera className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click para capturar o subir fotografía de la credencial
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Motivo de Visita</Label>
                <Input id="purpose" placeholder="Descripción breve" required />
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
                <UserPlus className="h-4 w-4 mr-2" />
                Registrar {visitorType === "visitante" ? "Visitante" : "Proveedor"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Visitas Recientes</CardTitle>
            <CardDescription>Últimos registros de hoy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentVisits.map((visit) => (
                <div
                  key={visit.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-full">
                        {visit.type === "proveedor" ? (
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Users className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{visit.name}</h4>
                        <p className="text-sm text-muted-foreground">{visit.company}</p>
                      </div>
                    </div>
                    <Badge variant={visit.status === "active" ? "default" : "outline"}>
                      {visit.status === "active" ? "Activo" : "Salió"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <span className="text-muted-foreground">Ingreso: {visit.time}</span>
                    <span className="text-xs bg-muted px-2 py-1 rounded">
                      {visit.id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
