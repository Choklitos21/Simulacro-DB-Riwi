# Conectar PostgreSQL con Node.js + Express

> Guía para conectar tu proyecto con **PostgreSQL local** y **Supabase**, usando JS Vanilla, Node.js y Express.

---

## 📦 Requisitos previos

Asegúrate de tener instalado:

- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (para conexión local)
- Una cuenta en [Supabase](https://supabase.com/) (para conexión remota)

---

## 🗂️ Estructura del proyecto

```
mi-proyecto/
├── src/
│   ├── db/
│   │   └── connection.js
│   ├── routes/
│   │   └── users.js
│   └── app.js
├── .env
├── .gitignore
└── package.json
```

---

## 1. Inicializar el proyecto

```bash
mkdir mi-proyecto && cd mi-proyecto
npm init -y
npm install express pg dotenv
```

| Paquete   | Descripción                          |
|-----------|--------------------------------------|
| `express` | Framework web para Node.js           |
| `pg`      | Cliente oficial de PostgreSQL        |
| `dotenv`  | Manejo de variables de entorno       |

### Habilitar ES Modules

Para usar `import/export` en lugar de `require/module.exports`, agrega `"type": "module"` en tu `package.json`:

```json
{
  "name": "mi-proyecto",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node src/app.js",
    "dev": "node --watch src/app.js"
  },
  "dependencies": {
    "dotenv": "^16.0.0",
    "express": "^4.18.0",
    "pg": "^8.11.0"
  }
}
```

> ⚠️ Con `"type": "module"`, **todos** los archivos `.js` del proyecto se tratan como ES Modules. Ya no puedes usar `require()` ni `module.exports`.

---

## 2. Configurar `.gitignore`

```
node_modules/
.env
```

---

## 3. Conexión con PostgreSQL Local

### 3.1 Crear la base de datos local

```sql
-- En tu terminal con psql
CREATE DATABASE mi_base_de_datos;
CREATE USER mi_usuario WITH PASSWORD 'mi_password';
GRANT ALL PRIVILEGES ON DATABASE mi_base_de_datos TO mi_usuario;
```

### 3.2 Variables de entorno `.env`

```env
# PostgreSQL Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_base_de_datos
DB_USER=mi_usuario
DB_PASSWORD=mi_password
```

### 3.3 Archivo de conexión `src/db/connection.js`

```js
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL local');
});

pool.on('error', (err) => {
  console.error('❌ Error en la conexión:', err);
  process.exit(-1);
});

export default pool;
```

> 💡 `pg` es un módulo CommonJS, por eso se importa como `import pg from 'pg'` y luego se desestructura `Pool` del objeto importado.

---

## 4. Conexión con Supabase

### 4.1 Obtener las credenciales en Supabase

1. Ve a tu proyecto en [supabase.com](https://supabase.com/)
2. Navega a **Settings → Database**
3. Copia los datos de la sección **Connection string** o **Connection parameters**

> ⚠️ Supabase requiere **SSL** en la conexión. No olvides configurarlo.

### 4.2 Variables de entorno `.env`

```env
# Supabase (usando connection string)
DATABASE_URL=postgresql://postgres:[TU-PASSWORD]@db.[TU-REF].supabase.co:5432/postgres
```

O con parámetros individuales:

```env
DB_HOST=db.[TU-REF].supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=tu_password_de_supabase
```

### 4.3 Archivo de conexión con Supabase `src/db/connection.js`

```js
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

// Opción A: usando connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // necesario para Supabase
  },
});

// Opción B: usando parámetros individuales
// const pool = new Pool({
//   host:     process.env.DB_HOST,
//   port:     process.env.DB_PORT,
//   database: process.env.DB_NAME,
//   user:     process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   ssl: { rejectUnauthorized: false },
// });

pool.on('connect', () => {
  console.log('✅ Conectado a Supabase PostgreSQL');
});

export default pool;
```

---

## 5. Conexión dinámica (Local o Supabase según entorno)

Puedes usar una sola configuración que funcione en ambos entornos:

```js
// src/db/connection.js
import pg from 'pg';
import 'dotenv/config';

const { Pool } = pg;

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool(
  isProduction
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      }
    : {
        host:     process.env.DB_HOST,
        port:     process.env.DB_PORT,
        database: process.env.DB_NAME,
        user:     process.env.DB_USER,
        password: process.env.DB_PASSWORD,
      }
);

export default pool;
```

En tu `.env` tendrías ambas configuraciones y cambiarías `NODE_ENV`:

```env
NODE_ENV=development   # o production

# Local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_base_de_datos
DB_USER=mi_usuario
DB_PASSWORD=mi_password

# Supabase
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
```

---

## 6. Configurar Express `src/app.js`

```js
import express from 'express';
import 'dotenv/config';
import pool from './db/connection.js';

const app = express();
app.use(express.json());

// Ruta de prueba: obtener usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM usuarios');
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
  }
});

// Ruta de prueba: crear usuario
app.post('/usuarios', async (req, res) => {
  const { nombre, email } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO usuarios (nombre, email) VALUES ($1, $2) RETURNING *',
      [nombre, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al crear el usuario' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
```

> ⚠️ Con ES Modules, las importaciones locales **deben incluir la extensión del archivo**: `'./db/connection.js'` y no `'./db/connection'`.

---

## 7. Probar la conexión

Los scripts ya fueron configurados en el `package.json` del paso 1. Solo ejecuta:

```bash
npm run dev
```

Prueba los endpoints con `curl` o [Postman](https://www.postman.com/):

```bash
# Obtener usuarios
curl http://localhost:3000/usuarios

# Crear usuario
curl -X POST http://localhost:3000/usuarios \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Ana García", "email": "ana@ejemplo.com"}'
```

---

## 8. Tabla de diferencias: Local vs Supabase

| Característica     | PostgreSQL Local        | Supabase                        |
|--------------------|-------------------------|---------------------------------|
| **SSL**            | No requerido            | Requerido (`rejectUnauthorized: false`) |
| **Host**           | `localhost`             | `db.[ref].supabase.co`          |
| **Credenciales**   | Configuradas por ti     | Generadas por Supabase          |
| **Uso ideal**      | Desarrollo local        | Producción / staging            |
| **Connection string** | Opcional             | Recomendado                     |

---

## ✅ Checklist final

- [ ] `.env` creado y en `.gitignore`
- [ ] `pg` y `dotenv` instalados
- [ ] SSL configurado para Supabase
- [ ] Pool de conexiones exportado correctamente
- [ ] Variables de entorno correctas según el entorno

---

> 💡 **Tip:** Para proyectos más grandes, considera usar un ORM como [Prisma](https://www.prisma.io/) o [Drizzle](https://orm.drizzle.team/) que soportan tanto PostgreSQL local como Supabase.
