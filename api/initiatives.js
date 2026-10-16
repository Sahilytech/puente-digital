// api/initiatives.js - Vercel Serverless Function para Iniciativas Comunitarias
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
    // GET: Listar iniciativas (con conteo de colaboraciones)
    // ==========================================
    if (req.method === 'GET') {
      const { category } = req.query;

      let sql = `
        SELECT 
          i.id,
          i.titulo,
          i.descripcion,
          i.categoria,
          i.autor_nombre,
          i.contacto,
          i.estado,
          i.created_at,
          COUNT(c.id)::int AS total_colaboraciones
        FROM iniciativas i
        LEFT JOIN colaboraciones c ON i.id = c.iniciativa_id
      `;
      const params = [];

      if (category && category !== 'todas') {
        sql += ` WHERE i.categoria = $1`;
        params.push(category);
      }

      sql += ` GROUP BY i.id ORDER BY i.created_at DESC;`;

      const result = await query(sql, params);
      return res.status(200).json(result.rows);
    }

    // ==========================================
    // POST: Crear una nueva iniciativa digital
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

      const { titulo, descripcion, categoria, autor_nombre, contacto } = body || {};

      if (!titulo || !descripcion || !categoria || !autor_nombre || !contacto) {
        return res.status(400).json({
          error: 'Faltan campos obligatorios: titulo, descripcion, categoria, autor_nombre, contacto'
        });
      }

      const sql = `
        INSERT INTO iniciativas (titulo, descripcion, categoria, autor_nombre, contacto)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;
      `;
      const values = [
        titulo.trim(),
        descripcion.trim(),
        categoria.trim().toLowerCase(),
        autor_nombre.trim(),
        contacto.trim()
      ];

      const result = await query(sql, values);
      return res.status(201).json(result.rows[0]);
    }

    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  } catch (error) {
    console.error('Error en /api/initiatives:', error);
    return res.status(500).json({
      error: 'Error en el servidor al procesar la iniciativa',
      details: error.message
    });
  }
};
