# 🌐 Puente Digital | Inclusión y Solidaridad Tecnológica

Una aplicación web comunitaria pensada para **reducir la brecha digital**, conectando a personas mayores, escuelas, comedores y vecinos que necesitan apoyo tecnológico con voluntarios y donantes dispuestos a colaborar.

---

## 🚀 Tecnologías Utilizadas

- **Frontend:** HTML5 semántico, CSS3 moderno (Grid, Flexbox, variables y diseño responsivo) y JavaScript vanilla (Fetch API y componentes dinámicos).
- **Backend:** Node.js mediante **Vercel Serverless Functions** (`/api/*.js`).
- **Base de Datos:** **PostgreSQL** relacional con 2 tablas (`iniciativas` y `colaboraciones`).
- **Hosting / Despliegue:** **Vercel** (con soporte para Serverless Functions y base de datos Postgres de Vercel, Neon o Supabase).

---

## 🗄️ Modelo de Datos (PostgreSQL - 2 Tablas)

El sistema utiliza 2 tablas relacionadas mediante clave foránea (relación 1 a N):

### 1. Tabla `iniciativas`
Almacena las causas, talleres, donaciones o necesidades digitales publicadas por la comunidad.
- `id` (SERIAL PRIMARY KEY)
- `titulo` (VARCHAR 150): Nombre de la iniciativa.
- `descripcion` (TEXT): Detalle de la necesidad comunitaria.
- `categoria` (VARCHAR 50): Eje de acción (`alfabetizacion`, `donacion`, `tramites`, `ciberseguridad`).
- `autor_nombre` (VARCHAR 100): Persona o entidad comunitaria que publica.
- `contacto` (VARCHAR 120): Email o teléfono para coordinar.
- `estado` (VARCHAR 20): `activa` o `completada`.
- `created_at` (TIMESTAMP): Fecha y hora de creación.

### 2. Tabla `colaboraciones`
Almacena las personas que se ofrecen como voluntarios o aportan donaciones a una iniciativa específica.
- `id` (SERIAL PRIMARY KEY)
- `iniciativa_id` (INTEGER REFERENCES iniciativas(id) ON DELETE CASCADE): Clave foránea que vincula la colaboración con la iniciativa.
- `nombre_voluntario` (VARCHAR 100): Nombre de quien colabora.
- `contacto_voluntario` (VARCHAR 120): Contacto del voluntario.
- `mensaje` (TEXT): Cómo planea ayudar (ej: donar equipo, dar clases, soporte técnico).
- `created_at` (TIMESTAMP): Fecha y hora del registro.

*(El script completo con datos de ejemplo se encuentra en [`schema.sql`](schema.sql)).*

---

## 📁 Estructura del Proyecto

```text
puente-digital/
├── api/                       # Vercel Serverless Functions (Node.js)
│   ├── db.js                  # Pool de conexión a PostgreSQL (pg)
│   ├── initiatives.js         # GET y POST de iniciativas
│   ├── collaborations.js      # GET y POST de colaboraciones
│   └── setup.js               # Endpoint para inicializar tablas automáticamente
├── public/                    # Frontend estático servido por Vercel
│   ├── index.html             # Estructura semántica, accesibilidad y modales
│   ├── styles.css             # Estilos modernos, responsivos y limpios
│   └── app.js                 # Lógica interactiva y consumo de APIs
├── .env.example               # Ejemplo de variables de entorno
├── package.json               # Dependencias (pg, dotenv)
├── schema.sql                 # Script SQL para crear las tablas
├── server-local.js            # Servidor HTTP para pruebas locales
├── vercel.json                # Configuración de rutas para Vercel
└── README.md                  # Documentación
```

---

## 🛠️ Instalación y Prueba Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar la base de datos:**
   Copia el archivo `.env.example` como `.env`:
   ```bash
   cp .env.example .env
   ```
   Coloca la URL de tu base de datos PostgreSQL (puedes usar una gratuita de [Neon.tech](https://neon.tech), [Supabase](https://supabase.com), [Railway](https://railway.app) o local):
   ```env
   POSTGRES_URL=postgres://usuario:password@host:5432/nombre_db?sslmode=require
   ```

3. **Crear las tablas:**
   - Puedes ejecutar el contenido de `schema.sql` en tu cliente SQL favorito, o
   - Iniciar el servidor y pulsar el botón **"Inicializar Tablas"** en la interfaz, o ingresar en el navegador a `http://localhost:3000/api/setup`.

4. **Iniciar en local:**
   ```bash
   npm start
   ```
   Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ☁️ Despliegue en Vercel

1. **Sube el código a GitHub o GitLab**.
2. **Importa el repositorio en Vercel**:
   - Ve a [vercel.com](https://vercel.com) y selecciona **Add New Project**.
3. **Crea o Vincula una Base de Datos PostgreSQL**:
   - En la pestaña **Storage** de Vercel, crea una base de datos **Vercel Postgres** (o utiliza una base de Neon / Supabase).
   - Vercel inyectará automáticamente la variable de entorno `POSTGRES_URL`.
4. **Deploy**:
   - Haz clic en **Deploy**.
   - Una vez desplegado, abre `https://tu-proyecto.vercel.app/api/setup` una única vez para crear las dos tablas e insertar los datos iniciales, o ejecútalo desde la consola de base de datos.
   - ¡Listo! Tu aplicación social digital estará funcionando en producción.
