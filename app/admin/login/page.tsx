'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const login = async () => {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (data.token) {
      localStorage.setItem('token', data.token);
      router.push('/admin/dashboard');
    } else {
      alert('Login failed');
    }
  };

  return (
    <div className="bg-white p-6 shadow max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin Login</h2>
      <input
        className="border p-2 w-full mb-2"
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        className="border p-2 w-full mb-4"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={login} className="bg-black text-white w-full p-2">
        Login
      </button>
    </div>
  );
}
