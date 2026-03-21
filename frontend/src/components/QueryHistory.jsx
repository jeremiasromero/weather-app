import { useState } from "react";
import { exportSinglePdf } from "../api/weatherApi";

export default function QueryHistory({ queries, onDelete, onEdit, onView }) {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm("Delete this query?")) return;
        setDeletingId(id);
        try {
            await onDelete(id);
        } finally {
            setDeletingId(null);
        }
    };

    if (!queries || queries.length === 0) {
        return (
            <div className="query-history card" id="query-history">
                <h2>📜 Query History</h2>
                <p className="empty-state">No queries yet. Search for a location to get started!</p>
            </div>
        );
    }

    return (
        <div className="query-history card" id="query-history">
            <h2>📜 Query History</h2>
            <div className="history-table-wrapper">
                <table className="history-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Location</th>
                            <th>Resolved</th>
                            <th>Temp (°C)</th>
                            <th>Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {queries.map((q) => (
                            <tr key={q.id}>
                                <td>{q.id}</td>
                                <td>{q.location_query}</td>
                                <td>{q.resolved_name?.split(",").slice(0, 2).join(",") || "—"}</td>
                                <td>
                                    {q.current_weather?.temperature != null
                                        ? `${q.current_weather.temperature}°`
                                        : "—"}
                                </td>
                                <td>
                                    {q.created_at
                                        ? new Date(q.created_at).toLocaleDateString()
                                        : "—"}
                                </td>
                                <td className="actions-cell">
                                    <button
                                        className="btn-action btn-view"
                                        onClick={() => onView(q)}
                                        title="View details"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={() => onEdit(q)}
                                        title="Edit"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        className="btn-action btn-pdf"
                                        onClick={() => exportSinglePdf(q.id)}
                                        title="Export as PDF"
                                    >
                                        📄
                                    </button>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={() => handleDelete(q.id)}
                                        disabled={deletingId === q.id}
                                        title="Delete"
                                    >
                                        {deletingId === q.id ? "⏳" : "🗑️"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
