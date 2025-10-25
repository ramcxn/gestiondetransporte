import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Route, MapPin, DollarSign, Clock, TrendingUp, Calculator, Fuel, TrendingDown } from "lucide-react";

export default function RouteAnalysis() {
  const [formData, setFormData] = useState({
    cliente: "PEPSI",
    ruta: "APODACA - LAREDO",
    mes: "ABRIL",
    numeroTracto: "",
    numeroViaje: "176565",
    tarifaViaje: "17760.00",
    kilometrosRecorridos: "431",
    casetas: "2424.00",
    cargaDiesel: "157.87",
    tiempoRuta: "18.08",
    dieselRestante: "0",
    rendimiento: "2.730094381",
    tiempoCargaDescarga: "4.696",
    otrosGastos: "1029.83",
    pagoOperador: "",
    depreciacionMensual: "10418.93",
    depreciacionViaje: "",
    consumoDiesel: "3385.52",
    kilometrosVacio: "213",
    utilidadViaje: "",
    ingresosEstimados: "",
    ingresosReales: "",
    totalHoras: "",
    porcentajeUtilidad: "",
    porcentajeIngresos: "",
  });

  const calcularAnalisis = () => {
    const tarifaViaje = parseFloat(formData.tarifaViaje) || 0;
    const casetas = parseFloat(formData.casetas) || 0;
    const otrosGastos = parseFloat(formData.otrosGastos) || 0;
    const consumoDiesel = parseFloat(formData.consumoDiesel) || 0;
    
    // Cálculo automático: Pago del operador (10% del viaje)
    const pagoOperador = tarifaViaje * 0.10;
    
    // Cálculo automático: Depreciación del viaje
    const depreciacionMensual = parseFloat(formData.depreciacionMensual) || 0;
    const tiempoRuta = parseFloat(formData.tiempoRuta) || 0;
    const tiempoCargaDescarga = parseFloat(formData.tiempoCargaDescarga) || 0;
    const totalHoras = tiempoRuta + tiempoCargaDescarga;
    const depreciacionViaje = (depreciacionMensual / 720) * totalHoras;
    
    // Cálculo automático: Utilidad del viaje
    const utilidadViaje = tarifaViaje - casetas - otrosGastos - pagoOperador - depreciacionViaje - consumoDiesel;
    
    // Cálculo automático: Ingresos estimados por tiempo (tarifa / tiempo teórico * 24)
    const ingresosEstimados = (tarifaViaje / totalHoras) * 24;
    
    // Cálculo automático: Ingresos reales por tiempo
    const ingresosReales = (utilidadViaje / totalHoras) * 24;
    
    // Cálculo automático: % de Utilidad
    const porcentajeUtilidad = (utilidadViaje / tarifaViaje) * 100;
    
    // Cálculo automático: % de Ingresos por tiempo por viaje
    const porcentajeIngresos = ((ingresosReales - ingresosEstimados) / ingresosEstimados) * 100;
    
    setFormData({
      ...formData,
      pagoOperador: pagoOperador.toFixed(2),
      depreciacionViaje: depreciacionViaje.toFixed(2),
      utilidadViaje: utilidadViaje.toFixed(2),
      ingresosEstimados: ingresosEstimados.toFixed(2),
      ingresosReales: ingresosReales.toFixed(2),
      totalHoras: totalHoras.toFixed(2),
      porcentajeUtilidad: porcentajeUtilidad.toFixed(2),
      porcentajeIngresos: porcentajeIngresos.toFixed(2),
    });
    
    toast.success("Análisis calculado exitosamente");
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const savedRoutes = [
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Análisis de Factibilidad de Viaje</CardTitle>
              <CardDescription>Cálculo real de rentabilidad y costos operativos</CardDescription>
            </div>
            <Button onClick={calcularAnalisis} className="bg-primary hover:bg-primary/90">
              <Calculator className="h-4 w-4 mr-2" />
              Calcular Análisis
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información General */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Información General</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente</Label>
                <Input
                  id="cliente"
                  value={formData.cliente}
                  onChange={(e) => handleInputChange("cliente", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ruta">Ruta</Label>
                <Input
                  id="ruta"
                  value={formData.ruta}
                  onChange={(e) => handleInputChange("ruta", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mes">Mes a Evaluar</Label>
                <Select value={formData.mes} onValueChange={(value) => handleInputChange("mes", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ENERO">ENERO</SelectItem>
                    <SelectItem value="FEBRERO">FEBRERO</SelectItem>
                    <SelectItem value="MARZO">MARZO</SelectItem>
                    <SelectItem value="ABRIL">ABRIL</SelectItem>
                    <SelectItem value="MAYO">MAYO</SelectItem>
                    <SelectItem value="JUNIO">JUNIO</SelectItem>
                    <SelectItem value="JULIO">JULIO</SelectItem>
                    <SelectItem value="AGOSTO">AGOSTO</SelectItem>
                    <SelectItem value="SEPTIEMBRE">SEPTIEMBRE</SelectItem>
                    <SelectItem value="OCTUBRE">OCTUBRE</SelectItem>
                    <SelectItem value="NOVIEMBRE">NOVIEMBRE</SelectItem>
                    <SelectItem value="DICIEMBRE">DICIEMBRE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos del Viaje */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Datos del Viaje</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="numeroTracto">Número de Tracto</Label>
                <Select value={formData.numeroTracto} onValueChange={(value) => handleInputChange("numeroTracto", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tracto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRC-001">TRC-001</SelectItem>
                    <SelectItem value="TRC-002">TRC-002</SelectItem>
                    <SelectItem value="TRC-005">TRC-005</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Automático del inventario</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroViaje">Número de Viaje</Label>
                <Input
                  id="numeroViaje"
                  value={formData.numeroViaje}
                  onChange={(e) => handleInputChange("numeroViaje", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tarifaViaje">Tarifa de Viaje ($)</Label>
                <Input
                  id="tarifaViaje"
                  type="number"
                  step="0.01"
                  value={formData.tarifaViaje}
                  onChange={(e) => handleInputChange("tarifaViaje", e.target.value)}
                  className="bg-accent/5"
                />
                <p className="text-xs text-muted-foreground">Automático del módulo de cotización</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Datos de Operación (Manuales) */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Fuel className="h-5 w-5 text-primary" />
              Datos de Operación (Manual)
            </h3>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="kilometrosRecorridos">Kilómetros Recorridos</Label>
                <Input
                  id="kilometrosRecorridos"
                  type="number"
                  value={formData.kilometrosRecorridos}
                  onChange={(e) => handleInputChange("kilometrosRecorridos", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="casetas">Casetas ($)</Label>
                <Input
                  id="casetas"
                  type="number"
                  step="0.01"
                  value={formData.casetas}
                  onChange={(e) => handleInputChange("casetas", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cargaDiesel">Carga de Diesel (L)</Label>
                <Input
                  id="cargaDiesel"
                  type="number"
                  step="0.01"
                  value={formData.cargaDiesel}
                  onChange={(e) => handleInputChange("cargaDiesel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiempoRuta">Tiempo de Ruta (hrs)</Label>
                <Input
                  id="tiempoRuta"
                  type="number"
                  step="0.01"
                  value={formData.tiempoRuta}
                  onChange={(e) => handleInputChange("tiempoRuta", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dieselRestante">Diesel Restante (L)</Label>
                <Input
                  id="dieselRestante"
                  type="number"
                  step="0.01"
                  value={formData.dieselRestante}
                  onChange={(e) => handleInputChange("dieselRestante", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rendimiento">Rendimiento de Unidad</Label>
                <Input
                  id="rendimiento"
                  type="number"
                  step="0.001"
                  value={formData.rendimiento}
                  onChange={(e) => handleInputChange("rendimiento", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tiempoCargaDescarga">Tiempo Carga/Descarga (hrs)</Label>
                <Input
                  id="tiempoCargaDescarga"
                  type="number"
                  step="0.001"
                  value={formData.tiempoCargaDescarga}
                  onChange={(e) => handleInputChange("tiempoCargaDescarga", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otrosGastos">Otros Gastos ($)</Label>
                <Input
                  id="otrosGastos"
                  type="number"
                  step="0.01"
                  value={formData.otrosGastos}
                  onChange={(e) => handleInputChange("otrosGastos", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="consumoDiesel">Consumo de Diesel ($)</Label>
                <Input
                  id="consumoDiesel"
                  type="number"
                  step="0.01"
                  value={formData.consumoDiesel}
                  onChange={(e) => handleInputChange("consumoDiesel", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kilometrosVacio">Kilómetros en Vacío</Label>
                <Input
                  id="kilometrosVacio"
                  type="number"
                  value={formData.kilometrosVacio}
                  onChange={(e) => handleInputChange("kilometrosVacio", e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Cálculos Automáticos */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-accent" />
              Cálculos Automáticos
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="pagoOperador">Pago del Operador (10%)</Label>
                <Input
                  id="pagoOperador"
                  value={formData.pagoOperador ? `$${formData.pagoOperador}` : ""}
                  readOnly
                  className="bg-accent/10 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciacionMensual">Depreciación Mensual</Label>
                <Input
                  id="depreciacionMensual"
                  type="number"
                  step="0.01"
                  value={formData.depreciacionMensual}
                  onChange={(e) => handleInputChange("depreciacionMensual", e.target.value)}
                  className="bg-accent/5"
                />
                <p className="text-xs text-muted-foreground">Automático del inventario</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="depreciacionViaje">Depreciación del Viaje</Label>
                <Input
                  id="depreciacionViaje"
                  value={formData.depreciacionViaje ? `$${formData.depreciacionViaje}` : ""}
                  readOnly
                  className="bg-accent/10 font-semibold"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalHoras">Total de Horas Recorrido</Label>
                <Input
                  id="totalHoras"
                  value={formData.totalHoras}
                  readOnly
                  className="bg-accent/10 font-semibold"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Resultados Finales */}
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6 rounded-lg border border-primary/20">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Resultados del Análisis
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Utilidad del Viaje</p>
                <p className="text-2xl font-bold text-accent">
                  {formData.utilidadViaje ? `$${formData.utilidadViaje}` : "$0.00"}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% de Utilidad</p>
                <p className="text-2xl font-bold text-foreground">
                  {formData.porcentajeUtilidad ? `${formData.porcentajeUtilidad}%` : "0%"}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ingresos Estimados por Tiempo</p>
                <p className="text-2xl font-bold text-foreground">
                  {formData.ingresosEstimados ? `$${formData.ingresosEstimados}` : "$0.00"}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Ingresos Reales por Tiempo</p>
                <p className="text-2xl font-bold text-foreground">
                  {formData.ingresosReales ? `$${formData.ingresosReales}` : "$0.00"}
                </p>
              </div>
              <div className="p-4 bg-background rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">% Ingresos por Tiempo</p>
                <p className={`text-2xl font-bold ${
                  parseFloat(formData.porcentajeIngresos || "0") >= 0 ? "text-accent" : "text-destructive"
                }`}>
                  {formData.porcentajeIngresos ? `${formData.porcentajeIngresos}%` : "0%"}
                </p>
              </div>
            </div>
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
          <CardTitle>Análisis Guardados</CardTitle>
          <CardDescription>Historial de evaluaciones de factibilidad</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {savedRoutes.map((route) => (
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
