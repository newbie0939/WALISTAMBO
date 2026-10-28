const totalIncidents =
    document.getElementById("totalIncidents");

const pendingIncidents =
    document.getElementById("pendingIncidents");

const ongoingIncidents =
    document.getElementById("ongoingIncidents");

const resolvedIncidents =
    document.getElementById("resolvedIncidents");

const pendingEditRequests =
    document.getElementById("pendingEditRequests");

const recentIncidentsBody =
    document.getElementById("recentIncidentsBody");

const logoutButton =
    document.getElementById("logoutButton");

let incidents = [];


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {
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

    if (!value) {
        return "-";
    }

    const date = new Date(
        String(value).replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "numeric"
        }
    );
}


function statusBadge(status) {

    const normalized =
        String(status || "")
            .trim()
            .toLowerCase();

    let className = "status-default";

    if (normalized === "pending") {
        className = "status-pending";
    } else if (
        normalized === "ongoing" ||
        normalized === "preparing"
    ) {
        className = "status-ongoing";
    } else if (
        normalized === "resolved" ||
        normalized === "completed"
    ) {
        className = "status-resolved";
    }

    return `
        <span class="status-badge ${className}">
            ${escapeHTML(status || "-")}
        </span>
    `;
}



async function loadIncidents() {

    try {

        const response = await fetch(
            window.CAPTAIN_INCIDENTS_API,
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (response.status === 401) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load incidents.");
        }

        const result = await response.json();

        incidents = Array.isArray(result)
            ? result.filter(function(incident) {
                return Number(incident.captain_archived) !== 1 &&
                       incident.captain_archived !== true;
            })
            : [];

        updateSummary();
        displayRecentIncidents();

    } catch (error) {

        console.error(
            "Incident loading error:",
            error
        );

        recentIncidentsBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-cell">
                    Unable to load incident records.
                </td>
            </tr>
        `;
    }
}

function updateSummary() {

    const total = incidents.length;

    const pending = incidents.filter(function(incident) {
        return String(incident.status || "").toLowerCase() === "pending";
    }).length;

    const ongoing = incidents.filter(function(incident) {
        return String(incident.status || "").toLowerCase() === "ongoing";
    }).length;

    const resolved = incidents.filter(function(incident) {
        return String(incident.status || "").toLowerCase() === "resolved";
    }).length;

    totalIncidents.textContent = total;
    pendingIncidents.textContent = pending;
    ongoingIncidents.textContent = ongoing;
    resolvedIncidents.textContent = resolved;
}


function displayRecentIncidents() {

    if (incidents.length === 0) {

        recentIncidentsBody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-cell">
                    No incident records found.
                </td>
            </tr>
        `;

        return;
    }

    const recent = incidents.slice(0, 5);

    recentIncidentsBody.innerHTML = recent.map(function(incident) {

        return `
            <tr>
                <td>
                    <strong>${escapeHTML(incident.id || "-")}</strong>
                </td>

                <td>${escapeHTML(formatDate(incident.date))}</td>
                <td>${escapeHTML(incident.type || "-")}</td>
                <td>${escapeHTML(incident.complainant || "-")}</td>
                <td>${escapeHTML(incident.location || "-")}</td>
                <td>${statusBadge(incident.status)}</td>
            </tr>
        `;

    }).join("");
}


async function loadPendingEditRequests() {

    try {

        const response = await fetch(
            window.CAPTAIN_EDIT_REQUESTS_API,
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (response.status === 401) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Failed to load edit requests.");
        }

        const result = await response.json();

        const requests = Array.isArray(result.requests)
            ? result.requests
            : [];

        const pending = requests.filter(function(request) {
            return request.status === "Pending";
        }).length;

        pendingEditRequests.textContent = pending;

    } catch (error) {

        console.error(
            "Edit request loading error:",
            error
        );

        pendingEditRequests.textContent = "0";
    }
}


logoutButton.addEventListener("click", async function() {

    try {

        await fetch(
            "../api/logout.php",
            {
                method: "POST",
                credentials: "same-origin"
            }
        );

    } catch (error) {

        console.error("Logout error:", error);
    }

    window.location.href = "../login.html";
});


loadIncidents();
loadPendingEditRequests();
