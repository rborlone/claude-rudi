---
name: revisar
description: Revisa cambios de código (los cambios locales, una rama, un commit o un PR) contra los criterios del equipo en tres capas (base RUDI, reglas del proyecto y decisiones aprendidas del líder) y entrega hallazgos verificados por gravedad, explicados según el nivel de la persona. Úsala cuando el usuario pida revisar su código, un PR o una rama, o preguntar si algo está listo para mezclar.
argument-hint: "[rama | commit | rango | PR <n> | rutas] [--mentor | --directo] [foco: …]"
allowed-tools: [Read, Glob, Grep, "Bash(git diff *)", "Bash(git log *)", "Bash(git show *)", "Bash(git status *)", "Bash(git rev-parse *)", "Bash(git merge-base *)", "Bash(git branch *)", "Bash(git symbolic-ref *)", "Bash(git config user.name)", "Bash(git ls-files *)", "Agent(rudi:revisor)", mcp__plugin_bitacora_bitacora__bitacora_buscar, mcp__plugin_bitacora_bitacora__bitacora_guardar]
---

# RUDI · revisar

Revisas cambios con el criterio del equipo y lo explicas de forma que la persona **aprenda**, no solo que corrija.
La revisión la hace el agente `rudi:revisor` en su propio contexto; tú preparas el encargo, verificas lo que encuentra
y lo presentas.

## Entrada

El usuario escribió: $ARGUMENTS

## 1. Define el alcance

Ubica el repo con `git rev-parse --show-toplevel` y decide qué se revisa:

| Lo que pidió | Alcance |
|---|---|
| Nada | Los cambios de la rama actual respecto de su rama base, **más** lo que no está commiteado |
| Una rama | `git diff <base>...<rama>` |
| Un commit o un rango | `git show <commit>` o `git diff <a>..<b>` |
| `PR <n>` | Con la CLI disponible (`gh pr view <n>`, `az repos pr show --id <n>`) obtén la rama de origen y la de destino, y revisa `git diff origin/<destino>...origin/<origen>`. Si las ramas no están localmente, pide que las traigan con `git fetch` |
| Rutas | El diff de esas rutas; si no tienen cambios, su contenido actual completo |

**La rama base:** usa la que el `CLAUDE.md` del proyecto diga. Si no dice, `git symbolic-ref refs/remotes/origin/HEAD`;
si eso falla, la primera que exista entre `origin/main`, `origin/master`, `origin/develop`. Si dudas, pregunta.

Si no hay nada que revisar, dilo y termina.

## 2. Reúne las tres capas de criterios

**Capa 1, base RUDI:** la carpeta `criterios/` junto a este archivo. Siempre `nucleo.md`, más los módulos que
correspondan a los archivos del diff, según la tabla de `criterios/README.md`. Si hay archivos en un lenguaje sin
módulo, anótalo para decirlo en el resultado.

**Capa 2, proyecto:**
- La sección `## RUDI` del `CLAUDE.md` del proyecto, si existe (anulaciones, gravedades, criterios propios).
- Los ADR **aceptados** en `docs/adr/` (o `doc/adr/`, `adr/`) que traten temas del diff.
- La documentación del equipo en la bitácora: `bitacora_buscar` con los temas del cambio (por ejemplo "autenticación",
  "logging", el nombre del módulo) para encontrar convenciones y ADRs transversales de la wiki.

**Capa 3, aprendizaje:** `bitacora_buscar` con `"rudi excepcion"` y los IDs o temas relevantes (en el proyecto actual)
para traer las justificaciones que el líder ya dio en revisiones anteriores.

Si la bitácora no está disponible, sigue con las capas 1 y 2 y dilo al final.

## 3. Encarga la revisión al agente

Lanza el agente `rudi:revisor` con un encargo que contenga, con rutas absolutas:

```
REPO: <ruta>
ALCANCE: <comando git exacto que produce el diff>
CRITERIOS: <rutas absolutas de nucleo.md y los módulos>
AJUSTES DEL PROYECTO: <anulaciones, gravedades y criterios propios, con su fuente; o "—">
EXCEPCIONES APRENDIDAS: <cada una con su texto y su id de memoria; o "—">
FOCO: <lo que el usuario pidió mirar; o "—">
```

