#!/bin/sh
# Corre /rudi:revisar sobre los casos (todos, o los que se pasen) en paralelo, con la versión local del plugin.
# Resultados en evals/resultados/<fecha-hora>/<caso>.md (no se versionan). Después, comparar con cada esperado.md.
set -e
EVALS=$(cd "$(dirname "$0")" && pwd)
PLUGIN=$(dirname "$EVALS")
SALIDA="$EVALS/resultados/$(date +%Y%m%d-%H%M)"
TMP=${TMPDIR:-/tmp}/rudi-evals
mkdir -p "$SALIDA" "$TMP"
CASOS=${*:-$(ls -d "$EVALS"/casos/*/ | xargs -n1 basename)}
for c in $CASOS; do
  "$EVALS/armar.sh" "$EVALS/casos/$c" "$TMP/$c" >/dev/null
  ( cd "$TMP/$c" && claude -p "/rudi:revisar" --plugin-dir "$PLUGIN" \
      --allowedTools "Read" "Grep" "Glob" "Bash(git *)" "Agent" "mcp__plugin_bitacora_bitacora__bitacora_buscar" \
      < /dev/null > "$SALIDA/$c.md" 2>&1; echo "✓ $c" ) &
done
wait
echo "Resultados en $SALIDA"
