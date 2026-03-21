export default function ErrorMessage({ message, onDismiss }) {
    if (!message) return null;

    return (
        <div className="error-message" id="error-message">
            <div className="error-content">
                <span className="error-icon">⚠️</span>
                <p>{message}</p>
                {onDismiss && (
                    <button className="error-dismiss" onClick={onDismiss} aria-label="Dismiss">
                        ✕
                    </button>
                )}
            </div>
        </div>
    );
}
