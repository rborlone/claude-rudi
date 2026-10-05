# Evaluación de `/rudi:revisar`

Casos **genéricos** (nada de proyectos reales ni de clientes) con problemas conocidos, para medir si la revisión
encuentra lo que debe y si inventa problemas. Se vuelven a correr cada vez que cambian los criterios o las skills.

## Cómo correrlos

```sh
evals/correr.sh                    # todos los casos, en paralelo (~2-3 min)
evals/correr.sh 04-limpio-python   # uno o varios
```

Los resultados quedan en `evals/resultados/<fecha-hora>/` (no se versionan). Compara cada uno con el `esperado.md`
de su caso:

- **Encontrados:** cuántos de la tabla "Debe encontrar" aparecen.
- **Falsos positivos:** hallazgos críticos o altos que no son reales, o sobre código que el cambio no toca.
- **Veredicto:** si coincide con el esperado.

Para armar un caso a mano y explorarlo: `evals/armar.sh evals/casos/<caso> /tmp/<caso>`.

## Casos

| Caso | Stack | Mide |
|---|---|---|
| `01-api-pagos` | .NET | Autenticación propia, inyección SQL, IDOR, recursos, errores, un ajuste del proyecto (MAN-02) |
| `02-front-pedidos` | React (JS) | Secretos en el bundle, XSS, tokens, hooks, accesibilidad, cliente de API |
| `03-sql-facturas` | SQL Server | SQL dinámico, migraciones destructivas, transacciones, permisos, tipos |
| `04-limpio-python` | Python | **Falsos positivos**: un cambio bien hecho debe salir ✅ |
| `05-go-inventario` | Go | Un lenguaje **sin módulo**: debe aplicar el núcleo y decirlo |

## Resultados

### 2026-10-05 · v0.3.0

| Caso | Encontrados | Falsos positivos | Veredicto | Notas |
|---|---|---|---|---|
| 01 | 10/10 | 0 | 🛑 ✓ | |
| 02 | 9/9 | 0 | 🛑 ✓ | Encontró además un bug real no previsto: tras el login, el cliente `api.js` no recibe el token |
| 03 | 9/9 | 0 | 🛑 ✓ | Lo de `001_crear_facturas.sql` quedó correctamente como preexistente |
| 04 | — | 0 | ✅ ✓ | En las dos primeras corridas encontró **bugs reales del caso** (tests que usaban la base real, `InvalidOperation` no capturada, lógica sin tests); se corrigió el caso. La tercera corrida dio ✅ con una sugerencia válida |
| 05 | 8/8 | 0 | 🛑 ✓ | Avisó que Go no tiene módulo y aplicó el núcleo |

Ajustes a las skills que salieron de estas corridas: la gravedad es fija (la revisión solo anota si cree que no
corresponde) y la revisión no ejecuta tests, builds ni scripts del código revisado.

## Cómo agregar un caso

1. `evals/casos/NN-nombre/base/`: el estado inicial del repo (incluye un `CLAUDE.md` mínimo).
2. `evals/casos/NN-nombre/cambio/`: el repo completo después del cambio a revisar.
3. `rama.txt` con el nombre de la rama (opcional).
4. `esperado.md`: qué debe encontrar (con criterio, gravedad y ubicación), qué es aceptable, qué no debe marcar y el
   veredicto esperado.

Si el caso viene de un problema real, **reescríbelo de forma genérica**: otros nombres, otro dominio, el mismo patrón.
