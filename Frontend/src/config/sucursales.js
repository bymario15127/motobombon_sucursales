// Frontend/src/config/sucursales.js

// Configuración de todas las sucursales
export const sucursales = [
  {
    id: 'sucursal1',
    nombre: 'Sucursal Centro',
    direccion: 'Calle Principal #123',
    ciudad: 'Ciudad Central',
    telefono: '123-456-7890',
    email: 'centro@motobombon.com',
    horario: 'Lun-Sab: 8:00 AM - 6:00 PM'
  },
  {
    id: 'sucursal2',
    nombre: 'Sucursal Sur',
    direccion: 'Calle Sur #789',
    ciudad: 'Zona Sur',
    telefono: '123-456-7892',
    email: 'sur@motobombon.com',
    horario: 'Lun-Sab: 8:00 AM - 6:00 PM'
  }
];

// Función helper para obtener una sucursal por ID
export const getSucursalById = (id) => {
  return sucursales.find(sucursal => sucursal.id === id);
};

// Función helper para obtener el nombre de la sucursal desde localStorage
export const getSucursalActual = () => {
  const sucursalId = localStorage.getItem('motobombon_sucursal');
  const sucursalNombre = localStorage.getItem('motobombon_sucursal_nombre');
  return {
    id: sucursalId,
    nombre: sucursalNombre || 'Sucursal',
    sucursal: getSucursalById(sucursalId)
  };
};

export default sucursales;
