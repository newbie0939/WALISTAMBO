
const totalElement = document.getElementById("sumTotal");
const pendingElement = document.getElementById("sumPending");
const ongoingElement = document.getElementById("sumOngoing");
const resolvedElement = document.getElementById("sumResolved");
const recentBody = document.getElementById("recentBody");

let dashboardIncidents = [];

function escapeHTML(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(value) {
    if (!value) return "-";

    const date = new Date(String(value).replace(" ", "T"));

    if (Number.isNaN(date.getTime())) {
        return String(value);
    }

    return date.toLocaleDateString("en-PH", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
}

function statusBadge(status) {
    const normalized = String(status || "").trim().toLowerCase();

    let className = "status-default";

    if (normalized === "pending") {
        className = "status-pending";
    } else if (normalized === "ongoing") {
        className = "status-ongoing";
    } else if (normalized === "resolved") {
        className = "status-resolved";
    }

    return `<span class="status-badge ${className}">
        ${escapeHTML(status || "-")}
    </span>`;
}

async function loadDashboardIncidents() {
    if (!recentBody) return;

    try {
        // Use the incidents API configured by the main system.
        const apiUrl = window.CAPTAIN_INCIDENTS_API || "api/incidents.php";

        const response = await fetch(apiUrl, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store",
            headers: {
                "Accept": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error(`Unable to load incidents (HTTP ${response.status}).`);
        }

        const result = await response.json();

        if (!Array.isArray(result)) {
            throw new Error("The incidents API did not return a JSON array.");
        }

        dashboardIncidents = result.filter(function(incident) {
            return Number(incident.captain_archived) !== 1 &&
                   incident.captain_archived !== true;
        });

        updateDashboardSummary();
        displayRecentIncidents();

    } catch (error) {
        console.error("Dashboard loading error:", error);

        recentBody.innerHTML = `
            <tr>
                <td colspan="5" class="error-cell">
                    Unable to load incident records. Check the browser console
                    and incidents API response.
                </td>
            </tr>
        `;
    }
}

function updateDashboardSummary() {
    const total = dashboardIncidents.length;

    const pending = dashboardIncidents.filter(function(incident) {
        return String(incident.status || "").trim().toLowerCase() === "pending";
    }).length;

    const ongoing = dashboardIncidents.filter(function(incident) {
        return String(incident.status || "").trim().toLowerCase() === "ongoing";
    }).length;

    const resolved = dashboardIncidents.filter(function(incident) {
        return String(incident.status || "").trim().toLowerCase() === "resolved";
    }).length;

    if (totalElement) totalElement.textContent = total;
    if (pendingElement) pendingElement.textContent = pending;
    if (ongoingElement) ongoingElement.textContent = ongoing;
    if (resolvedElement) resolvedElement.textContent = resolved;
}

function displayRecentIncidents() {
    if (!recentBody) return;

    if (dashboardIncidents.length === 0) {
        recentBody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-cell">
                    No incident records found.
                </td>
            </tr>
        `;
        return;
    }

    // Show the five most recently added records.
    const recent = [...dashboardIncidents]
        .sort(function(a, b) {
            const dateA = new Date(a.created_at || a.date || 0).getTime();
            const dateB = new Date(b.created_at || b.date || 0).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    recentBody.innerHTML = recent.map(function(incident) {
        return `
            <tr>
                <td><strong>${escapeHTML(incident.id ?? "-")}</strong></td>
                <td>${escapeHTML(formatDate(incident.date))}</td>
                <td>${escapeHTML(incident.type || "-")}</td>
                <td>${escapeHTML(incident.complainant || "-")}</td>
                <td>${statusBadge(incident.status)}</td>
            </tr>
        `;
    }).join("");
}

loadDashboardIncidents();
