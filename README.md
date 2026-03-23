# Weather App — PM Accelerator Technical Assessment

A full-stack weather application that lets users search for real-time weather data by location, view 5-day forecasts, explore interactive maps and charts, and manage query history with full CRUD operations and PDF export.

## Applicant Information

**Built by:** Jeremias Romero

**About PM Accelerator:** The Product Manager Accelerator program is designed to support PM professionals through every stage of their career. From students looking for entry-level jobs to Directors looking to take on a VP role, our program has helped hundreds of students fulfill their career aspirations. Our game-changing product portfolio, community, and integrated AI platform are accelerating PM careers worldwide.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 8, Recharts, React-Leaflet (OpenStreetMap) |
| **Backend** | FastAPI (Python), SQLAlchemy 2.0, Pydantic |
| **Database** | PostgreSQL 16 |
| **External APIs** | Open-Meteo (weather), Nominatim (geocoding), Wikipedia (location info) |
| **Infrastructure** | Docker, Docker Compose, Nginx |

---

## Features

- **Location Search** — Free-form text input supporting cities, zip codes, landmarks, GPS coordinates, and more via Nominatim geocoding
- **Current Location** — Browser geolocation with reverse geocoding to auto-fill the search bar
- **Current Weather** — Temperature, feels-like, humidity, precipitation, wind speed, and weather condition
- **5-Day Forecast** — Visual card grid with daily high/low, precipitation probability, and weather icons
- **Date Range Queries** — Historical (up to 2 months back) and future (up to 10 days ahead) weather data
- **Interactive Charts** — Hourly temperature, humidity, and precipitation plotted with Recharts
- **Interactive Map** — Leaflet map centered on the searched location with a marker
- **Wikipedia Info** — Automatic summary and link for the searched location
- **CRUD Operations** — Create, read, update, and delete weather queries stored in PostgreSQL
- **PDF Export** — Export individual or all weather queries as formatted PDF reports
- **Error Handling** — Graceful messages for invalid locations, API failures, and validation errors
- **Responsive Design** — Adapts to desktop, tablet, and mobile with CSS Grid, Flexbox, and media queries

---

## Quick Start (Docker)

The easiest way to run the entire stack (frontend + backend + database) is with Docker Compose:

```bash
docker-compose up --build
```

Once all services are healthy, open **http://localhost:3000** in your browser.

To stop and remove containers:

```bash
docker-compose down
```

To also remove the database volume (wipes all data):

```bash
docker-compose down -v
```

---

## Manual Setup

### Prerequisites

- Python 3.12+
- Node.js 20+
- PostgreSQL 16+ (running locally)

### Backend

```bash
cd backend

# Create and configure your environment file
cp .env.example .env
# Edit .env and set your DATABASE_URL with the correct password

# Install dependencies
pip install -r requirements.txt

# Start the server
python -m uvicorn app.main:app --reload
```

The API will be available at **http://localhost:8000**. Interactive docs at **http://localhost:8000/docs**.

### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**. The Vite dev server proxies `/api` requests to the backend automatically.

---

## Project Structure

```
PMAccelerator/
├── docker-compose.yml
├── README.md
├── .gitignore
│
├── backend/
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── requirements.txt
│   ├── migrate.py
│   └── app/
│       ├── main.py              # FastAPI app entrypoint
│       ├── config.py            # Pydantic settings
│       ├── database.py          # SQLAlchemy engine and session
│       ├── models.py            # ORM models
│       ├── schemas.py           # Request/response schemas
│       ├── routers/
│       │   ├── health.py        # GET /api/health
│       │   └── weather.py       # All weather CRUD + export endpoints
│       ├── services/
│       │   ├── geocoding.py     # Nominatim geocoding
│       │   ├── weather.py       # Open-Meteo weather data
│       │   ├── wikipedia.py     # Wikipedia summaries
│       │   └── export.py        # PDF generation (ReportLab)
│       └── utils/
│           └── validators.py    # Date range validation
│
└── frontend/
    ├── Dockerfile
    ├── .dockerignore
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx              # Main app layout and state
        ├── App.css              # Full design system
        ├── main.jsx             # React entry point
        ├── api/
        │   └── weatherApi.js    # Axios API client
        ├── components/
        │   ├── SearchBar.jsx
        │   ├── CurrentWeather.jsx
        │   ├── FiveDayForecast.jsx
        │   ├── WeatherChart.jsx
        │   ├── WeatherMap.jsx
        │   ├── WikiInfo.jsx
        │   ├── QueryHistory.jsx
        │   ├── QueryEditModal.jsx
        │   ├── ExportButton.jsx
        │   ├── LoadingSpinner.jsx
        │   └── ErrorMessage.jsx
        └── utils/
            └── weatherIcons.js  # WMO code → emoji mapping
```

---

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/weather/search` | Search weather by location (and optional date range) |
| `GET` | `/weather/queries` | List all saved queries (paginated) |
| `GET` | `/weather/queries/{id}` | Get a single query by ID |
| `PUT` | `/weather/queries/{id}` | Update a query (re-geocodes and re-fetches if location changes) |
| `DELETE` | `/weather/queries/{id}` | Delete a query |
| `GET` | `/weather/queries/export/pdf` | Export all queries as PDF |
| `GET` | `/weather/queries/{id}/export/pdf` | Export a single query as PDF |

---

## Environment Variables

Configure these in `backend/.env` (see `backend/.env.example`):

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `CORS_ORIGINS` | No | `http://localhost:5173,http://localhost:3000` | Comma-separated allowed origins |
| `NOMINATIM_BASE_URL` | No | `https://nominatim.openstreetmap.org` | Nominatim geocoding API |
| `OPEN_METEO_BASE_URL` | No | `https://api.open-meteo.com/v1` | Open-Meteo weather API |
| `WIKIPEDIA_BASE_URL` | No | `https://en.wikipedia.org/api/rest_v1` | Wikipedia REST API |

The frontend optionally accepts `VITE_API_URL` to override the backend URL (defaults to `/api` which is proxied by Vite in development or Nginx in Docker).

---

## Tech Assessment Questionnaire

### Does your final submission adapt seamlessly to various screen sizes and devices (desktops, tablets, smartphones)?

Yes, the application is fully responsive. It provides a rich dashboard experience on full desktop displays, degrades elegantly into a vertical stack on tablet screens (`max-width: 900px`), and further optimizes component padding, font sizes, and scrollable horizontal rows for mobile devices (`max-width: 640px`).

### What responsive design techniques were used?

- **CSS Grid and Flexbox** — Utilized extensively to create proportional (`1fr`), wrapping layout structures.
- **Media Queries** — Custom breakpoints at `900px` and `640px` to adjust layout and spacing.
- **Fluid Sizing** — Using `rem` for typography and `%` / `fr` for container widths.
- **Overflow Management** — `overflow-x: auto` on data-heavy rows (e.g., the horizontal 5-day forecast) for native horizontal swiping on mobile.
- **Dynamic CSS Properties** — `minmax()`, `auto-fit`, and `calc()` to ensure UI blocks scale dynamically.

### Are you able to manage a few APIs?

Yes, this application orchestrates three distinct external APIs:

1. **Nominatim (OpenStreetMap)** — Geocoding free-form text input into coordinates, plus reverse geocoding for browser geolocation.
2. **Open-Meteo** — Hourly forecasts and historical data, with structured transformation into chart and card data.
3. **Wikipedia API** — Content extraction and summary generation with fallback logic to find the best matching article for a location.
