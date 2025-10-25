import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Route, MapPin, DollarSign, Clock, TrendingUp } from "lucide-react";

export default function RouteAnalysis() {
  const routes = [
    {
      id: "RT-001",
      origin: "Monterrey, NL",
      destination: "CDMX",
      distance: "920 km",
      estimatedTime: "12 hrs",
      estimatedCost: "$25,000",
      profitability: "high",
      fuelCost: "$8,500",
      tollCost: "$2,500",
    },
    {
      id: "RT-002",
      origin: "Guadalajara, JAL",
      destination: "Tijuana, BC",
      distance: "2,150 km",
      estimatedTime: "28 hrs",
      estimatedCost: "$42,000",
      profitability: "medium",
      fuelCost: "$16,500",
      tollCost: "$4,200",
    },
    {
      id: "RT-003",
      origin: "CDMX",
      destination: "Veracruz, VER",
      distance: "420 km",
      estimatedTime: "6 hrs",
      estimatedCost: "$15,000",
      profitability: "high",
      fuelCost: "$3,800",
      tollCost: "$1,200",
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
          <Route className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Análisis de Factibilidad de Ruta</h1>
          <p className="text-muted-foreground">Evaluación de costos y rentabilidad</p>
        </div>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Calcular Nueva Ruta</CardTitle>
          <CardDescription>Ingrese los datos para analizar factibilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="origin">Origen</Label>
              <Input id="origin" placeholder="Ciudad, Estado" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="destination">Destino</Label>
              <Input id="destination" placeholder="Ciudad, Estado" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="freight-offered">Flete Ofrecido ($)</Label>
              <Input id="freight-offered" type="number" placeholder="25000" />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3 mt-4">
            <div className="space-y-2">
              <Label htmlFor="distance">Distancia (km)</Label>
              <Input id="distance" type="number" placeholder="920" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fuel-price">Precio Diesel ($/L)</Label>
              <Input id="fuel-price" type="number" step="0.01" placeholder="24.50" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimated-tolls">Casetas Estimadas ($)</Label>
              <Input id="estimated-tolls" type="number" placeholder="2500" />
            </div>
          </div>
          <div className="flex justify-end mt-6">
            <Button className="bg-primary hover:bg-primary/90">
              <TrendingUp className="h-4 w-4 mr-2" />
              Analizar Ruta
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rutas Analizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">247</div>
            <p className="text-xs text-muted-foreground mt-1">Este mes</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Rentabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">68%</div>
            <p className="text-xs text-muted-foreground mt-1">Rutas aprobadas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ahorro Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">$3.2K</div>
            <p className="text-xs text-muted-foreground mt-1">Por viaje optimizado</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Rutas Recientes Analizadas</CardTitle>
          <CardDescription>Evaluaciones de factibilidad realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {routes.map((route) => (
              <div
                key={route.id}
                className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-semibold text-foreground">{route.id}</h4>
                      <Badge
                        variant={
                          route.profitability === "high"
                            ? "default"
                            : route.profitability === "medium"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {route.profitability === "high" && "Alta Rentabilidad"}
                        {route.profitability === "medium" && "Rentabilidad Media"}
                        {route.profitability === "low" && "Baja Rentabilidad"}
                      </Badge>
                    </div>
                    <div className="grid gap-2 text-sm text-muted-foreground mb-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{route.origin} → {route.destination}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Distancia</p>
                        <p className="font-medium text-foreground">{route.distance}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tiempo Est.</p>
                        <p className="font-medium text-foreground">{route.estimatedTime}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Costo Diesel</p>
                        <p className="font-medium text-foreground">{route.fuelCost}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Casetas</p>
                        <p className="font-medium text-foreground">{route.tollCost}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Costo Total</p>
                    <p className="text-2xl font-bold text-foreground">{route.estimatedCost}</p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Ver Detalle
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
