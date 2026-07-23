import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import {
  initializeFirestore,
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  Empleado,
  Novedad,
  Capacitacion,
  PerfilPuesto,
  EvaluacionDesempeno,
  SkillPolivalencia,
  MatrizPolivalenciaRegistro,
} from '../types';
import {
  INITIAL_EMPLOYEES,
  INITIAL_NOVEDADES,
  INITIAL_CAPACITACIONES,
  INITIAL_PERFILES_PUESTO,
  INITIAL_EVALUACIONES,
  INITIAL_SKILLS_POLIVALENCIA,
  INITIAL_REGISTROS_POLIVALENCIA,
} from '../data/initialData';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use named database if specified in config, with auto detect long polling for firewalls/proxies
const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)'
  ? firebaseConfig.firestoreDatabaseId
  : undefined;

export const db = dbId
  ? initializeFirestore(app, { experimentalAutoDetectLongPolling: true }, dbId)
  : initializeFirestore(app, { experimentalAutoDetectLongPolling: true });

// Ensure anonymous authentication if enabled, or proceed gracefully with a timeout fallback
let authPromise: Promise<User | null> | null = null;

export function ensureAuth(): Promise<User | null> {
  if (!authPromise) {
    authPromise = new Promise((resolve) => {
      let resolved = false;
      const timer = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 1500);

      onAuthStateChanged(auth, (user) => {
        if (!resolved) {
          if (user) {
            resolved = true;
            clearTimeout(timer);
            resolve(user);
          } else {
            signInAnonymously(auth)
              .then((cred) => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  resolve(cred.user);
                }
              })
              .catch(() => {
                if (!resolved) {
                  resolved = true;
                  clearTimeout(timer);
                  resolve(null);
                }
              });
          }
        }
      });
    });
  }
  return authPromise;
}

// Ensure Auth runs immediately
ensureAuth();

// Collection References
const COLLECTIONS = {
  EMPLOYEES: 'employees',
  NOVEDADES: 'novedades',
  CAPACITACIONES: 'capacitaciones',
  PERFILES: 'perfiles',
  EVALUACIONES: 'evaluaciones',
  SKILLS: 'skills',
  REGISTROS_POLIVALENCIA: 'registros_polivalencia',
};

// Generic Realtime Subscription Helper
export function subscribeCollection<T extends { id?: string; legajo?: string; codigo?: string; skillId?: string }>(
  collectionName: string,
  idField: 'id' | 'legajo' | 'codigo' | 'skillId',
  initialFallbackData: T[],
  onData: (data: T[]) => void
): () => void {
  let unsub: (() => void) | null = null;
  let cancelled = false;

  ensureAuth().then(() => {
    if (cancelled) return;
    const colRef = collection(db, collectionName);

    unsub = onSnapshot(
      colRef,
      async (snapshot) => {
        if (snapshot.empty) {
          // If collection is completely empty, seed with initial data if available
          if (initialFallbackData && initialFallbackData.length > 0) {
            console.log(`Seeding empty collection ${collectionName} with initial data...`);
            try {
              const batch = writeBatch(db);
              initialFallbackData.forEach((item) => {
                const docId = (item as any)[idField] || (item as any).id || (item as any).legajo || (item as any).codigo || doc(colRef).id;
                const docRef = doc(db, collectionName, String(docId));
                batch.set(docRef, item);
              });
              await batch.commit();
            } catch (e) {
              console.warn(`Note on seeding ${collectionName}:`, e);
            }
          }
          onData(initialFallbackData || []);
        } else {
          const items: T[] = [];
          snapshot.forEach((d) => {
            items.push({ id: d.id, ...d.data() } as T);
          });
          onData(items);
        }
      },
      (error) => {
        console.warn(`Firestore listener note for ${collectionName}: ${error.message}`);
        if (initialFallbackData && initialFallbackData.length > 0) {
          onData(initialFallbackData);
        }
      }
    );
  }).catch((err) => {
    console.warn(`Auth setup issue for ${collectionName}:`, err);
    if (initialFallbackData && initialFallbackData.length > 0) {
      onData(initialFallbackData);
    }
  });

  return () => {
    cancelled = true;
    if (unsub) unsub();
  };
}

// ---------------- NOVEDADES ----------------
export function subscribeNovedades(onData: (items: Novedad[]) => void): () => void {
  return subscribeCollection<Novedad>(COLLECTIONS.NOVEDADES, 'id', INITIAL_NOVEDADES, onData);
}

export async function saveNovedadToFirestore(novedad: Novedad): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.NOVEDADES, novedad.id);
  await setDoc(docRef, novedad, { merge: true });
}

export async function deleteNovedadFromFirestore(id: string): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.NOVEDADES, id);
  await deleteDoc(docRef);
}

