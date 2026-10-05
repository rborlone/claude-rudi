#!/bin/sh
# Arma el repo de un caso en <destino>: la carpeta base/ como commit en main, y cambio/ como commit en la rama del caso
# (el contenido de rama.txt, o feature/cambio).
set -e
CASO=$(cd "${1:?uso: armar.sh <carpeta del caso> <destino>}" && pwd)
DEST=${2:?uso: armar.sh <carpeta del caso> <destino>}
RAMA=$(cat "$CASO/rama.txt" 2>/dev/null || echo feature/cambio)
G="git -c user.name=Caso -c user.email=caso@rudi.test"
rm -rf "$DEST" && mkdir -p "$DEST" && cp -R "$CASO/base/." "$DEST/"
cd "$DEST"
git init -q -b main && git add -A && $G commit -q -m "Estado inicial"
git checkout -q -b "$RAMA"
find . -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
cp -R "$CASO/cambio/." "$DEST/"
git add -A && $G commit -q -m "Cambio a revisar"
echo "$(basename "$CASO"): $DEST ($RAMA sobre main)"
