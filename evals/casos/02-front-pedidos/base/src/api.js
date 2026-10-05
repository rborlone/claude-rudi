// Cliente común de la API: URL base por ambiente y token de sesión en memoria.
let token = null;
export const sesion = { iniciar: t => { token = t; }, cerrar: () => { token = null; } };

export async function api(ruta, opciones = {}) {
  const respuesta = await fetch(`${import.meta.env.VITE_API_URL}${ruta}`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }), ...opciones.headers },
  });
  if (respuesta.status === 401) { sesion.cerrar(); window.location.assign('/login'); }
  if (!respuesta.ok) throw new Error(`Error ${respuesta.status} en ${ruta}`);
  return respuesta.status === 204 ? null : respuesta.json();
}
