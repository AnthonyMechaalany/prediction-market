# PredictIt – Prediction Market

> CSC456 Advanced Web Programming – Project 3  
> Full-stack Node.js/Express/MongoDB/EJS application with JWT authentication and Render deployment.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

# 3. (Optional) Seed the database
node seed.js

# 4. Run the app
npm run dev     # development (nodemon)
npm start       # production
```

Visit `http://localhost:3000`

**Default seed accounts:**
| Role  | Email                    | Password  |
|-------|--------------------------|-----------|
| Admin | admin@predictit.com      | admin123  |
| User  | alice@example.com        | user123   |
| User  | bob@example.com          | user123   |

---

## 🏗️ Architecture (MVC)

```
prediction-market/
├── app.js                    # Entry point
├── models/
│   ├── User.js               # User schema (Entity 1)
│   ├── Market.js             # Market schema (Entity 2)
│   └── Bet.js                # Bet schema (Entity 3)
├── views/
│   ├── partials/             # Reusable header/footer
│   ├── auth/                 # Login, Register
│   ├── markets/              # Index, Show, New, Edit
│   ├── bets/                 # My Bets, All Bets
│   ├── users/                # Profile, Index, Show, Edit
│   ├── home.ejs
│   └── dashboard.ejs
├── controllers/
│   ├── authController.js
│   ├── marketController.js
│   ├── betController.js
│   ├── userController.js
│   └── dashboardController.js
├── routes/
│   ├── authRoutes.js
│   ├── marketRoutes.js
│   ├── betRoutes.js
│   ├── userRoutes.js
│   └── dashboardRoutes.js
├── middleware/
│   └── auth.js               # JWT authenticate, requireAdmin
├── public/
│   ├── css/style.css
│   └── js/main.js
└── .github/workflows/deploy.yml
```

---

## 📦 Entities & Relationships

### Entities (3)
| Entity | Description |
|--------|-------------|
| **User** | Registered users with username, email, hashed password, role, points |
| **Market** | Prediction markets with title, description, category, status, outcome |
| **Bet** | A user's YES/NO bet on a market with amount and result |

### Relationships
- **One-to-Many**: User → Bets (one user can place many bets)  
- **Many-to-Many**: Users ↔ Markets (via Bets — many users bet on many markets; tracked via `participants` array + Bet join collection)

---

## 🔐 Authentication & Authorization

- **Registration**: bcrypt hashes password before saving (12 salt rounds)
- **Login**: JWT issued, stored in HttpOnly cookie (7d expiry)
- **Session**: Every request validates JWT via `authenticate` middleware
- **Roles**:
  - `user` — browse markets, place/cancel bets, view own profile
  - `admin` — all of the above + create/edit/delete/resolve markets, manage users, view all bets

---

## 🎯 Betting Logic

1. Every new user starts with **1,000 points**
2. Users bet **YES** or **NO** on a market
3. Bet amount is deducted immediately from user's points
4. Only **one bet per user per market** (enforced via unique index)
5. When admin **resolves** a market with YES or NO:
   - **Winners**: receive `bet.amount × 2` (double their bet back)
   - **Losers**: bet amount already deducted, payout = 0
6. Bets on open markets can be **cancelled for a full refund**

---

## ☁️ Deployment

### MongoDB Atlas
1. Create a free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Whitelist `0.0.0.0/0` for Render
3. Copy the connection string into your Render env vars

### Render
1. Push code to GitHub
2. New Web Service → connect repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variables: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`

### CI/CD (GitHub Actions)
1. In Render dashboard → Settings → Deploy Hook → copy URL
2. In GitHub repo → Settings → Secrets → add `RENDER_DEPLOY_HOOK_URL`
3. Every push to `main` auto-triggers redeployment via `.github/workflows/deploy.yml`

---

## 🔒 Security Highlights

- Passwords hashed with **bcrypt** (cost factor 12)
- JWT stored in **HttpOnly cookie** (not accessible via JS)
- **Protected routes** — middleware blocks unauthenticated access
- **Role-based access control** — admin-only routes check role
- **Input validation** — Mongoose schema constraints on all fields
- `.env` for all secrets — never committed to git
