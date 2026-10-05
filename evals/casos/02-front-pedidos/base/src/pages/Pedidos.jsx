import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/pedidos').then(setPedidos).catch(e => setError(e.message));
  }, []);

  if (error) return <p role="alert">No pudimos cargar tus pedidos. {error}</p>;
  return (
    <ul>
      {pedidos.map(p => <li key={p.id}><Link to={`/pedidos/${p.id}`}>Pedido #{p.id}</Link></li>)}
    </ul>
  );
}
