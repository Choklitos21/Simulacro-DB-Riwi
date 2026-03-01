# 🍃 Conectar Node.js + Express con MongoDB (Local y Atlas)

Guía completa para conectar un proyecto con **JavaScript Vanilla**, **Express** y **Node.js** a MongoDB usando el **driver nativo de MongoDB** (sin Mongoose ni modelos) y **ES Modules** (`import/export`).

---

## 📁 Estructura del Proyecto

```
mi-proyecto/
├── src/
│   ├── config/
│   │   └── db.js
│   └── routes/
│       └── users.js
├── public/
│   ├── index.html
│   └── app.js
├── .env
├── .gitignore
├── server.js
└── package.json
```

---

## 1. Inicializar el Proyecto

```bash
mkdir mi-proyecto && cd mi-proyecto
npm init -y
```

### Activar ES Modules

Agrega `"type": "module"` en el `package.json`. Esto permite usar `import/export` de forma nativa en Node.js sin configuración extra.

```json
{
  "name": "mi-proyecto",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Instalar Dependencias

```bash
npm install express mongodb dotenv
npm install --save-dev nodemon
```

| Paquete    | Descripción                                        |
|------------|----------------------------------------------------|
| `express`  | Framework web para Node.js                         |
| `mongodb`  | Driver nativo oficial de MongoDB (sin ODM)         |
| `dotenv`   | Carga variables de entorno desde un archivo `.env` |
| `nodemon`  | Reinicia el servidor automáticamente en desarrollo |

> 💡 Se usa el **driver nativo `mongodb`** en lugar de Mongoose, por lo que no se definen modelos ni esquemas. Las colecciones se manejan directamente.

---

## 2. Variables de Entorno

Crea el archivo `.env` en la raíz del proyecto:

```env
# Puerto del servidor
PORT=3000

# ─── MongoDB LOCAL ────────────────────────────────────
MONGO_LOCAL_URI=mongodb://localhost:27017/mi-base-de-datos

# ─── MongoDB ATLAS ────────────────────────────────────
MONGO_ATLAS_URI=mongodb+srv://<usuario>:<password>@cluster0.xxxxx.mongodb.net/mi-base-de-datos?retryWrites=true&w=majority
```

> ⚠️ **Importante:** Agrega `.env` a tu `.gitignore` para no exponer credenciales.

```bash
# .gitignore
.env
node_modules/
```

---

## 3. Configurar la Conexión a MongoDB

Con el driver nativo se crea un `MongoClient` y se exporta tanto la función de conexión como `getDB()`, que devuelve la instancia de la base de datos para usarla directamente en las rutas.

### `src/config/db.js`

```javascript
import { MongoClient } from 'mongodb';

let db;

export const connectDB = async () => {
  try {
    // Selecciona la URI según el entorno
    const uri =
      process.env.NODE_ENV === 'production'
        ? process.env.MONGO_ATLAS_URI
        : process.env.MONGO_LOCAL_URI;

    const client = new MongoClient(uri);
    await client.connect();

    // Extrae el nombre de la base desde la URI
    const dbName = new URL(uri).pathname.replace('/', '');
    db = client.db(dbName);

    console.log(`✅ MongoDB conectado: ${client.options.hosts?.[0] ?? uri}`);
  } catch (error) {
    console.error(`❌ Error de conexión: ${error.message}`);
    process.exit(1);
  }
};

// Devuelve la instancia de la base de datos para usar en cualquier módulo
export const getDB = () => {
  if (!db) throw new Error('La base de datos no está conectada aún');
  return db;
};
```

---

## 4. Servidor Principal

### `server.js`

```javascript
import 'dotenv/config';
import express from 'express';
import { connectDB } from './src/config/db.js';
import usersRouter from './src/routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middlewares ───────────────────────────────────────
app.use(express.json());
app.use(express.static('public'));

// ── Conectar a la base de datos ───────────────────────
await connectDB();

// ── Rutas ─────────────────────────────────────────────
app.use('/api/users', usersRouter);

app.get('/', (req, res) => {
  res.send('🚀 Servidor corriendo correctamente');
});

// ── Iniciar servidor ──────────────────────────────────
app.listen(PORT, () => {
  console.log(`🌐 Servidor en http://localhost:${PORT}`);
});
```

> ℹ️ El `await` en el nivel superior (top-level await) funciona porque el archivo es tratado como un módulo ES gracias al `"type": "module"` del `package.json`.

---

## 5. Rutas de la API (CRUD)

Sin modelos, las operaciones se hacen directamente sobre la colección con `getDB()`. MongoDB asigna un `_id` de tipo `ObjectId` automáticamente a cada documento insertado.

### `src/routes/users.js`

```javascript
import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const router = Router();

// Nombre de la colección en MongoDB
const COLLECTION = 'users';

