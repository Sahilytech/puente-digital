// api/setup.js - Vercel Function para inicializar las 2 tablas en PostgreSQL
const { query } = require('./db');

module.exports = async (req, res) => {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // 1. Crear tabla iniciativas
    await query(`
      CREATE TABLE IF NOT EXISTS iniciativas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        descripcion TEXT NOT NULL,
        categoria VARCHAR(50) NOT NULL,
        autor_nombre VARCHAR(100) NOT NULL,
        contacto VARCHAR(120) NOT NULL,
        estado VARCHAR(20) DEFAULT 'activa',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Crear tabla colaboraciones
    await query(`
      CREATE TABLE IF NOT EXISTS colaboraciones (
        id SERIAL PRIMARY KEY,
        iniciativa_id INTEGER NOT NULL REFERENCES iniciativas(id) ON DELETE CASCADE,
        nombre_voluntario VARCHAR(100) NOT NULL,
        contacto_voluntario VARCHAR(120) NOT NULL,
        mensaje TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Insertar datos de ejemplo si está vacía
    const countCheck = await query('SELECT COUNT(*) FROM iniciativas');
    if (parseInt(countCheck.rows[0].count, 10) === 0) {
      const initResult = await query(`
        INSERT INTO iniciativas (titulo, descripcion, categoria, autor_nombre, contacto)
        VALUES 
        ('Taller de celular e internet para personas mayores', 'Buscamos voluntarios pacientes para enseñar a abuelos del centro comunitario a enviar audios, usar WhatsApp y gestionar turnos médicos online.', 'alfabetizacion', 'Centro Cultural Esperanza', 'contacto@esperanza.org'),
        ('Donación y puesta a punto de computadoras para estudiantes', 'Recolectamos notebooks o PCs en desuso para limpiarlas, instalarles software educativo y entregarlas a chicos del barrio sin acceso a internet.', 'donacion', 'Colectivo Conectando Futuros', 'conectando@futuros.ar'),
        ('Acompañamiento en trámites digitales para jubilados', 'Mesa de ayuda semanal para ayudar a vecinos a gestionar su clave de seguridad social y trámites de servicios de manera segura.', 'tramites', 'Asociación Vecinal San Martín', 'vecinos@sanmartin.org')
        RETURNING id;
      `);

      const firstId = initResult.rows[0].id;
      await query(`
        INSERT INTO colaboraciones (iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje)
        VALUES ($1, 'Lucía Gómez', 'lucia.gomez@email.com', '¡Hola! Soy estudiante de sistemas y me encantaría sumarme los sábados por la mañana para colaborar en el taller.');
      `, [firstId]);
    }

    return res.status(200).json({
      success: true,
      message: 'Base de datos inicializada correctamente con las 2 tablas (iniciativas, colaboraciones).'
    });
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al inicializar la base de datos',
      details: error.message
    });
  }
};
