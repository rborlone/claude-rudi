# Criterios base · núcleo

Aplican a **cualquier lenguaje y stack**. Los módulos por tecnología (`dotnet.md`, `react.md`, …) los concretan, y un
proyecto puede anular cualquiera por su ID desde su `CLAUDE.md` o un ADR aceptado.

**Gravedad**
- **crítica:** no debería mezclarse. Riesgo de seguridad, pérdida de datos o caída.
- **alta:** hay que corregirla antes de mezclar, o dejarla registrada como deuda con un responsable.
- **media:** conviene corregirla; se puede dejar para después si se justifica.
- **sugerencia:** mejora opcional. Nunca bloquea.

Cada criterio dice **qué** se espera, **por qué** (lo que explica el modo mentor), las **señales** para detectarlo y la
**fuente** que lo respalda.

---

## SEG · Seguridad

### SEG-01 · Autorización explícita en cada operación · crítica
- **Qué:** cada endpoint u operación declara quién puede ejecutarla. Lo público es la excepción y se marca como tal.
- **Por qué:** si la autorización es opcional, basta con olvidarla una vez para exponer datos. "Público por omisión" es la causa más frecuente de fugas en APIs.
- **Señales:** endpoints sin atributo, decorador o middleware de autorización; autenticación que solo "adjunta" el usuario si el token es válido, pero deja pasar la petición si no lo es; la identidad del usuario tomada de parámetros de la URL o del cuerpo.
- **Fuente:** OWASP API Security Top 10 2023 · API1 (BOLA) y API5 (BFLA).

### SEG-02 · Autorización a nivel de objeto · crítica
- **Qué:** además de "¿está autenticado?", se comprueba que el usuario tenga derecho sobre **ese** registro (ese proveedor, ese documento).
- **Por qué:** cambiar un ID en la URL es el ataque más simple que existe. Si el backend no compara el dueño del recurso con el usuario, cualquiera lee lo de otros.
- **Señales:** consultas por ID recibido del cliente sin filtrar por el usuario o la organización del token.
- **Fuente:** OWASP API Security Top 10 2023 · API1.

### SEG-03 · Validación completa de tokens · crítica
- **Qué:** los tokens se validan con firma, expiración, emisor y audiencia, usando el mecanismo estándar del framework.
- **Por qué:** sin validar emisor y audiencia, un token emitido para otro sistema que comparte la clave sirve en este.
- **Señales:** `ValidateIssuer`/`ValidateAudience` (o equivalentes) en falso; validación manual en vez de la del framework; claves de firma cortas o dentro del código.
- **Fuente:** RFC 8725 (JWT Best Current Practices); OWASP ASVS v4 · V3.

### SEG-04 · Consultas parametrizadas · crítica
- **Qué:** ningún dato externo se concatena en SQL, comandos del sistema, rutas de archivo ni expresiones evaluadas.
- **Por qué:** la inyección sigue siendo una de las vulnerabilidades más explotadas, y la parametrización la elimina por completo.
- **Señales:** SQL armado con concatenación o interpolación; SQL dinámico dentro de stored procedures sin `sp_executesql` con parámetros; `exec`, `eval` o `shell=True` con datos del usuario.
- **Fuente:** OWASP Top 10 2021 · A03; OWASP SQL Injection Prevention Cheat Sheet.

### SEG-05 · Sin secretos en el código ni en el repo · crítica
- **Qué:** contraseñas, cadenas de conexión, claves y tokens vienen de un gestor de secretos o de variables del entorno, nunca del código, los archivos de configuración versionados ni las imágenes.
- **Por qué:** lo que entra al historial de git no se borra con un commit posterior. Un secreto versionado debe considerarse comprometido.
- **Señales:** valores con forma de clave en el código o en `appsettings`, `.env`, YAML de pipelines o Helm; `--build-arg` con secretos (quedan en las capas de la imagen).
- **Fuente:** OWASP ASVS v4 · V6.4; OWASP Secrets Management Cheat Sheet.

