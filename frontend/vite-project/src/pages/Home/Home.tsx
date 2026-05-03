// src/pages/Home/Home.tsx
import { useState } from "react";
import styles from "./Home.module.css";

const pizzas = [
  { 
    id: 1, 
    name: "Пепперони", 
    price: 499, 
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=500&h=500&fit=crop",
    ingredients: "острая пепперони, сыр моцарелла, томатный соус",
    description: "Классическая итальянская пицца с пикантной пепперони и расплавленным сыром моцарелла. Идеальный выбор для любителей острого!",
    weight: "450г",
    calories: "980 ккал",
    popular: true
  },
  { 
    id: 2, 
    name: "Маргарита", 
    price: 399, 
    image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=500&h=500&fit=crop",
    ingredients: "томаты, сыр моцарелла, базилик, оливковое масло",
    description: "Нежная пицца с сочными томатами, ароматным базиликом и лучшим сыром моцарелла. Вкус Италии в каждом кусочке!",
    weight: "420г",
    calories: "850 ккал",
    popular: true
  },
  { 
    id: 3, 
    name: "Гавайская", 
    price: 549, 
    image: "https://images.unsplash.com/photo-1533561650742-14a726d1c24b?w=500&h=500&fit=crop",
    ingredients: "курица, ананас, сыр моцарелла, соус барбекю",
    description: "Сочная курица, сладкий ананас и пикантный соус барбекю создают неповторимый вкус. Попробуйте!",
    weight: "470г",
    calories: "1020 ккал",
    popular: false
  },
  { 
    id: 4, 
    name: "Четыре сыра", 
    price: 599, 
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&h=500&fit=crop",
    ingredients: "моцарелла, дорблю, пармезан, чеддер",
    description: "Роскошное сочетание четырех итальянских сыров: нежная моцарелла, пикантный дорблю, ароматный пармезан и расплавленный чеддер.",
    weight: "460г",
    calories: "1150 ккал",
    popular: true
  },
  { 
    id: 5, 
    name: "Мясная", 
    price: 649, 
    image: "https://images.unsplash.com/photo-1590947132387-155cc02f3211?w=500&h=500&fit=crop",
    ingredients: "бекон, ветчина, пепперони, говядина, сыр",
    description: "Мясное ассорти для настоящих ценителей: бекон, ветчина, пепперони и нежная говядина под сырной шапкой.",
    weight: "520г",
    calories: "1250 ккал",
    popular: false
  },
  { 
    id: 6, 
    name: "Вегетарианская", 
    price: 449, 
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&h=500&fit=crop",
    ingredients: "грибы, перец, лук, оливки, кукуруза, помидоры",
    description: "Полезная и вкусная пицца для вегетарианцев. Сочетание свежих овощей и ароматных грибов.",
    weight: "440г",
    calories: "780 ккал",
    popular: false
  }
];

interface PizzaModalProps {
  pizza: typeof pizzas[0] | null;
  onClose: () => void;
  onAddToCart: (pizzaName: string, price: number) => void;
}

function PizzaModal({ pizza, onClose, onAddToCart }: PizzaModalProps) {
  if (!pizza) return null;

  const handleAddToCart = () => {
    onAddToCart(pizza.name, pizza.price);
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose}>×</button>
        
        <img src={pizza.image} alt={pizza.name} className={styles.modalImage} />
        
        <h2 className={styles.modalTitle}>{pizza.name}</h2>
        
        {pizza.popular && (
          <span className={styles.popularBadge}>🔥 Хит продаж</span>
        )}
        
        <div className={styles.modalInfo}>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>💰 Цена:</span>
            <span className={styles.modalInfoValue}>{pizza.price} ₽</span>
          </div>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>⚖️ Вес:</span>
            <span className={styles.modalInfoValue}>{pizza.weight}</span>
          </div>
          <div className={styles.modalInfoItem}>
            <span className={styles.modalInfoLabel}>🔥 Калории:</span>
            <span className={styles.modalInfoValue}>{pizza.calories}</span>
          </div>
        </div>
        
        <div className={styles.modalIngredients}>
          <h4>📋 Ингредиенты:</h4>
          <p>{pizza.ingredients}</p>
        </div>
        
        <div className={styles.modalDescription}>
          <h4>📝 Описание:</h4>
          <p>{pizza.description}</p>
        </div>
        
        <button 
          className={styles.modalButton}
          onClick={handleAddToCart}
        >
          🛒 Добавить в корзину - {pizza.price} ₽
        </button>
        <button 
          className={styles.modalButtonCancel}
          onClick={onClose}
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [selectedPizza, setSelectedPizza] = useState<typeof pizzas[0] | null>(null);
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);

  const addToCart = (pizzaName: string, price: number) => {
    setCartCount(prev => prev + 1);
    setCartMessage(`${pizzaName} добавлена в корзину! 🍕 (${price} ₽)`);
    setTimeout(() => setCartMessage(null), 2000);
  };

  const openModal = (pizza: typeof pizzas[0]) => {
    setSelectedPizza(pizza);
  };

  const closeModal = () => {
    setSelectedPizza(null);
  };

  const scrollToPizzas = () => {
    const pizzasSection = document.getElementById('pizzas-section');
    if (pizzasSection) {
      pizzasSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={styles.home}>
      {cartMessage && (
        <div className={styles.toast}>
          {cartMessage}
          {cartCount > 0 && (
            <span className={styles.cartCount}>Корзина: {cartCount} 🛒</span>
          )}
        </div>
      )}
      
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Пицца, которую вы любите
          </h1>
          <p className={styles.heroSubtitle}>
            Свежие ингредиенты, быстрая доставка, горячая пицца за 30 минут!
          </p>
          <button className={styles.heroButton} onClick={scrollToPizzas}>
            Смотреть меню
          </button>
        </div>
      </section>

      <div className={styles.container} id="pizzas-section">
        <h2 className={styles.sectionTitle}>Наши пиццы</h2>
        
        <div className={styles.pizzaGrid}>
          {pizzas.map(pizza => (
            <div key={pizza.id} className={styles.pizzaCard}>
              <div className={styles.imageWrapper}>
                <img 
                  src={pizza.image} 
                  alt={pizza.name} 
                  className={styles.pizzaImage}
                  loading="lazy"
                />
                {pizza.popular && (
                  <div className={styles.popularOverlay}>🔥 Хит</div>
                )}
              </div>
              <div className={styles.pizzaInfo}>
                <h3 className={styles.pizzaName}>{pizza.name}</h3>
                <p className={styles.pizzaIngredients}>{pizza.ingredients}</p>
                <div className={styles.pizzaFooter}>
                  <span className={styles.pizzaPrice}>{pizza.price} ₽</span>
                  <div className={styles.pizzaButtons}>
                    <button 
                      className={styles.pizzaButtonInfo}
                      onClick={() => openModal(pizza)}
                    >
                      📖 О пицце
                    </button>
                    <button 
                      className={styles.pizzaButton}
                      onClick={() => addToCart(pizza.name, pizza.price)}
                    >
                      🛒 В корзину
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PizzaModal 
        pizza={selectedPizza}
        onClose={closeModal}
        onAddToCart={addToCart}
      />
    </div>
  );
}