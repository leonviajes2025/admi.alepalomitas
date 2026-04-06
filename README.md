# Ale Palomitas Admin

Aplicacion administrativa construida con Angular 21 standalone para operar productos, consultar contactos y visualizar cotizaciones recibidas por WhatsApp.

## Scripts

- `npm start`: levanta Angular con proxy de desarrollo definido en `proxy.conf.json`.
- `npm run build`: genera `src/environments/environment.generated.production.ts` y compila la salida estatica.
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

- Los archivos versionados en `src/environments/` no deben contener secretos; solo actuan como valores por defecto vacios.
- En desarrollo, `generate-environment.mjs` escribe `src/environments/environment.generated.development.ts` usando variables `NG_APP_*` y el proxy redirige a `https://api.palomitasbee.com`.
- En produccion, `generate-environment.mjs` escribe `src/environments/environment.generated.production.ts` usando variables `NG_APP_*` definidas en el entorno del build.
- En Vercel, `vercel.json` reescribe `/api/*` hacia `https://api.palomitasbee.com/api/*` y cualquier ruta SPA hacia `index.html`.

## Desarrollo local

Con la configuracion actual, `npm start` consume el backend remoto mediante proxy, por lo que no necesitas levantar un servidor local de API para probar el frontend.

Para variables locales del frontend puedes crear `/.env.local` a partir de `/.env.example`. Los scripts `npm start`, `npm run watch` y `npm run build` generan archivos `environment.generated.*.ts` ignorados por Git antes de ejecutar Angular.

## Variables minimas

Con la configuracion actual del proyecto, estas son las variables realmente necesarias:

- Desarrollo local con subida directa: `NG_APP_SUPABASE_ANON_KEY`
- Deploy en Vercel con subida server-side: `SUPABASE_SERVICE_ROLE_KEY`

El resto de valores ya tiene defaults dentro del proyecto:

- API base: `/api`
- Diagnostics: `false` en produccion y `true` en desarrollo
- Storage URL: `https://mrdwszirgvmrwwinepta.storage.supabase.co/storage/v1/s3`
- Bucket: `productos`
- Carpeta de imagenes: `productos`

En desarrollo local puedes seguir usando `/.env.local` con solo la anon key para probar el flujo sin levantar funciones server-side.

En deploy, la subida de imagenes pasa por funciones server-side y la `SUPABASE_SERVICE_ROLE_KEY` debe existir solo en Vercel. No la pongas en `NG_APP_*` ni en archivos versionados.

## Subida de imagenes a Supabase

- El formulario de productos ahora permite seleccionar una imagen, subirla al bucket configurado y reutiliza la URL publica resultante en `imagenUrl`.
- En desarrollo, el frontend puede subir directamente si existen claves cliente en `/.env.local`.
- En produccion, el frontend usa `/storage-api/upload` y `/storage-api/delete`, que Vercel redirige a funciones server-side bajo `api/storage`.
- Para que la URL generada funcione directamente en el frontend, el bucket debe ser publico o debes cambiar este flujo para usar URLs firmadas.

## Variables en Vercel

Define solo `SUPABASE_SERVICE_ROLE_KEY` en el proyecto de Vercel.

No definas en Vercel `NG_APP_SUPABASE_ANON_KEY` para evitar que una clave cliente llegue al bundle de produccion.

## Deploy en Vercel

Pasos minimos para desplegar:

1. Importa el repositorio en Vercel sin cambiar el directorio raiz.
2. Verifica que Vercel detecte `vercel.json` y use `npm ci` + `npm run build`.
3. Carga en Vercel las variables listadas en la seccion anterior.
4. Confirma que el output publicado sea `dist/alepalomitasadmi/browser`.
5. Despliega y prueba estas rutas:
	`/`
	`/products`
	`/contacts`
	`/storage-api/upload` solo desde el flujo autenticado del admin

El proyecto ya queda preparado para que Vercel publique el frontend estatico y las funciones server-side bajo `api/storage` con runtime Node 22.
