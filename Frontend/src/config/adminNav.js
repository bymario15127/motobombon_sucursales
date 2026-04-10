/** Slug en la URL ↔ id interno de vista (Sidebar / AdminLayout) */
export const ADMIN_VIEW_SEGMENTS = {
  dashboard: "dashboard",
  calendar: "calendario",
  appointments: "citas",
  clientes: "clientes",
  services: "servicios",
  talleres: "talleres",
  lavadores: "lavadores",
  nomina: "nomina",
  productos: "productos",
  finanzas: "finanzas",
  settings: "ajustes",
};

export function segmentToViewId(segment) {
  const s = (segment || "dashboard").toLowerCase();
  if (s === "dashboard") return "dashboard";
  const found = Object.entries(ADMIN_VIEW_SEGMENTS).find(([, path]) => path === s);
  return found ? found[0] : "dashboard";
}

export function viewIdToPath(viewId) {
  const seg = ADMIN_VIEW_SEGMENTS[viewId] || "dashboard";
  return `/admin/${seg}`;
}
