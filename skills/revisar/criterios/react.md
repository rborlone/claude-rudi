# Criterios base · React (JavaScript / TypeScript)

**Se activa si:** el cambio toca `*.jsx`, `*.tsx`, o `*.js`/`*.ts` en un proyecto con `react` en `package.json`.
Concreta el [núcleo](nucleo.md) para frontends React; las referencias entre corchetes indican el criterio general.

### RCT-01 · Nada secreto en el frontend · crítica [SEG-05]
- **Qué:** el bundle no contiene claves, secretos de clientes OAuth, cadenas de conexión ni tokens de servicios. Todo lo que está en el front es público.
- **Por qué:** cualquier variable `VITE_*` o `REACT_APP_*` termina en el JavaScript que descarga el navegador.
- **Señales:** claves de APIs privadas en `.env*` con prefijo público; llamadas directas desde el front a servicios que requieren secreto.
- **Fuente:** documentación de Vite y Create React App sobre variables de entorno; OWASP ASVS v4 · V14.

### RCT-02 · Sin HTML sin sanitizar · crítica [SEG-04]
- **Qué:** no usar `dangerouslySetInnerHTML` con datos que vienen de usuarios o de la API sin sanitizarlos (por ejemplo con DOMPurify). Nada de `eval` ni `new Function` con datos.
- **Fuente:** documentación de React (`dangerouslySetInnerHTML`); OWASP XSS Prevention Cheat Sheet.

### RCT-03 · Tokens fuera de `localStorage` cuando se pueda · alta [SEG-03]
- **Qué:** preferir cookies `HttpOnly` + `Secure` + `SameSite` emitidas por el backend. Si el token debe vivir en el cliente, en memoria y con expiración corta.
- **Por qué:** cualquier XSS lee `localStorage`; una cookie `HttpOnly`, no.
- **Fuente:** OWASP HTML5 Security Cheat Sheet · Local Storage.

### RCT-04 · La autorización la decide el backend · alta [SEG-01]
- **Qué:** ocultar un botón o una ruta en el front es experiencia de usuario, no seguridad. Cada acción debe estar protegida en la API.
- **Señales:** permisos que solo existen como condiciones en componentes o en el router.
- **Fuente:** OWASP API Security Top 10 2023 · API5.

### RCT-05 · Estados de carga, error y vacío · media [ERR-01]
- **Qué:** cada llamada a la API maneja los tres estados en la interfaz. Los errores se muestran con un mensaje útil y se registran; no se descartan con `catch` vacíos.
- **Señales:** `.catch(() => {})`; `async` sin `try/catch` ni manejo en la librería de datos; pantallas que quedan en blanco cuando falla la API.
- **Fuente:** práctica general; documentación de TanStack Query sobre estados.

### RCT-06 · Un solo cliente de API · media [CFG-01, MAN-02]
- **Qué:** las llamadas HTTP pasan por un cliente o módulo común (URL base desde configuración, headers de autenticación, manejo de 401). Los componentes no arman URLs ni hacen `fetch` sueltos.
- **Señales:** URLs completas o con ambiente fijo dentro de componentes; manejo del token repetido en cada llamada.
- **Fuente:** práctica general de arquitectura frontend.

### RCT-07 · Datos del servidor con una librería de datos · sugerencia [MAN-02]
- **Qué:** para datos remotos, una librería de caché (TanStack Query, RTK Query o SWR) en vez de `useEffect` + `useState` a mano en cada componente.
- **Por qué:** el patrón a mano olvida casi siempre la cancelación, los reintentos, la caché y las condiciones de carrera.
- **Fuente:** documentación de React · "You Might Not Need an Effect".

### RCT-08 · Reglas de los hooks y dependencias completas · alta
- **Qué:** hooks solo en el nivel superior del componente, y arreglos de dependencias completos en `useEffect`, `useMemo` y `useCallback`.
- **Señales:** `eslint-disable` de `react-hooks/exhaustive-deps`; hooks dentro de condiciones o bucles.
- **Fuente:** documentación de React · "Rules of Hooks"; `eslint-plugin-react-hooks`.

### RCT-09 · Listas con `key` estable · media
- **Qué:** `key` con un identificador estable del dato, no con el índice cuando la lista puede reordenarse o filtrarse.
- **Fuente:** documentación de React · "Rendering Lists".

### RCT-10 · Accesibilidad básica · media
- **Qué:** controles de formulario con etiqueta asociada, imágenes con `alt`, elementos interactivos que sean `button` o `a` (no `div` con `onClick`), foco visible y navegación con teclado.
- **Fuente:** WCAG 2.2 nivel AA; `eslint-plugin-jsx-a11y`.

### RCT-11 · Componentes acotados · sugerencia [MAN-01]
- **Qué:** componentes de una responsabilidad. La lógica reutilizable va en hooks propios; los componentes de más de unas 250 líneas se dividen.
- **Fuente:** documentación de React · "Thinking in React".

### RCT-12 · Tipado en código nuevo · sugerencia
- **Qué:** en proyectos TypeScript, sin `any` nuevos ni `@ts-ignore` sin explicación. En proyectos JavaScript, al menos `PropTypes` o JSDoc en componentes compartidos.
- **Fuente:** documentación de TypeScript · `strict`.
