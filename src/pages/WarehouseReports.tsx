import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Clock, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function WarehouseReports() {
  const { data: metricas, isLoading } = useQuery({
    queryKey: ["warehouse_metricas"],
    queryFn: async () => {
      const [movimientos, solicitudes, inventario] = await Promise.all([
        supabase
          .from("movimientos_refacciones")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("solicitudes_refacciones")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("inventario_refacciones")
          .select("*, refacciones(*)"),
      ]);

      // Calcular tiempo promedio de suministro
      const solicitudesCompletadas = solicitudes.data?.filter(
        s => s.estado === "completada" && s.fecha_completada && s.fecha_solicitud
      ) || [];

      const tiemposSuplyminuto = solicitudesCompletadas.map(s => {
        const inicio = new Date(s.fecha_solicitud).getTime();
        const fin = new Date(s.fecha_completada!).getTime();
        return (fin - inicio) / (1000 * 60 * 60); // horas
      });

      const tiempoPromedioHoras = tiemposSuplyminuto.length > 0
        ? tiemposSuplyminuto.reduce((a, b) => a + b, 0) / tiemposSuplyminuto.length
        : 0;

      // Refacciones más usadas
      const movimientosSalida = movimientos.data?.filter(m => m.tipo_movimiento === "salida") || [];
      const conteoRefacciones = movimientosSalida.reduce((acc: any, mov) => {
        const id = mov.refaccion_id;
        acc[id] = (acc[id] || 0) + mov.cantidad;
        return acc;
      }, {});

      const topRefacciones = Object.entries(conteoRefacciones)
        .sort((a: any, b: any) => b[1] - a[1])
        .slice(0, 10);

      // Valor total de inventario
      const valorTotal = inventario.data?.reduce((sum, item) => {
        if (item.estado === "disponible" || item.estado === "reservado") {
          return sum + parseFloat(item.costo_unitario.toString());
        }
        return sum;
      }, 0) || 0;

      return {
        tiempoPromedioHoras: tiempoPromedioHoras.toFixed(2),
        totalMovimientos: movimientos.data?.length || 0,
        solicitudesPendientes: solicitudes.data?.filter(s => s.estado === "pendiente").length || 0,
        valorInventario: valorTotal.toFixed(2),
        topRefacciones,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Reportes y Análisis</h2>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tiempo Promedio Suministro</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.tiempoPromedioHoras}h</div>
            <p className="text-xs text-muted-foreground">Solicitud a entrega</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Movimientos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.totalMovimientos}</div>
            <p className="text-xs text-muted-foreground">Últimos 100 registros</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas?.solicitudesPendientes}</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Inventario</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${metricas?.valorInventario}</div>
            <p className="text-xs text-muted-foreground">Stock disponible y reservado</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Refacciones */}
      <Card>
        <CardHeader>
          <CardTitle>Refacciones Más Utilizadas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metricas?.topRefacciones.map(([id, cantidad]: any, index: number) => (
              <div key={id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <div>
                    <p className="font-medium">ID: {id}</p>
                    <p className="text-sm text-muted-foreground">Salidas registradas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{cantidad}</p>
                  <p className="text-xs text-muted-foreground">unidades</p>
                </div>
              </div>
            ))}
          </div>

          {metricas?.topRefacciones.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay datos suficientes para mostrar estadísticas
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}