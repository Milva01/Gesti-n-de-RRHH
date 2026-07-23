-- El alta se realiza como usuario preconfirmado desde el panel.
-- La clave temporal se reemplaza obligatoriamente en el primer acceso.

drop trigger if exists on_authorized_user_created on auth.users;

