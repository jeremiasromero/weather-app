import { useState } from "react";

/**
 * SearchBar with two modes:
 *   A) Quick Forecast — location only, no dates (7-day forecast from today)
 *   B) Date Range — location + start/end date (historical or future)
 */
export default function SearchBar({ onSearch, isLoading }) {
    const [mode, setMode] = useState("forecast"); // "forecast" | "daterange"
    const [query, setQuery] = useState("");
    const [dateStart, setDateStart] = useState("");
    const [dateEnd, setDateEnd] = useState("");

    // Calculate global min/max dates
    const today = new Date();

    const minDateObj = new Date(today);
    minDateObj.setDate(today.getDate() - 61); // ~2 months past
    const globalMinDate = minDateObj.toISOString().split("T")[0];

    const maxDateObj = new Date(today);
    maxDateObj.setDate(today.getDate() + 10); // 10 days future
    const globalMaxDate = maxDateObj.toISOString().split("T")[0];

    // Calculate dynamic max for End Date based on 30-day span
    let endMaxDate = globalMaxDate;
    if (dateStart) {
        const startObj = new Date(dateStart);
        const spanMax = new Date(startObj);
        spanMax.setDate(startObj.getDate() + 30);
        // End date can't be more than 30 days from start, NOR beyond the global max
        endMaxDate = spanMax < maxDateObj ? spanMax.toISOString().split("T")[0] : globalMaxDate;
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;

        if (mode === "forecast") {
            // Mode A — no dates
            onSearch(trimmed, null, null);
        } else {
            // Mode B — with date range
            if (!dateStart || !dateEnd) {
                alert("Please select both a start and end date.");
                return;
            }
            onSearch(trimmed, dateStart, dateEnd);
        }
    };

    return (
        <form className="search-bar" onSubmit={handleSubmit} id="search-form">
            {/* Mode Toggle */}
            <div className="query-type-toggle">
                <button
                    type="button"
                    className={`toggle-btn ${mode === "forecast" ? "active" : ""}`}
                    onClick={() => setMode("forecast")}
                    id="btn-mode-forecast"
                >
                    ⚡ Quick Forecast
                </button>
                <button
                    type="button"
                    className={`toggle-btn ${mode === "daterange" ? "active" : ""}`}
                    onClick={() => setMode("daterange")}
                    id="btn-mode-daterange"
                >
                    📅 Date Range
                </button>
            </div>

            {/* Mode description */}
            <p className="mode-hint">
                {mode === "forecast"
                    ? "Get the current weather and 5-day forecast from today."
                    : "Select a date range (up to 2 months past, 10 days future, max 30 days)."}
            </p>

            {/* Location input */}
            <div className="input-row" style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    placeholder="Enter a location (e.g. Hong Kong, China)..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="input-main"
                    style={{ flex: 1 }}
                    id="input-free-query"
                    autoFocus
                />
                <button
                    type="button"
                    className="btn-location"
                    onClick={() => {
                        if ("geolocation" in navigator) {
                            navigator.geolocation.getCurrentPosition((pos) => {
                                const lat = pos.coords.latitude;
                                const lon = pos.coords.longitude;

                                fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`)
                                    .then(r => r.json())
                                    .then(data => {
                                        if (data && data.address) {
                                            const city = data.address.city || data.address.town || data.address.state || data.address.region;
                                            const country = data.address.country;
                                            if (city && country) {
                                                setQuery(`${city}, ${country}`);
                                            } else if (data.display_name) {
                                                setQuery(data.display_name.split(',').slice(0, 2).join(',').trim());
                                            } else {
                                                setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                                            }
                                        } else {
                                            setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
                                        }
                                    })
                                    .catch(() => setQuery(`${lat.toFixed(4)}, ${lon.toFixed(4)}`));
                            }, () => {
                                alert("Could not retrieve your location. Please ensure location services are enabled.");
                            });
                        } else {
                            alert("Geolocation is not supported by your browser.");
                        }
                    }}
                    title="Use Current Location"
                >
                    📍
                </button>
            </div>

            {/* Date Range — only in Mode B */}
            {mode === "daterange" && (
                <div className="date-range">
                    <label>
                        <span>Start Date</span>
                        <input
                            type="date"
                            value={dateStart}
                            min={globalMinDate}
                            max={globalMaxDate}
                            onChange={(e) => {
                                const newStart = e.target.value;
                                setDateStart(newStart);
                                // Reset end date if it violates the new 30-day span or is before start
                                if (dateEnd && newStart) {
                                    const s = new Date(newStart);
                                    const eDate = new Date(dateEnd);
                                    const diff = (eDate - s) / (1000 * 60 * 60 * 24);
                                    if (diff < 0 || diff > 30) setDateEnd("");
                                }
                            }}
                            id="input-date-start"
                            required
                        />
                    </label>
                    <label>
                        <span>End Date</span>
                        <input
                            type="date"
                            value={dateEnd}
                            min={dateStart || globalMinDate}
                            max={endMaxDate}
                            onChange={(e) => setDateEnd(e.target.value)}
                            id="input-date-end"
                            disabled={!dateStart}
                            required
                        />
                    </label>
                </div>
            )}

            <button
                type="submit"
                className="btn-search"
                disabled={isLoading}
                id="btn-search"
            >
                {isLoading
                    ? "Searching..."
                    : mode === "forecast"
                        ? "🔍 Get Weather"
                        : "📊 Get Historical / Future Data"}
            </button>
        </form>
    );
}
