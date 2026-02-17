// src/services/serviciosService.js
import { fetchWithSucursal, getHeaders } from './apiHelper.js';

// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/servicios";
const UPLOAD_URL = "/api/upload-image";

// Cache para servicios (se actualiza cada 5 minutos)
let serviciosCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

export function invalidateServiciosCache() {
  serviciosCache = null;
  cacheTimestamp = 0;
}

export async function getServicios({ force = false } = {}) {
  const now = Date.now();

  if (!force && serviciosCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return serviciosCache;
  }

  const res = await fetchWithSucursal(API_URL);
  if (!res.ok) {
    console.error("Error fetching servicios:", res.status);
    return serviciosCache || [];
  }

  const data = await res.json();
  serviciosCache = data;
  cacheTimestamp = now;

  return data;
}

export async function addServicio(data) {
  const res = await fetchWithSucursal(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al crear el servicio");
  }
  
  invalidateServiciosCache();
  return result;
}

export async function updateServicio(id, data) {
  const res = await fetchWithSucursal(`${API_URL}/${id}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al actualizar el servicio");
  }
  
  invalidateServiciosCache();
  return result;
}

export async function deleteServicio(id) {
  const res = await fetchWithSucursal(`${API_URL}/${id}`, {
    method: "DELETE",
  });
  
  if (!res.ok) {
    throw new Error("Error al eliminar el servicio");
  }
  
  invalidateServiciosCache();
  return res.json();
}

// Sube una imagen en formato dataURL (base64) y devuelve { url }
export async function uploadImagen(dataUrl) {
  try {
    console.log("📤 Iniciando upload de imagen, tamaño:", dataUrl.length);
    
    const res = await fetch(UPLOAD_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: dataUrl }),
    });
    
    console.log("📊 Respuesta del servidor:", res.status, res.statusText);
    
    const result = await res.json();
    
    console.log("📋 Resultado del JSON:", result);
    
    if (!res.ok) {
      console.error("❌ Error en upload:", result.error);
      throw new Error(result.error || "Error al subir la imagen");
    }
    
    console.log("✅ Imagen subida exitosamente:", result.url);
    return result; // { url }
  } catch (error) {
    console.error("🔴 Error en uploadImagen:", error);
    throw error;
  }
}

export default {
  getServicios,
  addServicio,
  updateServicio,
  deleteServicio,
  uploadImagen,
  invalidateServiciosCache,
};