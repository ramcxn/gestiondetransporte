import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Truck, Users, Shield, AlertTriangle, Package, TrendingUp, UserCheck, Clock, Wrench, MapPin, Warehouse, ClipboardCheck, FileText, DollarSign, Activity, Calendar, Target, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const [stats, setStats] = useState({
    // Inventario Equipos
    equiposTotal: 0,
    equiposDisponibles: 0,
    equiposEnUso: 0,
    equiposMantenimiento: 0,
    equiposHHExpress: 0,
    equiposPortecalesa: 0,
    
    // Viajes
    viajesActivos: 0,
    viajesCompletados: 0,
    viajesProgramados: 0,
    ingresosMesActual: 0,
    
    // Mantenimiento
    mantenimientosEsteMes: 0,
    mantenimientosEnProceso: 0,
    costoMantenimientoMes: 0,
    proximosMantenimientos: 0,
    
    // Almacén
    refaccionesTotal: 0,
    refaccionesCriticas: 0,
    solicitudesPendientes: 0,
    valorInventario: 0,
    
    // Personal
    operadoresActivos: 0,
    personalActivo: 0,
    asistenciaHoy: 0,
    vacacionesPendientes: 0,
    
    // Seguridad CTPAT
    rondinesHoy: 0,
    rondinesIncidentes: 0,
    revisionesDocumentales: 0,
    documentosVencidos: 0,
    inventarioOperadorAprobados: 0,
    
    // Riesgos y Cumplimiento
    riesgosAltos: 0,
    accionesCorrectivasAbiertas: 0,
    incidentesPendientes: 0,
    alcoholimetroPositivos: 0,
    
    // General
    unidadesIngresadas: 0,
    visitasActivas: 0,
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("general");
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-kpis');
    return saved ? JSON.parse(saved) : ['equipos', 'viajes', 'mantenimiento', 'alertas', 'general', 'operaciones', 'almacen', 'personal', 'seguridad'];
  });

  const kpiOptions = [
    { id: 'equipos', name: 'Equipos Totales', category: 'principales' },
    { id: 'viajes', name: 'Viajes Activos', category: 'principales' },
    { id: 'mantenimiento', name: 'Mantenimientos', category: 'principales' },
    { id: 'alertas', name: 'Alertas Críticas', category: 'principales' },
    { id: 'general', name: 'Vista General', category: 'tabs' },
    { id: 'operaciones', name: 'Operaciones', category: 'tabs' },
    { id: 'almacen', name: 'Almacén', category: 'tabs' },
    { id: 'personal', name: 'Personal', category: 'tabs' },
    { id: 'seguridad', name: 'Seguridad', category: 'tabs' },
  ];

  const toggleKPI = (kpiId: string) => {
    setSelectedKPIs(prev => {
      const newSelection = prev.includes(kpiId)
        ? prev.filter(id => id !== kpiId)
        : [...prev, kpiId];
      localStorage.setItem('dashboard-kpis', JSON.stringify(newSelection));
      return newSelection;
    });
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const firstDayOfMonth = thisMonth.toISOString().split('T')[0];

      // INVENTARIO EQUIPOS
      const { data: equipos } = await supabase
        .from("inventario_equipos")
        .select("*");
      
      const equiposDisponibles = equipos?.filter(e => e.estado === 'disponible').length || 0;
      const equiposEnUso = equipos?.filter(e => e.estado === 'en_uso').length || 0;
      const equiposMantenimiento = equipos?.filter(e => e.estado === 'mantenimiento').length || 0;
      const equiposHHExpress = equipos?.filter(e => e.operacion === 'HH Express').length || 0;
      const equiposPortecalesa = equipos?.filter(e => e.operacion === 'Portecalesa').length || 0;

      // VIAJES
      const { data: viajes } = await supabase.from("viajes").select("*");
      const { data: viajesMes } = await supabase
        .from("viajes")
        .select("flete")
        .eq("estado", "completado")
        .gte("fecha_llegada_real", firstDayOfMonth);
      
      const viajesActivos = viajes?.filter(v => v.estado === 'en_transito').length || 0;
      const viajesCompletados = viajes?.filter(v => v.estado === 'completado').length || 0;
      const viajesProgramados = viajes?.filter(v => v.estado === 'programado').length || 0;
      const ingresosMesActual = viajesMes?.reduce((sum, v) => sum + (v.flete || 0), 0) || 0;

      // MANTENIMIENTO
      const { data: mantenimientos } = await supabase
        .from("mantenimientos")
        .select("*")
        .gte("fecha_mantenimiento", firstDayOfMonth);
      
      const mantenimientosEnProceso = mantenimientos?.filter(m => m.estado === 'en_proceso').length || 0;
      const costoMantenimientoMes = mantenimientos?.reduce((sum, m) => sum + (m.costo || 0), 0) || 0;
      
      const { data: proximosMantenimientos } = await supabase
        .from("mantenimientos")
        .select("*", { count: 'exact' })
        .eq("estado", "programado");

      // ALMACÉN REFACCIONES
      const { data: refacciones } = await supabase
        .from("refacciones")
        .select("*, inventario_refacciones(*)")
        .eq("activa", true);
      
      let refaccionesCriticas = 0;
      let valorInventario = 0;
      
      refacciones?.forEach(ref => {
        const stockTotal = ref.inventario_refacciones?.filter((inv: any) => inv.estado === 'disponible').length || 0;
        if (stockTotal <= ref.stock_minimo) refaccionesCriticas++;
        valorInventario += stockTotal * (ref.precio_unitario || 0);
      });

      const { data: solicitudesPendientes } = await supabase
        .from("solicitudes_refacciones")
        .select("*", { count: 'exact' })
        .in("estado", ["pendiente", "aprobado"]);

      // PERSONAL Y OPERADORES
      const { data: operadores } = await supabase
        .from("operadores")
        .select("*", { count: 'exact' })
        .eq("estado", "activo");

      const { data: personal } = await supabase
        .from("personal")
        .select("*", { count: 'exact' })
        .eq("estado", "activo");

      const { data: asistenciaHoy } = await supabase
        .from("asistencia_personal")
        .select("*", { count: 'exact' })
        .gte("fecha_entrada", today)
        .eq("estado", "presente");

      const { data: vacaciones } = await supabase
        .from("vacaciones")
        .select("*", { count: 'exact' })
        .eq("estado", "pendiente");

      // SEGURIDAD CTPAT
      const { data: rondinesHoy } = await supabase
        .from("rondines")
        .select("*")
        .gte("created_at", today);

      const rondinesIncidentes = rondinesHoy?.filter(r => r.incidente).length || 0;

      const { data: revisionesDoc } = await supabase
        .from("revision_documental")
        .select("*");
      
      const documentosVencidos = revisionesDoc?.filter(r => r.estado_general === 'vencido').length || 0;

      const { data: inventarioOperador } = await supabase
        .from("inventario_operador")
        .select("*");
      
      const inventarioOperadorAprobados = inventarioOperador?.filter(i => i.estado === 'aprobado').length || 0;

      // RIESGOS Y CUMPLIMIENTO
      const { data: riesgos } = await supabase
        .from("analisis_riesgos")
        .select("*", { count: 'exact' })
        .in("nivel_riesgo", ["alto", "critico"])
        .eq("estado", "abierto");

      const { data: acciones } = await supabase
        .from("acciones_correctivas")
        .select("*", { count: 'exact' })
        .eq("estado", "abierto");

      const { data: incidentes } = await supabase
        .from("incidentes")
        .select("*", { count: 'exact' })
        .in("estado", ["reportado", "en_investigacion"]);

      const { data: alcoholimetro } = await supabase
        .from("pruebas_alcoholimetro")
        .select("*", { count: 'exact' })
        .eq("resultado", "positivo");

      // GENERAL
      const { data: unidadesIngresadas } = await supabase
        .from("ingreso_unidades")
        .select("*", { count: 'exact' });

      const { data: visitasActivas } = await supabase
        .from("visitas")
        .select("*", { count: 'exact' })
        .eq("estado", "en_instalaciones");

      setStats({
        equiposTotal: equipos?.length || 0,
        equiposDisponibles,
        equiposEnUso,
        equiposMantenimiento,
        equiposHHExpress,
        equiposPortecalesa,
        
        viajesActivos,
        viajesCompletados,
        viajesProgramados,
        ingresosMesActual,
        
        mantenimientosEsteMes: mantenimientos?.length || 0,
        mantenimientosEnProceso,
        costoMantenimientoMes,
        proximosMantenimientos: proximosMantenimientos?.length || 0,
        
        refaccionesTotal: refacciones?.length || 0,
        refaccionesCriticas,
        solicitudesPendientes: solicitudesPendientes?.length || 0,
        valorInventario,
        
        operadoresActivos: operadores?.length || 0,
        personalActivo: personal?.length || 0,
        asistenciaHoy: asistenciaHoy?.length || 0,
        vacacionesPendientes: vacaciones?.length || 0,
        
        rondinesHoy: rondinesHoy?.length || 0,
        rondinesIncidentes,
        revisionesDocumentales: revisionesDoc?.length || 0,
        documentosVencidos,
        inventarioOperadorAprobados,
        
        riesgosAltos: riesgos?.length || 0,
        accionesCorrectivasAbiertas: acciones?.length || 0,
        incidentesPendientes: incidentes?.length || 0,
        alcoholimetroPositivos: alcoholimetro?.length || 0,
        
        unidadesIngresadas: unidadesIngresadas?.length || 0,
        visitasActivas: visitasActivas?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const cumplimientoGlobal = stats.inventarioOperadorAprobados > 0 
    ? Math.round((stats.inventarioOperadorAprobados / (stats.inventarioOperadorAprobados + stats.documentosVencidos + stats.rondinesIncidentes + stats.incidentesPendientes + 1)) * 100)
    : 85;

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="rounded-lg bg-gradient-to-br from-primary via-primary/90 to-accent p-8 text-primary-foreground shadow-elevated">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-background/10 rounded-lg backdrop-blur-sm">
              <Activity className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Dashboard Operacional Unificado</h1>
              <p className="text-primary-foreground/80 mt-1">
                Sistema Integral de Gestión CTPAT - Todas las Operaciones
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-primary-foreground/70">Cumplimiento Global</div>
              <div className="text-4xl font-bold">{cumplimientoGlobal}%</div>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary" size="icon" className="shrink-0">
                  <Settings className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Configurar KPIs</DialogTitle>
                  <DialogDescription>
                    Selecciona los KPIs y secciones que deseas visualizar en el dashboard
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">KPIs Principales</h4>
                    {kpiOptions.filter(kpi => kpi.category === 'principales').map(kpi => (
                      <div key={kpi.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={kpi.id}
                          checked={selectedKPIs.includes(kpi.id)}
                          onCheckedChange={() => toggleKPI(kpi.id)}
                        />
                        <Label
                          htmlFor={kpi.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {kpi.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Secciones Detalladas</h4>
                    {kpiOptions.filter(kpi => kpi.category === 'tabs').map(kpi => (
                      <div key={kpi.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={kpi.id}
                          checked={selectedKPIs.includes(kpi.id)}
                          onCheckedChange={() => toggleKPI(kpi.id)}
                        />
                        <Label
                          htmlFor={kpi.id}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {kpi.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      {selectedKPIs.some(kpi => ['equipos', 'viajes', 'mantenimiento', 'alertas'].includes(kpi)) && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {selectedKPIs.includes('equipos') && (
            <Card className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-primary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Equipos Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.equiposTotal}</div>
            <div className="flex gap-2 mt-2">
              <Badge variant="default">{stats.equiposDisponibles} Disponibles</Badge>
              <Badge variant="secondary">{stats.equiposEnUso} En Uso</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{stats.equiposMantenimiento} en mantenimiento</p>
          </CardContent>
        </Card>
          )}

          {selectedKPIs.includes('viajes') && (
            <Card className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-accent">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Viajes Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.viajesActivos}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.viajesProgramados} programados</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Ingresos del mes</span>
                <span className="font-semibold text-accent">${stats.ingresosMesActual.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
          )}

          {selectedKPIs.includes('mantenimiento') && (
            <Card className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-secondary">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Mantenimientos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.mantenimientosEsteMes}</div>
            <p className="text-xs text-muted-foreground mt-1">{stats.mantenimientosEnProceso} en proceso</p>
            <div className="mt-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Costo mensual</span>
                <span className="font-semibold text-secondary">${stats.costoMantenimientoMes.toLocaleString('es-MX')}</span>
              </div>
            </div>
          </CardContent>
        </Card>
          )}

          {selectedKPIs.includes('alertas') && (
            <Card className="shadow-card hover:shadow-elevated transition-shadow border-l-4 border-l-destructive">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas Críticas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">
              {stats.riesgosAltos + stats.incidentesPendientes + stats.documentosVencidos}
            </div>
            <div className="space-y-1 mt-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Riesgos altos</span>
                <span className="font-semibold">{stats.riesgosAltos}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Documentos vencidos</span>
                <span className="font-semibold">{stats.documentosVencidos}</span>
              </div>
            </div>
          </CardContent>
        </Card>
          )}
        </div>
      )}

      {/* Tabs con Categorías Detalladas */}
      {selectedKPIs.some(kpi => ['general', 'operaciones', 'almacen', 'personal', 'seguridad'].includes(kpi)) && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${selectedKPIs.filter(kpi => ['general', 'operaciones', 'almacen', 'personal', 'seguridad'].includes(kpi)).length}, minmax(0, 1fr))` }}>
            {selectedKPIs.includes('general') && <TabsTrigger value="general">General</TabsTrigger>}
            {selectedKPIs.includes('operaciones') && <TabsTrigger value="operaciones">Operaciones</TabsTrigger>}
            {selectedKPIs.includes('almacen') && <TabsTrigger value="almacen">Almacén</TabsTrigger>}
            {selectedKPIs.includes('personal') && <TabsTrigger value="personal">Personal</TabsTrigger>}
            {selectedKPIs.includes('seguridad') && <TabsTrigger value="seguridad">Seguridad</TabsTrigger>}
          </TabsList>

          {/* TAB GENERAL */}
          {selectedKPIs.includes('general') && (
            <TabsContent value="general" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Flota por Operación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">HH Express</span>
                    <span className="font-semibold">{stats.equiposHHExpress}</span>
                  </div>
                  <Progress value={(stats.equiposHHExpress / stats.equiposTotal) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Portecalesa</span>
                    <span className="font-semibold">{stats.equiposPortecalesa}</span>
                  </div>
                  <Progress value={(stats.equiposPortecalesa / stats.equiposTotal) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recursos Humanos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Operadores</span>
                  <span className="font-semibold">{stats.operadoresActivos}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Personal</span>
                  <span className="font-semibold">{stats.personalActivo}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Asistencia Hoy</span>
                  <span className="font-semibold text-accent">{stats.asistenciaHoy}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Seguridad Hoy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rondines</span>
                  <span className="font-semibold">{stats.rondinesHoy}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Incidentes</span>
                  <span className="font-semibold text-destructive">{stats.rondinesIncidentes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Visitas Activas</span>
                  <span className="font-semibold">{stats.visitasActivas}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Indicadores de Cumplimiento
                </CardTitle>
                <CardDescription>Métricas clave de operación</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disponibilidad de Flota</span>
                    <span className="font-semibold">{Math.round((stats.equiposDisponibles / stats.equiposTotal) * 100)}%</span>
                  </div>
                  <Progress value={(stats.equiposDisponibles / stats.equiposTotal) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Viajes Completados</span>
                    <span className="font-semibold">{Math.round((stats.viajesCompletados / (stats.viajesCompletados + stats.viajesActivos + 1)) * 100)}%</span>
                  </div>
                  <Progress value={(stats.viajesCompletados / (stats.viajesCompletados + stats.viajesActivos + 1)) * 100} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Inventarios Aprobados</span>
                    <span className="font-semibold">{stats.inventarioOperadorAprobados}</span>
                  </div>
                  <Progress value={75} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cumplimiento CTPAT</span>
                    <span className="font-semibold text-accent">{cumplimientoGlobal}%</span>
                  </div>
                  <Progress value={cumplimientoGlobal} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas y Acciones Pendientes
                </CardTitle>
                <CardDescription>Requieren atención inmediata</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="text-sm font-medium">Riesgos Altos</span>
                  </div>
                  <Badge variant="destructive">{stats.riesgosAltos}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-medium">Acciones Correctivas</span>
                  </div>
                  <Badge variant="secondary">{stats.accionesCorrectivasAbiertas}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Documentos Vencidos</span>
                  </div>
                  <Badge className="bg-accent text-accent-foreground">{stats.documentosVencidos}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Refacciones Críticas</span>
                  </div>
                  <Badge variant="outline">{stats.refaccionesCriticas}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
          )}

          {/* TAB OPERACIONES */}
          {selectedKPIs.includes('operaciones') && (
            <TabsContent value="operaciones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Viajes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.viajesActivos}</div>
                <p className="text-xs text-muted-foreground mt-1">En tránsito</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Completados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.viajesCompletados}</div>
                <p className="text-xs text-muted-foreground mt-1">Total histórico</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Programados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.viajesProgramados}</div>
                <p className="text-xs text-muted-foreground mt-1">Próximos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Ingresos Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">${(stats.ingresosMesActual / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground mt-1">MXN</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mantenimientos</CardTitle>
                <CardDescription>Gestión de mantenimiento de flota</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold">{stats.mantenimientosEsteMes}</div>
                    <p className="text-sm text-muted-foreground">Este mes</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-secondary">{stats.mantenimientosEnProceso}</div>
                    <p className="text-sm text-muted-foreground">En proceso</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Costo Total del Mes</span>
                    <span className="font-semibold">${stats.costoMantenimientoMes.toLocaleString('es-MX')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Programados</span>
                    <span className="font-semibold">{stats.proximosMantenimientos}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Unidades Ingresadas</CardTitle>
                <CardDescription>Control de entrada/salida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-primary/10 rounded-lg text-center">
                  <div className="text-3xl font-bold text-primary">{stats.unidadesIngresadas}</div>
                  <p className="text-sm text-muted-foreground mt-1">Total de registros</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div>
                    <div className="font-semibold">{stats.equiposDisponibles}</div>
                    <div className="text-muted-foreground">Disponibles</div>
                  </div>
                  <div>
                    <div className="font-semibold">{stats.equiposEnUso}</div>
                    <div className="text-muted-foreground">En uso</div>
                  </div>
                  <div>
                    <div className="font-semibold">{stats.equiposMantenimiento}</div>
                    <div className="text-muted-foreground">Mantto</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
          )}

          {/* TAB ALMACÉN */}
          {selectedKPIs.includes('almacen') && (
            <TabsContent value="almacen" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Warehouse className="h-4 w-4" />
                  Total Refacciones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.refaccionesTotal}</div>
                <p className="text-xs text-muted-foreground mt-1">SKUs activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Stock Crítico
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.refaccionesCriticas}</div>
                <p className="text-xs text-muted-foreground mt-1">Requieren reorden</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Solicitudes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.solicitudesPendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Inventario
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-accent">${(stats.valorInventario / 1000).toFixed(0)}K</div>
                <p className="text-xs text-muted-foreground mt-1">MXN</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumen de Almacén</CardTitle>
              <CardDescription>Estado del inventario de refacciones</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Refacciones Totales</span>
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stats.refaccionesTotal}</div>
                  <Progress value={100} className="h-2 mt-2" />
                </div>
                <div className="p-4 border rounded-lg border-destructive/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Stock Crítico</span>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </div>
                  <div className="text-2xl font-bold text-destructive">{stats.refaccionesCriticas}</div>
                  <Progress value={(stats.refaccionesCriticas / stats.refaccionesTotal) * 100} className="h-2 mt-2" />
                </div>
                <div className="p-4 border rounded-lg border-accent/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Valor Total</span>
                    <DollarSign className="h-4 w-4 text-accent" />
                  </div>
                  <div className="text-xl font-bold text-accent">${stats.valorInventario.toLocaleString('es-MX', { maximumFractionDigits: 0 })}</div>
                  <p className="text-xs text-muted-foreground mt-1">Pesos mexicanos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
          )}

          {/* TAB PERSONAL */}
          {selectedKPIs.includes('personal') && (
            <TabsContent value="personal" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Operadores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.operadoresActivos}</div>
                <p className="text-xs text-muted-foreground mt-1">Activos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Personal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.personalActivo}</div>
                <p className="text-xs text-muted-foreground mt-1">Activo</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Asistencia Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.asistenciaHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">Presentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Vacaciones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-secondary">{stats.vacacionesPendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Solicitudes pendientes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Control de Asistencia
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-accent/10 rounded-lg">
                  <span className="text-sm font-medium">Presentes Hoy</span>
                  <span className="text-2xl font-bold text-accent">{stats.asistenciaHoy}</span>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Porcentaje de Asistencia</span>
                    <span className="font-semibold">{Math.round((stats.asistenciaHoy / (stats.operadoresActivos + stats.personalActivo)) * 100)}%</span>
                  </div>
                  <Progress value={(stats.asistenciaHoy / (stats.operadoresActivos + stats.personalActivo)) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Gestión de Vacaciones
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.vacacionesPendientes}</div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <div className="text-2xl font-bold">{stats.operadoresActivos + stats.personalActivo}</div>
                    <p className="text-xs text-muted-foreground">Personal total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
          )}

          {/* TAB SEGURIDAD */}
          {selectedKPIs.includes('seguridad') && (
            <TabsContent value="seguridad" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Rondines Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.rondinesHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.rondinesIncidentes} con incidentes</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Revisiones Doc.</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stats.revisionesDocumentales}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.documentosVencidos} vencidos</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Inv. Operador</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-accent">{stats.inventarioOperadorAprobados}</div>
                <p className="text-xs text-muted-foreground mt-1">Aprobados</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-muted-foreground">Incidentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">{stats.incidentesPendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">Pendientes</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Seguridad CTPAT
                </CardTitle>
                <CardDescription>Indicadores de cumplimiento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Rondines sin Incidentes</span>
                    <span className="font-semibold">{Math.round(((stats.rondinesHoy - stats.rondinesIncidentes) / (stats.rondinesHoy || 1)) * 100)}%</span>
                  </div>
                  <Progress value={((stats.rondinesHoy - stats.rondinesIncidentes) / (stats.rondinesHoy || 1)) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Documentos Vigentes</span>
                    <span className="font-semibold">{Math.round(((stats.revisionesDocumentales - stats.documentosVencidos) / (stats.revisionesDocumentales || 1)) * 100)}%</span>
                  </div>
                  <Progress value={((stats.revisionesDocumentales - stats.documentosVencidos) / (stats.revisionesDocumentales || 1)) * 100} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cumplimiento Global</span>
                    <span className="font-semibold text-accent">{cumplimientoGlobal}%</span>
                  </div>
                  <Progress value={cumplimientoGlobal} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Gestión de Riesgos
                </CardTitle>
                <CardDescription>Riesgos y acciones correctivas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Riesgos Altos/Críticos</div>
                    <div className="text-xs text-muted-foreground">Requieren atención inmediata</div>
                  </div>
                  <div className="text-2xl font-bold text-destructive">{stats.riesgosAltos}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary/10 rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Acciones Correctivas</div>
                    <div className="text-xs text-muted-foreground">Casos abiertos</div>
                  </div>
                  <div className="text-2xl font-bold text-secondary">{stats.accionesCorrectivasAbiertas}</div>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <div className="text-sm font-medium">Alcoholímetro Positivo</div>
                    <div className="text-xs text-muted-foreground">Casos registrados</div>
                  </div>
                  <div className="text-2xl font-bold">{stats.alcoholimetroPositivos}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
          )}
        </Tabs>
      )}
    </div>
  );
}
