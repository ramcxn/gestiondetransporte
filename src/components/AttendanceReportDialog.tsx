import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { FileSpreadsheet, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { differenceInMinutes } from "date-fns";
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
      // Obtener todo el personal activo con sus horarios
      const { data: personalData, error: personalError } = await supabase
        .from("personal")
        .select("id, nombre, numero_empleado, puesto, departamento, hora_entrada_esperada, hora_salida_esperada, hora_salida_sabado")
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

      // Calcular días laborables en el período (excluyendo domingos)
      const startDateObj = new Date(startDate);
      const endDateObj = new Date(endDate);
      let diasLaborables = 0;
      for (let d = new Date(startDateObj); d <= endDateObj; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        if (dayOfWeek !== 0) { // No contar domingos
          diasLaborables++;
        }
      }

      // Procesar datos para cada persona
      const reportData = (personalData || []).map((person, index) => {
        const personAttendances = (attendanceData || []).filter(
          (a) => a.personal_id === person.id
        );
        const personVales = (valesData || []).filter(
          (v) => v.personal_id === person.id && v.estado === "usado"
        );

        console.log(`${person.nombre}: ${personAttendances.length} asistencias`);

        // Usar horarios personalizados o valores por defecto
        const horaEntradaEsperada = person.hora_entrada_esperada || "09:00:00";
        const horaSalidaEsperada = person.hora_salida_esperada || "18:00:00";
        const horaSalidaSabado = person.hora_salida_sabado || "13:30:00";

        const diasTrabajados = calcularDiasTrabajados(personAttendances);
        const diasLlegadaTarde = calcularDiasLlegadaTarde(personAttendances, horaEntradaEsperada);
        const diasSalidaAnticipada = calcularDiasSalidaAnticipada(personAttendances, horaSalidaEsperada, horaSalidaSabado);
        const tiempoSalidaAnticipada = calcularTiempoSalidaAnticipada(personAttendances, horaSalidaEsperada, horaSalidaSabado);
        const permisosUsados = calcularPermisosUsados(personVales);
        const horasTrabajadas = calcularHorasTrabajadas(personAttendances);
        
        // Calcular tiempo extra dividido en normal y especial
        let minutosExtraNormal = 0;
        let minutosExtraEspecial = 0;
        
        personAttendances.forEach((a) => {
          if (!a.fecha_salida) return;
          
          const salida = new Date(a.fecha_salida);
          const diaSemana = salida.getDay();
          const horaSalida = salida.getHours();
          
          // Determinar hora de salida esperada
          let horaSalidaEsperadaNum = 18;
          let minutoSalidaEsperado = 0;
          
          if (diaSemana === 6) {
            [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaSabado.split(':').map(Number);
          } else if (diaSemana !== 0) {
            [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
          }
          
          const horaSalidaEsperadaDate = new Date(salida);
          horaSalidaEsperadaDate.setHours(horaSalidaEsperadaNum, minutoSalidaEsperado, 0, 0);
          
          if (salida > horaSalidaEsperadaDate) {
            const minutosExtra = differenceInMinutes(salida, horaSalidaEsperadaDate);
            
            // Especial: domingo o después de 8pm
            if (diaSemana === 0 || horaSalida >= 20) {
              minutosExtraEspecial += minutosExtra;
            } else {
              minutosExtraNormal += minutosExtra;
            }
          }
        });

        // Calcular ausencias
        const ausencias = diasLaborables - diasTrabajados;

        // Calcular minutos de llegada tarde
        let totalMinutosLlegadaTarde = 0;
        personAttendances.forEach((a) => {
          const entrada = new Date(a.fecha_entrada);
          const [horaEsperada, minutoEsperado] = horaEntradaEsperada.split(':').map(Number);
          const horaEntrada = entrada.getHours();
          const minutoEntrada = entrada.getMinutes();
          
          if (horaEntrada > horaEsperada || (horaEntrada === horaEsperada && minutoEntrada > minutoEsperado)) {
            const horaEsperadaDate = new Date(entrada);
            horaEsperadaDate.setHours(horaEsperada, minutoEsperado, 0, 0);
            totalMinutosLlegadaTarde += differenceInMinutes(entrada, horaEsperadaDate);
          }
        });

        // Calcular minutos de salida temprana
        let totalMinutosSalidaTemprana = 0;
        personAttendances.forEach((a) => {
          if (!a.fecha_salida) return;
          
          const salida = new Date(a.fecha_salida);
          const diaSemana = salida.getDay();
          
          let horaSalidaEsperadaNum = 18;
          let minutoSalidaEsperado = 0;
          
          if (diaSemana === 6) {
            [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaSabado.split(':').map(Number);
          } else if (diaSemana !== 0) {
            [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
          }
          
          const horaSalidaEsperadaDate = new Date(salida);
          horaSalidaEsperadaDate.setHours(horaSalidaEsperadaNum, minutoSalidaEsperado, 0, 0);
          
          if (salida < horaSalidaEsperadaDate) {
            totalMinutosSalidaTemprana += differenceInMinutes(horaSalidaEsperadaDate, salida);
          }
        });

        // Formatear horas
        const formatHours = (minutos: number) => {
          const horas = Math.floor(minutos / 60);
          const mins = minutos % 60;
          return `${String(horas).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
        };

        return {
          "ID": index + 1,
          "Nombre": person.nombre,
          "Depart.": person.departamento,
          "H. trabajo Estándar": formatHours(diasLaborables * 8 * 60), // Asumiendo 8 horas por día
          "H. trabajo Real": horasTrabajadas.horasFormateadas,
          "Llegada tardía Veces": diasLlegadaTarde,
          "Llegada tardía Minuta": totalMinutosLlegadaTarde,
          "Salida temprana Veces": diasSalidaAnticipada,
          "Salida temprana Minuta": totalMinutosSalidaTemprana,
          "H. extras Normal": formatHours(minutosExtraNormal),
          "H. extras Especial": formatHours(minutosExtraEspecial),
          "Asistencia (est/real)": `${diasLaborables}/${diasTrabajados}`,
          "Ausencia": ausencias.toFixed(1),
          "P.": permisosUsados.toFixed(1),
          "Viajes": "0.0",
          "Marcado": "",
          "H. extra": "",
          "Asignación": "",
          "Tardea/antes": "",
          "P. ocas.": "",
          "Salario": "",
          "Notas": ""
        };
      });

      // Crear libro de Excel con encabezado
      const workbook = XLSX.utils.book_new();
      
      // Crear hoja con título
      const headerData = [
        ["Hoja de resumen de asistencia"],
        [`Fecha: ${startDate} ~ ${endDate}`],
        []
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(headerData);
      
      // Agregar datos
      XLSX.utils.sheet_add_json(worksheet, reportData, {
        origin: -1,
        skipHeader: false
      });

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 5 },  // ID
        { wch: 25 }, // Nombre
        { wch: 15 }, // Depart.
        { wch: 12 }, // H. trabajo Estándar
        { wch: 12 }, // H. trabajo Real
        { wch: 12 }, // Llegada tardía Veces
        { wch: 12 }, // Llegada tardía Minuta
        { wch: 12 }, // Salida temprana Veces
        { wch: 12 }, // Salida temprana Minuta
        { wch: 12 }, // H. extras Normal
        { wch: 12 }, // H. extras Especial
        { wch: 15 }, // Asistencia (est/real)
        { wch: 10 }, // Ausencia
        { wch: 8 },  // P.
        { wch: 8 },  // Viajes
        { wch: 10 }, // Marcado
        { wch: 10 }, // H. extra
        { wch: 12 }, // Asignación
        { wch: 12 }, // Tardea/antes
        { wch: 10 }, // P. ocas.
        { wch: 10 }, // Salario
        { wch: 15 }, // Notas
      ];
      worksheet['!cols'] = columnWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Resumen Asistencia");

      // Descargar archivo
      const fileName = `Hoja_Resumen_Asistencia_${startDate}_${endDate}.xlsx`;
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
              <li>Horas de trabajo estándar vs real</li>
              <li>Llegadas tarde (veces y minutos)</li>
              <li>Salidas tempranas (veces y minutos)</li>
              <li>Horas extras (normal y especial)</li>
              <li>Asistencia (esperada/real) y ausencias</li>
              <li>Permisos utilizados</li>
              <li>Columnas para adiciones y deducciones</li>
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