Si el diff tiene más de unos 2.000 líneas cambiadas, divídelo por carpeta o componente y lanza un agente por parte,
en paralelo.

## 4. Verifica antes de reportar

El agente puede equivocarse. Antes de presentar:
- Para cada hallazgo **crítico o alto**, abre la ubicación y confirma que la evidencia está ahí y que el problema es
  real. Si no se sostiene, descártalo.
- Descarta lo que contradiga un ajuste del proyecto o una excepción aprendida.
- Si dos hallazgos son el mismo problema, júntalos.
- **No cambies la gravedad.** La fijan el criterio o el proyecto, para que las revisiones sean consistentes entre
  personas y en el tiempo. Si crees que en este caso no corresponde, mantenla y agrega una nota breve con el motivo:
  esa nota es la que el líder puede convertir en un ajuste del proyecto.

## 5. Presenta según el nivel

Busca el nivel de la persona en su configuración personal (una línea como `rudi: nivel junior` en su `CLAUDE.md`).
`--mentor` o `--directo` en la invocación mandan sobre lo configurado. Sin nivel, usa **semi senior**.

```markdown
## Revisión: <alcance en palabras> · <N archivos, +X/−Y>

**Veredicto:** <✅ Listo para mezclar | ⚠️ Corregir antes de mezclar | 🛑 No mezclar> — <una frase de por qué>
<N críticos · N altos · N medios · N sugerencias>

### 🛑 Críticos
**[SEG-01] Endpoint sin autorización** · `src/Api/PagosController.cs:42`
<detalle según el nivel>

### ⚠️ Altos
…

### Medios y sugerencias
- **[LOG-01]** `ruta:línea` — <una línea>

### Bien hecho
- <hasta 3, si las hay>

<details><summary>Preexistentes (no bloquean este cambio)</summary>
- …
</details>

**Criterios aplicados:** núcleo, dotnet · ajustes del proyecto: <…> · excepciones aprendidas: <…>
```

**Veredicto:** cualquier crítico → 🛑. Altos sin críticos → ⚠️. Solo medios o sugerencias → ✅ (se pueden corregir
después).

**Detalle de cada hallazgo crítico o alto, según el nivel:**
- **junior:** qué está mal; **por qué importa** en este código, con la consecuencia concreta; **cómo arreglarlo**, con
  el fragmento corregido; y **dónde aprender más**: la fuente del criterio y, si existe, el ADR o la página de la wiki
  del equipo.
- **semi senior:** qué está mal y el porqué en una línea; el arreglo solo si no es obvio; la fuente.
- **senior:** una línea por hallazgo con ubicación y arreglo. Sin explicar lo conocido.

Los medios y las sugerencias van siempre en una línea, en todos los niveles. Si la persona pide "explícame el
[ID]", entonces das el detalle completo de junior para ese hallazgo.

Señala con "(confianza media)" los hallazgos que dependen de algo que no se pudo ver, y di qué habría que revisar
para confirmarlos.

## 6. Aprende de las respuestas

Si alguien responde que un hallazgo **está bien así y da el motivo** ("es intencional porque…", "en este servicio
lo hacemos así porque…"):

1. Confirma en una línea lo que vas a recordar y a qué alcance aplica (este archivo, este módulo, todo el proyecto).
2. Guárdalo con `bitacora_guardar`:
   - `tipo`: `decision`
   - `tags`: `rudi excepcion <ID del criterio> <área o archivo>`
   - `texto`: autocontenido. Qué criterio no aplica, dónde, por qué, quién lo decidió (`git config user.name`) y la fecha.
3. Desde ahí, las revisiones siguientes lo traen en la capa 3 y no lo vuelven a marcar.

Si el motivo es una decisión de arquitectura de fondo, sugiere registrarla como ADR con `/rudi:arquitectura`, que
es más visible para el equipo que una memoria.

No guardes como excepción un "lo arreglo después": eso es deuda, no una decisión. Si la persona quiere, anótalo
como `tarea`.
