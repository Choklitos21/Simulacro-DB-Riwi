# 🍃 Guía de MongoDB — NoSQL

MongoDB es una base de datos NoSQL orientada a documentos. Almacena datos en formato **BSON** (similar a JSON), organizados en **colecciones** (equivalente a tablas) y **documentos** (equivalente a filas).

---

## 📦 Bases de Datos y Colecciones

### Crear / Seleccionar una base de datos

```js
use miBaseDeDatos
```

> Si la base de datos no existe, MongoDB la crea automáticamente al insertar el primer documento.

### Ver bases de datos disponibles

```js
show dbs
```

### Crear una colección explícitamente

```js
db.createCollection("usuarios")
```

### Ver colecciones de la base de datos actual

```js
show collections
```

### Eliminar una base de datos

```js
db.dropDatabase()
```

### Eliminar una colección

```js
db.usuarios.drop()
```

---

## ➕ Insertar Datos

### Insertar un documento

```js
db.usuarios.insertOne({
  nombre: "Ana López",
  edad: 28,
  email: "ana@example.com",
  activo: true
})
```

### Insertar múltiples documentos

```js
db.usuarios.insertMany([
  { nombre: "Carlos Ruiz", edad: 35, email: "carlos@example.com", activo: true },
  { nombre: "María Torres", edad: 22, email: "maria@example.com", activo: false },
  { nombre: "Pedro Gómez", edad: 40, email: "pedro@example.com", activo: true }
])
```

---

## 🔍 Buscar Datos

### Obtener todos los documentos

```js
db.usuarios.find()
```

### Buscar con filtro exacto

```js
db.usuarios.find({ nombre: "Ana López" })
```

### Buscar un solo documento

```js
db.usuarios.findOne({ email: "ana@example.com" })
```

### Proyección (seleccionar campos)

```js
// Mostrar solo nombre y email (1 = incluir, 0 = excluir)
db.usuarios.find({}, { nombre: 1, email: 1, _id: 0 })
```

### Ordenar resultados

```js
db.usuarios.find().sort({ edad: 1 })   // Ascendente
db.usuarios.find().sort({ edad: -1 })  // Descendente
```

### Limitar y saltar resultados

```js
db.usuarios.find().limit(5)
db.usuarios.find().skip(10).limit(5)  // Paginación
```

---

## ✏️ Actualizar Datos

### Actualizar un documento

```js
db.usuarios.updateOne(
  { nombre: "Ana López" },         // Filtro
  { $set: { edad: 29 } }           // Cambios
)
```

### Actualizar múltiples documentos

```js
db.usuarios.updateMany(
  { activo: false },
  { $set: { activo: true } }
)
```

### Reemplazar un documento completo

```js
db.usuarios.replaceOne(
  { email: "carlos@example.com" },
  { nombre: "Carlos Ruiz", edad: 36, email: "carlos@example.com", activo: true }
)
```

### Operadores de actualización comunes

| Operador    | Descripción                              |
|-------------|------------------------------------------|
| `$set`      | Establece el valor de un campo           |
| `$unset`    | Elimina un campo del documento           |
| `$inc`      | Incrementa el valor numérico de un campo |
| `$push`     | Agrega un elemento a un array            |
| `$pull`     | Elimina un elemento de un array          |
| `$rename`   | Renombra un campo                        |

```js
// Incrementar edad en 1
db.usuarios.updateOne({ nombre: "Ana López" }, { $inc: { edad: 1 } })

// Agregar elemento a un array
db.usuarios.updateOne({ nombre: "Ana López" }, { $push: { hobbies: "lectura" } })

// Eliminar un campo
db.usuarios.updateOne({ nombre: "Ana López" }, { $unset: { activo: "" } })
```

---

## 🗑️ Eliminar Datos

### Eliminar un documento

```js
db.usuarios.deleteOne({ nombre: "Pedro Gómez" })
```

### Eliminar múltiples documentos

```js
db.usuarios.deleteMany({ activo: false })
```

### Eliminar todos los documentos de una colección

```js
db.usuarios.deleteMany({})
```

---

## 🔎 Comparadores y Operadores Lógicos

### Operadores de comparación

| Operador | Descripción               | Ejemplo                                      |
|----------|---------------------------|----------------------------------------------|
| `$eq`    | Igual a                   | `{ edad: { $eq: 28 } }`                      |
| `$ne`    | No igual a                | `{ edad: { $ne: 28 } }`                      |
| `$gt`    | Mayor que                 | `{ edad: { $gt: 25 } }`                      |
| `$gte`   | Mayor o igual que         | `{ edad: { $gte: 25 } }`                     |
| `$lt`    | Menor que                 | `{ edad: { $lt: 40 } }`                      |
| `$lte`   | Menor o igual que         | `{ edad: { $lte: 40 } }`                     |
| `$in`    | Dentro de una lista       | `{ edad: { $in: [22, 28, 35] } }`            |
| `$nin`   | No está en una lista      | `{ edad: { $nin: [22, 28] } }`               |

