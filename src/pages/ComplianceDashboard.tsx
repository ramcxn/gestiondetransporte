import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ClipboardCheck, FileText, AlertTriangle, CheckCircle, Calendar } from "lucide-react";

export default function ComplianceDashboard() {
  const { data: inventarioData } = useQuery({
    queryKey: ["inventario_operador_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_operador")
        .select("*")
        .order("fecha_hora", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const { data: revisionesData } = useQuery({
    queryKey: ["revision_documental_dashboard"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revision_documental")
        .select("*")
        .order("fecha_revision", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Estadísticas de inventario de operador
  const inventarioStats = {
    total: inventarioData?.length || 0,
    aprobados: inventarioData?.filter(i => i.estado === "aprobado").length || 0,
    requiereCorreccion: inventarioData?.filter(i => i.estado === "requiere_correccion").length || 0,
    pendientes: inventarioData?.filter(i => i.estado === "pendiente").length || 0,
  };

  const inventarioPieData = [
    { name: "Aprobados", value: inventarioStats.aprobados, color: "#10b981" },
    { name: "Requiere Corrección", value: inventarioStats.requiereCorreccion, color: "#f59e0b" },
    { name: "Pendientes", value: inventarioStats.pendientes, color: "#6b7280" },
  ];

  // Estadísticas de revisión documental
  const documentalStats = {
    total: revisionesData?.length || 0,
    vigentes: revisionesData?.filter(r => r.estado_general === "vigente").length || 0,
    proximosVencer: revisionesData?.filter(r => r.estado_general === "proximo_vencer").length || 0,
    vencidos: revisionesData?.filter(r => r.estado_general === "vencido").length || 0,
  };

  const documentalPieData = [
    { name: "Vigentes", value: documentalStats.vigentes, color: "#10b981" },
    { name: "Próximos a Vencer", value: documentalStats.proximosVencer, color: "#f59e0b" },
    { name: "Vencidos", value: documentalStats.vencidos, color: "#ef4444" },
  ];

  // Alertas de vencimientos próximos
  const getDaysUntilExpiry = (date: string) => {
    const expiryDate = new Date(date);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const alertasVencimiento = revisionesData?.filter(r => {
    const licenciaDays = r.vigencia_licencia ? getDaysUntilExpiry(r.vigencia_licencia) : 999;
    const analisisDays = r.vigencia_analisis_fisicoquimico ? getDaysUntilExpiry(r.vigencia_analisis_fisicoquimico) : 999;
    const humosDays = r.vigencia_dictamen_humos ? getDaysUntilExpiry(r.vigencia_dictamen_humos) : 999;
    
    return licenciaDays <= 15 || analisisDays <= 15 || humosDays <= 15;
  }) || [];

  const cumplimientoGlobal = inventarioData?.length ? 
    Math.round((inventarioStats.aprobados / inventarioData.length) * 100) : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart className="h-8 w-8" />
          Dashboard de Cumplimiento
        </h1>
        <p className="text-muted-foreground mt-1">
          Indicadores y métricas de cumplimiento operacional
        </p>
      </div>

      {/* KPIs Principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Cumplimiento Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{cumplimientoGlobal}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {inventarioStats.aprobados} de {inventarioStats.total} revisiones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos Vigentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{documentalStats.vigentes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {documentalStats.total} unidades registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Alertas Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">{alertasVencimiento.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Documentos próximos a vencer
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Documentos Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{documentalStats.vencidos}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Requieren actualización urgente
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Estado de Inventarios de Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={inventarioPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {inventarioPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Estado de Documentación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentalPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentalPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de Vencimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Alertas de Vencimiento (Próximos 15 días)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertasVencimiento.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No hay documentos próximos a vencer
              </p>
            ) : (
              alertasVencimiento.map((alerta) => (
                <div key={alerta.id} className="border-l-4 border-orange-500 pl-4 py-2 bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{alerta.numero_economico} - {alerta.operador_nombre}</h4>
                      <div className="text-sm text-muted-foreground space-y-1 mt-1">
                        {alerta.vigencia_licencia && getDaysUntilExpiry(alerta.vigencia_licencia) <= 15 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            Licencia vence en {getDaysUntilExpiry(alerta.vigencia_licencia)} días
                          </p>
                        )}
                        {alerta.vigencia_analisis_fisicoquimico && getDaysUntilExpiry(alerta.vigencia_analisis_fisicoquimico) <= 15 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            Análisis vence en {getDaysUntilExpiry(alerta.vigencia_analisis_fisicoquimico)} días
                          </p>
                        )}
                        {alerta.vigencia_dictamen_humos && getDaysUntilExpiry(alerta.vigencia_dictamen_humos) <= 15 && (
                          <p className="flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            Dictamen de humos vence en {getDaysUntilExpiry(alerta.vigencia_dictamen_humos)} días
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {alerta.empresa}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Últimas Revisiones */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Últimas Revisiones de Inventario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inventarioData?.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.operador_nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.numero_unidad} - {new Date(item.fecha_hora).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <Badge variant={
                    item.estado === "aprobado" ? "default" :
                    item.estado === "requiere_correccion" ? "destructive" : "secondary"
                  }>
                    {item.estado}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Últimas Revisiones Documentales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {revisionesData?.slice(0, 5).map((item) => (
                <div key={item.id} className="flex justify-between items-center border-b pb-2">
                  <div>
                    <p className="font-medium">{item.numero_economico}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.operador_nombre} - {new Date(item.fecha_revision).toLocaleDateString("es-MX")}
                    </p>
                  </div>
                  <Badge variant={
                    item.estado_general === "vigente" ? "default" :
                    item.estado_general === "proximo_vencer" ? "secondary" : "destructive"
                  }>
                    {item.estado_general}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
