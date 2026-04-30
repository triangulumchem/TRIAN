# TradeIndia Inquiry Manager

A full-stack web application for managing TradeIndia inquiry data for a chemical trading company. Automatically extracts and structures product names, person names, locations, and other data from unstructured CSV exports.

## Features

- **CSV Upload** - Single or bulk CSV file upload
- **AI-Powered Extraction** - Automatically extracts product names from unstructured requirement text using AI (OpenAI API) with regex fallback
- **Structured Database** - SQLite database with indexed fields for fast queries
- **Dashboard** - Visual analytics with monthly trends, top products, cities, and repeat customers
- **Advanced Filtering** - Filter by date range, product, city, state, and search by company/person
- **Export** - Export filtered data to CSV
- **CRUD Operations** - Edit and delete inquiries
- **Mobile Responsive** - Works on all screen sizes

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS, Recharts, Lucide React |
| Backend | Node.js, Express |
| Database | SQLite3 |
| AI | OpenAI GPT-3.5 (or any OpenAI-compatible API) |

## Folder Structure

```
tradeindia-inquiry-manager/
├── backend/
│   ├── src/
│   │   ├── index.js              # Express server entry
│   │   ├── utils/
│   │   │   ├── database.js       # SQLite setup & connection
│   │   │   └── aiExtractor.js   # AI + fallback extraction logic
│   │   └── routes/
│   │       ├── inquiries.js      # CRUD + export APIs
│   │       ├── upload.js         # CSV parse & process
│   │       └── dashboard.js      # Stats & filter options
│   ├── .env                      # Environment variables
│   ├── .env.example
│   ├── package.json
│   └── .gitignore
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.js
│   │   ├── index.js
│   │   ├── index.css
│   │   ├── services/
│   │   │   └── api.js            # Axios API client
│   │   ├── components/
│   │   │   └── Layout.js         # Sidebar + navigation
│   │   └── pages/
│   │       ├── Dashboard.js      # Analytics dashboard
│   │       ├── Inquiries.js      # Table view + filters
│   │       └── Upload.js         # File upload page
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- OpenAI API key (optional - fallback regex extraction works without it)

### 1. Clone & Navigate

```bash
cd tradeindia-inquiry-manager
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create `.env` file:
```bash
cp .env.example .env
```

Edit `.env` and add your OpenAI API key (optional):
```env
PORT=5000
NODE_ENV=development
DB_PATH=./data/inquiries.db

# AI API Configuration (optional - app works without it)
OPENAI_API_KEY=sk-your-key-here
AI_API_URL=https://api.openai.com/v1/chat/completions
AI_MODEL=gpt-3.5-turbo
```

Start the backend:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

Server runs on `http://localhost:5000`

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000` and proxies API calls to the backend.

### 4. Using the App

1. Go to **Upload** page
2. Drag & drop your TradeIndia CSV file(s)
3. Click Upload - the app will:
   - Parse all rows
   - Extract product names from the "Requirement" text
   - Extract person names, cities, states
   - Store everything in structured SQLite database
4. Go to **Dashboard** to see analytics
5. Go to **Inquiries** to view, filter, edit, export data

## AI Extraction API Example

The app uses this prompt for product extraction:

```javascript
const response = await axios.post(
  'https://api.openai.com/v1/chat/completions',
  {
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'Extract only the chemical product name from the given inquiry text. Return only the product name. If no chemical product is found, return "Unknown".'
      },
      {
        role: 'user',
        content: 'New Inquiry for Magnesium sulphate from Mr. Visram Kumhar'
      }
    ],
    max_tokens: 50,
    temperature: 0.1
  },
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);
// Returns: "Magnesium sulphate"
```

### Alternative AI Providers

Any OpenAI-compatible API works:

**Groq (Free tier available):**
```env
OPENAI_API_KEY=your_groq_key
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_MODEL=llama3-8b-8192
```

**Without AI Key:**
The app has a robust regex fallback that extracts product names from patterns like:
- `"New Inquiry for [PRODUCT] from [PERSON]"`
- `"[PRODUCT] Inquiry from [PERSON]"`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/csv` | Upload single CSV |
| POST | `/api/upload/bulk` | Upload multiple CSVs |
| GET | `/api/inquiries` | List with filters & pagination |
| GET | `/api/inquiries/:id` | Get single inquiry |
| PUT | `/api/inquiries/:id` | Update inquiry |
| DELETE | `/api/inquiries/:id` | Delete inquiry |
| GET | `/api/inquiries/export/csv` | Export filtered data |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/filters` | Filter dropdown options |

## CSV Format

The app auto-detects these column names from TradeIndia exports:

| Column | Aliases Detected |
|--------|-----------------|
| Source | `Source`, `source` |
| Sender/Person | `Sender`, `Person Name`, `sender` |
| Company Name | `Company Name`, `company_name`, `Company`, `Buyer` |
| Requirement | `Requirement`, `Description`, `Message`, `Inquiry`, `Details` |
| Location | `Location`, `City`, `city` |
| Date | `Date`, `Date/Time`, `date` |
| Email | `EmailID`, `Email`, `email` |
| Contact | `Contact No`, `Contact Number`, `Phone`, `Mobile` |

## License

MIT


## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions on deploying to Render, Vercel, Netlify, Railway, and SnapDeploy for free.

### Quick Deploy (Render - Recommended)

1. Push code to GitHub
2. Create Web Service on [Render](https://render.com) with:
   - Build: `cd backend && npm install`
   - Start: `cd backend && npm start`
   - Env: `DB_PATH=/tmp/inquiries.db`
3. Create Static Site on Render with:
   - Build: `cd frontend && npm install && npm run build`
   - Publish: `frontend/build`
   - Env: `REACT_APP_API_URL=your-backend-url`

Done! Your app is live.


## Upload to GitHub

See [GITHUB_UPLOAD.md](GITHUB_UPLOAD.md) for step-by-step instructions to upload your project to GitHub without using command line.
