// Frontend/src/services/citasService.js
import { fetchWithSucursal, getHeaders } from './apiHelper.js';

// Use relative URLs - works in both dev (via Vite proxy) and prod (via Nginx proxy)
const API_URL = "/api/citas";

export async function getCitas() {
  // Por defecto, obtiene solo citas del día actual
  const res = await fetchWithSucursal(API_URL);
  if (!res.ok) {
    console.error("Error fetching citas:", res.status);
    return []; // Return empty array on error
  }
  return res.json();
}

export async function getCitasAll() {
  // Obtiene todas las citas de todos los días
  const res = await fetchWithSucursal(`${API_URL}?all=true`);
  if (!res.ok) {
    console.error("Error fetching citas:", res.status);
    return [];
  }
  return res.json();
}

export async function addCita(data) {
  const res = await fetchWithSucursal(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  
  const result = await res.json();
  
  if (!res.ok) {
    throw new Error(result.error || "Error al crear la cita");
  }
  
  return result;
}

export async function getHorariosOcupados(fecha) {
  const res = await fetchWithSucursal(`${API_URL}/ocupados/${fecha}`);
  if (!res.ok) {
    throw new Error("Error al obtener horarios ocupados");
  }
  return res.json();
}

export async function deleteCita(id) {
  await fetchWithSucursal(`${API_URL}/${id}`, { method: "DELETE" });
}

export async function updateCita(id, data) {
  const role = localStorage.getItem('motobombon_user_role') || '';
  const res = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      "x-user-role": role
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
