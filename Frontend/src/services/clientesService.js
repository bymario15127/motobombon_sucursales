// Frontend/src/services/clientesService.js
import { fetchWithSucursal, getHeaders } from './apiHelper.js';

const API_URL = "/api/clientes";

// Obtener todos los clientes ordenados por lavadas
export const getClientes = async () => {
  const response = await fetchWithSucursal(API_URL);
  if (!response.ok) {
    throw new Error("Error al obtener clientes");
  }
  return response.json();
};

// Obtener información de un cliente por email
export const getClienteByEmail = async (email) => {
  const response = await fetchWithSucursal(`${API_URL}/email/${encodeURIComponent(email)}`);
  if (!response.ok) {
    throw new Error("Error al obtener cliente");
  }
  return response.json();
};

// Verificar un cupón
export const verificarCupon = async (codigo) => {
  const response = await fetchWithSucursal(`${API_URL}/cupon/${codigo}`);
  if (!response.ok) {
    throw new Error("Error al verificar cupón");
  }
  return response.json();
};

// Usar/redimir un cupón
export const usarCupon = async (codigo, citaId = null) => {
  const response = await fetchWithSucursal(`${API_URL}/cupon/${codigo}/usar`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ cita_id: citaId }),
  });
  if (!response.ok) {
    throw new Error("Error al usar cupón");
  }
  return response.json();
};

// Crear o actualizar cliente
export const guardarCliente = async (cliente) => {
  const response = await fetchWithSucursal(API_URL, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(cliente),
  });
  if (!response.ok) {
    throw new Error("Error al guardar cliente");
  }
  return response.json();
};

// Exportar clientes a Excel (nombre, celular, placa)
export const exportarClientesExcel = async (clientes) => {
  try {
    const XLSX = await import('xlsx');
    
    // Preparar datos: obtener placa más reciente por cliente
    // La placa está en citas, así que traeremos la del cliente si hay
    const datos = clientes.map(cliente => ({
      "Nombre": cliente.nombre || "-",
      "Celular": cliente.telefono || cliente.celular || "-",
      "Placa": cliente.placa || cliente.placa_principal || "-"
    }));

    // Crear workbook
    const ws = XLSX.utils.json_to_sheet(datos);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Clientes");

    // Ajustar ancho de columnas
    ws['!cols'] = [
      { wch: 25 },  // Nombre
      { wch: 15 },  // Celular
      { wch: 12 }   // Placa
    ];

    // Descargar
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `clientes_${fecha}.xlsx`);

    return { success: true, mensaje: "Archivo descargado correctamente" };
  } catch (error) {
    console.error("Error exportando Excel:", error);
    throw new Error("Error al exportar a Excel");
  }
};
