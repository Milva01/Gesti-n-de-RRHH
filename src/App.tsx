/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  supabase,
  subscribeEmployees,
  saveEmployeeToSupabase,
  deleteEmployeeFromSupabase,
  bulkSaveEmployeesToSupabase,
  subscribeNovedades,
  saveNovedadToSupabase,
  deleteNovedadFromSupabase,
  bulkReplaceNovedadesInSupabase,
  subscribeCapacitaciones,
  saveCapacitacionToSupabase,
  subscribePerfiles,
  subscribeEvaluaciones,
  saveEvaluacionToSupabase,
  subscribeSkills,
  subscribeRegistrosPolivalencia,
  saveRegistroPolivalenciaToSupabase,
  getUserProfile,
  signOut,
} from './lib/supabase';
import {
  Empleado,
  Novedad,
  Capacitacion,
  PerfilPuesto,
  EvaluacionDesempeno,
  SkillPolivalencia,
  MatrizPolivalenciaRegistro,
  Empresa,
  EstadoAprobacion,
  NivelPolivalencia,
  UserProfile,
} from './types';
import { Navbar } from './components/Navbar';
import { NovedadesModule } from './components/NovedadesModule';
import { IndicadoresModule } from './components/IndicadoresModule';
import { DesarrolloTalentoModule } from './components/DesarrolloTalentoModule';
import { NominaModule } from './components/NominaModule';
import { LoginScreen } from './components/LoginScreen';
import { SetPasswordScreen } from './components/SetPasswordScreen';

import { BirthdayModal } from './components/BirthdayModal';
import { getTodayBirthdays, getUpcomingBirthdays } from './utils/birthdays';
import { Cake, Sparkles, X, ChevronRight } from 'lucide-react';

