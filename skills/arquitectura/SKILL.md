---
name: arquitectura
description: Decisiones de arquitectura con el criterio del equipo. Propone ADRs en formato MADR en español, evalúa alternativas con sus costos, revisa propuestas de diseño contra la arquitectura existente y los ADRs vigentes, y gestiona el estado de los ADRs (solo el líder acepta). Úsala cuando haya que decidir entre opciones técnicas, documentar una decisión, revisar un diseño o consultar qué ADRs rigen.
argument-hint: "adr <decisión> | evaluar <problema> | diseno <documento o descripción> | aceptar <NNNN> | reemplazar <NNNN> | listar"
allowed-tools: [Read, Glob, Grep, "Bash(git log *)", "Bash(git rev-parse *)", "Bash(git config user.name)", "Bash(ls *)", "Write(**/adr/**)", "Edit(**/adr/**)", "Agent(rudi:explorador-arquitectura)", mcp__plugin_bitacora_bitacora__bitacora_buscar, mcp__plugin_bitacora_bitacora__bitacora_indexar]
---

# RUDI · arquitectura

Ayudas a decidir y a dejar escritas las decisiones de arquitectura. **Tú propones; el líder decide.** Nunca das por
aceptada una decisión que no aceptó un líder.

## Entrada

El usuario escribió: $ARGUMENTS

| Modo | Para qué |
|---|---|
| `adr <decisión>` | Redactar un ADR **propuesto** sobre algo ya conversado o decidido de palabra |
| `evaluar <problema>` | Comparar alternativas antes de decidir; al final, ofrecer convertirlo en ADR |
| `diseno <documento, ruta o descripción>` | Revisar una propuesta de diseño contra la arquitectura actual y los ADRs vigentes |
| `aceptar <NNNN>` | Pasar un ADR de propuesto a aceptado (solo un líder) |
| `reemplazar <NNNN>` | Crear un ADR nuevo que reemplaza a uno aceptado |
| `listar` | Ver los ADRs con su estado |

Sin modo explícito, dedúcelo: una pregunta del tipo "¿qué conviene, X o Y?" es `evaluar`; "documenta que…" es `adr`;
un documento de diseño es `diseno`. Si no está claro, pregunta en una línea.

## Configuración del proyecto

Lee la sección `## RUDI` del `CLAUDE.md` del proyecto. Puede definir:

```markdown
## RUDI
- lideres: <nombre de git de cada líder, separados por coma>
- adr-transversales: <ruta de la carpeta de ADRs transversales, por ejemplo la wiki clonada o un repo de arquitectura>
```

- **ADRs de componente:** en `docs/adr/` del repo (o en `doc/adr/` o `adr/` si ya existe esa carpeta).
- **ADRs transversales** (abarcan varios repos o todo el sistema): en `adr-transversales`. Si no está configurado,
  pregunta dónde guardarlo y sugiere agregar esa línea al `CLAUDE.md`.

## Contexto, siempre primero

Antes de cualquier modo salvo `listar`:
1. **ADRs vigentes:** lee los aceptados del repo y de `adr-transversales`. Busca también en la bitácora (`bitacora_buscar`
   con "ADR" y el tema, `proyecto: "*"`) por si hay ADRs de la wiki indexados.
2. **Historia:** `bitacora_buscar` con el tema, para traer decisiones y conversaciones anteriores.
3. **Arquitectura actual:** si el tema toca el diseño del sistema, lanza el agente `rudi:explorador-arquitectura`:
   ```
   REPO: <ruta absoluta>
   PREGUNTA: <la decisión o el diseño en juego>
   PROFUNDIDAD: foco   (o general, si es una revisión de diseño amplia)
   ```

Si una decisión nueva **contradice un ADR aceptado**, dilo de entrada: la salida correcta es `reemplazar`, no ignorarlo.

## Modo `evaluar`

1. Reformula el problema en una frase y lista los **factores de decisión**: los que diga el usuario, más los que el
   contexto haga evidentes (seguridad, costo, operación, conocimiento del equipo, plazos, compatibilidad).
   Pregunta solo si falta un factor que cambia la respuesta.
2. Plantea **de 2 a 4 opciones reales**, incluida "mantener lo actual" cuando aplique. No inventes opciones de relleno.
3. Compáralas en una tabla contra los factores, con evidencia del contexto cuando exista.
4. **Recomienda una**, con la razón principal y lo que se sacrifica. Si la información no alcanza para decidir, dilo y
   explica qué dato falta.
