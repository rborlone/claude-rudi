package inventario

import (
	"database/sql"
	"encoding/json"
	"log/slog"
	"net/http"
	"strconv"
)

type Handler struct {
	DB *sql.DB
}

type Producto struct {
	ID     int    `json:"id"`
	Nombre string `json:"nombre"`
	Stock  int    `json:"stock"`
}

func (h *Handler) Obtener(w http.ResponseWriter, r *http.Request) {
	id, err := strconv.Atoi(r.PathValue("id"))
	if err != nil {
		http.Error(w, "id inválido", http.StatusBadRequest)
		return
	}
	var p Producto
	err = h.DB.QueryRowContext(r.Context(), "SELECT id, nombre, stock FROM productos WHERE id = $1", id).
		Scan(&p.ID, &p.Nombre, &p.Stock)
	if err == sql.ErrNoRows {
		http.NotFound(w, r)
		return
	}
	if err != nil {
		slog.Error("no se pudo leer el producto", "id", id, "error", err)
		http.Error(w, "error interno", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(p)
}
