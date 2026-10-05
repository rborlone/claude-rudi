# claude-rudi

Plugin de Claude Code **RUDI**: suite de skills para equipos de desarrollo. Depende del plugin
[bitácora](https://github.com/rborlone/claude-bitacora-context) (`~/Proyectos/claude-bitacora-context`) como memoria.

- **Diseño acordado (13 decisiones):** [`docs/diseno.md`](docs/diseno.md). Léelo antes de cambiar algo de fondo.
- Las decisiones también están en la bitácora: `bitacora_buscar` con `"rudi"` y `proyecto: "*"`.

## Reglas del proyecto

- **Genérico:** nada de RedNegocios ni de ningún cliente (nombres de servicios, código, infraestructura). Los casos de evaluación se reescriben de forma genérica.
- **Los criterios de revisión salen de estándares** (OWASP, RFCs, guías oficiales), nunca del diseño de los repos existentes.
- Todo en español. Identificadores sin tildes (`revisar`, `diseno`).
- Commits sin la línea `Co-Authored-By` de Claude.
- Para publicar: subir `version` en `.claude-plugin/plugin.json`, `claude plugin validate .`, push, y luego
  `claude plugin marketplace update claude-rudi` + `claude plugin update rudi@claude-rudi`.

## Estado (2026-10-05)

| Paso | Estado |
|---|---|
| 0 · Bitácora v0.3: indexar markdown | ✅ |
| 1 · Plugin + `/rudi:contexto` | ✅ |
| 2 · Criterios base (`skills/revisar/criterios/`) | ✅ borrador; el líder aún no lo corrige |
| 3 · `/rudi:revisar` + agente `revisor` | ✅ v0.2.0; caso 01: 10/10 |
| 4 · Set de evaluación (`evals/`) | ✅ 5 casos; resultados en `evals/README.md` |
| 5 · `/rudi:arquitectura` + agente explorador + plantilla MADR | ✅ v0.3.0 |
| 6 · Piloto del líder | ⏳ |
| v1.1 · Barandas de producción (`hooks/barandas.js`, `.rudi.json`) | ✅ v0.4.0; falta probarlas con casos reales del líder antes de dárselas al equipo |

## Cómo probar

```sh
claude plugin validate .
npm test                                           # pruebas de las barandas
evals/correr.sh                                    # corre todos los casos de evaluación
cd /tmp/caso01 && claude -p "/rudi:revisar" --plugin-dir ~/Proyectos/claude-rudi \
  --allowedTools "Read" "Grep" "Glob" "Bash(git *)" "Agent" "mcp__plugin_bitacora_bitacora__bitacora_buscar"
```

Compara el resultado con `evals/casos/01-api-pagos/esperado.md`.
