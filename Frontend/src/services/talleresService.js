// Frontend/src/services/talleresService.js
import { fetchWithSucursal, getHeaders } from './apiHelper.js';

class TalleresService {
  async getTalleres() {
    const response = await fetchWithSucursal('/api/talleres');
    if (!response.ok) throw new Error('Error al obtener talleres');
    return response.json();
  }

  async getTalleresAdmin() {
    const response = await fetchWithSucursal('/api/talleres/admin/all');
    if (!response.ok) throw new Error('Error al obtener talleres');
    return response.json();
  }

  async createTaller(data) {
    const response = await fetchWithSucursal('/api/talleres', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al crear taller');
    return response.json();
  }

  async updateTaller(id, data) {
    const response = await fetchWithSucursal(`/api/talleres/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Error al actualizar taller');
    return response.json();
  }

  async deleteTaller(id) {
    const response = await fetchWithSucursal(`/api/talleres/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Error al eliminar taller');
    return response.json();
  }
}

export default new TalleresService();
