# Caso 03 · Base de facturas: búsqueda, pagos y migración

**Alcance:** `git diff main...feature/busqueda-facturas` · SQL Server (módulos `nucleo` + `sql`).

## Debe encontrar

| # | Criterio | Gravedad | Dónde | Qué |
|---|---|---|---|---|
| 1 | SQL-01 · SEG-04 | crítica | `sp_BuscarFacturas.sql` | SQL dinámico con `@Cliente` y `@Orden` concatenados y `EXEC(@sql)`; `@Orden` necesita lista permitida + `QUOTENAME` |
| 2 | SQL-02 | crítica | `002_limpieza_y_totales.sql` | `DELETE FROM dbo.FacturasDetalle` sin `WHERE`, sin transacción, verificación ni respaldo: borra el detalle real en producción |
| 3 | SQL-09 | alta (o crítica) | `002_limpieza_y_totales.sql` | `ALTER ROLE db_owner ADD MEMBER app_facturas`: la aplicación pasa a ser dueña de la base |
| 4 | SQL-04 · DAT-02 | alta | `RegistrarPago.sql` | `UPDATE` + `INSERT` sin transacción ni `XACT_ABORT`/`TRY...CATCH`: una falla deja la factura pagada sin el detalle |
| 5 | SQL-08 | media | `RegistrarPago.sql`, migración 002 | Dinero en `float` (`@Monto`, `Total`), cuando el resto del esquema usa `decimal(18,2)` |
| 6 | SQL-05 | media | `RegistrarPago.sql` | `YEAR(Fecha) = @Anio`: impide usar índices sobre `Fecha` |
| 7 | SQL-06 | media | `sp_BuscarFacturas.sql` | `SELECT *` hacia la aplicación y sin límite de filas |
| 8 | SQL-03 | media o alta | `sp_BuscarFacturas.sql`, migración 002 | No idempotentes: `CREATE PROCEDURE` (no `CREATE OR ALTER`); `ALTER TABLE ADD` sin `IF NOT EXISTS` falla la segunda vez |
| 9 | SQL-10 | sugerencia | `sp_BuscarFacturas.sql` | Prefijo `sp_` en un procedimiento propio |

## Aceptable si lo encuentra

- `LIKE '%…%'` impide usar el índice por `Cliente` (SQL-05).
- `RegistrarPago` no valida que la factura exista ni que no esté ya pagada (doble pago).
- Que `@Monto` se guarda negado sin explicación.

## No debe marcar

- `001_crear_facturas.sql` y `ObtenerFactura.sql`: no cambiaron y están bien.

## Bien hecho

- `RegistrarPago` usa `CREATE OR ALTER` y `SET NOCOUNT ON` (poco más; no es obligatorio encontrar algo bueno).

## Veredicto esperado

🛑 **No mezclar.**
