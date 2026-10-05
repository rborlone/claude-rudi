# Caso 02 · Front de pedidos: login y detalle de pedido

**Alcance:** `git diff main...feature/detalle-pedido` · React con JavaScript (módulos `nucleo` + `react`).

## Debe encontrar

| # | Criterio | Gravedad | Dónde | Qué |
|---|---|---|---|---|
| 1 | RCT-01 · SEG-05 | crítica | `.env.production` | `VITE_PAGOS_CLAVE_SECRETA`: toda variable `VITE_*` termina en el bundle público; además el archivo está versionado |
| 2 | RCT-02 | crítica | `DetallePedido.jsx` | `dangerouslySetInnerHTML` con `notaCliente`, un texto que escribe el cliente → XSS |
| 3 | RCT-03 | alta | `Login.jsx`, `DetallePedido.jsx` | Token en `localStorage`, ignorando la sesión en memoria que ya existe en `api.js` |
| 4 | RCT-06 · CFG-01 | media | `DetallePedido.jsx` | URL de producción fija y `fetch` sueltos en vez del cliente común `api.js` (que maneja el 401) |
| 5 | RCT-05 · ERR-01 | media o alta | `DetallePedido.jsx` | `.catch(() => {})`: si falla la carga, la página queda en blanco para siempre; `Login` y `cancelar` no manejan errores (un 401 en login rompe con `undefined`) |
| 6 | RCT-08 | alta | `DetallePedido.jsx` | `useEffect` sin `id` en las dependencias: al navegar a otro pedido se muestra el anterior |
| 7 | RCT-09 | media | `DetallePedido.jsx` | `key={i}` en una lista que se reordena |
| 8 | RCT-10 | media | `DetallePedido.jsx` | "Cancelar pedido" es un `div` con `onClick`: no se alcanza con teclado |
| 9 | BUG | media o alta | `cancelar()` | Marca el pedido como cancelado sin revisar si la API respondió bien |

## Aceptable si lo encuentra

- Que `cancelar` no pida confirmación ni se deshabilite mientras corre (dobles clics).
- TST-01: no hay tests de las páginas nuevas.
- Que el login no muestre errores al usuario.

## No debe marcar

- `api.js` y `Pedidos.jsx`: no cambiaron (y están bien hechos).
- Las etiquetas del formulario de login: están bien asociadas con `htmlFor`.

## Bien hecho (debería reconocerlo)

- El formulario de login tiene sus etiquetas asociadas y usa `type="password"`.

## Veredicto esperado

🛑 **No mezclar.**
