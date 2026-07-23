/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  getStoredEmployees,
  saveEmployees,
  getStoredNovedades,
  saveNovedades,
  getStoredCapacitaciones,
  saveCapacitaciones,
  getStoredPerfiles,
  savePerfiles,
  getStoredEvaluaciones,
  saveEvaluaciones,
  getStoredSkills,
  saveSkills,
  getStoredRegistrosPolivalencia,
  saveRegistrosPolivalencia,
  resetAllDataToDefault,
} from './utils/storage';
import {
  subscribeEmployees,
  saveEmployeeToFirestore,
  deleteEmployeeFromFirestore,
  bulkSaveEmployeesToFirestore,
  subscribeNovedades,
  saveNovedadToFirestore,
  deleteNovedadFromFirestore,
  bulkReplaceNovedadesInFirestore,
  subscribeCapacitaciones,
  saveCapacitacionToFirestore,
  subscribePerfiles,
  savePerfilToFirestore,
  subscribeEvaluaciones,
  saveEvaluacionToFirestore,
  subscribeSkills,
  saveSkillToFirestore,
  subscribeRegistrosPolivalencia,
  saveRegistroPolivalenciaToFirestore,
} from './lib/firebase';
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

import { getStoredUser, setStoredUser, getStoredUserProfiles } from './data/users';
import { BirthdayModal } from './components/BirthdayModal';
import { getTodayBirthdays, getUpcomingBirthdays } from './utils/birthdays';
import { Cake, Sparkles, X, ChevronRight } from 'lucide-react';

