// src/pages/Login/index.tsx
import React, { useEffect, useState } from 'react';
import { authAPI } from './api';
import { useAuth } from './hooks/useAuth';
import styles from './Login.module.css';

export default function AuthForm() {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleGoogleCallback(code);
    }
  }, []);

  const handleGoogleCallback = async (code: string) => {
    setGoogleLoading(true);
    try {
      const response = await authAPI.googleCallback(code);
      if (response.user) {
        login(response.user);
        window.location.href = '/account';
      }
    } catch (error: any) {
      setErrors({ general: error.response?.data?.error || 'Ошибка входа через Google' });
    } finally {
      setGoogleLoading(false);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const googleUrl = await authAPI.getGoogleUrl();
      window.location.href = googleUrl;
    } catch (error) {
      setErrors({ general: 'Ошибка получения URL для входа через Google' });
      setGoogleLoading(false);
    }
  };

  const validateLogin = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!email) newErrors.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Введите корректный email';
    if (!password) newErrors.password = 'Пароль обязателен';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegister = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    if (!name) newErrors.name = 'Имя обязательно';
    else if (name.length < 2) newErrors.name = 'Имя должно быть не менее 2 символов';
    if (!email) newErrors.email = 'Email обязателен';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Введите корректный email';
    if (!password) newErrors.password = 'Пароль обязателен';
    else if (password.length < 6) newErrors.password = 'Пароль должен быть не менее 6 символов';
    if (!confirmPassword) newErrors.confirmPassword = 'Подтвердите пароль';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Пароли не совпадают';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    
    if (isLogin) {
      if (validateLogin()) {
        try {
          const response = await authAPI.login(email, password);
          if (response.user) {
            login(response.user);
            window.location.href = '/account';
          }
        } catch (error: any) {
          if (error.response?.status === 401) {
            setErrors({ general: 'Неверный email или пароль' });
          } else {
            setErrors({ general: error.response?.data?.detail || 'Ошибка входа' });
          }
        }
      }
    } else {
      if (validateRegister()) {
        try {
          // Регистрация с ролью user по умолчанию
          const response = await authAPI.register({ 
            name, 
            email, 
            password, 
            role: 'user'  // ← жестко задаем role = 'user'
          });
          if (response) {
            const loginResponse = await authAPI.login(email, password);
            if (loginResponse.user) {
              login(loginResponse.user);
              window.location.href = '/account';
            }
          }
        } catch (error: any) {
          setErrors({ general: error.response?.data?.detail || 'Ошибка регистрации' });
        }
      }
    }
    
    setIsLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setErrors({});
    setEmail('');
    setPassword('');
    setName('');
    setConfirmPassword('');
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
        
        {errors.general && (
          <div className={styles.errorMessage}>{errors.general}</div>
        )}
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className={styles.formGroup}>
              <label>Имя</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
                disabled={isLoading}
              />
              {errors.name && <span className={styles.error}>{errors.name}</span>}
            </div>
          )}
          
          <div className={styles.formGroup}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              disabled={isLoading}
            />
            {errors.email && <span className={styles.error}>{errors.email}</span>}
          </div>
          
          <div className={styles.formGroup}>
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••"
              disabled={isLoading}
            />
            {errors.password && <span className={styles.error}>{errors.password}</span>}
          </div>
          
          {!isLogin && (
            <div className={styles.formGroup}>
              <label>Подтвердите пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                disabled={isLoading}
              />
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword}</span>}
            </div>
          )}
          
          <button type="submit" disabled={isLoading} className={styles.button}>
            {isLoading ? 'Загрузка...' : (isLogin ? 'Войти' : 'Зарегистрироваться')}
          </button>
        </form>
        
        <div className={styles.divider}>или</div>
        
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className={styles.googleButton}
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          {googleLoading ? 'Загрузка...' : 'Войти через Google'}
        </button>
        
        <div className={styles.toggleMode}>
          <button type="button" onClick={toggleMode}>
            {isLogin ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}