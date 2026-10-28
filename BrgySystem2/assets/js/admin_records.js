const API_URL =
    window.CAPTAIN_INCIDENTS_API ||
    "../api/incidents.php";

const LOGOUT_API =
    window.CAPTAIN_LOGOUT_API ||
    "../api/logout.php";


const recordsBody = document.getElementById("recordsBody");
const filterSearch = document.getElementById("filterSearch");
const filterStatus = document.getElementById("filterStatus");
const showArchivedRecords = document.getElementById("showArchivedRecords");
const refreshButton = document.getElementById("refreshButton");
const recordCount = document.getElementById("recordCount");
const viewOverlay = document.getElementById("viewOverlay");
const viewTitle = document.getElementById("viewTitle");
const viewBody = document.getElementById("viewBody");
const closeView = document.getElementById("closeView");
const closeViewBtn = document.getElementById("closeViewBtn");
const logoutButton = document.getElementById("logoutButton");

let incidents = [];

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


function isFlagEnabled(value) {
    return Number(value) === 1 || value === true;
}


function statusBadge(status) {
    const safeStatus = String(status || "").trim();

    const className = safeStatus
        .toLowerCase()
        .replace(/\s+/g, "-");

    return `
        <span class="record-status ${escapeHTML(className || "default")}">
            ${escapeHTML(safeStatus || "Unknown")}
        </span>
    `;
}

