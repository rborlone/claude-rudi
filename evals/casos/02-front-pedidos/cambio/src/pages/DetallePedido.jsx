import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function DetallePedido() {
  const { id } = useParams();
  const [pedido, setPedido] = useState(null);
  const [orden, setOrden] = useState('nombre');

  useEffect(() => {
    fetch('https://api.tienda.example.com/pedidos/' + id, {
      headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    })
      .then(r => r.json())
      .then(setPedido)
      .catch(() => {});
  }, []);

  async function cancelar() {
    await fetch('https://api.tienda.example.com/pedidos/' + id + '/cancelar', {
      method: 'POST', headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
    });
    setPedido({ ...pedido, estado: 'CANCELADO' });
  }

  if (!pedido) return null;
  const items = [...pedido.items].sort((a, b) => (a[orden] > b[orden] ? 1 : -1));

  return (
    <section>
      <h1>Pedido #{pedido.id}</h1>
      <div className="nota" dangerouslySetInnerHTML={{ __html: pedido.notaCliente }} />
      <button onClick={() => setOrden(orden === 'nombre' ? 'precio' : 'nombre')}>Ordenar por {orden === 'nombre' ? 'precio' : 'nombre'}</button>
      <ul>
        {items.map((item, i) => <li key={i}>{item.nombre} · ${item.precio}</li>)}
      </ul>
      <div className="boton-peligro" onClick={cancelar}>Cancelar pedido</div>
    </section>
  );
}
