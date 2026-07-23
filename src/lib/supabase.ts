import { createClient, type User } from '@supabase/supabase-js';
import type {
  Capacitacion,
  Empleado,
  EvaluacionDesempeno,
  MatrizPolivalenciaRegistro,
  Novedad,
  PerfilPuesto,
  SkillPolivalencia,
  UserProfile,
} from '../types';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const isSupabaseConfigured = Boolean(
  url &&
    publishableKey &&
    publishableKey !== 'YOUR_SUPABASE_PUBLISHABLE_KEY',
);

export const supabase = isSupabaseConfigured
  ? createClient(url!, publishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase no está configurado. Revisá las variables de entorno.');
  }
  return supabase;
}

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signUpAuthorized(
  email: string,
  password: string,
  activationCode: string,
): Promise<void> {
  const { error } = await requireClient().auth.signUp({
    email,
    password,
    options: {
      data: { activation_code: activationCode.trim().toUpperCase() },
    },
  });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function updatePassword(password: string): Promise<void> {
  const { error } = await requireClient().auth.updateUser({ password });
  if (error) throw error;
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const { data, error } = await requireClient()
    .from('profiles')
    .select('id,email,nombre,cargo,rol,empresa,iniciales')
    .eq('id', user.id)
    .single();

  if (error || !data) {
    throw new Error('Tu cuenta no tiene un perfil de RRHH autorizado.');
  }
  return data as UserProfile;
}

type DataItem = { id?: string; legajo?: string };

function subscribeTable<T extends DataItem>(
  table: string,
  onData: (items: T[]) => void,
): () => void {
  const client = requireClient();
  let active = true;

  const refresh = async () => {
    const { data, error } = await client.from(table).select('*');
    if (!active) return;
    if (error) throw error;
    onData((data ?? []) as T[]);
  };

  refresh().catch((error) => console.error(`Error leyendo ${table}:`, error));
  const channel = client
    .channel(`rrhh:${table}`)
    .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
      refresh().catch((error) => console.error(`Error actualizando ${table}:`, error));
    })
    .subscribe();

  return () => {
    active = false;
    client.removeChannel(channel);
  };
}

async function upsert(table: string, value: DataItem, conflict: string): Promise<void> {
  const { error } = await requireClient().from(table).upsert(value, { onConflict: conflict });
  if (error) throw error;
}

async function remove(table: string, field: string, value: string): Promise<void> {
  const { error } = await requireClient().from(table).delete().eq(field, value);
  if (error) throw error;
}

export const subscribeEmployees = (onData: (items: Empleado[]) => void) =>
  subscribeTable<Empleado>('employees', onData);
export const saveEmployeeToSupabase = (item: Empleado) =>
  upsert('employees', item, 'legajo');
export const deleteEmployeeFromSupabase = (legajo: string) =>
  remove('employees', 'legajo', legajo);
export async function bulkSaveEmployeesToSupabase(
  items: Empleado[],
  mode: 'replace' | 'append',
): Promise<void> {
  const client = requireClient();
  if (mode === 'replace') {
    const { error } = await client.from('employees').delete().neq('legajo', '___NONE___');
    if (error) throw error;
  }
  const { error } = await client.from('employees').upsert(items, { onConflict: 'legajo' });
  if (error) throw error;
}

export const subscribeNovedades = (onData: (items: Novedad[]) => void) =>
  subscribeTable<Novedad>('novedades', onData);
export const saveNovedadToSupabase = (item: Novedad) => upsert('novedades', item, 'id');
export const deleteNovedadFromSupabase = (id: string) =>
  remove('novedades', 'id', id);
export async function bulkReplaceNovedadesInSupabase(items: Novedad[]): Promise<void> {
  const client = requireClient();
  const { error: deleteError } = await client.from('novedades').delete().neq('id', '___NONE___');
  if (deleteError) throw deleteError;
  const { error } = await client.from('novedades').upsert(items, { onConflict: 'id' });
  if (error) throw error;
}

export const subscribeCapacitaciones = (onData: (items: Capacitacion[]) => void) =>
  subscribeTable<Capacitacion>('capacitaciones', onData);
export const saveCapacitacionToSupabase = (item: Capacitacion) =>
  upsert('capacitaciones', item, 'id');

export const subscribePerfiles = (onData: (items: PerfilPuesto[]) => void) =>
  subscribeTable<PerfilPuesto>('perfiles', onData);
export const savePerfilToSupabase = (item: PerfilPuesto) =>
  upsert('perfiles', item, 'id');

export const subscribeEvaluaciones = (
  onData: (items: EvaluacionDesempeno[]) => void,
) => subscribeTable<EvaluacionDesempeno>('evaluaciones', onData);
export const saveEvaluacionToSupabase = (item: EvaluacionDesempeno) =>
  upsert('evaluaciones', item, 'id');

export const subscribeSkills = (onData: (items: SkillPolivalencia[]) => void) =>
  subscribeTable<SkillPolivalencia>('skills', onData);
export const saveSkillToSupabase = (item: SkillPolivalencia) =>
  upsert('skills', item, 'id');

export const subscribeRegistrosPolivalencia = (
  onData: (items: MatrizPolivalenciaRegistro[]) => void,
) => subscribeTable<MatrizPolivalenciaRegistro>('registros_polivalencia', onData);
export const saveRegistroPolivalenciaToSupabase = (
  item: MatrizPolivalenciaRegistro,
) =>
  upsert(
    'registros_polivalencia',
    { ...item, id: `${item.legajo}_${item.skillId}` },
    'id',
  );
