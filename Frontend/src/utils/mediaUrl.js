/**
 * Asegura URL absoluta en el sitio. Sin "/" inicial, el navegador resuelve mal
 * desde rutas como /admin (p. ej. "uploads/x" → /admin/uploads/x → 404).
 */
export function normalizeMediaUrl(url) {
  if (url == null || url === "") return null;
  const s = String(url).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("//")) return s;
  if (s.startsWith("/")) return s;
  return `/${s.replace(/^\.\//, "")}`;
}
