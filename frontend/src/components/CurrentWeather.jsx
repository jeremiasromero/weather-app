import { getWeatherIcon } from "../utils/weatherIcons";

export default function CurrentWeather({ data }) {
    if (!data) return null;

    const {
        temperature,
        apparent_temperature,
        humidity,
        precipitation,
        weather_code,
        weather_description,
    } = data;
    const icon = getWeatherIcon(weather_code);

    return (
        <div className="current-weather card" id="current-weather">
            <h2>Current Weather</h2>
            <div className="weather-main">
                <span className="weather-icon-large">{icon}</span>
                <div className="weather-temp">
                    <span className="temp-value">{temperature ?? "--"}°C</span>
                    <span className="temp-desc">{weather_description || "N/A"}</span>
                </div>
            </div>
            <div className="weather-details">
                <div className="detail-item">
                    <span className="detail-icon">🌡️</span>
                    <span className="detail-label">Feels Like</span>
                    <span className="detail-value">{apparent_temperature ?? "--"}°C</span>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">💧</span>
                    <span className="detail-label">Humidity</span>
                    <span className="detail-value">{humidity ?? "--"}%</span>
                </div>
                <div className="detail-item">
                    <span className="detail-icon">🌧️</span>
                    <span className="detail-label">Precipitation</span>
                    <span className="detail-value">{precipitation ?? "0"} mm</span>
                </div>
            </div>
        </div>
    );
}
