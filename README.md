# GHR — AI-Powered Financial Intelligence Platform

> A full-stack web application that parses real bank statements, classifies transactions using a custom-trained NLP model, generates structured AI financial summaries, and presents a personalised financial health dashboard — all driven by the user's actual transaction data.

---

## ✨ Key Features

### 🔐 Authentication
- User **Register** with optional Annual Income field
- **Login / Logout** with JWT-based session management
- **Profile management** — update name, email, and annual income
- **Password change** with current-password verification

---

### 📤 Statement Upload & Parsing
- **Drag & Drop** file upload for **PDF, CSV, and TXT** bank statements
- **Two-button workflow** after file selection:
  - **Extract & Preview** — instantly extracts and parses transactions, shows a preview on the upload page
  - **Upload Transaction Statement** — persists the statement + transactions to your account (saved to DB)
- **Instant text extraction** using `pdf-parse` (PDF), raw UTF-8 (TXT), and custom CSV parser
- Parsed transactions table: Date · Description · Amount · Category · Credit/Debit
- Raw extracted text viewer (monospace, scrollable, copyable)
- 10 MB file size limit

---

### 🤖 AI Transaction Categorisation
- Every uploaded transaction is classified into one of **10 financial categories** using a **custom-trained NLP model**:

  `EMI` · `Entertainment` · `Food` · `Healthcare` · `Investment` · `Other` · `Rent` · `Shopping` · `Transport` · `Utilities`

- The model is based on a **pretrained transformer architecture (DistilBERT)**, further **fine-tuned on a domain-specific Indian bank transaction dataset** to achieve high accuracy on real-world transaction descriptions (e.g., "Zomato order", "SBI Home Loan EMI", "PhonePe Recharge")
- Runs as a **local ML microservice** (Python / Flask, port 5001) — no external API dependency
- Automatically **falls back to keyword heuristics** if the ML service is unavailable
- Batch inference enabled: all transactions in a statement are classified in a **single model call** for speed

---

### 🧠 AI Financial Summary (Powered by LLM)
- After each upload, a **structured 6-section financial summary** is automatically generated using a **large language model fine-tuned for financial advisory tasks**
- The model is provided with anonymised transaction statistics (income, expenses, category breakdown, savings rate) and produces a professional report

**Summary covers:**

| # | Section | What it covers |
|---|---------|---------------|
| 1 | **Overall Financial Health** | One-line health assessment with savings rate |
| 2 | **Income vs Expense** | Actual numbers compared |
| 3 | **Top Spending Categories** | Top 2–3 categories with ₹ amounts |
| 4 | **Recurring Expenses** | Subscription and EMI patterns |
| 5 | **Risk Indicators** | Flags for low savings, high EMI, overspending |
| 6 | **Actionable Recommendations** | 3 concrete, personalised financial tips |

- Summary is displayed as **colour-coded section cards** with bullet points — on both the Upload page and the Dashboard
- Clearly labelled with ⚡ **Powered by LLM** badge
- Persisted in session (localStorage) so it remains visible across pages without re-running
- Graceful structured **fallback** if the LLM service is unavailable

---

### 💰 Personalised Financial Dashboard
- **Prioritises real parsed data** from uploaded statement; falls back to income-derived estimates
- Source clearly indicated — "Statement: filename.pdf" or "Estimated Data"
- KPI cards: Total Income · Total Expenses · Net Savings · Financial Health Score
- Month-over-month trend arrows
- Expense Pie Chart · Monthly Trend Bar Chart
- Recurring payments summary
- Recent transactions table (top 6)
- AI Financial Summary card with structured LLM output

---

### 🏆 Financial Health Score (6-Component System)
Score is computed from **6 independent financial ratios**, each weighted:

| Component | Max pts | Ratio |
|-----------|---------|-------|
| Savings Score | 25 | `(Income − Expenses) ÷ Income` |
| Expense Score | 20 | `Total Expenses ÷ Income` |
| EMI Score | 20 | `Total EMI ÷ Income` |
| Investment Score | 15 | `Investments ÷ Income` |
| Subscription Score | 10 | `Subscriptions ÷ Income` |
| Stability Score | 10 | Coefficient of variation of monthly spending |

- Each component shown as a **colour-coded progress bar** with the actual ratio %
- **Personalised tips** generated from real ratios
- **Scoring formula reference card** on the score page
- Score out of 100 displayed in an animated circular gauge

---

### 📊 Analytics Page
- Spending by Category — Donut Pie Chart
- Category Breakdown — Horizontal progress bars with ₹ amounts
- Monthly Expenses Trend — Bar Chart
- Monthly Savings Trend — Line Chart
- Summary strip: Avg monthly spend · Best savings month · Savings rate

---

### 💳 Transactions Page
- Real transactions from uploaded statement (or income-derived estimates)
- Full-text search across merchant and category
- Credit / Debit filter
- Colour-coded category badges

---

