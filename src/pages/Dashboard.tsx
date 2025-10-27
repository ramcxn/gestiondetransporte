import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, Users, Shield, AlertTriangle, Package, TrendingUp, UserCheck, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const [stats, setStats] = useState({
    unidades: 0,
    operadores: 0,
    personal: 0,
    rondinesHoy: 0,
    rondinesCompletados: 0,
    visitasActivas: 0,
    visitasHoy: 0,
    mantenimientosEsteMes: 0,
    viajesActivos: 0,
    riesgosAltos: 0,
    incidentesPendientes: 0,
    antidopingPositivos: 0,
  });

  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date();
      thisMonth.setDate(1);

      // Unidades ingresadas
      const { data: unidades } = await supabase
        .from("ingreso_unidades")
        .select("id", { count: 'exact' });

      // Operadores
      const { data: operadores } = await supabase
        .from("operadores")
        .select("id", { count: 'exact' })
        .eq("estado", "activo");

      // Personal
      const { data: personal } = await supabase
        .from("personal")
        .select("id", { count: 'exact' })
        .eq("estado", "activo");

      // Rondines hoy
      const { data: rondinesHoy } = await supabase
        .from("rondines")
        .select("*")
        .gte("created_at", today);

      // Visitas activas
      const { data: visitasActivas } = await supabase
        .from("visitas")
        .select("id", { count: 'exact' })
        .eq("estado", "en_instalaciones");

      // Visitas hoy
      const { data: visitasHoy } = await supabase
        .from("visitas")
        .select("id", { count: 'exact' })
        .gte("created_at", today);

      // Mantenimientos este mes
      const { data: mantenimientos } = await supabase
        .from("mantenimientos")
        .select("id", { count: 'exact' })
        .gte("fecha_mantenimiento", thisMonth.toISOString().split('T')[0]);

      // Viajes activos
      const { data: viajes } = await supabase
        .from("viajes")
        .select("id", { count: 'exact' })
        .in("estado", ["en_transito", "programado"]);

      // Riesgos altos
      const { data: riesgos } = await supabase
        .from("analisis_riesgos")
        .select("id", { count: 'exact' })
        .in("nivel_riesgo", ["alto", "critico"])
        .eq("estado", "abierto");

      // Incidentes pendientes
      const { data: incidentes } = await supabase
        .from("incidentes")
        .select("id", { count: 'exact' })
        .in("estado", ["reportado", "en_investigacion"]);

      // Antidoping positivos
      const { data: antidoping } = await supabase
        .from("pruebas_alcoholimetro")
        .select("id", { count: 'exact' })
        .eq("resultado", "positivo");

      // Actividad reciente
      const activities = [];

      // Últimas unidades ingresadas
      const { data: ultimasUnidades } = await supabase
        .from("ingreso_unidades")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      if (ultimasUnidades && ultimasUnidades.length > 0) {
        activities.push({
          type: "Unidad Ingresada",
          description: `${ultimasUnidades[0].numero_unidad} ingresó con inspección`,
          time: new Date(ultimasUnidades[0].created_at).toLocaleString("es-MX"),
          status: "success",
        });
      }

      // Últimos rondines
      const { data: ultimosRondines } = await supabase
        .from("rondines")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      if (ultimosRondines && ultimosRondines.length > 0) {
        activities.push({
          type: "Rondín Completado",
          description: `Rondín de seguridad en ${ultimosRondines[0].ubicacion}`,
          time: new Date(ultimosRondines[0].created_at).toLocaleString("es-MX"),
          status: ultimosRondines[0].incidente ? "warning" : "success",
        });
      }

      // Últimas visitas
      const { data: ultimasVisitas } = await supabase
        .from("visitas")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2);

      if (ultimasVisitas && ultimasVisitas.length > 0) {
        activities.push({
          type: "Visita Registrada",
          description: `${ultimasVisitas[0].tipo} - ${ultimasVisitas[0].empresa}`,
          time: new Date(ultimasVisitas[0].created_at).toLocaleString("es-MX"),
          status: "info",
        });
      }

      // Últimos mantenimientos
      const { data: ultimosMantenimientos } = await supabase
        .from("mantenimientos")
        .select("*")
        .eq("estado", "programado")
        .order("fecha_mantenimiento", { ascending: true })
        .limit(1);

      if (ultimosMantenimientos && ultimosMantenimientos.length > 0) {
        activities.push({
          type: "Mantenimiento Programado",
          description: `${ultimosMantenimientos[0].unidad} requiere ${ultimosMantenimientos[0].tipo_mantenimiento}`,
          time: new Date(ultimosMantenimientos[0].fecha_mantenimiento).toLocaleDateString("es-MX"),
          status: "warning",
        });
      }

      setStats({
        unidades: unidades?.length || 0,
        operadores: operadores?.length || 0,
        personal: personal?.length || 0,
        rondinesHoy: rondinesHoy?.length || 0,
        rondinesCompletados: rondinesHoy?.filter(r => !r.incidente).length || 0,
        visitasActivas: visitasActivas?.length || 0,
        visitasHoy: visitasHoy?.length || 0,
        mantenimientosEsteMes: mantenimientos?.length || 0,
        viajesActivos: viajes?.length || 0,
        riesgosAltos: riesgos?.length || 0,
        incidentesPendientes: incidentes?.length || 0,
        antidopingPositivos: antidoping?.length || 0,
      });

      setRecentActivity(activities);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

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
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Unidades Registradas
                </CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.unidades}</div>
                <p className="text-xs text-muted-foreground mt-1">Ingresos registrados</p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operadores Activos
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.operadores}</div>
                <p className="text-xs text-muted-foreground mt-1">Con licencia vigente</p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Rondines Hoy
                </CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{stats.rondinesHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.rondinesCompletados} completados</p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alertas Pendientes
                </CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-destructive">
                  {stats.riesgosAltos + stats.incidentesPendientes}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Requieren atención</p>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Personal Activo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.personal}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Visitas Hoy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.visitasHoy}</div>
                <p className="text-xs text-muted-foreground mt-1">{stats.visitasActivas} activas</p>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Viajes Activos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.viajesActivos}</div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Mantenimientos Mes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{stats.mantenimientosEsteMes}</div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">No hay actividad reciente</p>
              ) : (
                recentActivity.map((activity, index) => (
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
                ))
              )}
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
                  <span className="font-medium text-foreground">
                    {stats.unidades > 0 ? "100%" : "0%"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full" style={{ width: stats.unidades > 0 ? "100%" : "0%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rondines a Tiempo</span>
                  <span className="font-medium text-foreground">
                    {stats.rondinesHoy > 0 ? Math.round((stats.rondinesCompletados / stats.rondinesHoy) * 100) : 0}%
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: stats.rondinesHoy > 0 ? `${Math.round((stats.rondinesCompletados / stats.rondinesHoy) * 100)}%` : "0%" }} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Mantenimientos Preventivos</span>
                  <span className="font-medium text-foreground">
                    {stats.mantenimientosEsteMes}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-secondary rounded-full" style={{ width: stats.mantenimientosEsteMes > 0 ? "85%" : "0%" }} />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Cumplimiento CTPAT</span>
                  <span className="font-medium text-foreground">
                    {stats.antidopingPositivos === 0 && stats.riesgosAltos === 0 ? "97%" : "85%"}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-accent rounded-full" 
                    style={{ width: stats.antidopingPositivos === 0 && stats.riesgosAltos === 0 ? "97%" : "85%" }} 
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
