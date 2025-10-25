import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, QrCode, Camera, CheckCircle2, Clock, MapPin } from "lucide-react";

export default function SecurityRounds() {
  const rounds = [
    {
      id: "R001",
      zone: "Zona A - Almacén Principal",
      status: "completed",
      guard: "José Martínez",
      time: "08:30",
      checkpoints: 12,
      incidents: 0,
    },
    {
      id: "R002",
      zone: "Zona B - Patio de Maniobras",
      status: "in-progress",
      guard: "Ana Rodríguez",
      time: "09:15",
      checkpoints: 8,
      incidents: 0,
    },
    {
      id: "R003",
      zone: "Zona C - Perímetro Exterior",
      status: "pending",
      guard: "Por asignar",
      time: "10:00",
      checkpoints: 15,
      incidents: 0,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-accent text-accent-foreground">Completado</Badge>;
      case "in-progress":
        return <Badge className="bg-secondary text-secondary-foreground">En Progreso</Badge>;
      case "pending":
        return <Badge variant="outline">Pendiente</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-lg">
            <Shield className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Rondines de Seguridad</h1>
            <p className="text-muted-foreground">Inspección de instalaciones con registro QR</p>
          </div>
        </div>
        <Button className="bg-primary hover:bg-primary/90">
          <QrCode className="h-4 w-4 mr-2" />
          Iniciar Nuevo Rondín
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rondines Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">8</div>
            <p className="text-xs text-muted-foreground mt-1">6 completados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Checkpoints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">95</div>
            <p className="text-xs text-muted-foreground mt-1">87 verificados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">2</div>
            <p className="text-xs text-muted-foreground mt-1">Documentados hoy</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Rondines Programados</CardTitle>
          <CardDescription>Estado actual de los rondines de seguridad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rounds.map((round) => (
              <div
                key={round.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-foreground">{round.zone}</h3>
                      {getStatusBadge(round.status)}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{round.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{round.time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>{round.checkpoints} checkpoints</span>
                      </div>
                    </div>
                  </div>
                  {round.status === "in-progress" && (
                    <Button size="sm" className="bg-primary hover:bg-primary/90">
                      <Camera className="h-4 w-4 mr-2" />
                      Continuar
                    </Button>
                  )}
                  {round.status === "pending" && (
                    <Button size="sm" variant="outline">
                      Iniciar
                    </Button>
                  )}
                  {round.status === "completed" && (
                    <Button size="sm" variant="ghost">
                      Ver Reporte
                    </Button>
                  )}
                </div>
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Guardia: {round.guard}</span>
                    {round.incidents > 0 && (
                      <Badge variant="destructive">{round.incidents} incidentes</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <QrCode className="h-5 w-5" />
            Cómo Funciona el Sistema de Rondines
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</div>
            <p>El guardia escanea códigos QR ubicados en puntos estratégicos de las instalaciones</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</div>
            <p>Cada escaneo registra la hora exacta y ubicación del checkpoint verificado</p>
          </div>
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</div>
            <p>Si detecta un incidente, puede tomar fotografías y agregar observaciones en tiempo real</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