### SEG-06 · Validación de entradas en el borde · alta
- **Qué:** toda entrada externa (cuerpo, query, headers, archivos) se valida por tipo, largo, rango y formato antes de usarse. Los archivos subidos se validan por contenido, no solo por extensión.
- **Por qué:** cada validación que falta se convierte en un error 500, en datos corruptos o en la puerta de entrada de un ataque.
- **Señales:** modelos sin reglas de validación; validación que existe pero cuyo resultado no se usa; archivos aceptados sin límite de tamaño.
- **Fuente:** OWASP ASVS v4 · V5; OWASP Input Validation Cheat Sheet.

### SEG-07 · No filtrar detalles internos · alta
- **Qué:** las respuestas de error no exponen stack traces, SQL, rutas ni versiones. La documentación interactiva de la API (Swagger y similares) no queda expuesta en producción sin protección.
- **Por qué:** cada detalle interno le ahorra trabajo a un atacante.
- **Señales:** `ex.Message` o `ex.ToString()` devueltos al cliente; páginas de error de desarrollo habilitadas en todos los ambientes; Swagger habilitado sin condición de ambiente.
- **Fuente:** OWASP Top 10 2021 · A05 (Security Misconfiguration).

### SEG-08 · Dependencias al día y sin vulnerabilidades conocidas · media
- **Qué:** no se agregan dependencias con vulnerabilidades conocidas ni abandonadas. Las versiones del runtime y del framework tienen soporte vigente.
- **Por qué:** la mayor parte del código que corre en producción es de terceros.
- **Señales:** runtime fuera de soporte; paquetes con avisos de seguridad; dependencias nuevas sin justificar o duplicando una que ya existe.
- **Fuente:** OWASP Top 10 2021 · A06.

## ERR · Manejo de errores

### ERR-01 · No tragarse excepciones · alta
- **Qué:** ningún `catch` vacío ni que solo continúe. Cada error se maneja (con una decisión explícita), se registra o se propaga.
- **Por qué:** un error silenciado no desaparece: aparece después, lejos de la causa y mucho más caro de diagnosticar.
- **Señales:** `catch {}`, `except: pass`, `.catch(() => {})`; valores por defecto que ocultan un fallo (por ejemplo, un ID que queda en 0 si no se pudo leer).
- **Fuente:** práctica general; CWE-390, CWE-391.

### ERR-02 · Códigos de estado que dicen la verdad · media
- **Qué:** el estado HTTP corresponde a lo que pasó. 400 para una entrada inválida, 401 sin autenticación, 403 sin permiso, 404 si no existe, 409 por conflicto y 5xx para fallas del servidor.
- **Por qué:** clientes, monitoreo y reintentos toman decisiones según el código. Un 400 por una falla de base de datos hace que nadie reintente y que la alerta no salte.
- **Señales:** todo error convertido en 400 o en 200 con un flag; validación fallida respondida con 403; excepciones del servidor devueltas como errores del cliente.
- **Fuente:** RFC 9110 · sección 15; RFC 9457 (Problem Details).

### ERR-03 · Manejo centralizado · media
- **Qué:** el manejo genérico de errores (registrar, ocultar detalles, armar la respuesta) vive en un solo lugar: middleware, filtro o handler global. El código de negocio solo captura lo que sabe manejar.
- **Por qué:** el mismo `try/catch` repetido en cada endpoint diverge con el tiempo, y cada copia es un lugar más donde equivocarse.
- **Señales:** el mismo bloque de captura copiado en muchos métodos.
- **Fuente:** guías oficiales de cada framework (por ejemplo, ASP.NET Core "Handle errors").

## LOG · Logging y observabilidad

