import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Package, AlertTriangle, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function WarehouseInventory() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: inventario, isLoading } = useQuery({
    queryKey: ["inventario_completo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_refacciones")
        .select(`
          *,
          refacciones (*),
          ubicaciones_almacen (codigo, descripcion)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: resumenStock } = useQuery({
    queryKey: ["resumen_stock"],
    queryFn: async () => {
      const { data: refacciones } = await supabase
        .from("refacciones")
        .select("*")
        .eq("activa", true);

      if (!refacciones) return [];

      const resumen = await Promise.all(
        refacciones.map(async (refaccion) => {
          const { data: stock } = await supabase
            .from("inventario_refacciones")
            .select("id, estado")
            .eq("refaccion_id", refaccion.id);

          const disponible = stock?.filter(s => s.estado === "disponible").length || 0;
          const reservado = stock?.filter(s => s.estado === "reservado").length || 0;
          const total = disponible + reservado;

          return {
            ...refaccion,
            stock_disponible: disponible,
            stock_reservado: reservado,
            stock_total: total,
            alerta_minimo: total <= refaccion.stock_minimo,
            alerta_reorden: total <= refaccion.punto_reorden,
          };
        })
      );

      return resumen;
    },
  });

  const filteredInventario = inventario?.filter((item: any) =>
    item.refacciones?.numero_parte.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.refacciones?.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.numero_serie?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredResumen = resumenStock?.filter((item) =>
    item.numero_parte.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, any> = {
      disponible: "default",
      reservado: "secondary",
      asignado: "outline",
      dañado: "destructive",
      caducado: "destructive",
    };
    return <Badge variant={variants[estado] || "outline"}>{estado.toUpperCase()}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to="/almacen">
        <Button variant="outline" size="sm">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Almacén
        </Button>
      </Link>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar en inventario..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="resumen" className="space-y-4">
        <TabsList>
          <TabsTrigger value="resumen">Resumen de Stock</TabsTrigger>
          <TabsTrigger value="detalle">Inventario Detallado</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-4">
          {filteredResumen?.map((item) => (
            <Card key={item.id} className={item.alerta_minimo ? "border-destructive" : ""}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">{item.numero_parte}</CardTitle>
                    <p className="text-sm text-muted-foreground">{item.descripcion}</p>
                  </div>
                  {item.alerta_minimo && (
                    <Badge variant="destructive">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Stock Bajo
                    </Badge>
                  )}
                  {!item.alerta_minimo && item.alerta_reorden && (
                    <Badge variant="secondary">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Reordenar
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Disponible:</span>
                    <p className="text-2xl font-bold text-primary">{item.stock_disponible}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Reservado:</span>
                    <p className="text-2xl font-bold">{item.stock_reservado}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Total:</span>
                    <p className="text-2xl font-bold">{item.stock_total}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Mínimo:</span>
                    <p className="text-lg font-medium">{item.stock_minimo}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Máximo:</span>
                    <p className="text-lg font-medium">{item.stock_maximo}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredResumen?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No se encontraron refacciones</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="detalle" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredInventario?.map((item: any) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{item.refacciones?.numero_parte}</CardTitle>
                    </div>
                    {getEstadoBadge(item.estado)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{item.refacciones?.descripcion}</p>
                  
                  <div className="space-y-1 text-sm">
                    {item.numero_serie && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Serie:</span>
                        <span className="font-medium">{item.numero_serie}</span>
                      </div>
                    )}
                    {item.lote && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Lote:</span>
                        <span className="font-medium">{item.lote}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ubicación:</span>
                      <span className="font-medium">{item.ubicaciones_almacen?.codigo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Proveedor:</span>
                      <span className="font-medium">{item.proveedor}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo:</span>
                      <span className="font-medium">${item.costo_unitario}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredInventario?.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No se encontró inventario</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}