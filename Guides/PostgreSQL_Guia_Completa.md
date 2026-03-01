# 🐘 Guía Completa de SQL en PostgreSQL

Guía de referencia orientada a **PostgreSQL**, que cubre los cinco grupos de comandos SQL más tipos de datos, vistas y procedimientos almacenados.

---

## 0. 🗂️ Tipos de Datos en PostgreSQL

PostgreSQL ofrece un sistema de tipos muy rico y extensible.

### Numéricos
```sql
-- Enteros
smallint        -- 2 bytes, -32768 a 32767
integer / int   -- 4 bytes, ~±2.1 mil millones
bigint          -- 8 bytes, muy grandes

-- Auto-incrementales (equivalente a AUTO_INCREMENT de MySQL)
smallserial     -- 2 bytes, 1 a 32767
serial          -- 4 bytes, 1 a ~2.1 mil millones
bigserial       -- 8 bytes

-- Decimales
numeric(10, 2)  -- Precisión exacta (ej: precios)
decimal(10, 2)  -- Igual que numeric
real            -- 4 bytes, precisión flotante
double precision -- 8 bytes, doble precisión

-- Ejemplo de uso
CREATE TABLE productos (
    id          SERIAL PRIMARY KEY,
    precio      NUMERIC(10, 2) NOT NULL,
    descuento   REAL DEFAULT 0.0,
    stock       INTEGER DEFAULT 0
);
```

### Texto y Caracteres
```sql
char(n)         -- Longitud fija, rellena con espacios
varchar(n)      -- Longitud variable hasta n caracteres
text            -- Longitud ilimitada (recomendado en PostgreSQL)

-- Ejemplo
CREATE TABLE articulos (
    codigo      CHAR(10),
    titulo      VARCHAR(255) NOT NULL,
    descripcion TEXT
);
```

### Fecha y Hora
```sql
date                        -- Solo fecha: '2024-03-15'
time                        -- Solo hora: '14:30:00'
time with time zone         -- Hora con zona horaria
timestamp                   -- Fecha y hora: '2024-03-15 14:30:00'
timestamp with time zone    -- (recomendado) = timestamptz
interval                    -- Duración: '3 days', '2 hours'

-- Ejemplo
CREATE TABLE eventos (
    id          SERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    inicio      TIMESTAMPTZ DEFAULT NOW(),
    fin         TIMESTAMPTZ,
    duracion    INTERVAL GENERATED ALWAYS AS (fin - inicio) STORED
);
```

### Booleano
```sql
boolean    -- TRUE, FALSE, NULL

CREATE TABLE usuarios (
    id      SERIAL PRIMARY KEY,
    activo  BOOLEAN DEFAULT TRUE
);
```

### Identificadores únicos
```sql
uuid    -- Identificador único universal: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE sesiones (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id  INTEGER NOT NULL,
    creada_en   TIMESTAMPTZ DEFAULT NOW()
);
```

### JSON
```sql
json    -- Almacena JSON como texto plano
jsonb   -- JSON binario (más eficiente, recomendado para búsquedas)

CREATE TABLE configuraciones (
    id        SERIAL PRIMARY KEY,
    usuario_id INTEGER,
    datos     JSONB
);

-- Insertar JSON
INSERT INTO configuraciones (usuario_id, datos)
VALUES (1, '{"tema": "oscuro", "idioma": "es", "notificaciones": true}');

-- Consultar dentro de JSONB
SELECT datos->>'tema' AS tema FROM configuraciones WHERE usuario_id = 1;

-- Filtrar por campo JSON
SELECT * FROM configuraciones WHERE datos->>'idioma' = 'es';
```

### Arrays
```sql
-- PostgreSQL soporta arrays de cualquier tipo
CREATE TABLE encuestas (
    id          SERIAL PRIMARY KEY,
    respuestas  INTEGER[],
    etiquetas   TEXT[]
);

INSERT INTO encuestas (respuestas, etiquetas)
VALUES (ARRAY[1, 3, 5], ARRAY['urgente', 'soporte']);

-- Consultar arrays
SELECT * FROM encuestas WHERE 'urgente' = ANY(etiquetas);
```

