// Frontend/src/services/apiHelper.js
/**
 * Helper para agregar el header de sucursal a las peticiones
 */

/**
 * Obtiene la sucursal actual del localStorage
 */
export function getSucursalActual() {
  return localStorage.getItem('motobombon_sucursal') || 'sucursal1';
}

/**
 * Obtiene el token de autenticación
 */
function getAuthToken() {
  return localStorage.getItem('motobombon_token');
}

/**
 * Crea headers con la sucursal incluida
 */
export function getHeaders(additionalHeaders = {}) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Sucursal-Id': getSucursalActual(),
    ...additionalHeaders
  };
  
  // Agregar token si existe
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}

/**
 * Wrapper de fetch que incluye automáticamente el header de sucursal
 */
export async function fetchWithSucursal(url, options = {}) {
  const headers = {
    'X-Sucursal-Id': getSucursalActual(),
    ...(options.headers || {})
  };

  // Si no hay Authorization header pero hay token, agregarlo
  const token = getAuthToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers
  });
}

export default {
  getSucursalActual,
  getHeaders,
  fetchWithSucursal
};
