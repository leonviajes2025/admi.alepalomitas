# Ale Palomitas Admin

Aplicacion administrativa construida con Angular 19 standalone para operar productos, consultar contactos y visualizar cotizaciones recibidas por WhatsApp.

## Scripts

- `npm start`: levanta Angular con proxy de desarrollo definido en `proxy.conf.json`.
- `npm run build`: genera `src/environments/environment.production.ts` y compila la salida estatica.
- `npm run watch`: build continuo en configuracion development.
- `npm test`: ejecuta Jasmine y Karma.

## Mapeo de Postman a frontend

La coleccion base usada por el frontend es `back_2.postman_collection.json`.

| Recurso | Metodo | Endpoint | Uso en frontend | Estado |
| --- | --- | --- | --- | --- |
| Productos | GET | `/api/productos` | Carga del listado principal de productos en la vista de administracion | Implementado |
| Productos | POST | `/api/productos` | Alta de producto desde el formulario lateral | Implementado |
| Productos | PUT | `/api/productos/:id` | Edicion de producto existente | Implementado |
| Productos | DELETE | `/api/productos/:id` | Eliminacion de producto | Implementado |
| Productos | GET | `/api/productos/activos` | No se usa en la version inicial del panel administrativo | Disponible en backend |
| Contactos | GET | `/api/contactos` | Listado de contactos con filtro local por texto | Implementado |
| Contactos | POST | `/api/contactos` | No se usa en el admin; corresponde al formulario publico | Disponible en backend |
| Contactos WhatsApp | GET | `/api/contactos-whats` | Se reserva para la lista real de cotizaciones por WhatsApp | Pendiente de integrar |
| Contactos WhatsApp | POST | `/api/contactos-whats` | No se usa en el admin; corresponde al alta desde otro flujo | Disponible en backend |
| Cotizacion Detalle | POST | `/api/cotizacion-detalle` | No se usa en la version inicial; servira para detalle de pedidos/cotizaciones | Disponible en backend |

## Decision temporal para cotizaciones WhatsApp

La seccion Cotizaciones WhatsApp usa datos ficticios desde `src/app/core/content/mock-whatsapp-quotes.content.ts` porque el frontend quedo preparado para una vista de lectura aun cuando el endpoint de listado definitivo todavia no esta operativo para este flujo.

Cuando el backend quede listo, el cambio esperado es:

1. Reemplazar el retorno mock de `getWhatsappQuotes()` en `src/app/core/services/admin-api.service.ts` por un `HttpClient.get()` hacia `/api/contactos-whats` o el endpoint final que definas.
2. Ajustar el modelo `WhatsappQuote` si la forma real de la respuesta cambia.
3. Mantener el resto de la vista sin cambios, porque ya consume una coleccion tipada de lectura.

## Entornos y despliegue

- En desarrollo, `src/environments/environment.development.ts` usa `apiBaseUrl: '/api'` y el proxy redirige a `https://back-2-hazel.vercel.app`.
- En produccion, `generate-environment.mjs` escribe `src/environments/environment.production.ts` usando `NG_APP_API_BASE_URL` y `NG_APP_API_DIAGNOSTICS`.
- En Vercel, `vercel.json` reescribe `/api/*` hacia `https://back-2-hazel.vercel.app/api/*` y cualquier ruta SPA hacia `index.html`.

## Desarrollo local

Con la configuracion actual, `npm start` consume el backend remoto mediante proxy, por lo que no necesitas levantar un servidor local de API para probar el frontend.

Para variables locales del frontend puedes crear `/.env.local` a partir de `/.env.example`. Los scripts `npm start`, `npm run watch` y `npm run build` regeneran el environment correspondiente antes de ejecutar Angular.

## Recomendacion de variables para produccion

Si vas a desplegar este frontend en Vercel, la configuracion natural es:

- `NG_APP_API_BASE_URL=/api`
- `NG_APP_API_DIAGNOSTICS=false`
- `NG_APP_SUPABASE_STORAGE_URL=https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3`
- `NG_APP_SUPABASE_URL=https://mrdwszirgvmrwwinepta.supabase.co`
- `NG_APP_SUPABASE_ANON_KEY=tu_anon_key`
- `NG_APP_SUPABASE_BUCKET=tu_bucket_publico`
- `NG_APP_SUPABASE_PRODUCT_IMAGES_PATH=productos`

De esa forma el navegador siempre consume la misma ruta relativa y Vercel se encarga de reenviar las peticiones al backend remoto.

## Subida de imagenes a Supabase

- El formulario de productos ahora permite seleccionar una imagen, subirla al bucket configurado y reutiliza la URL publica resultante en `imagenUrl`.
- El SDK usa `NG_APP_SUPABASE_URL` si esta definido; si no, intenta derivar la URL del proyecto a partir de `NG_APP_SUPABASE_STORAGE_URL`.
- Para que la URL generada funcione directamente en el frontend, el bucket debe ser publico o debes cambiar este flujo para usar URLs firmadas.