### Tipos especiales
```sql
bytea       -- Datos binarios (imágenes, archivos)
cidr        -- Dirección de red: '192.168.0.0/24'
inet        -- Dirección IP: '192.168.1.1'
macaddr     -- Dirección MAC
point       -- Punto geométrico: (x, y)
money       -- Valor monetario con símbolo de moneda
```

### Enumerados (ENUM personalizados)
```sql
-- Crear tipo ENUM
CREATE TYPE estado_pedido AS ENUM ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado');

CREATE TABLE pedidos (
    id      SERIAL PRIMARY KEY,
    estado  estado_pedido DEFAULT 'pendiente'
);
```

---

## 1. DDL — Data Definition Language
> Define y modifica la estructura de la base de datos.

### `CREATE` — Crear objetos
```sql
-- Crear base de datos con configuración
CREATE DATABASE tienda
    WITH ENCODING = 'UTF8'
    LC_COLLATE = 'es_CO.UTF-8'
    LC_CTYPE   = 'es_CO.UTF-8';

-- Crear esquema (namespacing)
CREATE SCHEMA ventas;
CREATE SCHEMA inventario;

-- Crear tabla con PostgreSQL idiomático
CREATE TABLE ventas.clientes (
    id          BIGSERIAL PRIMARY KEY,
    nombre      TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    telefono    VARCHAR(20),
    activo      BOOLEAN DEFAULT TRUE,
    metadata    JSONB,
    fecha_alta  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_email CHECK (email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$')
);

-- Crear índice (regular y parcial)
CREATE INDEX idx_clientes_email ON ventas.clientes(email);
CREATE INDEX idx_clientes_activos ON ventas.clientes(id) WHERE activo = TRUE;

-- Índice en campo JSONB
CREATE INDEX idx_metadata ON ventas.clientes USING GIN(metadata);
```

### `ALTER` — Modificar objetos
```sql
-- Agregar columna
ALTER TABLE ventas.clientes ADD COLUMN direccion TEXT;

-- Cambiar tipo de columna
ALTER TABLE ventas.clientes ALTER COLUMN telefono TYPE TEXT;

-- Establecer valor por defecto
ALTER TABLE ventas.clientes ALTER COLUMN activo SET DEFAULT TRUE;

-- Agregar restricción NOT NULL
ALTER TABLE ventas.clientes ALTER COLUMN nombre SET NOT NULL;

-- Renombrar columna
ALTER TABLE ventas.clientes RENAME COLUMN telefono TO celular;

-- Renombrar tabla
ALTER TABLE ventas.clientes RENAME TO usuarios;

-- Eliminar columna
ALTER TABLE ventas.clientes DROP COLUMN direccion;
```

### `DROP` — Eliminar objetos
```sql
-- Eliminar tabla (CASCADE elimina dependencias)
DROP TABLE IF EXISTS ventas.clientes CASCADE;

-- Eliminar base de datos
DROP DATABASE IF EXISTS tienda;

-- Eliminar índice
DROP INDEX IF EXISTS idx_clientes_email;

-- Eliminar esquema con todo su contenido
DROP SCHEMA IF EXISTS ventas CASCADE;

-- Eliminar tipo ENUM
DROP TYPE IF EXISTS estado_pedido;
```

### `TRUNCATE` — Vaciar tablas
```sql
-- Vaciar tabla y reiniciar secuencias
TRUNCATE TABLE ventas.clientes RESTART IDENTITY;

-- Vaciar múltiples tablas en cascada
TRUNCATE TABLE pedidos, detalle_pedidos RESTART IDENTITY CASCADE;
```

---

## 2. DML — Data Manipulation Language
> Insertar, actualizar y eliminar datos.

### `INSERT` — Insertar registros
```sql
-- Insertar un registro
INSERT INTO ventas.clientes (nombre, email)
VALUES ('Ana García', 'ana@email.com');

-- Insertar y retornar el ID generado (muy útil en PostgreSQL)
INSERT INTO ventas.clientes (nombre, email)
VALUES ('Carlos López', 'carlos@email.com')
RETURNING id, fecha_alta;

-- Insertar múltiples registros
INSERT INTO ventas.clientes (nombre, email) VALUES
    ('María Torres',  'maria@email.com'),
    ('Pedro Ramírez', 'pedro@email.com'),
    ('Sofía Ruiz',    'sofia@email.com');

-- INSERT ... ON CONFLICT (UPSERT) — exclusivo de PostgreSQL
INSERT INTO ventas.clientes (nombre, email)
VALUES ('Ana García', 'ana@email.com')
ON CONFLICT (email) DO UPDATE
    SET nombre = EXCLUDED.nombre,
        fecha_alta = NOW();

-- Ignorar conflictos
INSERT INTO ventas.clientes (nombre, email)
VALUES ('Ana García', 'ana@email.com')
ON CONFLICT (email) DO NOTHING;
```