const initialAuthAction =
  typeof window !== 'undefined'
    ? new URLSearchParams(window.location.hash.replace(/^#/, '')).get('type')
    : null;

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [passwordSetupRequired, setPasswordSetupRequired] = useState(
    initialAuthAction === 'invite' || initialAuthAction === 'recovery',
  );

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false);
      return;
    }

    let active = true;
    const applySession = async (user: Parameters<typeof getUserProfile>[0] | null) => {
      if (!active) return;
      if (!user) {
        setCurrentUser(null);
        setAuthError('');
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await getUserProfile(user);
        if (active) {
          setCurrentUser(profile);
          setAuthError('');
        }
      } catch (error) {
        if (active) {
          setCurrentUser(null);
          setAuthError(error instanceof Error ? error.message : 'No se pudo validar tu perfil.');
        }
      } finally {
        if (active) setAuthLoading(false);
      }
    };

    supabase.auth.getSession().then(({ data }) => applySession(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setPasswordSetupRequired(true);
      void applySession(session?.user ?? null);
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Main Data States
  const [employees, setEmployees] = useState<Empleado[]>([]);
  const [novedades, setNovedades] = useState<Novedad[]>([]);
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>([]);
  const [perfiles, setPerfiles] = useState<PerfilPuesto[]>([]);
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDesempeno[]>([]);
  const [skills, setSkills] = useState<SkillPolivalencia[]>([]);
  const [registrosPolivalencia, setRegistrosPolivalencia] = useState<MatrizPolivalenciaRegistro[]>([]);

  // Global Navigation & Filtering States
  const [activeTab, setActiveTab] = useState<'novedades' | 'indicadores' | 'desarrollo' | 'nomina'>('novedades');
  const [empresaFilter, setEmpresaFilter] = useState<'Todas' | Empresa>('Todas');
  const [searchTermGlobal, setSearchTermGlobal] = useState<string>('');

  useEffect(() => {
    if (!currentUser) return;

    const unsubEmployees = subscribeEmployees((data) => {
      if (data && data.length > 0) setEmployees(data);
    });
    const unsubNovedades = subscribeNovedades((data) => {
      setNovedades(data || []);
    });
    const unsubCapacitaciones = subscribeCapacitaciones((data) => {
      if (data && data.length > 0) setCapacitaciones(data);
    });
    const unsubPerfiles = subscribePerfiles((data) => {
      if (data && data.length > 0) setPerfiles(data);
    });
    const unsubEvaluaciones = subscribeEvaluaciones((data) => {
      if (data && data.length > 0) setEvaluaciones(data);
    });
    const unsubSkills = subscribeSkills((data) => {
      if (data && data.length > 0) setSkills(data);
    });
    const unsubRegistros = subscribeRegistrosPolivalencia((data) => {
      if (data && data.length > 0) setRegistrosPolivalencia(data);
    });

    return () => {
      unsubEmployees();
      unsubNovedades();
      unsubCapacitaciones();
      unsubPerfiles();
      unsubEvaluaciones();
      unsubSkills();
      unsubRegistros();
    };
  }, [currentUser?.id]);

  // Handlers for Novedades
  const handleAddNovedad = (newNov: Novedad) => {
    setNovedades((prev) => [newNov, ...prev]);
    saveNovedadToSupabase(newNov).catch((err) => console.error('Error al guardar la novedad:', err));
  };

  const handleUpdateEstadoNovedad = (id: string, nuevoEstado: EstadoAprobacion) => {
    const updated = novedades.find((n) => n.id === id);
    if (updated) {
      const novWithNewStatus = { ...updated, estadoAprobacion: nuevoEstado };
      setNovedades((prev) =>
        prev.map((n) => (n.id === id ? novWithNewStatus : n))
      );
      saveNovedadToSupabase(novWithNewStatus).catch((err) => console.error('Error al actualizar la novedad:', err));
    }
  };

  const handleDeleteNovedad = (id: string) => {
    setNovedades((prev) => prev.filter((n) => n.id !== id));
    deleteNovedadFromSupabase(id).catch((err) => console.error('Error al eliminar la novedad:', err));
  };

  const handleBulkImportNovedades = (items: Novedad[]) => {
    const combined = Array.from(
      new Map([...items, ...novedades].map((item) => [item.id, item])).values(),
    );
    setNovedades(combined);
    bulkReplaceNovedadesInSupabase(combined).catch((err) => console.error('Error al importar novedades:', err));
  };

  // Handlers for Capacitaciones & Talent
  const handleAddCapacitacion = (newCap: Capacitacion) => {
    setCapacitaciones((prev) => [newCap, ...prev]);
    saveCapacitacionToSupabase(newCap).catch((err) => console.error('Error al guardar la capacitación:', err));
  };

  const handleUpdateCapacitacion = (updatedCap: Capacitacion) => {
    setCapacitaciones((prev) => prev.map((c) => (c.id === updatedCap.id ? updatedCap : c)));
    saveCapacitacionToSupabase(updatedCap).catch((err) => console.error('Error al actualizar la capacitación:', err));
  };

  const handleAddEvaluacion = (newEval: EvaluacionDesempeno) => {
    setEvaluaciones((prev) => [newEval, ...prev]);
    saveEvaluacionToSupabase(newEval).catch((err) => console.error('Error al guardar la evaluación:', err));
  };

  const handleUpdatePolivalencia = (legajo: string, skillId: string, nivel: NivelPolivalencia) => {
    setRegistrosPolivalencia((prev) => {
      const idx = prev.findIndex((r) => r.legajo === legajo && r.skillId === skillId);
      const reg = { legajo, skillId, nivel };
      saveRegistroPolivalenciaToSupabase(reg).catch((err) => console.error('Error al guardar polivalencia:', err));
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = reg;
        return copy;
      } else {
        return [...prev, reg];
      }
    });
  };

  // Handlers for Nomina
  const handleAddEmployee = (emp: Empleado) => {
    setEmployees((prev) => [emp, ...prev]);
    saveEmployeeToSupabase(emp).catch((err) => console.error('Error al guardar el empleado:', err));
  };

  const handleUpdateEmployee = (emp: Empleado) => {
    setEmployees((prev) => prev.map((e) => (e.legajo === emp.legajo ? emp : e)));
    saveEmployeeToSupabase(emp).catch((err) => console.error('Error al actualizar el empleado:', err));
  };

  const handleDeleteEmployee = (legajo: string) => {
    setEmployees((prev) => prev.filter((e) => e.legajo !== legajo));
    deleteEmployeeFromSupabase(legajo).catch((err) => console.error('Error al eliminar el empleado:', err));
  };

  const handleBulkImportEmployees = (importedList: Empleado[], mode: 'replace' | 'append') => {
    if (mode === 'replace') {
      setEmployees(importedList);
    } else {
      setEmployees((prev) => {
        const existingMap = new Map(prev.map((e) => [e.legajo, e]));
        importedList.forEach((imp) => {
          existingMap.set(imp.legajo, imp);
        });
        return Array.from(existingMap.values());
      });
    }
    bulkSaveEmployeesToSupabase(importedList, mode).catch((err) => console.error('Error al importar empleados:', err));
  };

  // Birthday Modal & Banner States
  const [isBirthdayModalOpen, setIsBirthdayModalOpen] = useState<boolean>(false);
  const [dismissBirthdayBanner, setDismissBirthdayBanner] = useState<boolean>(false);

  // Birthday Calculations
  const todayBirthdays = useMemo(() => {
    return getTodayBirthdays(employees);
  }, [employees]);

  const upcomingBirthdays = useMemo(() => {
    return getUpcomingBirthdays(employees, 30);
  }, [employees]);

  // Global Pending Counts
  const pendingCount = useMemo(() => {
    return novedades.filter((n) => n.estadoAprobacion === 'Pendiente').length;
  }, [novedades]);

  const totalActivos = useMemo(() => {
    return employees.filter((e) => e.estado === 'ACTIVO').length;
  }, [employees]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#111113] text-white flex items-center justify-center">
        <div className="text-sm text-zinc-400">Validando acceso seguro…</div>
      </div>
    );
  }

  if (currentUser && passwordSetupRequired) {
    return (
      <SetPasswordScreen
        email={currentUser.email}
        onComplete={() => {
          setPasswordSetupRequired(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <>
        {authError && (
          <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-rose-800 bg-rose-950 px-4 py-2 text-sm text-rose-100 shadow-xl">
            {authError}
          </div>
        )}
        <LoginScreen />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col">
      {/* Top Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        empresaFilter={empresaFilter}
        setEmpresaFilter={setEmpresaFilter}
        searchTerm={searchTermGlobal}
        setSearchTerm={setSearchTermGlobal}
        pendingCount={pendingCount}
        totalActivos={totalActivos}
        todayBirthdaysCount={todayBirthdays.length}
        onOpenBirthdayModal={() => setIsBirthdayModalOpen(true)}
        currentUser={currentUser}
        allUsers={[]}
        onLogout={() => {
          void signOut().catch((error) => console.error('Error al cerrar sesión:', error));
        }}
      />


      {/* Birthday Banner (Shows if there are birthdays today and not dismissed) */}
      {todayBirthdays.length > 0 && !dismissBirthdayBanner && (
        <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-rose-700 text-white shadow-md border-b border-rose-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm font-medium">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 bg-white/20 rounded-lg text-amber-200">
                <Cake className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <span className="font-extrabold text-amber-200 uppercase tracking-wider mr-2 font-mono text-[11px] bg-black/20 px-2 py-0.5 rounded border border-white/20">
                  🎉 CUMPLEAÑOS DE HOY
                </span>
                <span>
                  {todayBirthdays.length === 1 ? (
                    <>
                      ¡Hoy es el cumpleaños de <strong className="text-white underline decoration-amber-300 decoration-2">{todayBirthdays[0].employee.colaborador}</strong> (Legajo {todayBirthdays[0].employee.legajo} - {todayBirthdays[0].employee.sector})! 🎂
                    </>
                  ) : (
                    <>
                      ¡Hoy celebran su cumpleaños{' '}
                      <strong className="text-white">
                        {todayBirthdays.map((b) => b.employee.colaborador).join(' y ')}
                      </strong>! 🎈
                    </>
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => setIsBirthdayModalOpen(true)}
                className="px-3 py-1 bg-white hover:bg-amber-50 text-rose-800 rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center space-x-1"
              >
                <span>Ver y Felicitaciones</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setDismissBirthdayBanner(true)}
                title="Ocultar banner"
                className="p-1 text-white/80 hover:text-white hover:bg-white/20 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'novedades' && (
          <NovedadesModule
            employees={employees}
            novedades={novedades}
            onAddNovedad={handleAddNovedad}
            onUpdateEstadoNovedad={handleUpdateEstadoNovedad}
            onDeleteNovedad={handleDeleteNovedad}
            onBulkImportNovedades={handleBulkImportNovedades}
            empresaFilter={empresaFilter}
            searchTermGlobal={searchTermGlobal}
          />
        )}

        {activeTab === 'indicadores' && (
          <IndicadoresModule
            employees={employees}
            novedades={novedades}
            capacitaciones={capacitaciones}
            polivalenciaRegistros={registrosPolivalencia}
            empresaFilter={empresaFilter}
          />
        )}

        {activeTab === 'desarrollo' && (
          <DesarrolloTalentoModule
            employees={employees}
            capacitaciones={capacitaciones}
            perfiles={perfiles}
            evaluaciones={evaluaciones}
            skills={skills}
            registrosPolivalencia={registrosPolivalencia}
            onAddCapacitacion={handleAddCapacitacion}
            onUpdateCapacitacion={handleUpdateCapacitacion}
            onAddEvaluacion={handleAddEvaluacion}
            onUpdatePolivalencia={handleUpdatePolivalencia}
            empresaFilter={empresaFilter}
          />
        )}

        {activeTab === 'nomina' && (
          <NominaModule
            employees={employees}
            novedades={novedades}
            capacitaciones={capacitaciones}
            evaluaciones={evaluaciones}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            onBulkImportEmployees={handleBulkImportEmployees}
            empresaFilter={empresaFilter}
            searchTermGlobal={searchTermGlobal}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-[#18181B] text-zinc-400 text-xs py-5 border-t border-zinc-800 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E30613]"></span>
            <span className="font-bold text-white">
              Talleres Metalúrgicos Crucianelli S.A. & FERTEC S.A.
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400 text-[11px]">Identidad Visual: Pantone 485 C / 186 C</span>
          </div>
          <span className="text-zinc-500 font-mono text-[11px]">
            Sistema Integral de Gestión de Personas v2.5 • Planta Armstrong (Santa Fe)
          </span>
        </div>
      </footer>
      {/* Birthday Modal */}
      <BirthdayModal
        isOpen={isBirthdayModalOpen}
        onClose={() => setIsBirthdayModalOpen(false)}
        todayBirthdays={todayBirthdays}
        upcomingBirthdays={upcomingBirthdays}
        empresaFilter={empresaFilter}
        onSelectEmployeeForNovedad={() => {
          setActiveTab('novedades');
        }}
      />
    </div>
  );
}
