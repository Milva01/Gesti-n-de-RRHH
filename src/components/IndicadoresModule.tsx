import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Clock,
  GraduationCap,
  Award,
  AlertTriangle,
  Building,
  Calendar,
  Filter,
  Printer,
  Download,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Empleado, Novedad, Capacitacion, Empresa, MatrizPolivalenciaRegistro } from '../types';

interface IndicadoresModuleProps {
  employees: Empleado[];
  novedades: Novedad[];
  capacitaciones: Capacitacion[];
  polivalenciaRegistros: MatrizPolivalenciaRegistro[];
  empresaFilter: 'Todas' | Empresa;
}

const COLORS = ['#E30613', '#27272A', '#F59E0B', '#10B981', '#64748B', '#F43F5E', '#06B6D4', '#8B5CF6'];

export const IndicadoresModule: React.FC<IndicadoresModuleProps> = ({
  employees,
  novedades,
  capacitaciones,
  polivalenciaRegistros,
  empresaFilter,
}) => {
  const [selectedMes, setSelectedMes] = useState<string>('2026-07');

  // Filter employees by company
  const activeEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (e.estado !== 'ACTIVO') return false;
      if (empresaFilter !== 'Todas' && e.empresa !== empresaFilter) return false;
      return true;
    });
  }, [employees, empresaFilter]);

  const inactiveEmployees = useMemo(() => {
    return employees.filter((e) => {
      if (e.estado !== 'INACTIVO') return false;
      if (empresaFilter !== 'Todas' && e.empresa !== empresaFilter) return false;
      return true;
    });
  }, [employees, empresaFilter]);

  // Filter novedades by company & month
  const filteredNovedades = useMemo(() => {
    return novedades.filter((n) => {
      if (empresaFilter !== 'Todas' && n.empresa !== empresaFilter) return false;
      if (selectedMes) {
        return n.fechaInicio.startsWith(selectedMes) || n.fechaFin.startsWith(selectedMes);
      }
      return true;
    });
  }, [novedades, empresaFilter, selectedMes]);

  // KPI Calculations
  const kpis = useMemo(() => {
    const totalHeadcount = activeEmployees.length || 1;
    
    // Total hours/days lost to absence
    let diasPerdidos = 0;
    let horasPerdidas = 0;

    filteredNovedades.forEach((n) => {
      if (n.tipo.includes('Ausencia') || n.tipo.includes('Enfermedad') || n.tipo.includes('Accidente') || n.tipo.includes('Falta')) {
        if (n.unidad === 'Días') {
          diasPerdidos += n.diasOHoras;
        } else {
          horasPerdidas += n.diasOHoras;
        }
      }
    });

    const totalHorasPerdidasEq = diasPerdidos * 8 + horasPerdidas;
    // Estimated total working hours in the month (Headcount * 168hs)
    const totalHorasLaborables = totalHeadcount * 168;
    const tasaAusentismo = Number(((totalHorasPerdidasEq / totalHorasLaborables) * 100).toFixed(2));

    // Training compliance
    const totalCursos = capacitaciones.length;
    const cursosCompletados = capacitaciones.filter((c) => c.estado === 'Completada').length;
    const cumplimientoCapacitacion = totalCursos > 0 ? Math.round((cursosCompletados / totalCursos) * 100) : 100;
    const totalHorasCapacitacion = capacitaciones.reduce((acc, c) => acc + (c.estado === 'Completada' ? c.duracionHoras : 0), 0);

    // Polyvalence Average Score (0 to 3 converted to 0-100%)
    const avgPolyvalenceScore =
      polivalenciaRegistros.length > 0
        ? Math.round(
            (polivalenciaRegistros.reduce((acc, r) => acc + r.nivel, 0) / (polivalenciaRegistros.length * 3)) * 100
          )
        : 68;

    // Turnover Rate (Inactives over total headcount)
    const turnoverRate = Number(((inactiveEmployees.length / (totalHeadcount + inactiveEmployees.length)) * 100).toFixed(1));

    return {
      totalHeadcount,
      tasaAusentismo,
      diasPerdidos,
      totalHorasPerdidasEq,
      cumplimientoCapacitacion,
      totalHorasCapacitacion,
      avgPolyvalenceScore,
      turnoverRate,
    };
  }, [activeEmployees, inactiveEmployees, filteredNovedades, capacitaciones, polivalenciaRegistros]);

  // Chart Data 1: Ausencias por Sector
  const dataAusentismoPorSector = useMemo(() => {
    const sectorMap: Record<string, number> = {};
    filteredNovedades.forEach((n) => {
      const val = n.unidad === 'Días' ? n.diasOHoras : Number((n.diasOHoras / 8).toFixed(1));
      sectorMap[n.sector] = (sectorMap[n.sector] || 0) + val;
    });

    return Object.keys(sectorMap).map((sector) => ({
      sector,
      diasPerdidos: Number(sectorMap[sector].toFixed(1)),
    })).sort((a, b) => b.diasPerdidos - a.diasPerdidos);
  }, [filteredNovedades]);

  // Chart Data 2: Distribución por Sector
  const dataDistribucionSector = useMemo(() => {
    const map: Record<string, number> = {};
    activeEmployees.forEach((e) => {
      map[e.sector] = (map[e.sector] || 0) + 1;
    });

    return Object.keys(map).map((sector) => ({
      name: sector,
      value: map[sector],
    }));
  }, [activeEmployees]);

  // Chart Data 3: Evolución Mensual Ausentismo (Simulado histórico)
  const dataEvolucionAusentismo = [
    { mes: 'Ene 2026', tasa: 2.1 },
    { mes: 'Feb 2026', tasa: 2.4 },
    { mes: 'Mar 2026', tasa: 1.9 },
    { mes: 'Abr 2026', tasa: 2.8 },
    { mes: 'May 2026', tasa: 3.1 },
    { mes: 'Jun 2026', tasa: 2.3 },
    { mes: 'Jul 2026', tasa: kpis.tasaAusentismo || 2.5 },
  ];

  // Print executive summary
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-red-50 text-[#E30613] rounded-lg border border-red-200">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Indicadores de Gestión de RRHH</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Métricas estratégicas: Tasa de ausentismo, distribución de nómina, cumplimiento de capacitaciones e índice de polivalencia.
          </p>
        </div>

        {/* Month Selector & Print */}
        <div className="flex items-center gap-3">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
            <Calendar className="w-4 h-4 text-[#E30613]" />
            <span className="font-semibold text-slate-700">Período:</span>
            <input
              type="month"
              value={selectedMes}
              onChange={(e) => setSelectedMes(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-[#18181B] hover:bg-zinc-800 text-white text-xs font-semibold rounded-lg shadow-xs flex items-center space-x-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Reporte</span>
          </button>
        </div>
      </div>

      {/* KPI CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tasa de Ausentismo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-t-4 border-t-[#E30613]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tasa de Ausentismo
            </span>
            <div className="p-2 bg-red-50 text-[#E30613] rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.tasaAusentismo}%</span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Meta &lt; 3.0%
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            {kpis.diasPerdidos} días perdidos en el mes sobre {kpis.totalHeadcount} colaboradores.
          </p>
        </div>

        {/* KPI 2: Dotación Activa */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-t-4 border-t-zinc-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dotación Activa Total
            </span>
            <div className="p-2 bg-zinc-100 text-zinc-800 rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">{kpis.totalHeadcount}</span>
            <span className="text-xs font-medium text-slate-500">
              Inactivos: {inactiveEmployees.length}
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Rotación estimada: <strong className="text-slate-700">{kpis.turnoverRate}%</strong> anual.
          </p>
        </div>

        {/* KPI 3: Cumplimiento Capacitaciones */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-t-4 border-t-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cumplimiento Capacitaciones
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.cumplimientoCapacitacion}%
            </span>
            <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
              {kpis.totalHorasCapacitacion} hs ejecutadas
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Planificación de formación continua del personal.
          </p>
        </div>

        {/* KPI 4: Índice de Polivalencia */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2 border-t-4 border-t-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Índice de Polivalencia
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-extrabold text-slate-900">
              {kpis.avgPolyvalenceScore}%
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              Multihabilidad
            </span>
          </div>
          <p className="text-[11px] text-slate-500">
            Versatilidad operativa para cobertura de puestos clave.
          </p>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Días Perdidos por Sector */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-[#E30613]" />
              Impacto de Ausentismo por Sector (Días Perdidos)
            </h3>
            <span className="text-xs text-slate-400">Mes seleccionado</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataAusentismoPorSector}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="sector" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="diasPerdidos" name="Días Perdidos" fill="#E30613" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Distribución por Sector */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-indigo-600" />
              Distribución del Personal por Sector
            </h3>
            <span className="text-xs text-slate-400">{activeEmployees.length} Activos</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataDistribucionSector}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {dataDistribucionSector.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '8px', border: 'none', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Evolución Mensual Tasa Ausentismo */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#E30613]" />
              Evolución Mensual de la Tasa de Ausentismo (%)
            </h3>
            <span className="text-xs font-semibold text-slate-500">Tendencia Año 2026</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataEvolucionAusentismo}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="%" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '8px', border: '1px solid #3f3f46', color: '#fff', fontSize: '12px' }}
                />
                <Line
                  type="monotone"
                  dataKey="tasa"
                  name="Tasa de Ausentismo %"
                  stroke="#E30613"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#E30613' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