```js
// Usuarios mayores de 25 años
db.usuarios.find({ edad: { $gt: 25 } })

// Usuarios con edad entre 20 y 35
db.usuarios.find({ edad: { $gte: 20, $lte: 35 } })

// Usuarios con edades específicas
db.usuarios.find({ edad: { $in: [22, 28, 35] } })
```

### Operadores lógicos

| Operador | Descripción                                 |
|----------|---------------------------------------------|
| `$and`   | Todas las condiciones deben cumplirse       |
| `$or`    | Al menos una condición debe cumplirse       |
| `$not`   | Niega una condición                         |
| `$nor`   | Ninguna condición debe cumplirse            |

#### `$and`

```js
db.usuarios.find({
  $and: [
    { edad: { $gte: 25 } },
    { activo: true }
  ]
})
```

#### `$or`

```js
db.usuarios.find({
  $or: [
    { edad: { $lt: 25 } },
    { activo: false }
  ]
})
```

#### `$not`

```js
db.usuarios.find({
  edad: { $not: { $gte: 30 } }
})
```

#### `$nor`

```js
// Documentos que NO son activos NI tienen edad mayor a 30
db.usuarios.find({
  $nor: [
    { activo: true },
    { edad: { $gt: 30 } }
  ]
})
```

#### Combinando operadores

```js
db.usuarios.find({
  $and: [
    { $or: [{ edad: { $lt: 25 } }, { edad: { $gt: 35 } }] },
    { activo: true }
  ]
})
```

---

## 💡 Tips útiles

- Usa `pretty()` para formatear la salida: `db.usuarios.find().pretty()`
- Cada documento tiene un campo `_id` único generado automáticamente por MongoDB.
- MongoDB es **schemaless**: los documentos de una misma colección pueden tener estructuras diferentes.
- Para producción, considera usar **índices** con `db.coleccion.createIndex({ campo: 1 })` para mejorar el rendimiento de las búsquedas.

---

---

# 🟢 MongoDB con Node.js

En un proyecto real con Node.js se utiliza el driver oficial **`mongodb`** o el ODM **`mongoose`**. Esta sección muestra los mismos comandos anteriores pero aplicados con el **driver nativo de MongoDB**.

---

## ⚙️ Configuración inicial

### Instalación

```bash
npm install mongodb
```

### Conexión a la base de datos

```js
// db.js
const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const client = new MongoClient(URI);

let db;

async function conectar() {
  await client.connect();
  db = client.db("miBaseDeDatos"); // Selecciona o crea la DB
  console.log("✅ Conectado a MongoDB");
  return db;
}

async function desconectar() {
  await client.close();
  console.log("🔌 Desconectado de MongoDB");
}

module.exports = { conectar, desconectar, getDb: () => db };
```

### Uso en el proyecto

```js
const { conectar, getDb } = require("./db");

async function main() {
  await conectar();
  const db = getDb();
  const coleccion = db.collection("usuarios");
  // ... operaciones
}

main();
```

---

## 📦 Bases de Datos y Colecciones en Node.js

```js
// Crear/seleccionar una base de datos
const db = client.db("miBaseDeDatos");

// Crear una colección explícitamente
await db.createCollection("usuarios");

// Listar colecciones
const colecciones = await db.listCollections().toArray();
console.log(colecciones);

// Eliminar una colección
await db.collection("usuarios").drop();

// Eliminar la base de datos
await db.dropDatabase();
```

---

## ➕ Insertar Datos en Node.js

### Insertar un documento

```js
const coleccion = db.collection("usuarios");

const resultado = await coleccion.insertOne({
  nombre: "Ana López",
  edad: 28,
  email: "ana@example.com",
  activo: true
});

console.log("ID insertado:", resultado.insertedId);
```

### Insertar múltiples documentos

```js
const resultado = await coleccion.insertMany([
  { nombre: "Carlos Ruiz", edad: 35, email: "carlos@example.com", activo: true },
  { nombre: "María Torres", edad: 22, email: "maria@example.com", activo: false },
  { nombre: "Pedro Gómez", edad: 40, email: "pedro@example.com", activo: true }
]);

console.log("Documentos insertados:", resultado.insertedCount);
```

---

## 🔍 Buscar Datos en Node.js

### Obtener todos los documentos

```js
const usuarios = await coleccion.find().toArray();
console.log(usuarios);
```

### Buscar con filtro exacto

```js
const usuarios = await coleccion.find({ nombre: "Ana López" }).toArray();
```

### Buscar un solo documento

```js
const usuario = await coleccion.findOne({ email: "ana@example.com" });
console.log(usuario);
```

### Proyección (seleccionar campos)

```js
const usuarios = await coleccion
  .find({}, { projection: { nombre: 1, email: 1, _id: 0 } })
  .toArray();
```

