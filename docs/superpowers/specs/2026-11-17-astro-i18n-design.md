# Geopets en Astro con inglés y español — diseño

Fecha: 2026-11-17 · Estado: borrador para aprobación

## Intención

Geopets es una colección de mascotas pixel-art animadas (SVG + CSS) con forma geométrica, una galería para descargarlas y un creador para hacer la tuya. Hoy es un único `index.html`.

El público objetivo son **desarrolladores de fuera de España**, así que el sitio pasa a ser bilingüe con **inglés como idioma principal** y debe posicionar bien en buscadores en los dos idiomas. Se migra a Astro para generar páginas por idioma y el SEO de forma estática.

## Objetivos

- `/` en inglés y `/es/` en español, con los mismos contenidos y funciones.
- Todo lo que funciona hoy sigue funcionando igual: galería con filtros (forma; Estados/HTTP/Todo), creador por píxeles, estados en vivo, copiar SVG, descarga SVG / GIF transparente / GIF fondo blanco, pack .zip de galería (respeta el filtro de forma) y pack personalizado.
- Nombres de archivo de descarga **en inglés en ambos idiomas**: `geopet-cube-happy.svg`, `geopet-cube-404.gif`, `geopets-cube.zip`.
- SEO completo por idioma (ver abajo).
- Los 145 SVG publicados como archivos estáticos en `/pets/` para incrustar con `<img src>`.

## No objetivos

- Rediseñar la página o cambiar el aspecto de los pets.
- Añadir estados o formas nuevas.
- Mantener sincronizada la versión publicada en claude.ai (queda como está).
- Desplegar el sitio o elegir dominio/hosting.
- Componentes reactivos (React/Preact): el JS de cliente sigue siendo vanilla.
- Más idiomas que EN y ES (pero la estructura debe permitir añadir otro solo con un JSON nuevo).

## Anti-objetivos (sería un fracaso aunque compile)

- Que algún texto visible quede en el idioma equivocado (incluidos toasts, botones dinámicos y el `LICENSE.txt` del zip).
- Que los pets se vean o animen distinto que en el `index.html` actual.
- Que la descarga dependa de CDNs en tiempo de ejecución (JSZip y gifenc van empaquetados).
- Que se pierda la atribución: licencia **CC BY 4.0**, "Geopets by Adiezdev (adiez.dev)", footer con enlace a https://adiez.dev.

## Restricciones

- Fuente de verdad del código actual: `geopets/index.html` (generador `svgPet`, `layout`, `SHAPES`, `STATES`, `HTTP`, GIF con gifenc, zip con JSZip). Debe quedar como referencia hasta que el sitio Astro iguale su comportamiento; después se borra.
- Salida 100 % estática (`output: "static"`), apta para Vercel o GitHub Pages.
- **Todo se construye y se prueba en local** (`npm run dev` / `npm run build && npm run preview`). Desplegar queda fuera de este trabajo.
- Dominio: va en **un solo valor**, `site` en `astro.config.mjs` (`https://geopets.adiez.dev`). Canonical, hreflang, sitemap, `og:image`, JSON-LD y las URLs de embed se derivan de él, así que cambiar de dominio es editar una línea y volver a hacer build. Sin `base` (el sitio cuelga de la raíz); si se aloja en GitHub Pages sin dominio propio, habrá que añadir `base` entonces.
- Fuentes de Google ya usadas: Pixelify Sans, DM Sans, JetBrains Mono.

## Enfoques considerados

| | Enfoque | Ventaja | Coste |
|---|---|---|---|
| **A (elegido)** | Astro estático, una página `.astro` compartida + textos en `en.json`/`es.json` + un módulo JS de cliente | Reutiliza todo el código actual; SEO estático completo; poco riesgo | El JS de cliente sigue sin componentes |
| B | Astro + isla Preact/React para el creador | Creador más estructurado si crece | Otra dependencia y reescritura sin beneficio de SEO/idiomas |
| C | Dos HTML a mano | Sin build | Duplicar cada cambio; descartado porque ya se eligió Astro |

Elegido **A** por el usuario.

## Decisiones tomadas

### Estructura