### LOG-01 · Logs estructurados y con contexto · media
- **Qué:** los logs usan plantillas con campos (no texto concatenado) e incluyen un identificador de correlación de la petición.
- **Por qué:** con campos se puede buscar y agrupar ("todos los errores del folio 123"); con texto armado, no.
- **Señales:** `string.Format`, concatenación o interpolación dentro de la llamada al logger; parámetros que no corresponden a la plantilla.
- **Fuente:** OpenTelemetry Logs; documentación de logging de cada framework.

### LOG-02 · Nivel de log adecuado · media
- **Qué:** `Critical`/`Fatal` solo para fallas que dejan el sistema inservible; `Error` para operaciones fallidas; `Warning` para lo anómalo pero recuperable; `Information` para hitos.
- **Por qué:** si todo es crítico, nada lo es. Las alertas pierden valor y la gente las ignora.
- **Señales:** cualquier excepción registrada como crítica; trazas de depuración en nivel `Information`.
- **Fuente:** práctica general de observabilidad.

### LOG-03 · Nada sensible en los logs · alta
- **Qué:** los logs no contienen contraseñas, tokens, datos de tarjetas ni datos personales innecesarios.
- **Por qué:** los logs se copian, se exportan y los lee mucha más gente que la base de datos.
- **Señales:** objetos de petición completos serializados al log; headers `Authorization` registrados.
- **Fuente:** OWASP Logging Cheat Sheet; leyes de protección de datos personales.

## DAT · Datos y persistencia

### DAT-01 · Recursos siempre liberados · alta
- **Qué:** conexiones, comandos, streams y archivos se cierran incluso cuando hay errores (`using`, `with`, `try/finally`).
- **Por qué:** una conexión que no vuelve al pool no falla de inmediato: agota el pool horas después, con carga, y tumba el servicio.
- **Señales:** objetos desechables creados sin `using`; `Dispose`/`Close` llamados al final del bloque, pero no en el camino de error.
- **Fuente:** documentación de cada runtime; CWE-404.

### DAT-02 · Transacciones donde hay más de una escritura · alta
- **Qué:** las operaciones que escriben en más de un lugar y deben ocurrir juntas van en una transacción, o tienen compensación explícita.
- **Por qué:** sin transacción, una falla a mitad de camino deja datos a medias que nadie sabe reparar.
- **Señales:** varias escrituras seguidas sin transacción; escritura en la base y en un almacenamiento externo sin manejar que una falle.
- **Fuente:** práctica general (ACID).

### DAT-03 · Consultas acotadas · media
- **Qué:** los listados tienen paginación o un límite. No hay consultas dentro de bucles (N+1).
- **Por qué:** lo que funciona con 100 filas en desarrollo se cae con 100.000 en producción.
- **Señales:** listados sin límite; una consulta por cada elemento de una lista; `SELECT *` hacia la aplicación.
- **Fuente:** práctica general de rendimiento.

### DAT-04 · Cambios de esquema versionados y reversibles · alta
- **Qué:** todo cambio de tablas, índices o stored procedures va en un script o migración versionado, con su reversa o un plan de rollback.
- **Por qué:** un cambio aplicado a mano en producción no se puede reproducir, revisar ni deshacer con seguridad.
- **Señales:** el PR cambia código que depende de un cambio de base de datos que no está en el PR.
- **Fuente:** práctica general de entrega continua.

## API · Contratos

### API-01 · Contratos estables y explícitos · media
- **Qué:** las respuestas usan tipos definidos (no tipos dinámicos ni tablas genéricas). Un cambio que rompe a los clientes se versiona o se coordina.
- **Por qué:** un contrato implícito se rompe sin que nadie lo note hasta que falla el front o una integración.
- **Señales:** retorno de `dynamic`, `object`, `DataTable`, `any` o diccionarios; campos renombrados o eliminados sin versionar.
- **Fuente:** Microsoft REST API Guidelines; Google API Design Guide.

