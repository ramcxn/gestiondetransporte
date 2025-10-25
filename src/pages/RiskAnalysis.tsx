import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, MapPin, TrendingUp } from "lucide-react";

export default function RiskAnalysis() {
  const riskZones = [
    {
      id: "RZ-001",
      zone: "Carretera Nacional km 250-280",
      state: "Nuevo León",
      riskLevel: "high",
      incidents: 12,
      recommendation: "Evitar horario nocturno, convoy recomendado",
    },
    {
      id: "RZ-002",
      zone: "Autopista del Sol km 180-220",
      state: "Guerrero",
      riskLevel: "medium",
      incidents: 5,
      recommendation: "Tránsito solo diurno, mantener comunicación constante",
    },
    {
      id: "RZ-003",
      zone: "Carretera Panamericana km 450-500",
      state: "Chiapas",
      riskLevel: "high",
      incidents: 18,
      recommendation: "Uso de escolta, evitar paradas innecesarias",
    },
  ];

  const recentIncidents = [
    {
      date: "2024-10-23",
      location: "Carretera Nacional km 265",
      type: "Robo en tránsito",
      severity: "high",
    },
    {
      date: "2024-10-20",
      location: "Autopista México-Puebla km 120",
      type: "Intento de asalto",
      severity: "medium",
    },
    {
      date: "2024-10-18",
      location: "Carretera Costera km 340",
      type: "Vehículo sospechoso",
      severity: "low",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <AlertTriangle className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análisis de Riesgos</h1>
          <p className="text-muted-foreground">Evaluación de seguridad en rutas</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zonas de Riesgo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">24</div>
            <p className="text-xs text-muted-foreground mt-1">Monitoreadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Riesgo Alto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">8</div>
            <p className="text-xs text-muted-foreground mt-1">Requieren precaución</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incidentes Este Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">3</div>
            <p className="text-xs text-muted-foreground mt-1">Reportados</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes Seguros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">98%</div>
            <p className="text-xs text-muted-foreground mt-1">Sin incidentes</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Zonas de Riesgo Identificadas</CardTitle>
          <CardDescription>Áreas que requieren precauciones especiales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riskZones.map((zone) => (
              <div
                key={zone.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{zone.zone}</h4>
                      {zone.riskLevel === "high" && (
                        <Badge variant="destructive">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Riesgo Alto
                        </Badge>
                      )}
                      {zone.riskLevel === "medium" && (
                        <Badge variant="secondary">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Riesgo Medio
                        </Badge>
                      )}
                      {zone.riskLevel === "low" && (
                        <Badge variant="outline">
                          <Shield className="h-3 w-3 mr-1" />
                          Riesgo Bajo
                        </Badge>
                      )}
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{zone.state} • {zone.incidents} incidentes reportados</span>
                      </div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm font-medium text-foreground mb-1">
                        <Shield className="h-4 w-4 inline mr-2" />
                        Recomendación:
                      </p>
                      <p className="text-sm text-muted-foreground">{zone.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Incidentes Recientes</CardTitle>
          <CardDescription>Registro de eventos de seguridad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentIncidents.map((incident, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      incident.severity === "high"
                        ? "bg-destructive/10"
                        : incident.severity === "medium"
                        ? "bg-secondary/10"
                        : "bg-muted"
                    }`}
                  >
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        incident.severity === "high"
                          ? "text-destructive"
                          : incident.severity === "medium"
                          ? "text-secondary"
                          : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{incident.type}</p>
                    <p className="text-sm text-muted-foreground">
                      {incident.location} • {incident.date}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline">
                  Ver Reporte
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
