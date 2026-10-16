// api/db.js - Conexión para PostgreSQL con fallback en memoria para desarrollo
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

let pool = null;
let useMemoryFallback = false;

if (connectionString) {
  const isLocalhost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pool = new Pool({
    connectionString: connectionString,
    ssl: isLocalhost ? false : { rejectUnauthorized: false }
  });
} else {
  useMemoryFallback = true;
  console.log('ℹ️ [MODO DEMO]: No se detectó POSTGRES_URL en .env. Se usará almacenamiento en memoria para las 2 tablas.');
}

// ====================================================================
// SIMULADOR DE LAS 2 TABLAS EN MEMORIA (Iniciativas y Colaboraciones)
// Permite ejecutar y probar la aplicación inmediatamente sin base de datos externa
// ====================================================================
let memoryIniciativas = [
  {
    id: 1,
    titulo: 'Taller de celular e internet para personas mayores',
    descripcion: 'Buscamos voluntarios pacientes para enseñar a abuelos del centro comunitario a enviar audios, usar WhatsApp y gestionar turnos médicos online.',
    categoria: 'alfabetizacion',
    autor_nombre: 'Centro Cultural Esperanza',
    contacto: 'contacto@esperanza.org',
    estado: 'activa',
    created_at: new Date('2026-10-10T10:00:00Z')
  },
  {
    id: 2,
    titulo: 'Donación y puesta a punto de computadoras para estudiantes',
    descripcion: 'Recolectamos notebooks o PCs en desuso para limpiarlas, instalarles software educativo y entregarlas a chicos del barrio sin acceso a internet.',
    categoria: 'donacion',
    autor_nombre: 'Colectivo Conectando Futuros',
    contacto: 'conectando@futuros.ar',
    estado: 'activa',
    created_at: new Date('2026-10-12T14:30:00Z')
  },
  {
    id: 3,
    titulo: 'Acompañamiento en trámites digitales para jubilados',
    descripcion: 'Mesa de ayuda semanal para ayudar a vecinos a gestionar su clave de seguridad social y trámites de servicios de manera segura.',
    categoria: 'tramites',
    autor_nombre: 'Asociación Vecinal San Martín',
    contacto: 'vecinos@sanmartin.org',
    estado: 'activa',
    created_at: new Date('2026-10-14T18:00:00Z')
  }
];

let memoryColaboraciones = [
  {
    id: 1,
    iniciativa_id: 1,
    nombre_voluntario: 'Lucía Gómez',
    contacto_voluntario: 'lucia.gomez@email.com',
    mensaje: '¡Hola! Soy estudiante de sistemas y me encantaría sumarme los sábados por la mañana para colaborar en el taller.',
    created_at: new Date('2026-10-11T11:20:00Z')
  },
  {
    id: 2,
    iniciativa_id: 2,
    nombre_voluntario: 'Marcos Dell',
    contacto_voluntario: 'marcos.tec@email.com',
    mensaje: 'Tengo 2 laptops con disco SSD listas para donar y puedo ayudar formateando equipos.',
    created_at: new Date('2026-10-13T16:45:00Z')
  }
];

let nextInitId = 4;
let nextCollabId = 3;

async function query(text, params = []) {
  // Si hay conexión configurada a PostgreSQL, ejecutar en PostgreSQL real
  if (!useMemoryFallback && pool) {
    try {
      return await pool.query(text, params);
    } catch (err) {
      console.warn('⚠️ Error al consultar PostgreSQL real, usando fallback en memoria:', err.message);
    }
  }

  // --- Emulación de consultas SQL para las 2 tablas ---
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

  // 1. SELECT COUNT iniciativas
  if (normalized.includes('select count(*) from iniciativas')) {
    return { rows: [{ count: memoryIniciativas.length }] };
  }

  // 2. CREATE TABLE
  if (normalized.includes('create table')) {
    return { rows: [] };
  }

  // 3. SELECT iniciativas con conteo de colaboraciones
  if (normalized.includes('from iniciativas') && normalized.includes('count(c.id)')) {
    let list = [...memoryIniciativas];
    if (params && params.length > 0) {
      list = list.filter(item => item.categoria === params[0]);
    }

    const mapped = list.map(item => {
      const collabs = memoryColaboraciones.filter(c => c.iniciativa_id === item.id);
      return {
        ...item,
        total_colaboraciones: collabs.length
      };
    });

    mapped.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: mapped };
  }

  // 4. INSERT INTO iniciativas
  if (normalized.includes('insert into iniciativas')) {
    const [titulo, descripcion, categoria, autor_nombre, contacto] = params;
    const newInit = {
      id: nextInitId++,
      titulo,
      descripcion,
      categoria,
      autor_nombre,
      contacto,
      estado: 'activa',
      created_at: new Date()
    };
    memoryIniciativas.unshift(newInit);
    return { rows: [newInit] };
  }

  // 5. SELECT id FROM iniciativas WHERE id = $1
  if (normalized.includes('select id from iniciativas where id = $1')) {
    const found = memoryIniciativas.filter(i => i.id === params[0]);
    return { rows: found };
  }

  // 6. SELECT colaboraciones WHERE iniciativa_id = $1
  if (normalized.includes('from colaboraciones where iniciativa_id = $1')) {
    const found = memoryColaboraciones
      .filter(c => c.iniciativa_id === parseInt(params[0], 10))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return { rows: found };
  }

  // 7. INSERT INTO colaboraciones
  if (normalized.includes('insert into colaboraciones')) {
    const [iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje] = params;
    const newCollab = {
      id: nextCollabId++,
      iniciativa_id: parseInt(iniciativa_id, 10),
      nombre_voluntario,
      contacto_voluntario,
      mensaje,
      created_at: new Date()
    };
    memoryColaboraciones.unshift(newCollab);
    return { rows: [newCollab] };
  }

  return { rows: [] };
}

module.exports = {
  pool,
  query
};