async function loadIncidents() {
    if (!recordsBody) {
        return;
    }

    recordsBody.innerHTML = `
        <tr>
            <td colspan="7" class="loading-cell">
                Loading incident records...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(API_URL, {
            method: "GET",
            credentials: "same-origin",
            cache: "no-store"
        });

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error(
                data.message ||
                "Invalid incident response from server."
            );
        }

        incidents = data;
        displayRecords();

    } catch (error) {
        console.error("Failed to load incidents:", error);

        incidents = [];

        recordsBody.innerHTML = `
            <tr>
                <td colspan="7" class="error-cell">
                    Unable to load incident records.
                </td>
            </tr>
        `;

        updateRecordCount(0);
    }
}

function displayRecords() {
    if (!recordsBody) {
        return;
    }

    recordsBody.innerHTML = "";

    const search = filterSearch
        ? filterSearch.value.trim().toLowerCase()
        : "";

    const status = filterStatus
        ? filterStatus.value
        : "All";

    const shouldShowArchived = Boolean(
        showArchivedRecords &&
        showArchivedRecords.checked
    );

    let filtered = incidents.filter(function (incident) {
        const isArchived = isFlagEnabled(
            incident.captain_archived
        );

        const isSecretaryDeleted = isFlagEnabled(
            incident.secretary_deleted
        );

        if (isSecretaryDeleted) {
            return false;
        }

        return shouldShowArchived || !isArchived;
    });

    filtered = filtered.filter(function (incident) {
        const searchable = [
            incident.id,
            incident.type,
            incident.complainant,
            incident.respondent,
            incident.location,
            incident.description
        ]
            .map(function (value) {
                return value || "";
            })
            .join(" ")
            .toLowerCase();

        const matchesSearch = searchable.includes(search);

        const matchesStatus =
            status === "All" ||
            incident.status === status;

        return matchesSearch && matchesStatus;
    });

    filtered.sort(function (a, b) {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();

        return dateB - dateA;
    });

    updateRecordCount(filtered.length);

    if (filtered.length === 0) {
        recordsBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-cell">
                    No incident records found.
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(function (incident) {
        const row = document.createElement("tr");

        const isArchived = isFlagEnabled(
            incident.captain_archived
        );

        if (isArchived) {
            row.classList.add("archived-record-row");
        }

        let actionsHTML = "";

        if (isArchived) {
            actionsHTML = `
                <span class="record-status archived">
                    Archived
                </span>
            `;
        } else {
            actionsHTML = `
                <button
                    type="button"
                    class="archive-record-btn"
                    data-id="${escapeHTML(incident.id)}"
                >
                    Archive
                </button>
            `;
        }

        row.innerHTML = `
            <td>
                <strong>${escapeHTML(incident.id)}</strong>
            </td>

            <td>
                ${escapeHTML(incident.date)}
            </td>

            <td>
                ${escapeHTML(incident.type)}
            </td>

            <td>
                ${escapeHTML(incident.complainant)}
            </td>

            <td>
                ${escapeHTML(incident.location)}
            </td>

            <td>
                ${statusBadge(incident.status)}
            </td>

            <td>
                <div class="record-actions">

                    <button
                        type="button"
                        class="view-record-btn"
                        data-id="${escapeHTML(incident.id)}"
                    >
                        View
                    </button>

                    ${actionsHTML}

                </div>
            </td>
        `;

        recordsBody.appendChild(row);
    });

    recordsBody
        .querySelectorAll(".view-record-btn")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                viewIncident(this.dataset.id);
            });
        });

    recordsBody
        .querySelectorAll(".archive-record-btn")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                archiveIncident(this.dataset.id, this);
            });
        });
}


function updateRecordCount(count) {
    if (!recordCount) {
        return;
    }

    recordCount.textContent =
        count === 1
            ? "1 record"
            : `${count} records`;
}


function viewIncident(id) {
    const incident = incidents.find(function (item) {
        return String(item.id) === String(id);
    });

    if (
        !incident ||
        !viewTitle ||
        !viewBody ||
        !viewOverlay
    ) {
        return;
    }

    const description =
        incident.description ??
        incident.incident_description ??
        incident.incidentDescription ??
        incident.details ??
        incident.incident_details ??
        "";

    const descriptionText =
        String(description).trim() ||
        "No description provided.";

    viewTitle.textContent = "Incident " + incident.id;

    viewBody.innerHTML = `
        <div class="record-description">
            <strong>Description</strong>
            <p>${escapeHTML(descriptionText)}</p>
        </div>

        <div class="record-detail-row">
            <strong>Incident ID</strong>
            <span>${escapeHTML(incident.id)}</span>
        </div>

        <div class="record-detail-row">
            <strong>Date</strong>
            <span>${escapeHTML(incident.date || incident.incident_date || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Time</strong>
            <span>${escapeHTML(incident.time || incident.incident_time || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Incident Type</strong>
            <span>${escapeHTML(incident.type || incident.incident_type || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Location</strong>
            <span>${escapeHTML(incident.location || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Complainant</strong>
            <span>${escapeHTML(incident.complainant || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Respondent</strong>
            <span>${escapeHTML(incident.respondent || "-")}</span>
        </div>

        <div class="record-detail-row">
            <strong>Status</strong>
            <span>${statusBadge(incident.status)}</span>
        </div>

        <div class="record-detail-row">
            <strong>Recorded By</strong>
            <span>${escapeHTML(incident.recordedBy || incident.recorded_by || "-")}</span>
        </div>

        ${
            isFlagEnabled(incident.captain_archived)
                ? `
                    <div class="record-detail-row">
                        <strong>Record Status</strong>
                        <span>
                            <span class="record-status archived">
                                Archived
                            </span>
                        </span>
                    </div>

                    <div class="record-detail-row">
                        <strong>Archive Reason</strong>
                        <span>${escapeHTML(incident.captain_archive_reason || "No reason recorded.")}</span>
                    </div>

                    <div class="record-detail-row">
                        <strong>Archived By</strong>
                        <span>${escapeHTML(incident.captain_archived_by || "-")}</span>
                    </div>

                    <div class="record-detail-row">
                        <strong>Archived At</strong>
                        <span>${escapeHTML(incident.captain_archived_at || "-")}</span>
                    </div>
                `
                : ""
        }
    `;

    viewOverlay.classList.add("show");
}



async function archiveIncident(id, button) {
    const incident = incidents.find(function (item) {
        return String(item.id) === String(id);
    });

    if (!incident) {
        window.alert(
            "Incident record not found. Refresh and try again."
        );

        return;
    }

    const reasonInput = window.prompt(
        "Enter the reason for archiving incident " +
        id +
        ". This reason will be saved in the audit history:"
    );

    if (reasonInput === null) {
        return;
    }

    const reason = reasonInput.trim();

    if (!reason) {
        window.alert(
            "A reason is required to archive an incident."
        );

        return;
    }

    if (reason.length > 1000) {
        window.alert(
            "The archive reason must be 1,000 characters or fewer."
        );

        return;
    }

    const confirmed = window.confirm(
        "Archive incident " + id + "?\n\n" +
        "It will be hidden from active records but will remain stored with its audit history."
    );

    if (!confirmed) {
        return;
    }

    if (button) {
        button.disabled = true;
        button.textContent = "Archiving...";
    }

    try {
        const response = await fetch(API_URL, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "archive",
                id: id,
                reason: reason
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                "Unable to archive incident."
            );
        }

        window.alert(
            result.message ||
            "Incident archived successfully."
        );

        if (showArchivedRecords) {
            showArchivedRecords.checked = false;
        }

        await loadIncidents();

    } catch (error) {
        console.error("Incident archive error:", error);

        window.alert(
            error.message ||
            "Unable to archive incident. Please try again."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Archive";
        }
    }
}

function closeModal() {
    if (viewOverlay) {
        viewOverlay.classList.remove("show");
    }
}

if (closeView) {
    closeView.addEventListener("click", closeModal);
}

if (closeViewBtn) {
    closeViewBtn.addEventListener("click", closeModal);
}

if (viewOverlay) {
    viewOverlay.addEventListener("click", function (event) {
        if (event.target === viewOverlay) {
            closeModal();
        }
    });
}



if (filterSearch) {
    filterSearch.addEventListener("input", displayRecords);
}

if (filterStatus) {
    filterStatus.addEventListener("change", displayRecords);
}

if (showArchivedRecords) {
    showArchivedRecords.addEventListener(
        "change",
        displayRecords
    );
}

if (refreshButton) {
    refreshButton.addEventListener("click", function () {
        loadIncidents();
    });
}


if (logoutButton) {
    logoutButton.addEventListener("click", async function () {
        try {
            await fetch(LOGOUT_API, {
                method: "POST",
                credentials: "same-origin"
            });
        } catch (error) {
            console.error("Logout error:", error);
        }

        window.location.href = "../login.html";
    });
}


loadIncidents();
