import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Building2, Loader2, Lock, Mail, ShieldCheck } from 'lucide-react';
import { activatePrecreatedUser, isSupabaseConfigured, signIn } from '../lib/supabase';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [activationCode, setActivationCode] = useState('');
  const [isFirstAccess, setIsFirstAccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstAccess) {
        if (password.length < 12) {
          throw new Error('La contraseña debe tener al menos 12 caracteres.');
        }
        if (password !== confirmation) {
          throw new Error('Las contraseñas no coinciden.');
        }
        await activatePrecreatedUser(email.trim().toLowerCase(), password, activationCode);
      } else {
        await signIn(email.trim().toLowerCase(), password);
      }
    } catch (cause) {
      const message =
        cause instanceof Error && /invalid login credentials/i.test(cause.message)
          ? 'El correo o la contraseña no son correctos.'
          : cause instanceof Error
            ? cause.message
            : 'No se pudo iniciar sesión.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111113] text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-[#E30613] flex items-center justify-center shadow-xl">
            <Building2 className="w-8 h-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">CRUCIANELLI RRHH</h1>
          <p className="mt-2 text-sm text-zinc-400">Sistema Integral de Gestión de Personas</p>
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
          <div className="mb-6 flex items-start gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 className="font-bold">Ingreso seguro</h2>
              <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                {isFirstAccess
                  ? 'Usá el correo y la clave de activación que te entregó Recursos Humanos.'
                  : 'Usá la cuenta asignada por Recursos Humanos. La sesión se protege y sincroniza mediante Supabase.'}
              </p>
            </div>
          </div>

          {!isSupabaseConfigured && (
            <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-amber-800 bg-amber-950/40 p-3 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Falta configurar la conexión segura con Supabase en este entorno.</span>
            </div>
          )}

          {error && (
            <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-zinc-300">Correo electrónico</span>
              <span className="relative block">
                <Mail className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                <input
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nombre@empresa.com"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-900"
                />
              </span>
            </label>

            {isFirstAccess && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-300">Clave de activación</span>
                <input
                  type="text"
                  autoComplete="one-time-code"
                  required
                  value={activationCode}
                  onChange={(event) => setActivationCode(event.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 font-mono text-sm uppercase tracking-wider outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-900"
                />
              </label>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-zinc-300">Contraseña</span>
              <span className="relative block">
                <Lock className="absolute left-3 top-1/2 w-4 h-4 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                <input
                  type="password"
                  autoComplete={isFirstAccess ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-900"
                />
              </span>
            </label>

            {isFirstAccess && (
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-zinc-300">Repetir contraseña</span>
                <input
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={12}
                  value={confirmation}
                  onChange={(event) => setConfirmation(event.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none transition focus:border-[#E30613] focus:ring-2 focus:ring-red-900"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E30613] px-4 py-2.5 text-sm font-bold transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <ArrowRight className="w-4 h-4" aria-hidden="true" />}
              {loading ? 'Procesando…' : isFirstAccess ? 'Crear acceso seguro' : 'Ingresar'}
            </button>

            <button
              type="button"
              onClick={() => {
                setIsFirstAccess((value) => !value);
                setError('');
                setPassword('');
                setConfirmation('');
                setActivationCode('');
              }}
              className="w-full text-center text-xs font-semibold text-zinc-400 transition hover:text-white"
            >
              {isFirstAccess ? 'Ya tengo una cuenta' : 'Primera vez: activar mi cuenta'}
            </button>
          </form>
        </section>

        <p className="mt-5 text-center text-[11px] text-zinc-600">
          Acceso exclusivo para personal autorizado.
        </p>
      </div>
    </main>
  );
};
