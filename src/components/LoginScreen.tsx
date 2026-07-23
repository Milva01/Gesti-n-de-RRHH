import React, { useState } from 'react';
import {
  UserCheck,
  Building2,
  Lock,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Mail,
  Users,
  Edit3,
  X,
  Save,
  Plus,
  RotateCcw,
  LogIn,
  Info,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { UserProfile, UserRole, Empresa } from '../types';
import { INITIAL_USERS, getStoredUserProfiles, setStoredUserProfiles } from '../data/users';

interface LoginScreenProps {
  onLogin: (user: UserProfile) => void;
}

const ROLES_OPTIONS: UserRole[] = [
  'Administrador',
  'Gestión RRHH',
  'Jefatura de Sector',
  'Analista de Nómina',
  'Coordinador de Capacitación',
];

const EMPRESAS_OPTIONS: Empresa[] = [
  'Talleres Metalúrgicos Crucianelli',
  'FERTEC S.A.',
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [usersList, setUsersList] = useState<UserProfile[]>(() => getStoredUserProfiles());
  const [credentialInput, setCredentialInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Editing state
  const [isEditingModalOpen, setIsEditingModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = credentialInput.trim().toLowerCase();

    if (!clean) {
      setErrorMsg('Por favor ingrese su PIN de 4 dígitos o correo institucional.');
      return;
    }

    // Match by PIN or by Email
    const matched = usersList.find(
      (u) => u.pin === clean || u.email.toLowerCase() === clean
    );

    if (matched) {
      onLogin(matched);
      return;
    }

    // Allow custom email if valid
    if (clean.includes('@')) {
      const namePart = clean.split('@')[0];
      const formattedName = namePart
        .split('.')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');

      const customUser: UserProfile = {
        id: `user_custom_${Date.now()}`,
        email: clean,
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
        pin: '1234',
      };

      onLogin(customUser);
      return;
    }

    setErrorMsg('Credencial o PIN no encontrado. Pruebe un PIN válido (ej: 1001, 1002, 1003, 1004, 1005) o seleccione directamente su usuario.');
  };

  const handleOpenEditUser = (user: UserProfile) => {
    setEditingUser({ ...user });
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    // Calculate initiales
    const calcInitials =
      editingUser.nombre
        .trim()
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'US';

    const updatedUser = { ...editingUser, iniciales: calcInitials };

    const existsIndex = usersList.findIndex((u) => u.id === updatedUser.id);
    let updatedList: UserProfile[];

    if (existsIndex >= 0) {
      updatedList = [...usersList];
      updatedList[existsIndex] = updatedUser;
    } else {
      updatedList = [...usersList, updatedUser];
    }

    setUsersList(updatedList);
    setStoredUserProfiles(updatedList);
    setEditingUser(null);
  };

  const handleAddNewUser = () => {
    const newPin = (1000 + usersList.length + 1).toString();
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      email: 'nuevo.usuario@crucianelli.com',
      nombre: 'Nuevo Usuario',
      cargo: 'Analista de Gestión',
      rol: 'Gestión RRHH',
      empresa: 'Talleres Metalúrgicos Crucianelli',
      iniciales: 'NU',
      pin: newPin,
    };
    setEditingUser(newUser);
  };

  const handleDeleteUser = (id: string) => {
    if (usersList.length <= 1) {
      alert('Debe conservar al menos un perfil de usuario.');
      return;
    }
    const updated = usersList.filter((u) => u.id !== id);
    setUsersList(updated);
    setStoredUserProfiles(updated);
    if (editingUser?.id === id) setEditingUser(null);
  };

  const handleResetUsers = () => {
    if (confirm('¿Desea restablecer los 5 perfiles predeterminados originales?')) {
      setUsersList(INITIAL_USERS);
      setStoredUserProfiles(INITIAL_USERS);
      setEditingUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-red-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header branding */}
      <header className="p-6 sm:px-12 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-md relative z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-red-500/30">
            C
          </div>
          <div>
            <span className="font-black text-lg tracking-wider text-white block leading-tight">
              CRUCIANELLI
            </span>
            <span className="text-[10px] text-slate-400 font-mono tracking-widest uppercase block">
              Gestión de Personas & Nómina
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center space-x-2 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-full border border-slate-700/50">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Ingreso Seguro por Roles y Perfiles</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 relative z-10 max-w-5xl mx-auto w-full">
        
        {/* Informative Header Banner */}
        <div className="w-full mb-6 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl flex items-start space-x-3.5">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="text-xs text-slate-300 leading-relaxed">
            <span className="font-bold text-white text-sm block mb-1">
              Portal Institucional de Acceso Crucianelli
            </span>
            Para ingresar a la plataforma, puede hacer <strong className="text-amber-300 font-semibold">1-Clic directo</strong> sobre su perfil a la derecha o ingresar su <strong className="text-white font-semibold">PIN de 4 dígitos</strong> o correo electrónico. Una vez dentro, podrá cambiar de perfil en cualquier momento desde el menú superior.
          </div>
        </div>

        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Column: Form Input with PIN / Email */}
          <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl flex flex-col justify-between backdrop-blur-sm">
            <div>
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold mb-4">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Autenticación por PIN o Correo</span>
              </div>

              <h1 className="text-2xl font-extrabold text-white tracking-tight">
                Ingresar al Sistema
              </h1>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Ingrese su PIN de 4 dígitos asignado o su casilla de correo institucional:
              </p>

              <form onSubmit={handleCustomLogin} className="mt-6 space-y-4">
                <div>
                  <label htmlFor="user-pin-input" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                    PIN Corporativo o Correo
                  </label>
                  <div className="relative">
                    <Lock className="w-5 h-5 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="user-pin-input"
                      type="text"
                      value={credentialInput}
                      onChange={(e) => {
                        setCredentialInput(e.target.value);
                        setErrorMsg('');
                      }}
                      placeholder="Ej: 1001 o laura@crucianelli.com"
                      className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-red-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all font-medium"
                      required
                    />
                  </div>
                  {errorMsg && (
                    <div className="flex items-start space-x-1.5 text-xs text-rose-400 mt-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-red-950/50 hover:shadow-red-900/60 transition-all flex items-center justify-center space-x-2 group cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Ingresar con PIN o Correo</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const defaultUser = usersList.find((u) => u.email.toLowerCase().includes('mcarancini')) || usersList[0];
                    if (defaultUser) onLogin(defaultUser);
                  }}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 font-bold text-xs rounded-xl border border-amber-500/30 transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Acceso Inmediato como Administrador (1-Clic)</span>
                </button>
              </form>

              {/* Quick PIN reference helper */}
              <div className="mt-6 p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  PINs de Acceso Rápido:
                </span>
                <div className="grid grid-cols-1 gap-1 text-[11px] font-mono text-slate-300">
                  {usersList.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center justify-between py-0.5">
                      <span className="truncate pr-2 text-slate-400">{u.nombre}</span>
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400 font-bold border border-slate-700">
                        PIN: {u.pin || '1001'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center space-x-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Talleres Metalúrgicos Crucianelli</span>
              </span>
              <span className="font-mono text-[11px] text-slate-600">v2.5.0</span>
            </div>
          </div>

          {/* Right Column: 1-Click User Cards Selector */}
          <div className="lg:col-span-7 bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-amber-400" />
                  <span>Ingreso en 1-Clic por Perfil</span>
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(true)}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 rounded text-xs font-semibold border border-slate-700 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Perfiles / Roles</span>
                  </button>
                </div>
              </div>
              <p className="text-xs text-slate-400 mb-4">
                Haga clic directamente sobre el botón <strong className="text-white">"Ingresar"</strong> de cualquier usuario para acceder de inmediato:
              </p>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {usersList.map((user) => (
                  <div
                    key={user.id}
                    className="w-full p-3.5 rounded-xl border bg-slate-950/60 hover:bg-slate-900/90 border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group shadow-sm"
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-md border border-red-500/30">
                        {user.iniciales}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-white flex items-center gap-2 truncate">
                          <span className="truncate">{user.nombre}</span>
                          <span className="px-1.5 py-0.2 bg-slate-800 text-amber-300 font-mono text-[10px] rounded border border-slate-700 shrink-0">
                            {user.rol}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {user.email} • <span className="text-slate-500">{user.cargo}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onLogin(user)}
                        className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-lg text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                      >
                        <span>Ingresar</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleOpenEditUser(user);
                          setIsEditingModalOpen(true);
                        }}
                        title="Editar nombre o rol"
                        className="p-2 text-slate-400 hover:text-amber-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Perfiles configurados para Crucianelli y FERTEC</span>
              <button
                type="button"
                onClick={handleResetUsers}
                className="text-slate-500 hover:text-slate-300 flex items-center gap-1 font-mono text-[10px]"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restablecer</span>
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Modal for Editing Users and Roles */}
      {isEditingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-in">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Administración de Usuarios, Roles y PINs</h3>
                  <p className="text-xs text-slate-400">Edite los nombres, correos, cargos, roles y PINs de acceso</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditingModalOpen(false);
                  setEditingUser(null);
                }}
                className="p-1.5 text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1">
              {editingUser ? (
                /* Edit Form for Selected User */
                <form onSubmit={handleSaveUser} className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4" />
                      {editingUser.id.startsWith('user_custom_') || editingUser.id.startsWith('user_1') ? 'Nuevo Perfil' : 'Editar Perfil'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        value={editingUser.nombre}
                        onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Cargo / Puesto</label>
                      <input
                        type="text"
                        value={editingUser.cargo}
                        onChange={(e) => setEditingUser({ ...editingUser, cargo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">PIN de Acceso (4 dígitos)</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={editingUser.pin || '1001'}
                        onChange={(e) => setEditingUser({ ...editingUser, pin: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500 font-mono font-bold text-amber-400"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Rol de Usuario</label>
                      <select
                        value={editingUser.rol}
                        onChange={(e) => setEditingUser({ ...editingUser, rol: e.target.value as UserRole })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        {ROLES_OPTIONS.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Empresa Principal</label>
                      <select
                        value={editingUser.empresa}
                        onChange={(e) => setEditingUser({ ...editingUser, empresa: e.target.value as Empresa })}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-red-500"
                      >
                        {EMPRESAS_OPTIONS.map((emp) => (
                          <option key={emp} value={emp}>
                            {emp}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingUser(null)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Cambios</span>
                    </button>
                  </div>
                </form>
              ) : (
                /* List of All Users with Edit / Delete Actions */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Lista de Usuarios Registrados ({usersList.length})
                    </span>
                    <button
                      onClick={handleAddNewUser}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar Usuario</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 bg-slate-950/60 border border-slate-800 rounded-xl overflow-hidden">
                    {usersList.map((u) => (
                      <div key={u.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-900/80 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-800 text-slate-200 font-black rounded-lg flex items-center justify-center text-xs border border-slate-700">
                            {u.iniciales}
                          </div>
                          <div>
                            <div className="font-bold text-white text-sm flex items-center gap-2">
                              <span>{u.nombre}</span>
                              <span className="px-1.5 py-0.2 bg-slate-800 text-amber-300 font-mono text-[10px] rounded border border-slate-700">
                                {u.rol}
                              </span>
                              <span className="px-1.5 py-0.2 bg-slate-900 text-slate-400 font-mono text-[10px] rounded">
                                PIN: {u.pin || '1001'}
                              </span>
                            </div>
                            <div className="text-slate-400 text-[11px] font-mono">
                              {u.email} • <span className="text-slate-500">{u.cargo}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleOpenEditUser(u)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-300 rounded text-xs font-semibold flex items-center space-x-1 border border-slate-700"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="px-2 py-1 bg-slate-900 hover:bg-rose-900/60 text-slate-500 hover:text-rose-300 rounded text-xs transition-colors border border-slate-800"
                            title="Eliminar usuario"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs">
              <button
                onClick={handleResetUsers}
                className="text-slate-500 hover:text-amber-400 flex items-center space-x-1 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restablecer perfiles por defecto</span>
              </button>

              <button
                onClick={() => {
                  setIsEditingModalOpen(false);
                  setEditingUser(null);
                }}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Footer */}
      <footer className="p-4 text-center text-xs text-slate-600 border-t border-slate-900 bg-slate-950">
        © 2026 Crucianelli S.A. - Todos los derechos reservados. Sistema de Nómina y Desarrollo Organizacional.
      </footer>
    </div>
  );
};

