Rotación de claves y configuración de secretos (instrucciones)
=============================================================

1) Rotar claves en Supabase
---------------------------
- Accede al panel de Supabase → Settings → API.
- Rota la `Service Role` key y cualquier `anon` key usada en desarrollo.
- Anota las nuevas claves y no las compartas en archivos versionados.

2) Configurar secretos en Vercel (o en tu hosting)
-------------------------------------------------
- En Vercel: Settings → Environment Variables.
- Añade `SUPABASE_SERVICE_ROLE_KEY` en `Production` y `Preview` (si es necesario).
- Añade variables públicas no sensibles como `NG_APP_API_BASE_URL` en `Production` si lo deseas.

3) Actualizar entorno local y CI
--------------------------------
- En tu máquina local, guarda variables en `.env.local` (no commitear). Ejemplo:

  NG_APP_API_BASE_URL=/api
  # NG_APP_SUPABASE_ANON_KEY removed from project

- En GitHub Actions / CI, define los secretos como variables de entorno y pásalos al build o al servidor.

4) Verificación post-rotación
------------------------------
- Ejecuta los scripts de integración: `node scripts/test-storage.js` con las variables de entorno del servidor (para verificar endpoints server-side).
- Re-ejecuta el escaneo de secretos para asegurarte de que no quedan credenciales en el repo.

5) Si el historial fue purgado
-----------------------------
- Después de empujar un mirror reescrito con `git filter-repo`, obliga a todos los colaboradores a reclonar.
- Rota claves nuevamente tras la purga por seguridad adicional.

Contacto
-------
Si quieres, puedo generar el archivo `replacements.txt` adicional con patrones detectados y guiar el push forzado cuando confirmes.
