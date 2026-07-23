import { Novedad, Empleado, Empresa, TipoNovedad, EstadoAprobacion } from '../types';

export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportNovedadesToCSV(novedades: Novedad[]): void {
  const headers = ['ID', 'Legajo', 'Colaborador', 'Empresa', 'Sector', 'Tipo Novedad', 'Fecha Inicio', 'Fecha Fin', 'Valor', 'Unidad', 'Estado Aprobacion', 'Observaciones', 'Creado El'];
  const rows = novedades.map((n) => [
    n.id,
    n.legajo,
    `"${n.colaborador.replace(/"/g, '""')}"`,
    `"${n.empresa}"`,
    `"${n.sector}"`,
    `"${n.tipo}"`,
    n.fechaInicio,
    n.fechaFin,
    n.diasOHoras,
    n.unidad,
    n.estadoAprobacion,
    `"${(n.observaciones || '').replace(/"/g, '""')}"`,
    n.creadoEl,
  ]);

  const csvContent = [headers.join(';'), ...rows.map((e) => e.join(';'))].join('\n');
  downloadCSV(`novedades_rrhh_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
}

export function exportEmployeesToCSV(employees: Empleado[]): void {
  const headers = ['Legajo', 'Colaborador', 'Estado', 'Empresa', 'Sector', 'Fecha Ingreso', 'CUIL', 'DNI', 'Fecha Nacimiento', 'Fecha Egreso'];
  const rows = employees.map((e) => [
    e.legajo,
    `"${e.colaborador.replace(/"/g, '""')}"`,
    e.estado,
    `"${e.empresa}"`,
    `"${e.sector}"`,
    e.fechaIngreso,
    e.cuil,
    e.dni,
    e.fechaNacimiento,
    e.fechaEgreso || '',
  ]);

  const csvContent = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  downloadCSV(`nomina_personal_${new Date().toISOString().slice(0, 10)}.csv`, csvContent);
}

export function downloadEmployeeTemplateCSV(): void {
  const headers = ['Legajo', 'Colaborador', 'Estado', 'Empresa', 'Sector', 'Fecha Ingreso', 'CUIL', 'DNI', 'Fecha Nacimiento'];
  const sampleRows = [
    ['2500', '"Pérez, Juan Carlos"', 'ACTIVO', '"Talleres Metalúrgicos Crucianelli"', 'Producción', '10/01/2023', '20401234568', '40123456', '15/05/1992'],
    ['2501', '"Gómez, María Elena"', 'ACTIVO', '"FERTEC S.A."', 'Administración', '01/03/2022', '27359876543', '35987654', '20/08/1990'],
    ['2502', '"López, Roberto"', 'ACTIVO', '"Talleres Metalúrgicos Crucianelli"', 'Logística', '15/06/2024', '20381112223', '38111222', '12/12/1994'],
  ];

  const csvContent = [headers.join(';'), ...sampleRows.map((r) => r.join(';'))].join('\n');
  downloadCSV('plantilla_nomina_personal_ejemplo.csv', csvContent);
}

