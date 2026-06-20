# Short-It: Invite-Only Production-Ready URL Shortener for DDU

**Short-It** is a private, production-ready, invite-only URL shortener application. It is customized to serve students at **DDU (Dharmsinh Desai University)** with instant automatic email verification while maintaining super-admin invite approvals for outside domains. 

The application is configured to serve short links using the branding domain **`ddu-projects.com`** (e.g. `https://ddu-projects.com/portfolio`).

---

## Tech Stack

### Backend
- **Core**: Node.js & Express.js
- **Database**: PostgreSQL (Neon Database)
- **Cache**: Upstash Redis (REST-based HTTP cache)
- **Auth**: JSON Web Tokens (JWT) & bcryptjs password hashing
- **Mail**: Brevo REST API with Gmail SMTP and Ethereal fallbacks

### Frontend
- **Framework**: React.js (Vite SPA)
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **Styling**: Modern, premium Vanilla CSS theme (dark mode, glassmorphism)

---

## Project Structure

```
Short-it/
├── package.json        # Root package.json managing monorepo scripts
├── render.yaml         # Render blueprint service template
├── backend/            # Express.js Server
│   ├── middleware/     # JWT Auth middleware
│   ├── routes/         # Auth, Admin, URL creation & Redirection route controllers
│   ├── db.js           # PostgreSQL pool configurations
│   ├── redis.js        # Upstash Redis REST wrapper with in-memory fallback
│   ├── email.js        # Brevo API & Nodemailer email triggers
│   ├── initDb.js       # Auto-migrations and Admin seeding
│   ├── server.js       # Express entrypoint serving API & Static build assets in production
│   └── test-system.js  # Database & Cache verification script
└── frontend/           # Vite React App
    ├── src/
    │   ├── components/ # Shared layout components (Navbar)
    │   ├── pages/      # Landing, Login, Request Access (OTP), Dashboard, Profile, Admin Panel, 404
    │   ├── App.jsx     # Route configurations & protectors
    │   ├── index.css   # Main global design system
    │   └── AuthContext.jsx # Global user authentication state provider
```

---

## Special Features

### 1. DDU Student Auto-Approval Flow
- In the registration form, users provide their chosen password.
- If the email ends in `@ddu.ac.in` (e.g., `23ituos013@ddu.ac.in`):
  - A 6-digit numeric verification code is generated.
  - The code is sent to the student's email via **Brevo** / **Gmail**. No notification is sent to the super admin.
  - The frontend prompts the student for this code.
  - Upon inputting the correct code, the account is activated instantly, and the user is auto-logged into the dashboard.
- If the email does **not** end in `@ddu.ac.in`:
  - The request is saved with status `pending`.
  - The super admin receives a notification email with direct `Approve` / `Reject` buttons.
  - Upon admin approval, the account is activated with their pre-selected password.

### 2. Branding Domain
- Custom short links are formatted on the user dashboard and profile using **`ddu-projects.com/{key}`**.

---

## Environment Variables

Create a `.env` file in the `backend/` directory during local development:

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

# Email Integrations
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=shortit.team@gmail.com
GMAIL_USER=shortit.team@gmail.com
GMAIL_PASS=your_gmail_app_password
```

---

## Running Locally

### 1. Local Setup
1. Install root, backend, and frontend packages:
   ```bash
   npm run install-all
   ```
2. Setup your `backend/.env` file.
3. Test your database and cache configurations:
   ```bash
   cd backend
   node test-system.js
   ```

### 2. Run Commands
- Run backend API: `cd backend && npm run dev` (starts on `http://localhost:5000`)
- Run frontend SPA: `cd frontend && npm run dev` (starts on `http://localhost:5173`)

---

## Deploying to Render

This project is configured to run as a single Render Web Service. The Express backend serves both the API endpoints and builds/serves the React static frontend bundle when running in production.

### Option A: Deploy using Blueprint (Recommended)
1. Commit all your changes and push them to your GitHub repository.
2. Go to [Render Dashboard](https://dashboard.render.com/) and click **New > Blueprint**.
3. Select your repository.
4. Render will parse `render.yaml` and prompt you for the required environment variables:
   - `DATABASE_URL` (Neon Postgres string)
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (Upstash cache credentials)
   - `BREVO_API_KEY` (Brevo email key)
   - `GMAIL_PASS` (Gmail App password fallback)
5. Click **Approve**. Render will automatically provision, install dependencies, compile the client bundle, and run the server.

### Option B: Manual Web Service Deployment
If you prefer configuring it manually on the Render dashboard:
1. Click **New > Web Service** and link your Git repository.
2. Configure the following settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
3. Click **Advanced** and add the following Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DATABASE_URL` = *(Your Neon PostgreSQL URL)*
   - `UPSTASH_REDIS_REST_URL` = *(Your Upstash Redis REST URL)*
   - `UPSTASH_REDIS_REST_TOKEN` = *(Your Upstash Redis REST Token)*
   - `JWT_SECRET` = *(Any random security phrase)*
   - `FRONTEND_URL` = `https://ddu-projects.com`
   - `BREVO_API_KEY` = *(Your Brevo API key)*
   - `EMAIL_FROM` = `shortit.team@gmail.com`
   - `GMAIL_USER` = `shortit.team@gmail.com`
   - `GMAIL_PASS` = *(Your Gmail App password fallback)*
4. Click **Deploy Web Service**.