export default function App() {
  // Auth User State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => getStoredUser());

  // Check URL query search param OR hash fragment for automatic login from direct links (e.g., #user=laura@crucianelli.com)
  useEffect(() => {
    try {
      let emailParam: string | null = null;

      // 1. Check Search Query Parameters (?user=...)
      if (window.location.search) {
        const params = new URLSearchParams(window.location.search);
        emailParam = params.get('user') || params.get('email') || params.get('login');
      }

      // 2. Check Hash Fragment (#user=... or #laura@crucianelli.com)
      if (!emailParam && window.location.hash) {
        const rawHash = window.location.hash.substring(1); // remove '#'
        if (rawHash.includes('=')) {
          const hashParams = new URLSearchParams(rawHash);
          emailParam = hashParams.get('user') || hashParams.get('email') || hashParams.get('login');
        } else if (rawHash.includes('@')) {
          emailParam = rawHash;
        }
      }

      if (emailParam) {
        const cleanEmail = decodeURIComponent(emailParam).trim().toLowerCase();
        const profiles = getStoredUserProfiles();
        const found = profiles.find((p) => p.email.toLowerCase() === cleanEmail);
        if (found) {
          setCurrentUser(found);
          setStoredUser(found);
        } else if (cleanEmail.includes('@')) {
          const namePart = cleanEmail.split('@')[0];
          const formattedName = namePart
            .split('.')
            .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
            .join(' ');
          const newUser: UserProfile = {
            id: `user_url_${Date.now()}`,
            email: cleanEmail,
            nombre: formattedName || 'Usuario Crucianelli',
            cargo: 'Gestor Autorizado',
            rol: 'Gestión RRHH',
            empresa: 'Talleres Metalúrgicos Crucianelli',
            iniciales: (formattedName || 'UC')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2),
          };
          setCurrentUser(newUser);
          setStoredUser(newUser);
        }
      }
    } catch (err) {
      console.error('Error parsing URL login parameter:', err);
    }
  }, []);

  // Main Data States
  const [employees, setEmployees] = useState<Empleado[]>(() => getStoredEmployees());

  const [novedades, setNovedades] = useState<Novedad[]>(() => getStoredNovedades());
  const [capacitaciones, setCapacitaciones] = useState<Capacitacion[]>(() => getStoredCapacitaciones());
  const [perfiles, setPerfiles] = useState<PerfilPuesto[]>(() => getStoredPerfiles());
  const [evaluaciones, setEvaluaciones] = useState<EvaluacionDesempeno[]>(() => getStoredEvaluaciones());
  const [skills, setSkills] = useState<SkillPolivalencia[]>(() => getStoredSkills());
  const [registrosPolivalencia, setRegistrosPolivalencia] = useState<MatrizPolivalenciaRegistro[]>(() => getStoredRegistrosPolivalencia());

  // Global Navigation & Filtering States
  const [activeTab, setActiveTab] = useState<'novedades' | 'indicadores' | 'desarrollo' | 'nomina'>('novedades');
  const [empresaFilter, setEmpresaFilter] = useState<'Todas' | Empresa>('Todas');
  const [searchTermGlobal, setSearchTermGlobal] = useState<string>('');

  // Firestore Realtime Subscriptions
  useEffect(() => {
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
  }, []);

  // Persist State Changes Local Backup
  useEffect(() => {
    saveEmployees(employees);
  }, [employees]);

  useEffect(() => {
    saveNovedades(novedades);
  }, [novedades]);

  useEffect(() => {
    saveCapacitaciones(capacitaciones);
  }, [capacitaciones]);

  useEffect(() => {
    savePerfiles(perfiles);
  }, [perfiles]);

  useEffect(() => {
    saveEvaluaciones(evaluaciones);
  }, [evaluaciones]);

  useEffect(() => {
    saveSkills(skills);
  }, [skills]);

  useEffect(() => {
    saveRegistrosPolivalencia(registrosPolivalencia);
  }, [registrosPolivalencia]);

  // Handlers for Novedades
  const handleAddNovedad = (newNov: Novedad) => {
    setNovedades((prev) => [newNov, ...prev]);
    saveNovedadToFirestore(newNov).catch((err) => console.error('Error saving novedad to Firestore:', err));
  };

  const handleUpdateEstadoNovedad = (id: string, nuevoEstado: EstadoAprobacion) => {
    const updated = novedades.find((n) => n.id === id);
    if (updated) {
      const novWithNewStatus = { ...updated, estadoAprobacion: nuevoEstado };
      setNovedades((prev) =>
        prev.map((n) => (n.id === id ? novWithNewStatus : n))
      );
      saveNovedadToFirestore(novWithNewStatus).catch((err) => console.error('Error updating status in Firestore:', err));
    }
  };

  const handleDeleteNovedad = (id: string) => {
    setNovedades((prev) => prev.filter((n) => n.id !== id));
    deleteNovedadFromFirestore(id).catch((err) => console.error('Error deleting novedad from Firestore:', err));
  };

  const handleBulkImportNovedades = (items: Novedad[]) => {
    const combined = [...items, ...novedades];
    setNovedades(combined);
    bulkReplaceNovedadesInFirestore(combined).catch((err) => console.error('Error bulk importing novedades:', err));
  };

  // Handlers for Capacitaciones & Talent
  const handleAddCapacitacion = (newCap: Capacitacion) => {
    setCapacitaciones((prev) => [newCap, ...prev]);
    saveCapacitacionToFirestore(newCap).catch((err) => console.error('Error saving capacitacion:', err));
  };

  const handleUpdateCapacitacion = (updatedCap: Capacitacion) => {
    setCapacitaciones((prev) => prev.map((c) => (c.id === updatedCap.id ? updatedCap : c)));
    saveCapacitacionToFirestore(updatedCap).catch((err) => console.error('Error updating capacitacion:', err));
  };

  const handleAddEvaluacion = (newEval: EvaluacionDesempeno) => {
    setEvaluaciones((prev) => [newEval, ...prev]);
    saveEvaluacionToFirestore(newEval).catch((err) => console.error('Error saving evaluacion:', err));
  };

  const handleUpdatePolivalencia = (legajo: string, skillId: string, nivel: NivelPolivalencia) => {
    setRegistrosPolivalencia((prev) => {
      const idx = prev.findIndex((r) => r.legajo === legajo && r.skillId === skillId);
      const reg = { legajo, skillId, nivel };
      saveRegistroPolivalenciaToFirestore(reg as any).catch((err) => console.error('Error saving polivalencia:', err));
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
    saveEmployeeToFirestore(emp).catch((err) => console.error('Error saving employee:', err));
  };

  const handleUpdateEmployee = (emp: Empleado) => {
    setEmployees((prev) => prev.map((e) => (e.legajo === emp.legajo ? emp : e)));
    saveEmployeeToFirestore(emp).catch((err) => console.error('Error updating employee:', err));
  };

  const handleDeleteEmployee = (legajo: string) => {
    setEmployees((prev) => prev.filter((e) => e.legajo !== legajo));
    deleteEmployeeFromFirestore(legajo).catch((err) => console.error('Error deleting employee:', err));
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
    bulkSaveEmployeesToFirestore(importedList, mode).catch((err) => console.error('Error bulk saving employees:', err));
  };

  // Reset to default seed
  const handleResetData = () => {
    if (confirm('¿Desea restablecer todos los datos a la nómina inicial original?')) {
      resetAllDataToDefault();
      window.location.reload();
    }
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

  const userProfiles = useMemo(() => getStoredUserProfiles(), [currentUser]);

  // Login Gate: Must log in before managing the app
  if (!currentUser) {
    return (
      <LoginScreen
        onLogin={(user) => {
          setStoredUser(user);
          setCurrentUser(user);
        }}
      />
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
        allUsers={userProfiles}
        onSelectUser={(user) => {
          setStoredUser(user);
          setCurrentUser(user);
        }}
        onLogout={() => {
          setStoredUser(null);
          setCurrentUser(null);
        }}
        onResetData={handleResetData}
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
