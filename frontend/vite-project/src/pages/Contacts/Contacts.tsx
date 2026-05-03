// pages/Contacts/Contacts.tsx
import { useState } from "react";
import styles from "./Contacts.module.css";

export default function Contacts() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Сообщение отправлено! Мы свяжемся с вами в ближайшее время.");
    setFormData({ name: "", email: "", message: "" });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className={styles.contacts}>
      <div className={styles.container}>
        <h1 className={styles.title}>Контакты</h1>
        
        <div className={styles.grid}>
          {/* Левая колонка - информация */}
          <div className={styles.info}>
            <div className={styles.infoCard}>
              <div className={styles.icon}>📍</div>
              <h3>Адрес</h3>
              <p>г. Москва, ул. Пиццерийная, 15</p>
              <p>ТЦ "Додо", 2 этаж</p>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.icon}>📞</div>
              <h3>Телефон</h3>
              <p>+7 (800) 555-35-35</p>
              <p>Ежедневно с 10:00 до 23:00</p>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.icon}>✉️</div>
              <h3>Email</h3>
              <p>info@dodo-pizza.ru</p>
              <p>support@dodo-pizza.ru</p>
            </div>
            
            <div className={styles.infoCard}>
              <div className={styles.icon}>📱</div>
              <h3>Соцсети</h3>
              <p>Instagram: @dodo_pizza</p>
              <p>Telegram: @dodo_pizza_bot</p>
            </div>
          </div>

          {/* Правая колонка - форма */}
          <div className={styles.formWrapper}>
            <h2 className={styles.formTitle}>Напишите нам</h2>
            <form className={styles.form} onSubmit={handleSubmit}>
              <input
                type="text"
                name="name"
                placeholder="Ваше имя"
                className={styles.input}
                value={formData.name}
                onChange={handleChange}
                required
              />
              
              <input
                type="email"
                name="email"
                placeholder="Ваш email"
                className={styles.input}
                value={formData.email}
                onChange={handleChange}
                required
              />
              
              <textarea
                name="message"
                placeholder="Ваше сообщение"
                className={styles.textarea}
                rows={5}
                value={formData.message}
                onChange={handleChange}
                required
              />
              
              <button type="submit" className={styles.submitBtn}>
                Отправить сообщение
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}