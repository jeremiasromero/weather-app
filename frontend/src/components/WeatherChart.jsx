import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";

/**
 * Custom tooltip that shows all active weather variables at the hovered hour.
 */
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    // Build a readable date/time from the label
    const dt = new Date(label);
    const dateStr = dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    });
    const timeStr = dt.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="chart-tooltip">
            <p className="tooltip-time">
                {dateStr} — {timeStr}
            </p>
            {payload.map((entry) => (
                <p key={entry.dataKey} style={{ color: entry.color }}>
                    <span className="tooltip-label">{entry.name}:</span>{" "}
                    <strong>{entry.value != null ? entry.value : "—"}</strong>
                    {entry.dataKey === "temperature" && " °C"}
                    {entry.dataKey === "apparent_temperature" && " °C"}
                    {entry.dataKey === "humidity" && " %"}
                    {entry.dataKey === "precipitation_probability" && " %"}
                    {entry.dataKey === "precipitation" && " mm"}
                </p>
            ))}
        </div>
    );
}

/**
 * Interactive unified hourly weather chart using Recharts.
 * Allows toggling variables on and off.
 */
export default function WeatherChart({ hourlyData }) {
    // Toggle states
    const [showTemp, setShowTemp] = useState(true);
    const [showApparent, setShowApparent] = useState(false);
    const [showHumid, setShowHumid] = useState(true);
    const [showPrecipProb, setShowPrecipProb] = useState(false);
    const [showPrecip, setShowPrecip] = useState(true);

    if (!hourlyData || hourlyData.length === 0) return null;

    // Format time labels for the X axis
    const data = hourlyData.map((h) => ({
        ...h,
        label: h.time, // keep ISO string for tooltip parsing
    }));

    // Show tick every 24 hours to avoid label crowding
    const tickFormatter = (val) => {
        const dt = new Date(val);
        return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    };

    return (
        <div className="weather-chart card" id="weather-chart">
            <h2>📊 Interactive Weather Data</h2>

            {/* Toggles */}
            <div className="chart-toggles">
                <button
                    className={`chart-toggle ${showTemp ? "active" : ""}`}
                    onClick={() => setShowTemp(!showTemp)}
                    style={{ "--toggle-color": "#ff7b54" }}
                >
                    <span className="indicator"></span> Temperature
                </button>
                <button
                    className={`chart-toggle ${showApparent ? "active" : ""}`}
                    onClick={() => setShowApparent(!showApparent)}
                    style={{ "--toggle-color": "#ffd56b" }}
                >
                    <span className="indicator"></span> Feels Like
                </button>
                <button
                    className={`chart-toggle ${showHumid ? "active" : ""}`}
                    onClick={() => setShowHumid(!showHumid)}
                    style={{ "--toggle-color": "#54b4ff" }}
                >
                    <span className="indicator"></span> Humidity
                </button>
                <button
                    className={`chart-toggle ${showPrecipProb ? "active" : ""}`}
                    onClick={() => setShowPrecipProb(!showPrecipProb)}
                    style={{ "--toggle-color": "#7c5cfc" }}
                >
                    <span className="indicator"></span> Precip. Probability
                </button>
                <button
                    className={`chart-toggle ${showPrecip ? "active" : ""}`}
                    onClick={() => setShowPrecip(!showPrecip)}
                    style={{ "--toggle-color": "#34d399" }}
                >
                    <span className="indicator"></span> Precipitation (mm)
                </button>
            </div>

            <div className="chart-section" style={{ marginTop: "20px" }}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a4a" />
                        <XAxis
                            dataKey="label"
                            tickFormatter={tickFormatter}
                            stroke="#6a6a8a"
                            fontSize={11}
                            interval={23}
                        />
                        {/* Left Y-Axis for Temperature */}
                        <YAxis
                            yAxisId="left"
                            stroke="#6a6a8a"
                            fontSize={11}
                            tickFormatter={(v) => `${v}°`}
                        />
                        {/* Right Y-Axis for %, mm */}
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#6a6a8a"
                            fontSize={11}
                            domain={[0, 100]}
                        />

                        <Tooltip content={<CustomTooltip />} />

                        {showTemp && (
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="temperature"
                                name="Temperature"
                                stroke="#ff7b54"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: "#ff7b54" }}
                            />
                        )}
                        {showApparent && (
                            <Line
                                yAxisId="left"
                                type="monotone"
                                dataKey="apparent_temperature"
                                name="Feels Like"
                                stroke="#ffd56b"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: "#ffd56b" }}
                                strokeDasharray="5 3"
                            />
                        )}
                        {showHumid && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="humidity"
                                name="Humidity"
                                stroke="#54b4ff"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: "#54b4ff" }}
                            />
                        )}
                        {showPrecipProb && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="precipitation_probability"
                                name="Precip. Prob. (%)"
                                stroke="#7c5cfc"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: "#7c5cfc" }}
                            />
                        )}
                        {showPrecip && (
                            <Line
                                yAxisId="right"
                                type="monotone"
                                dataKey="precipitation"
                                name="Precip. (mm)"
                                stroke="#34d399"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: "#34d399" }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
