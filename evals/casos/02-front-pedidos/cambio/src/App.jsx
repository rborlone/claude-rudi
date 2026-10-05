import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Pedidos from './pages/Pedidos';
import DetallePedido from './pages/DetallePedido';
import Login from './pages/Login';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Pedidos />} />
        <Route path="/pedidos/:id" element={<DetallePedido />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
