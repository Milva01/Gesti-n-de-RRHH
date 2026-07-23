import React, { useState } from 'react';
import {
  Cake,
  Gift,
  Sparkles,
  PartyPopper,
  X,
  Copy,
  Check,
  Plus,
  Calendar,
  Building2,
  Users,
} from 'lucide-react';
import { Empleado, Empresa } from '../types';
import { BirthdayInfo, MONTH_NAMES_ES } from '../utils/birthdays';

interface BirthdayModalProps {
  isOpen: boolean;
  onClose: () => void;
  todayBirthdays: BirthdayInfo[];
  upcomingBirthdays: BirthdayInfo[];
  empresaFilter: 'Todas' | Empresa;
  onSelectEmployeeForNovedad?: (employee: Empleado) => void;
}

export const BirthdayModal: React.FC<BirthdayModalProps> = ({
  isOpen,
  onClose,
  todayBirthdays,
  upcomingBirthdays,
  empresaFilter,
  onSelectEmployeeForNovedad,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming'>('today');

  if (!isOpen) return null;

  // Apply empresa filter
  const filterByEmpresa = (list: BirthdayInfo[]) => {
    if (empresaFilter === 'Todas') return list;
    return list.filter((b) => b.employee.empresa === empresaFilter);
  };

  const filteredToday = filterByEmpresa(todayBirthdays);
  const filteredUpcoming = filterByEmpresa(upcomingBirthdays);

  const handleCopyGreeting = (employee: Empleado) => {
    const text = `🎉 ¡Feliz cumpleaños, ${employee.colaborador}! 🎂 De parte de todo el equipo de ${employee.empresa}, te deseamos un excelente día. ¡Un gran abrazo! 🎈`;
    
    navigator.clipboard.writeText(text);
    setCopiedId(employee.legajo);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-in">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white p-5 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-rose-600/30 border border-rose-500/40 rounded-xl text-rose-300">
                <Cake className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                  <span>Cumpleaños del Personal</span>
                  <Sparkles className="w-4 h-4 text-amber-400 animate-bounce" />
                </h2>
                <p className="text-xs text-rose-200/80">
                  Notificaciones y agenda de aniversarios de nacimiento
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector inside header */}
          <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-white/10">
            <button
              onClick={() => setActiveTab('today')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'today'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <PartyPopper className="w-3.5 h-3.5 text-amber-300" />
              <span>Hoy ({filteredToday.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upcoming'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Próximos 30 Días ({filteredUpcoming.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'today' && (
            <div>
              {filteredToday.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
                  <Cake className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay cumpleaños registrados para hoy</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Puedes revisar la pestaña de "Próximos 30 Días" para anticipar los festejos.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Festejan su cumpleaños hoy
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {filteredToday.map((b) => (
                      <div
                        key={b.employee.legajo}
                        className="bg-gradient-to-r from-rose-50/80 via-amber-50/40 to-white p-4 rounded-xl border border-rose-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="p-3 bg-rose-500 text-white rounded-xl shadow-xs font-bold flex flex-col items-center justify-center min-w-[50px]">
                            <Cake className="w-5 h-5 mb-0.5" />
                            <span className="text-[10px] uppercase font-mono tracking-wider">Hoy</span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-slate-900 text-base">
                                {b.employee.colaborador}
                              </h3>
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 font-mono font-bold text-[10px] rounded-full border border-rose-200">
                                Leg. {b.employee.legajo}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-600">
                              <span className="flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {b.employee.empresa}
                              </span>
                              <span className="bg-white px-2 py-0.5 rounded border border-slate-200">
                                {b.employee.sector}
                              </span>
                              <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold text-[11px] border border-amber-200">
                                ¡Cumpleaños! 🎈
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-rose-100">
                          <button
                            onClick={() => handleCopyGreeting(b.employee)}
                            title="Copiar saludo para enviar"
                            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-rose-50 text-rose-700 rounded-lg text-xs font-semibold border border-rose-200 transition-colors shadow-2xs"
                          >
                            {copiedId === b.employee.legajo ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700 font-bold">¡Copiado!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copiar Saludo</span>
                              </>
                            )}
                          </button>

                          {onSelectEmployeeForNovedad && (
                            <button
                              onClick={() => {
                                onSelectEmployeeForNovedad(b.employee);
                                onClose();
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Cargar Novedad</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'upcoming' && (
            <div>
              {filteredUpcoming.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200 p-6">
                  <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-700">No hay próximos cumpleaños en los próximos 30 días</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Cumpleaños en los próximos 30 días
                  </span>

                  <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden">
                    {filteredUpcoming.map((b) => (
                      <div
                        key={b.employee.legajo}
                        className="p-3.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-slate-100 text-slate-700 font-bold rounded-lg text-center min-w-[55px] font-mono border border-slate-200">
                            <div className="text-[10px] uppercase text-slate-500 leading-none mb-0.5">
                              {MONTH_NAMES_ES[b.month - 1]?.substring(0, 3)}
                            </div>
                            <div className="text-sm leading-none font-black text-slate-900">
                              {b.day}
                            </div>
                          </div>

                          <div>
                            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                              <span>{b.employee.colaborador}</span>
                              <span className="font-mono text-[11px] text-slate-400 font-normal">
                                Leg. {b.employee.legajo}
                              </span>
                            </div>
                            <div className="text-slate-500 flex items-center gap-2 mt-0.5">
                              <span>{b.employee.empresa}</span>
                              <span>•</span>
                              <span>{b.employee.sector}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-mono font-semibold rounded-md border border-amber-200 text-[11px]">
                            en {b.daysUntil} día{b.daysUntil > 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <Gift className="w-4 h-4 text-rose-500" />
            <span>Datos sincronizados desde la Nómina de Personal</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-bold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