### Ordenar resultados

```js
const ascendente = await coleccion.find().sort({ edad: 1 }).toArray();
const descendente = await coleccion.find().sort({ edad: -1 }).toArray();
```

### Limitar y saltar resultados (Paginación)

```js
const pagina = await coleccion.find().skip(10).limit(5).toArray();
```

---

## ✏️ Actualizar Datos en Node.js

### Actualizar un documento

```js
const resultado = await coleccion.updateOne(
  { nombre: "Ana López" },
  { $set: { edad: 29 } }
);

console.log("Documentos modificados:", resultado.modifiedCount);
```

### Actualizar múltiples documentos

```js
const resultado = await coleccion.updateMany(
  { activo: false },
  { $set: { activo: true } }
);

console.log("Documentos actualizados:", resultado.modifiedCount);
```

### Reemplazar un documento completo

```js
await coleccion.replaceOne(
  { email: "carlos@example.com" },
  { nombre: "Carlos Ruiz", edad: 36, email: "carlos@example.com", activo: true }
);
```

### Otros operadores de actualización

```js
// Incrementar edad en 1
await coleccion.updateOne({ nombre: "Ana López" }, { $inc: { edad: 1 } });

// Agregar elemento a un array
await coleccion.updateOne({ nombre: "Ana López" }, { $push: { hobbies: "lectura" } });

// Eliminar un campo
await coleccion.updateOne({ nombre: "Ana López" }, { $unset: { activo: "" } });
```

---

## 🗑️ Eliminar Datos en Node.js

### Eliminar un documento

```js
const resultado = await coleccion.deleteOne({ nombre: "Pedro Gómez" });
console.log("Eliminados:", resultado.deletedCount);
```

### Eliminar múltiples documentos

```js
const resultado = await coleccion.deleteMany({ activo: false });
console.log("Eliminados:", resultado.deletedCount);
```

### Eliminar todos los documentos

```js
await coleccion.deleteMany({});
```

---

## 🔎 Comparadores y Operadores Lógicos en Node.js

Los operadores son exactamente los mismos que en la shell de MongoDB, solo cambia cómo se ejecutan.

### Operadores de comparación

```js
// Usuarios mayores de 25
const usuarios = await coleccion.find({ edad: { $gt: 25 } }).toArray();

// Edad entre 20 y 35
const rango = await coleccion.find({ edad: { $gte: 20, $lte: 35 } }).toArray();

// Edades específicas
const lista = await coleccion.find({ edad: { $in: [22, 28, 35] } }).toArray();

// Que no sean de esas edades
const excluidos = await coleccion.find({ edad: { $nin: [22, 28] } }).toArray();
```

### Operadores lógicos

#### `$and`

```js
const resultado = await coleccion.find({
  $and: [
    { edad: { $gte: 25 } },
    { activo: true }
  ]
}).toArray();
```

#### `$or`

```js
const resultado = await coleccion.find({
  $or: [
    { edad: { $lt: 25 } },
    { activo: false }
  ]
}).toArray();
```

#### `$not`

```js
const resultado = await coleccion.find({
  edad: { $not: { $gte: 30 } }
}).toArray();
```

#### `$nor`

```js
const resultado = await coleccion.find({
  $nor: [
    { activo: true },
    { edad: { $gt: 30 } }
  ]
}).toArray();
```

#### Combinando operadores

```js
const resultado = await coleccion.find({
  $and: [
    { $or: [{ edad: { $lt: 25 } }, { edad: { $gt: 35 } }] },
    { activo: true }
  ]
}).toArray();
```

---

## 🗂️ Ejemplo completo: CRUD en un archivo

```js
// crud.js
const { MongoClient } = require("mongodb");

const URI = "mongodb://localhost:27017";
const client = new MongoClient(URI);

async function main() {
  await client.connect();
  const db = client.db("miBaseDeDatos");
  const col = db.collection("usuarios");

  // CREATE
  await col.insertOne({ nombre: "Ana", edad: 28, activo: true });

  // READ
  const todos = await col.find().toArray();
  console.log("Todos:", todos);

  // UPDATE
  await col.updateOne({ nombre: "Ana" }, { $set: { edad: 29 } });

  // DELETE
  await col.deleteOne({ nombre: "Ana" });

  await client.close();
}

main().catch(console.error);
```

---

## 💡 Tips para Node.js

- Siempre usa `async/await` con `try/catch` para manejar errores en las operaciones.
- Reutiliza la conexión — no abras y cierres el cliente en cada operación, conéctate una vez al iniciar el servidor.
- Si usas **Express.js**, conecta a MongoDB al iniciar la app y pasa la instancia `db` como dependencia o guárdala en un módulo compartido.
- Considera usar **Mongoose** si necesitas validaciones de esquema, middlewares, o relaciones más complejas entre colecciones.
