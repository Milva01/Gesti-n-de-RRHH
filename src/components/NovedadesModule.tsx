import React, { useState, useMemo } from 'react';
import {
  FileText,
  Table,
  PlusCircle,
  Search,
  Filter,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Paperclip,
  Calendar,
  User,
  Building,
  AlertTriangle,
  ChevronDown,
  Trash2,
  FileSpreadsheet,
  Check,
  Info,
} from 'lucide-react';
import { Empleado, Novedad, TipoNovedad, EstadoAprobacion, Empresa } from '../types';
import { exportNovedadesToCSV, parseNovedadesCSV } from '../utils/csv';

interface NovedadesModuleProps {
  employees: Empleado[];
  novedades: Novedad[];
  onAddNovedad: (novedad: Novedad) => void;
  onUpdateEstadoNovedad: (id: string, estado: EstadoAprobacion) => void;
  onDeleteNovedad: (id: string) => void;
  onBulkImportNovedades: (items: Novedad[]) => void;
  empresaFilter: 'Todas' | Empresa;
  searchTermGlobal: string;
}

const TIPOS_NOVEDAD: TipoNovedad[] = [
  'Ausencia por Enfermedad',
  'Vacaciones',
  'Licencia Especial',
  'Permiso Médico',
  'Llegada Tarde',
  'Salida Anticipada',
  'Salida',
  'Accidente Laboral',
  'Hora Extra',
  'Suspensión',
  'Capacitación',
  'Falta Injustificada',
];

