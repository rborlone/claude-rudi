# Caso 01 · API de pagos: autenticación propia, búsqueda y anulación

**Alcance:** `git diff main...feature/anulacion` · .NET (módulos `nucleo` + `dotnet`).
**Arma el caso:** `./armar.sh <destino>`.

## Debe encontrar

| # | Criterio | Gravedad | Dónde | Qué |
|---|---|---|---|---|
| 1 | NET-02 | crítica | `Middleware/JwtMiddleware.cs` (catch de `AdjuntarUsuario`) | `next(context)` en el `catch` y otra vez en `Invoke`: con un token inválido la petición se ejecuta dos veces |
| 2 | SEG-04 · NET-07 | crítica | `Datos/PagosRepositorio.cs` (`BuscarPorCliente`) | SQL concatenado con `estado`, que viene del query string |
| 3 | SEG-01 · NET-01 | crítica | `Controllers/PagosController.cs` (`BuscarPorCliente`) y el middleware | El middleware no bloquea nada; `BuscarPorCliente` queda público |
| 4 | SEG-02 | crítica | `BuscarPorCliente` y `Anular` | Sin control de dueño: `clienteId` viene de la URL y `Anular` no verifica que el pago sea del cliente del token |
| 5 | SEG-03 | alta | `JwtMiddleware.cs` | `ValidateIssuer` y `ValidateAudience` en `false` |
| 6 | SEG-07 | alta | `BuscarPorCliente` (catch) | `ex.Message` devuelto al cliente |
| 7 | DAT-01 · NET-07 | alta | `BuscarPorCliente` (repositorio) | Conexión, comando y reader sin `using`; si falla, la conexión no se libera |
| 8 | ERR-02 · NET-04 | media o alta | `BuscarPorCliente` (catch) | Una falla del servidor responde 400 |
| 9 | NET-05 · LOG-01 · LOG-02 | media | `BuscarPorCliente` (catch) | `LogCritical` con `string.Format` |
| 10 | NET-06 · REN-01 | media | `BuscarPorCliente` | Acceso a datos sincrónico en una petición |

## Aceptable si lo encuentra

- **DAT-03** (media): `BuscarPorCliente` no pagina.
- **BUG** o **TST-01**: el test usa `ApiDePrueba`, que no existe en el repo, así que no compilaría.
- **TST-01**: `BuscarPorCliente` sin tests.
- **MAN-02** en `Anular` (ver abajo).
- **ERR-02**: `Anular` responde 409 también cuando el pago no existe (debería ser 404).
- Señalar que el ADR-0002 citado en el `CLAUDE.md` no existe en el repo.

## Preexistente (no debe bloquear)

- **NET-10 · SEG-07**: Swagger habilitado sin condición de ambiente en `Program.cs`. El cambio toca el archivo, pero no esas líneas.

## No debe marcar

- **MAN-02 en `BuscarPorCliente`**: es de solo lectura, y el `CLAUDE.md` del proyecto permite que llame directo al repositorio (ADR-0002).
  En cambio, marcar MAN-02 en `Anular` **es correcto**: escribe, y la excepción solo cubre la lectura.
- `AnularAsync` por SQL, recursos o reintentos: está parametrizada, libera recursos y el `UPDATE` condicional la hace segura ante reintentos. (Sí le falta el control de dueño: eso es el hallazgo 4).

## Bien hecho (debería reconocerlo)

- `AnularAsync`: SQL parametrizado, `await using`, `CancellationToken` y `UPDATE` condicional que evita la doble anulación.
- Hay un test del caso borde "anular un pago ya anulado".

## Gravedades

Se respetan las del criterio: por ejemplo, SEG-03 es **crítica** aunque la revisión agregue una nota si cree que es menos grave en este caso.

## Veredicto esperado

🛑 **No mezclar** (hay críticos).