export function parseEmployeesCSV(csvText: string): { valid: Empleado[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const valid: Empleado[] = [];

  if (lines.length === 0) {
    return { valid: [], errors: ['El archivo o texto CSV está vacío.'] };
  }

  // Detect delimiter (; , or tab)
  const firstLine = lines[0];
  let delimiter = ';';
  if (firstLine.includes(';')) {
    delimiter = ';';
  } else if (firstLine.includes('\t')) {
    delimiter = '\t';
  } else if (firstLine.includes(',')) {
    delimiter = ',';
  }

  // Helper to split CSV row handling quoted values
  const splitCSVRow = (rowText: string): string[] => {
    const pattern = new RegExp(
      `(?:^|${delimiter === '\t' ? '\\t' : delimiter})(?:"([^"]*(?:""[^"]*)*)"|([^"${delimiter === '\t' ? '\\t' : delimiter}]*))`,
      'gi'
    );
    const result: string[] = [];
    let match: RegExpExecArray | null;

    // Use string split fallback if regex is overly strict
    if (!rowText.includes('"')) {
      return rowText.split(delimiter).map((c) => c.trim());
    }

    const cols = rowText.split(delimiter);
    return cols.map((col) => col.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
  };

  const headerCols = splitCSVRow(lines[0]).map((h) => h.toLowerCase().trim());

  // Check if first row is header
  const isHeaderPresent = headerCols.some(
    (h) =>
      h.includes('legajo') ||
      h.includes('colaborador') ||
      h.includes('nombre') ||
      h.includes('empresa') ||
      h.includes('dni') ||
      h.includes('sector')
  );

  let legajoIdx = 0;
  let colabIdx = 1;
  let estadoIdx = 2;
  let empresaIdx = 3;
  let sectorIdx = 4;
  let ingresoIdx = 5;
  let cuilIdx = 6;
  let dniIdx = 7;
  let nacIdx = 8;
  let catIdx = 9;
  let egresoIdx = 10;

  if (isHeaderPresent) {
    headerCols.forEach((col, idx) => {
      if (col.includes('legajo')) legajoIdx = idx;
      else if (col.includes('colaborador') || col.includes('nombre') || col.includes('apellido')) colabIdx = idx;
      else if (col.includes('estado')) estadoIdx = idx;
      else if (col.includes('empresa')) empresaIdx = idx;
      else if (col.includes('sector') || col.includes('área') || col.includes('area')) sectorIdx = idx;
      else if (col.includes('ingreso')) ingresoIdx = idx;
      else if (col.includes('cuil')) cuilIdx = idx;
      else if (col.includes('dni')) dniIdx = idx;
      else if (col.includes('nacimiento') || col.includes('nacim')) nacIdx = idx;
      else if (col.includes('categoria') || col.includes('categoría') || col.includes('puesto')) catIdx = idx;
      else if (col.includes('egreso')) egresoIdx = idx;
    });
  }

  const startLineIndex = isHeaderPresent ? 1 : 0;

  for (let i = startLineIndex; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    const cols = splitCSVRow(rawLine);
    if (cols.length < 2) {
      errors.push(`Línea ${i + 1}: Fila sin datos suficientes (se requieren al menos Legajo y Colaborador).`);
      continue;
    }

    const legajo = (cols[legajoIdx] || cols[0] || '').trim();
    const colaborador = (cols[colabIdx] || cols[1] || '').trim();

    if (!legajo || !colaborador) {
      errors.push(`Línea ${i + 1}: Legajo o Colaborador omitido.`);
      continue;
    }

    const estadoRaw = (cols[estadoIdx] || 'ACTIVO').toUpperCase();
    const estado = estadoRaw.includes('INACT') || estadoRaw.includes('BAJA') ? 'INACTIVO' : 'ACTIVO';

    const empresaRaw = (cols[empresaIdx] || '').toUpperCase();
    const empresa: Empresa = empresaRaw.includes('FERTEC')
      ? 'FERTEC S.A.'
      : 'Talleres Metalúrgicos Crucianelli';

    const sector = (cols[sectorIdx] || 'Producción').trim();
    const fechaIngreso = (cols[ingresoIdx] || new Date().toLocaleDateString('es-AR')).trim();
    const cuil = (cols[cuilIdx] || '').replace(/[^\d]/g, '') || '20000000000';
    const dni = (cols[dniIdx] || '').replace(/[^\d]/g, '') || '00000000';
    const fechaNacimiento = (cols[nacIdx] || '01/01/1990').trim();
    const categoria = (cols[catIdx] || 'Operario').trim();
    const fechaEgreso = cols[egresoIdx] ? cols[egresoIdx].trim() : undefined;

    valid.push({
      legajo,
      colaborador,
      estado,
      empresa,
      sector,
      fechaIngreso,
      cuil,
      dni,
      fechaNacimiento,
      categoria,
      fechaEgreso,
    });
  }

  return { valid, errors };
}

export function parseNovedadesCSV(csvText: string, defaultEmpresaList: Empleado[]): { valid: Novedad[]; errors: string[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const errors: string[] = [];
  const valid: Novedad[] = [];

  if (lines.length < 2) {
    return { valid: [], errors: ['El archivo CSV no contiene suficientes líneas de datos.'] };
  }

  // Detect delimiter (; or ,)
  const delimiter = lines[0].includes(';') ? ';' : ',';

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cols = rawLine.split(delimiter).map((c) => c.replace(/^"|"$/g, '').trim());

    if (cols.length < 5) continue;

    // Expected format: Legajo | Tipo | FechaInicio | FechaFin | DiasOHoras | Observaciones
    const legajo = cols[0] || cols[1]; // Flexible column matching
    const emp = defaultEmpresaList.find((e) => e.legajo === legajo);

    const tipoRaw = cols[1] || cols[2] || 'Ausencia por Enfermedad';
    const fechaInicio = cols[2] || cols[3] || new Date().toISOString().slice(0, 10);
    const fechaFin = cols[3] || cols[4] || fechaInicio;
    const diasOHoras = parseFloat(cols[4] || cols[5] || '1') || 1;
    const observaciones = cols[5] || cols[6] || 'Carga masiva por CSV';

    if (!emp) {
      errors.push(`Línea ${i + 1}: No se encontró legajo "${legajo}" en la nómina.`);
      continue;
    }

    valid.push({
      id: `NOV-CSV-${Date.now()}-${i}`,
      legajo: emp.legajo,
      colaborador: emp.colaborador,
      empresa: emp.empresa,
      sector: emp.sector,
      tipo: (tipoRaw as TipoNovedad) || 'Ausencia por Enfermedad',
      fechaInicio,
      fechaFin,
      diasOHoras,
      unidad: diasOHoras > 8 ? 'Horas' : 'Días',
      observaciones,
      estadoAprobacion: 'Aprobado',
      creadoEl: new Date().toISOString(),
    });
  }

  return { valid, errors };
}
