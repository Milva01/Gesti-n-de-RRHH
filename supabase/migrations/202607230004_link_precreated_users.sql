-- Vincula las cuentas creadas desde el panel con sus perfiles autorizados.

insert into public.profiles (
  id, email, nombre, cargo, rol, empresa, iniciales
)
select
  u.id,
  lower(u.email),
  a.nombre,
  a.cargo,
  'Administrador',
  a.empresa,
  a.iniciales
from auth.users u
join public.authorized_users a
  on lower(a.email) = lower(u.email)
where lower(u.email) in (
  'laura@crucianelli.com',
  'birro@crucianelli.com',
  'mpirchio@crucianelli.com',
  'mgalassi@crucianelli.com'
)
on conflict (id) do update set
  email = excluded.email,
  nombre = excluded.nombre,
  cargo = excluded.cargo,
  rol = 'Administrador',
  empresa = excluded.empresa,
  iniciales = excluded.iniciales,
  updated_at = now();

update public.authorized_users a
set
  claimed_at = coalesce(a.claimed_at, now()),
  updated_at = now()
where lower(a.email) in (
  'laura@crucianelli.com',
  'birro@crucianelli.com',
  'mpirchio@crucianelli.com',
  'mgalassi@crucianelli.com'
)
and exists (
  select 1
  from auth.users u
  where lower(u.email) = lower(a.email)
);

update public.profiles
set
  cargo = 'Responsable de RRHH',
  rol = 'Administrador',
  updated_at = now()
where lower(email) = 'mcarancini@crucianelli.com';

select
  email,
  nombre,
  cargo,
  rol,
  empresa
from public.profiles
order by email;
