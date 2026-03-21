export default function LoadingSpinner() {
    return (
        <div className="loading-spinner" id="loading-spinner">
            <div className="spinner"></div>
            <p>Fetching weather data...</p>
        </div>
    );
}
