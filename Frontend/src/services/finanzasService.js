// Frontend/src/services/finanzasService.js
import { fetchWithSucursal, getHeaders } from './apiHelper.js';

const API_URL = "/api/finanzas";

// Dashboard financiero
export const getDashboard = async (mes = null, anio = null, desde = null, hasta = null) => {
  try {
    const params = new URLSearchParams();
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithSucursal(`${API_URL}/dashboard${queryString}`);
    if (!response.ok) throw new Error("Error obteniendo dashboard");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo dashboard:", error);
    throw error;
  }
};

// Obtener gastos con filtros
export const getGastos = async (filtros = {}) => {
  try {
    const params = new URLSearchParams();
    if (filtros.tipo) params.append("tipo", filtros.tipo);
    if (filtros.categoria) params.append("categoria", filtros.categoria);
    if (filtros.desde) params.append("desde", filtros.desde);
    if (filtros.hasta) params.append("hasta", filtros.hasta);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithSucursal(`${API_URL}/gastos${queryString}`);
    if (!response.ok) throw new Error("Error obteniendo gastos");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo gastos:", error);
    throw error;
  }
};

// Crear gasto
export const crearGasto = async (gasto) => {
  try {
    const response = await fetchWithSucursal(`${API_URL}/gastos`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(gasto)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error creando gasto");
    }
    return response.json();
  } catch (error) {
    console.error("Error creando gasto:", error);
    throw error;
  }
};

// Actualizar gasto
export const actualizarGasto = async (id, gasto) => {
  try {
    const response = await fetchWithSucursal(`${API_URL}/gastos/${id}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(gasto)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error actualizando gasto");
    }
    return response.json();
  } catch (error) {
    console.error("Error actualizando gasto:", error);
    throw error;
  }
};

// Eliminar gasto
export const eliminarGasto = async (id) => {
  try {
    const response = await fetchWithSucursal(`${API_URL}/gastos/${id}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Error eliminando gasto");
    }
    return response.json();
  } catch (error) {
    console.error("Error eliminando gasto:", error);
    throw error;
  }
};

// Obtener movimientos (ingresos y gastos)
export const getMovimientos = async (mes = null, anio = null, desde = null, hasta = null) => {
  try {
    const params = new URLSearchParams();
    if (mes) params.append("mes", mes);
    if (anio) params.append("anio", anio);
    if (desde) params.append("desde", desde);
    if (hasta) params.append("hasta", hasta);
    
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const response = await fetchWithSucursal(`${API_URL}/movimientos${queryString}`);
    if (!response.ok) throw new Error("Error obteniendo movimientos");
    return response.json();
  } catch (error) {
    console.error("Error obteniendo movimientos:", error);
    throw error;
  }
};
