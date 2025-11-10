import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { 
  calcularDiasTrabajados,
  calcularHorasTrabajadas,
  calcularDiasLlegadaTarde, 
  calcularDiasSalidaAnticipada,
  calcularTiempoSalidaAnticipada,
  calcularTiempoExtra,
  calcularPermisosUsados
} from "@/lib/attendanceUtils";

interface AttendanceReportDialogProps {
  isAdmin: boolean;
}

export default function AttendanceReportDialog({ isAdmin }: AttendanceReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Seleccione ambas fechas",
        variant: "destructive",
      });
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Error",
        description: "La fecha inicial debe ser anterior a la fecha final",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Obtener todo el personal activo
      const { data: personalData, error: personalError } = await supabase
        .from("personal")
        .select("*")
        .eq("estado", "activo")
        .order("nombre", { ascending: true });

      if (personalError) throw personalError;

      // Ajustar fechas para incluir todo el día
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      // Obtener todas las asistencias en el rango de fechas
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("asistencia_personal")
        .select("*")
        .gte("fecha_entrada", startDateTime)
        .lte("fecha_entrada", endDateTime);

      if (attendanceError) throw attendanceError;

      console.log("Asistencias encontradas:", attendanceData?.length);

      // Obtener todos los vales en el rango de fechas
      const { data: valesData, error: valesError } = await supabase
        .from("vales_salida")
        .select("*")
        .gte("fecha_vale", startDate)
        .lte("fecha_vale", endDate);

      if (valesError) throw valesError;

      // Procesar datos para cada persona
      const reportData = (personalData || []).map((person) => {
        const personAttendances = (attendanceData || []).filter(
          (a) => a.personal_id === person.id
        );
        const personVales = (valesData || []).filter(
          (v) => v.personal_id === person.id && v.estado === "usado"
        );

        console.log(`${person.nombre}: ${personAttendances.length} asistencias`);

        const diasTrabajados = calcularDiasTrabajados(personAttendances);
        const diasLlegadaTarde = calcularDiasLlegadaTarde(personAttendances);
        const diasSalidaAnticipada = calcularDiasSalidaAnticipada(personAttendances);
        const tiempoSalidaAnticipada = calcularTiempoSalidaAnticipada(personAttendances);
        const permisosUsados = calcularPermisosUsados(personVales);
        const horasTrabajadas = calcularHorasTrabajadas(personAttendances);
        
        // Calcular tiempo extra solo para monitoreo y taller
        let tiempoExtra = { horas: 0, minutos: 0, formateado: "0h 0m" };
        const departamentosConExtra = ["monitoreo", "taller"];
        if (departamentosConExtra.includes(person.departamento.toLowerCase())) {
          tiempoExtra = calcularTiempoExtra(personAttendances);
        }

        return {
          Nombre: person.nombre,
          "Número Empleado": person.numero_empleado,
          Departamento: person.departamento,
          Puesto: person.puesto,
          "Días Trabajados": diasTrabajados,
          "Horas Laboradas": horasTrabajadas.horasFormateadas,
          "Días Llegada Tarde": diasLlegadaTarde,
          "Permisos de Salida": permisosUsados,
          "Días Salida Anticipada": diasSalidaAnticipada,
          "Tiempo Salida Anticipada": tiempoSalidaAnticipada.formateado,
          "Tiempo Extra": tiempoExtra.formateado,
        };
      });

      // Crear libro de Excel
      const worksheet = XLSX.utils.json_to_sheet(reportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte Asistencia");

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 30 }, // Nombre
        { wch: 15 }, // Número Empleado
        { wch: 20 }, // Departamento
        { wch: 25 }, // Puesto
        { wch: 15 }, // Días Trabajados
        { wch: 18 }, // Horas Laboradas
        { wch: 18 }, // Días Llegada Tarde
        { wch: 18 }, // Permisos de Salida
        { wch: 20 }, // Días Salida Anticipada
        { wch: 22 }, // Tiempo Salida Anticipada
        { wch: 15 }, // Tiempo Extra
      ];
      worksheet['!cols'] = columnWidths;

      // Descargar archivo
      const fileName = `Reporte_Asistencia_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Éxito",
        description: "Reporte generado exitosamente",
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

  if (!isAdmin) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Generar Reporte
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporte de Asistencia</DialogTitle>
          <DialogDescription>
            Genere un reporte detallado de asistencia en formato Excel
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Fecha Inicial</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Fecha Final</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
            <p className="font-medium">El reporte incluirá:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li>Días trabajados</li>
              <li>Total de horas laboradas</li>
              <li>Días de llegada tarde (después de 9:00 AM)</li>
              <li>Permisos de salida utilizados</li>
              <li>Días con salida anticipada</li>
              <li>Tiempo de salida anticipada</li>
              <li>Tiempo extra (solo Monitoreo y Taller)</li>
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
