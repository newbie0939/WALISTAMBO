const API_URL =
    window.CAPTAIN_INCIDENTS_API ||
    "../api/incidents.php";

const LOGOUT_API =
    window.CAPTAIN_LOGOUT_API ||
    "../api/logout.php";

const totalIncidents =
    document.getElementById("totalIncidents");

const pendingIncidents =
    document.getElementById("pendingIncidents");

const ongoingIncidents =
    document.getElementById("ongoingIncidents");

const resolvedIncidents =
    document.getElementById("resolvedIncidents");

const statusPending =
    document.getElementById("statusPending");

const statusOngoing =
    document.getElementById("statusOngoing");

const statusResolved =
    document.getElementById("statusResolved");

const incidentTypes =
    document.getElementById("incidentTypes");

const recentReportsBody =
    document.getElementById("recentReportsBody");

const refreshReports =
    document.getElementById("refreshReports");

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



function statusBadge(status) {

    const safeStatus =
        String(status || "").trim();

    const className =
        safeStatus
            .toLowerCase()
            .replace(/\s+/g, "-");

    return `
        <span class="report-status ${escapeHTML(className || "default")}">
            ${escapeHTML(safeStatus || "Unknown")}
        </span>
    `;
}



async function loadReports() {

    recentReportsBody.innerHTML = `
        <tr>
            <td colspan="5" class="report-loading">
                Loading reports...
            </td>
        </tr>
    `;

    try {

        const response = await fetch(
            API_URL,
            {
                method: "GET",
                credentials: "same-origin",
                cache: "no-store"
            }
        );

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok) {
            throw new Error(
                "Server error: " + response.status
            );
        }

        const data = await response.json();

        incidents = Array.isArray(data)
            ? data.filter(function(incident) {
                return Number(incident.captain_archived) !== 1 &&
                       incident.captain_archived !== true;
            })
            : [];

        generateReports();

    } catch (error) {

        console.error(
            "Failed to load reports:",
            error
        );

        incidents = [];

        recentReportsBody.innerHTML = `
            <tr>
                <td colspan="5" class="report-loading">
                    Unable to load reports.
                </td>
            </tr>
        `;
    }
}

function generateReports() {

    totalIncidents.textContent = incidents.length;

    let pending = 0;
    let ongoing = 0;
    let resolved = 0;

    incidents.forEach(function(incident) {

        const status =
            String(incident.status || "")
                .trim()
                .toLowerCase();

        if (status === "pending") {
            pending++;
        } else if (status === "ongoing") {
            ongoing++;
        } else if (status === "resolved") {
            resolved++;
        }
    });

    pendingIncidents.textContent = pending;
    ongoingIncidents.textContent = ongoing;
    resolvedIncidents.textContent = resolved;

    statusPending.textContent = pending;
    statusOngoing.textContent = ongoing;
    statusResolved.textContent = resolved;

    generateIncidentTypes();
    generateRecentIncidents();
}

function generateIncidentTypes() {

    const typeCounts = {};

    incidents.forEach(function(incident) {

        const type =
            String(incident.type || "Unspecified").trim();

        if (!typeCounts[type]) {
            typeCounts[type] = 0;
        }

        typeCounts[type]++;
    });

    const types = Object.entries(typeCounts)
        .sort(function(a, b) {
            return b[1] - a[1];
        });

    incidentTypes.innerHTML = "";

    if (types.length === 0) {

        incidentTypes.innerHTML = `
            <div class="report-empty">
                No incident records available.
            </div>
        `;

        return;
    }

    types.forEach(function(item) {

        const type = item[0];
        const count = item[1];

        const row = document.createElement("div");

        row.className = "report-item";

        row.innerHTML = `
            <div class="report-item-label">
                <span class="report-dot ongoing-dot"></span>
                ${escapeHTML(type)}
            </div>

            <strong>${count}</strong>
        `;

        incidentTypes.appendChild(row);
    });
}


function generateRecentIncidents() {

    recentReportsBody.innerHTML = "";

    const sorted = [...incidents].sort(function(a, b) {

        const dateA =
            new Date(a.createdAt || 0).getTime();

        const dateB =
            new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
    });

    const recent = sorted.slice(0, 10);

    if (recent.length === 0) {

        recentReportsBody.innerHTML = `
            <tr>
                <td colspan="5" class="report-loading">
                    No incident records available.
                </td>
            </tr>
        `;

        return;
    }

    recent.forEach(function(incident) {

        const row = document.createElement("tr");

        row.innerHTML = `
            <td><strong>${escapeHTML(incident.id)}</strong></td>
            <td>${escapeHTML(incident.date)}</td>
            <td>${escapeHTML(incident.type)}</td>
            <td>${escapeHTML(incident.complainant)}</td>
            <td>${statusBadge(incident.status)}</td>
        `;

        recentReportsBody.appendChild(row);
    });
}


refreshReports.addEventListener("click", function() {
    loadReports();
});


logoutButton.addEventListener("click", async function() {

    try {

        await fetch(
            LOGOUT_API,
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



loadReports();