// api/collaborations.js - Vercel Serverless Function para Colaboraciones y Voluntariado
const { query } = require('./db');

module.exports = async (req, res) => {
  // Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // ==========================================
    // GET: Obtener colaboraciones de una iniciativa
    // ==========================================
    if (req.method === 'GET') {
      const { initiativeId } = req.query;

      if (!initiativeId) {
        return res.status(400).json({ error: 'Parámetro initiativeId es requerido' });
      }

      const sql = `
        SELECT 
          id, 
          iniciativa_id, 
          nombre_voluntario, 
          contacto_voluntario, 
          mensaje, 
          created_at 
        FROM colaboraciones
        WHERE iniciativa_id = $1
        ORDER BY created_at DESC;
      `;
      const result = await query(sql, [initiativeId]);
      return res.status(200).json(result.rows);
    }

    // ==========================================
    // POST: Sumar una colaboración / voluntario
    // ==========================================
    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch (e) {
          return res.status(400).json({ error: 'Cuerpo de petición JSON inválido' });
        }
      }

      const { iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje } = body || {};

      if (!iniciativa_id || !nombre_voluntario || !contacto_voluntario || !mensaje) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios: iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje'
        });
      }

      // Verificar que la iniciativa exista
      const initCheck = await query('SELECT id FROM iniciativas WHERE id = $1', [iniciativa_id]);
      if (initCheck.rows.length === 0) {
        return res.status(404).json({ error: 'La iniciativa especificada no existe' });
      }

      const sql = `
        INSERT INTO colaboraciones (iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const values = [
        iniciativa_id,
        nombre_voluntario.trim(),
        contacto_voluntario.trim(),
        mensaje.trim()
      ];

      const result = await query(sql, values);
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error('Error en /api/collaborations:', error);
    return res.status(500).json({
      error: 'Error en el servidor al registrar colaboración',
      details: error.message
    });
  }
};
