// src/App.tsx
import { useState } from "react";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import styles from "./App.module.css";
import { ProtectedRoute } from "./components/ProtectedRoute";
import AccountPage from "./pages/Account/AccountPage";
import AdminPanel from "./pages/Admin/AdminPanel";
import Contacts from "./pages/Contacts/Contacts";
import Home from "./pages/Home/Home";
import { useAuth } from "./pages/hooks/useAuth"; // ← ИСПРАВЛЕНО: убрал pages/
import AuthForm from "./pages/Login";
export default function App() {
  const { isAuthenticated, user, logout, isLoading, isAdmin } = useAuth(); // Добавил isAdmin
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Закрыть меню при клике вне
  const handleClickOutside = () => {
    setShowUserMenu(false);
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className={styles.app} onClick={handleClickOutside}>
        <header className={styles.header}>
          <div className={styles.container}>
            <div className={styles.logo}>
              🍕 Додо Пицца
            </div>
            
            <nav className={styles.nav}>
              <NavLink 
                to="/" 
                className={({ isActive }) => 
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                Главная
              </NavLink>
              <NavLink 
                to="/contacts" 
                className={({ isActive }) => 
                  isActive ? `${styles.link} ${styles.active}` : styles.link
                }
              >
                Контакты
              </NavLink>
              
              {isAuthenticated ? (
                <div className={styles.userMenu}>
                  <button 
                    className={styles.userButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowUserMenu(!showUserMenu);
                    }}
                  >
                    👤 {user?.name?.split(' ')[0] || user?.name}
                    <span style={{ fontSize: '12px' }}>▼</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
                      <div className={styles.dropdownUserInfo}>
                        <div className={styles.dropdownUserName}>{user?.name}</div>
                        <div className={styles.dropdownUserEmail}>{user?.email}</div>
                      </div>
                      
                      <NavLink to="/account" className={styles.dropdownLink}>
                        📋 Мой аккаунт
                      </NavLink>
                      
                      {isAdmin && (
                        <NavLink to="/admin" className={styles.dropdownLink}>
                          👑 Админ-панель
                        </NavLink>
                      )}
                      
                      <button onClick={logout} className={styles.dropdownButton}>
                        🚪 Выйти
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <NavLink 
                  to="/login" 
                  className={({ isActive }) => 
                    isActive ? `${styles.link} ${styles.active}` : styles.link
                  }
                >
                  Войти
                </NavLink>
              )}
            </nav>
          </div>
        </header>

        <main className={styles.main}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/login" element={<AuthForm />} />
            <Route 
              path="/account" 
              element={
                <ProtectedRoute>
                  <AccountPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}