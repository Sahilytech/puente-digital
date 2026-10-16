-- ==============================================================
-- PROYECTO: PUENTE DIGITAL (Inclusión & Solidaridad Digital)
-- Base de datos: PostgreSQL (2 tablas con relación 1 a N)
-- ==============================================================

-- 1. Tabla: INICIATIVAS (Causas, talleres, necesidades de equipos o apoyo digital)
CREATE TABLE IF NOT EXISTS iniciativas (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria VARCHAR(50) NOT NULL CHECK (categoria IN ('alfabetizacion', 'donacion', 'tramites', 'ciberseguridad')),
    autor_nombre VARCHAR(100) NOT NULL,
    contacto VARCHAR(120) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN ('activa', 'completada')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla: COLABORACIONES (Voluntarios y apoyo que se suman a una iniciativa)
CREATE TABLE IF NOT EXISTS colaboraciones (
    id SERIAL PRIMARY KEY,
    iniciativa_id INTEGER NOT NULL REFERENCES iniciativas(id) ON DELETE CASCADE,
    nombre_voluntario VARCHAR(100) NOT NULL,
    contacto_voluntario VARCHAR(120) NOT NULL,
    mensaje TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas frecuentes
CREATE INDEX IF NOT EXISTS idx_iniciativas_categoria ON iniciativas(categoria);
CREATE INDEX IF NOT EXISTS idx_colaboraciones_iniciativa ON colaboraciones(iniciativa_id);

-- ==============================================================
-- DATOS SEMILLA (Ejemplos iniciales)
-- ==============================================================
INSERT INTO iniciativas (titulo, descripcion, categoria, autor_nombre, contacto, estado)
VALUES 
(
    'Taller de celular e internet para personas mayores', 
    'Buscamos personas pacientes para enseñar a abuelos del centro comunitario a enviar mensajes de voz, usar WhatsApp y sacar turnos médicos online.', 
    'alfabetizacion', 
    'Centro Cultural Esperanza', 
    'contacto@esperanza.org',
    'activa'
),
(
    'Donación y puesta a punto de computadoras para estudiantes', 
    'Recolectamos notebooks o PCs en desuso para limpiarlas, instalarles software educativo y entregarlas a chicos del barrio sin acceso a internet.', 
    'donacion', 
    'Colectivo Conectando Futuros', 
    'conectando@futuros.ar',
    'activa'
),
(
    'Acompañamiento en trámites digitales para jubilados', 
    'Mesa de ayuda semanal para ayudar a vecinos a gestionar su clave de seguridad social y trámites del banco digital de manera segura.', 
    'tramites', 
    'Asociación Vecinal San Martín', 
    'vecinos@sanmartin.org',
    'activa'
);

INSERT INTO colaboraciones (iniciativa_id, nombre_voluntario, contacto_voluntario, mensaje)
VALUES 
(
    1, 
    'Lucía Gómez', 
    'lucia.gomez@email.com', 
    '¡Hola! Soy estudiante de sistemas y me encantaría sumarme los sábados por la mañana para colaborar en el taller.'
),
(
    2, 
    'Marcos Dell', 
    'marcos.tec@email.com', 
    'Tengo 2 laptops con disco SSD listas para donar y puedo ayudar formateando equipos.'
);
