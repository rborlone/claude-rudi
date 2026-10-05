# Criterios base · .NET / ASP.NET Core

**Se activa si:** el cambio toca `*.cs`, `*.csproj`, `*.sln` o `appsettings*.json`.
Concreta el [núcleo](nucleo.md) para .NET; las referencias entre corchetes indican el criterio general.

### NET-01 · Autorización con el sistema del framework · crítica [SEG-01, SEG-03]
- **Qué:** autenticación registrada con `AddAuthentication().AddJwtBearer(...)` (o el esquema que corresponda), `UseAuthentication()` antes de `UseAuthorization()`, y una política por defecto que exija usuario autenticado (`FallbackPolicy` o `[Authorize]` en una base común). Lo público lleva `[AllowAnonymous]`.
- **Por qué:** un middleware propio que "adjunta el usuario si el token es válido" no bloquea nada por sí mismo: si un endpoint no lo revisa a mano, queda público.
- **Señales:** middleware JWT propio con `ValidateToken` dentro de un `try/catch`; `UseAuthorization()` sin esquema registrado; ningún `[Authorize]` en el proyecto; la identidad leída de `HttpContext.Items` en vez de `User`.
- **Fuente:** Microsoft Learn · "Simple authorization in ASP.NET Core" y "Require authenticated users".

### NET-02 · Un middleware llama a `next` una sola vez · crítica [ERR-01]
- **Qué:** en cada camino de ejecución de un middleware, `await next(context)` se llama como máximo una vez, y nunca después de haber escrito la respuesta.
- **Por qué:** llamarlo dos veces ejecuta la petición completa dos veces: dobles escrituras en base de datos y errores de "la respuesta ya comenzó".
- **Señales:** `_next(context)` dentro de un `catch` y también al final del método.
- **Fuente:** Microsoft Learn · "Write custom ASP.NET Core middleware".

### NET-03 · Validación con resultado 400 · alta [SEG-06, ERR-02]
- **Qué:** usar `[ApiController]` (o revisar `ModelState`) para responder **400** con `ValidationProblemDetails` cuando la entrada no es válida. Las reglas van en atributos de DataAnnotations o con FluentValidation.
- **Señales:** `if (!ModelState.IsValid)` que responde 403 u otro código; DTOs sin reglas de validación.
- **Fuente:** Microsoft Learn · "Model validation in ASP.NET Core".

### NET-04 · Errores con `IExceptionHandler` / `ProblemDetails` · media [ERR-02, ERR-03, SEG-07]
- **Qué:** `AddProblemDetails()` + `UseExceptionHandler()` (o un `IExceptionHandler` en .NET 8+) como único manejo genérico. Los controllers no repiten `try/catch (Exception)`.
- **Señales:** el mismo bloque `catch (Exception ex)` con la misma respuesta en cada acción; errores del servidor respondidos con 400.
- **Fuente:** Microsoft Learn · "Handle errors in ASP.NET Core APIs".

### NET-05 · Logging con plantillas · media [LOG-01, LOG-02]
- **Qué:** `_logger.LogError(ex, "Falló el folio {Folio}", folio)`: plantilla con nombres y parámetros aparte. Sin `string.Format`, interpolación ni concatenación en el mensaje.
- **Por qué:** con interpolación, Serilog y similares pierden los campos estructurados y crean una plantilla distinta por cada valor.
- **Señales:** `$"..."` o `string.Format` dentro de `Log*`; plantillas sin marcadores pero con argumentos extra (por ejemplo `LogInformation("Controller", "Accion")`); `LogCritical` para cualquier excepción.
- **Fuente:** Microsoft Learn · "Logging in .NET" (message templates); analizador CA2254.

### NET-06 · Async de punta a punta · media [REN-01]
- **Qué:** acciones `async Task<IActionResult>`, acceso a datos con métodos `*Async` y `CancellationToken` propagado desde la acción.
- **Señales:** `.Result`, `.Wait()`, `GetAwaiter().GetResult()`; acciones `async` que no hacen `await` de nada; ADO.NET o EF sincrónicos dentro de una petición.
- **Fuente:** Microsoft Learn · "ASP.NET Core Best Practices".

### NET-07 · Acceso a datos seguro y liberado · alta [SEG-04, DAT-01]
- **Qué:** `SqlConnection`, `SqlCommand` y `SqlDataReader` con `using`/`await using`; parámetros tipados (`SqlParameter` con `SqlDbType`) o EF Core/Dapper; nada de `FromSqlRaw` con interpolación.
- **Señales:** `Dispose()` manual al final del método; `AddWithValue` con tipos ambiguos en columnas indexadas; `ExecuteSqlRaw($"...")`.
- **Fuente:** Microsoft Learn · "SQL queries" (EF Core) y documentación de `Microsoft.Data.SqlClient`.

### NET-08 · Inyección de dependencias con el ciclo de vida correcto · media [MAN-02]
- **Qué:** los `DbContext` y los servicios que los usan son `Scoped`; `HttpClient` se obtiene de `IHttpClientFactory`; no se crean dependencias con `new` dentro de servicios.
- **Señales:** `new HttpClient()` por petición; servicios `Singleton` que dependen de un `Scoped`; `new ConfigClass()` que lee variables de entorno dentro de la lógica.
- **Fuente:** Microsoft Learn · "Dependency injection guidelines" e "IHttpClientFactory".

### NET-09 · Configuración tipada y secretos fuera del repo · alta [SEG-05, CFG-01]
- **Qué:** opciones con `IOptions<T>` y secretos desde Key Vault, variables de entorno o User Secrets en desarrollo. `appsettings.json` versionado sin secretos.
- **Fuente:** Microsoft Learn · "Options pattern" y "Safe storage of app secrets".

### NET-10 · Exposición controlada por ambiente · alta [SEG-07]
- **Qué:** Swagger UI y `UseDeveloperExceptionPage` solo en Development, o protegidos si se necesitan en otro ambiente. CORS con orígenes explícitos, sin `AllowAnyOrigin` junto con credenciales.
- **Señales:** `app.UseSwagger()` fuera de un `if (app.Environment.IsDevelopment())`; CORS abierto.
- **Fuente:** Microsoft Learn · "Enable CORS" y "Swagger/OpenAPI".

### NET-11 · Runtime con soporte · media [SEG-08]
- **Qué:** `TargetFramework` en una versión con soporte vigente de Microsoft (LTS o STS).
- **Señales:** `net6.0` o anterior (sin soporte desde noviembre de 2024).
- **Fuente:** política de soporte de .NET.

### NET-12 · Nullability y advertencias · sugerencia [MAN-01]
- **Qué:** `<Nullable>enable</Nullable>` en proyectos nuevos; no se agregan advertencias nuevas del compilador ni de los analizadores.
- **Fuente:** Microsoft Learn · "Nullable reference types".
