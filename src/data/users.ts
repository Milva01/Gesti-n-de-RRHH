import { UserProfile } from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user_laura',
    email: 'laura@crucianelli.com',
    nombre: 'Laura Crucianelli',
    cargo: 'Directora de Gestión de Personas',
    rol: 'Gestión RRHH',
    empresa: 'Talleres Metalúrgicos Crucianelli',
    iniciales: 'LC',
    pin: '1001',
  },
  {
    id: 'user_mcarancini',
    email: 'mcarancini@crucianelli.com',
    nombre: 'Milva Carancini',
    cargo: 'Administradora General de Sistema / RRHH',
    rol: 'Administrador',
    empresa: 'Talleres Metalúrgicos Crucianelli',
    iniciales: 'MC',
    pin: '1002',
  },
  {
    id: 'user_mpirchio',
    email: 'mpirchio@crucianelli.com',
    nombre: 'M. Pirchio',
    cargo: 'Jefe de Gestión Humana y Desarrollo',
    rol: 'Jefatura de Sector',
    empresa: 'Talleres Metalúrgicos Crucianelli',
    iniciales: 'MP',
    pin: '1003',
  },
  {
    id: 'user_birro',
    email: 'birro@crucianelli.com',
    nombre: 'B. Irro',
    cargo: 'Coordinador de Capacitación y Talento',
    rol: 'Coordinador de Capacitación',
    empresa: 'Talleres Metalúrgicos Crucianelli',
    iniciales: 'BI',
    pin: '1004',
  },
  {
    id: 'user_mgalassi',
    email: 'mgalassi@crucianelli.com',
    nombre: 'M. Galassi',
    cargo: 'Analista Principal de Nómina y Novedades',
    rol: 'Analista de Nómina',
    empresa: 'FERTEC S.A.',
    iniciales: 'MG',
    pin: '1005',
  },
];

const USERS_LIST_STORAGE_KEY = 'crucianelli_user_profiles_list';

export function getStoredUserProfiles(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_LIST_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Fix legacy profile name if present
        return parsed.map((u) => {
          if (u.email.toLowerCase() === 'mcarancini@crucianelli.com' && u.nombre === 'Mariano Carancini') {
            return {
              ...u,
              nombre: 'Milva Carancini',
              cargo: 'Administradora General de Sistema / RRHH',
            };
          }
          return u;
        });
      }
    }
  } catch (err) {
    console.error('Error reading stored user profiles list:', err);
  }
  return INITIAL_USERS;
}

export function setStoredUserProfiles(users: UserProfile[]): void {
  try {
    localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));
  } catch (err) {
    console.error('Error saving stored user profiles list:', err);
  }
}

const USER_STORAGE_KEY = 'crucianelli_active_user';

export function getStoredUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      if (parsed && parsed.email) {
        if (parsed.email.toLowerCase() === 'mcarancini@crucianelli.com' && parsed.nombre === 'Mariano Carancini') {
          parsed.nombre = 'Milva Carancini';
          parsed.cargo = 'Administradora General de Sistema / RRHH';
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error('Error reading stored user:', err);
  }
  // Default to Milva Carancini (Admin) on new devices so any device can access immediately
  return INITIAL_USERS[1] || INITIAL_USERS[0];
}

export function setStoredUser(user: UserProfile | null): void {
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Error saving stored user:', err);
  }
}
