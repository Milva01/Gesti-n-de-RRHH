-- Gestión de RRHH: esquema base, autenticación, RLS y auditoría.
-- Ejecutar con una cuenta administradora de Supabase.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  nombre text not null,
  cargo text not null default '',
  rol text not null check (rol in (
    'Administrador',
    'Gestión RRHH',
    'Jefatura de Sector',
    'Analista de Nómina',
    'Coordinador de Capacitación'
  )),
  empresa text not null check (empresa in (
    'Talleres Metalúrgicos Crucianelli',
    'FERTEC S.A.'
  )),
  iniciales text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.employees (
  legajo text primary key,
  colaborador text not null,
  estado text not null check (estado in ('ACTIVO', 'INACTIVO')),
  empresa text not null,
  sector text not null,
  "fechaIngreso" text not null,
  cuil text not null,
  dni text not null,
  "fechaNacimiento" text not null,
  "fechaEgreso" text,
  categoria text
);

create table if not exists public.novedades (
  id text primary key,
  legajo text not null,
  colaborador text not null,
  empresa text not null,
  sector text not null,
  tipo text not null,
  "fechaInicio" text not null,
  "fechaFin" text not null,
  "diasOHoras" numeric not null default 0,
  unidad text not null,
  observaciones text not null default '',
  "estadoAprobacion" text not null default 'Pendiente',
  "certificadoAdjunto" text,
  "creadoEl" text not null
);

create table if not exists public.capacitaciones (
  id text primary key,
  titulo text not null,
  instructor text not null default '',
  "sectorTarget" text not null default '',
  fecha text not null,
  "duracionHoras" numeric not null default 0,
  estado text not null,
  asistentes jsonb not null default '[]'::jsonb,
  presupuesto numeric,
  descripcion text
);

create table if not exists public.perfiles (
  id text primary key,
  codigo text not null,
  nombre text not null,
  sector text not null,
  descripcion text not null default '',
  responsabilidades jsonb not null default '[]'::jsonb,
  "competenciasRequeridas" jsonb not null default '[]'::jsonb,
  "requisitosAcademicos" text not null default ''
);

create table if not exists public.evaluaciones (
  id text primary key,
  legajo text not null,
  colaborador text not null,
  puesto text not null default '',
  sector text not null,
  fecha text not null,
  evaluador text not null,
  competencias jsonb not null default '[]'::jsonb,
  "objetivosCumplidos" numeric not null default 0,
  "calificacionGeneral" text not null,
  comentarios text not null default '',
  "planAccion" text not null default ''
);

create table if not exists public.skills (
  id text primary key,
  sector text not null,
  "nombreHabilidad" text not null,
  descripcion text not null default ''
);

create table if not exists public.registros_polivalencia (
  id text primary key,
  legajo text not null,
  "skillId" text not null,
  nivel integer not null check (nivel between 0 and 3),
  unique (legajo, "skillId")
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  actor_id uuid references auth.users(id) on delete set null,
  table_name text not null,
  action text not null,
  row_key text,
  old_data jsonb,
  new_data jsonb
);

create or replace function public.has_hr_profile()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.has_hr_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.profiles
    where id = auth.uid() and rol = any(allowed_roles)
  );
$$;

revoke all on function public.has_hr_profile() from public;
revoke all on function public.has_hr_role(text[]) from public;
grant execute on function public.has_hr_profile() to authenticated;
grant execute on function public.has_hr_role(text[]) to authenticated;

do $$
declare
  table_name text;
  policy_record record;
begin
  foreach table_name in array array[
    'profiles', 'employees', 'novedades', 'capacitaciones', 'perfiles',
    'evaluaciones', 'skills', 'registros_polivalencia', 'audit_log'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
    for policy_record in
      select policyname
      from pg_policies
      where schemaname = 'public' and tablename = table_name
    loop
      execute format('drop policy if exists %I on public.%I', policy_record.policyname, table_name);
    end loop;
  end loop;
end $$;

create policy profiles_read_own
on public.profiles for select to authenticated
using (
  id = auth.uid()
  or public.has_hr_role(array['Administrador', 'Gestión RRHH'])
);

create policy profiles_admin_write
on public.profiles for all to authenticated
using (public.has_hr_role(array['Administrador']))
with check (public.has_hr_role(array['Administrador']));

create policy employees_authorized_read
on public.employees for select to authenticated
using (public.has_hr_profile());

create policy employees_authorized_write
on public.employees for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Analista de Nómina']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Analista de Nómina']));

