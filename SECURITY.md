# Seguridad y operación

## Arquitectura elegida

- Supabase es la única fuente de verdad para autenticación, base de datos, tiempo real y archivos.
- Vercel publica el frontend desde GitHub.
- Firebase y los datos de ejemplo embebidos no forman parte de la aplicación productiva.
- Las variables `VITE_SUPABASE_*` contienen solamente configuración pública del cliente. Nunca usar una `service_role` en Vercel ni en el navegador.

## Puesta en producción

1. Hacer privado el repositorio y retirar los datos personales de todo el historial Git.
2. Revisar y aplicar `supabase/migrations/202607230001_secure_hr.sql`.
3. Crear las cuentas en Supabase Authentication.
4. Insertar un registro en `public.profiles` por cada cuenta, usando el mismo UUID de `auth.users`.
5. Configurar en Vercel `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
6. Publicar solamente después de completar una prueba de acceso por cada rol.

## Reglas operativas

- Activar MFA para administradores de Supabase, GitHub y Vercel.
- Mantener el bucket `certificados-rrhh` privado.
- Revisar periódicamente `audit_log`.
- Probar restauraciones de respaldo; un respaldo no comprobado no cuenta como recuperación.
- Dar de baja inmediatamente la cuenta de una persona que deja de necesitar acceso.
