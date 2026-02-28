# Tech Stack — BankAI Financial Intelligence Platform

Complete dependency and architecture reference for the project.

---

## 🖥️ Frontend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | **Next.js** | 14 | App Router, SSR, file-based routing |
| UI Library | **React** | 18 | Component model, hooks |
| Styling | **Tailwind CSS** | 3.3 | Utility-first CSS |
| Charts | **Recharts** | 2.x | PieChart, BarChart, LineChart |
| HTTP Client | **Axios** | 1.6 | API calls with JWT interceptor |
| Icons | **Lucide React** | latest | Icon set throughout UI |
| Routing | Next.js App Router | — | `/app` directory, `Link`, `useRouter` |
| State | React Hooks | — | `useState`, `useEffect`, `useCallback`, `useRef` |
| Auth State | Custom `AuthContext` | — | `user`, `login`, `logout` across app |

### Key Frontend Files

| File | Role |
|------|------|
| `src/lib/AuthContext.js` | Global auth state + `localStorage` token management |
| `src/lib/api.js` | Axios instance with Bearer token interceptor; all API methods |
| `src/lib/deriveFinancials.js` | Central engine — converts `annualIncome` into all KPIs, charts, transactions |
| `src/data/mockData.js` | Fallback data used when no income is set |

---

## ⚙️ Backend

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Runtime | **Node.js** | 18+ | Server runtime |
| Framework | **Express.js** | 4.18 | REST API routing |
| Language | JavaScript | ES6+ | — |
| Hot Reload | **Nodemon** | 3.0 | Dev auto-restart |
| Env Vars | **dotenv** | 16.3 | `.env` loading |

---

## 🗄️ Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **MongoDB** | 6+ | Primary database |
| **Mongoose** | 8.0 | ODM — schemas, validation, queries |

### Models

| Model | Key Fields |
|-------|-----------|
| `User` | `name, email, password (hashed), annualIncome, createdAt` |
| `Statement` | `userId, fileName, fileType, status, analysis, uploadDate` |
| `Transaction` | `userId, statementId, date, description, amount, type, category` |

---

## 🤖 AI / ML Services

| Service | API | Model | Purpose |
|---------|-----|-------|---------|
| Transaction Categorization | Hugging Face Inference API | Mistral-7B-Instruct-v0.2 | Auto-categorize transactions |
| Financial Summaries | Google Gemini API | gemini-pro | Generate plain-English financial summaries |

---

## 🔐 Authentication & Security

| Feature | Library | Version |
|---------|---------|---------|
| Token generation | **jsonwebtoken** | 9.0 |
| Password hashing | **bcryptjs** | 2.4 |
| CORS | **cors** | 2.8 |
| Route protection | Custom `protect` middleware | — |

---

## 📁 File Processing

| Feature | Library | Version | Notes |
|---------|---------|---------|-------|
| File upload middleware | **Multer** | 1.4.5-lts | Memory storage, 10 MB limit |
| PDF text extraction | **pdf-parse** | 1.1.4 | Converts PDF buffer → plain text |
| CSV parsing | Custom parser | — | Header-aware, comma-delimited |
| TXT parsing | Custom parser | — | UTF-8, regex transaction extraction |

### Supported File Types for `/extract`

| Extension | MIME Type | Extraction |
|-----------|-----------|-----------|
| `.pdf` | `application/pdf` | `pdf-parse` → regex transaction scanner |
| `.csv` | `text/csv` | Column-aware header parser |
| `.txt` | `text/plain` | Date + amount regex scanner |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (Next.js — localhost:3000)         │
│  ┌────────────┐  ┌──────────────────────┐   │
│  │ AuthContext│  │  deriveFinancials()   │   │
│  │ (JWT cache)│  │  (income → all KPIs) │   │
│  └─────┬──────┘  └──────────┬───────────┘   │
│        │ axios               │               │
└────────┼────────────────────┼───────────────┘
         │ HTTP/JSON           │ (frontend only)
┌────────▼──────────────────────────────────────┐
│  Express API (localhost:5000)                  │
│                                                │
│  /api/auth/*         /api/statements/*         │
│   ├─ register         ├─ POST /extract  ←sync  │
│   ├─ login            ├─ POST /upload ←async   │
│   ├─ GET profile      ├─ GET /                 │
│   ├─ PUT profile      ├─ GET /:id              │
│   └─ PUT password     └─ DELETE /:id           │
│                                                │
│  Middleware: auth.js (JWT verify)              │
│             upload.js (Multer)                 │
└────────────────────┬───────────────────────────┘
                     │ Mongoose
┌────────────────────▼───────────────────────────┐
│  MongoDB                                        │
│   users · statements · transactions            │
└────────────────────────────────────────────────┘
```

### Design Patterns

| Pattern | Usage |
|---------|-------|
| MVC | Backend: Routes → Controllers → Services → Models |
| Component-based | Frontend: reusable React components |
| Context API | AuthContext for global login state |
| Derived State | `deriveFinancials()` — single source of truth for all financial display data |
| Live DB Fetch | Dashboard fetches fresh `annualIncome` from DB on every load |

---

## 🌐 API Communication

| Aspect | Detail |
|--------|--------|
| Style | RESTful JSON |
| Auth | `Authorization: Bearer <JWT>` header |
| File upload | `multipart/form-data` |
| CORS | `http://localhost:3000` allowed |

---

## 🚀 Deployment (Recommended)

| Layer | Service |
|-------|---------|
| Frontend | Vercel (zero-config Next.js) |
| Backend | Railway / Render / AWS EC2 |
| Database | MongoDB Atlas |
| File storage | AWS S3 *(future — currently in-memory)* |

---

## 📦 Key Package Versions

### Backend `package.json` dependencies
```json
{
  "express":        "^4.18.x",
  "mongoose":       "^8.0.x",
  "jsonwebtoken":   "^9.0.x",
  "bcryptjs":       "^2.4.x",
  "multer":         "^1.4.5-lts.x",
  "pdf-parse":      "^1.1.4",
  "cors":           "^2.8.x",
  "dotenv":         "^16.3.x",
  "nodemon":        "^3.0.x"
}
```

### Frontend `package.json` dependencies
```json
{
  "next":           "14.x",
  "react":          "^18.x",
  "axios":          "^1.6.x",
  "recharts":       "^2.x",
  "lucide-react":   "latest",
  "tailwindcss":    "^3.3.x"
}
```
