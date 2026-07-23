import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  PlusCircle,
  Download,
  Upload,
  Building,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  Award,
  GraduationCap,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  AlertCircle,
  Info,
  Cake,
} from 'lucide-react';
import { Empleado, Empresa, Novedad, Capacitacion, EvaluacionDesempeno, EstadoEmpleado } from '../types';
import { exportEmployeesToCSV, parseEmployeesCSV, downloadEmployeeTemplateCSV } from '../utils/csv';
import { parseBirthDate } from '../utils/birthdays';

interface NominaModuleProps {
  employees: Empleado[];
  novedades: Novedad[];
  capacitaciones: Capacitacion[];
  evaluaciones: EvaluacionDesempeno[];
  onAddEmployee: (employee: Empleado) => void;
  onUpdateEmployee: (employee: Empleado) => void;
  onDeleteEmployee?: (legajo: string) => void;
  onBulkImportEmployees?: (employees: Empleado[], mode: 'replace' | 'append') => void;
  empresaFilter: 'Todas' | Empresa;
  searchTermGlobal: string;
}

export const NominaModule: React.FC<NominaModuleProps> = ({
  employees,
  novedades,
  capacitaciones,
  evaluaciones,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee,
  onBulkImportEmployees,
  empresaFilter,
  searchTermGlobal,
}) => {
  const [filterEstado, setFilterEstado] = useState<'Todos' | 'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [filterSector, setFilterSector] = useState<string>('Todos');
  const [searchTable, setSearchTable] = useState<string>('');

  // Selected employee for detail drawer
  const [selectedEmpForDetail, setSelectedEmpForDetail] = useState<Empleado | null>(null);

  // Editing Employee State
  const [editingEmp, setEditingEmp] = useState<Empleado | null>(null);

  // New Employee Modal State
  const [showNewEmpModal, setShowNewEmpModal] = useState<boolean>(false);
  const [newLegajo, setNewLegajo] = useState<string>('');
  const [newColaborador, setNewColaborador] = useState<string>('');
  const [newEmpresa, setNewEmpresa] = useState<Empresa>('Talleres Metalúrgicos Crucianelli');
  const [newSector, setNewSector] = useState<string>('Producción');
  const [newCuil, setNewCuil] = useState<string>('');
  const [newDni, setNewDni] = useState<string>('');
  const [newFechaIngreso, setNewFechaIngreso] = useState<string>(new Date().toLocaleDateString('es-AR'));
  const [newFechaNac, setNewFechaNac] = useState<string>('1990-01-01');
  const [newCategoria, setNewCategoria] = useState<string>('Operario Calificado');

  // Bulk Import CSV Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [rawCsvText, setRawCsvText] = useState<string>('');
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [importStatus, setImportStatus] = useState<{ count: number; errors: string[] } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Sector list
  const sectorsList = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.sector))).sort();
    return ['Todos', ...list];
  }, [employees]);

  // Filtered employees table
  const filteredEmployees = useMemo(() => {
    return employees.filter((e) => {
      // Empresa filter
      if (empresaFilter !== 'Todas' && e.empresa !== empresaFilter) return false;
      // Estado filter
      if (filterEstado !== 'Todos' && e.estado !== filterEstado) return false;
      // Sector filter
      if (filterSector !== 'Todos' && e.sector !== filterSector) return false;

      // Combined Search
      const q = (searchTable || searchTermGlobal).toLowerCase().trim();
      if (q) {
        const matchColab = e.colaborador.toLowerCase().includes(q);
        const matchLegajo = e.legajo.toLowerCase().includes(q);
        const matchDni = e.dni.includes(q);
        const matchSector = e.sector.toLowerCase().includes(q);
        if (!matchColab && !matchLegajo && !matchDni && !matchSector) return false;
      }

      return true;
    });
  }, [employees, empresaFilter, filterEstado, filterSector, searchTable, searchTermGlobal]);

  // Handle Add Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLegajo.trim() || !newColaborador.trim()) {
      alert('Por favor ingrese legajo y nombre completo.');
      return;
    }

    const emp: Empleado = {
      legajo: newLegajo.trim(),
      colaborador: newColaborador.trim(),
      estado: 'ACTIVO',
      empresa: newEmpresa,
      sector: newSector,
      fechaIngreso: newFechaIngreso,
      cuil: newCuil.trim() || '20000000003',
      dni: newDni.trim() || '35000000',
      fechaNacimiento: newFechaNac,
      categoria: newCategoria,
    };

    onAddEmployee(emp);
    setShowNewEmpModal(false);
    setNewLegajo('');
    setNewColaborador('');
    setNewDni('');
    setNewCuil('');
  };

  // Handle Save Edit Employee
  const handleSaveEditedEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    onUpdateEmployee(editingEmp);
    setEditingEmp(null);
  };

  // File Upload Reader Handler
  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setRawCsvText(content);
        const { valid, errors } = parseEmployeesCSV(content);
        setImportStatus({ count: valid.length, errors });
      }
    };
    reader.readAsText(file, 'UTF-8');
  };

  // Execute CSV Import
  const handleExecImport = () => {
    if (!rawCsvText.trim()) return;
    const { valid, errors } = parseEmployeesCSV(rawCsvText);

    if (valid.length > 0 && onBulkImportEmployees) {
      onBulkImportEmployees(valid, importMode);
      setImportStatus({ count: valid.length, errors });
      setTimeout(() => {
        setShowImportModal(false);
        setRawCsvText('');
        setImportStatus(null);
      }, 1200);
    } else {
      setImportStatus({ count: valid.length, errors });
    }
  };

  // Calculate Tenure in Years
  const calculateTenureYears = (fechaIngreso: string) => {
    if (!fechaIngreso) return 0;
    const parts = fechaIngreso.split('/');
    if (parts.length === 3) {
      const ingDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
      const diffMs = Date.now() - ingDate.getTime();
      const years = diffMs / (1000 * 60 * 60 * 24 * 365.25);
      return Math.max(0, Math.floor(years));
    }
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#E30613] rounded-lg border border-red-200">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Nómina de Personal Oficial</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Padrón consolidado de Talleres Metalúrgicos Crucianelli S.A. y FERTEC S.A.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => downloadEmployeeTemplateCSV()}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-300 flex items-center space-x-1.5 transition-colors"
            title="Descargar Plantilla CSV con estructura requerida"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Plantilla CSV</span>
          </button>

          <button
            onClick={() => {
              setShowImportModal(true);
              setRawCsvText('');
              setImportStatus(null);
            }}
            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Importar Nómina (CSV / Excel)</span>
          </button>

          <button
            onClick={() => exportEmployeesToCSV(filteredEmployees)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setShowNewEmpModal(true)}
            className="px-4 py-2 bg-[#E30613] hover:bg-[#C80510] text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Alta Manual</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Estado Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-semibold">
            <button
              onClick={() => setFilterEstado('ACTIVO')}
              className={`px-3 py-1 rounded transition-colors ${
                filterEstado === 'ACTIVO' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Activos
            </button>
            <button
              onClick={() => setFilterEstado('INACTIVO')}
              className={`px-3 py-1 rounded transition-colors ${
                filterEstado === 'INACTIVO' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Inactivos
            </button>
            <button
              onClick={() => setFilterEstado('Todos')}
              className={`px-3 py-1 rounded transition-colors ${
                filterEstado === 'Todos' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
              }`}
            >
              Todos
            </button>
          </div>

          {/* Sector Dropdown */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <span className="text-slate-500 font-medium">Sector:</span>
            <select
              value={filterSector}
              onChange={(e) => setFilterSector(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            >
              {sectorsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Local Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar legajo, DNI o apellido..."
              value={searchTable}
              onChange={(e) => setSearchTable(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Mostrando <strong>{filteredEmployees.length}</strong> de {employees.length} registros
        </div>
      </div>

      {/* Roster Table */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="p-3">Legajo</th>
                <th className="p-3">Colaborador</th>
                <th className="p-3">Empresa</th>
                <th className="p-3">Sector</th>
                <th className="p-3">DNI / CUIL</th>
                <th className="p-3">Ingreso</th>
                <th className="p-3 text-center">Estado</th>
                <th className="p-3 text-right">Legajo Digital</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-sans">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No se encontraron colaboradores en la nómina con los criterios actuales.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={`${emp.empresa}-${emp.legajo}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-blue-700">{emp.legajo}</td>
                    <td className="p-3 font-bold text-slate-900">
                      <div className="flex items-center space-x-2">
                        <span>{emp.colaborador}</span>
                        {(() => {
                          const parsed = parseBirthDate(emp.fechaNacimiento);
                          const today = new Date();
                          const isToday = parsed && parsed.day === today.getDate() && parsed.month === (today.getMonth() + 1);
                          if (isToday) {
                            return (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs animate-pulse" title="¡Hoy es su cumpleaños!">
                                <Cake className="w-3 h-3 text-rose-600" />
                                <span>¡Hoy Cumple!</span>
                              </span>
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-slate-700">{emp.empresa}</span>
                    </td>
                    <td className="p-3 font-semibold text-slate-800">{emp.sector}</td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">
                      <span className="block">{emp.dni}</span>
                      <span className="text-[10px] text-slate-400">{emp.cuil}</span>
                    </td>
                    <td className="p-3 text-slate-600 whitespace-nowrap">
                      {emp.fechaIngreso}
                      <span className="text-[10px] text-slate-400 block">
                        ({calculateTenureYears(emp.fechaIngreso)} años ant.)
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      {emp.estado === 'ACTIVO' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                          INACTIVO
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      <button
                        onClick={() => setSelectedEmpForDetail(emp)}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold text-[11px] rounded-lg border border-slate-300 inline-flex items-center gap-1 transition-colors"
                        title="Ver ficha legajo digital"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ficha
                      </button>
                      <button
                        onClick={() => setEditingEmp(emp)}
                        className="px-2 py-1 bg-slate-100 hover:bg-amber-100 text-amber-800 font-bold text-[11px] rounded-lg border border-slate-300 inline-flex items-center gap-1 transition-colors"
                        title="Editar datos del colaborador"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Editar
                      </button>
                      {onDeleteEmployee && (
                        <button
                          onClick={() => onDeleteEmployee(emp.legajo)}
                          className="px-2 py-1 bg-slate-100 hover:bg-rose-100 text-rose-700 font-bold text-[11px] rounded-lg border border-slate-300 inline-flex items-center gap-1 transition-colors"
                          title="Eliminar de la nómina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ALTA DE EMPLEADO */}
      {showNewEmpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Alta de Nuevo Colaborador</h3>
              <button onClick={() => setShowNewEmpModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Legajo *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 2140"
                    value={newLegajo}
                    onChange={(e) => setNewLegajo(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empresa *</label>
                  <select
                    value={newEmpresa}
                    onChange={(e) => setNewEmpresa(e.target.value as Empresa)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Talleres Metalúrgicos Crucianelli">Talleres Metalúrgicos Crucianelli</option>
                    <option value="FERTEC S.A.">FERTEC S.A.</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo (Apellido, Nombre) *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Perez, Juan Carlos"
                  value={newColaborador}
                  onChange={(e) => setNewColaborador(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector *</label>
                  <select
                    value={newSector}
                    onChange={(e) => setNewSector(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {sectorsList.filter((s) => s !== 'Todos').map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DNI</label>
                  <input
                    type="text"
                    placeholder="ej. 40123456"
                    value={newDni}
                    onChange={(e) => setNewDni(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CUIL</label>
                  <input
                    type="text"
                    placeholder="ej. 20401234568"
                    value={newCuil}
                    onChange={(e) => setNewCuil(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setShowNewEmpModal(false)} className="px-4 py-2 text-slate-600 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg">Dar de Alta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DRAWER FICHA DEL COLABORADOR */}
      {selectedEmpForDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 space-y-6 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 text-blue-700 rounded-full font-bold text-lg">
                  {selectedEmpForDetail.colaborador.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedEmpForDetail.colaborador}</h3>
                  <p className="text-xs text-slate-500">
                    Legajo N° <strong className="text-blue-700">{selectedEmpForDetail.legajo}</strong> | {selectedEmpForDetail.empresa}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedEmpForDetail(null)} className="text-slate-400 hover:text-slate-600 p-1 font-bold">✕</button>
            </div>

            {/* Personal Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 block">Sector</span>
                <span className="font-bold text-slate-800">{selectedEmpForDetail.sector}</span>
              </div>
              <div>
                <span className="text-slate-500 block">DNI</span>
                <span className="font-mono text-slate-800">{selectedEmpForDetail.dni}</span>
              </div>
              <div>
                <span className="text-slate-500 block">CUIL</span>
                <span className="font-mono text-slate-800">{selectedEmpForDetail.cuil}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Fecha Ingreso</span>
                <span className="font-bold text-slate-800">{selectedEmpForDetail.fechaIngreso}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Antigüedad</span>
                <span className="font-bold text-emerald-700">{calculateTenureYears(selectedEmpForDetail.fechaIngreso)} años</span>
              </div>
            </div>

            {/* Historical Novedades for this employee */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                Historial de Novedades del Colaborador
              </h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {novedades.filter((n) => n.legajo === selectedEmpForDetail.legajo).length === 0 ? (
                  <p className="p-4 text-center text-slate-400">Sin registro de ausencias ni novedades.</p>
                ) : (
                  novedades
                    .filter((n) => n.legajo === selectedEmpForDetail.legajo)
                    .map((n) => (
                      <div key={n.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <span className="font-bold text-slate-800">{n.tipo}</span>
                          <span className="text-[11px] text-slate-500 block">{n.observaciones}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-700 block">{n.diasOHoras} {n.unidad}</span>
                          <span className="text-[10px] text-slate-400">{n.fechaInicio}</span>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>

            {/* Performance Evaluations for this employee */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                Evaluaciones de Desempeño
              </h4>
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 text-xs space-y-1">
                {evaluaciones.filter((ev) => ev.legajo === selectedEmpForDetail.legajo).length === 0 ? (
                  <p className="text-slate-400 text-center py-2">Sin evaluación formal registrada en el periodo actual.</p>
                ) : (
                  evaluaciones
                    .filter((ev) => ev.legajo === selectedEmpForDetail.legajo)
                    .map((ev) => (
                      <div key={ev.id} className="bg-white p-3 rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between font-bold">
                          <span>{ev.calificacionGeneral}</span>
                          <span className="text-indigo-600">{ev.objetivosCumplidos}% Objetivos</span>
                        </div>
                        <p className="text-slate-600 italic">"{ev.comentarios}"</p>
                      </div>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200">
              <button
                onClick={() => setSelectedEmpForDetail(null)}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                Cerrar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR COLABORADOR */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-600" />
                Editar Colaborador (Legajo {editingEmp.legajo})
              </h3>
              <button onClick={() => setEditingEmp(null)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleSaveEditedEmployee} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">N° Legajo</label>
                  <input
                    type="text"
                    disabled
                    value={editingEmp.legajo}
                    className="w-full p-2 bg-slate-100 border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado *</label>
                  <select
                    value={editingEmp.estado}
                    onChange={(e) => setEditingEmp({ ...editingEmp, estado: e.target.value as EstadoEmpleado })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="INACTIVO">INACTIVO</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador (Apellido, Nombre) *</label>
                <input
                  type="text"
                  required
                  value={editingEmp.colaborador}
                  onChange={(e) => setEditingEmp({ ...editingEmp, colaborador: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Empresa *</label>
                  <select
                    value={editingEmp.empresa}
                    onChange={(e) => setEditingEmp({ ...editingEmp, empresa: e.target.value as Empresa })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    <option value="Talleres Metalúrgicos Crucianelli">Talleres Metalúrgicos Crucianelli</option>
                    <option value="FERTEC S.A.">FERTEC S.A.</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector *</label>
                  <input
                    type="text"
                    required
                    value={editingEmp.sector}
                    onChange={(e) => setEditingEmp({ ...editingEmp, sector: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha Ingreso</label>
                  <input
                    type="text"
                    value={editingEmp.fechaIngreso}
                    onChange={(e) => setEditingEmp({ ...editingEmp, fechaIngreso: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">DNI</label>
                  <input
                    type="text"
                    value={editingEmp.dni}
                    onChange={(e) => setEditingEmp({ ...editingEmp, dni: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">CUIL</label>
                  <input
                    type="text"
                    value={editingEmp.cuil}
                    onChange={(e) => setEditingEmp({ ...editingEmp, cuil: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setEditingEmp(null)} className="px-4 py-2 text-slate-600 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg">Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: IMPORTACIÓN MASIVA DE NÓMINA (CSV / EXCEL / TXT) */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-3xl w-full p-6 space-y-4 animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg border border-blue-200">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Carga e Importación Masiva de Nómina de Personal
                  </h3>
                  <p className="text-xs text-slate-500">
                    Suba o pegue el padrón de empleados desde un archivo CSV o planilla de Excel.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportStatus(null);
                  setRawCsvText('');
                }}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Template Download Prompt */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-blue-600 shrink-0" />
                <span>¿No conoce el formato requerido? Descargue nuestra plantilla pre-formateada de ejemplo:</span>
              </div>
              <button
                onClick={() => downloadEmployeeTemplateCSV()}
                className="px-3 py-1 bg-white hover:bg-blue-100 text-blue-700 font-bold rounded-lg border border-blue-300 text-xs shrink-0 transition-colors"
              >
                Descargar Plantilla CSV
              </button>
            </div>

            {/* Mode Selector */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block">Modo de Importación:</span>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-slate-800">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'append'}
                    onChange={() => setImportMode('append')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Anexar / Actualizar por Legajo (Mantiene legajos existentes y agrega nuevos)</span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer font-semibold text-rose-800">
                  <input
                    type="radio"
                    name="importMode"
                    checked={importMode === 'replace'}
                    onChange={() => setImportMode('replace')}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Reemplazar Nómina Completa (Borra el padrón actual y carga solo esta lista)</span>
                </label>
              </div>
            </div>

            {/* File Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
              }`}
            >
              <input
                type="file"
                id="file-nomina-csv"
                accept=".csv,.txt,.tsv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
              <label htmlFor="file-nomina-csv" className="cursor-pointer block space-y-1">
                <Upload className="w-8 h-8 text-blue-600 mx-auto" />
                <span className="text-xs font-bold text-slate-800 block">
                  Haz clic para seleccionar o arrastra tu archivo CSV / Excel (.csv, .txt)
                </span>
                <span className="text-[11px] text-slate-500 block">
                  Columnas esperadas: Legajo ; Colaborador ; Estado ; Empresa ; Sector ; Fecha Ingreso ; CUIL ; DNI
                </span>
              </label>
            </div>

            {/* Raw Textarea Input */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                O pega directamente el contenido formateado por filas:
              </label>
              <textarea
                rows={5}
                value={rawCsvText}
                onChange={(e) => {
                  const val = e.target.value;
                  setRawCsvText(val);
                  if (val.trim()) {
                    const { valid, errors } = parseEmployeesCSV(val);
                    setImportStatus({ count: valid.length, errors });
                  } else {
                    setImportStatus(null);
                  }
                }}
                placeholder="Legajo ; Colaborador ; Estado ; Empresa ; Sector ; Fecha Ingreso ; CUIL ; DNI..."
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Parsed Live Preview Table */}
            {rawCsvText.trim().length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800">
                    Vista Previa de Filas Detectadas:
                  </span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ {parseEmployeesCSV(rawCsvText).valid.length} colaboradores listos para procesar
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg text-xs font-mono">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0 border-b border-slate-200">
                      <tr>
                        <th className="p-1.5">Legajo</th>
                        <th className="p-1.5">Colaborador</th>
                        <th className="p-1.5">Empresa</th>
                        <th className="p-1.5">Sector</th>
                        <th className="p-1.5">DNI</th>
                        <th className="p-1.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseEmployeesCSV(rawCsvText).valid.slice(0, 15).map((emp, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="p-1.5 font-bold text-blue-700">{emp.legajo}</td>
                          <td className="p-1.5 font-semibold text-slate-900">{emp.colaborador}</td>
                          <td className="p-1.5 text-slate-600">{emp.empresa}</td>
                          <td className="p-1.5 text-slate-600">{emp.sector}</td>
                          <td className="p-1.5 text-slate-500">{emp.dni}</td>
                          <td className="p-1.5 font-bold text-emerald-700">{emp.estado}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parseEmployeesCSV(rawCsvText).valid.length > 15 && (
                    <div className="p-2 text-center text-[11px] text-slate-500 bg-slate-50 italic">
                      ... y {parseEmployeesCSV(rawCsvText).valid.length - 15} colaboradores más.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Error / Warning Alert Box */}
            {importStatus && importStatus.errors.length > 0 && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-200 rounded-lg text-xs space-y-1">
                <div className="flex items-center space-x-1 font-bold text-rose-900">
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                  <span>Advertencias en líneas ignoradas:</span>
                </div>
                <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                  {importStatus.errors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
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
                Cancelar
              </button>
              <button
                onClick={handleExecImport}
                disabled={!rawCsvText.trim() || parseEmployeesCSV(rawCsvText).valid.length === 0}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all ${
                  rawCsvText.trim() && parseEmployeesCSV(rawCsvText).valid.length > 0
                    ? 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                }`}
              >
                Procesar e Importar {parseEmployeesCSV(rawCsvText).valid.length} Colaboradores
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