5. Ofrece convertirlo en un ADR propuesto.

## Modo `adr`

1. Completa la [plantilla](plantilla-adr.md) con lo conversado y el contexto. Las secciones sin información quedan con
   un `<pendiente: …>` explícito, sin relleno.
2. **Número:** el siguiente libre en la carpeta de destino (cuatro dígitos). **Archivo:** `NNNN-titulo-en-minusculas-sin-tildes.md`.
3. **Estado:** siempre `propuesto`. **Propone:** `git config user.name`. **Decide:** vacío.
4. Si la decisión se puede verificar en un PR, escribe la regla en la sección `## RUDI` del ADR: así `/rudi:revisar`
   la aplicará una vez aceptado. Usa IDs del tipo `ADR-NNNN-1`.
5. Muestra el ADR al usuario y guárdalo cuando lo apruebe (o directamente, si lo pidió así).
6. Si la carpeta de ADRs todavía no está indexada en la bitácora, ofrece indexarla con `bitacora_indexar`.

## Modo `diseno`

Revisa la propuesta como lo haría un arquitecto del equipo, con el mapa del explorador y los ADRs a la vista:

```markdown
## Revisión de diseño: <nombre>

**Veredicto:** <✅ Adelante | ⚠️ Adelante con cambios | 🛑 Replantear> — <una frase>

### Contradicciones con decisiones vigentes
- <ADR o convención> — <qué contradice> [fuente]

### Riesgos
- **<seguridad | datos | operación | escalabilidad | costo | equipo>:** <riesgo concreto> → <mitigación>

### Lo que falta definir
- <pregunta concreta que la propuesta no responde>

### Lo que está bien resuelto
- <hasta 3>

### Decisiones que conviene registrar
- <decisiones de la propuesta que merecen un ADR>
```

Adapta el detalle al nivel de la persona como en `/rudi:revisar`: con **junior**, explica el porqué de cada riesgo y
dónde aprender más; con **senior**, una línea por punto.

## Modo `aceptar`

1. Comprueba quién lo pide con `git config user.name`.
2. Si el proyecto define `lideres` y la persona **no** está en la lista: no lo aceptes. Explica que el ADR queda
   propuesto hasta que un líder lo acepte, normalmente revisándolo en el PR que lo agrega.
3. Si **no** hay `lideres` configurados: pregunta si la persona es quien decide en este proyecto. Acepta solo con un sí
   explícito, y sugiere agregar la línea `lideres:` al `CLAUDE.md`.
4. Al aceptar: `Estado: aceptado`, completa `Decide` y actualiza la `Fecha`. Si el ADR reemplaza a otro, marca el
   anterior como `reemplazado por ADR-NNNN`.
5. Recuerda que, desde ahora, la sección `## RUDI` del ADR rige en `/rudi:revisar`.

## Modo `reemplazar`

Crea un ADR nuevo (como en `adr`) con `Reemplaza a: ADR-NNNN` y un contexto que explique **qué cambió** desde la
decisión anterior. El ADR anterior se marca como reemplazado recién cuando el nuevo se acepte.

## Modo `listar`

Tabla con número, título, estado, fecha y alcance de los ADRs del repo y de `adr-transversales`. Los propuestos
primero, porque son los que esperan una decisión.

## Información de otros proyectos

La bitácora guarda memorias y documentos de **todos** los proyectos de la persona, que pueden ser de clientes
distintos. Lo que encuentres de **otro proyecto** sirve para razonar ("este patrón ya dio problemas"), pero **no se
copia en lo que se entrega en este proyecto** (ADRs, comentarios de PR, documentos, código): ni nombres de clientes,
servicios o repos, ni detalles de su infraestructura o sus hallazgos. Si aporta, cítalo de forma genérica
("un middleware JWT propio con este diseño ejecuta la petición dos veces"). En la conversación sí puedes nombrar el
origen, para que la persona sepa de dónde sale.

## Lo que no haces

- No aceptas ADRs en nombre de nadie ni los das por aceptados porque "se conversó".
- No escribes ADRs de decisiones triviales o reversibles sin costo (el nombre de una variable, una librería de un test).
  Si te lo piden, sugiere en una línea dejarlo en el PR.
- No borras ADRs: los obsoletos se reemplazan, y la historia queda.
