import React from 'react';
import {
  FileText,
  BarChart3,
  GraduationCap,
  Users,
  Building2,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  Cake,
  PartyPopper,
  LogOut,
  User,
  Shield,
  Share2,
  Check,
  Copy,
} from 'lucide-react';
import { Empresa, UserProfile } from '../types';
import { getPublicBaseUrl } from '../utils/url';

interface NavbarProps {
  activeTab: 'novedades' | 'indicadores' | 'desarrollo' | 'nomina';
  setActiveTab: (tab: 'novedades' | 'indicadores' | 'desarrollo' | 'nomina') => void;
  empresaFilter: 'Todas' | Empresa;
  setEmpresaFilter: (empresa: 'Todas' | Empresa) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  pendingCount: number;
  totalActivos: number;
  todayBirthdaysCount?: number;
  onOpenBirthdayModal?: () => void;
  currentUser?: UserProfile | null;
  allUsers?: UserProfile[];
  onSelectUser?: (user: UserProfile) => void;
  onLogout?: () => void;
  onResetData?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  empresaFilter,
  setEmpresaFilter,
  searchTerm,
  setSearchTerm,
  pendingCount,
  totalActivos,
  todayBirthdaysCount = 0,
  onOpenBirthdayModal,
  currentUser,
  allUsers = [],
  onSelectUser,
  onLogout,
  onResetData,
}) => {
  const [copiedNavbarLink, setCopiedNavbarLink] = React.useState(false);

  const handleCopyAppLink = () => {
    const link = `${getPublicBaseUrl()}/`;
    navigator.clipboard.writeText(link);
    setCopiedNavbarLink(true);
    setTimeout(() => setCopiedNavbarLink(false), 3000);
  };

  return (
    <header id="header-navbar" className="bg-[#18181B] text-white shadow-xl sticky top-0 z-50 border-b border-zinc-800">
      {/* Top Brand & Communications Bar */}
      <div className="bg-[#111113] border-b border-zinc-800/80 px-4 sm:px-6 lg:px-8 py-1 text-[11px] text-zinc-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-3">
          <span className="inline-flex items-center space-x-1.5 font-bold text-white">
            <span className="w-2 h-2 rounded-full bg-[#E30613]"></span>
            <span>CRUCIANELLI S.A.</span>
          </span>
        </div>
        <div className="flex items-center space-x-2 text-zinc-400 font-mono text-[10px]">
          <span>Planta Industrial Armstrong, Sta. Fe</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Brand Logo & Title */}
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-[#E30613] rounded-xl shadow-lg border border-red-500/30 flex items-center justify-center text-white">
            {/* Custom SVG Crucianelli Mark */}
            <svg className="w-8 h-8 fill-current" viewBox="0 0 100 100">
              {/* Chevron chevron icon characteristic of Crucianelli */}
              <path d="M 15,20 L 55,20 L 85,50 L 55,80 L 15,80 L 45,50 Z" fill="#FFFFFF" />
              <path d="M 40,20 L 70,20 L 90,50 L 70,80 L 40,80 L 60,50 Z" fill="#E30613" opacity="0.9" />
            </svg>
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-sans uppercase">
                CRUCIANELLI <span className="text-[#E30613] font-normal">RRHH</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-red-950/60 text-red-300 border border-red-800/50 rounded-md">
                TMC & FERTEC
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Sistema Integral de Gestión de Personas • Talleres Metalúrgicos Crucianelli
            </p>
          </div>
        </div>

        {/* Global Controls: Search, Empresa Selector & Quick Stats */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar colaborador, legajo o DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-900 text-sm text-zinc-200 placeholder-zinc-500 rounded-lg border border-zinc-700 focus:outline-none focus:border-[#E30613] transition-colors"
            />
          </div>

          {/* Empresa Selector */}
          <div className="flex items-center bg-zinc-900 rounded-lg p-1 border border-zinc-700 text-xs font-semibold">
            <button
              onClick={() => setEmpresaFilter('Todas')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                empresaFilter === 'Todas' ? 'bg-[#E30613] text-white shadow-xs font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setEmpresaFilter('Talleres Metalúrgicos Crucianelli')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                empresaFilter === 'Talleres Metalúrgicos Crucianelli'
                  ? 'bg-[#E30613] text-white shadow-xs font-bold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Crucianelli
            </button>
            <button
              onClick={() => setEmpresaFilter('FERTEC S.A.')}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                empresaFilter === 'FERTEC S.A.' ? 'bg-[#E30613] text-white shadow-xs font-bold' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              FERTEC
            </button>
          </div>

          {/* Quick Stats Pills */}
          <div className="hidden lg:flex items-center space-x-2">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{totalActivos} Activos</span>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{pendingCount} Pendientes</span>
              </div>
            )}
          </div>

          {/* Birthday Notification Button */}
          {onOpenBirthdayModal && (
            <button
              onClick={onOpenBirthdayModal}
              title="Notificaciones de Cumpleaños"
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                todayBirthdaysCount > 0
                  ? 'bg-rose-600/90 hover:bg-rose-600 text-white border-rose-500 shadow-md animate-pulse'
                  : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-700'
              }`}
            >
              <Cake className={`w-4 h-4 ${todayBirthdaysCount > 0 ? 'text-amber-300' : 'text-rose-400'}`} />
              <span>Cumpleaños</span>
              {todayBirthdaysCount > 0 ? (
                <span className="px-1.5 py-0.2 bg-amber-400 text-zinc-950 font-black rounded-full text-[10px]">
                  {todayBirthdaysCount} HOY
                </span>
              ) : (
                <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
              )}
            </button>
          )}

          {/* Share App Link Button */}
          <button
            onClick={handleCopyAppLink}
            title="Copiar enlace público de la app para compartir con otras usuarias o dispositivos"
            className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-amber-300 hover:text-amber-200 rounded-lg border border-zinc-700/80 text-xs font-semibold transition-colors"
          >
            {copiedNavbarLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold text-[11px]">¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline text-[11px]">Compartir App</span>
              </>
            )}
          </button>

          {/* User Profile Badge & Quick Switcher */}
          {currentUser && (
            <div className="flex items-center space-x-2 bg-zinc-900/90 border border-zinc-700/80 rounded-lg p-1 pl-2">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded bg-[#E30613] text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                  {currentUser.iniciales}
                </div>
                
                {/* User Dropdown Selector for 1-Click Identity Switching */}
                {allUsers.length > 0 && onSelectUser ? (
                  <select
                    value={currentUser.id}
                    onChange={(e) => {
                      const found = allUsers.find((u) => u.id === e.target.value);
                      if (found) onSelectUser(found);
                    }}
                    className="bg-zinc-800 text-white font-bold text-xs py-1 px-1.5 rounded border border-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-500 cursor-pointer max-w-[180px] truncate"
                    title="Cambiar rápidamente de usuario activo"
                  >
                    {allUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.nombre} ({u.rol})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="hidden lg:block text-left pr-1">
                    <div className="flex items-center gap-1.5 leading-tight">
                      <span className="text-xs font-bold text-white">
                        {currentUser.nombre}
                      </span>
                      <span className="px-1.5 py-0.2 bg-zinc-800 text-amber-300 font-mono text-[9px] rounded border border-zinc-700">
                        {currentUser.rol}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {onLogout && (
                <button
                  onClick={onLogout}
                  title="Cerrar sesión e ir a la pantalla de ingreso"
                  className="flex items-center space-x-1 px-2 py-1 bg-zinc-800 hover:bg-rose-900/80 text-zinc-300 hover:text-white rounded text-[11px] font-semibold transition-colors border border-zinc-700"
                >
                  <LogOut className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Salir</span>
                </button>
              )}
            </div>
          )}

          {onResetData && (
            <button
              onClick={onResetData}
              title="Restablecer datos por defecto"
              className="p-1.5 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-lg border border-zinc-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-[#111113] border-t border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-3 overflow-x-auto py-2 no-scrollbar" aria-label="Tabs">
            <button
              id="tab-novedades"
              onClick={() => setActiveTab('novedades')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'novedades'
                  ? 'bg-[#E30613] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Novedades del Personal</span>
              {pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-amber-400 text-zinc-950 font-black rounded-full">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="tab-indicadores"
              onClick={() => setActiveTab('indicadores')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'indicadores'
                  ? 'bg-[#E30613] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Indicadores de Gestión</span>
            </button>

            <button
              id="tab-desarrollo"
              onClick={() => setActiveTab('desarrollo')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'desarrollo'
                  ? 'bg-[#E30613] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Desarrollo del Talento</span>
            </button>

            <button
              id="tab-nomina"
              onClick={() => setActiveTab('nomina')}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'nomina'
                  ? 'bg-[#E30613] text-white shadow-md'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Nómina de Personal</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
