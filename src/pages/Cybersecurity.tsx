import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertTriangle, CheckCircle, Lock, Key, Database } from "lucide-react";

export default function Cybersecurity() {
  const securityMetrics = [
    {
      category: "Autenticación",
      status: "secure",
      items: [
        { name: "Contraseñas robustas", status: "pass" },
        { name: "Autenticación de dos factores", status: "pass" },
        { name: "Cambio periódico de contraseñas", status: "warning" },
      ],
    },
    {
      category: "Acceso a Datos",
      status: "secure",
      items: [
        { name: "Control de acceso basado en roles", status: "pass" },
        { name: "Registro de auditoría", status: "pass" },
        { name: "Cifrado de datos sensibles", status: "pass" },
      ],
    },
    {
      category: "Red y Comunicaciones",
      status: "warning",
      items: [
        { name: "Firewall activo", status: "pass" },
        { name: "VPN para acceso remoto", status: "pass" },
        { name: "Monitoreo de tráfico", status: "warning" },
      ],
    },
  ];

  const recentEvents = [
    {
      date: "2024-10-25",
      time: "09:30",
      event: "Intento de acceso no autorizado bloqueado",
      severity: "medium",
      user: "usuario.desconocido@external.com",
    },
    {
      date: "2024-10-24",
      time: "14:15",
      event: "Actualización de contraseña exitosa",
      severity: "low",
      user: "juan.perez@transporte.com",
    },
    {
      date: "2024-10-23",
      time: "11:20",
      event: "Escaneo de vulnerabilidades completado",
      severity: "low",
      user: "Sistema",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <ShieldCheck className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ciberseguridad</h1>
          <p className="text-muted-foreground">Monitoreo y protección de sistemas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estado General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-8 w-8 text-accent" />
              <div>
                <div className="text-2xl font-bold text-accent">Seguro</div>
                <p className="text-xs text-muted-foreground">95% cumplimiento</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Amenazas Bloqueadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">127</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Usuarios Activos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">48</div>
            <p className="text-xs text-muted-foreground mt-1">Con acceso al sistema</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Última Auditoría</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">5</div>
            <p className="text-xs text-muted-foreground mt-1">días atrás</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Métricas de Seguridad</CardTitle>
            <CardDescription>Estado de los controles de ciberseguridad</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {securityMetrics.map((metric, index) => (
              <div key={index} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      metric.status === "secure" ? "bg-accent/10" : "bg-secondary/10"
                    }`}>
                      <Lock className={`h-4 w-4 ${
                        metric.status === "secure" ? "text-accent" : "text-secondary"
                      }`} />
                    </div>
                    <h4 className="font-semibold text-foreground">{metric.category}</h4>
                  </div>
                  {metric.status === "secure" && (
                    <Badge className="bg-accent text-accent-foreground">Seguro</Badge>
                  )}
                  {metric.status === "warning" && (
                    <Badge variant="secondary">Requiere Atención</Badge>
                  )}
                </div>
                <div className="pl-11 space-y-2">
                  {metric.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.name}</span>
                      {item.status === "pass" && (
                        <CheckCircle className="h-4 w-4 text-accent" />
                      )}
                      {item.status === "warning" && (
                        <AlertTriangle className="h-4 w-4 text-secondary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Eventos Recientes</CardTitle>
            <CardDescription>Registro de actividades de seguridad</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {event.severity === "high" && (
                        <div className="p-1.5 bg-destructive/10 rounded">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        </div>
                      )}
                      {event.severity === "medium" && (
                        <div className="p-1.5 bg-secondary/10 rounded">
                          <AlertTriangle className="h-4 w-4 text-secondary" />
                        </div>
                      )}
                      {event.severity === "low" && (
                        <div className="p-1.5 bg-muted rounded">
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground text-sm">{event.event}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {event.date} • {event.time}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground pl-9">Usuario: {event.user}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Gestión de Accesos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 mb-2">
              Administrar Usuarios
            </Button>
            <Button variant="outline" className="w-full mb-2">
              Revisar Permisos
            </Button>
            <Button variant="outline" className="w-full">
              Auditoría de Accesos
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Protección de Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 mb-2">
              Respaldo de Datos
            </Button>
            <Button variant="outline" className="w-full mb-2">
              Cifrado de Archivos
            </Button>
            <Button variant="outline" className="w-full">
              Recuperación de Datos
            </Button>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Análisis de Vulnerabilidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button className="w-full bg-primary hover:bg-primary/90 mb-2">
              Escanear Sistema
            </Button>
            <Button variant="outline" className="w-full mb-2">
              Ver Reportes
            </Button>
            <Button variant="outline" className="w-full">
              Actualizar Parches
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
