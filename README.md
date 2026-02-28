# BankAI — Personalised Financial Intelligence Platform

> An AI-powered full-stack web application that provides a complete, personalised financial dashboard driven by the user's registered annual income.

---

## ✨ Features

### 🔐 Authentication
- User **Register** with optional Annual Income field
- **Login / Logout** with JWT-based session management
- **Profile management** — update name, email, and annual income
- **Password change** with current-password verification

### 💰 Personalised Financial Dashboard
- All KPIs, charts, and insights **scale to the user's annual income** stored in MongoDB
- **Real-time data** fetched fresh from the database on every dashboard load
- KPI cards: Monthly Income · Monthly Expenses · Net Savings · Financial Score
- Month-over-month trend arrows computed from 6-month derived data
- Falls back to `$60,000/yr` default if no income is set

### 📊 Analytics Page
- Expense Pie Chart by category
- Monthly Trend Bar Chart
- Income vs Expense Line Chart
- Summary strip: Avg monthly spend · Best savings month · Savings rate
- All data derived from user's registered income

### 🏆 Financial Score Page
- Score computed from savings rate, expense control, and discretionary spending
- 6 real metrics: Savings Rate · Expense Ratio · Discretionary Spend · Top Category · Monthly Income · Monthly Savings
- Factor progress bars (Savings Consistency · Spending Control · Discretionary Discipline)
- Dynamic tips generated from actual user figures

### 💳 Transactions Page
- Transaction amounts scale with user's income
- Full-text search across merchant and category
- Credit / Debit filter
- URL search param support (`?q=netflix`) for cross-page deep linking

### 📤 Upload Statement
- **Drag & Drop** file upload for PDF, CSV, and TXT files
- **Instant text extraction** — no background job needed
- **Two result views:**
  - Parsed Transactions table (Date · Description · Amount · Credit/Debit)
  - Raw Extracted Text (monospace, scrollable)
- **Copy buttons** on both views:
  - Transactions → clipboard as TSV (paste into Excel/Sheets)
  - Raw Text → full plain text
- 10 MB file size limit

### ⚙️ Settings
- Edit Full Name, Email, Annual Income (updates dashboard charts on save)
- Change Password
- Data & Privacy — delete account data

---

## 🗂️ Project Structure

```
ghr/
├── backend/
│   └── src/
│       ├── config/
│       │   └── database.js
│       ├── controllers/
│       │   ├── authController.js         # register · login · profile · password
│       │   └── statementController.js    # extract · upload · CRUD
│       ├── middleware/
│       │   ├── auth.js                   # JWT verify middleware
│       │   └── upload.js                 # Multer (PDF · CSV · TXT)
│       ├── models/
│       │   ├── User.js                   # + annualIncome field
│       │   ├── Statement.js
│       │   └── Transaction.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── statementRoutes.js
│       ├── services/
│       │   ├── aiService.js
│       │   └── analysisService.js
│       ├── utils/
│       │   └── parser.js                 # PDF · CSV · TXT extraction
│       └── server.js
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.js                   # Landing page
        │   ├── auth/
        │   │   ├── login/page.js
        │   │   └── register/page.js      # + annual income field
        │   └── dashboard/
        │       ├── layout.js
        │       ├── page.js               # Main dashboard (live DB fetch)
        │       ├── analytics/page.js
        │       ├── score/page.js         # Fully derived financial score
        │       ├── transactions/page.js
        │       ├── upload/page.js        # Extract + preview
        │       └── settings/page.js
        ├── components/
        │   ├── AIInsights.js
        │   ├── Charts.js
        │   ├── FinancialScore.js
        │   ├── KPICard.js
        │   ├── Navbar.js
        │   ├── RecurringPayments.js
        │   ├── Sidebar.js
        │   └── TransactionsTable.js
        ├── data/
        │   └── mockData.js               # Fallback defaults
        └── lib/
            ├── api.js                    # Axios client + all endpoints
            ├── AuthContext.js            # Global auth state
            └── deriveFinancials.js       # Central income → KPI engine
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Hugging Face API Key *(for AI categorization)*
- Google Gemini API Key *(for AI summaries)*

---

### Backend Setup

```bash
# 1. Enter the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your .env file
copy .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/bankai
JWT_SECRET=your_very_secure_jwt_secret
JWT_EXPIRE=7d
HUGGINGFACE_API_KEY=your_huggingface_api_key
GEMINI_API_KEY=your_gemini_api_key
NODE_ENV=development
```

```bash
# 4. Start the dev server
npm run dev
```

Backend runs at → `http://localhost:5000`

