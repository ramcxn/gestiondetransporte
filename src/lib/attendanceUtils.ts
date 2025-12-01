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

// Calcular días de llegada tarde según horario personalizado
export function calcularDiasLlegadaTarde(
  asistencias: Array<{ fecha_entrada: string }>,
  horaEntradaEsperada: string = "09:00:00"
): number {
  return asistencias.filter((a) => {
    const entrada = new Date(a.fecha_entrada);
    const hora = entrada.getHours();
    const minutos = entrada.getMinutes();
    
    // Parse hora esperada
    const [horaEsperada, minutoEsperado] = horaEntradaEsperada.split(':').map(Number);
    
    // Llegada tarde si es después de la hora esperada
    return hora > horaEsperada || (hora === horaEsperada && minutos > minutoEsperado);
  }).length;
}

// Calcular días con salida anticipada según horario personalizado
export function calcularDiasSalidaAnticipada(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>,
  horaSalidaEsperada: string = "18:00:00",
  horaSalidaSabado: string = "13:30:00"
): number {
  return asistencias.filter((a) => {
    if (!a.fecha_salida) return false;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida); // 0 = domingo, 6 = sábado
    const horaSalida = salida.getHours();
    const minutosSalida = salida.getMinutes();
    
    // Domingo no cuenta
    if (diaSemana === 0) return false;
    
    // Parse horas esperadas
    const [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
    const [horaSalidaSabadoNum, minutoSalidaSabado] = horaSalidaSabado.split(':').map(Number);
    
    // Sábado: salida antes de hora esperada para sábado
    if (diaSemana === 6) {
      return horaSalida < horaSalidaSabadoNum || (horaSalida === horaSalidaSabadoNum && minutosSalida < minutoSalidaSabado);
    }
    
    // Lunes a viernes: salida antes de hora esperada
    return horaSalida < horaSalidaEsperadaNum || (horaSalida === horaSalidaEsperadaNum && minutosSalida < minutoSalidaEsperado);
  }).length;
}

// Calcular tiempo total de salida anticipada según horario personalizado
export function calcularTiempoSalidaAnticipada(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>,
  horaSalidaEsperada: string = "18:00:00",
  horaSalidaSabado: string = "13:30:00"
): TiempoFormateado {
  let minutosAnticipados = 0;
  
  // Parse horas esperadas
  const [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
  const [horaSalidaSabadoNum, minutoSalidaSabado] = horaSalidaSabado.split(':').map(Number);
  
  asistencias.forEach((a) => {
    if (!a.fecha_salida) return;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida);
    
    // Domingo no cuenta
    if (diaSemana === 0) return;
    
    // Sábado: calcular minutos antes de hora esperada
    if (diaSemana === 6) {
      const horarioFinSabado = new Date(salida);
      horarioFinSabado.setHours(horaSalidaSabadoNum, minutoSalidaSabado, 0, 0);
      
      if (salida < horarioFinSabado) {
        minutosAnticipados += differenceInMinutes(horarioFinSabado, salida);
      }
      return;
    }
    
    // Lunes a viernes: calcular minutos antes de hora esperada
    const horarioFin = new Date(salida);
    horarioFin.setHours(horaSalidaEsperadaNum, minutoSalidaEsperado, 0, 0);
    
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

// Calcular tiempo extra según horario personalizado
export function calcularTiempoExtra(
  asistencias: Array<{ fecha_entrada: string; fecha_salida: string | null }>,
  horaSalidaEsperada: string = "18:00:00",
  horaSalidaSabado: string = "13:30:00"
): TiempoFormateado {
  let minutosExtra = 0;
  
  // Parse horas esperadas
  const [horaSalidaEsperadaNum, minutoSalidaEsperado] = horaSalidaEsperada.split(':').map(Number);
  const [horaSalidaSabadoNum, minutoSalidaSabado] = horaSalidaSabado.split(':').map(Number);
  
  asistencias.forEach((a) => {
    if (!a.fecha_salida) return;
    
    const salida = new Date(a.fecha_salida);
    const diaSemana = getDay(salida);
    
    // Domingo no cuenta
    if (diaSemana === 0) return;
    
    // Sábado: tiempo después de hora esperada
    if (diaSemana === 6) {
      const horarioFinSabado = new Date(salida);
      horarioFinSabado.setHours(horaSalidaSabadoNum, minutoSalidaSabado, 0, 0);
      
      if (salida > horarioFinSabado) {
        minutosExtra += differenceInMinutes(salida, horarioFinSabado);
      }
      return;
    }
    
    // Lunes a viernes: tiempo después de hora esperada
    const horarioFin = new Date(salida);
    horarioFin.setHours(horaSalidaEsperadaNum, minutoSalidaEsperado, 0, 0);
    
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
