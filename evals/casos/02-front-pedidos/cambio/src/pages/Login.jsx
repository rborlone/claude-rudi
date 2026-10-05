import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const navegar = useNavigate();

  async function entrar(e) {
    e.preventDefault();
    const r = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, clave }),
    });
    const { token } = await r.json();
    localStorage.setItem('token', token);
    navegar('/');
  }

  return (
    <form onSubmit={entrar}>
      <label htmlFor="email">Correo</label>
      <input id="email" value={email} onChange={e => setEmail(e.target.value)} />
      <label htmlFor="clave">Clave</label>
      <input id="clave" type="password" value={clave} onChange={e => setClave(e.target.value)} />
      <button type="submit">Entrar</button>
    </form>
  );
}
