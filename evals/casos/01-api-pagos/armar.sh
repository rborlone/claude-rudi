#!/bin/sh
# Atajo: arma este caso en <destino>.
exec "$(dirname "$0")/../../armar.sh" "$(dirname "$0")" "${1:?uso: armar.sh <destino>}"
