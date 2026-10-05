import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { evaluar, partes, sqlPeligroso } from './barandas.js';

// Repo de prueba con .rudi.json, y otro sin él (patrones por defecto). KUBECONFIG apunta a un archivo controlado.
const tmp = mkdtempSync(join(tmpdir(), 'barandas-'));
const conConfig = join(tmp, 'con'); mkdirSync(join(conConfig, '.git'), { recursive: true });
writeFileSync(join(conConfig, '.git', 'HEAD'), 'ref: refs/heads/main\n');
writeFileSync(join(conConfig, '.rudi.json'), JSON.stringify({
  produccion: {
    kube_contextos: ['aks-clientes-*'], kube_namespaces: ['pagos'], sql_servidores: ['sql-principal.database.windows.net'],
    terraform_workspaces: ['principal'], ramas_protegidas: ['main', 'release/*'],
  },
}));
const sinConfig = join(tmp, 'sin'); mkdirSync(join(sinConfig, '.git'), { recursive: true });
writeFileSync(join(sinConfig, '.git', 'HEAD'), 'ref: refs/heads/feature/x\n');
const kube = join(tmp, 'kubeconfig');
writeFileSync(kube, 'apiVersion: v1\ncurrent-context: aks-dev\n');
process.env.KUBECONFIG = kube;

test('partes respeta comillas y quita sudo y variables', () => {
  assert.deepEqual(partes('cd x && sudo FOO=1 kubectl get pods | grep a; echo "a;b"'),
    ['cd x', 'kubectl get pods', 'grep a', 'echo "a;b"']);
});

test('SQL destructivo', () => {
  assert.deepEqual(sqlPeligroso('DELETE FROM dbo.Facturas'), ['DELETE sin WHERE']);
  assert.deepEqual(sqlPeligroso('DELETE FROM dbo.Facturas WHERE Id = 1'), []);
  assert.deepEqual(sqlPeligroso('UPDATE t SET a = 1; DROP TABLE x'), ['UPDATE sin WHERE', 'DROP']);
  assert.deepEqual(sqlPeligroso('TRUNCATE TABLE x\nGO\nSELECT 1'), ['TRUNCATE']);
  assert.deepEqual(sqlPeligroso('SELECT * FROM x -- DROP TABLE y'), [], 'ignora comentarios');
});

test('kubectl: solo lo que modifica, y solo en producción', () => {
  assert.equal(evaluar('kubectl get pods --context aks-clientes-prod', conConfig).length, 0, 'leer no pregunta');
  assert.match(evaluar('kubectl delete pod x --context aks-clientes-prod', conConfig)[0], /kubectl delete.*aks-clientes-prod/);
  assert.match(evaluar('kubectl -n pagos rollout restart deploy/api', conConfig)[0], /namespace pagos/);
  assert.equal(evaluar('kubectl delete pod x', conConfig).length, 0, 'contexto actual aks-dev no es prod');
  assert.equal(evaluar('kubectl delete pod x --context aks-prod', conConfig).length, 0, 'con .rudi.json manda la lista');
  assert.match(evaluar('kubectl delete pod x --context aks-prod', sinConfig)[0], /aks-prod/, 'sin .rudi.json: patrón por defecto');
  assert.match(evaluar('helm uninstall api -n pagos', conConfig)[0], /helm uninstall/);
  assert.equal(evaluar('helm list -n pagos', conConfig).length, 0);
});

test('terraform', () => {
  assert.match(evaluar('terraform destroy', conConfig)[0], /destroy/, 'destroy pregunta siempre');
  assert.equal(evaluar('terraform plan', conConfig).length, 0);
  assert.equal(evaluar('terraform apply', conConfig).length, 0, 'workspace default no es producción');
  assert.match(evaluar('TF_WORKSPACE=principal terraform apply', conConfig)[0] ?? '', /./, 'apply en workspace de producción');
  assert.match(evaluar('terraform apply -auto-approve', sinConfig)[0], /apply/, 'sin lista de workspaces pregunta');
});

test('sqlcmd y psql', () => {
  assert.match(evaluar('sqlcmd -S sql-principal.database.windows.net -Q "DELETE FROM Pagos; SELECT 1"', conConfig)[0],
    /DELETE sin WHERE.*producción/);
  assert.match(evaluar('psql -h localhost -c "DROP TABLE x"', conConfig)[0], /DROP.*localhost/, 'destructivo pregunta aunque no sea prod');
  assert.equal(evaluar('sqlcmd -S sql-principal.database.windows.net -Q "SELECT * FROM Pagos"', conConfig).length, 0);
  writeFileSync(join(conConfig, 'limpieza.sql'), 'TRUNCATE TABLE Logs;');
  assert.match(evaluar('sqlcmd -S x -i limpieza.sql', conConfig)[0], /TRUNCATE/, 'lee el archivo -i');
});

test('git push --force a ramas protegidas', () => {
  assert.match(evaluar('git push --force origin main', sinConfig)[0], /main/);
  assert.match(evaluar('git push -f', conConfig)[0], /main/, 'sin refspec usa la rama actual');
  assert.match(evaluar('git push origin +release/2.0', conConfig)[0], /release\/2.0/);
  assert.equal(evaluar('git push --force origin feature/x', conConfig).length, 0);
  assert.equal(evaluar('git push origin main', conConfig).length, 0, 'push normal no pregunta');
});

test('az ... delete', () => {
  assert.match(evaluar('az group delete -n rg-x --yes', conConfig)[0], /az group delete/);
  assert.equal(evaluar('az group list', conConfig).length, 0);
});

test('el hook responde "ask" con el motivo, y nada si no hay riesgo', () => {
  const correr = entrada => execFileSync(process.execPath, [new URL('./barandas.js', import.meta.url).pathname],
    { input: JSON.stringify(entrada), env: { ...process.env, KUBECONFIG: kube } }).toString();
  const r = JSON.parse(correr({ tool_name: 'Bash', tool_input: { command: 'terraform destroy' }, cwd: conConfig }));
  assert.equal(r.hookSpecificOutput.permissionDecision, 'ask');
  assert.match(r.hookSpecificOutput.permissionDecisionReason, /^RUDI · baranda de producción: /);
  assert.equal(correr({ tool_name: 'Bash', tool_input: { command: 'ls -la' }, cwd: conConfig }), '');
  assert.equal(correr({ tool_name: 'Read', tool_input: {} }), '');
  assert.equal(execFileSync(process.execPath, [new URL('./barandas.js', import.meta.url).pathname], { input: 'basura' }).toString(), '',
    'entrada inválida: no interviene');
});