### `UPDATE` — Actualizar registros
```sql
-- Actualizar un campo
UPDATE ventas.clientes
SET email = 'nuevo@email.com'
WHERE id = 1;

-- Actualizar con RETURNING
UPDATE ventas.clientes
SET activo = FALSE
WHERE fecha_alta < NOW() - INTERVAL '2 years'
RETURNING id, nombre;

-- Actualizar campo JSONB
UPDATE ventas.clientes
SET metadata = metadata || '{"verificado": true}'::jsonb
WHERE id = 1;

-- Actualizar desde otra tabla (UPDATE ... FROM)
UPDATE pedidos p
SET estado = 'enviado'
FROM clientes c
WHERE p.cliente_id = c.id AND c.email = 'ana@email.com';
```

### `DELETE` — Eliminar registros
```sql
-- Eliminar con RETURNING
DELETE FROM ventas.clientes
WHERE activo = FALSE
RETURNING id, nombre, email;

-- Eliminar con subconsulta
DELETE FROM pedidos
WHERE cliente_id IN (
    SELECT id FROM ventas.clientes WHERE activo = FALSE
);
```

---

## 3. DQL — Data Query Language
> Consultar y recuperar datos.

### `SELECT` — Consultas básicas
```sql
-- Consulta básica
SELECT * FROM ventas.clientes;

-- Con alias (PostgreSQL no usa comillas simples para alias)
SELECT nombre AS cliente, email AS correo FROM ventas.clientes;

-- Filtros y operadores
SELECT * FROM ventas.clientes
WHERE activo = TRUE
  AND fecha_alta > NOW() - INTERVAL '6 months';

-- ILIKE (búsqueda case-insensitive, exclusivo de PostgreSQL)
SELECT * FROM ventas.clientes WHERE nombre ILIKE '%garcía%';

-- Expresiones regulares
SELECT * FROM ventas.clientes WHERE email ~ '^ana';
```

### Funciones de agregación y agrupación
```sql
-- Agregaciones comunes
SELECT
    DATE_TRUNC('month', fecha_alta) AS mes,
    COUNT(*)                        AS nuevos_clientes,
    COUNT(*) FILTER (WHERE activo)  AS activos
FROM ventas.clientes
GROUP BY mes
ORDER BY mes DESC;
```

### JOINs
```sql
-- INNER JOIN
SELECT c.nombre, p.id AS pedido, p.total
FROM ventas.clientes c
INNER JOIN pedidos p ON c.id = p.cliente_id;

-- LEFT JOIN con COALESCE
SELECT c.nombre, COALESCE(SUM(p.total), 0) AS total_compras
FROM ventas.clientes c
LEFT JOIN pedidos p ON c.id = p.cliente_id
GROUP BY c.nombre
ORDER BY total_compras DESC;
```

### CTEs y Window Functions
```sql
-- CTE (Common Table Expression)
WITH resumen_mensual AS (
    SELECT
        cliente_id,
        DATE_TRUNC('month', fecha) AS mes,
        SUM(total) AS total_mes
    FROM pedidos
    GROUP BY cliente_id, mes
)
SELECT c.nombre, r.mes, r.total_mes
FROM ventas.clientes c
JOIN resumen_mensual r ON c.id = r.cliente_id
ORDER BY r.mes DESC, r.total_mes DESC;

-- CTE recursivo (ej: jerarquía de categorías)
WITH RECURSIVE categoria_arbol AS (
    SELECT id, nombre, padre_id, 0 AS nivel
    FROM categorias WHERE padre_id IS NULL

    UNION ALL

    SELECT c.id, c.nombre, c.padre_id, ct.nivel + 1
    FROM categorias c
    JOIN categoria_arbol ct ON c.padre_id = ct.id
)
SELECT * FROM categoria_arbol ORDER BY nivel, nombre;

-- Window Functions
SELECT
    nombre,
    total,
    RANK()        OVER (ORDER BY total DESC)            AS ranking,
    ROW_NUMBER()  OVER (PARTITION BY categoria ORDER BY total DESC) AS rank_categoria,
    LAG(total)    OVER (ORDER BY fecha)                 AS total_anterior,
    SUM(total)    OVER (PARTITION BY cliente_id)        AS total_acumulado
FROM pedidos;
```

