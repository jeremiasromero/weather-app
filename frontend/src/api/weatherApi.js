import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
    baseURL: API_BASE,
    headers: { "Content-Type": "application/json" },
});

/**
 * POST /weather/search — full search flow
 */
export async function searchWeather(query, dateStart = null, dateEnd = null) {
    const body = { query };
    if (dateStart) body.date_start = dateStart;
    if (dateEnd) body.date_end = dateEnd;
    const { data } = await api.post("/weather/search", body);
    return data;
}

/**
 * GET /weather/queries — paginated list
 */
export async function getQueries(page = 1, perPage = 20) {
    const { data } = await api.get("/weather/queries", { params: { page, per_page: perPage } });
    return data;
}

/**
 * PUT /weather/queries/:id
 */
export async function updateQuery(id, payload) {
    const { data } = await api.put(`/weather/queries/${id}`, payload);
    return data;
}

/**
 * DELETE /weather/queries/:id
 */
export async function deleteQuery(id) {
    const { data } = await api.delete(`/weather/queries/${id}`);
    return data;
}

/**
 * GET /weather/queries/export/pdf — download all as PDF
 */
export async function exportAllPdf() {
    const response = await api.get("/weather/queries/export/pdf", { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "weather_queries.pdf");
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

/**
 * GET /weather/queries/:id/export/pdf — download single as PDF
 */
export async function exportSinglePdf(id) {
    const response = await api.get(`/weather/queries/${id}/export/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `weather_query_${id}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

export default api;
