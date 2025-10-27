import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateRiskAnalysisPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Análisis de Riesgo', pageWidth / 2, 20, { align: 'center' });
  
  // Información básica
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  let yPosition = 35;
  
  doc.text(`Título: ${data.titulo}`, 15, yPosition);
  yPosition += 8;
  doc.text(`Tipo: ${data.tipo_riesgo}`, 15, yPosition);
  yPosition += 8;
  doc.text(`Nivel de Riesgo: ${data.nivel_riesgo}`, 15, yPosition);
  yPosition += 8;
  doc.text(`Fecha: ${new Date(data.fecha_identificacion).toLocaleDateString('es-MX')}`, 15, yPosition);
  yPosition += 8;
  doc.text(`Estado: ${data.estado}`, 15, yPosition);
  yPosition += 12;
  
  // Descripción
  doc.setFont('helvetica', 'bold');
  doc.text('Descripción:', 15, yPosition);
  yPosition += 6;
  doc.setFont('helvetica', 'normal');
  const descLines = doc.splitTextToSize(data.descripcion || 'N/A', pageWidth - 30);
  doc.text(descLines, 15, yPosition);
  yPosition += descLines.length * 6 + 8;
  
  // Medidas de mitigación
  if (data.medidas_mitigacion) {
    doc.setFont('helvetica', 'bold');
    doc.text('Medidas de Mitigación:', 15, yPosition);
    yPosition += 6;
    doc.setFont('helvetica', 'normal');
    const mitigacionLines = doc.splitTextToSize(data.medidas_mitigacion, pageWidth - 30);
    doc.text(mitigacionLines, 15, yPosition);
  }
  
  // Footer
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(10);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, 15, pageHeight - 10);
  
  return doc;
};

export const generateCorrectiveActionPDF = (data: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Reporte 8D - Acción Correctiva', pageWidth / 2, 20, { align: 'center' });
  
  // Folio
  doc.setFontSize(12);
  doc.text(`Folio: ${data.folio}`, pageWidth / 2, 28, { align: 'center' });
  
  let yPosition = 40;
  
  // D0: Información General
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('D0: Información General', 15, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Título: ${data.titulo}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Prioridad: ${data.prioridad}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Estado: ${data.estado}`, 20, yPosition);
  yPosition += 10;
  
  // D1: Equipo
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('D1: Formar el Equipo', 15, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Líder: ${data.lider_equipo}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Equipo: ${data.equipo_responsable}`, 20, yPosition);
  yPosition += 10;
  
  // D2: Descripción del Problema
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('D2: Describir el Problema', 15, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const descripcionLines = doc.splitTextToSize(data.descripcion_detallada || 'N/A', pageWidth - 35);
  doc.text(descripcionLines, 20, yPosition);
  yPosition += descripcionLines.length * 6 + 4;
  doc.text(`Área Afectada: ${data.area_afectada}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Fecha Detección: ${new Date(data.fecha_deteccion).toLocaleDateString('es-MX')}`, 20, yPosition);
  yPosition += 10;
  
  // Check if new page is needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // D3: Contención
  if (data.acciones_contencion) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('D3: Acciones de Contención Inmediata', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const contencionLines = doc.splitTextToSize(data.acciones_contencion, pageWidth - 35);
    doc.text(contencionLines, 20, yPosition);
    yPosition += contencionLines.length * 6 + 10;
  }
  
  // D4: Causa Raíz
  if (data.analisis_causa_raiz) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('D4: Análisis de Causa Raíz', 15, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const causaLines = doc.splitTextToSize(data.analisis_causa_raiz, pageWidth - 35);
    doc.text(causaLines, 20, yPosition);
    yPosition += causaLines.length * 6 + 10;
  }
  
  // Check if new page is needed
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }
  
  // D5: Acciones Correctivas
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('D5: Acciones Correctivas Permanentes', 15, yPosition);
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const accionesLines = doc.splitTextToSize(data.acciones_correctivas, pageWidth - 35);
  doc.text(accionesLines, 20, yPosition);
  yPosition += accionesLines.length * 6 + 4;
  doc.text(`Responsable: ${data.responsable_accion}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Fecha Compromiso: ${new Date(data.fecha_compromiso).toLocaleDateString('es-MX')}`, 20, yPosition);
  yPosition += 10;
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 30, doc.internal.pageSize.getHeight() - 10);
    doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 15, doc.internal.pageSize.getHeight() - 10);
  }
  
  return doc;
};

export const generateSecuritySealsPDF = (seals: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Inventario de Sellos de Seguridad', pageWidth / 2, 20, { align: 'center' });
  
  // Fecha
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, pageWidth / 2, 28, { align: 'center' });
  
  // Estadísticas
  const disponibles = seals.filter(s => s.estado === 'disponible').length;
  const asignados = seals.filter(s => s.estado === 'asignado').length;
  const retirados = seals.filter(s => s.estado === 'retirado').length;
  
  let yPosition = 38;
  doc.text(`Total: ${seals.length} | Disponibles: ${disponibles} | Asignados: ${asignados} | Retirados: ${retirados}`, 15, yPosition);
  
  // Tabla
  const tableData = seals.map(seal => [
    seal.numero_sello,
    seal.tipo,
    seal.estado,
    seal.unidad || 'N/A',
    seal.fecha_asignacion ? new Date(seal.fecha_asignacion).toLocaleDateString('es-MX') : 'N/A',
    seal.observaciones || ''
  ]);
  
  autoTable(doc, {
    startY: 45,
    head: [['Número', 'Tipo', 'Estado', 'Unidad', 'Fecha Asignación', 'Observaciones']],
    body: tableData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });
  
  return doc;
};
