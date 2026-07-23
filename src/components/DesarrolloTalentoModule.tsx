import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Award,
  FileSpreadsheet,
  PlusCircle,
  CheckCircle,
  Clock,
  UserCheck,
  Star,
  Users,
  Building,
  ChevronRight,
  BookOpen,
  Calendar,
  DollarSign,
  Briefcase,
  Layers,
  Edit3,
  HelpCircle,
  Search,
} from 'lucide-react';
import {
  Empleado,
  Capacitacion,
  PerfilPuesto,
  EvaluacionDesempeno,
  SkillPolivalencia,
  MatrizPolivalenciaRegistro,
  NivelPolivalencia,
  Empresa,
} from '../types';

interface DesarrolloTalentoModuleProps {
  employees: Empleado[];
  capacitaciones: Capacitacion[];
  perfiles: PerfilPuesto[];
  evaluaciones: EvaluacionDesempeno[];
  skills: SkillPolivalencia[];
  registrosPolivalencia: MatrizPolivalenciaRegistro[];
  onAddCapacitacion: (capacitacion: Capacitacion) => void;
  onUpdateCapacitacion: (capacitacion: Capacitacion) => void;
  onAddEvaluacion: (evaluacion: EvaluacionDesempeno) => void;
  onUpdatePolivalencia: (legajo: string, skillId: string, nivel: NivelPolivalencia) => void;
  empresaFilter: 'Todas' | Empresa;
}

