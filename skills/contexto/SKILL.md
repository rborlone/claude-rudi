---
name: contexto
description: Reúne el contexto de una tarea antes de trabajar en ella. Busca en la bitácora (memorias, conversaciones pasadas, wikis y ADRs indexados), revisa el proyecto y lee las fuentes que pase el usuario (archivos, carpetas, links, work items, texto pegado). Entrega una ficha breve con lo relevante, de dónde sale cada dato y qué falta saber. Úsala cuando el usuario pida contexto o "qué sabemos de…", al retomar un tema de otra sesión, o antes de revisar código o diseñar.
argument-hint: <tema o tarea> [archivos, carpetas, links o IDs]
allowed-tools: [Read, Glob, Grep, "Bash(git log *)", "Bash(git status *)", "Bash(git rev-parse *)", "Bash(ls *)", mcp__plugin_bitacora_bitacora__bitacora_buscar, mcp__plugin_bitacora_bitacora__bitacora_recientes]
---

# RUDI · contexto

Tu trabajo es dejar en la conversación **lo que hay que saber para trabajar en un tema**, con la fuente de cada dato, sin
inventar y sin llenar el contexto de ruido. Preparas el terreno; no empiezas la tarea salvo que te lo pidan.

## Entrada

El usuario escribió: $ARGUMENTS

Separa la entrada en dos partes:
- **El tema o la tarea**: qué se quiere hacer o entender.
- **Las fuentes explícitas**: rutas de archivos o carpetas, URLs, IDs de work items o PRs, texto pegado.

Si no hay tema, dedúcelo de la conversación. Si tampoco se puede, pregunta en una sola línea qué tema necesita.

## Procedimiento

### 1. El proyecto

- Ubica la raíz del repo (`git rev-parse --show-toplevel`). El `CLAUDE.md` ya está cargado: úsalo, no lo releas.
- Reconoce el stack mirando solo los manifiestos (`*.csproj`, `*.sln`, `package.json`, `Dockerfile`, charts de Helm,
  `*.tf`, `*.bicep`, YAML de pipelines). No recorras todo el repo.
- Si el tema apunta a una parte del código, mira su historial reciente: `git log -n 15 --oneline -- <ruta>`.

### 2. Las fuentes que pasó el usuario

Tienen prioridad: si el usuario las nombró, es porque importan.

- **Archivo:** léelo.
- **Carpeta con muchos `.md`:** búscala con `Grep` para este tema. Si se va a consultar seguido, al final ofrece indexarla.
- **URL:** léela con `WebFetch`. Si es privada y falla, pide que la exporte a markdown o que clone la wiki; no adivines su contenido.
- **ID de work item o PR:** si la CLI correspondiente está disponible (por ejemplo `az boards work-item show --id <n>`,
  `az repos pr show --id <n>`, `gh pr view <n>`), consúltala en modo lectura. Si no, pide que lo pegue.
- **Texto pegado:** ya es contexto; extrae de ahí los hechos y las decisiones.

### 3. La bitácora

La búsqueda es **por palabras, no por significado**: "DRP" no encuentra "recuperación ante desastres". Por eso:

- Haz de 2 a 4 búsquedas con `bitacora_buscar` usando términos distintos: sinónimos, la sigla y su forma larga,
  español e inglés, y los nombres técnicos (clase, servicio, tabla, recurso).
- Si el tema cruza proyectos (infraestructura, convenciones, otra app), busca también con `proyecto: "*"`.
- Si un fragmento relevante viene cortado, abre el documento completo con `Read` en la ruta que trae el resultado.
- Si las herramientas `bitacora_*` no están disponibles, dilo una vez y sigue con el repo y las fuentes explícitas.

### 4. Las decisiones vigentes

- Busca ADRs en el repo (`docs/adr/`, `doc/adr/`, `adr/`) y en la bitácora (busca "ADR" o "decisión" junto al tema).
- Solo los ADR con estado **aceptado** son reglas. Los **propuestos** se mencionan como pendientes. Los **reemplazados**,
  solo si explican por qué se cambió algo.
- Las memorias de tipo `decision` en la bitácora también cuentan, con su fecha.

### 5. Filtra y contrasta

- Descarta lo que no sirve para este tema, aunque lo hayas encontrado.
- Si dos fuentes se contradicen, muestra las dos con su fecha. Como regla general pesa más un ADR aceptado que una
  wiki, y una wiki más que una conversación; a igual tipo, la más reciente. Pero **señala la contradicción**, no la
  resuelvas en silencio.
- No completes huecos con suposiciones. Lo que no encontraste va en "Falta saber".

## Salida: la ficha de contexto

Entrega la ficha con este formato, en no más de unas 40 líneas. Cada dato lleva su fuente entre corchetes: una ruta, la
memoria `#id`, el documento de la wiki o la sesión de la bitácora.

```markdown
## Contexto: <tema>

**Proyecto:** <raíz del repo> · <stack>

**Lo que sabemos**
- <hecho> [fuente]

**Decisiones vigentes**
- <decisión, ADR o memoria de tipo decision, con fecha> [fuente]

**Pendientes o en duda**
- <contradicciones, ADRs propuestos, tareas abiertas> [fuente]

**Falta saber**
- <hasta 3 preguntas concretas que cambian cómo se haría la tarea>

**Fuentes consultadas:** <lista corta de lo revisado, incluidas las búsquedas que no dieron resultado>
```

Si una sección queda vacía, escribe "—". Si no encontraste nada útil, dilo claramente: es un resultado válido y evita
que se trabaje sobre supuestos.

### Nivel de detalle

Si la configuración personal del usuario declara su nivel (por ejemplo `rudi: nivel junior` en su `CLAUDE.md`):
- **junior:** agrega a cada decisión vigente una línea de **por qué importa** para esta tarea.
- **semi senior** y **senior:** la ficha tal cual.

Sin nivel declarado, usa el formato estándar.

## Después de la ficha

- Si el usuario corrige o agrega algo importante (un hecho, una decisión, un dato que no estaba escrito), ofrece
  guardarlo con `bitacora_guardar`, del tipo que corresponda. No guardes trivialidades.
- Si consultaste una carpeta de documentación que se va a reutilizar, ofrece indexarla con `bitacora_indexar`.
- Si otra skill de RUDI te invocó, entrega la ficha y deja que esa skill continúe.
