// src/pages/Account/AccountPage.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';

const AccountPage: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) {
    window.location.href = '/login';
    return null;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ background: 'white', borderRadius: '10px', padding: '2rem', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <h1>Мой аккаунт</h1>
        <p><strong>Имя:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>ID:</strong> {user.id}</p>
        <button onClick={logout} style={{ marginTop: '2rem', padding: '0.75rem 1.5rem', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Выйти
        </button>
      </div>
    </div>
  );
};

export default AccountPage;