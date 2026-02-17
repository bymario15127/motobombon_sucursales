// backend/database/initAllSucursales.js
// Script para inicializar datos de todas las sucursales
import { getDbConnection, getAllSucursales } from './dbManager.js';

/**
 * Inicializar datos de una sucursal específica
 */
async function initDataSucursal(sucursalId) {
  console.log(`\n📋 Inicializando datos para ${sucursalId}...`);
  
  try {
    const db = await getDbConnection(sucursalId);

    // 1. Servicios predeterminados
    const countServicios = await db.get("SELECT COUNT(*) as count FROM servicios");
    
    if (countServicios.count === 0) {
      console.log('  ➕ Insertando servicios predeterminados...');
      
      const servicios = [
        { nombre: "Lavado Básico", duracion: 30, precio: 15000, descripcion: "Lavado exterior básico con jabón premium" },
        { nombre: "Lavado Completo", duracion: 45, precio: 25000, descripcion: "Lavado completo exterior e interior" },
        { nombre: "Lavado Premium", duracion: 60, precio: 35000, descripcion: "Lavado completo + encerado + detalles" },
        { nombre: "Lavado Motor", duracion: 20, precio: 20000, descripcion: "Limpieza profunda del motor" },
        { nombre: "Brillado y Encerado", duracion: 40, precio: 30000, descripcion: "Encerado profesional con productos premium" }
      ];

      for (const servicio of servicios) {
        await db.run(
          `INSERT INTO servicios (nombre, duracion, precio, descripcion, activo) VALUES (?, ?, ?, ?, 1)`,
          [servicio.nombre, servicio.duracion, servicio.precio, servicio.descripcion]
        );
      }
      console.log(`  ✅ ${servicios.length} servicios insertados`);
    } else {
      console.log(`  ℹ️  Servicios ya existen (${countServicios.count})`);
    }

    // 2. Lavadores predeterminados
    const countLavadores = await db.get("SELECT COUNT(*) as count FROM lavadores");
    
    if (countLavadores.count === 0) {
      console.log('  ➕ Insertando lavadores predeterminados...');
      
      const lavadores = [
        { nombre: "Juan Pérez", telefono: "3001234567", email: "juan@motobombon.com" },
        { nombre: "Carlos Gómez", telefono: "3007654321", email: "carlos@motobombon.com" },
        { nombre: "Luis Martínez", telefono: "3009876543", email: "luis@motobombon.com" }
      ];

      for (const lavador of lavadores) {
        await db.run(
          `INSERT INTO lavadores (nombre, telefono, email, activo) VALUES (?, ?, ?, 1)`,
          [lavador.nombre, lavador.telefono, lavador.email]
        );
      }
      console.log(`  ✅ ${lavadores.length} lavadores insertados`);
    } else {
      console.log(`  ℹ️  Lavadores ya existen (${countLavadores.count})`);
    }

    // 3. Talleres aliados predeterminados
    const countTalleres = await db.get("SELECT COUNT(*) as count FROM talleres");
    
    if (countTalleres.count === 0) {
      console.log('  ➕ Insertando talleres aliados...');
      
      const talleres = [
        { nombre: "Taller Mecánico El Experto", direccion: "Calle 45 #12-34", telefono: "3201234567", email: "experto@taller.com", contacto: "Roberto Silva" },
        { nombre: "Motos Service Center", direccion: "Av. Principal #67-89", telefono: "3109876543", email: "service@motossc.com", contacto: "María López" }
      ];

      for (const taller of talleres) {
        await db.run(
          `INSERT INTO talleres (nombre, direccion, telefono, email, contacto, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [taller.nombre, taller.direccion, taller.telefono, taller.email, taller.contacto]
        );
      }
      console.log(`  ✅ ${talleres.length} talleres insertados`);
    } else {
      console.log(`  ℹ️  Talleres ya existen (${countTalleres.count})`);
    }

    // 4. Productos de ejemplo
    const countProductos = await db.get("SELECT COUNT(*) as count FROM productos");
    
    if (countProductos.count === 0) {
      console.log('  ➕ Insertando productos de ejemplo...');
      
      const productos = [
        { nombre: "Shampoo para Motos", categoria: "Limpieza", precio: 25000, stock: 50, descripcion: "Shampoo premium para lavado de motos" },
        { nombre: "Cera Protectora", categoria: "Protección", precio: 35000, stock: 30, descripcion: "Cera de alta calidad con protección UV" },
        { nombre: "Espuma para Motor", categoria: "Limpieza", precio: 18000, stock: 40, descripcion: "Limpiador de motor biodegradable" },
        { nombre: "Abrillantador de Llantas", categoria: "Estética", precio: 15000, stock: 60, descripcion: "Da brillo duradero a las llantas" },
        { nombre: "Toalla de Microfibra", categoria: "Accesorios", precio: 12000, stock: 100, descripcion: "Set de 3 toallas de microfibra premium" }
      ];

      for (const producto of productos) {
        await db.run(
          `INSERT INTO productos (nombre, categoria, precio, stock, descripcion, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [producto.nombre, producto.categoria, producto.precio, producto.stock, producto.descripcion]
        );
      }
      console.log(`  ✅ ${productos.length} productos insertados`);
    } else {
      console.log(`  ℹ️  Productos ya existen (${countProductos.count})`);
    }

    // 5. Clientes de ejemplo
    const countClientes = await db.get("SELECT COUNT(*) as count FROM clientes");
    
    if (countClientes.count === 0) {
      console.log('  ➕ Insertando clientes de ejemplo...');
      
      const clientes = [
        { nombre: "Pedro Ramírez", telefono: "3151234567", email: "pedro@email.com", placa: "ABC123", marca: "Yamaha", modelo: "FZ-16", cilindraje: 150, puntos: 50, lavadas: 5 },
        { nombre: "Ana García", telefono: "3159876543", email: "ana@email.com", placa: "XYZ789", marca: "Honda", modelo: "CB 190", cilindraje: 190, puntos: 30, lavadas: 3 }
      ];

      for (const cliente of clientes) {
        await db.run(
          `INSERT INTO clientes (nombre, telefono, email, placa, marca, modelo, cilindraje, puntos, lavadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [cliente.nombre, cliente.telefono, cliente.email, cliente.placa, cliente.marca, cliente.modelo, cliente.cilindraje, cliente.puntos, cliente.lavadas]
        );
      }
      console.log(`  ✅ ${clientes.length} clientes de ejemplo insertados`);
    } else {
      console.log(`  ℹ️  Clientes ya existen (${countClientes.count})`);
    }

    // 6. Usuarios administradores por sucursal
    const countUsuarios = await db.get("SELECT COUNT(*) as count FROM usuarios");
    
    if (countUsuarios.count === 0) {
      console.log('  ➕ Creando usuarios administradores...');
      
      // Contraseñas diferentes para cada sucursal
      const usuarios = sucursalId === 'sucursal1' 
        ? [
            { username: 'admin_centro', password: 'centro123', role: 'admin', name: 'Admin Centro', email: 'admin_centro@motobombon.com' },
            { username: 'supervisor_centro', password: 'supervisor_centro', role: 'supervisor', name: 'Supervisor Centro', email: 'supervisor_centro@motobombon.com' }
          ]
        : [
            { username: 'admin_sur', password: 'sur123', role: 'admin', name: 'Admin Sur', email: 'admin_sur@motobombon.com' },
            { username: 'supervisor_sur', password: 'supervisor_sur', role: 'supervisor', name: 'Supervisor Sur', email: 'supervisor_sur@motobombon.com' }
          ];

      for (const usuario of usuarios) {
        await db.run(
          `INSERT INTO usuarios (username, password, role, name, email, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [usuario.username, usuario.password, usuario.role, usuario.name, usuario.email]
        );
      }
      console.log(`  ✅ ${usuarios.length} usuarios creados`);
      console.log(`      📝 Usuario admin: ${usuarios[0].username} / ${usuarios[0].password}`);
      console.log(`      📝 Usuario supervisor: ${usuarios[1].username} / ${usuarios[1].password}`);
    } else {
      console.log(`  ℹ️  Usuarios ya existen (${countUsuarios.count})`);
    }

    console.log(`✅ ${sucursalId}: Datos inicializados correctamente`);
    
  } catch (error) {
    console.error(`❌ Error inicializando datos de ${sucursalId}:`, error.message);
    throw error;
  }
}

/**
 * Inicializar datos de todas las sucursales
 */
async function initAllDataSucursales() {
  console.log('🚀 Iniciando carga de datos para todas las sucursales...\n');
  
  const sucursales = getAllSucursales();
  
  for (const sucursal of sucursales) {
    try {
      await initDataSucursal(sucursal.id);
    } catch (error) {
      console.error(`❌ Falló inicialización de datos de ${sucursal.id}`);
    }
  }
  
  console.log('\n✅ Inicialización de datos completada para todas las sucursales');
  console.log('\n📝 NOTA: Las credenciales de administrador se crean en el primer login.');
  console.log('   Usa /login en el frontend para crear el usuario admin.');
  
  process.exit(0);
}

// Ejecutar automáticamente
initAllDataSucursales().catch(error => {
  console.error('💥 Error fatal:', error);
  process.exit(1);
});

export { initDataSucursal, initAllDataSucursales };
