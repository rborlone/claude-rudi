# Criterios de revisión de RUDI

`/rudi:revisar` revisa en tres capas. Esta carpeta es la **capa 1**.

| Capa | De dónde sale | Quién la mantiene |
|---|---|---|
| 1. Base RUDI | Esta carpeta: un núcleo agnóstico + módulos por tecnología, respaldados por estándares | RUDI (cambios por PR al repo de RUDI) |
| 2. Proyecto | `CLAUDE.md`, ADRs aceptados y la wiki del proyecto | El equipo del proyecto |
| 3. Aprendizaje | Justificaciones del líder guardadas en la bitácora | Se acumula al revisar |

Las capas superiores ganan: un proyecto puede **anular** un criterio por su ID, **cambiar su gravedad** o **agregar**
criterios propios con su propio prefijo.

## Archivos

| Archivo | Se activa con |
|---|---|
| [`nucleo.md`](nucleo.md) | Siempre |
| [`dotnet.md`](dotnet.md) | `*.cs`, `*.csproj`, `*.sln`, `appsettings*.json` |
| [`react.md`](react.md) | `*.jsx`, `*.tsx`, o JS/TS con `react` en `package.json` |
| [`sql.md`](sql.md) | `*.sql`, stored procedures, migraciones, SQL embebido |
| [`python.md`](python.md) | `*.py`, `pyproject.toml`, `requirements*.txt` |

Si el cambio está en un lenguaje sin módulo (Go, Java, PHP…), se aplica el núcleo con el conocimiento general del
lenguaje, y la revisión lo dice explícitamente.

## Cómo anula o ajusta un proyecto

En el `CLAUDE.md` del proyecto, o en un ADR aceptado:

```markdown
## RUDI
- anula: MAN-02 — en este servicio los controllers llaman a repositorios por diseño (ver ADR-0004)
- gravedad: TST-01 = media — proyecto heredado sin suite de tests; se agregan de a poco
- agrega: PRJ-01 · alta — todo endpoint nuevo se registra en la colección de Postman del equipo
```

## Formato de un criterio

```markdown
### PFX-NN · Título corto · gravedad [criterios del núcleo que concreta]
- **Qué:** lo que se espera, verificable en el código.
- **Por qué:** la consecuencia de no hacerlo (es lo que explica el modo mentor).
- **Señales:** cómo se ve en el código cuando falta.
- **Fuente:** el estándar o la guía oficial que lo respalda.
```

Un criterio sin fuente reconocida, o que solo describe "cómo lo hacemos hoy", no entra en la base: va en la capa del
proyecto.
