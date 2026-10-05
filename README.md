<p align="center"><img src="assets/rudi.svg" alt="RUDI" width="220"></p>

# RUDI

> **R.U.D.I.**: *Referential Universal Digital Indexer*, la computadora de la oficina de George en Los Supersónicos.

Suite de skills para [Claude Code](https://claude.com/claude-code) pensada para equipos de desarrollo: reúne el
contexto de una tarea, revisa código y documenta arquitectura **con el criterio del equipo**, y explica el porqué
según el nivel de cada persona.

RUDI es genérica: no trae nada de un proyecto en particular. Lo específico de cada proyecto vive en el proyecto
(su `CLAUDE.md`, sus wikis y sus ADRs), y RUDI lo encuentra a través de la [bitácora](https://github.com/rborlone/claude-bitacora-context),
que es su memoria.

## Skills

| Skill | Estado | Qué hace |
|---|---|---|
| `/rudi:contexto` | ✅ v0.1 | Reúne lo que hay que saber de un tema: bitácora, wikis indexadas, ADRs, el repo y las fuentes que pases. Entrega una ficha con la fuente de cada dato y lo que falta saber |
| `/rudi:revisar` | En construcción | Revisa cambios contra criterios en capas (base de RUDI, reglas del proyecto, decisiones del líder) en modo mentor |
| `/rudi:arquitectura` | En construcción | ADRs en formato MADR, evaluación de alternativas y revisión de diseños |

El diseño completo está en [`docs/diseno.md`](docs/diseno.md).

## Requisitos

- Claude Code
- El plugin **bitácora** (memoria y búsqueda de documentación). Sin él, RUDI funciona, pero solo con el repo y las fuentes que le pases.

## Instalación

Dentro de Claude Code:

```
/plugin marketplace add rborlone/claude-bitacora-context
/plugin install bitacora@bitacora-context

/plugin marketplace add rborlone/claude-rudi
/plugin install rudi@claude-rudi
```

Reinicia Claude Code.

### Tu nivel (modo mentor)

Agrega una línea a tu `~/.claude/CLAUDE.md` personal para que RUDI ajuste cuánto explica:

```markdown
rudi: nivel junior        # o: semi senior, senior
```

- **junior:** explica el porqué de cada punto, con ejemplos y la fuente donde aprender más.
- **semi senior:** el porqué en una línea; el detalle solo en lo no obvio.
- **senior:** directo y agrupado por importancia.

En cualquier momento puedes pedir más ("explícame esto") o menos.

## Uso

```
/rudi:contexto merge de PDFs que fallaba con KeyNotFoundException
/rudi:contexto migración a .NET 8 ~/docs/plan-migracion.md
/rudi:contexto qué sabemos del DRP de la base de datos
```

Para que RUDI encuentre la documentación de tu equipo, indéxala una vez en la bitácora:

> *"Indexa la wiki que está en ~/Proyectos/MiProyecto/wiki"*

## Desarrollo

```sh
claude --plugin-dir .            # probar el plugin local sin instalarlo
claude plugin validate .         # validar los manifiestos
```