```
geopets/
  astro.config.mjs        site, i18n (defaultLocale "en", locales ["en","es"], prefixDefaultLocale false), sitemap
  src/
    lib/geopets.js        generador puro: SHAPES, STATES, HTTP, layout, svgPet, standalone (sin DOM)
    lib/i18n/en.json
    lib/i18n/es.json
    scripts/app.js        cliente: galería, creador, descargas, GIF, zip (importa geopets.js, jszip, gifenc)
    layouts/Base.astro    <head> con SEO
    components/Page.astro el cuerpo de la página, recibe el diccionario
    pages/index.astro     EN
    pages/es/index.astro  ES
    pages/pets/[file].svg.ts  endpoint estático que genera los 145 SVG
  public/
    og-en.png, og-es.png, favicon.svg, robots.txt
```

### Claves en inglés (nombres de archivo)

Las claves internas pasan a inglés; los nombres de personaje se mantienen como nombres propios en ambos idiomas.

| Clave (archivo) | Personaje (visible) |
|---|---|
| cube | Cubo |
| triangle | Tri |
| circle | Bola |
| diamond | Rombi |
| hexagon | Hexa |

Estados: `idle, happy, sad, angry, love, sleeping, surprised, typing, thinking, dizzy, waving, celebrating, idea, music, coffee, loading, error`, y HTTP `200, 201, 204, 301, 400, 401, 403, 404, 418, 429, 500, 503`.

Archivos: `geopet-{shape}-{state}.{svg|gif}`; HTTP: `geopet-{shape}-{code}.{ext}`. Packs: `geopets-pack.zip`, `geopets-{shape}.zip`, `{slug}-pack.zip`. Carpetas dentro del zip: `geopets/{shape}/`.

### Textos

Todo texto visible sale del diccionario del idioma: titulares, párrafos, etiquetas de estado, chips, botones (incluidos los que cambian solos: "Download Cube pack (.zip)", progreso "GIF 12/145…"), toasts, `aria-label`, nombre de pet por defecto en el creador, `LICENSE.txt` del zip y el comentario de atribución dentro de cada SVG (este último siempre en inglés, porque el archivo es el mismo para todos).

El cliente recibe el diccionario vía `<script type="application/json" id="i18n">` renderizado por Astro.

### SEO por idioma

- `<html lang>`; `<title>` y `<meta name="description">` propios.
- `<link rel="canonical">` y `<link rel="alternate" hreflang="en|es|x-default">` (x-default → `/`).
- Open Graph y Twitter card con imagen por idioma (`og-en.png`, `og-es.png`, 1200×630, generadas a partir de los pets).
- JSON-LD: `WebSite` + `CreativeWork`/`ImageObject` con licencia CC BY 4.0 y autor Adiezdev (adiez.dev).
- `@astrojs/sitemap` con alternates i18n; `robots.txt` apuntando al sitemap.
- Selector de idioma visible (EN / ES) que enlaza a la página equivalente.
- Los SVG de `/pets/` se enlazan desde la galería (p. ej. un enlace "Embed URL" o el `src` copiado) para que sean rastreables.

### Embed

Cada tarjeta de la galería ofrece copiar la URL estable del SVG (`https://<dominio>/pets/geopet-cube-happy.svg`) además de "Copiar SVG".

### Otras decisiones (llamadas mías, revisables)

- Sin redirección automática por idioma del navegador: `/` siempre es inglés y el selector EN/ES enlaza a la versión equivalente.
- Una ruta compartida por idioma (p. ej. `[...lang]`) en lugar de un archivo por idioma, para que añadir un idioma sea solo un JSON nuevo.
- El enlace de licencia apunta a la ficha CC BY 4.0 en el idioma de la página.
- El sitio es nuevo fuera de claude.ai: no hacen falta redirecciones; las anclas pasan a inglés (`#gallery`, `#create`, `#license`) en ambos idiomas.

## Lo que queda al constructor

- Organización interna de `app.js` y estilos (puede mantener el CSS actual tal cual en un `<style is:global>`).
- Cómo generar las imágenes OG (script de build o PNG hecho a mano).
- Textos exactos de la versión inglesa (traducción natural, no literal).
- Pruebas: como mínimo, un test del generador (cada forma × estado produce SVG válido; nombres de archivo en inglés) y una comprobación manual de descarga SVG/GIF/zip en EN y ES.
