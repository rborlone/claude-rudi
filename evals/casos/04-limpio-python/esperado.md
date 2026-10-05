# Caso 04 · Servicio de clientes: saldo convertido (cambio limpio)

**Alcance:** `git diff main...feature/saldo-cliente` · Python (módulos `nucleo` + `python`).
**Propósito:** medir **falsos positivos**. El cambio está bien hecho a propósito.

## Debe concluir

✅ **Listo para mezclar**: ningún hallazgo crítico ni alto.

## Lo que está bien (no debe marcarse como problema)

- Autorización: el endpoint usa `usuario_actual` y `_exigir_acceso` (dueño o admin; 404 para no revelar si existe).
- SQL parametrizado con `text(...)` y `:id`; sesión asíncrona; `COALESCE` para el cliente sin movimientos.
- Llamada externa con `httpx.AsyncClient` y `timeout` configurable; errores convertidos en una excepción propia y en un **503** con un mensaje útil.
- Logging con argumentos diferidos, sin datos sensibles.
- Dinero con `Decimal` y redondeo explícito.
- Tests de los cuatro casos: éxito, otro cliente, sin token y servicio externo caído.

## Aceptable (como media o sugerencia, nunca como alta)

- `raise HTTPException(...)` dentro del `except` sin `from`: en Python 3 la causa queda encadenada igual, pero `from None` o `from e` es más explícito (PY-03, sugerencia).
- Un `httpx.AsyncClient` nuevo por llamada en vez de uno compartido (sugerencia de rendimiento).
- El redondeo a pesos enteros podría documentarse.
- Sin caché del tipo de cambio (sugerencia).

## Historia del caso

La primera versión de este caso **no estaba limpia**, y la revisión lo detectó (2026-10-05): `cliente_http` borraba
todos los overrides (los tests usaban la base real) y `Decimal("abc")` lanza `InvalidOperation`, que no es
`ValueError`. Ambos se corrigieron; si vuelven a aparecer, es una regresión del caso, no un falso positivo.

## Cuenta como falso positivo

Cualquier hallazgo **crítico o alto**, o hallazgos sobre código que no cambió (`seguridad.py`, `db.py`, `config.py`).
