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
| `/rudi:revisar` | ✅ v0.2 | Revisa cambios locales, una rama, un commit o un PR contra criterios en capas (base de RUDI, reglas del proyecto, decisiones del líder). Verifica los hallazgos, los explica según tu nivel y aprende de tus justificaciones |
| `/rudi:arquitectura` | ✅ v0.3 | Evalúa alternativas, propone ADRs en formato MADR (con reglas que `/rudi:revisar` aplica una vez aceptados), revisa diseños contra la arquitectura actual y gestiona el estado de los ADRs: solo un líder acepta |

Además, RUDI trae **barandas de producción**: antes de que Claude ejecute un comando peligroso contra producción,
pide tu confirmación y explica por qué (ver [más abajo](#barandas-de-producción)).

El diseño completo está en [`docs/diseno.md`](docs/diseno.md).

## Requisitos

- Claude Code
- El plugin **bitácora** (memoria y búsqueda de documentación). Sin él, RUDI funciona, pero solo con el repo y las fuentes que le pases.
- Node.js en el `PATH` (lo usan las barandas; la bitácora ya lo exige).

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

/rudi:revisar                          # tu rama contra su base, más lo no commiteado
/rudi:revisar PR 1234
/rudi:revisar feature/pagos --mentor   # explicación completa aunque seas senior
/rudi:revisar foco: seguridad

/rudi:arquitectura evaluar dónde validar los tokens: middleware propio, framework o gateway
/rudi:arquitectura adr usar JwtBearer del framework con FallbackPolicy
/rudi:arquitectura diseno docs/propuesta-colas.md
/rudi:arquitectura aceptar 0007
/rudi:arquitectura listar
```

Los criterios están en [`skills/revisar/criterios/`](skills/revisar/criterios/). Cada proyecto puede anularlos,
cambiar su gravedad o agregar los suyos desde una sección `## RUDI` en su `CLAUDE.md`. Cuando respondes que algo está
bien así y das el motivo, RUDI lo guarda en la bitácora y no lo vuelve a marcar.

### Configuración del proyecto

En el `CLAUDE.md` de cada proyecto:

```markdown
## RUDI
- lideres: Nombre Apellido, Otra Persona      # quienes pueden aceptar ADRs (su git user.name)
- adr-transversales: ../arquitectura/adr      # dónde van los ADRs que abarcan varios repos
- anula: MAN-02 — motivo (ADR-0004)
- gravedad: TST-01 = media — motivo
```

### Información de otros proyectos

La bitácora guarda lo de todos tus proyectos, que pueden ser de clientes distintos. RUDI usa esa información para
razonar, pero no la copia en lo que entrega en otro proyecto (ADRs, revisiones, documentos): a lo sumo la cita de
forma genérica.

Para que RUDI encuentre la documentación de tu equipo, indéxala una vez en la bitácora:

> *"Indexa la wiki que está en ~/Proyectos/MiProyecto/wiki"*

## Barandas de producción

Antes de cada comando de Bash, RUDI revisa si es peligroso. Si lo es, **pide confirmación** con el motivo; no lo
bloquea, y tú decides. Los comandos de solo lectura nunca preguntan.

| Pregunta antes de… | Cuándo |
|---|---|
| `kubectl` que modifica (`delete`, `apply`, `scale`, `rollout restart`…) y `helm install/upgrade/uninstall/rollback` | En un contexto o namespace de producción |
| `terraform`/`tofu` `destroy`, `state rm/mv`, `taint`, `force-unlock` | Siempre |
| `terraform apply` | En un workspace de producción, o siempre si el proyecto no los declara |
| `DROP`, `TRUNCATE`, `ALTER TABLE … DROP`, `DELETE`/`UPDATE` sin `WHERE` con `sqlcmd`, `psql`, `mysql`… (también dentro de un `-i archivo.sql`) | Siempre; el motivo dice si el servidor es de producción |
| `git push --force` | A una rama protegida (`main` y `master` por defecto) |
| `az … delete` | Siempre |

Cada proyecto declara qué es producción en un `.rudi.json` en la raíz del repo (versionado):

```json
{
  "produccion": {
    "kube_contextos": ["aks-miapp-prod"],
    "kube_namespaces": ["pagos", "*-prod"],
    "sql_servidores": ["sql-miapp-prod.database.windows.net"],
    "terraform_workspaces": ["prod"],
    "ramas_protegidas": ["main", "release/*"]
  }
}
```

Sin `.rudi.json`, se considera de producción todo contexto, namespace o servidor cuyo nombre contenga `prod`, `prd`,
`production` o `produccion`. Las listas admiten `*` como comodín.

## Desarrollo

```sh
claude --plugin-dir .            # probar el plugin local sin instalarlo
claude plugin validate .         # validar los manifiestos
npm test                         # pruebas de las barandas
```

Los casos de evaluación están en [`evals/casos/`](evals/casos/): cada uno arma un repo de prueba con problemas
conocidos (`armar.sh`) y describe qué debería encontrar una buena revisión (`esperado.md`).
