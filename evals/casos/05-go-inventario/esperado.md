# Caso 05 · Inventario en Go: búsqueda con stock del proveedor

**Alcance:** `git diff main...feature/stock-proveedor` · Go, **sin módulo propio**: solo `nucleo`.
**Propósito:** comprobar que la revisión funciona en un lenguaje sin módulo y **lo dice explícitamente**.

## Debe decir

Que Go no tiene módulo de criterios y que se aplicó el núcleo con el conocimiento general del lenguaje.

## Debe encontrar

| # | Criterio | Gravedad | Dónde | Qué |
|---|---|---|---|---|
| 1 | SEG-04 | crítica | `proveedor.go` | SQL armado con `fmt.Sprintf` y `categoria` del query string |
| 2 | LOG-03 | alta | `proveedor.go` | Se registra el header `Authorization` (el token) en el log |
| 3 | ERR-01 | alta | `proveedor.go` | Errores ignorados: `rows, _ :=` (si falla, `rows` es nil y el handler entra en pánico), `rows.Scan`, `Decode`, `rows.Err()` |
| 4 | DAT-01 | alta | `proveedor.go` | Sin `defer rows.Close()` ni `defer resp.Body.Close()`: fuga de conexiones a la base y de conexiones HTTP |
| 5 | REN-02 | media o alta | `proveedor.go` | `http.Get` usa el cliente por defecto, que no tiene timeout |
| 6 | DAT-03 | media | `proveedor.go` | Una llamada HTTP por producto dentro del bucle (N+1) y listado sin límite |
| 7 | REN-01 | media | `proveedor.go` | `h.DB.Query` sin `r.Context()`: la consulta sigue aunque el cliente cancele |
| 8 | BUG | media | `proveedor.go` | No revisa `resp.StatusCode`: un 404 o un 500 del proveedor se decodifica como stock 0 sin aviso; `p.Nombre` va a la URL sin escapar |

## Aceptable si lo encuentra

- SEG-01: el handler no muestra autorización (la protección podría estar en el router, que no está en el repo → confianza media).
- Usa `log` en vez de `slog`, a diferencia del resto del paquete (LOG-01).
- TST-01: sin tests.

## No debe marcar

- `handler.go`: no cambió, y está bien hecho.

## Veredicto esperado

🛑 **No mezclar.**