// GET - Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await getDB().collection(COLLECTION).find().toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET - Obtener un usuario por ID
router.get('/:id', async (req, res) => {
  try {
    const user = await getDB()
      .collection(COLLECTION)
      .findOne({ _id: new ObjectId(req.params.id) });

    if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Crear un usuario
router.post('/', async (req, res) => {
  try {
    const { name, email, age } = req.body;

    if (!name || !email) {
      return res.status(400).json({ message: 'name y email son obligatorios' });
    }

    const newUser = { name, email, age: age ?? null, createdAt: new Date() };
    const result = await getDB().collection(COLLECTION).insertOne(newUser);

    res.status(201).json({ _id: result.insertedId, ...newUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT - Actualizar un usuario
router.put('/:id', async (req, res) => {
  try {
    const { name, email, age } = req.body;
    const updates = { updatedAt: new Date() };

    if (name)             updates.name  = name;
    if (email)            updates.email = email;
    if (age !== undefined) updates.age  = age;

    const result = await getDB()
      .collection(COLLECTION)
      .findOneAndUpdate(
        { _id: new ObjectId(req.params.id) },
        { $set: updates },
        { returnDocument: 'after' }
      );

    if (!result) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Eliminar un usuario
router.delete('/:id', async (req, res) => {
  try {
    const result = await getDB()
      .collection(COLLECTION)
      .findOneAndDelete({ _id: new ObjectId(req.params.id) });

    if (!result) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
```

---

## 6. Cliente con JavaScript Vanilla

El frontend usa `type="module"` para aprovechar los módulos ES nativos del navegador. El código JS queda separado en su propio archivo `.js`.

### `public/index.html`

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Mi App</title>
</head>
<body>
  <h1>Usuarios</h1>

  <form id="user-form">
    <input type="text"   id="name"  placeholder="Nombre" required />
    <input type="email"  id="email" placeholder="Email"  required />
    <input type="number" id="age"   placeholder="Edad" />
    <button type="submit">Crear usuario</button>
  </form>

  <ul id="user-list"></ul>

  <!-- type="module" habilita ES Modules en el navegador -->
  <script type="module" src="./app.js"></script>
</body>
</html>
```

### `public/app.js`

```javascript
const API = '/api/users';

// ── Helper para peticiones JSON ───────────────────────
const fetchJSON = async (url, options = {}) => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
};

// ── Renderizar lista de usuarios ──────────────────────
const renderUsers = (users) => {
  const list = document.getElementById('user-list');
  list.innerHTML = users
    .map(u => `<li data-id="${u._id}">${u.name} — ${u.email}</li>`)
    .join('');
};

// ── Cargar todos los usuarios ─────────────────────────
const loadUsers = async () => {
  const users = await fetchJSON(API);
  renderUsers(users);
};

// ── Crear un usuario al enviar el formulario ──────────
document.getElementById('user-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const body = {
    name:  document.getElementById('name').value,
    email: document.getElementById('email').value,
    age:   Number(document.getElementById('age').value) || null,
  };

  await fetchJSON(API, { method: 'POST', body: JSON.stringify(body) });
  e.target.reset();
  await loadUsers();
});

// ── Punto de entrada ──────────────────────────────────
loadUsers();
```

---

## 7. MongoDB Local vs MongoDB Atlas

### 🖥️ MongoDB Local

Requiere tener **MongoDB Community Server** instalado.

```bash
# Verificar que MongoDB esté corriendo
mongod --version

# Iniciar el servicio
sudo systemctl start mongod            # Linux
brew services start mongodb-community  # macOS
```

La URI local sigue este formato:
```
mongodb://localhost:27017/nombre-de-la-base
```

---

### ☁️ MongoDB Atlas (Remoto)

1. Crea una cuenta en [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crea un **cluster gratuito (M0)**
3. En **Database Access**, crea un usuario con contraseña
4. En **Network Access**, agrega tu IP (o `0.0.0.0/0` para acceso desde cualquier lugar)
5. Haz clic en **Connect → Drivers** y copia la URI de conexión

La URI de Atlas sigue este formato:
```
mongodb+srv://usuario:password@cluster0.xxxxx.mongodb.net/mi-base?retryWrites=true&w=majority
```

> 🔒 Reemplaza `<usuario>` y `<password>` con tus credenciales reales.

---

## 8. Cambiar Entre Local y Atlas

```bash
# Usar MongoDB LOCAL (desarrollo)
NODE_ENV=development npm run dev

# Usar MongoDB ATLAS (producción)
NODE_ENV=production npm start
```

La lógica en `db.js` selecciona automáticamente la URI correcta según `NODE_ENV`.

---

## 9. Probar la API

```bash
# Crear usuario
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Ana García", "email": "ana@email.com", "age": 28}'

# Obtener todos los usuarios
curl http://localhost:3000/api/users

# Obtener usuario por ID
curl http://localhost:3000/api/users/<id>

# Actualizar un usuario
curl -X PUT http://localhost:3000/api/users/<id> \
  -H "Content-Type: application/json" \
  -d '{"age": 29}'

# Eliminar un usuario
curl -X DELETE http://localhost:3000/api/users/<id>
```

---

## ✅ Resumen

| Paso | Acción |
|------|--------|
| 1 | Inicializar proyecto, agregar `"type": "module"` e instalar dependencias |
| 2 | Configurar `.env` con URIs de Local y Atlas |
| 3 | Crear `src/config/db.js` con `MongoClient` y `getDB()` usando `import/export` |
| 4 | Montar el servidor en `server.js` con top-level `await` |
| 5 | Crear rutas CRUD en `src/routes/users.js` operando directamente sobre colecciones |
| 6 | Consumir la API desde `public/app.js` con `type="module"` en el HTML |
| 7 | Seleccionar el entorno (local o Atlas) mediante `NODE_ENV` |

---

> 💡 **Tip final:** Para producción en Atlas, considera usar servicios como **Railway**, **Render** o **Fly.io** para desplegar tu servidor Node.js con las variables de entorno configuradas directamente en el panel de la plataforma.
