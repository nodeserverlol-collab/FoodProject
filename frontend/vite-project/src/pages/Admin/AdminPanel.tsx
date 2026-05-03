// src/pages/Admin/AdminPanel.tsx
import React, { useEffect, useState } from 'react';
import type { AdminUser } from '../api';
import { adminAPI } from '../api';
import { useAuth } from '../hooks/useAuth';
import styles from './Admin.module.css';

const AdminPanel: React.FC = () => {
  const { user: currentUser, isAdmin } = useAuth(); // ← переименовали user в currentUser
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      window.location.href = '/account';
      return;
    }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usersData, statsData] = await Promise.all([
        adminAPI.getUsers(),
        adminAPI.getStats()
      ]);
      setUsers(usersData.users);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      showMessage('error', 'Ошибка загрузки данных');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      showMessage('success', 'Роль успешно обновлена');
      loadData();
    } catch (error) {
      showMessage('error', 'Ошибка обновления роли');
    }
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${userName}?`)) {
      return;
    }

    try {
      await adminAPI.deleteUser(userId);
      showMessage('success', `Пользователь ${userName} удален`);
      loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Ошибка удаления');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <span className={styles.badgeAdmin}>👑 Админ</span>;
      case 'moderator': return <span className={styles.badgeModerator}>🛡️ Модератор</span>;
      default: return <span className={styles.badgeUser}>👤 Пользователь</span>;
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className={styles.accessDenied}>
        <h1>Доступ запрещен</h1>
        <p>У вас нет прав администратора для просмотра этой страницы.</p>
      </div>
    );
  }

  return (
    <div className={styles.adminPanel}>
      <div className={styles.container}>
        <h1 className={styles.title}>👑 Админ-панель</h1>
        
        {message && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        {stats && (
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.total_users}</div>
              <div className={styles.statLabel}>Всего пользователей</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.admins}</div>
              <div className={styles.statLabel}>Администраторов</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.moderators}</div>
              <div className={styles.statLabel}>Модераторов</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statValue}>{stats.users}</div>
              <div className={styles.statLabel}>Пользователей</div>
            </div>
          </div>
        )}

        <div className={styles.usersTable}>
          <h2>Управление пользователями</h2>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Имя</th>
                  <th>Email</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className={user.id === currentUser?.id ? styles.currentUser : ''}>
                    <td>{user.id}</td>
                    <td>
                      {user.name} 
                      {user.id === currentUser?.id && <span className={styles.youBadge}>Вы</span>}
                    </td>
                    <td>{user.email}</td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      <div className={styles.actions}>
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                          className={styles.roleSelect}
                          disabled={user.id === currentUser?.id}
                        >
                          <option value="user">Пользователь</option>
                          <option value="moderator">Модератор</option>
                          <option value="admin">Админ</option>
                        </select>
                        <button
                          onClick={() => handleDeleteUser(user.id, user.name)}
                          className={styles.deleteButton}
                          disabled={user.id === currentUser?.id}
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;