export const NovedadesModule: React.FC<NovedadesModuleProps> = ({
  employees,
  novedades,
  onAddNovedad,
  onUpdateEstadoNovedad,
  onDeleteNovedad,
  onBulkImportNovedades,
  empresaFilter,
  searchTermGlobal,
}) => {
  const [subTab, setSubTab] = useState<'formulario' | 'planilla'>('formulario');

  // Form State
  const [selectedLegajo, setSelectedLegajo] = useState<string>('');
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState<boolean>(false);
  const [tipo, setTipo] = useState<TipoNovedad>('Ausencia por Enfermedad');
  const [fechaInicio, setFechaInicio] = useState<string>(new Date().toISOString().slice(0, 10));
  const [fechaFin, setFechaFin] = useState<string>(new Date().toISOString().slice(0, 10));
  const [diasOHoras, setDiasOHoras] = useState<number>(1);
  const [unidad, setUnidad] = useState<'Días' | 'Horas'>('Días');
  const [observaciones, setObservaciones] = useState<string>('');
  const [certificadoNombre, setCertificadoNombre] = useState<string>('');
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);

  // Planilla Filters State
  const [filterSector, setFilterSector] = useState<string>('Todos');
  const [filterTipo, setFilterTipo] = useState<string>('Todos');
  const [filterEstado, setFilterEstado] = useState<string>('Todos');
  const [searchTable, setSearchTable] = useState<string>('');

  // CSV Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [importStatus, setImportStatus] = useState<{ count: number; errors: string[] } | null>(null);

  // Delete Confirmation State
  const [novedadToDelete, setNovedadToDelete] = useState<Novedad | null>(null);

  // Filtered employees for autocomplete
  const filteredEmployeesForSelect = useMemo(() => {
    let list = employees.filter((e) => e.estado === 'ACTIVO');
    if (empresaFilter !== 'Todas') {
      list = list.filter((e) => e.empresa === empresaFilter);
    }
    if (!employeeSearch.trim()) return list.slice(0, 8);
    const q = employeeSearch.toLowerCase();
    return list
      .filter(
        (e) =>
          e.colaborador.toLowerCase().includes(q) ||
          e.legajo.toLowerCase().includes(q) ||
          e.dni.includes(q) ||
          e.sector.toLowerCase().includes(q)
      )
      .slice(0, 10);
  }, [employees, empresaFilter, employeeSearch]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.legajo === selectedLegajo);
  }, [employees, selectedLegajo]);

  // Unique Sectors for Filter
  const sectorsList = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.sector))).sort();
    return ['Todos', ...list];
  }, [employees]);

  // Filtered Novedades for Table
  const filteredNovedades = useMemo(() => {
    return novedades.filter((n) => {
      // Company filter
      if (empresaFilter !== 'Todas' && n.empresa !== empresaFilter) return false;
      // Sector filter
      if (filterSector !== 'Todos' && n.sector !== filterSector) return false;
      // Tipo filter
      if (filterTipo !== 'Todos' && n.tipo !== filterTipo) return false;
      // Estado filter
      if (filterEstado !== 'Todos' && n.estadoAprobacion !== filterEstado) return false;

      // Combined search (Global + Local Table Search)
      const q = (searchTable || searchTermGlobal).toLowerCase().trim();
      if (q) {
        const matchesColab = n.colaborador.toLowerCase().includes(q);
        const matchesLegajo = n.legajo.toLowerCase().includes(q);
        const matchesSector = n.sector.toLowerCase().includes(q);
        const matchesTipo = n.tipo.toLowerCase().includes(q);
        const matchesObs = (n.observaciones || '').toLowerCase().includes(q);
        if (!matchesColab && !matchesLegajo && !matchesSector && !matchesTipo && !matchesObs) {
          return false;
        }
      }
      return true;
    });
  }, [novedades, empresaFilter, filterSector, filterTipo, filterEstado, searchTable, searchTermGlobal]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const total = filteredNovedades.length;
    const ausencias = filteredNovedades.filter((n) => n.tipo.includes('Ausencia') || n.tipo.includes('Enfermedad')).length;
    const vacaciones = filteredNovedades.filter((n) => n.tipo === 'Vacaciones').length;
    const permisos = filteredNovedades.filter((n) => n.tipo.includes('Permiso') || n.tipo.includes('Llegada') || n.tipo.includes('Salida')).length;
    const pendientes = filteredNovedades.filter((n) => n.estadoAprobacion === 'Pendiente').length;
    return { total, ausencias, vacaciones, permisos, pendientes };
  }, [filteredNovedades]);

  // Submit Handler
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      alert('Por favor selecciona un colaborador válido de la nómina.');
      return;
    }

    const newNovedad: Novedad = {
      id: `NOV-${Date.now().toString().slice(-6)}`,
      legajo: selectedEmployee.legajo,
      colaborador: selectedEmployee.colaborador,
      empresa: selectedEmployee.empresa,
      sector: selectedEmployee.sector,
      tipo,
      fechaInicio,
      fechaFin,
      diasOHoras: Number(diasOHoras) || 1,
      unidad,
      observaciones: observaciones.trim() || 'Novedad registrada vía formulario.',
      estadoAprobacion: 'Aprobado', // Auto-approved when registered by HR
      certificadoAdjunto: certificadoNombre || undefined,
      creadoEl: new Date().toISOString(),
    };

    onAddNovedad(newNovedad);

    setFormSuccessMessage(`¡Novedad para ${selectedEmployee.colaborador} registrada exitosamente!`);
    setTimeout(() => setFormSuccessMessage(null), 4000);

    // Reset Form
    setSelectedLegajo('');
    setEmployeeSearch('');
    setObservaciones('');
    setCertificadoNombre('');
    setDiasOHoras(1);
  };

  // CSV Import Exec
  const handleExecImport = () => {
    if (!rawCsvText.trim()) return;
    const { valid, errors } = parseNovedadesCSV(rawCsvText, employees);
    if (valid.length > 0) {
      onBulkImportNovedades(valid);
    }
    setImportStatus({ count: valid.length, errors });
  };

  return (
    <div className="space-y-6">
      {/* Module Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#E30613] rounded-lg border border-red-200">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Carga y Gestión de Novedades Diarias</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Registro en tiempo real de ausencias, licencias, permisos y horas extras vinculados a la nómina de personal.
          </p>
        </div>

        {/* Subtab Toggle Buttons */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto">
          <button
            onClick={() => setSubTab('formulario')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'formulario'
                ? 'bg-white text-[#E30613] shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Formulario de Carga</span>
          </button>

          <button
            onClick={() => setSubTab('planilla')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              subTab === 'planilla'
                ? 'bg-white text-[#E30613] shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Novedades Cargadas ({novedades.length})</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: FORMULARIO DE CARGA (Estilo Google Form / Documento Carga) */}
      {subTab === 'formulario' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-[#18181B] to-[#27272A] text-white p-5 border-b-4 border-[#E30613]">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <PlusCircle className="w-5 h-5 text-[#E30613]" />
                    Formulario Oficial de Novedad del Personal
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Complete los datos del colaborador y el detalle de la ausencia o permiso.
                  </p>
                </div>
                <span className="text-xs bg-red-950/80 text-red-200 border border-red-800/60 px-2.5 py-1 rounded-full font-mono font-medium">
                  Crucianelli S.A.
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-6">
              {formSuccessMessage && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-sm flex items-center space-x-3 animate-fade-in">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="font-medium">{formSuccessMessage}</span>
                </div>
              )}

              {/* Step 1: Select Employee */}
              <div className="space-y-2 relative">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Selección de Colaborador <span className="text-[#E30613]">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por Legajo (ej. 2122), Nombre (ej. Abba) o DNI..."
                    value={selectedEmployee ? `${selectedEmployee.legajo} - ${selectedEmployee.colaborador} (${selectedEmployee.sector})` : employeeSearch}
                    onChange={(e) => {
                      setEmployeeSearch(e.target.value);
                      setSelectedLegajo('');
                      setShowEmployeeDropdown(true);
                    }}
                    onFocus={() => setShowEmployeeDropdown(true)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E30613] focus:border-[#E30613]"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  {selectedEmployee && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedLegajo('');
                        setEmployeeSearch('');
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded"
                    >
                      Cambiar
                    </button>
                  )}
                </div>

                {/* Autocomplete Dropdown */}
                {showEmployeeDropdown && !selectedEmployee && (
                  <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-white rounded-lg shadow-xl border border-slate-200 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredEmployeesForSelect.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center">
                        No se encontraron colaboradores coincidentes.
                      </div>
                    ) : (
                      filteredEmployeesForSelect.map((emp) => (
                        <button
                          key={`${emp.empresa}-${emp.legajo}`}
                          type="button"
                          onClick={() => {
                            setSelectedLegajo(emp.legajo);
                            setShowEmployeeDropdown(false);
                          }}
                          className="w-full p-2.5 text-left hover:bg-red-50 flex items-center justify-between transition-colors group"
                        >
                          <div>
                            <span className="text-xs font-mono font-bold text-[#E30613] bg-red-50 px-1.5 py-0.5 rounded mr-2 border border-red-200">
                              Legajo {emp.legajo}
                            </span>
                            <span className="text-sm font-semibold text-slate-800 group-hover:text-red-900">
                              {emp.colaborador}
                            </span>
                            <span className="text-xs text-slate-500 block mt-0.5">
                              DNI: {emp.dni} | Sector: {emp.sector}
                            </span>
                          </div>
                          <span className="text-xs font-medium text-slate-400 group-hover:text-[#E30613] bg-slate-100 px-2 py-0.5 rounded">
                            {emp.empresa === 'FERTEC S.A.' ? 'FERTEC' : 'Crucianelli'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}

                {/* Selected Employee Card */}
                {selectedEmployee && (
                  <div className="p-3.5 bg-red-50/70 border border-red-200 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="font-bold text-red-950">{selectedEmployee.colaborador}</span>
                      <span className="text-[#E30613] ml-2 font-mono font-bold">Legajo: {selectedEmployee.legajo}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="bg-white px-2 py-0.5 rounded border border-red-200 text-slate-700">
                        Sector: <strong>{selectedEmployee.sector}</strong>
                      </span>
                      <span className="bg-white px-2 py-0.5 rounded border border-red-200 text-slate-700">
                        Empresa: <strong>{selectedEmployee.empresa}</strong>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Novedad Type & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    2. Tipo de Novedad <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as TipoNovedad)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {TIPOS_NOVEDAD.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unidad de Medida
                  </label>
                  <div className="flex items-center gap-2 pt-1">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="radio"
                        name="unidad"
                        checked={unidad === 'Días'}
                        onChange={() => setUnidad('Días')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Días completos</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer ml-4">
                      <input
                        type="radio"
                        name="unidad"
                        checked={unidad === 'Horas'}
                        onChange={() => setUnidad('Horas')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>Horas parciales</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dates & Values */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Fecha Desde
                  </label>
                  <input
                    type="date"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Fecha Hasta
                  </label>
                  <input
                    type="date"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    Cantidad ({unidad})
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={diasOHoras}
                    onChange={(e) => setDiasOHoras(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 font-semibold text-center"
                  />
                </div>
              </div>

              {/* Certificate Upload Simulation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                  Certificado o Comprobante Adjunto (Opcional)
                </label>
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 bg-slate-50 text-center hover:bg-slate-100 transition-colors cursor-pointer">
                  <input
                    type="file"
                    id="file-cert"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setCertificadoNombre(e.target.files[0].name);
                      }
                    }}
                    className="hidden"
                  />
                  <label htmlFor="file-cert" className="cursor-pointer block">
                    <Paperclip className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    {certificadoNombre ? (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2.5 py-1 rounded">
                        ✓ Adjunto: {certificadoNombre}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-600">
                        Haz clic para seleccionar o arrastra certificado médico / constancia (.pdf, .jpg, .csv)
                      </span>
                    )}
                  </label>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Observaciones / Diagnóstico / Motivo
                </label>
                <textarea
                  rows={3}
                  placeholder="Escriba aquí detalles relevantes (ej. Diagnóstico médico, N° de trámite, autorización previa)..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#E30613]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!selectedEmployee}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white shadow-md flex items-center justify-center space-x-2 transition-all ${
                  selectedEmployee
                    ? 'bg-[#E30613] hover:bg-[#C80510] hover:shadow-lg active:scale-[0.99]'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                <CheckCircle className="w-5 h-5" />
                <span>Registrar Novedad en la Nómina</span>
              </button>
            </form>
          </div>

          {/* Side Info Panel */}
          <div className="space-y-4">
            <div className="bg-[#18181B] text-white rounded-xl p-5 shadow-sm space-y-4 border-l-4 border-[#E30613]">
              <h3 className="text-sm font-bold text-red-400 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#E30613]" />
                Guía de Carga Crucianelli
              </h3>
              <ul className="text-xs text-zinc-300 space-y-2.5 list-disc pl-4">
                <li>
                  <strong>Vinculación Directa:</strong> Seleccione obligatoriamente un colaborador activo de la nómina real.
                </li>
                <li>
                  <strong>Licencias por Enfermedad:</strong> Adjunte el certificado en PDF/imagen para justificar días de ausentismo.
                </li>
                <li>
                  <strong>Vacaciones:</strong> Las fechas de inicio y fin calculan automáticamente la reserva de días correspondientes.
                </li>
                <li>
                  <strong>Carga Masiva:</strong> Si posee un archivo Excel o CSV con múltiples novedades, utilice el botón de <em>Importación Masiva</em> en la pestaña de Planilla.
                </li>
              </ul>
            </div>

            {/* Quick Stats Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Resumen de Cargas Recientes
              </h4>
              <div className="divide-y divide-slate-100">
                {novedades.slice(0, 4).map((n) => (
                  <div key={n.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-slate-800">{n.colaborador}</span>
                      <span className="text-slate-500 block text-[11px]">{n.tipo}</span>
                    </div>
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {n.diasOHoras} {n.unidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: PLANILLA DE NOVEDADES CARGADAS (Estilo Google Sheets / Planilla de Novedades) */}
      {subTab === 'planilla' && (
        <div className="space-y-4">
          {/* Top Control Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-slate-500 text-xs font-medium block">Total Registros</span>
              <span className="text-lg font-extrabold text-slate-800">{summaryMetrics.total}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-rose-200 bg-rose-50/30 shadow-2xs">
              <span className="text-rose-600 text-xs font-semibold block">Ausencias / Salud</span>
              <span className="text-lg font-extrabold text-rose-700">{summaryMetrics.ausencias}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/30 shadow-2xs">
              <span className="text-emerald-600 text-xs font-semibold block">Vacaciones</span>
              <span className="text-lg font-extrabold text-emerald-700">{summaryMetrics.vacaciones}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/30 shadow-2xs">
              <span className="text-indigo-600 text-xs font-semibold block">Permisos / Tardanzas</span>
              <span className="text-lg font-extrabold text-indigo-700">{summaryMetrics.permisos}</span>
            </div>
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 bg-amber-50/30 shadow-2xs">
              <span className="text-amber-600 text-xs font-semibold block">Pendientes Aprobación</span>
              <span className="text-lg font-extrabold text-amber-700">{summaryMetrics.pendientes}</span>
            </div>
          </div>

          {/* Filters Bar & Actions */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
              {/* Sector Filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-medium">Sector:</span>
                <select
                  value={filterSector}
                  onChange={(e) => setFilterSector(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                >
                  {sectorsList.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-medium">Tipo:</span>
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Todos">Todos los tipos</option>
                  {TIPOS_NOVEDAD.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Estado Filter */}
              <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
                <span className="text-slate-500 font-medium">Estado:</span>
                <select
                  value={filterEstado}
                  onChange={(e) => setFilterEstado(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 focus:outline-none"
                >
                  <option value="Todos">Todos los estados</option>
                  <option value="Aprobado">Aprobados</option>
                  <option value="Pendiente">Pendientes</option>
                  <option value="Rechazado">Rechazados</option>
                </select>
              </div>

              {/* Local Search Input */}
              <div className="relative flex-1 min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filtrar por nombre o motivo..."
                  value={searchTable}
                  onChange={(e) => setSearchTable(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* CSV Export / Import Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImportModal(true)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Importar CSV</span>
              </button>

              <button
                onClick={() => exportNovedadesToCSV(filteredNovedades)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center space-x-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar CSV</span>
              </button>
            </div>
          </div>

          {/* Interactive Table (Estilo Planilla Muestrario Google Sheets) */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="p-3">ID / Creado</th>
                    <th className="p-3">Legajo</th>
                    <th className="p-3">Colaborador</th>
                    <th className="p-3">Empresa & Sector</th>
                    <th className="p-3">Tipo Novedad</th>
                    <th className="p-3">Período</th>
                    <th className="p-3 text-center">Cant.</th>
                    <th className="p-3">Observaciones</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {filteredNovedades.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-500">
                        No se encontraron registros de novedades con los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    filteredNovedades.map((n) => (
                      <tr key={n.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          <span className="font-bold text-slate-700 block">{n.id}</span>
                          {n.creadoEl ? new Date(n.creadoEl).toLocaleDateString() : '-'}
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-700">{n.legajo}</td>
                        <td className="p-3 font-bold text-slate-800">{n.colaborador}</td>
                        <td className="p-3">
                          <span className="font-semibold text-slate-700 block">{n.sector}</span>
                          <span className="text-[10px] text-slate-500">{n.empresa}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full font-semibold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                            {n.tipo}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">
                          {n.fechaInicio === n.fechaFin ? (
                            <span>{n.fechaInicio}</span>
                          ) : (
                            <span>
                              {n.fechaInicio} al {n.fechaFin}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-800">
                          {n.diasOHoras} <span className="text-[10px] text-slate-500 font-normal">{n.unidad}</span>
                        </td>
                        <td className="p-3 max-w-xs truncate text-slate-600" title={n.observaciones}>
                          {n.observaciones}
                          {n.certificadoAdjunto && (
                            <span className="ml-1 text-emerald-600 font-semibold inline-flex items-center gap-0.5 text-[10px] bg-emerald-50 px-1 rounded">
                              <Paperclip className="w-3 h-3" /> Adjunto
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center whitespace-nowrap">
                          {n.estadoAprobacion === 'Aprobado' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle className="w-3 h-3" /> Aprobado
                            </span>
                          )}
                          {n.estadoAprobacion === 'Pendiente' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                          {n.estadoAprobacion === 'Rechazado' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              <XCircle className="w-3 h-3" /> Rechazado
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {n.estadoAprobacion === 'Pendiente' ? (
                            <>
                              <button
                                onClick={() => onUpdateEstadoNovedad(n.id, 'Aprobado')}
                                title="Aprobar"
                                className="p-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 rounded"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onUpdateEstadoNovedad(n.id, 'Rechazado')}
                                title="Rechazar"
                                className="p-1 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() =>
                                onUpdateEstadoNovedad(
                                  n.id,
                                  n.estadoAprobacion === 'Aprobado' ? 'Pendiente' : 'Aprobado'
                                )
                              }
                              title="Cambiar estado"
                              className="px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-200 rounded border border-slate-300"
                            >
                              Cambiar
                            </button>
                          )}
                          <button
                            onClick={() => setNovedadToDelete(n)}
                            title="Eliminar registro de novedad"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTACIÓN MASIVA CSV */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Importar Novedades por Archivo CSV / Excel
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus(null);
                  setRawCsvText('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Pegue a continuación las filas en formato separado por comas o punto y coma (o abra un archivo .csv exportado de Google Sheets):
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono text-slate-600 space-y-1">
              <p className="font-bold text-slate-700">Formato Esperado por Columna:</p>
              <p>Legajo ; Tipo ; FechaInicio ; FechaFin ; Cantidad ; Observaciones</p>
              <p className="text-[11px] text-blue-700 italic">Ejemplo: 2122 ; Ausencia por Enfermedad ; 2026-07-20 ; 2026-07-22 ; 3 ; Cuadro febril</p>
            </div>

            <textarea
              rows={6}
              value={rawCsvText}
              onChange={(e) => setRawCsvText(e.target.value)}
              placeholder="Pegue aquí el contenido de las filas CSV..."
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {importStatus && (
              <div className={`p-3 rounded-lg text-xs ${importStatus.count > 0 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
                <p className="font-bold">
                  ✓ {importStatus.count} registros importados correctamente.
                </p>
                {importStatus.errors.length > 0 && (
                  <ul className="mt-1 list-disc pl-4 text-[11px] text-rose-700 space-y-0.5">
                    {importStatus.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 border-t border-slate-200 pt-3">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus(null);
                  setRawCsvText('');
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cerrar
              </button>
              <button
                onClick={handleExecImport}
                disabled={!rawCsvText.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
              >
                Procesar e Importar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN ELIMINAR NOVEDAD */}
      {novedadToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-2.5 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  ¿Eliminar Novedad?
                </h3>
                <p className="text-xs text-slate-500">
                  Esta acción eliminará el registro de forma permanente.
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-700 space-y-1.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-sans">
              <p>
                <strong className="text-slate-900 font-semibold">Colaborador:</strong> {novedadToDelete.colaborador} (Legajo {novedadToDelete.legajo})
              </p>
              <p>
                <strong className="text-slate-900 font-semibold">Tipo:</strong> {novedadToDelete.tipo}
              </p>
              <p>
                <strong className="text-slate-900 font-semibold">Período:</strong> {novedadToDelete.fechaInicio} {novedadToDelete.fechaFin !== novedadToDelete.fechaInicio ? `al ${novedadToDelete.fechaFin}` : ''} ({novedadToDelete.diasOHoras} {novedadToDelete.unidad})
              </p>
              {novedadToDelete.observaciones && (
                <p className="text-slate-600 italic border-t border-slate-200 pt-1 mt-1">
                  "{novedadToDelete.observaciones}"
                </p>
              )}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setNovedadToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteNovedad(novedadToDelete.id);
                  setNovedadToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
