import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Loader2, ShieldCheck } from 'lucide-react';
import { updatePassword } from '../lib/supabase';

interface SetPasswordScreenProps {
  email: string;
  onComplete: () => void;
}

export const SetPasswordScreen: React.FC<SetPasswordScreenProps> = ({ email, onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (password.length < 12) {
      setError('La contraseña debe tener al menos 12 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(password);
      onComplete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111113] text-white flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-[#E30613] flex items-center justify-center">
            <KeyRound className="w-6 h-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-extrabold">Crear contraseña</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Activá tu acceso a Gestión de RRHH.
          </p>
        </div>

        <div className="mb-5 flex gap-3 rounded-lg border border-emerald-900 bg-emerald-950/30 p-3 text-xs text-emerald-200">
          <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            Cuenta autorizada: <strong>{email}</strong>
          </span>
        </div>

        {error && (
          <div role="alert" className="mb-4 flex gap-2 rounded-lg border border-rose-800 bg-rose-950/40 p-3 text-xs text-rose-200">
            <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-300">Nueva contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-[#E30613]"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-zinc-300">Repetir contraseña</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2.5 text-sm outline-none focus:border-[#E30613]"
            />
          </label>

          <p className="text-[11px] leading-relaxed text-zinc-500">
            Usá 12 caracteres o más y evitá nombres, fechas o contraseñas utilizadas en otros sistemas.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E30613] px-4 py-2.5 text-sm font-bold transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
            {loading ? 'Guardando…' : 'Guardar contraseña e ingresar'}
          </button>
        </form>
      </section>
    </main>
  );
};