---

## 4. DCL — Data Control Language
> Gestiona los permisos de acceso.

### `GRANT` — Otorgar permisos
```sql
-- Crear rol (en PostgreSQL se usa CREATE ROLE, no CREATE USER)
CREATE ROLE vendedor LOGIN PASSWORD 'pass123';
CREATE ROLE analista LOGIN PASSWORD 'pass456';
CREATE ROLE admin_app LOGIN PASSWORD 'adminpass';

-- Otorgar permisos sobre esquema
GRANT USAGE ON SCHEMA ventas TO vendedor;
GRANT USAGE ON SCHEMA ventas TO analista;

-- Otorgar permisos sobre tablas
GRANT SELECT, INSERT, UPDATE ON ventas.clientes TO vendedor;
GRANT SELECT ON ALL TABLES IN SCHEMA ventas TO analista;

-- Otorgar sobre secuencias (necesario para INSERT con SERIAL)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ventas TO vendedor;

-- Permisos por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA ventas
    GRANT SELECT ON TABLES TO analista;
```

### `REVOKE` — Revocar permisos
```sql
-- Revocar permiso específico
REVOKE INSERT ON ventas.clientes FROM vendedor;

-- Revocar todos los permisos
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA ventas FROM vendedor;

-- Eliminar rol
DROP ROLE IF EXISTS vendedor;
```

---

## 5. TCL — Transaction Control Language
> Gestiona transacciones para garantizar la integridad ACID.

### Transacciones en PostgreSQL
```sql
-- Iniciar transacción (PostgreSQL usa BEGIN)
BEGIN;

    UPDATE cuentas SET saldo = saldo - 500 WHERE id = 1;
    UPDATE cuentas SET saldo = saldo + 500 WHERE id = 2;

COMMIT;

-- Transacción con manejo de error
BEGIN;
    DELETE FROM pedidos WHERE cliente_id = 10;
ROLLBACK; -- Revertir si algo falló

-- SAVEPOINT
BEGIN;
    INSERT INTO ventas.clientes (nombre, email) VALUES ('Luis Pérez', 'luis@email.com');
    SAVEPOINT sp1;

    INSERT INTO ventas.clientes (nombre, email) VALUES ('Sofía Ruiz', 'sofia@email.com');

    ROLLBACK TO SAVEPOINT sp1; -- Deshace solo a partir de sp1

COMMIT; -- Solo se guarda Luis Pérez

-- Nivel de aislamiento
BEGIN ISOLATION LEVEL SERIALIZABLE;
    -- Operaciones críticas
COMMIT;
```

---

## 6. 👁️ Vistas (VIEWS)
> Las vistas son consultas guardadas que actúan como tablas virtuales.

### Vista simple
```sql
CREATE OR REPLACE VIEW ventas.v_clientes_activos AS
SELECT
    id,
    nombre,
    email,
    fecha_alta,
    NOW() - fecha_alta AS antiguedad
FROM ventas.clientes
WHERE activo = TRUE;

-- Usar la vista
SELECT * FROM ventas.v_clientes_activos WHERE antiguedad > INTERVAL '1 year';
```

### Vista con `WITH CHECK OPTION`
```sql
-- Garantiza que los INSERT/UPDATE a través de la vista cumplan la condición
CREATE OR REPLACE VIEW ventas.v_clientes_nuevos AS
SELECT id, nombre, email, fecha_alta
FROM ventas.clientes
WHERE fecha_alta >= NOW() - INTERVAL '30 days'
WITH CHECK OPTION;
```

### Vista materializada (MATERIALIZED VIEW)
> Guarda físicamente el resultado de la consulta para mejorar el rendimiento.

