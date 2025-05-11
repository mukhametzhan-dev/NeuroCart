
# NeuroCart E-Commerce Platform

![NeuroCart Logo](https://via.placeholder.com/150x50?text=NeuroCart) 

A full-stack e-commerce platform with Django REST Framework backend and React/Redux frontend, featuring AI-powered product recommendations.

## Live Demo

- Frontend: [https://neurocart.netlify.app](https://neurocart.netlify.app)  
- Backend API: `https://kajet24.work.gd/api/swagger/`


## Features

### Backend (Django REST Framework)
- JWT Authentication  
- Product catalog with categories  
- Order processing system  
- AI-powered chat assistant (Gemini integration)  
- Coupon/discount system  
- Redis caching  
- Celery background tasks  
- Cloudinary media storage  
- API documentation with Swagger UI
- Advanced API docs with Redoc UI
- Performance profiling with Django Silk  

### Frontend (React/Redux)
- Responsive product listings  
- User authentication flows  
- Shopping cart functionality  
- Order history tracking  
- AI product consultation  
- Admin dashboard  

## Tech Stack

### Backend
<img src="https://img.icons8.com/?size=100&id=XPdRFanRZtNK&format=png&color=000000" style="height:100;width:100"/>
<img src="https://img.icons8.com/?size=100&id=eOZdMdtLeGdv&format=png&color=000000" style="height:100;width:100"/>
<img src="https://img.icons8.com/?size=100&id=pHS3eRpynIRQ&format=png&color=000000" style="height:100;width:100"/>
<img src="https://img.icons8.com/?size=100&id=22813&format=png&color=000000" style="height:100;width:100"/>
- Python 3.11  
- Django 4.2  
- Django REST Framework  
- PostgreSQL  
- Redis  
- Celery  
- Cloudinary  
- DRF-YASG (Swagger docs)  
- Django Silk (profiling)  

### Frontend
- React 18  
- Redux Toolkit  
- Axios  
- Tailwind/Bootstrap CSS  
- React Router  


### Infrastructure
- Ubuntu VPS  
- Nginx  
- Gunicorn  
- Docker  
- Docker Compose  

## Installation

### Backend Setup

1. Clone the repository:  
   ```bash
   git clone https://github.com/mukhametzhan-dev/NeuroCart.git
   cd NeuroCart/back
   ```

2. Create and activate virtual environment:  
   ```bash
   python -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:  
   ```bash
   pip install -r requirements.txt
   ```

4. Set up environment variables:  
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. Run migrations:  
   ```bash
   python manage.py migrate
   ```

6. Create superuser:  
   ```bash
   python manage.py createsuperuser
   ```

### Docker Setup (Alternative)

```bash
docker-compose up -d --build
```

### Frontend Setup

1. Navigate to frontend directory:  
   ```bash
   cd neurocart-frontend
   ```

2. Install dependencies:  
   ```bash
   npm install
   ```

3. Start development server:  
   ```bash
   npm start
   ```

## Configuration

Key environment variables (`.env`):

```ini
DATABASE_URL=postgres://user:password@host:port/dbname
REDIS_URL=redis://redis:6379/0
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
SECRET_KEY=your_django_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

## API Documentation

Access Swagger UI at `/swagger/` or ReDoc at `/redoc/` after starting the server. https://kajet24.work.gd/api/swagger/
Access Redoc UI at https://kajet24.work.gd/api/redoc/ 

## Deployment

### Backend (Ubuntu VPS)

1. Install dependencies:  
   ```bash
   sudo apt update
   sudo apt install nginx postgresql redis
   ```

2. Set up Nginx configuration:  
   ```nginx
   server {
       listen 80;
       server_name api.neurocart.work.gd;
       
       location / {
           proxy_pass http://127.0.0.1:8000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
       
       location /static/ {
           alias /path/to/static/files;
       }
   }
   ```

3. Start services:  
   ```bash
   sudo systemctl restart nginx
   gunicorn onlinestore.wsgi:application --bind 0.0.0.0:8000 --workers 4
   ```

### Frontend (Netlify)

1. Build production bundle:  
   ```bash
   npm run build
   ```

2. Deploy to Netlify via:  
   - Netlify CLI  
   - GitHub integration  
   - Drag-and-drop the `build` folder  

## Project Structure

```
neurocart/
├── backend/
│   ├── onlinestore/              # Django project
│   │   ├── settings.py           # Main configuration
│   │   ├── urls.py               # Root URLs
│   │   └── wsgi.py               # WSGI config
│   ├── store/                    # Main app
│   │   ├── models.py             # Database models
│   │   ├── serializers.py        # API serializers
│   │   ├── views.py              # API views
│   │   └── tasks.py              # Celery tasks
│   ├── manage.py
│   └── requirements.txt
├── frontend/                     # React app
│   ├── public/
│   ├── src/
│   │   ├── components/           # React components
│   │   ├── store/               # Redux setup
│   │   ├── App.js               # Main component
│   │   └── index.js             # Entry point
│   ├── package.json
│   └── README.md
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request  

## License

Distributed under the MIT License. See `LICENSE` for more information.

## Contact

Mukhametzhan - [@waveofem](https://t.me/waveofem) - 230103103@sdu.edu.kz
Olzhas  - [@OlzhasUsenbayev](https://github.com/OlzhasUssenbaev) - github

Project Link: [https://github.com/mukhametzhan-dev/NeuroCart](https://github.com/mukhametzhan-dev/NeuroCart)
```
