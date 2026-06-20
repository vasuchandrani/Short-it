# Short-It: Invite-Only Production-Ready URL Shortener

**Short-It** is a private, production-ready, invite-only URL shortener application designed for trusted user circles. The system features a modern React client, an Express backend, PostgreSQL database storage, and high-performance caching utilizing Upstash Redis.

---

## Tech Stack

### Backend
- **Core**: Node.js & Express.js
- **Database**: PostgreSQL (Neon Database)
- **Cache**: Upstash Redis (REST-based HTTP cache)
- **Auth**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Mail**: Nodemailer notifications with Ethereal SMTP fallback

### Frontend
- **Framework**: React.js (Vite SPA)
- **Routing**: React Router DOM (protected client-side paths)
- **Icons**: Lucide React
- **Styling**: Modern, premium Vanilla CSS theme (dark mode, glassmorphism)

---

## Project Structure

```
Short-it/
├── backend/            # Express.js Server
│   ├── middleware/     # JWT Auth middleware
│   ├── routes/         # Auth, Admin, URL creation & Redirection route controllers
│   ├── db.js           # PostgreSQL pool configurations
│   ├── redis.js        # Upstash Redis REST wrapper with in-memory fallback
│   ├── email.js        # Nodemailer email trigger hooks
│   ├── initDb.js       # Auto-migrations and Admin seeding
│   ├── server.js       # Express entrypoint
│   └── test-system.js  # Database & Cache verification script
└── frontend/           # Vite React App
    ├── src/
    │   ├── components/ # Shared layout components (Navbar, Header)
    │   ├── pages/      # Landing, Login, Request Access, Dashboard, Profile, Admin Panel, 404
    │   ├── App.jsx     # Route configurations & protectors
    │   ├── index.css   # Main global design system
    │   └── AuthContext.jsx # Global user authentication state provider
```

---

## Environment Variables

Create a `.env` file in the `backend/` directory using the following keys:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=your_postgresql_connection_string
UPSTASH_REDIS_REST_URL=your_upstash_redis_rest_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_rest_token
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173
ADMIN_EMAIL=vatsal.chandrani.11@gmail.com
ADMIN_PASSWORD=vats@l1118

# Optional SMTP Settings (defaults to Ethereal mock in dev if empty)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## Setup Steps

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Install packages:
   ```bash
   npm install
   ```
3. Populate `.env` with valid connection credentials.
4. Verify connections using the validation suite:
   ```bash
   node test-system.js
   ```

### 2. Frontend Setup
1. Open a second terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install packages:
   ```bash
   npm install
   ```

---

## Running Instructions

### Run Backend Server
From the `backend/` directory, start the server in development hot-reload mode:
```bash
npm run dev
```
The server automatically applies database migrations and seeds the initial admin user. It runs on `http://localhost:5000`.

### Run Frontend Client
From the `frontend/` directory, start the Vite development server:
```bash
npm run dev
```
The application opens on `http://localhost:5173`.

---

## Core Product Flows

1. **Access Requests**: Unregistered users submit details on the home screen. A request is recorded, and the admin receives an HTML email with instant "Approve" / "Reject" links.
2. **Link Shortening**: Authenticated users create short URLs. The dashboard checks that custom keys are unique and that the same user cannot shorten the same link twice.
3. **Caching & Redirects**: Requests to `shortit.com/{key}` query Upstash Redis first for O(1) redirections. On a cache miss, the system queries the database, sets the cache, and forwards the client.