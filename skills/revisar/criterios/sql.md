# Criterios base · SQL (SQL Server, con notas para otros motores)

**Se activa si:** el cambio toca `*.sql`, stored procedures, migraciones o SQL embebido en el código.
Concreta el [núcleo](nucleo.md) para bases de datos; las referencias entre corchetes indican el criterio general.

### SQL-01 · SQL dinámico solo parametrizado · crítica [SEG-04]
- **Qué:** si un stored procedure arma SQL dinámico, usa `sp_executesql` con parámetros, y los nombres de objetos que vienen de afuera pasan por `QUOTENAME` y una lista permitida.
- **Señales:** `EXEC('...' + @param + '...')`; nombres de tabla o columna concatenados.
- **Fuente:** Microsoft Learn · "sp_executesql"; OWASP SQL Injection Prevention Cheat Sheet.

### SQL-02 · Cambios destructivos con red de seguridad · crítica [DAT-04]
- **Qué:** `DROP`, `TRUNCATE`, `DELETE` o `UPDATE` masivos van con condición explícita, en una transacción, con verificación previa (conteo esperado) y con plan de reversa o respaldo.
- **Señales:** `DELETE`/`UPDATE` sin `WHERE`; `DROP` sin `IF EXISTS` ni respaldo previo; scripts que no se pueden volver a ejecutar sin daño.
- **Fuente:** práctica general de administración de bases de datos.

### SQL-03 · Scripts idempotentes y versionados · alta [DAT-04]
- **Qué:** los scripts de esquema se pueden ejecutar más de una vez sin error (`CREATE OR ALTER`, `IF NOT EXISTS`) y quedan versionados junto al código que los necesita.
- **Fuente:** práctica general de entrega continua de bases de datos.

### SQL-04 · Transacciones y errores explícitos · alta [DAT-02, ERR-01]
- **Qué:** los procedimientos con varias escrituras usan `SET XACT_ABORT ON`, `BEGIN TRAN` y `TRY...CATCH` con `ROLLBACK` y `THROW`. Los errores no se convierten en códigos de retorno que nadie revisa.
- **Fuente:** Microsoft Learn · "TRY...CATCH" y "SET XACT_ABORT".

### SQL-05 · Consultas que pueden usar índices · media [DAT-03]
- **Qué:** sin funciones sobre columnas en el `WHERE` o el `JOIN` (`WHERE YEAR(Fecha) = 2026`), sin conversiones implícitas por tipos distintos (por ejemplo `NVARCHAR` contra `VARCHAR`) y sin `LIKE '%texto'` en tablas grandes sin justificarlo.
- **Por qué:** cualquiera de esas formas obliga a recorrer la tabla completa aunque exista el índice.
- **Fuente:** Microsoft Learn · "SQL Server index architecture and design guide".

### SQL-06 · Columnas explícitas y resultados acotados · media [DAT-03, API-01]
- **Qué:** nada de `SELECT *` en procedimientos o vistas que consume la aplicación. Los listados se paginan (`OFFSET ... FETCH`) o tienen un límite.
- **Fuente:** práctica general.

### SQL-07 · Índices que acompañan a las consultas nuevas · media
- **Qué:** una consulta nueva sobre una tabla grande trae el índice que necesita, o la justificación de por qué no. Un índice nuevo justifica su costo en escrituras.
- **Fuente:** Microsoft Learn · "SQL Server index architecture and design guide".

### SQL-08 · Tipos y restricciones correctos · media
- **Qué:** fechas en `date`/`datetime2` (no en texto), dinero en `decimal` (no en `float`), claves foráneas y `NOT NULL` donde corresponde, y largos de texto razonables.
- **Fuente:** práctica general de modelado.

### SQL-09 · Permisos mínimos · alta [SEG-01]
- **Qué:** la aplicación se conecta con un usuario que solo puede ejecutar lo que necesita (por ejemplo, `EXECUTE` sobre sus procedimientos), nunca como `sa` o `db_owner`.
- **Fuente:** Microsoft Learn · "Principle of least privilege"; CIS Microsoft SQL Server Benchmark.

### SQL-10 · Convención de nombres consistente · sugerencia
- **Qué:** la que el proyecto ya use, aplicada siempre igual. Para SQL Server, evitar el prefijo `sp_` en procedimientos propios: SQL Server lo busca primero en `master`.
- **Fuente:** Microsoft Learn · "CREATE PROCEDURE" (nota sobre el prefijo `sp_`).
