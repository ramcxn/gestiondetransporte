import { differenceInMinutes } from "date-fns";

export interface HorasTrabajadas {
  totalHoras: number;
  totalMinutos: number;
  diasTrabajados: number;
  horasFormateadas: string;
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
