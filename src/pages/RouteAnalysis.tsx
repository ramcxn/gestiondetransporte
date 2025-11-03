import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Route, MapPin, DollarSign, Clock, TrendingUp, Calculator, Fuel, TrendingDown, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";

interface SavedRoute {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  distancia_km: number;
  tiempo_estimado_horas: number;
  costo_estimado: number;
  costo_combustible: number | null;
  costo_casetas: number | null;
  rentabilidad: string | null;
  created_at: string;
}

export default function RouteAnalysis() {
  const { clientId, userRole } = useAuth();
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [loadingRoutes, setLoadingRoutes] = useState(true);
  const [clientes, setClientes] = useState<Array<{ id: string; nombre: string }>>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
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

  useEffect(() => {
    fetchSavedRoutes();
    fetchClientes();
  }, []);

  const fetchClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nombre")
        .eq("activo", true)
        .order("nombre");
      
      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Error fetching clientes:", error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const fetchSavedRoutes = async () => {
    try {
      const { data, error } = await supabase
        .from("rutas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      setSavedRoutes(data || []);
    } catch (error) {
      console.error("Error fetching routes:", error);
    } finally {
      setLoadingRoutes(false);
    }
  };

  const guardarRuta = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Debes iniciar sesión para guardar rutas");
        return;
      }

      if (!clientId) {
        toast.error("No se pudo obtener el ID del cliente");
        return;
      }

      const { error } = await supabase.from("rutas").insert({
        nombre: formData.ruta,
        origen: formData.ruta.split(" - ")[0] || formData.ruta,
        destino: formData.ruta.split(" - ")[1] || "",
        distancia_km: parseInt(formData.kilometrosRecorridos) || 0,
        tiempo_estimado_horas: parseFloat(formData.totalHoras) || 0,
        costo_estimado: parseFloat(formData.tarifaViaje) || 0,
        costo_combustible: parseFloat(formData.consumoDiesel) || 0,
        costo_casetas: parseFloat(formData.casetas) || 0,
        rentabilidad: parseFloat(formData.porcentajeUtilidad) > 20 ? 'alta' : parseFloat(formData.porcentajeUtilidad) > 10 ? 'media' : 'baja',
        created_by: user.id,
        client_id: clientId,
      });

      if (error) throw error;
      toast.success("Ruta guardada exitosamente");
      fetchSavedRoutes();
    } catch (error) {
      console.error("Error saving route:", error);
      toast.error("No se pudo guardar la ruta");
    }
  };

  const eliminarRuta = async (routeId: string) => {
    try {
      const { error } = await supabase
        .from("rutas")
        .delete()
        .eq("id", routeId);

      if (error) throw error;
      toast.success("Ruta eliminada exitosamente");
      fetchSavedRoutes();
    } catch (error) {
      console.error("Error deleting route:", error);
      toast.error("No se pudo eliminar la ruta");
    }
  };

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

  const getProfitabilityBadge = (rentabilidad: string | null) => {
    switch (rentabilidad) {
      case "alta":
        return <Badge className="bg-accent text-accent-foreground">Alta</Badge>;
      case "media":
        return <Badge className="bg-secondary text-secondary-foreground">Media</Badge>;
      case "baja":
        return <Badge variant="destructive">Baja</Badge>;
      default:
        return <Badge variant="outline">No calculada</Badge>;
    }
  };

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
            <div className="flex gap-2">
              <Button onClick={calcularAnalisis} className="bg-primary hover:bg-primary/90">
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Análisis
              </Button>
              {formData.utilidadViaje && (
                <Button onClick={guardarRuta} variant="outline">
                  Guardar Ruta
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Información General */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4">Información General</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente CTPAT</Label>
                <Select value={formData.cliente} onValueChange={(value) => handleInputChange("cliente", value)}>
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingClientes ? (
                      <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : clientes.length === 0 ? (
                      <SelectItem value="empty" disabled>No hay clientes disponibles</SelectItem>
                    ) : (
                      clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.nombre}>
                          {cliente.nombre}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">Rutas Guardadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{savedRoutes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total registradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Alta Rentabilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-accent">
              {savedRoutes.filter(r => r.rentabilidad === 'alta').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Rutas rentables</p>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Distancia Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {(savedRoutes.reduce((sum, r) => sum + r.distancia_km, 0) / 1000).toFixed(1)}K
            </div>
            <p className="text-xs text-muted-foreground mt-1">Kilómetros</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Rutas Guardadas</CardTitle>
          <CardDescription>Historial de evaluaciones de factibilidad</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingRoutes ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : savedRoutes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay rutas guardadas. Complete un análisis y guárdelo para verlo aquí.
            </div>
          ) : (
            <div className="space-y-3">
              {savedRoutes.map((route) => (
                <div
                  key={route.id}
                  className="p-4 rounded-lg border border-border hover:shadow-card transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h4 className="font-semibold text-foreground">{route.nombre}</h4>
                        {getProfitabilityBadge(route.rentabilidad)}
                      </div>
                      <div className="grid gap-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{route.origen} → {route.destino}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Route className="h-4 w-4" />
                            <span>{route.distancia_km} km</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{route.tiempo_estimado_horas.toFixed(1)} hrs</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            <span>${route.costo_estimado.toLocaleString()}</span>
                          </div>
                        </div>
                        {(route.costo_combustible || route.costo_casetas) && (
                          <div className="flex items-center gap-4 text-xs">
                            {route.costo_combustible && (
                              <div className="flex items-center gap-1">
                                <Fuel className="h-3 w-3" />
                                <span>Combustible: ${route.costo_combustible.toLocaleString()}</span>
                              </div>
                            )}
                            {route.costo_casetas && (
                              <span>Casetas: ${route.costo_casetas.toLocaleString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {userRole === "admin" && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-1" />
                            Eliminar
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Eliminar ruta?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Se eliminará permanentemente la ruta "{route.nombre}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => eliminarRuta(route.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Eliminar
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Guardada: {new Date(route.created_at).toLocaleDateString("es-MX")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
