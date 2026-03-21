import { useState, useEffect, useCallback } from "react";
import SearchBar from "./components/SearchBar";
import CurrentWeather from "./components/CurrentWeather";
import FiveDayForecast from "./components/FiveDayForecast";
import WeatherChart from "./components/WeatherChart";
import WeatherMap from "./components/WeatherMap";
import WikiInfo from "./components/WikiInfo";
import QueryHistory from "./components/QueryHistory";
import QueryEditModal from "./components/QueryEditModal";
import ExportButton from "./components/ExportButton";
import ErrorMessage from "./components/ErrorMessage";
import LoadingSpinner from "./components/LoadingSpinner";
import {
  searchWeather,
  getQueries,
  updateQuery,
  deleteQuery,
  exportAllPdf,
} from "./api/weatherApi";
import "./App.css";

function App() {
  // Current search result
  const [result, setResult] = useState(null);
  // Query history
  const [history, setHistory] = useState([]);
  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingQuery, setEditingQuery] = useState(null);

  // Load history on mount
  const loadHistory = useCallback(async () => {
    try {
      const data = await getQueries(1, 50);
      setHistory(data.queries);
    } catch {
      // Silently fail — backend might not be connected yet
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // ── Search ──────────────────────────────────────────
  const handleSearch = async (query, dateStart, dateEnd) => {
    setLoading(true);
    setError(null);
    try {
      const data = await searchWeather(query, dateStart, dateEnd);
      setResult(data);
      loadHistory(); // Refresh history
    } catch (err) {
      const detail =
        err.response?.data?.detail || "Failed to fetch weather data. Please try again.";
      setError(detail);
    } finally {
      setLoading(false);
    }
  };

  // ── CRUD handlers ───────────────────────────────────
  const handleDelete = async (id) => {
    try {
      await deleteQuery(id);
      setHistory((prev) => prev.filter((q) => q.id !== id));
      if (result?.id === id) setResult(null);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to delete query");
    }
  };

  const handleUpdate = async (id, payload) => {
    const updated = await updateQuery(id, payload);
    setHistory((prev) => prev.map((q) => (q.id === id ? updated : q)));
    if (result?.id === id) setResult(updated);
  };

  const handleView = (query) => {
    setResult(query);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExportAll = async () => {
    try {
      await exportAllPdf();
    } catch (err) {
      setError("Failed to export PDF");
    }
  };

  return (
    <div className="app" id="weather-app">
      {/* ── Header ───────────────────────────────────── */}
      <header className="app-header">
        <div className="header-content">
          <h1>🌤️ Weather App</h1>
          <p className="header-subtitle">PM Accelerator — Technical Assessment</p>
          <p className="header-author">
            Built by <strong>Jeremias Romero</strong> •{" "}
            <a
              href="https://www.linkedin.com/company/product-manager-accelerator/"
              target="_blank"
              rel="noopener noreferrer"
            >
              About PM Accelerator
            </a>
          </p>
        </div>
      </header>

      <main className="app-main">
        {/* ── PM Accelerator Info ─────────────────────── */}
        <section className="pm-info card" id="pm-accelerator-info">
          <h2>About PM Accelerator</h2>
          <p>
            The Product Manager Accelerator Program is designed to support PM
            professionals through every stage of their career. From students
            looking for entry-level jobs to Directors looking to take on a VP
            role, our program has helped over hundreds of students fulfill their
            career aspirations. Our game-changing product portfolio, community, and
            integrated AI platform are accelerating PM careers worldwide.
          </p>
        </section>

        {/* ── Search ─────────────────────────────────── */}
        <section className="search-section">
          <SearchBar onSearch={handleSearch} isLoading={loading} />
        </section>

        {/* ── Error / Loading ────────────────────────── */}
        <ErrorMessage message={error} onDismiss={() => setError(null)} />
        {loading && <LoadingSpinner />}

        {/* ── Results ────────────────────────────────── */}
        {result && !loading && (
          <section className="results-section">
            <div className="results-header">
              <h2 className="location-title">
                📍 {result.resolved_name || result.location_query}
              </h2>
              {result.country && (
                <span className="country-badge">{result.country}</span>
              )}
            </div>

            {!result.date_start && (
              <div className="forecast-layout">
                <CurrentWeather data={result.current_weather} />
                <FiveDayForecast forecast={result.forecast.slice(0, 5)} />
              </div>
            )}

            <div className="results-chart">
              <WeatherChart hourlyData={!result.date_start ? result.hourly.slice(0, 120) : result.hourly} />
            </div>

            <div className="results-extras">
              <WeatherMap
                lat={result.latitude}
                lon={result.longitude}
                locationName={result.resolved_name}
              />
              <WikiInfo data={result.wikipedia} />
            </div>
          </section>
        )}

        {/* ── History & Export ────────────────────────── */}
        <section className="history-section">
          <div className="history-header">
            <ExportButton onExportAll={handleExportAll} />
          </div>
          <QueryHistory
            queries={history}
            onDelete={handleDelete}
            onEdit={(q) => setEditingQuery(q)}
            onView={handleView}
          />
        </section>
      </main>

      {/* ── Edit Modal ───────────────────────────────── */}
      {editingQuery && (
        <QueryEditModal
          query={editingQuery}
          onSave={handleUpdate}
          onClose={() => setEditingQuery(null)}
        />
      )}

      {/* ── Footer ───────────────────────────────────── */}
      <footer className="app-footer">
        <p>
          Weather App © 2026 • PM Accelerator Technical Assessment •
          Powered by{" "}
          <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
            Open-Meteo
          </a>
          ,{" "}
          <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noopener noreferrer">
            Nominatim
          </a>
          ,{" "}
          <a href="https://www.wikipedia.org/" target="_blank" rel="noopener noreferrer">
            Wikipedia
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