export async function bulkReplaceNovedadesInFirestore(novedades: Novedad[]): Promise<void> {
  await ensureAuth();
  const snapshot = await getDocs(collection(db, COLLECTIONS.NOVEDADES));
  const batch = writeBatch(db);
  snapshot.forEach((d) => batch.delete(d.ref));
  novedades.forEach((nov) => {
    const docRef = doc(db, COLLECTIONS.NOVEDADES, nov.id);
    batch.set(docRef, nov);
  });
  await batch.commit();
}

// ---------------- EMPLOYEES / NOMINA ----------------
export function subscribeEmployees(onData: (items: Empleado[]) => void): () => void {
  return subscribeCollection<Empleado>(COLLECTIONS.EMPLOYEES, 'legajo', INITIAL_EMPLOYEES, onData);
}

export async function saveEmployeeToFirestore(employee: Empleado): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.EMPLOYEES, employee.legajo);
  await setDoc(docRef, employee, { merge: true });
}

export async function deleteEmployeeFromFirestore(legajo: string): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.EMPLOYEES, legajo);
  await deleteDoc(docRef);
}

export async function bulkSaveEmployeesToFirestore(
  employees: Empleado[],
  mode: 'replace' | 'append'
): Promise<void> {
  await ensureAuth();
  if (mode === 'replace') {
    const snapshot = await getDocs(collection(db, COLLECTIONS.EMPLOYEES));
    const batch = writeBatch(db);
    snapshot.forEach((d) => batch.delete(d.ref));
    employees.forEach((emp) => {
      const docRef = doc(db, COLLECTIONS.EMPLOYEES, emp.legajo);
      batch.set(docRef, emp);
    });
    await batch.commit();
  } else {
    const batch = writeBatch(db);
    employees.forEach((emp) => {
      const docRef = doc(db, COLLECTIONS.EMPLOYEES, emp.legajo);
      batch.set(docRef, emp, { merge: true });
    });
    await batch.commit();
  }
}

// ---------------- CAPACITACIONES ----------------
export function subscribeCapacitaciones(onData: (items: Capacitacion[]) => void): () => void {
  return subscribeCollection<Capacitacion>(COLLECTIONS.CAPACITACIONES, 'id', INITIAL_CAPACITACIONES, onData);
}

export async function saveCapacitacionToFirestore(cap: Capacitacion): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.CAPACITACIONES, cap.id);
  await setDoc(docRef, cap, { merge: true });
}

// ---------------- PERFILES PUESTO ----------------
export function subscribePerfiles(onData: (items: PerfilPuesto[]) => void): () => void {
  return subscribeCollection<PerfilPuesto>(COLLECTIONS.PERFILES, 'id', INITIAL_PERFILES_PUESTO, onData);
}

export async function savePerfilToFirestore(perfil: PerfilPuesto): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.PERFILES, perfil.id);
  await setDoc(docRef, perfil, { merge: true });
}

// ---------------- EVALUACIONES ----------------
export function subscribeEvaluaciones(onData: (items: EvaluacionDesempeno[]) => void): () => void {
  return subscribeCollection<EvaluacionDesempeno>(COLLECTIONS.EVALUACIONES, 'id', INITIAL_EVALUACIONES, onData);
}

export async function saveEvaluacionToFirestore(ev: EvaluacionDesempeno): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.EVALUACIONES, ev.id);
  await setDoc(docRef, ev, { merge: true });
}

// ---------------- SKILLS POLIVALENCIA ----------------
export function subscribeSkills(onData: (items: SkillPolivalencia[]) => void): () => void {
  return subscribeCollection<SkillPolivalencia>(COLLECTIONS.SKILLS, 'id', INITIAL_SKILLS_POLIVALENCIA, onData);
}

export async function saveSkillToFirestore(skill: SkillPolivalencia): Promise<void> {
  await ensureAuth();
  const docRef = doc(db, COLLECTIONS.SKILLS, skill.id);
  await setDoc(docRef, skill, { merge: true });
}

// ---------------- REGISTROS POLIVALENCIA ----------------
export function subscribeRegistrosPolivalencia(
  onData: (items: MatrizPolivalenciaRegistro[]) => void
): () => void {
  return subscribeCollection<MatrizPolivalenciaRegistro>(
    COLLECTIONS.REGISTROS_POLIVALENCIA,
    'skillId',
    INITIAL_REGISTROS_POLIVALENCIA,
    onData
  );
}

export async function saveRegistroPolivalenciaToFirestore(
  reg: MatrizPolivalenciaRegistro
): Promise<void> {
  await ensureAuth();
  const docKey = `${reg.legajo}_${reg.skillId}`;
  const docRef = doc(db, COLLECTIONS.REGISTROS_POLIVALENCIA, docKey);
  await setDoc(docRef, { ...reg, id: docKey }, { merge: true });
}
