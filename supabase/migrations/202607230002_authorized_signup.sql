-- Alta controlada sin correo: solo permite cuentas preautorizadas con código de un solo uso.

create table if not exists public.authorized_users (
  email text primary key,
  nombre text not null,
  cargo text not null,
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
  iniciales text not null,
  activation_code_hash text not null,
  active boolean not null default true,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.authorized_users enable row level security;
alter table public.authorized_users force row level security;

drop policy if exists authorized_users_admin_all on public.authorized_users;
create policy authorized_users_admin_all
on public.authorized_users for all to authenticated
using (public.has_hr_role(array['Administrador']))
with check (public.has_hr_role(array['Administrador']));

insert into public.authorized_users (
  email, nombre, cargo, rol, empresa, iniciales, activation_code_hash, claimed_at
)
values (
  'mcarancini@crucianelli.com',
  'Milva Carancini',
  'Responsable de RRHH',
  'Administrador',
  'Talleres Metalúrgicos Crucianelli',
  'MC',
  crypt('CUENTA-ACTIVA', gen_salt('bf')),
  now()
)
on conflict (email) do update set
  nombre = excluded.nombre,
  cargo = excluded.cargo,
  rol = excluded.rol,
  empresa = excluded.empresa,
  iniciales = excluded.iniciales,
  active = true,
  claimed_at = coalesce(public.authorized_users.claimed_at, now()),
  updated_at = now();

insert into public.authorized_users (
  email, nombre, cargo, rol, empresa, iniciales, activation_code_hash
)
values
  (
    'laura@crucianelli.com',
    'Laura Crucianelli',
    'Directora de RRHH Grupo Crucianelli',
    'Administrador',
    'Talleres Metalúrgicos Crucianelli',
    'LC',
    crypt('LAU-365YSU8T', gen_salt('bf'))
  ),
  (
    'birro@crucianelli.com',
    'María Belén Birro',
    'Coordinadora Generalista de RRHH',
    'Administrador',
    'Talleres Metalúrgicos Crucianelli',
    'MB',
    crypt('MB-V6SWV3PS', gen_salt('bf'))
  ),
  (
    'mpirchio@crucianelli.com',
    'Melina Pirchio',
    'Gestión Administrativa de RRHH',
    'Administrador',
    'Talleres Metalúrgicos Crucianelli',
    'MP',
    crypt('MEL-LCUYLKNQ', gen_salt('bf'))
  ),
  (
    'mgalassi@crucianelli.com',
    'Martina Galassi',
    'Gestión Generalista de RRHH y RSE',
    'Administrador',
    'Talleres Metalúrgicos Crucianelli',
    'MG',
    crypt('MAR-TKAUDL7G', gen_salt('bf'))
  )
on conflict (email) do update set
  nombre = excluded.nombre,
  cargo = excluded.cargo,
  rol = excluded.rol,
  empresa = excluded.empresa,
  iniciales = excluded.iniciales,
  activation_code_hash = excluded.activation_code_hash,
  active = true,
  claimed_at = null,
  updated_at = now();

update public.profiles
set
  cargo = 'Responsable de RRHH',
  rol = 'Administrador',
  updated_at = now()
where lower(email) = 'mcarancini@crucianelli.com';

create or replace function public.handle_authorized_signup()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  approved public.authorized_users%rowtype;
  supplied_code text;
begin
  supplied_code := upper(trim(coalesce(new.raw_user_meta_data->>'activation_code', '')));

  select *
  into approved
  from public.authorized_users
  where email = lower(new.email)
    and active
    and claimed_at is null
    and activation_code_hash = crypt(supplied_code, activation_code_hash)
  for update;

  if not found then
    raise exception 'Correo o clave de activación no autorizados.';
  end if;

  insert into public.profiles (
    id, email, nombre, cargo, rol, empresa, iniciales
  )
  values (
    new.id,
    lower(new.email),
    approved.nombre,
    approved.cargo,
    approved.rol,
    approved.empresa,
    approved.iniciales
  )
  on conflict (id) do update set
    email = excluded.email,
    nombre = excluded.nombre,
    cargo = excluded.cargo,
    rol = excluded.rol,
    empresa = excluded.empresa,
    iniciales = excluded.iniciales,
    updated_at = now();

  update public.authorized_users
  set claimed_at = now(), updated_at = now()
  where email = approved.email;

  return new;
end;
$$;

drop trigger if exists on_authorized_user_created on auth.users;
create trigger on_authorized_user_created
after insert on auth.users
for each row execute function public.handle_authorized_signup();

