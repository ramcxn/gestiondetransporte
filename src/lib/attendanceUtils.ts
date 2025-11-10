import { differenceInMinutes, parse, getDay } from "date-fns";

export interface HorasTrabajadas {
  totalHoras: number;
  totalMinutos: number;
  diasTrabajados: number;
  horasFormateadas: string;
}

export interface TiempoFormateado {
  horas: number;
  minutos: number;
  formateado: string;
}

export function calcularHorasTrabajadas(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>
): HorasTrabajadas {
  let totalMinutos = 0;
  let diasTrabajados = 0;

  asistencias.forEach((asistencia) => {
    if (asistencia.fecha_salida) {
      const entrada = new Date(asistencia.fecha_entrada);
      const salida = new Date(asistencia.fecha_salida);
      const minutos = differenceInMinutes(salida, entrada);
      if (minutos > 0) {
        totalMinutos += minutos;
        diasTrabajados++;
      }
    }
  });

  const totalHoras = Math.floor(totalMinutos / 60);
  const minutosRestantes = totalMinutos % 60;

  return {
    totalHoras,
    totalMinutos: minutosRestantes,
    diasTrabajados,
    horasFormateadas: `${totalHoras}h ${minutosRestantes}m`,
  };
}

// Calcular días trabajados
export function calcularDiasTrabajados(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>
): number {
  return asistencias.filter(a => a.fecha_salida !== null).length;
}

// Calcular días de llegada tarde (después de 9:00 AM)
export function calcularDiasLlegadaTarde(
  asistencias: Array<{ fecha_entrada: string }>
): number {
  return asistencias.filter((a) => {
    const entrada = new Date(a.fecha_entrada);
    const hora = entrada.getHours();
    const minutos = entrada.getMinutes();
    // Llegada tarde si es después de 9:00 AM
    return hora > 9 || (hora === 9 && minutos > 0);
  }).length;
}

// Calcular días con salida anticipada
export function calcularDiasSalidaAnticipada(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>
): number {
  return asistencias.filter((a) => {
    if (!a.fecha_salida) return false;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida); // 0 = domingo, 6 = sábado
    const horaSalida = salida.getHours();
    const minutosSalida = salida.getMinutes();
    
    // Domingo no cuenta
    if (diaSemana === 0) return false;
    
    // Sábado: salida antes de 13:30
    if (diaSemana === 6) {
      return horaSalida < 13 || (horaSalida === 13 && minutosSalida < 30);
    }
    
    // Lunes a viernes: salida antes de 18:00 (6:00 PM)
    return horaSalida < 18;
  }).length;
}

// Calcular tiempo total de salida anticipada
export function calcularTiempoSalidaAnticipada(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>
): TiempoFormateado {
  let minutosAnticipados = 0;
  
  asistencias.forEach((a) => {
    if (!a.fecha_salida) return;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida);
    const horaSalida = salida.getHours();
    const minutosSalida = salida.getMinutes();
    
    // Domingo no cuenta
    if (diaSemana === 0) return;
    
    // Sábado: calcular minutos antes de 13:30
    if (diaSemana === 6) {
      const horarioFinSabado = new Date(salida);
      horarioFinSabado.setHours(13, 30, 0, 0);
      
      if (salida < horarioFinSabado) {
        minutosAnticipados += differenceInMinutes(horarioFinSabado, salida);
      }
      return;
    }
    
    // Lunes a viernes: calcular minutos antes de 18:00
    const horarioFin = new Date(salida);
    horarioFin.setHours(18, 0, 0, 0);
    
    if (salida < horarioFin) {
      minutosAnticipados += differenceInMinutes(horarioFin, salida);
    }
  });
  
  const horas = Math.floor(minutosAnticipados / 60);
  const minutos = minutosAnticipados % 60;
  
  return {
    horas,
    minutos,
    formateado: `${horas}h ${minutos}m`,
  };
}

// Calcular tiempo extra (solo para monitoreo y taller)
export function calcularTiempoExtra(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>
): TiempoFormateado {
  let minutosExtra = 0;
  
  asistencias.forEach((a) => {
    if (!a.fecha_salida) return;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida);
    const horaSalida = salida.getHours();
    const minutosSalida = salida.getMinutes();
    
    // Domingo no cuenta
    if (diaSemana === 0) return;
    
    // Sábado: tiempo después de 13:30
    if (diaSemana === 6) {
      const horarioFinSabado = new Date(salida);
      horarioFinSabado.setHours(13, 30, 0, 0);
      
      if (salida > horarioFinSabado) {
        minutosExtra += differenceInMinutes(salida, horarioFinSabado);
      }
      return;
    }
    
    // Lunes a viernes: tiempo después de 18:00
    const horarioFin = new Date(salida);
    horarioFin.setHours(18, 0, 0, 0);
    
    if (salida > horarioFin) {
      minutosExtra += differenceInMinutes(salida, horarioFin);
    }
  });
  
  const horas = Math.floor(minutosExtra / 60);
  const minutos = minutosExtra % 60;
  
  return {
    horas,
    minutos,
    formateado: `${horas}h ${minutos}m`,
  };
}

// Calcular permisos de salida utilizados
export function calcularPermisosUsados(
  vales: Array<{ estado: string }>
): number {
  return vales.filter(v => v.estado === "usado").length;
}
