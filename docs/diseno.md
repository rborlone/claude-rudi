# RUDI: diseño

> **R.U.D.I.**: *Referential Universal Digital Indexer*, la computadora de la oficina de George en Los Supersónicos.

RUDI es una suite de skills para Claude Code, pensada para que un equipo de desarrollo trabaje con el criterio de su
líder técnico: revisar código, decidir y documentar arquitectura, y (más adelante) infra, DevOps y features completas.
Funciona sobre la **bitácora** (`claude-bitacora-context`), que es su memoria.

Diseño acordado el 2026-10-04. Cada decisión está también en la bitácora como memoria de tipo `decision`.

## Decisiones

| # | Tema | Decisión |
|---|---|---|
| 1 | Alcance | **Genérica**, sirve para cualquier proyecto. Trae el *cómo trabajamos*; lo específico de cada proyecto vive en el proyecto |
| 2 | Contexto | Entra por cuatro vías: lo que pasa el usuario (texto, archivo, link), las wikis, el `CLAUDE.md` del repo y la bitácora |
| 3 | Fuentes | Agnósticas de la herramienta: el denominador común es **markdown** (Azure DevOps wiki, Confluence exportado, carpetas…) |
| 4 | Búsqueda | Los markdown se **indexan en la bitácora** (`bitacora_indexar`). `bitacora_buscar` busca en memorias, conversaciones y documentos a la vez. Búsqueda semántica solo si hace falta |
| 5 | Alcance v1 | `contexto`, `revisar` y `arquitectura` |
| 6 | Nombre | **RUDI** (`rudi`): `/rudi:contexto`, `/rudi:revisar`, `/rudi:arquitectura`. Repo `claude-rudi` |
| 7 | Criterios de revisión | **En capas**: (1) base RUDI = núcleo **agnóstico del lenguaje** respaldado por estándares (OWASP, guías oficiales) + módulos por tecnología que se activan si se detectan; (2) el proyecto (`CLAUDE.md`, wiki, ADRs) agrega o anula reglas por ID; (3) lo que el líder justifica en una revisión se guarda en la bitácora y no se vuelve a marcar. La base **no** se deriva del código existente: no es referencia de buen diseño. Lo que se encuentre en él pasa a ser casos de evaluación |
| 8 | Modo mentor | **Por nivel de persona**, declarado una vez en su config personal: *junior* (porqué, ejemplo y fuente), *semi senior* (porqué en una línea), *senior* (directo, por gravedad). Ajustable en el momento. Cada observación cita su fuente |
| 9 | Distribución | RUDI en el GitHub personal del líder, **sin nada confidencial**. Lo de cada empresa vive en sus repos, que declaran RUDI en `.claude/settings.json`. Los criterios derivados de código de una empresa se escriben de forma genérica |
| 10 | Agentes | v1 reconstruye solo dos: **revisor** (reemplaza code-reviewer y security) y **explorador de arquitectura** (reemplaza architect). El resto, en v2 con `feature` |
| 11 | ADRs | Según alcance: los del componente en `docs/adr/NNNN-titulo.md` de su repo; los transversales en un lugar central (wiki o repo de arquitectura). Formato **MADR en español** con estado. **La skill propone, el líder acepta**; un ADR propuesto no se aplica en revisiones |
| 12 | Barandas | **v1.1**: hook que **pregunta** (no bloquea) ante comandos peligrosos en producción. Cada proyecto declara qué es producción en `.rudi.json`; sin archivo, patrones conservadores |
| 13 | Validación | Set de evaluación con 5 a 10 PRs reales con problemas conocidos (¿encuentra lo conocido? ¿inventa problemas?), que se corre con cada cambio de criterios. Piloto escalonado: líder → 1 o 2 personas de distinto nivel → equipo |

## Estructura prevista

```
claude-rudi/
├─ .claude-plugin/          plugin.json, marketplace.json
├─ skills/
│   ├─ contexto/            reúne bitácora + wikis + CLAUDE.md + lo que pase el usuario
│   ├─ revisar/             criterios en capas, modo mentor, aprende de las justificaciones
│   │   └─ criterios/       base por tecnología: dotnet.md, react.md, sqlserver.md, seguridad.md, tests.md
│   └─ arquitectura/        ADRs (plantilla MADR), evaluación de alternativas, revisión de diseños
├─ agents/                  revisor.md, explorador-arquitectura.md
├─ hooks/                   (v1.1) barandas de producción
└─ evals/                   casos reales de revisión
```

## Plan de construcción

| Paso | Qué | Dónde |
|---|---|---|
| 0 | Indexar documentos: tabla de documentos, `bitacora_indexar`, búsqueda unificada | bitácora v0.3 |
| 1 | Esqueleto del plugin y `/rudi:contexto` | RUDI |
| 2 | Criterios base: núcleo agnóstico + módulos por tecnología, desde estándares → corrección del líder | RUDI |
| 3 | Agente revisor, `/rudi:revisar` y modo mentor | RUDI |
| 4 | Set de evaluación con PRs reales | RUDI |
| 5 | `/rudi:arquitectura`, explorador de arquitectura y plantilla MADR | RUDI |
| 6 | Piloto del líder (1 o 2 semanas) | — |
| v1.1 | Barandas de producción | RUDI |
| v2 | `infra`, `devops`, `feature` (orquesta los agentes de desarrollo) | RUDI |
| después | BAU (los tickets llegan por correo de soporte) | RUDI |

## Pendientes

- Repo público o privado (por defecto, privado).
- Tamaño del equipo, niveles, y si ya usan Claude Code.
- Política de la empresa sobre el uso de IA con su código.
- Elegir los PRs del set de evaluación (candidato: merge de PDFs corruptos en ControlDocs).
