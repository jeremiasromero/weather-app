import { useState } from "react";

export default function QueryEditModal({ query, onSave, onClose }) {
    const [locationQuery, setLocationQuery] = useState(query.location_query || "");
    const [dateStart, setDateStart] = useState(query.date_start || "");
    const [dateEnd, setDateEnd] = useState(query.date_end || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        if (!locationQuery.trim()) {
            setError("Location cannot be empty");
            return;
        }
        setSaving(true);
        setError("");
        try {
            const payload = { location_query: locationQuery.trim() };
            if (dateStart) payload.date_start = dateStart;
            if (dateEnd) payload.date_end = dateEnd;
            await onSave(query.id, payload);
            onClose();
        } catch (err) {
            setError(err.response?.data?.detail || "Failed to update query");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} id="edit-modal">
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>Edit Query #{query.id}</h2>
                {error && <div className="modal-error">{error}</div>}

                <label>
                    <span>Location</span>
                    <input
                        type="text"
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                    />
                </label>

                <label>
                    <span>Start Date</span>
                    <input
                        type="date"
                        value={dateStart}
                        onChange={(e) => setDateStart(e.target.value)}
                    />
                </label>

                <label>
                    <span>End Date</span>
                    <input
                        type="date"
                        value={dateEnd}
                        onChange={(e) => setDateEnd(e.target.value)}
                    />
                </label>

                <div className="modal-actions">
                    <button className="btn-cancel" onClick={onClose} disabled={saving}>
                        Cancel
                    </button>
                    <button className="btn-save" onClick={handleSave} disabled={saving}>
                        {saving ? "Saving..." : "Save & Re-fetch"}
                    </button>
                </div>
            </div>
        </div>
    );
}
