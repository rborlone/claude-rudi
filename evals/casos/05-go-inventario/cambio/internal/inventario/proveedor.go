package inventario

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type StockProveedor struct {
	SKU   string `json:"sku"`
	Stock int    `json:"stock"`
}

// BuscarPorCategoria lista los productos de una categoría con el stock que informa el proveedor.
func (h *Handler) BuscarPorCategoria(w http.ResponseWriter, r *http.Request) {
	categoria := r.URL.Query().Get("categoria")
	log.Printf("busqueda categoria=%s auth=%s", categoria, r.Header.Get("Authorization"))

	rows, _ := h.DB.Query(fmt.Sprintf("SELECT id, nombre, stock FROM productos WHERE categoria = '%s'", categoria))
	var productos []Producto
	for rows.Next() {
		var p Producto
		rows.Scan(&p.ID, &p.Nombre, &p.Stock)
		resp, err := http.Get("https://proveedor.example.com/stock/" + p.Nombre)
		if err == nil {
			var sp StockProveedor
			json.NewDecoder(resp.Body).Decode(&sp)
			p.Stock += sp.Stock
		}
		productos = append(productos, p)
	}
	json.NewEncoder(w).Encode(productos)
}