### ⚙️ Settings
- Edit Full Name, Email, Annual Income
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
│       │   └── statementController.js    # extract (+ LLM summary) · upload · CRUD
│       ├── middleware/
│       │   ├── auth.js                   # JWT verify middleware
│       │   └── upload.js                 # Multer (PDF · CSV · TXT)
│       ├── models/
│       │   ├── User.js
│       │   ├── Statement.js
│       │   └── Transaction.js
│       ├── routes/
│       │   ├── authRoutes.js
│       │   └── statementRoutes.js
│       ├── services/
│       │   ├── aiService.js              # ML categorisation + LLM summary
│       │   └── analysisService.js        # 6-component score + breakdown
│       ├── utils/
│       │   └── parser.js                 # PDF · CSV · TXT extraction
│       └── server.js
│
├── ml_service/                           # Local ML microservice (Python / Flask)
│   ├── app.py                            # REST API: /predict · /predict-batch · /health
│   ├── label_encoder.pkl                 # Trained LabelEncoder (10 categories)
│   ├── requirements.txt
│   └── transaction_model/               # Fine-tuned DistilBERT model weights
│       ├── config.json
│       ├── tokenizer.json
│       └── tokenizer_config.json
│       # model.safetensors excluded (>100MB) — download separately
│
└── frontend/
    └── src/
        ├── app/
        │   ├── page.js                   # Landing page
        │   ├── auth/
        │   │   ├── login/page.js
        │   │   └── register/page.js
        │   └── dashboard/
        │       ├── layout.js
        │       ├── page.js               # Main dashboard
        │       ├── analytics/page.js
        │       ├── score/page.js         # 6-component financial score
        │       ├── transactions/page.js
        │       ├── upload/page.js        # Extract + preview + upload flow
        │       └── settings/page.js
        ├── components/
        │   ├── AIInsights.js             # LLM summary card with section parser
        │   ├── Charts.js
        │   ├── FinancialScore.js
        │   ├── KPICard.js
        │   ├── Navbar.js
        │   ├── RecurringPayments.js
        │   ├── Sidebar.js
        │   └── TransactionsTable.js
        └── lib/
            ├── api.js                    # Axios client + all endpoints
            ├── AuthContext.js            # Global auth state
            ├── StatementContext.js       # Global parsed data + LLM summary state
            ├── deriveFinancials.js       # Income → KPI engine (fallback)
            └── formatINR.js             # Indian Rupee number formatting
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js v18+
- Python 3.9+ (for ML microservice)
- MongoDB (local or Atlas)
- LLM API Key *(for AI financial summaries)*

---

### ML Microservice Setup

```bash
# 1. Enter the ml_service directory
cd ml_service

# 2. Install Python dependencies
pip install -r requirements.txt

# 3. Download model weights (not included — file too large for git)
#    Place model.safetensors inside: ml_service/transaction_model/

# 4. Start the ML service
python app.py
```

ML service runs at → `http://localhost:5001`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Check model status + loaded categories |
| `/predict` | POST | Classify a single transaction description |
| `/predict-batch` | POST | Classify many descriptions in one call |

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
LLM_API_KEY=your_llm_api_key
ML_SERVICE_URL=http://localhost:5001
NODE_ENV=development
```

```bash
# 4. Start the backend dev server
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
| `POST` | `/extract` | ✔ | **Sync** — parse transactions + ML categorise + generate LLM summary |
| `POST` | `/upload`  | ✔ | Persist statement + transactions to DB |
| `GET`  | `/`        | ✔ | List all statements for user |
| `GET`  | `/:id`     | ✔ | Get statement + transactions |
| `DELETE` | `/:id`  | ✔ | Delete statement + transactions |

### Supported File Types

| Type | Extraction Method |
|------|------------------|
| `.pdf` | `pdf-parse` → `extractTransactions()` |
| `.csv` | Custom CSV parser (headers: `date, description, amount, type`) |
| `.txt` | Raw UTF-8 text → `extractTransactions()` |

---

## 📐 Data Flow

```
User uploads PDF / TXT / CSV
        ↓
Backend extracts raw text / rows
        ↓
ML Microservice (DistilBERT, fine-tuned)
  → classifies each transaction into 1 of 10 categories
        ↓
LLM Service (fine-tuned for financial advisory)
  → generates structured 6-section summary from aggregated stats
        ↓
Response: { transactions, aiSummary, analysis }
        ↓
Frontend → StatementContext (global state + localStorage)
        ↓
Dashboard · Transactions · Analytics · Score
  → all pages consume real parsed data
```

---

## 📄 CSV Upload Format

```csv
date,description,amount,type
2024-01-15,Grocery Store,125.50,debit
2024-01-16,Salary Deposit,50000.00,credit
2024-01-17,Netflix,649,debit
2024-01-18,SBI Home Loan EMI,12000,debit
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
| Secrets | `.env` gitignored; model weights excluded |

---

## 🛣️ Roadmap

- [ ] Real bank transaction import via Open Banking / account aggregators
- [ ] PDF statement history saved & browseable per user
- [ ] Budget goal setting with alerts
- [ ] Export dashboard as PDF / Excel
- [ ] Multi-currency support
- [ ] Mobile app (React Native)
- [ ] Email notifications for unusual spending patterns
- [ ] Fully offline ML inference without any external API

---

## 📄 License

MIT — free to use, modify, and distribute.
