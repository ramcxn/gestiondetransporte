import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { differenceInMinutes, format } from "date-fns";
import { es } from "date-fns/locale";

export default function VisitsReportDialog() {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!month) {
      toast({
        title: "Error",
        description: "Seleccione un mes",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calcular fechas del mes seleccionado
      const [year, monthNum] = month.split("-");
      const startDate = `${year}-${monthNum}-01T00:00:00`;
      const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
      const endDate = `${year}-${monthNum}-${lastDay}T23:59:59`;

      // Obtener todas las visitas del mes
      const { data: visitsData, error: visitsError } = await supabase
        .from("visitas")
        .select("*")
        .gte("created_at", startDate)
        .lte("created_at", endDate)
        .order("created_at", { ascending: false });

      if (visitsError) throw visitsError;

      console.log("Visitas encontradas:", visitsData?.length);

      // Obtener información de los usuarios que registraron las visitas
      const userIds = [...new Set(visitsData?.map(v => v.created_by) || [])];
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p.full_name]) || []);

      // Procesar datos para el reporte
      const reportData = (visitsData || []).map((visit) => {
        const fechaEntrada = new Date(visit.created_at);
        const fechaSalida = visit.fecha_salida ? new Date(visit.fecha_salida) : null;
        
        // Calcular tiempo de permanencia
        let tiempoPermanencia = "N/A";
        if (fechaSalida) {
          const minutos = differenceInMinutes(fechaSalida, fechaEntrada);
          const horas = Math.floor(minutos / 60);
          const mins = minutos % 60;
          tiempoPermanencia = `${horas}h ${mins}m`;
        }

        return {
          Nombre: visit.nombre,
          Empresa: visit.empresa,
          Tipo: visit.tipo === "visitante" ? "Visitante" : "Proveedor",
          "Motivo de Visita": visit.motivo,
          "Área Visitada": visit.area_visita,
          "Fecha de Entrada": format(fechaEntrada, "dd/MM/yyyy", { locale: es }),
          "Hora de Entrada": format(fechaEntrada, "HH:mm", { locale: es }),
          "Fecha de Salida": fechaSalida ? format(fechaSalida, "dd/MM/yyyy", { locale: es }) : "En instalaciones",
          "Hora de Salida": fechaSalida ? format(fechaSalida, "HH:mm", { locale: es }) : "N/A",
          "Tiempo de Permanencia": tiempoPermanencia,
          Estado: visit.estado === "en_instalaciones" ? "En instalaciones" : "Salió",
          "Registrado por": profilesMap.get(visit.created_by) || "Usuario",
        };
      });

      // Calcular estadísticas
      const totalVisitas = reportData.length;
      const visitantes = reportData.filter(v => v.Tipo === "Visitante").length;
      const proveedores = reportData.filter(v => v.Tipo === "Proveedor").length;
      const enInstalaciones = reportData.filter(v => v.Estado === "En instalaciones").length;

      // Crear estadísticas summary
      const statsData = [
        { Concepto: "Total de Visitas", Valor: totalVisitas },
        { Concepto: "Visitantes", Valor: visitantes },
        { Concepto: "Proveedores", Valor: proveedores },
        { Concepto: "Actualmente en Instalaciones", Valor: enInstalaciones },
      ];

      // Crear libro de Excel con dos hojas
      const workbook = XLSX.utils.book_new();
      
      // Hoja 1: Estadísticas
      const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, "Estadísticas");
      
      // Hoja 2: Detalle de visitas
      const detailWorksheet = XLSX.utils.json_to_sheet(reportData);
      XLSX.utils.book_append_sheet(workbook, detailWorksheet, "Detalle de Visitas");

      // Ajustar ancho de columnas para la hoja de detalles
      const columnWidths = [
        { wch: 30 }, // Nombre
        { wch: 25 }, // Empresa
        { wch: 12 }, // Tipo
        { wch: 40 }, // Motivo
        { wch: 20 }, // Área
        { wch: 15 }, // Fecha Entrada
        { wch: 12 }, // Hora Entrada
        { wch: 15 }, // Fecha Salida
        { wch: 12 }, // Hora Salida
        { wch: 18 }, // Tiempo Permanencia
        { wch: 15 }, // Estado
        { wch: 25 }, // Registrado por
      ];
      detailWorksheet['!cols'] = columnWidths;

      // Descargar archivo
      const monthName = format(new Date(parseInt(year), parseInt(monthNum) - 1, 1), "MMMM yyyy", { locale: es });
      const fileName = `Reporte_Visitas_${monthName.replace(" ", "_")}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Éxito",
        description: `Reporte generado: ${totalVisitas} visitas`,
      });

      setOpen(false);
    } catch (error) {
      console.error("Error generating report:", error);
      toast({
        title: "Error",
        description: "No se pudo generar el reporte",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Reporte Mensual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporte Mensual de Visitas</DialogTitle>
          <DialogDescription>
            Genere un reporte detallado de visitas y proveedores en formato Excel
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccione el Mes</Label>
            <Input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </div>
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">El reporte incluirá:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Estadísticas generales del mes</li>
              <li>Detalle completo de cada visita</li>
              <li>Visitantes y proveedores</li>
              <li>Tiempo de permanencia</li>
              <li>Estado actual de cada visita</li>
            </ul>
          </div>
          <Button
            onClick={generateReport}
            disabled={loading}
            className="w-full gap-2"
          >
            <Download className="h-4 w-4" />
            {loading ? "Generando..." : "Descargar Reporte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