```sql
-- Crear vista materializada
CREATE MATERIALIZED VIEW ventas.mv_resumen_mensual AS
SELECT
    DATE_TRUNC('month', p.fecha) AS mes,
    c.nombre                     AS cliente,
    COUNT(p.id)                  AS total_pedidos,
    SUM(p.total)                 AS facturacion
FROM pedidos p
JOIN ventas.clientes c ON p.cliente_id = c.id
GROUP BY mes, c.nombre
ORDER BY mes DESC;

-- Refrescar la vista materializada
REFRESH MATERIALIZED VIEW ventas.mv_resumen_mensual;

-- Refrescar sin bloquear lecturas simultáneas (requiere índice único)
CREATE UNIQUE INDEX ON ventas.mv_resumen_mensual(mes, cliente);
REFRESH MATERIALIZED VIEW CONCURRENTLY ventas.mv_resumen_mensual;

-- Eliminar vista materializada
DROP MATERIALIZED VIEW IF EXISTS ventas.mv_resumen_mensual;
```

### Diferencias clave

| Característica       | Vista simple        | Vista materializada     |
|----------------------|---------------------|-------------------------|
| Datos almacenados    | No (virtual)        | Sí (en disco)           |
| Velocidad lectura    | Depende del query   | Muy rápida              |
| Actualización        | Automática          | Manual (`REFRESH`)      |
| Soporta índices      | No                  | Sí                      |
| Uso recomendado      | Queries simples     | Reportes y dashboards   |

---

## 7. ⚙️ Procedimientos Almacenados y Funciones

PostgreSQL distingue entre **funciones** (`FUNCTION`) y **procedimientos** (`PROCEDURE`). Las funciones retornan un valor; los procedimientos (desde PG 11) no necesariamente.

### Funciones (`CREATE FUNCTION`)
```sql
-- Función simple que retorna un valor escalar
CREATE OR REPLACE FUNCTION ventas.calcular_descuento(
    precio    NUMERIC,
    porcentaje NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN precio - (precio * porcentaje / 100);
END;
$$;

-- Llamar la función
SELECT ventas.calcular_descuento(1000.00, 15);
SELECT nombre, ventas.calcular_descuento(precio, 10) AS precio_con_descuento
FROM productos;
```

### Función que retorna una tabla
```sql
CREATE OR REPLACE FUNCTION ventas.obtener_pedidos_cliente(
    p_cliente_id INTEGER
)
RETURNS TABLE (
    pedido_id   INTEGER,
    fecha       TIMESTAMPTZ,
    total       NUMERIC,
    estado      TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
        SELECT p.id, p.fecha, p.total, p.estado::TEXT
        FROM pedidos p
        WHERE p.cliente_id = p_cliente_id
        ORDER BY p.fecha DESC;
END;
$$;

-- Usar la función como tabla
SELECT * FROM ventas.obtener_pedidos_cliente(5);
```

### Función con lógica condicional y manejo de errores
```sql
CREATE OR REPLACE FUNCTION ventas.registrar_pago(
    p_pedido_id INTEGER,
    p_monto     NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_total   NUMERIC;
    v_estado  TEXT;
BEGIN
    -- Obtener datos del pedido
    SELECT total, estado INTO v_total, v_estado
    FROM pedidos
    WHERE id = p_pedido_id;

    -- Validaciones
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pedido % no encontrado', p_pedido_id;
    END IF;

    IF v_estado = 'pagado' THEN
        RETURN 'El pedido ya está pagado';
    END IF;

    IF p_monto < v_total THEN
        RAISE EXCEPTION 'Monto insuficiente: se requieren % y se recibieron %', v_total, p_monto;
    END IF;

    -- Registrar pago
    UPDATE pedidos SET estado = 'pagado', fecha_pago = NOW()
    WHERE id = p_pedido_id;

    RETURN FORMAT('Pago de %s registrado correctamente para el pedido %s', p_monto, p_pedido_id);

EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error inesperado: %', SQLERRM;
        RETURN 'Error al registrar pago';
END;
$$;

-- Ejecutar
SELECT ventas.registrar_pago(10, 250.00);
```

### Procedimientos (`CREATE PROCEDURE`)
> Disponibles desde PostgreSQL 11. Se llaman con `CALL`, y pueden gestionar transacciones internas.