### API-02 · Operaciones idempotentes donde se reintenta · media
- **Qué:** los callbacks, webhooks y operaciones de pago toleran recibir la misma petición dos veces.
- **Por qué:** los proveedores externos reintentan. Sin idempotencia, se cobra o se registra dos veces.
- **Señales:** callbacks que insertan sin verificar si ya se procesó.
- **Fuente:** RFC 9110 · 9.2.2; documentación de pasarelas de pago.

## CFG · Configuración

### CFG-01 · La configuración depende del ambiente, el código no · media
- **Qué:** las diferencias entre ambientes viven en configuración. No hay `if (produccion)` dispersos ni URLs fijas en el código.
- **Por qué:** cada valor fijo en el código obliga a recompilar para cambiar de ambiente y es un error esperando ocurrir en el deploy.
- **Señales:** URLs, nombres de servidor o rutas fijas; código comentado para "activar en prod".
- **Fuente:** The Twelve-Factor App · III. Config.

## TST · Tests

### TST-01 · Lo que se arregla o se agrega, se prueba · alta
- **Qué:** cada corrección de bug viene con un test que habría fallado antes del arreglo. Cada lógica nueva con reglas de negocio trae tests de sus casos principales y sus bordes.
- **Por qué:** un bug arreglado sin test vuelve. El test documenta además qué se esperaba.
- **Señales:** PR de corrección sin tests; lógica con muchas ramas y ningún test; tests que no verifican nada.
- **Fuente:** práctica general de ingeniería.
- **Si el proyecto no tiene tests:** no se marca como bloqueante, pero se señala una vez por revisión con una propuesta concreta del primer test que valdría la pena.

## MAN · Mantenibilidad

### MAN-01 · Responsabilidades acotadas · sugerencia
- **Qué:** clases y funciones con una responsabilidad clara. Archivos de miles de líneas y métodos de cientos son señal de que hay que dividir.
- **Por qué:** el código grande se revisa peor, se prueba peor y genera conflictos de merge.
- **Señales:** clases con muchas dependencias o muchos métodos sin relación; métodos de más de unas 60 líneas.
- **Fuente:** principio de responsabilidad única.
- **En código existente:** no se exige refactorizar lo que no se tocó. Se pide no agrandar el problema.

### MAN-02 · Capas respetadas · media
- **Qué:** cada capa usa solo la de abajo. Por ejemplo, un controller llama a servicios, no directamente a repositorios ni a la base.
- **Por qué:** saltarse capas reparte reglas de negocio por lugares donde nadie las busca.
- **Señales:** controllers o componentes de UI con acceso directo a datos o con reglas de negocio.
- **Fuente:** arquitectura en capas / limpia.

### MAN-03 · Sin código muerto ni comentado · sugerencia
- **Qué:** no se agrega código comentado, duplicado ni sin uso. Para recuperar algo está git.
- **Por qué:** el código comentado confunde ("¿esto va o no va?") y nunca se limpia.
- **Fuente:** práctica general.

## REN · Rendimiento y recursos

### REN-01 · Entrada y salida asíncronas en servicios concurrentes · media
- **Qué:** en servidores que atienden muchas peticiones, el acceso a red, disco y base de datos es asíncrono, de punta a punta.
- **Por qué:** cada llamada bloqueante ocupa un hilo esperando. Con carga se agotan y el servicio deja de responder aunque la CPU esté libre.
- **Señales:** I/O sincrónica en el camino de una petición; `.Result`, `.Wait()` o equivalentes sobre tareas asíncronas.
- **Fuente:** guías de rendimiento de cada framework.

### REN-02 · Timeouts y límites en llamadas externas · media
- **Qué:** toda llamada a otro servicio tiene timeout, y los reintentos tienen límite y espera creciente.
- **Por qué:** un servicio externo lento sin timeout arrastra al tuyo.
- **Señales:** clientes HTTP sin timeout; reintentos infinitos o inmediatos.
- **Fuente:** patrones de resiliencia (timeout, retry, circuit breaker).