create policy novedades_authorized_read
on public.novedades for select to authenticated
using (public.has_hr_profile());

create policy novedades_authorized_write
on public.novedades for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector', 'Analista de Nómina']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector', 'Analista de Nómina']));

create policy capacitaciones_authorized_read
on public.capacitaciones for select to authenticated
using (public.has_hr_profile());

create policy capacitaciones_authorized_write
on public.capacitaciones for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']));

create policy perfiles_authorized_read
on public.perfiles for select to authenticated
using (public.has_hr_profile());

create policy perfiles_authorized_write
on public.perfiles for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']));

create policy evaluaciones_authorized_read
on public.evaluaciones for select to authenticated
using (public.has_hr_profile());

create policy evaluaciones_authorized_write
on public.evaluaciones for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector']));

create policy skills_authorized_read
on public.skills for select to authenticated
using (public.has_hr_profile());

create policy skills_authorized_write
on public.skills for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Coordinador de Capacitación']));

create policy registros_authorized_read
on public.registros_polivalencia for select to authenticated
using (public.has_hr_profile());

create policy registros_authorized_write
on public.registros_polivalencia for all to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector', 'Coordinador de Capacitación']))
with check (public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector', 'Coordinador de Capacitación']));

create policy audit_admin_read
on public.audit_log for select to authenticated
using (public.has_hr_role(array['Administrador', 'Gestión RRHH']));

create or replace function public.audit_hr_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  old_row jsonb;
  new_row jsonb;
  key_value text;
begin
  old_row := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) else null end;
  new_row := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) else null end;
  key_value := coalesce(new_row->>'id', new_row->>'legajo', old_row->>'id', old_row->>'legajo');

  insert into public.audit_log(actor_id, table_name, action, row_key, old_data, new_data)
  values (auth.uid(), tg_table_name, tg_op, key_value, old_row, new_row);
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees', 'novedades', 'capacitaciones', 'perfiles',
    'evaluaciones', 'skills', 'registros_polivalencia'
  ]
  loop
    execute format('drop trigger if exists audit_hr_change on public.%I', table_name);
    execute format(
      'create trigger audit_hr_change after insert or update or delete on public.%I for each row execute function public.audit_hr_change()',
      table_name
    );
  end loop;
end $$;

insert into storage.buckets (id, name, public, file_size_limit)
values ('certificados-rrhh', 'certificados-rrhh', false, 10485760)
on conflict (id) do update
set public = false, file_size_limit = excluded.file_size_limit;

drop policy if exists certificados_read on storage.objects;
drop policy if exists certificados_write on storage.objects;
drop policy if exists certificados_delete on storage.objects;

create policy certificados_read
on storage.objects for select to authenticated
using (bucket_id = 'certificados-rrhh' and public.has_hr_profile());

create policy certificados_write
on storage.objects for insert to authenticated
with check (
  bucket_id = 'certificados-rrhh'
  and public.has_hr_role(array['Administrador', 'Gestión RRHH', 'Jefatura de Sector'])
);

create policy certificados_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'certificados-rrhh'
  and public.has_hr_role(array['Administrador', 'Gestión RRHH'])
);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'employees', 'novedades', 'capacitaciones', 'perfiles',
    'evaluaciones', 'skills', 'registros_polivalencia'
  ]
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end $$;

create index if not exists employees_empresa_idx on public.employees (empresa);
create index if not exists employees_sector_idx on public.employees (sector);
create index if not exists novedades_legajo_idx on public.novedades (legajo);
create index if not exists novedades_empresa_idx on public.novedades (empresa);
create index if not exists evaluaciones_legajo_idx on public.evaluaciones (legajo);
create index if not exists audit_log_occurred_at_idx on public.audit_log (occurred_at desc);