```sql
CREATE OR REPLACE PROCEDURE ventas.archivar_pedidos_antiguos(
    p_fecha_corte DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    -- Mover pedidos a tabla de archivo
    INSERT INTO pedidos_archivo
    SELECT * FROM pedidos
    WHERE fecha::DATE < p_fecha_corte;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Eliminar de la tabla principal
    DELETE FROM pedidos WHERE fecha::DATE < p_fecha_corte;

    RAISE NOTICE 'Se archivaron % pedidos anteriores a %', v_count, p_fecha_corte;

    COMMIT;
END;
$$;

-- Llamar el procedimiento
CALL ventas.archivar_pedidos_antiguos('2022-01-01');
```

### Triggers (Disparadores)
> Ejecutan funciones automáticamente ante eventos en una tabla.

```sql
-- Función para el trigger
CREATE OR REPLACE FUNCTION ventas.actualizar_fecha_modificacion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.fecha_modificacion = NOW();
    RETURN NEW;
END;
$$;

-- Crear el trigger
CREATE TRIGGER trg_actualizar_fecha
BEFORE UPDATE ON ventas.clientes
FOR EACH ROW
EXECUTE FUNCTION ventas.actualizar_fecha_modificacion();

-- Trigger de auditoría
CREATE OR REPLACE FUNCTION ventas.registrar_auditoria()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (tabla, operacion, datos_anteriores, fecha)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(OLD), NOW());
        RETURN OLD;
    ELSE
        INSERT INTO auditoria (tabla, operacion, datos_nuevos, fecha)
        VALUES (TG_TABLE_NAME, TG_OP, row_to_json(NEW), NOW());
        RETURN NEW;
    END IF;
END;
$$;

CREATE TRIGGER trg_auditoria_clientes
AFTER INSERT OR UPDATE OR DELETE ON ventas.clientes
FOR EACH ROW EXECUTE FUNCTION ventas.registrar_auditoria();

-- Eliminar trigger
DROP TRIGGER IF EXISTS trg_actualizar_fecha ON ventas.clientes;
```

### Funciones de lenguaje SQL (más simples)
```sql
-- Para lógica simple, LANGUAGE sql es más eficiente que plpgsql
CREATE OR REPLACE FUNCTION ventas.nombre_completo(
    p_nombre    TEXT,
    p_apellido  TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
    SELECT TRIM(p_nombre || ' ' || p_apellido);
$$;

SELECT ventas.nombre_completo('Ana', 'García');
```

---

## 📊 Resumen General

| Categoría     | Significado                  | Comandos principales                                  |
|---------------|------------------------------|-------------------------------------------------------|
| **DDL**       | Data Definition Language     | `CREATE`, `ALTER`, `DROP`, `TRUNCATE`                 |
| **DML**       | Data Manipulation Language   | `INSERT`, `UPDATE`, `DELETE`, `ON CONFLICT`           |
| **DQL**       | Data Query Language          | `SELECT`, CTEs, Window Functions                      |
| **DCL**       | Data Control Language        | `GRANT`, `REVOKE`, `CREATE ROLE`                      |
| **TCL**       | Transaction Control Language | `BEGIN`, `COMMIT`, `ROLLBACK`, `SAVEPOINT`            |
| **Vistas**    | Objetos de consulta          | `VIEW`, `MATERIALIZED VIEW`                           |
| **Funciones** | Lógica del lado del servidor | `FUNCTION`, `PROCEDURE`, `TRIGGER`                    |

### Tipos de datos más usados en PostgreSQL

| Categoría   | Tipos                                               |
|-------------|-----------------------------------------------------|
| Enteros     | `smallint`, `integer`, `bigint`, `serial`, `bigserial` |
| Decimales   | `numeric(p,s)`, `real`, `double precision`          |
| Texto       | `text`, `varchar(n)`, `char(n)`                     |
| Fecha/Hora  | `date`, `timestamptz`, `interval`, `time`           |
| Lógico      | `boolean`                                           |
| Especiales  | `uuid`, `jsonb`, `inet`, `cidr`, `bytea`            |
| Arrays      | `integer[]`, `text[]`, etc.                         |
| Personalizados | `ENUM`, tipos compuestos                         |

---

> 🐘 **PostgreSQL** — Esta guía está orientada a PostgreSQL 14+. Algunas características como `PROCEDURE`, `GENERATED COLUMNS` y `REFRESH MATERIALIZED VIEW CONCURRENTLY` requieren versiones específicas.
