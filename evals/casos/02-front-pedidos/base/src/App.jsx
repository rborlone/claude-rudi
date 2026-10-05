import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Pedidos from './pages/Pedidos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Pedidos />} />
      </Routes>
    </BrowserRouter>
  );
}
