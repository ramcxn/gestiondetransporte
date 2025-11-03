// Utility functions for vacation calculations based on Mexican labor law

export interface VacacionesInfo {
  diasCorresponden: number;
  diasDisponibles: number;
  diasTomados: number;
  anosServicio: number;
}

/**
 * Calculate vacation days according to Mexican Federal Labor Law
 * Article 76: Vacation days increase with years of service
 */
export function calcularDiasVacaciones(fechaAlta: string): number {
  const fechaInicio = new Date(fechaAlta);
  const hoy = new Date();
  
  // Calculate years of service
  const anosServicio = Math.floor(
    (hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );
  
  // Mexican law vacation days
  if (anosServicio < 1) {
    return 12; // First year
  } else if (anosServicio === 1) {
    return 14;
  } else if (anosServicio === 2) {
    return 16;
  } else if (anosServicio === 3) {
    return 18;
  } else if (anosServicio === 4) {
    return 20;
  } else {
    // After 5 years: 20 days + 2 days every 5 years
    return 20 + Math.floor((anosServicio - 4) / 5) * 2;
  }
}

/**
 * Get complete vacation information for an employee
 */
export function obtenerInfoVacaciones(
  fechaAlta: string,
  diasTomados: number
): VacacionesInfo {
  const diasCorresponden = calcularDiasVacaciones(fechaAlta);
  const diasDisponibles = Math.max(0, diasCorresponden - diasTomados);
  const fechaInicio = new Date(fechaAlta);
  const hoy = new Date();
  const anosServicio = Math.floor(
    (hoy.getTime() - fechaInicio.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  );

  return {
    diasCorresponden,
    diasDisponibles,
    diasTomados,
    anosServicio,
  };
}

/**
 * Validate if vacation request is within available days
 */
export function validarDiasVacaciones(
  diasSolicitados: number,
  diasDisponibles: number
): { valido: boolean; mensaje?: string } {
  if (diasSolicitados <= 0) {
    return {
      valido: false,
      mensaje: "El número de días debe ser mayor a 0",
    };
  }

  if (diasSolicitados > diasDisponibles) {
    return {
      valido: false,
      mensaje: `No hay suficientes días disponibles. Disponibles: ${diasDisponibles}, Solicitados: ${diasSolicitados}`,
    };
  }

  return { valido: true };
}
