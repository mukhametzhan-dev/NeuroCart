import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navbar, Footer } from '../components';
import './Home.css';

// Feature card component
const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
);

// Product card component
const ProductCard = ({ product }) => {
  const priceNum = Number(product.price) || 0;
  const discountPrice = Math.round(priceNum * (1 - product.discount / 100));

  // рейтинг тоже гарантируем числом
  const rating = Number(product.rating) || 0;
  const roundedRating = Math.round(rating);   // 4.3 → 4

  return (
    <Link to={`/product/${product.id}`} className="product-card">
      <div className="product-image-container">
        <img
          src={
            product.images?.length
              ? product.images[0].image
              : product.imageLink
          }
          alt={product.name}
       style={{ height: "100%", width: "100%", objectFit: "contain" }}
        />
        {product.discount > 0 && (
          <div className="discount-badge">-{product.discount}%</div>
        )}
      </div>

      <div className="product-info">
        <h6 className="product-title">{product.name}</h6>

        {/* Цена */}
        <div className="product-price-container">
          {product.discount > 0 ? (
            <>
              <span className="product-price">
                ₸{discountPrice.toLocaleString('ru-RU')}
              </span>
              <span className="product-price-original">
                ₸{priceNum.toLocaleString('ru-RU')}
              </span>
            </>
          ) : (
            <span className="product-price">
              ₸{priceNum.toLocaleString('ru-RU')}
            </span>
          )}
        </div>

        {/* Рейтинг */}
        <div className="product-rating">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`star ${i < roundedRating ? 'filled' : ''}`}
            >
              {i < roundedRating ? '★' : '☆'}
            </span>
          ))}
          <span className="rating-count">({rating})</span>
        </div>
      </div>
    </Link>
  );
};


