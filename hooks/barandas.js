#!/usr/bin/env node
// Hook PreToolUse (Bash) de RUDI: ante un comando peligroso contra producción, pide confirmación explícita con el
// motivo. No bloquea: la persona decide. Cada proyecto declara qué es producción en .rudi.json; sin ese archivo se
// usan patrones conservadores. Ante cualquier error interno, no interviene (nunca debe romper una sesión).
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROD_POR_DEFECTO = /(^|[^a-z])(prod|prd|production|produccion)([^a-z]|$)/i;

// --- Configuración del proyecto -----------------------------------------------------------------------------------

export function raizRepo(dir) {
  for (let d = resolve(dir); ; d = dirname(d)) {
    if (existsSync(join(d, '.git'))) return d;
    if (dirname(d) === d) return null;
  }
}

export function cargarConfig(cwd) {
  const raiz = raizRepo(cwd) ?? resolve(cwd);
  const ruta = join(raiz, '.rudi.json');
  let produccion = {};
  if (existsSync(ruta)) {
    try { produccion = JSON.parse(readFileSync(ruta, 'utf8')).produccion ?? {}; } catch { produccion = {}; }
  }
  return { raiz, tieneArchivo: existsSync(ruta), produccion };
}

// Coincidencia con comodín '*' (por ejemplo "aks-*-prod").
function coincide(valor, patrones) {
  return patrones.some(p => new RegExp('^' + p.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*') + '$', 'i').test(valor));
}

function esProd(valor, lista, config) {
  if (!valor) return false;
  if (Array.isArray(lista) && lista.length) return coincide(valor, lista);
  return !config.tieneArchivo && PROD_POR_DEFECTO.test(valor);
}

// --- Lectura del comando ------------------------------------------------------------------------------------------

// Divide un comando compuesto en partes (&&, ||, ;, |, saltos de línea) y quita asignaciones de entorno y sudo.
// Respeta las comillas: un ';' dentro de "…" no separa.
export function partes(comando) {
  const salida = [];
  let actual = '', comilla = null;
  for (let i = 0; i < comando.length; i++) {
    const c = comando[i];
    if (comilla) { if (c === comilla && comando[i - 1] !== '\\') comilla = null; actual += c; continue; }
    if (c === '"' || c === "'") { comilla = c; actual += c; continue; }
    if (c === ';' || c === '\n' || c === '|' || (c === '&' && comando[i + 1] === '&')) {
      salida.push(actual); actual = '';
      if ((c === '&' || c === '|') && comando[i + 1] === c) i++;
      continue;
    }
    actual += c;
  }
  salida.push(actual);
  return salida.map(p => p.trim().replace(/^((\w+=("[^"]*"|'[^']*'|\S*)\s+)|sudo\s+)+/, '')).filter(Boolean);
}

function opcion(parte, ...nombres) {
  for (const n of nombres) {
    const m = new RegExp(`(?:^|\\s)${n}(?:=|\\s+)("[^"]*"|'[^']*'|\\S+)`).exec(parte);
    if (m) return m[1].replace(/^["']|["']$/g, '');
  }
  return null;
}

function contextoKubeActual() {
  try {
    const ruta = (process.env.KUBECONFIG || join(homedir(), '.kube', 'config')).split(':')[0];
    return /^current-context:\s*["']?([^"'\s]+)/m.exec(readFileSync(ruta, 'utf8'))?.[1] ?? null;
  } catch { return null; }
}

function ramaActual(raiz) {
  try { return /ref: refs\/heads\/(.+)/.exec(readFileSync(join(raiz, '.git', 'HEAD'), 'utf8'))?.[1].trim() ?? null; }
  catch { return null; }
}

function workspaceTerraform(cwd) {
  if (process.env.TF_WORKSPACE) return process.env.TF_WORKSPACE;
  try { return readFileSync(join(cwd, '.terraform', 'environment'), 'utf8').trim(); } catch { return 'default'; }
}

// SQL destructivo: DROP, TRUNCATE, ALTER ... DROP, y DELETE/UPDATE sin WHERE.
export function sqlPeligroso(sql) {
  const motivos = [];
  for (const sentencia of sql.split(/;|\bGO\b/i)) {
    const s = sentencia.replace(/--.*$/gm, '').replace(/\s+/g, ' ').trim();
    if (/\bDROP\s+(TABLE|DATABASE|SCHEMA|VIEW|PROCEDURE|PROC|FUNCTION|INDEX|USER|LOGIN)\b/i.test(s)) motivos.push('DROP');
    else if (/\bTRUNCATE\s+TABLE\b/i.test(s)) motivos.push('TRUNCATE');
    else if (/\bALTER\s+TABLE\b.*\bDROP\b/i.test(s)) motivos.push('ALTER TABLE … DROP');
    else if (/\bDELETE\s+(FROM\s+)?[\w.[\]"]+/i.test(s) && !/\bWHERE\b/i.test(s)) motivos.push('DELETE sin WHERE');
    else if (/\bUPDATE\s+[\w.[\]"]+\s+SET\b/i.test(s) && !/\bWHERE\b/i.test(s)) motivos.push('UPDATE sin WHERE');
  }
  return [...new Set(motivos)];
}

// --- Reglas -------------------------------------------------------------------------------------------------------

const KUBECTL_MUTA = /^(delete|drain|cordon|scale|patch|replace|apply|edit|create|set|label|annotate|taint|rollout\s+(restart|undo))\b/;
const HELM_MUTA = /^(uninstall|delete|rollback|upgrade|install)\b/;

function reglaKube(parte, config) {
  let m = /^(kubectl|oc)\s+(.*)$/.exec(parte);
  if (m) {
    const resto = m[2].replace(/(^|\s)--?[\w-]+(=\S+|\s+\S+)?/g, ' ').trim(); // sin opciones, para ver el subcomando
    const sub = /^[a-z]+(\s+[a-z]+)?/.exec(resto)?.[0] ?? '';
    if (!KUBECTL_MUTA.test(sub)) return null;
    const ctx = opcion(parte, '--context') ?? contextoKubeActual();
    const ns = opcion(parte, '-n', '--namespace');
    if (esProd(ctx, config.produccion.kube_contextos, config) || (ns && esProd(ns, config.produccion.kube_namespaces, config)))
      return `\`kubectl ${sub.split(' ')[0]}\` en producción (contexto ${ctx ?? '?'}${ns ? `, namespace ${ns}` : ''})`;
    return null;
  }
  m = /^helm\s+(\S+)/.exec(parte);
  if (m && HELM_MUTA.test(m[1])) {
    const ctx = opcion(parte, '--kube-context') ?? contextoKubeActual();
    const ns = opcion(parte, '-n', '--namespace');
    if (esProd(ctx, config.produccion.kube_contextos, config) || (ns && esProd(ns, config.produccion.kube_namespaces, config)))
      return `\`helm ${m[1]}\` en producción (contexto ${ctx ?? '?'}${ns ? `, namespace ${ns}` : ''})`;
  }
  return null;
}

function reglaTerraform(parte, config, cwd, comando) {
  const m = /^(terraform|tofu|terragrunt)\s+(?:-chdir=\S+\s+)?(apply|destroy|import|taint|force-unlock|state\s+(rm|mv|push))\b/.exec(parte);
  if (!m) return null;
  const chdir = opcion(parte, '-chdir');
  // Un TF_WORKSPACE=… en la misma línea manda sobre el entorno y el archivo .terraform/environment.
  const ws = /(?:^|\s)TF_WORKSPACE=("[^"]*"|'[^']*'|\S+)/.exec(comando)?.[1].replace(/^["']|["']$/g, '')
    ?? workspaceTerraform(chdir ? resolve(cwd, chdir) : cwd);
  const lista = config.produccion.terraform_workspaces;
  const esDestructivo = /destroy|state|taint|force-unlock/.test(m[2]);
  // Sin lista de workspaces de producción, se pregunta siempre: no hay forma segura de saber a qué apunta.
  if (esDestructivo || !Array.isArray(lista) || !lista.length || coincide(ws, lista))
    return `\`${m[1]} ${m[2]}\` (workspace ${ws})${Array.isArray(lista) && coincide(ws, lista) ? ', que es producción' : ''}`;
  return null;
}

function reglaSql(parte, config, cwd) {
  const m = /^(sqlcmd|psql|mysql|mariadb|sqlplus|osql|az\s+sql\s+\S+)\b/.exec(parte);
  if (!m) return null;
  let sql = [opcion(parte, '-Q', '-q', '-c', '-e', '--command', '--execute') ?? ''].join(' ');
  const archivo = opcion(parte, '-i', '-f', '--file');
  if (archivo) { try { sql += ' ' + readFileSync(resolve(cwd, archivo), 'utf8'); } catch {} }
  const motivos = sqlPeligroso(sql);
  if (!motivos.length) return null;
  const servidor = opcion(parte, '-S', '-h', '--host', '--server');
  const prod = esProd(servidor, config.produccion.sql_servidores, config);
  return `SQL destructivo (${motivos.join(', ')}) con ${m[1].split(/\s/)[0]}${servidor ? ` en ${servidor}` : ''}${prod ? ', que es producción' : ''}`;
}

function reglaGit(parte, config) {
  if (!/^git\s+push\b/.test(parte) || !/(\s--force(-with-lease)?\b|\s-f\b|\s\+\S)/.test(parte)) return null;
  const protegidas = config.produccion.ramas_protegidas?.length ? config.produccion.ramas_protegidas : ['main', 'master'];
  const args = parte.replace(/^git\s+push\s+/, '').split(/\s+/).filter(a => !a.startsWith('-'));
  const destinos = args.length > 1 ? args.slice(1).map(r => r.replace(/^\+/, '').split(':').pop()) : [ramaActual(config.raiz)];
  const rama = destinos.find(r => r && coincide(r, protegidas));
  return rama ? `\`git push --force\` a la rama protegida \`${rama}\`` : null;
}

function reglaAzure(parte) {
  const m = /^az\s+((?:[a-z-]+\s+){1,3})delete\b/.exec(parte);
  return m ? `\`az ${m[1].trim()} delete\`: borra recursos de Azure` : null;
}

export function evaluar(comando, cwd = process.cwd()) {
  const config = cargarConfig(cwd);
  const motivos = [];
  for (const parte of partes(comando)) {
    for (const regla of [reglaKube, reglaTerraform, reglaSql, reglaGit, reglaAzure]) {
      const motivo = regla(parte, config, cwd, comando);
      if (motivo) motivos.push(motivo);
    }
  }
  return motivos;
}

// --- Entrada del hook ---------------------------------------------------------------------------------------------

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const entrada = JSON.parse(readFileSync(0, 'utf8') || '{}');
    const comando = entrada.tool_input?.command;
    if (entrada.tool_name === 'Bash' && typeof comando === 'string') {
      const motivos = evaluar(comando, entrada.cwd || process.cwd());
      if (motivos.length) {
        process.stdout.write(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'ask',
            permissionDecisionReason: `RUDI · baranda de producción: ${motivos.join('; ')}. ¿Confirmas que quieres ejecutarlo?`,
          },
        }));
      }
    }
  } catch {}
  process.exit(0);
}
