import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Shield, AlertTriangle, Package, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const stats = [
    {
      title: "Unidades Activas",
      value: "45",
      change: "+3 esta semana",
      icon: Truck,
      trend: "up",
    },
    {
      title: "Operadores",
      value: "32",
      change: "2 en capacitación",
      icon: Users,
      trend: "up",
    },
    {
      title: "Rondines Hoy",
      value: "8",
      change: "6 completados",
      icon: Shield,
      trend: "neutral",
    },
    {
      title: "Alertas Pendientes",
      value: "3",
      change: "Requieren atención",
      icon: AlertTriangle,
      trend: "down",
    },
  ];

  const recentActivity = [
    {
      type: "Unidad Ingresada",
      description: "Tracto MX-1234 ingresó con inspección completa",
      time: "Hace 15 minutos",
      status: "success",
    },
    {
      type: "Rondín Completado",
      description: "Rondín de seguridad zona A completado",
      time: "Hace 30 minutos",
      status: "success",
    },
    {
      type: "Mantenimiento Programado",
      description: "Remolque REM-567 requiere mantenimiento",
      time: "Hace 1 hora",
      status: "warning",
    },
    {
      type: "Visita Registrada",
      description: "Proveedor ABC Company registrado",
      time: "Hace 2 horas",
      status: "info",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-br from-primary to-accent p-8 text-primary-foreground shadow-elevated">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-background/10 rounded-lg backdrop-blur-sm">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Panel de Control CTPAT</h1>
            <p className="text-primary-foreground/80 mt-1">
              Sistema de Gestión de Transporte y Seguridad
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-4 pb-4 border-b border-border last:border-0 last:pb-0">
                  <div
                    className={`h-2 w-2 rounded-full mt-2 flex-shrink-0 ${
                      activity.status === "success"
                        ? "bg-accent"
                        : activity.status === "warning"
                        ? "bg-secondary"
                        : "bg-primary"
                    }`}
                  />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-foreground">{activity.type}</p>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Métricas de Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Inspecciones Completadas</span>
                  <span className="font-medium text-foreground">95%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "95%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rondines a Tiempo</span>
                  <span className="font-medium text-foreground">88%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: "88%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mantenimientos Preventivos</span>
                  <span className="font-medium text-foreground">92%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: "92%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cumplimiento CTPAT</span>
                  <span className="font-medium text-foreground">97%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: "97%" }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
