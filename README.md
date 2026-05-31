# ✅ Helix Flow — Task Manager

A full-stack Task Manager web application with authentication, task scheduling, calendar view, and clean REST API architecture.

---

## 🛠 Tech Stack

| Layer      | Technology                              |
|------------|------------------------------------------|
| Frontend   | React 19 + Vite + Context API            |
| Backend    | Django + Django REST Framework           |
| Database   | MongoDB via MongoEngine                  |
| Auth       | JWT (SimpleJWT) + Email OTP              |
| API        | RESTful API                              |
| Deployment | AWS (EC2 + S3) — Free Tier               |

---

## 📁 Project Structure

```
task-manager/
├── backend/                  # Django REST API
│   ├── apps/
│   │   ├── auth_app/         # Authentication (JWT + OTP)
│   │   └── tasks/            # Task CRUD + scheduling
│   ├── config/               # Django project settings
│   ├── core/                 # Shared utilities & helpers
│   ├── manage.py
│   ├── requirement.txt
│   └── .env.example
│
├── frontend/                 # React + Vite
│   └── src/
│       ├── api/              # Axios instance + API calls
│       ├── components/       # Reusable UI components
│       ├── context/          # AuthContext (Context API)
│       ├── hooks/            # Custom React hooks
│       ├── pages/            # Page-level components
│       ├── routes/           # Protected route HOC
│       ├── styles/           # Global CSS
│       └── utils/            # Helper functions
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Git

---

### Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirement.txt

# Copy and fill in environment variables
cp .env.example .env

# Run development server
python manage.py runserver
```

---

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and fill in environment variables
cp .env.example .env

# Run development server
npm run dev
```

---

## 🔐 Authentication

- **Email + Password** — standard login with JWT access/refresh tokens
- **Email OTP** — passwordless login via one-time passcode sent to email

---

## ✨ Features

- [ ] User registration & login (JWT)
- [ ] Email OTP authentication
- [ ] Create, view, edit, delete tasks
- [ ] Schedule tasks with date/time
- [ ] Mark tasks as completed
- [ ] Calendar view of scheduled tasks
- [ ] Dashboard with task summary
- [ ] Protected routes (auth guard)

---

## 🌍 Environment Variables

### Backend (`backend/.env`)

```env
SECRET_KEY=
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
MONGO_URI=
MONGO_DB_NAME=taskmanager
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
```

### Frontend (`frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit your changes: `git commit -m "feat: add your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

MIT