---

### Frontend Setup

```bash
# 1. Enter the frontend directory
cd frontend

# 2. Install dependencies
npm install

# 3. Create environment file
copy .env.local.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

```bash
# 4. Start Next.js dev server
npm run dev
```

Frontend runs at → `http://localhost:3000`

---

## 🔌 API Reference

### Authentication (`/api/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register` | ✗ | Register — accepts `name, email, password, annualIncome?` |
| `POST` | `/login` | ✗ | Login — returns `token + user` |
| `GET`  | `/profile` | ✔ | Fresh DB fetch — returns `annualIncome` |
| `PUT`  | `/profile` | ✔ | Update `name, email, annualIncome` |
| `PUT`  | `/change-password` | ✔ | Change password |

### Statements (`/api/statements`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/extract` | ✔ | **Sync** — extract text + parse transactions from PDF/CSV/TXT |
| `POST` | `/upload`  | ✔ | Async — save + background AI analysis |
| `GET`  | `/`        | ✔ | List all statements for user |
| `GET`  | `/:id`     | ✔ | Get statement + transactions |
| `DELETE` | `/:id`  | ✔ | Delete statement + transactions |

### Supported `/extract` File Types

| Type | Extraction Method |
|------|------------------|
| `.pdf` | `pdf-parse` → `extractTransactions()` |
| `.csv` | Custom CSV parser (headers: `date, description, amount, type`) |
| `.txt` | Raw UTF-8 text → `extractTransactions()` |

---

## 📐 How Income Drives the Dashboard

```
User's annualIncome (stored in MongoDB)
    ↓ fetched via GET /api/auth/profile
    ↓ passed to deriveFinancials(annualIncome)

Returns:
  monthly         = annualIncome / 12
  totalExpenses   = monthly × 70%
  netSavings      = monthly − expenses
  financialScore  = f(savingsRate, expenseRate)
  categories[]    = { Food 28%, Transport 14%, Shopping 21%, ... }
  monthlyData[]   = 6-month history with ±5% variation
  transactions[]  = 15 income-scaled transaction rows
  topCategories[] = top 3 spending categories
```

All pages — Dashboard, Analytics, Transactions, Score — consume this single utility.

---

## 📄 CSV Upload Format

```csv
date,description,amount,type
2024-01-15,Grocery Store,-125.50,debit
2024-01-16,Salary Deposit,3000.00,credit
2024-01-17,Netflix,-15.99,debit
```

> `type` field is optional — auto-detected from amount sign if missing.

---

## 🔒 Security

| Feature | Implementation |
|---------|---------------|
| Authentication | JWT Bearer token (7-day expiry) |
| Passwords | `bcryptjs` hashing (salt rounds: 10) |
| Routes | `protect` middleware on all private endpoints |
| File validation | Extension + MIME type check; 10 MB limit |
| CORS | Configured for `localhost:3000` |

---

## 🛣️ Roadmap

- [ ] Real bank transaction import via Plaid / Open Banking
- [ ] PDF statement history saved & browseable per user
- [ ] Budget goal setting with alerts
- [ ] Export dashboard as PDF/Excel
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Email notifications for unusual spending

---

## 📄 License

MIT — free to use, modify, and distribute.
