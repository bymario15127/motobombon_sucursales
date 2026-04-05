# Motobombon — sistema visual (producto completo)

## Alcance

- **Admin** (panel interno)
- **Público:** selector de sucursal, landing por sucursal, reserva cliente, portal talleres aliados
- **Login** (`/login`): mismo lenguaje visual que el resto (oscuro, acento magenta, Poppins + Yeseva en marca)

## Direction

- **Operación densa + marca clara:** fondos oscuros neutros; el magenta (`#EB0463`) es acento y marca, no relleno.
- **Profundidad:** bordes finos `rgba` + sombra suave; evitar halos neón fuertes en contenedores base.
- **Tipo:** UI en Poppins; títulos de marca pueden usar Yeseva One donde ya exista el patrón.

## Tokens globales

Archivo: `Frontend/src/styles/motobombon-tokens.css` (`:root`).

Incluye: `--mb-bg-*`, `--mb-border-*`, `--mb-text-*`, `--mb-accent*`, radios, espaciado, sombra inset.

## Admin

Alias en `Frontend/src/styles/admin-design-system.css` sobre `.admin-shell` → mismos valores que `--mb-*`.

## Patrones de página

Archivo: `Frontend/src/styles/motobombon-pages.css`

- **`.centered-page`:** fondo `--mb-bg-deep` (login, landing, selector).
- **`.centered-page--portal`:** fondo `--mb-bg-canvas` (reserva cliente, etc.).
- **`.mb-auth*`:** bloque de login admin (título, formulario, error, volver).
- **`.mb-surface-card*`:** tarjetas vacío/error reutilizables (ej. taller sin datos).

## Tarjetas compartidas (index.css)

`.landing-card`, `.reserva-portal-card`, `.taller-portal-card` usan `var(--mb-*)` para borde y sombra alineados al sistema.
