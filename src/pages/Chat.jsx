import React, { useEffect, useState, useRef } from 'react';
import { Form, Button, Spinner, Toast, Card } from 'react-bootstrap';
import { Send, Robot, Paperclip, Mic, X, ArrowRepeat, Download, EmojiSmile, Tag, BarChart, Search } from 'react-bootstrap-icons';
import Navbar from '../components/Navbar';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

const ChatSupport = () => {
  const [menu, setMenu] = useState("");
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);
  
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [products, setProducts] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [suggestionItems, setSuggestionItems] = useState([]);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const userEmail = localStorage.getItem('userEmail') || localStorage.getItem('email');
  const photo = localStorage.getItem("photo");

  // Predefined prompts for shopping assistant
  const predefinedPrompts = [
    { text: "Помогите выбрать смартфон", icon: <Tag size={16} /> },
    { text: "Сравните iPhone и Samsung", icon: <BarChart size={16} /> },
    { text: "Что сейчас популярно?", icon: <Search size={16} /> },
    { text: "Лучшие товары со скидкой", icon: <Tag size={16} /> }
  ];
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    loadChatHistory();
    fetchProducts();
  }, [userEmail]);

  const fetchProducts = async () => {
    try {
      const res = await axios.get('https://kajet24.work.gd/api/products/');
      setProducts(res.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const showNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const loadChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await axios.get('https://kajet24.work.gd/api/chat', {
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      
      if (res.data.messages && Array.isArray(res.data.messages)) {
        setMessages(res.data.messages.map(msg => ({
          role: msg.role,
          text: msg.text,
          timestamp: msg.timestamp || new Date().toISOString(),
          products: msg.products || []
        })));
        if (res.data.messages.length > 0) {
          showNotification('История чата загружена');
        }
      } else {
        setMessages([{
          role: 'ai',
          text: 'Добро пожаловать! Я ваш персональный консультант по покупкам. Чем могу помочь сегодня?',
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      showNotification('Не удалось загрузить историю чата');

      setMessages([{
        role: 'ai',
        text: 'Добро пожаловать! Я ваш персональный консультант по покупкам. Чем могу помочь сегодня?',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoadingHistory(false);
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendPrompt(e);
    }
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      text: 'Чат очищен. Чем я могу вам помочь сегодня?',
      timestamp: new Date().toISOString()
    }]);
    showNotification('История чата очищена');
  };

  // Find relevant products based on keywords
  const findRelevantProducts = (query) => {
    const keywords = query.toLowerCase().split(' ');
    return products.filter(product => {
      const name = product.name.toLowerCase();
      const description = product.description.toLowerCase();
      return keywords.some(keyword => 
        name.includes(keyword) || description.includes(keyword)
      );
    }).slice(0, 3); // Limit to 3 products
  };

  // Simulate typing effect for AI responses
  const simulateTyping = async (message, products = []) => {
    setIsTyping(true);
    // Adding a reasonable timeout before showing the message (simulates thinking + typing)
    await new Promise(resolve => setTimeout(resolve, 1000 + message.length * 5));
    setIsTyping(false);
    
    const aiMsg = { 
      role: 'ai', 
      text: message, 
      timestamp: new Date().toISOString(),
      products: products
    };
    
    setMessages(prev => [...prev, aiMsg]);
  };

  const sendPrompt = async (e) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    
    const currentTime = new Date().toISOString();
    const userMsg = { role: 'user', text: prompt, timestamp: currentTime };
    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setLoading(true);
  
    try {
      // Try to find relevant products based on the prompt
      const relevantProducts = findRelevantProducts(prompt);
      
      // Check for shopping-related keywords
      const shoppingKeywords = ['купить', 'заказать', 'товар', 'продукт', 'цена', 'стоимость', 'сравни', 'лучше', 'рекомендуй', 'смартфон', 'телефон', 'электроника'];
      const isShoppingQuery = shoppingKeywords.some(keyword => prompt.toLowerCase().includes(keyword));
      
      // Send to backend for AI processing
      const res = await fetch('https://kajet24.work.gd/api/chat/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
        },
        body: JSON.stringify({ 
          email: userEmail,
          prompt: prompt 
        }),
      });
      
      if (!res.ok) throw new Error('Network response was not ok');
      
      const data = await res.json();
      
      // Add product suggestions if this is a shopping query
      if (isShoppingQuery && relevantProducts.length > 0) {
        await simulateTyping(data.answer, relevantProducts);
      } else {
        await simulateTyping(data.answer);
      }
    } catch (error) {
      console.error('Error:', error);
      setIsTyping(false);
      const errorMsg = { 
        role: 'ai', 
        text: 'Извините, произошла ошибка при обработке вашего запроса. Пожалуйста, попробуйте позже.', 
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMsg]);
      showNotification('Не удалось получить ответ от ИИ');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  };

  const downloadChatHistory = () => {
    const chatText = messages.map(m => `[${formatTimestamp(m.timestamp)}] ${m.role === 'user' ? 'Вы' : 'ИИ'}: ${m.text}`).join('\n\n');
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('История чата скачана');
  };

  const handlePredefinedPrompt = (promptText) => {
    setPrompt(promptText);
  };

  const navigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Product suggestion card component
  const ProductSuggestion = ({ product }) => (
    <Card 
      className="product-suggestion my-2 border cursor-pointer shadow-sm" 
      onClick={() => navigateToProduct(product.id)}
    >
      <div className="d-flex">
        <div className="product-image" style={{ width: '80px', height: '80px' }}>
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0].image} 
              alt={product.name} 
              className="img-fluid p-1" 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <div className="bg-light d-flex align-items-center justify-content-center h-100">
              <span className="text-muted small">Нет фото</span>
            </div>
          )}
        </div>
        <div className="p-2">
          <div className="small fw-bold">{product.name}</div>
          <div className="text-danger fw-bold">{parseInt(product.price).toLocaleString('kz-KZ')} ₸</div>
          <div className="small text-muted">
            <span className="me-2">
              Рейтинг: {product.rating ? product.rating.toFixed(1) : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );

  return (
    <>
      <Navbar />
      
      <div className="d-flex flex-column vh-100">
        <div className="flex-grow-1 d-flex flex-column" style={{ overflow: 'hidden' }}>
          <div className="bg-white border-bottom p-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-flex align-items-center">
              <Robot size={24} className="me-2 text-primary" />
              <span>ShopAI Ассистент</span>
              <div className="badge bg-success ms-2" style={{fontSize: '0.6rem'}}>Онлайн</div>
            </h5>
            <div className="d-flex">
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={loadChatHistory} title="Перезагрузить историю">
                <ArrowRepeat size={16} />
              </Button>
              <Button variant="outline-secondary" size="sm" className="me-2" onClick={downloadChatHistory} title="Скачать историю">
                <Download size={16} />
              </Button>
              <Button variant="outline-danger" size="sm" onClick={clearChat} title="Очистить чат">
                <X size={16} />
              </Button>
            </div>
          </div>

          <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1050 }}>
            <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
              <Toast.Header closeButton={false}>
                <strong className="me-auto">Уведомление</strong>
              </Toast.Header>
              <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
          </div>

          <div 
            className="flex-grow-1 p-3 overflow-auto"
            style={{
              background: 'linear-gradient(to bottom, #f8f9fa, #edf2f7)',
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-6 60c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM40 40c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm18 27c0-2.21-1.79-4-4-4s-4 1.79-4 4 1.79 4 4 4 4-1.79 4-4zm-13-44c0-1.66-1.34-3-3-3s-3 1.34-3 3 1.34 3 3 3 3-1.34 3-3z\' fill=\'%239C92AC\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
            }}
          >
            {isLoadingHistory ? (
              <div className="text-center d-flex flex-column justify-content-center align-items-center h-100">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Загрузка истории вашего разговора...</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted d-flex flex-column align-items-center justify-content-center h-100">
                <Robot size={58} className="mb-3 text-primary" />
                <h4>Добро пожаловать в ShopAI Ассистент</h4>
                <p className="text-muted">Чем я могу помочь вам сегодня?</p>
                <div className="mt-3 d-flex flex-wrap justify-content-center">
                  {predefinedPrompts.map((prompt, idx) => (
                    <Button 
                      key={idx} 
                      variant="outline-primary" 
                      size="sm" 
                      className="m-1 d-flex align-items-center" 
                      onClick={() => handlePredefinedPrompt(prompt.text)}
                    >
                      <span className="me-1">{prompt.icon}</span>
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`d-flex mb-3 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                >
                  <div
                    className={`d-flex align-items-start ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
                    style={{maxWidth: '80%'}}
                  >
                    <div 
                      className={`d-flex align-items-center justify-content-center rounded-circle ${
                        m.role === 'user' 
                          ? 'bg-primary text-white' 
                          : m.isError 
                            ? 'bg-danger text-white' 
                            : 'bg-white border border-primary text-primary'
                      }`} 
                      style={{width: '40px', height: '40px', flexShrink: 0}}
                    >
                      {m.role === 'user' ? (
                         <>{photo ? <img src={photo} alt="User Avatar" className="rounded-circle" style={{ width: "40px", height: "40px", objectFit: "cover" }} /> : '👤'}</>
                      ) : (
                        <Robot size={20} />
                      )}
                    </div>
                    <div 
                      className={`px-3 py-2 mx-2 rounded-lg shadow-sm ${
                        m.role === 'user' 
                          ? 'bg-primary text-white' 
                          : m.isError 
                            ? 'bg-danger bg-opacity-10 border-danger text-danger' 
                            : 'bg-white border'
                      }`}
                      style={{wordBreak: 'break-word'}}
                    >
                      <div className={m.role === 'ai' && i === messages.length - 1 ? 'typing-text' : ''}
     style={{ whiteSpace: 'pre-wrap' }}>
<ReactMarkdown remarkPlugins={[remarkGfm]}>
  {m.text}
</ReactMarkdown>
</div>
                      
                      {/* Product suggestions */}
                      {m.role === 'ai' && m.products && m.products.length > 0 && (
                        <div className="mt-3 border-top pt-2">
                          <div className="small fw-bold mb-2">Найденные товары:</div>
                          {m.products.map(product => (
                            <ProductSuggestion key={product.id} product={product} />
                          ))}
                        </div>
                      )}
                      
                      <div className="text-end mt-1">
                        <small className={`opacity-75 ${m.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                          {formatTimestamp(m.timestamp)}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            {(loading || isTyping) && (
              <div className="d-flex justify-content-start">
                <div className="d-flex align-items-start" style={{maxWidth: '80%'}}>
                  <div className="d-flex align-items-center justify-content-center rounded-circle bg-white border border-primary text-primary" style={{width: '40px', height: '40px', flexShrink: 0}}>
                    <Robot size={20} />
                  </div>
                  <div className="px-3 py-3 mx-2 bg-white border rounded-lg shadow-sm">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Shopping assistant quick menu */}
          <div className="bg-light border-top py-2 px-3">
            <div className="d-flex flex-wrap gap-2 justify-content-center">
              {predefinedPrompts.map((prompt, idx) => (
                <Button 
                  key={idx} 
                  variant="outline-secondary" 
                  size="sm" 
                  className="d-flex align-items-center" 
                  onClick={() => handlePredefinedPrompt(prompt.text)}
                >
                  <span className="me-1">{prompt.icon}</span>
                  {prompt.text}
                </Button>
              ))}
            </div>
          </div>
          
          <div className="p-3 border-top bg-white">
            <Form onSubmit={sendPrompt}>
              <div className="d-flex align-items-end">
                <div className="flex-grow-1 me-2 position-relative">
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Введите ваше сообщение здесь..."
                    className="rounded-4 pr-5"
                    style={{
                      resize: 'none', 
                      padding: '12px 20px', 
                      boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                      paddingRight: '40px'
                    }}
                  />
                  <div className="position-absolute bottom-0 end-0 mb-2 me-2">
                    <Button variant="link" size="sm" className="text-muted p-1">
                      <EmojiSmile size={18} />
                    </Button>
                  </div>
                  <div className="d-flex justify-content-start mt-1">
                    <Button variant="link" size="sm" className="text-muted">
                      <Paperclip size={18} />
                    </Button>
                    <Button variant="link" size="sm" className="text-muted">
                      <Mic size={18} />
                    </Button>
                  </div>
                </div>
                <Button 
                  variant="primary" 
                  type="submit" 
                  disabled={loading || !prompt.trim()}
                  className="rounded-circle p-2 d-flex align-items-center justify-content-center shadow" 
                  style={{width: '50px', height: '50px'}}
                >
                  <Send size={20} />
                </Button>
              </div>
            </Form>
          </div>
        </div>
        
        <style jsx>{`
          .typing-indicator {
            display: inline-flex;
            align-items: center;
          }
              
          .typing-indicator span {
            height: 8px;
            width: 8px;
            margin: 0 2px;
            background-color: #3498db;
            border-radius: 50%;
            display: inline-block;
            animation: typing 1.4s infinite ease-in-out both;
          }
          
          .typing-indicator span:nth-child(1) {
            animation-delay: 0s;
          }
          
          .typing-indicator span:nth-child(2) {
            animation-delay: 0.2s;
          }
          
          .typing-indicator span:nth-child(3) {
            animation-delay: 0.4s;
          }
          
          @keyframes typing {
            0% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.4);
              opacity: 1;
            }
            100% {
              transform: scale(1);
              opacity: 0.7;
            }
          }
          
          /* Text generation animation */
          .typing-text {
            overflow: hidden;
            border-right: 2px solid transparent;
            white-space: pre-wrap;
            animation: typing-effect 0.1s steps(40, end), blink 0.75s step-end infinite;
          }
          
          @keyframes typing-effect {
            from { max-height: 0; }
            to { max-height: 1000px; }
          }
          
          @keyframes blink {
            from, to { border-color: transparent; }
            50% { border-color: #3498db; }
          }
          
          .rounded-lg {
            border-radius: 18px;
          }
          
          .product-suggestion:hover {
            transform: translateY(-2px);
            transition: all 0.2s ease;
            box-shadow: 0 4px 8px rgba(0,0,0,0.1) !important;
          }
        `}</style>
      </div>
    </>
  );
};

export default ChatSupport;