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

const KEYS = {
  EMPLOYEES: 'rrhh_employees_v2',
  NOVEDADES: 'rrhh_novedades_v2',
  CAPACITACIONES: 'rrhh_capacitaciones_v1',
  PERFILES: 'rrhh_perfiles_v1',
  EVALUACIONES: 'rrhh_evaluaciones_v1',
  SKILLS: 'rrhh_skills_v1',
  REGISTROS_POLIVALENCIA: 'rrhh_registros_polivalencia_v1',
};

export function getStoredEmployees(): Empleado[] {
  try {
    const data = localStorage.getItem(KEYS.EMPLOYEES);
    return data ? JSON.parse(data) : INITIAL_EMPLOYEES;
  } catch {
    return INITIAL_EMPLOYEES;
  }
}

export function saveEmployees(employees: Empleado[]): void {
  localStorage.setItem(KEYS.EMPLOYEES, JSON.stringify(employees));
}

export function getStoredNovedades(): Novedad[] {
  try {
    const data = localStorage.getItem(KEYS.NOVEDADES);
    return data ? JSON.parse(data) : INITIAL_NOVEDADES;
  } catch {
    return INITIAL_NOVEDADES;
  }
}

export function saveNovedades(novedades: Novedad[]): void {
  localStorage.setItem(KEYS.NOVEDADES, JSON.stringify(novedades));
}

export function getStoredCapacitaciones(): Capacitacion[] {
  try {
    const data = localStorage.getItem(KEYS.CAPACITACIONES);
    return data ? JSON.parse(data) : INITIAL_CAPACITACIONES;
  } catch {
    return INITIAL_CAPACITACIONES;
  }
}

export function saveCapacitaciones(capacitaciones: Capacitacion[]): void {
  localStorage.setItem(KEYS.CAPACITACIONES, JSON.stringify(capacitaciones));
}

export function getStoredPerfiles(): PerfilPuesto[] {
  try {
    const data = localStorage.getItem(KEYS.PERFILES);
    return data ? JSON.parse(data) : INITIAL_PERFILES_PUESTO;
  } catch {
    return INITIAL_PERFILES_PUESTO;
  }
}

export function savePerfiles(perfiles: PerfilPuesto[]): void {
  localStorage.setItem(KEYS.PERFILES, JSON.stringify(perfiles));
}

export function getStoredEvaluaciones(): EvaluacionDesempeno[] {
  try {
    const data = localStorage.getItem(KEYS.EVALUACIONES);
    return data ? JSON.parse(data) : INITIAL_EVALUACIONES;
  } catch {
    return INITIAL_EVALUACIONES;
  }
}

export function saveEvaluaciones(evaluaciones: EvaluacionDesempeno[]): void {
  localStorage.setItem(KEYS.EVALUACIONES, JSON.stringify(evaluaciones));
}

export function getStoredSkills(): SkillPolivalencia[] {
  try {
    const data = localStorage.getItem(KEYS.SKILLS);
    return data ? JSON.parse(data) : INITIAL_SKILLS_POLIVALENCIA;
  } catch {
    return INITIAL_SKILLS_POLIVALENCIA;
  }
}

export function saveSkills(skills: SkillPolivalencia[]): void {
  localStorage.setItem(KEYS.SKILLS, JSON.stringify(skills));
}

export function getStoredRegistrosPolivalencia(): MatrizPolivalenciaRegistro[] {
  try {
    const data = localStorage.getItem(KEYS.REGISTROS_POLIVALENCIA);
    return data ? JSON.parse(data) : INITIAL_REGISTROS_POLIVALENCIA;
  } catch {
    return INITIAL_REGISTROS_POLIVALENCIA;
  }
}

export function saveRegistrosPolivalencia(registros: MatrizPolivalenciaRegistro[]): void {
  localStorage.setItem(KEYS.REGISTROS_POLIVALENCIA, JSON.stringify(registros));
}

export function resetAllDataToDefault(): void {
  localStorage.removeItem(KEYS.EMPLOYEES);
  localStorage.removeItem(KEYS.NOVEDADES);
  localStorage.removeItem(KEYS.CAPACITACIONES);
  localStorage.removeItem(KEYS.PERFILES);
  localStorage.removeItem(KEYS.EVALUACIONES);
  localStorage.removeItem(KEYS.SKILLS);
  localStorage.removeItem(KEYS.REGISTROS_POLIVALENCIA);
}