export const DesarrolloTalentoModule: React.FC<DesarrolloTalentoModuleProps> = ({
  employees,
  capacitaciones,
  perfiles,
  evaluaciones,
  skills,
  registrosPolivalencia,
  onAddCapacitacion,
  onUpdateCapacitacion,
  onAddEvaluacion,
  onUpdatePolivalencia,
  empresaFilter,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'capacitaciones' | 'perfiles_evaluacion' | 'polivalencia'>('capacitaciones');

  // CAPACITACIONES STATE
  const [showNewCapModal, setShowNewCapModal] = useState<boolean>(false);
  const [selectedCapForAttendance, setSelectedCapForAttendance] = useState<Capacitacion | null>(null);

  // New Cap Form State
  const [capTitulo, setCapTitulo] = useState<string>('');
  const [capInstructor, setCapInstructor] = useState<string>('');
  const [capSector, setCapSector] = useState<string>('Producción');
  const [capFecha, setCapFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [capDuracion, setCapDuracion] = useState<number>(4);
  const [capPresupuesto, setCapPresupuesto] = useState<number>(100000);
  const [capDescripcion, setCapDescripcion] = useState<string>('');

  // EVALUACION STATE
  const [showNewEvalModal, setShowNewEvalModal] = useState<boolean>(false);
  const [evalLegajo, setEvalLegajo] = useState<string>('');
  const [evalEvaluador, setEvalEvaluador] = useState<string>('');
  const [evalObjetivos, setEvalObjetivos] = useState<number>(85);
  const [evalCalificacion, setEvalCalificacion] = useState<'Excepcional' | 'Cumple Expectativas' | 'Necesita Mejorar' | 'En Desarrollo'>('Cumple Expectativas');
  const [evalComentarios, setEvalComentarios] = useState<string>('');
  const [evalPlanAccion, setEvalPlanAccion] = useState<string>('');
  const [evalCompetenciasScores, setEvalCompetenciasScores] = useState<Record<string, number>>({
    'Interpretación de Planos / Metrología': 4,
    'Calidad y Precisión Técnica': 4,
    'Normas de Seguridad EPP': 5,
    'Trabajo en Equipo y Proactividad': 4,
  });

  // POLIVALENCIA STATE
  const [selectedSectorPolivalencia, setSelectedSectorPolivalencia] = useState<string>('Producción');

  // Active employees
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (e.estado !== 'ACTIVO') return false;
      if (empresaFilter !== 'Todas' && e.empresa !== empresaFilter) return false;
      return true;
    });
  }, [employees, empresaFilter]);

  // Sector list for dropdowns
  const sectorsList = useMemo(() => {
    const list = Array.from(new Set(employees.map((e) => e.sector))).sort();
    return list;
  }, [employees]);

  // Employees for selected sector in Polyvalence
  const sectorEmployeesForPoly = useMemo(() => {
    return activeEmployees.filter((e) => e.sector === selectedSectorPolivalencia);
  }, [activeEmployees, selectedSectorPolivalencia]);

  // Skills for selected sector
  const sectorSkills = useMemo(() => {
    return skills.filter((s) => s.sector === selectedSectorPolivalencia);
  }, [skills, selectedSectorPolivalencia]);

  // Submit New Capacitacion
  const handleCreateCapacitacion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!capTitulo.trim()) return;

    // Pick attendees from target sector
    const sectorEmps = activeEmployees.filter((e) => e.sector === capSector).slice(0, 8);
    const asistentes = sectorEmps.map((e) => ({
      legajo: e.legajo,
      colaborador: e.colaborador,
      asistio: false,
    }));

    const newCap: Capacitacion = {
      id: `CAP-${Date.now().toString().slice(-4)}`,
      titulo: capTitulo.trim(),
      instructor: capInstructor.trim() || 'Capacitador Interno',
      sectorTarget: capSector,
      fecha: capFecha,
      duracionHoras: Number(capDuracion) || 4,
      estado: 'Planificada',
      presupuesto: Number(capPresupuesto) || 0,
      descripcion: capDescripcion.trim(),
      asistentes,
    };

    onAddCapacitacion(newCap);
    setShowNewCapModal(false);
    setCapTitulo('');
    setCapInstructor('');
    setCapDescripcion('');
  };

  // Submit New Evaluation
  const handleCreateEvaluacion = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = activeEmployees.find((e) => e.legajo === evalLegajo);
    if (!emp) {
      alert('Por favor seleccione un colaborador válido.');
      return;
    }

    const competencias = Object.keys(evalCompetenciasScores).map((key) => ({
      nombre: key,
      puntaje: evalCompetenciasScores[key] || 4,
    }));

    const newEval: EvaluacionDesempeno = {
      id: `EVAL-${Date.now().toString().slice(-4)}`,
      legajo: emp.legajo,
      colaborador: emp.colaborador,
      puesto: emp.sector || 'Colaborador',
      sector: emp.sector,
      fecha: new Date().toISOString().slice(0, 10),
      evaluador: evalEvaluador.trim() || 'Jefe de Sector / RRHH',
      objetivosCumplidos: Number(evalObjetivos) || 80,
      calificacionGeneral: evalCalificacion,
      comentarios: evalComentarios.trim() || 'Evaluación de desempeño regular.',
      planAccion: evalPlanAccion.trim() || 'Seguimiento trimestral.',
      competencias,
    };

    onAddEvaluacion(newEval);
    setShowNewEvalModal(false);
    setEvalLegajo('');
    setEvalComentarios('');
    setEvalPlanAccion('');
  };

  // Helper for polyvalence level styling
  const getPolyLevelBadge = (nivel: NivelPolivalencia) => {
    switch (nivel) {
      case 0:
        return <span className="px-2 py-1 bg-slate-100 text-slate-400 font-bold rounded text-[11px]">0 - Sin Cap.</span>;
      case 1:
        return <span className="px-2 py-1 bg-amber-100 text-amber-800 font-bold rounded text-[11px]">1 - En Formación</span>;
      case 2:
        return <span className="px-2 py-1 bg-emerald-100 text-emerald-800 font-bold rounded text-[11px]">2 - Autónomo</span>;
      case 3:
        return <span className="px-2 py-1 bg-[#E30613] text-white font-bold rounded text-[11px] flex items-center gap-1"><Star className="w-3 h-3 fill-white" /> 3 - Tutor / Experto</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Subtab Navigation Header */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#E30613] rounded-lg border border-red-200">
              <GraduationCap className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Desarrollo del Talento Humano</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestión de capacitaciones, catálogo de perfiles de puesto, evaluaciones de desempeño y matriz de polivalencia por sector.
          </p>
        </div>

        {/* Subtabs Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start md:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('capacitaciones')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'capacitaciones'
                ? 'bg-white text-[#E30613] shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Capacitaciones ({capacitaciones.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('perfiles_evaluacion')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'perfiles_evaluacion'
                ? 'bg-white text-[#E30613] shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Perfiles & Evaluaciones</span>
          </button>

          <button
            onClick={() => setActiveSubTab('polivalencia')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === 'polivalencia'
                ? 'bg-white text-[#E30613] shadow-xs border border-slate-200 font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Matriz de Polivalencia</span>
          </button>
        </div>
      </div>

      {/* SUBTAB 1: CAPACITACIONES */}
      {activeSubTab === 'capacitaciones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Plan Anual de Capacitación
            </h3>
            <button
              onClick={() => setShowNewCapModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Programar Nueva Capacitación</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {capacitaciones.map((cap) => (
              <div
                key={cap.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Sector: {cap.sectorTarget}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        cap.estado === 'Completada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : cap.estado === 'En Curso'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cap.estado}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 leading-snug">{cap.titulo}</h4>
                  <p className="text-xs text-slate-600 line-clamp-2">{cap.descripcion}</p>
                </div>

                <div className="space-y-2 text-xs border-t border-slate-100 pt-3 text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                      {cap.instructor}
                    </span>
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      {cap.duracionHoras}hs
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {cap.fecha}
                    </span>
                    {cap.presupuesto ? (
                      <span className="font-mono font-semibold text-slate-700">
                        ${cap.presupuesto.toLocaleString('es-AR')}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCapForAttendance(cap)}
                  className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-indigo-700 text-xs font-bold rounded-lg flex items-center justify-center space-x-1 transition-colors"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Gestionar Asistencia ({cap.asistentes.length} convocados)</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 2: PERFILES Y EVALUACIÓN DE DESEMPEÑO */}
      {activeSubTab === 'perfiles_evaluacion' && (
        <div className="space-y-8">
          {/* SECTION A: Perfiles de Puestos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Catálogo de Perfiles de Puestos
                </h3>
                <p className="text-xs text-slate-500">
                  Definición de competencias requeridas, responsabilidades y requisitos académicos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {perfiles.map((puesto) => (
                <div key={puesto.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {puesto.codigo}
                      </span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{puesto.nombre}</h4>
                    </div>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                      {puesto.sector}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600">{puesto.descripcion}</p>

                  <div className="space-y-1">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Responsabilidades Clave:
                    </span>
                    <ul className="text-xs text-slate-600 list-disc pl-4 space-y-0.5">
                      {puesto.responsabilidades.map((resp, i) => (
                        <li key={i}>{resp}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                      Competencias Requeridas:
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {puesto.competenciasRequeridas.map((comp, idx) => (
                        <span key={idx} className="text-[11px] font-medium bg-white px-2 py-1 rounded border border-slate-200 text-slate-800">
                          {comp.nombre}: <strong className="text-indigo-600">{comp.nivelMinimo}/5</strong>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION B: Evaluaciones de Desempeño */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                  Evaluaciones de Desempeño Realizadas
                </h3>
                <p className="text-xs text-slate-500">
                  Calificación de competencias, objetivos cumplidos y planes de desarrollo personal.
                </p>
              </div>
              <button
                onClick={() => setShowNewEvalModal(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Nueva Evaluación de Desempeño</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {evaluaciones.map((ev) => (
                <div key={ev.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-slate-500">{ev.fecha}</span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          ev.calificacionGeneral === 'Excepcional'
                            ? 'bg-emerald-100 text-emerald-800'
                            : ev.calificacionGeneral === 'Cumple Expectativas'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {ev.calificacionGeneral}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900">{ev.colaborador}</h4>
                    <p className="text-xs text-slate-500">{ev.puesto} | {ev.sector}</p>
                  </div>

                  <div className="space-y-2 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span className="text-slate-600">Cumplimiento Objetivos:</span>
                      <span className="text-indigo-600 font-extrabold">{ev.objetivosCumplidos}%</span>
                    </div>
                    <p className="text-slate-600 italic">"{ev.comentarios}"</p>
                    {ev.planAccion && (
                      <p className="text-[11px] text-slate-700 border-t border-slate-200 pt-1 font-medium">
                        <strong>Plan:</strong> {ev.planAccion}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: MATRIZ DE POLIVALENCIA POR SECTOR */}
      {activeSubTab === 'polivalencia' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-800">Matriz de Polivalencia / Versatilidad</h3>
              <p className="text-xs text-slate-500">
                Grilla interactiva de habilidades por sector. Haga clic en los niveles para actualizar el nivel del colaborador en tiempo real.
              </p>
            </div>

            {/* Sector Selector */}
            <div className="flex items-center space-x-2 bg-slate-100 border border-slate-200 rounded-lg p-1.5 text-xs">
              <span className="font-bold text-slate-600">Seleccionar Sector:</span>
              <select
                value={selectedSectorPolivalencia}
                onChange={(e) => setSelectedSectorPolivalencia(e.target.value)}
                className="bg-white font-bold text-slate-800 px-3 py-1 rounded border border-slate-300 focus:outline-none"
              >
                {sectorsList.map((s) => (
                  <option key={s} value={s}>
                    Sector: {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Polyvalency Legend */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-900 text-white p-3 rounded-xl text-xs">
            <span className="font-bold text-blue-300 mr-2">Niveles de Polivalencia:</span>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-slate-300 rounded-full inline-block"></span>
              <span>0: Sin Capacitación</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-amber-400 rounded-full inline-block"></span>
              <span>1: En Formación</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-emerald-500 rounded-full inline-block"></span>
              <span>2: Autónomo</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-3 h-3 bg-blue-500 rounded-full inline-block"></span>
              <span>3: Experto / Tutor</span>
            </div>
          </div>

          {/* Interactive Heatmap Matrix */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                    <th className="p-3.5 min-w-[200px]">Colaborador</th>
                    {sectorSkills.length === 0 ? (
                      <th className="p-3 text-slate-400 font-normal">No hay habilidades configuradas para este sector</th>
                    ) : (
                      sectorSkills.map((sk) => (
                        <th key={sk.id} className="p-3 text-center min-w-[140px] max-w-[180px]">
                          <span className="block font-bold text-slate-800">{sk.nombreHabilidad}</span>
                          <span className="text-[10px] text-slate-500 font-normal block leading-tight">{sk.descripcion}</span>
                        </th>
                      ))
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-sans">
                  {sectorEmployeesForPoly.length === 0 ? (
                    <tr>
                      <td colSpan={sectorSkills.length + 1} className="p-8 text-center text-slate-500">
                        No hay colaboradores activos registrados en el sector "{selectedSectorPolivalencia}".
                      </td>
                    </tr>
                  ) : (
                    sectorEmployeesForPoly.map((emp) => (
                      <tr key={emp.legajo} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">
                          <div>
                            <span className="font-bold">{emp.colaborador}</span>
                            <span className="text-[11px] text-slate-500 block font-mono">
                              Legajo: {emp.legajo} | {emp.sector}
                            </span>
                          </div>
                        </td>

                        {sectorSkills.map((sk) => {
                          const reg = registrosPolivalencia.find(
                            (r) => r.legajo === emp.legajo && r.skillId === sk.id
                          );
                          const currentLevel: NivelPolivalencia = reg ? reg.nivel : 0;

                          return (
                            <td key={sk.id} className="p-3 text-center">
                              <button
                                onClick={() => {
                                  const nextLevel = ((currentLevel + 1) % 4) as NivelPolivalencia;
                                  onUpdatePolivalencia(emp.legajo, sk.id, nextLevel);
                                }}
                                title="Haga clic para cambiar nivel (0 -> 1 -> 2 -> 3)"
                                className="w-full flex justify-center hover:scale-105 transition-transform"
                              >
                                {getPolyLevelBadge(currentLevel)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA CAPACITACIÓN */}
      {showNewCapModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Programar Nueva Capacitación</h3>
              <button onClick={() => setShowNewCapModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateCapacitacion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título del Curso / Taller *</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Interpretación de Planos e Hidráulica"
                  value={capTitulo}
                  onChange={(e) => setCapTitulo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Instructor / Proveedor</label>
                  <input
                    type="text"
                    placeholder="ej. Ing. Gómez"
                    value={capInstructor}
                    onChange={(e) => setCapInstructor(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sector Destino</label>
                  <select
                    value={capSector}
                    onChange={(e) => setCapSector(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                  >
                    {sectorsList.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha</label>
                  <input
                    type="date"
                    value={capFecha}
                    onChange={(e) => setCapFecha(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duración (hs)</label>
                  <input
                    type="number"
                    value={capDuracion}
                    onChange={(e) => setCapDuracion(parseFloat(e.target.value) || 1)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Presupuesto ($)</label>
                  <input
                    type="number"
                    value={capPresupuesto}
                    onChange={(e) => setCapPresupuesto(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temario / Objetivos</label>
                <textarea
                  rows={3}
                  value={capDescripcion}
                  onChange={(e) => setCapDescripcion(e.target.value)}
                  placeholder="Detalle el contenido y competencias a evaluar..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setShowNewCapModal(false)} className="px-4 py-2 text-slate-600 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">Guardar Capacitación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA EVALUACIÓN DE DESEMPEÑO */}
      {showNewEvalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-800">Cargar Evaluación de Desempeño</h3>
              <button onClick={() => setShowNewEvalModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateEvaluacion} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Colaborador Evaluado *</label>
                <select
                  value={evalLegajo}
                  onChange={(e) => setEvalLegajo(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-lg text-sm font-semibold"
                >
                  <option value="">-- Seleccionar de la nómina --</option>
                  {activeEmployees.map((e) => (
                    <option key={`${e.empresa}-${e.legajo}`} value={e.legajo}>
                      Legajo {e.legajo} - {e.colaborador} ({e.sector})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Evaluador / Jefe Directo</label>
                  <input
                    type="text"
                    placeholder="ej. Eduardo Ariel Brasca"
                    value={evalEvaluador}
                    onChange={(e) => setEvalEvaluador(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Objetivos Cumplidos (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={evalObjetivos}
                    onChange={(e) => setEvalObjetivos(parseInt(e.target.value) || 80)}
                    className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-center"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Calificación General</label>
                <select
                  value={evalCalificacion}
                  onChange={(e) => setEvalCalificacion(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                >
                  <option value="Excepcional">Excepcional</option>
                  <option value="Cumple Expectativas">Cumple Expectativas</option>
                  <option value="En Desarrollo">En Desarrollo</option>
                  <option value="Necesita Mejorar">Necesita Mejorar</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Comentarios y Fortalezas</label>
                <textarea
                  rows={2}
                  value={evalComentarios}
                  onChange={(e) => setEvalComentarios(e.target.value)}
                  placeholder="Detalle los aspectos destacados del periodo..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Plan de Desarrollo / Mejora</label>
                <textarea
                  rows={2}
                  value={evalPlanAccion}
                  onChange={(e) => setEvalPlanAccion(e.target.value)}
                  placeholder="Cursos a realizar, objetivos para el próximo ciclo..."
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2 border-t border-slate-200 pt-3">
                <button type="button" onClick={() => setShowNewEvalModal(false)} className="px-4 py-2 text-slate-600 font-semibold">Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg">Guardar Evaluación</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASISTENCIA A CAPACITACIÓN */}
      {selectedCapForAttendance && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-800">{selectedCapForAttendance.titulo}</h3>
                <p className="text-xs text-slate-500">Registro de Asistencia de Participantes</p>
              </div>
              <button onClick={() => setSelectedCapForAttendance(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto divide-y divide-slate-100 text-xs">
              {selectedCapForAttendance.asistentes.map((asist, idx) => (
                <div key={asist.legajo} className="py-2 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{asist.colaborador}</span>
                    <span className="text-slate-400 text-[10px] block font-mono">Legajo {asist.legajo}</span>
                  </div>

                  <button
                    onClick={() => {
                      const updatedAsistentes = [...selectedCapForAttendance.asistentes];
                      updatedAsistentes[idx].asistio = !updatedAsistentes[idx].asistio;
                      const updatedCap = { ...selectedCapForAttendance, asistentes: updatedAsistentes };
                      onUpdateCapacitacion(updatedCap);
                      setSelectedCapForAttendance(updatedCap);
                    }}
                    className={`px-3 py-1 rounded-full font-bold text-xs flex items-center space-x-1 ${
                      asist.asistio ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{asist.asistio ? 'Presente' : 'Ausente'}</span>
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 pt-3">
              <button
                onClick={() => setSelectedCapForAttendance(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
