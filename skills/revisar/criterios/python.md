# Criterios base · Python

**Se activa si:** el cambio toca `*.py`, `pyproject.toml`, `requirements*.txt` o `Pipfile`.
Concreta el [núcleo](nucleo.md) para Python; las referencias entre corchetes indican el criterio general.

### PY-01 · Nada de ejecutar datos externos · crítica [SEG-04]
- **Qué:** sin `eval`, `exec`, `pickle.loads` ni `yaml.load` (sin `SafeLoader`) sobre datos externos; `subprocess` con lista de argumentos, sin `shell=True` con datos del usuario.
- **Fuente:** documentación de Python (`subprocess`, `pickle`); Bandit (B301, B602, B506).

### PY-02 · SQL parametrizado · crítica [SEG-04]
- **Qué:** parámetros del driver (`cursor.execute(sql, params)`) o un ORM. Sin f-strings, `%` ni `.format` para armar SQL.
- **Fuente:** PEP 249; OWASP SQL Injection Prevention Cheat Sheet.

### PY-03 · Excepciones específicas · alta [ERR-01]
- **Qué:** capturar excepciones concretas. Nada de `except:` ni `except Exception: pass`. Al relanzar, conservar la causa con `raise ... from e`.
- **Fuente:** PEP 8 · "Programming Recommendations"; Ruff/Pylint (E722, W0718).

### PY-04 · Recursos con `with` · alta [DAT-01]
- **Qué:** archivos, conexiones, cursores y locks con `with`, o con `async with` en código asíncrono.
- **Fuente:** documentación de Python · "The with statement".

### PY-05 · Logging, no `print` · media [LOG-01]
- **Qué:** `logging.getLogger(__name__)` con argumentos diferidos (`log.info("Folio %s", folio)`), no f-strings dentro del log ni `print` en servicios.
- **Fuente:** documentación de Python · "Logging HOWTO".

### PY-06 · Llamadas HTTP con timeout · media [REN-02]
- **Qué:** `requests`/`httpx` siempre con `timeout`. Los reintentos, con límite y espera creciente.
- **Por qué:** `requests` no tiene timeout por defecto: una llamada puede quedar colgada para siempre.
- **Fuente:** documentación de Requests · "Timeouts".

### PY-07 · Dependencias fijadas · media [SEG-08]
- **Qué:** versiones fijadas o con lockfile (`requirements.txt` con versiones exactas, `uv.lock`, `poetry.lock`). Versión de Python con soporte vigente.
- **Fuente:** Python Packaging User Guide; calendario de soporte de Python.

### PY-08 · Tipado y estilo en código nuevo · sugerencia [MAN-01]
- **Qué:** anotaciones de tipo en funciones públicas; formato y lint automáticos (por ejemplo Ruff); sin variables globales mutables para estado.
- **Fuente:** PEP 484; PEP 8.

### PY-09 · No bloquear el event loop · media [REN-01]
- **Qué:** en código `async` (FastAPI, aiohttp), no usar librerías bloqueantes (`requests`, drivers sincrónicos, `time.sleep`) sin delegarlas a un hilo.
- **Fuente:** documentación de asyncio · "Developing with asyncio".
