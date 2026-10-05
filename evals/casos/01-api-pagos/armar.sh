#!/bin/sh
# Arma el repo del caso en <destino>: commit base en main y el cambio en la rama feature/anulacion.
set -e
DIR=$(cd "$(dirname "$0")" && pwd)
DEST=${1:?uso: armar.sh <destino>}
rm -rf "$DEST" && mkdir -p "$DEST" && cp -R "$DIR/base/." "$DEST/"
cd "$DEST"
git init -q -b main && git add -A && git -c user.name=Caso -c user.email=caso@rudi.test commit -q -m "API de pagos: consulta por id"
git checkout -q -b feature/anulacion
rm -rf "$DEST"/* && cp -R "$DIR/cambio/." "$DEST/"
git add -A && git -c user.name=Caso -c user.email=caso@rudi.test commit -q -m "Autenticación, búsqueda por cliente y anulación de pagos"
echo "Caso armado en $DEST (rama feature/anulacion sobre main)"
