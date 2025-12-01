import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSpreadsheet, Download, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import { format, eachDayOfInterval, differenceInMinutes, getDay } from "date-fns";
import { es } from "date-fns/locale";

interface IndividualAttendanceReportDialogProps {
  isAdmin: boolean;
}

export default function IndividualAttendanceReportDialog({ isAdmin }: IndividualAttendanceReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedPersonalId, setSelectedPersonalId] = useState("");
  const [personal, setPersonal] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPersonal = async () => {
    try {
      const { data, error } = await supabase
        .from("personal")
        .select("id, nombre, numero_empleado, departamento, puesto, hora_entrada_esperada, hora_salida_esperada, hora_salida_sabado")
        .eq("estado", "activo")
        .order("nombre", { ascending: true });

      if (error) throw error;
      setPersonal(data || []);
    } catch (error) {
      console.error("Error loading personal:", error);
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate || !selectedPersonalId) {
      toast({
        title: "Error",
        description: "Complete todos los campos",
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
      // Obtener información del empleado
      const selectedPerson = personal.find(p => p.id === selectedPersonalId);
      if (!selectedPerson) throw new Error("Empleado no encontrado");

      // Horarios personalizados
      const horaEntradaEsperada = selectedPerson.hora_entrada_esperada || "09:00:00";
      const horaSalidaEsperada = selectedPerson.hora_salida_esperada || "18:00:00";
      const horaSalidaSabado = selectedPerson.hora_salida_sabado || "13:30:00";

      // Ajustar fechas
      const startDateTime = `${startDate}T00:00:00`;
      const endDateTime = `${endDate}T23:59:59`;

      // Obtener asistencias
      const { data: attendanceData, error: attendanceError } = await supabase
        .from("asistencia_personal")
        .select("*")
        .eq("personal_id", selectedPersonalId)
        .gte("fecha_entrada", startDateTime)
        .lte("fecha_entrada", endDateTime)
        .order("fecha_entrada", { ascending: true });

      if (attendanceError) throw attendanceError;

      // Obtener vales
      const { data: valesData, error: valesError } = await supabase
        .from("vales_salida")
        .select("*")
        .eq("personal_id", selectedPersonalId)
        .gte("fecha_vale", startDate)
        .lte("fecha_vale", endDate);

      if (valesError) throw valesError;

      // Generar días del período
      const days = eachDayOfInterval({
        start: new Date(startDate),
        end: new Date(endDate)
      });

      // Calcular estadísticas generales
      let totalAusencias = 0;
      let totalPermisos = (valesData || []).filter(v => v.estado === "usado").length;
      let totalViajes = 0; // Por implementar si hay módulo de viajes
      let totalAsistencias = 0;
      let totalHorasExtra = 0;
      let totalHorasExtraEspecial = 0;
      let totalLlegadasTarde = 0;
      let totalMinutosLlegadaTarde = 0;
      let totalSalidasTempranas = 0;
      let totalMinutosSalidaTemprana = 0;

      // Preparar datos detallados por día
      const dailyData: any[] = [];

      days.forEach(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const dayOfWeek = getDay(day);
        const dayName = format(day, "EEE", { locale: es });
        
        // Buscar asistencias de ese día
        const dayAttendances = (attendanceData || []).filter(a => {
          const entryDate = format(new Date(a.fecha_entrada), "yyyy-MM-dd");
          return entryDate === dateStr;
        });

        if (dayAttendances.length === 0) {
          // Día ausente
          totalAusencias++;
          dailyData.push({
            "Fecha/Día": `${format(day, "dd/MMM", { locale: es })}`,
            "Per. 1 Inicio": "",
            "Per. 1 Fin": "",
            "Per. 2 Inicio": "",
            "Per. 2 Fin": "",
            "H. extra Normal": "",
            "H. extra Especial": "",
            "Llegada tardía Veces": "",
            "Llegada tardía Minuta": "",
            "Salida temprana Veces": "",
            "Salida temprana Minuta": ""
          });
        } else {
          totalAsistencias++;

          // Tomar la primera asistencia del día
          const attendance = dayAttendances[0];
          const entrada = new Date(attendance.fecha_entrada);
          const salida = attendance.fecha_salida ? new Date(attendance.fecha_salida) : null;

          // Calcular si llegó tarde
          const [horaEsperada, minutoEsperado] = horaEntradaEsperada.split(':').map(Number);
          const horaEntrada = entrada.getHours();
          const minutoEntrada = entrada.getMinutes();
          const llegadaTarde = horaEntrada > horaEsperada || (horaEntrada === horaEsperada && minutoEntrada > minutoEsperado);
          
          let minutosLlegadaTarde = 0;
          if (llegadaTarde) {
            const horaEsperadaDate = new Date(entrada);
            horaEsperadaDate.setHours(horaEsperada, minutoEsperado, 0, 0);
            minutosLlegadaTarde = differenceInMinutes(entrada, horaEsperadaDate);
            totalLlegadasTarde++;
            totalMinutosLlegadaTarde += minutosLlegadaTarde;
          }

          // Calcular si salió temprano y horas extra
          let salidaTemprana = false;
          let minutosSalidaTemprana = 0;
          let minutosExtra = 0;
          let tipoExtra = ""; // "Normal" o "Especial"

          if (salida) {
            const horaSalida = salida.getHours();
            const minutoSalida = salida.getMinutes();
            
            // Determinar hora de salida esperada según día
            let horaSalidaEsperadaNum = 18;
            let minutoSalidaEsperado = 0;
            
            if (dayOfWeek === 6) { // Sábado
              [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaSabado.split(':').map(Number);
            } else if (dayOfWeek !== 0) { // Lunes a viernes
              [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
            }

            const horaSalidaEsperadaDate = new Date(salida);
            horaSalidaEsperadaDate.setHours(horaSalidaEsperadaNum, minutoSalidaEsperado, 0, 0);

            if (salida < horaSalidaEsperadaDate) {
              // Salió temprano
              salidaTemprana = true;
              minutosSalidaTemprana = differenceInMinutes(horaSalidaEsperadaDate, salida);
              totalSalidasTempranas++;
              totalMinutosSalidaTemprana += minutosSalidaTemprana;
            } else if (salida > horaSalidaEsperadaDate) {
              // Tiempo extra
              minutosExtra = differenceInMinutes(salida, horaSalidaEsperadaDate);
              
              // Determinar si es extra normal o especial (después de 8pm o domingo)
              if (dayOfWeek === 0 || horaSalida >= 20) {
                tipoExtra = "Especial";
                totalHorasExtraEspecial += minutosExtra;
              } else {
                tipoExtra = "Normal";
                totalHorasExtra += minutosExtra;
              }
            }
          }

          // Formatear horas extra
          const horasExtra = Math.floor(minutosExtra / 60);
          const minutosExtraRestantes = minutosExtra % 60;
          const horasExtraStr = minutosExtra > 0 ? `${String(horasExtra).padStart(2, '0')}:${String(minutosExtraRestantes).padStart(2, '0')}` : "";

          dailyData.push({
            "Fecha/Día": `${format(day, "dd/MMM", { locale: es })}`,
            "Per. 1 Inicio": format(entrada, "HH:mm"),
            "Per. 1 Fin": salida ? format(salida, "HH:mm") : "",
            "Per. 2 Inicio": "",
            "Per. 2 Fin": "",
            "H. extra Normal": tipoExtra === "Normal" ? horasExtraStr : "",
            "H. extra Especial": tipoExtra === "Especial" ? horasExtraStr : "",
            "Llegada tardía Veces": llegadaTarde ? "1" : "0",
            "Llegada tardía Minuta": llegadaTarde ? minutosLlegadaTarde.toString() : "0",
            "Salida temprana Veces": salidaTemprana ? "1" : "0",
            "Salida temprana Minuta": salidaTemprana ? minutosSalidaTemprana.toString() : "0"
          });
        }
      });

      // Crear workbook
      const workbook = XLSX.utils.book_new();

      // Hoja 1: Encabezado y resumen
      const summaryData = [
        ["Fecha:", `${startDate} ~ ${endDate}`],
        ["Depart.", selectedPerson.departamento, "Nombre", selectedPerson.nombre],
        ["Fecha", `${startDate} ~ ${endDate}`, "ID.", selectedPerson.numero_empleado],
        [],
        ["Ausencia (Día)", "P. (Día)", "Viajes (Día)", "Asist (Día)", "H. extra", "", "Llegada tardía", "", "Salida temprana", ""],
        ["", "", "", "", "Normal", "Especial", "Veces", "Minuta", "Veces", "Minuta"],
        [
          totalAusencias.toFixed(1),
          totalPermisos.toFixed(1),
          totalViajes.toFixed(1),
          totalAsistencias.toFixed(1),
          `${Math.floor(totalHorasExtra / 60).toString().padStart(2, '0')}:${(totalHorasExtra % 60).toString().padStart(2, '0')}`,
          `${Math.floor(totalHorasExtraEspecial / 60).toString().padStart(2, '0')}:${(totalHorasExtraEspecial % 60).toString().padStart(2, '0')}`,
          totalLlegadasTarde,
          totalMinutosLlegadaTarde,
          totalSalidasTempranas,
          totalMinutosSalidaTemprana
        ],
        [],
        ["Informe de asistencia"],
      ];

      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      
      // Agregar datos diarios
      const dailySheet = XLSX.utils.sheet_add_json(summarySheet, dailyData, {
        origin: -1,
        skipHeader: false
      });

      // Ajustar anchos de columna
      summarySheet['!cols'] = [
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 }
      ];

      XLSX.utils.book_append_sheet(workbook, summarySheet, "Reporte Individual");

      // Descargar archivo
      const fileName = `Reporte_${selectedPerson.nombre.replace(/ /g, '_')}_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Éxito",
        description: "Reporte individual generado exitosamente",
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
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) loadPersonal();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <User className="h-4 w-4" />
          Reporte Individual
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reporte Individual de Asistencia</DialogTitle>
          <DialogDescription>
            Genere un reporte detallado día por día para un empleado
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Seleccionar Empleado</Label>
            <Select value={selectedPersonalId} onValueChange={setSelectedPersonalId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un empleado" />
              </SelectTrigger>
              <SelectContent>
                {personal.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre} - {p.numero_empleado}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
              <li>Resumen de ausencias, permisos y asistencias</li>
              <li>Desglose día por día con horarios</li>
              <li>Horas extra (normal y especial)</li>
              <li>Llegadas tarde y salidas tempranas</li>
              <li>Basado en horario personalizado del empleado</li>
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