const Home = () => {
  // Product state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Language detection
  const [currentLang, setCurrentLang] = useState('en');
  const [headlineIndex, setHeadlineIndex] = useState(0);
  
  // Language content
  const content = {
    en: {
      headline: [
        "Discover Smart Shopping with AI",
        "Personalized Recommendations Just For You",
        "The Future of E-Commerce Is Here"
      ],
      subheading: "Experience the next generation of online shopping powered by neural networks",
      cta: "Chat with AI assistant",
      features: {
        delivery: {
          title: "Fast Delivery",
          description: "Get your orders delivered to your doorstep in record time with our optimized logistics."
        },
        recommendations: {
          title: "AI Recommendations",
          description: "Our neural network learns your preferences to suggest products you'll love."
        },
        security: {
          title: "Secure Checkout",
          description: "Shop with confidence with our encrypted and protected payment system."
        }
      }
    },
    ru: {
      headline: [
        "Умный шоппинг с ИИ",
        "Персонализированные рекомендации специально для вас",
        "Будущее электронной коммерции уже здесь"
      ],
      subheading: "Испытайте следующее поколение онлайн-шоппинга, работающего на нейронных сетях",
      cta: "Чат с ИИ-ассистентом",
      features: {
        delivery: {
          title: "Быстрая доставка",
          description: "Получайте заказы у вашего порога в рекордные сроки с нашей оптимизированной логистикой."
        },
        recommendations: {
          title: "ИИ-рекомендации",
          description: "Наша нейронная сеть изучает ваши предпочтения, чтобы предлагать товары, которые вам понравятся."
        },
        security: {
          title: "Безопасная оплата",
          description: "Делайте покупки с уверенностью благодаря нашей зашифрованной и защищенной платежной системе."
        }
      }
    },
    kk: {
      headline: [
        "Жасанды интеллектпен ақылды шопинг жасаңыз",
        "Тек сіз үшін жеке ұсыныстар",
        "e-commerce-тің болашағы осында"
      ],
      subheading: "Нейрондық желілермен жұмыс істейтін онлайн-сауданың келесі буынын тәжірибеден өткізіңіз",
      cta: "AI көмекшісімен сөйлесу",
      features: {
        delivery: {
          title: "Жылдам жеткізу",
          description: "Оңтайландырылған логистикамызбен тапсырыстарыңызды рекордтық уақытта алыңыз."
        },
        recommendations: {
          title: "AI ұсыныстары",
          description: "Біздің нейрондық желі сізге ұнайтын өнімдерді ұсыну үшін сіздің қалауыңызды үйренеді."
        },
        security: {
          title: "Қауіпсіз төлем",
          description: "Шифрланған және қорғалған төлем жүйемізбен сеніммен сауда жасаңыз."
        }
      }
    }
  };

  // Detect browser language on mount
  useEffect(() => {
    const detectLanguage = () => {
      const browserLang = navigator.language || navigator.userLanguage;
      if (browserLang.startsWith('ru')) {
        return 'ru';
      } else if (browserLang.startsWith('kk')) {
        return 'kk';
      } else {
        return 'en'; // Default to English
      }
    };

    setCurrentLang(detectLanguage());
  }, []);

  // Fetch products on mount
  useEffect(() => {
    let componentMounted = true;
    const getProducts = async () => {
      setLoading(true);
      try {
        const response = await fetch("https://kajet24.work.gd/api/products/");
        if (componentMounted) {
          const data = await response.json();
          // Get only the first 4 products for the featured section
          setProducts(data.slice(0, 4));
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        setLoading(false);
      }
    };
    getProducts();
    return () => {
      componentMounted = false;
    };
  }, []);

  // Rotate headlines every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setHeadlineIndex((prev) => (prev + 1) % content[currentLang].headline.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [currentLang]);

  // Icons for feature cards
  const deliveryIcon = <i className="fa fa-truck"></i>;
  const aiIcon = <i className="fa fa-brain"></i>;
  const securityIcon = <i className="fa fa-shield-alt"></i>;

  return (
    <>
      <Navbar />
      
      {/* Hero Section with Gradient Background */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="headline-container">
              <h1 className="hero-headline fade-transition">
                {content[currentLang].headline[headlineIndex]}
              </h1>
            </div>
            <p className="hero-subheading">
              {content[currentLang].subheading}
            </p>
            <div className="cta-container">
              <Link to="/chat" className="cta-button">
                {content[currentLang].cta} <i className="fa fa-comment-dots"></i>
              </Link>
            </div>
            
            {/* Language Selector */}
            <div className="language-selector">
              <button 
                onClick={() => setCurrentLang('en')} 
                className={`lang-btn ${currentLang === 'en' ? 'active' : ''}`}
              >
                English
              </button>
              <button 
                onClick={() => setCurrentLang('ru')} 
                className={`lang-btn ${currentLang === 'ru' ? 'active' : ''}`}
              >
                Русский
              </button>
              <button 
                onClick={() => setCurrentLang('kk')} 
                className={`lang-btn ${currentLang === 'kk' ? 'active' : ''}`}
              >
                Қазақша
              </button>
            </div>
          </div>
        </div>
      </section>
      
      {/* Feature Cards Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">
            {currentLang === 'en' ? 'Why Choose NeuroCart' : 
             currentLang === 'ru' ? 'Почему выбирают NeuroCart' : 
             'Неліктен NeuroCart таңдайды'}
          </h2>
          
          <div className="features-grid">
            <FeatureCard 
              icon={deliveryIcon}
              title={content[currentLang].features.delivery.title}
              description={content[currentLang].features.delivery.description}
            />
            <FeatureCard 
              icon={aiIcon}
              title={content[currentLang].features.recommendations.title}
              description={content[currentLang].features.recommendations.description}
            />
            <FeatureCard 
              icon={securityIcon}
              title={content[currentLang].features.security.title}
              description={content[currentLang].features.security.description}
            />
          </div>
        </div>
      </section>
      
      {/* Featured Products Section */}
      <section className="products-section">
        <div className="container">
          <h2 className="section-title">
            {currentLang === 'en' ? 'Featured Products' : 
             currentLang === 'ru' ? 'Рекомендуемые товары' : 
             'Ұсынылған өнімдер'}
          </h2>
          
          <div className="products-grid">
            {loading ? (
              // Show skeleton loading for products
              Array(4).fill().map((_, i) => (
                <div key={i} className="product-placeholder">
                  <div className="product-image"></div>
                  <div className="product-info">
                    <div className="product-title"></div>
                    <div className="product-price"></div>
                  </div>
                </div>
              ))
            ) : products.length > 0 ? (
              // Show actual products
              products.map(product => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  currentLang={currentLang} 
                />
              ))
            ) : (
              // Show message if no products found
              <div className="no-products-message">
                {currentLang === 'en' ? 'No products found' : 
                 currentLang === 'ru' ? 'Товары не найдены' : 
                 'Өнімдер табылмады'}
              </div>
            )}
          </div>
          
          <div className="view-all-container">
            <Link to="/product" className="view-all-btn">
              {currentLang === 'en' ? 'View All Products' : 
               currentLang === 'ru' ? 'Смотреть все товары' : 
               'Барлық өнімдерді көру'}
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </>
  );
};

export default Home;