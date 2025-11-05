import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin, TrendingUp, AlertTriangle, ClipboardList, Truck, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Warehouse() {
  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["warehouse-stats"],
    queryFn: async () => {
      const [refacciones, inventario, solicitudes, ubicaciones] = await Promise.all([
        supabase.from("refacciones").select("id, activa"),
        supabase.from("inventario_refacciones").select("id, estado"),
        supabase.from("solicitudes_refacciones").select("id, estado, prioridad"),
        supabase.from("ubicaciones_almacen").select("id, activa"),
      ]);

      const inventarioDisponible = inventario.data?.filter(i => i.estado === "disponible").length || 0;
      const inventarioReservado = inventario.data?.filter(i => i.estado === "reservado").length || 0;
      const solicitudesPendientes = solicitudes.data?.filter(s => s.estado === "pendiente").length || 0;
      const solicitudesUrgentes = solicitudes.data?.filter(s => s.prioridad === "urgente" && s.estado !== "completada").length || 0;

      return {
        totalRefacciones: refacciones.data?.filter(r => r.activa).length || 0,
        inventarioDisponible,
        inventarioReservado,
        solicitudesPendientes,
        solicitudesUrgentes,
        ubicacionesActivas: ubicaciones.data?.filter(u => u.activa).length || 0,
      };
    },
  });

  const modules = [
    {
      title: "Catálogo de Refacciones",
      description: "Gestión de refacciones, precios y proveedores",
      icon: Package,
      path: "/almacen/catalogo",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Ubicaciones",
      description: "Administrar estanterías y zonas del almacén",
      icon: MapPin,
      path: "/almacen/ubicaciones",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Recepción",
      description: "Registrar entrada de refacciones",
      icon: Truck,
      path: "/almacen/recepcion",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Solicitudes",
      description: "Crear y gestionar solicitudes de refacciones",
      icon: ClipboardList,
      path: "/almacen/solicitudes",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Inventario",
      description: "Ver stock actual y movimientos",
      icon: TrendingUp,
      path: "/almacen/inventario",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
    },
    {
      title: "Reportes",
      description: "Análisis y reportes del almacén",
      icon: BarChart3,
      path: "/almacen/reportes",
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Refacciones</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRefacciones}</div>
            <p className="text-xs text-muted-foreground">Activas en catálogo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Disponible</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.inventarioDisponible}</div>
            <p className="text-xs text-muted-foreground">{stats?.inventarioReservado} reservadas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.solicitudesPendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.solicitudesUrgentes}</div>
            <p className="text-xs text-muted-foreground">Alta prioridad</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert for urgent requests */}
      {stats && stats.solicitudesUrgentes > 0 && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Solicitudes Urgentes</h3>
                <p className="text-sm text-muted-foreground">
                  Hay {stats.solicitudesUrgentes} solicitud(es) urgente(s) que requieren atención inmediata
                </p>
              </div>
              <Button asChild>
                <Link to="/almacen/solicitudes">Ver Solicitudes</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modules Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => {
          const Icon = module.icon;
          return (
            <Link key={module.path} to={module.path}>
              <Card className="hover:shadow-lg transition-all duration-200 hover:scale-105 h-full">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${module.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${module.color}`} />
                  </div>
                  <CardTitle className="text-xl">{module.title}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full">
                    Acceder
                  </Button>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}