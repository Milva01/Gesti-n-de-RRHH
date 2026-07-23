export type EstadoEmpleado = 'ACTIVO' | 'INACTIVO';
export type Empresa = 'Talleres Metalúrgicos Crucianelli' | 'FERTEC S.A.';

export interface Empleado {
  legajo: string;
  colaborador: string;
  estado: EstadoEmpleado;
  empresa: Empresa;
  sector: string;
  fechaIngreso: string;
  cuil: string;
  dni: string;
  fechaNacimiento: string;
  fechaEgreso?: string;
  categoria?: string;
}

export type TipoNovedad =
  | 'Ausencia por Enfermedad'
  | 'Vacaciones'
  | 'Licencia Especial'
  | 'Permiso Médico'
  | 'Llegada Tarde'
  | 'Salida Anticipada'
  | 'Salida'
  | 'Accidente Laboral'
  | 'Hora Extra'
  | 'Suspensión'
  | 'Capacitación'
  | 'Falta Injustificada';

export type EstadoAprobacion = 'Pendiente' | 'Aprobado' | 'Rechazado';

export interface Novedad {
  id: string;
  legajo: string;
  colaborador: string;
  empresa: Empresa;
  sector: string;
  tipo: TipoNovedad;
  fechaInicio: string;
  fechaFin: string;
  diasOHoras: number;
  unidad: 'Días' | 'Horas';
  observaciones: string;
  estadoAprobacion: EstadoAprobacion;
  certificadoAdjunto?: string;
  creadoEl: string;
}

export interface AsistenteCapacitacion {
  legajo: string;
  colaborador: string;
  asistio: boolean;
  calificacion?: number; // 1-10
}

export interface Capacitacion {
  id: string;
  titulo: string;
  instructor: string;
  sectorTarget: string;
  fecha: string;
  duracionHoras: number;
  estado: 'Planificada' | 'En Curso' | 'Completada';
  asistentes: AsistenteCapacitacion[];
  presupuesto?: number;
  descripcion?: string;
}

export interface CompetenciaRequerida {
  nombre: string;
  nivelMinimo: number; // 1 a 5
}

export interface PerfilPuesto {
  id: string;
  codigo: string;
  nombre: string;
  sector: string;
  descripcion: string;
  responsabilidades: string[];
  competenciasRequeridas: CompetenciaRequerida[];
  requisitosAcademicos: string;
}

export interface EvaluacionCompetencia {
  nombre: string;
  puntaje: number; // 1 a 5
  comentario?: string;
}

export interface EvaluacionDesempeno {
  id: string;
  legajo: string;
  colaborador: string;
  puesto: string;
  sector: string;
  fecha: string;
  evaluador: string;
  competencias: EvaluacionCompetencia[];
  objetivosCumplidos: number; // porcentaje 0-100
  calificacionGeneral: 'Excepcional' | 'Cumple Expectativas' | 'Necesita Mejorar' | 'En Desarrollo';
  comentarios: string;
  planAccion: string;
}

export interface SkillPolivalencia {
  id: string;
  sector: string;
  nombreHabilidad: string;
  descripcion: string;
}

// Nivel 0: Sin Capacitación | 1: En Formación | 2: Autónomo | 3: Experto/Tutor
export type NivelPolivalencia = 0 | 1 | 2 | 3;

export interface MatrizPolivalenciaRegistro {
  legajo: string;
  skillId: string;
  nivel: NivelPolivalencia;
}

export type UserRole = 'Administrador' | 'Gestión RRHH' | 'Jefatura de Sector' | 'Analista de Nómina' | 'Coordinador de Capacitación';

export interface UserProfile {
  id: string;
  email: string;
  nombre: string;
  cargo: string;
  rol: UserRole;
  empresa: Empresa;
  iniciales: string;
  pin?: string;
}

