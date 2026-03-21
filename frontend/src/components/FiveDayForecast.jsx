import { getWeatherIcon } from "../utils/weatherIcons";

export default function FiveDayForecast({ forecast }) {
    if (!forecast || forecast.length === 0) return null;

    return (
        <div className="forecast card" id="five-day-forecast">
            <h2>{forecast.length === 5 ? "5-Day Forecast" : `${forecast.length}-Day Forecast`}</h2>
            <div className="forecast-grid">
                {forecast.map((day) => {
                    const dateObj = new Date(day.date + "T00:00:00");
                    const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                    const dateStr = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                    const icon = getWeatherIcon(day.weather_code);

                    return (
                        <div className="forecast-card" key={day.date}>
                            <div className="forecast-day">{dayName}</div>
                            <div className="forecast-date">{dateStr}</div>
                            <div className="forecast-icon">{icon}</div>
                            <div className="forecast-temps">
                                <span className="temp-high">{day.temp_max ?? "--"}°</span>
                                <span className="temp-low">{day.temp_min ?? "--"}°</span>
                            </div>
                            {day.precipitation_probability != null && (
                                <div className="forecast-precip">
                                    🌧️ {day.precipitation_probability}%
                                </div>
                            )}
                            {day.precipitation_sum != null && day.precipitation_sum > 0 && (
                                <div className="forecast-precip-sum">
                                    {day.precipitation_sum} mm
                                </div>
                            )}
                            <div className="forecast-desc">{day.weather_description || ""}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
