const API_URL =
    window.CAPTAIN_HISTORY_API ||
    "../api/admin_history.php";

const INCIDENTS_API_URL =
    window.CAPTAIN_INCIDENTS_API ||
    "../api/incidents.php";

const LOGOUT_API =
    window.CAPTAIN_LOGOUT_API ||
    "../api/logout.php";

const historyBody = document.getElementById("historyBody");
const historySearch = document.getElementById("historySearch");
const historyAction = document.getElementById("historyAction");
const refreshHistory = document.getElementById("refreshHistory");
const historyCount = document.getElementById("historyCount");

const historyOverlay = document.getElementById("historyOverlay");
const historyModalTitle = document.getElementById("historyModalTitle");
const historyModalBody = document.getElementById("historyModalBody");

const closeHistoryModal = document.getElementById("closeHistoryModal");
const closeHistoryModalBtn = document.getElementById("closeHistoryModalBtn");
const logoutButton = document.getElementById("logoutButton");

let historyRecords = [];
let isRestoring = false;
let isArchiving = false;
let isUnarchiving = false;

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

function parseAuditData(value) {
    if (!value) {
        return {};
    }

    if (
        typeof value === "object" &&
        !Array.isArray(value)
    ) {
        return value;
    }

    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);

            if (
                parsed &&
                typeof parsed === "object" &&
                !Array.isArray(parsed)
            ) {
                return parsed;
            }
        } catch (error) {
            return {};
        }
    }

    return {};
}


function getOperation(record) {
    const newData = parseAuditData(record.new_data);

    return String(newData.operation || "")
        .trim()
        .toUpperCase();
}

function isDeletionAuditRecord(record) {
    const operation = getOperation(record);

    const rawAction = String(record.action || "")
        .trim()
        .toUpperCase();

    const newData = parseAuditData(record.new_data);

    return (
        operation === "SECRETARY_DELETE_APPROVED" ||
        operation === "SECRETARY_SOFT_DELETE" ||
        (
            rawAction === "DELETE" &&
            Number(newData.secretary_deleted) === 1
        )
    );
}

function isRestorationAuditRecord(record) {
    return (
        getOperation(record) ===
        "SECRETARY_DELETE_RESTORED"
    );
}


function isArchiveAuditRecord(record) {
    const operation = getOperation(record);

    const rawAction = String(record.action || "")
        .trim()
        .toUpperCase();

    const newData = parseAuditData(record.new_data);

    return (
        operation === "CAPTAIN_ARCHIVE" ||
        rawAction === "ARCHIVE" ||
        (
            rawAction === "UPDATE" &&
            Number(newData.captain_archived) === 1
        )
    );
}

function isUnarchiveAuditRecord(record) {
    const operation = getOperation(record);

    const rawAction = String(record.action || "")
        .trim()
        .toUpperCase();

    return (
        operation === "CAPTAIN_UNARCHIVE" ||
        rawAction === "UNARCHIVE"
    );
}

function normalizeAction(record) {
    const rawAction = String(record.action || "")
        .trim()
        .toUpperCase();

    const operation = getOperation(record);

    if (
        rawAction === "ARCHIVE" ||
        operation === "CAPTAIN_ARCHIVE"
    ) {
        return "ARCHIVE";
    }

    if (
        rawAction === "UNARCHIVE" ||
        operation === "CAPTAIN_UNARCHIVE"
    ) {
        return "UNARCHIVE";
    }

    if (
        operation === "SECRETARY_DELETE_APPROVED" ||
        operation === "SECRETARY_SOFT_DELETE" ||
        rawAction === "DELETE"
    ) {
        return "DELETE";
    }

    if (
        ["CREATE", "UPDATE", "DELETE", "ARCHIVE", "UNARCHIVE"]
            .includes(rawAction)
    ) {
        return rawAction;
    }

    return rawAction || "UNKNOWN";
}

function getRecordTimestamp(record) {
    const value = String(record.created_at || "")
        .replace(" ", "T");

    const timestamp = new Date(value).getTime();

    return Number.isNaN(timestamp) ? 0 : timestamp;
}

function sortOldestFirst(records) {
    return [...records].sort(function (a, b) {
        const difference =
            getRecordTimestamp(a) - getRecordTimestamp(b);

        if (difference !== 0) {
            return difference;
        }

        return Number(a.id || 0) - Number(b.id || 0);
    });
}

function isLatestHistoryEntry(record) {
    const incidentId = String(record.incident_id || "");

    if (!incidentId) {
        return false;
    }

    const entries = historyRecords.filter(function (item) {
        return (
            String(item.incident_id || "") === incidentId
        );
    });

    if (entries.length === 0) {
        return false;
    }

    const sortedEntries = sortOldestFirst(entries);
    const latestEntry = sortedEntries[sortedEntries.length - 1];

    return (
        String(latestEntry.id) === String(record.id)
    );
}

function isIncidentCurrentlyArchived(incidentId) {
    const events = historyRecords.filter(function (record) {
        return (
            String(record.incident_id || "") === String(incidentId) &&
            (
                isArchiveAuditRecord(record) ||
                isUnarchiveAuditRecord(record)
            )
        );
    });

    if (events.length === 0) {
        return false;
    }

    const sortedEvents = sortOldestFirst(events);
    const latestEvent = sortedEvents[sortedEvents.length - 1];

    return isArchiveAuditRecord(latestEvent);
}



function isIncidentCurrentlyDeleted(incidentId) {
    const events = historyRecords.filter(function (record) {
        return (
            String(record.incident_id || "") === String(incidentId) &&
            (
                isDeletionAuditRecord(record) ||
                isRestorationAuditRecord(record)
            )
        );
    });

    if (events.length === 0) {
        return false;
    }

    const sortedEvents = sortOldestFirst(events);
    const latestEvent = sortedEvents[sortedEvents.length - 1];

    return isDeletionAuditRecord(latestEvent);
}

function isLatestDeletionForIncident(record) {
    if (!isDeletionAuditRecord(record)) {
        return false;
    }

    const incidentId = String(record.incident_id || "");

    if (!incidentId) {
        return false;
    }

    const events = historyRecords.filter(function (item) {
        return (
            String(item.incident_id || "") === incidentId &&
            (
                isDeletionAuditRecord(item) ||
                isRestorationAuditRecord(item)
            )
        );
    });

    const sortedEvents = sortOldestFirst(events);

    if (sortedEvents.length === 0) {
        return false;
    }

    const latestEvent = sortedEvents[sortedEvents.length - 1];

    return (
        String(latestEvent.id) === String(record.id) &&
        isDeletionAuditRecord(latestEvent)
    );
}


function isLatestArchiveStateEntry(record) {
    const incidentId = String(record.incident_id || "");

    if (!incidentId) {
        return false;
    }

    const events = historyRecords.filter(function (item) {
        return (
            String(item.incident_id || "") === incidentId &&
            (
                isArchiveAuditRecord(item) ||
                isUnarchiveAuditRecord(item)
            )
        );
    });

    const sortedEvents = sortOldestFirst(events);

    if (sortedEvents.length === 0) {
        return false;
    }

    const latestEvent = sortedEvents[sortedEvents.length - 1];

    return (
        String(latestEvent.id) === String(record.id)
    );
}

function canArchiveIncidentFromHistory(record) {
    const incidentId = String(record.incident_id || "");

    if (!incidentId) {
        return false;
    }

    return (
        isLatestHistoryEntry(record) &&
        !isIncidentCurrentlyArchived(incidentId) &&
        !isIncidentCurrentlyDeleted(incidentId)
    );
}


function canUnarchiveIncidentFromHistory(record) {
    const incidentId = String(record.incident_id || "");

    if (!incidentId) {
        return false;
    }

    return (
        isLatestArchiveStateEntry(record) &&
        isIncidentCurrentlyArchived(incidentId) &&
        !isIncidentCurrentlyDeleted(incidentId)
    );
}

function actionBadge(action) {
    const safeAction = String(action || "UNKNOWN")
        .trim()
        .toUpperCase();

    const labels = {
        CREATE: "CREATE",
        UPDATE: "UPDATE",
        DELETE: "DELETE",
        ARCHIVE: "ARCHIVE",
        UNARCHIVE: "UNARCHIVE",
        UNKNOWN: "UNKNOWN"
    };

    return `
        <span class="history-action ${escapeHTML(safeAction.toLowerCase())}">
            ${escapeHTML(labels[safeAction] || safeAction)}
        </span>
    `;
}

async function loadHistory() {
    if (!historyBody) {
        return;
    }

    historyBody.innerHTML = `
        <tr>
            <td colspan="5" class="history-loading">
                Loading history...
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

        if (data && data.success === false) {
            throw new Error(
                data.message || "Unable to load history."
            );
        }

        historyRecords =
            data && Array.isArray(data.history)
                ? data.history
                : [];

        displayHistory();

    } catch (error) {
        console.error("Failed to load history:", error);

        historyRecords = [];

        historyBody.innerHTML = `
            <tr>
                <td colspan="5" class="history-error">
                    Unable to load system history.
                </td>
            </tr>
        `;

        updateHistoryCount(0);
    }
}

function displayHistory() {
    if (!historyBody) {
        return;
    }

    historyBody.innerHTML = "";

    const search = historySearch
        ? historySearch.value.trim().toLowerCase()
        : "";

    const selectedAction = historyAction
        ? historyAction.value.trim().toUpperCase()
        : "ALL";

    let filtered = [...historyRecords];

    filtered = filtered.filter(function (record) {
        const normalizedAction = normalizeAction(record);
        const newData = parseAuditData(record.new_data);
        const oldData = parseAuditData(record.old_data);

        const searchable = [
            record.incident_id,
            normalizedAction,
            record.performed_by,
            getOperation(record),
            newData.archive_reason,
            newData.captain_archive_reason,
            newData.deleted_by_username,
            newData.archived_by_username,
            newData.request_reason,
            newData.review_reason,
            newData.description,
            oldData.description
        ]
            .filter(function (value) {
                return value !== null && value !== undefined;
            })
            .join(" ")
            .toLowerCase();

        const matchesSearch = searchable.includes(search);

        const matchesAction =
            selectedAction === "ALL" ||
            normalizedAction === selectedAction;

        return matchesSearch && matchesAction;
    });

    filtered.sort(function (a, b) {
        const difference =
            getRecordTimestamp(b) - getRecordTimestamp(a);

        if (difference !== 0) {
            return difference;
        }

        return Number(b.id || 0) - Number(a.id || 0);
    });

    updateHistoryCount(filtered.length);

    if (filtered.length === 0) {
        historyBody.innerHTML = `
            <tr>
                <td colspan="5" class="history-empty">
                    No history records found.
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(function (record) {
        const row = document.createElement("tr");
        const action = normalizeAction(record);

        const canRestore =
            isLatestDeletionForIncident(record);

        const canArchive =
            canArchiveIncidentFromHistory(record);

        const canUnarchive =
            canUnarchiveIncidentFromHistory(record);

        row.innerHTML = `
            <td>
                <strong>
                    ${escapeHTML(record.incident_id || "-")}
                </strong>
            </td>

            <td>
                ${actionBadge(action)}
            </td>

            <td>
                ${escapeHTML(record.performed_by || "-")}
            </td>

            <td>
                ${formatDateTime(record.created_at)}
            </td>

            <td>
                <div class="history-row-actions">

                    <button
                        type="button"
                        class="history-details-btn"
                        data-id="${escapeHTML(record.id)}"
                    >
                        View
                    </button>

                    ${
                        canRestore
                            ? `
                                <button
                                    type="button"
                                    class="history-details-btn history-restore-btn"
                                    data-incident-id="${escapeHTML(record.incident_id)}"
                                >
                                    Restore
                                </button>
                            `
                            : ""
                    }

                    ${
                        canArchive
                            ? `
                                <button
                                    type="button"
                                    class="history-details-btn history-archive-btn"
                                    data-incident-id="${escapeHTML(record.incident_id)}"
                                >
                                    Archive
                                </button>
                            `
                            : ""
                    }

                    ${
                        canUnarchive
                            ? `
                                <button
                                    type="button"
                                    class="history-details-btn history-unarchive-btn"
                                    data-incident-id="${escapeHTML(record.incident_id)}"
                                >
                                    Unarchive
                                </button>
                            `
                            : ""
                    }

                </div>
            </td>
        `;

        historyBody.appendChild(row);
    });


    historyBody
        .querySelectorAll(".history-details-btn[data-id]")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                viewHistoryDetails(this.dataset.id);
            });
        });


    historyBody
        .querySelectorAll(".history-restore-btn")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                restoreIncidentFromHistory(
                    this.dataset.incidentId,
                    this
                );
            });
        });


    historyBody
        .querySelectorAll(".history-archive-btn")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                archiveIncidentFromHistory(
                    this.dataset.incidentId,
                    this
                );
            });
        });

    historyBody
        .querySelectorAll(".history-unarchive-btn")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                unarchiveIncidentFromHistory(
                    this.dataset.incidentId,
                    this
                );
            });
        });
}

async function restoreIncidentFromHistory(incidentId, button) {
    if (isRestoring) {
        return;
    }

    const id = String(incidentId || "").trim();

    if (!id) {
        window.alert("Incident ID is missing.");
        return;
    }

    const deletionRecord = historyRecords.find(function (record) {
        return (
            String(record.incident_id || "") === id &&
            isLatestDeletionForIncident(record)
        );
    });

    if (!deletionRecord) {
        window.alert(
            "This incident is no longer awaiting restoration. " +
            "Refresh History and try again."
        );

        await loadHistory();
        return;
    }

    const confirmed = window.confirm(
        "Restore incident " + id + "?\n\n" +
        "The incident will return to the Secretary's active records."
    );

    if (!confirmed) {
        return;
    }

    isRestoring = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Restoring...";
    }

    try {
        const response = await fetch(INCIDENTS_API_URL, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "restore_secretary_deleted",
                id: id
            })
        });

        const result = await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to restore incident."
            );
        }

        window.alert(
            result.message || "Incident restored successfully."
        );

        closeModal();
        await loadHistory();

    } catch (error) {
        console.error("Restore incident error:", error);

        window.alert(
            error.message ||
            "Unable to restore this incident. Please try again."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Restore";
        }
    } finally {
        isRestoring = false;
    }
}

async function archiveIncidentFromHistory(incidentId, button) {
    if (isArchiving) {
        return;
    }

    const id = String(incidentId || "").trim();

    if (!id) {
        window.alert("Incident ID is missing.");
        return;
    }

    if (
        isIncidentCurrentlyArchived(id) ||
        isIncidentCurrentlyDeleted(id)
    ) {
        window.alert(
            "This incident is already archived or deleted. " +
            "Refresh History and try again."
        );

        await loadHistory();
        return;
    }

    const reasonInput = window.prompt(
        "Enter the reason for archiving incident " + id +
        ". This reason will be saved in the audit history:"
    );

    if (reasonInput === null) {
        return;
    }

    const reason = reasonInput.trim();

    if (!reason) {
        window.alert("An archive reason is required.");
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
        "The record will be hidden from active records. " +
        "The action and reason will remain in History."
    );

    if (!confirmed) {
        return;
    }

    isArchiving = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Archiving...";
    }

    try {
        const response = await fetch(INCIDENTS_API_URL, {
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

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to archive incident."
            );
        }

        window.alert(
            result.message || "Incident archived successfully."
        );

        closeModal();
        await loadHistory();

    } catch (error) {
        console.error("History archive error:", error);

        window.alert(
            error.message ||
            "Unable to archive this incident. Please try again."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Archive";
        }
    } finally {
        isArchiving = false;
    }
}


async function unarchiveIncidentFromHistory(incidentId, button) {
    if (isUnarchiving) {
        return;
    }

    const id = String(incidentId || "").trim();

    if (!id) {
        window.alert("Incident ID is missing.");
        return;
    }

    if (
        !isIncidentCurrentlyArchived(id) ||
        isIncidentCurrentlyDeleted(id)
    ) {
        window.alert(
            "This incident is not currently eligible for unarchiving. " +
            "Refresh History and try again."
        );

        await loadHistory();
        return;
    }

    const confirmed = window.confirm(
        "Unarchive incident " + id + "?\n\n" +
        "The incident will be returned to active records. " +
        "The unarchive action will be recorded in History."
    );

    if (!confirmed) {
        return;
    }

    isUnarchiving = true;

    if (button) {
        button.disabled = true;
        button.textContent = "Unarchiving...";
    }

    try {
        const response = await fetch(INCIDENTS_API_URL, {
            method: "DELETE",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                action: "unarchive",
                id: id
            })
        });

        const result = await response.json();

        if (
            response.status === 401 ||
            response.status === 403
        ) {
            window.location.href = "../login.html";
            return;
        }

        if (!response.ok || !result.success) {
            throw new Error(
                result.message || "Unable to unarchive incident."
            );
        }

        window.alert(
            result.message || "Incident unarchived successfully."
        );

        closeModal();
        await loadHistory();

    } catch (error) {
        console.error("History unarchive error:", error);

        window.alert(
            error.message ||
            "Unable to unarchive this incident. Please try again."
        );

        if (button) {
            button.disabled = false;
            button.textContent = "Unarchive";
        }
    } finally {
        isUnarchiving = false;
    }
}

function updateHistoryCount(count) {
    if (!historyCount) {
        return;
    }

    historyCount.textContent =
        count === 1
            ? "1 record"
            : `${count} records`;
}

function formatDateTime(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(
        String(value).replace(" ", "T")
    );

    if (Number.isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return escapeHTML(
        date.toLocaleString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
        })
    );
}

function getFieldLabel(key) {
    const normalized = String(key || "")
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase();

    const labels = {
        id: "Incident ID",
        incident_id: "Incident ID",
        date: "Incident Date",
        incident_date: "Incident Date",
        time: "Incident Time",
        incident_time: "Incident Time",
        type: "Incident Type",
        incident_type: "Incident Type",
        location: "Location",
        complainant: "Complainant",
        respondent: "Respondent",
        description: "Description",
        status: "Incident Status",
        recorded_by: "Recorded By",
        recordedby: "Recorded By",
        created_at: "Record Created At",
        createdat: "Record Created At",
        secretary_deleted: "Removed from Secretary's Active Records",
        captain_archived: "Archive Status",
        captain_archive_reason: "Archive Reason",
        captain_archived_by: "Archived By",
        captain_archived_at: "Archived At",
        archive_reason: "Archive Reason",
        archived_by_username: "Archived By",
        deleted_by_username: "Removed By",
        request_reason: "Deletion Request Reason",
        review_reason: "Captain's Review Reason",
        requested_by_username: "Requested By",
        approved_by_username: "Approved By",
        action_by_username: "Action Performed By",
        restored_by_username: "Restored By",
        request_id: "Request ID",
        request_status: "Request Status",
        request_type: "Request Type",
        requesttype: "Request Type",
        operation: "Operation",
        reason: "Reason"
    };

    return labels[normalized] ||
        normalized
            .split("_")
            .map(function (word) {
                if (!word) {
                    return "";
                }

                return word.charAt(0).toUpperCase() +
                    word.slice(1);
            })
            .join(" ");
}

function formatAuditValue(value) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return "-";
    }

    if (typeof value === "boolean") {
        return value ? "Yes" : "No";
    }

    if (typeof value === "object") {
        return JSON.stringify(value, null, 2);
    }

    return String(value);
}


function formatJSONData(value) {
    const parsed = parseAuditData(value);
    const entries = Object.entries(parsed);

    if (entries.length === 0) {
        return "No details recorded.";
    }

    const hiddenFields = [
        "operation",
        "archive_reason",
        "archived_by_username",
        "deleted_by_username",
        "requesttype",
        "requested_by_username",
        "requestedbyusername"
    ];

    const visibleEntries = entries.filter(function ([key]) {
        const normalized = String(key)
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .toLowerCase();

        return !hiddenFields.includes(normalized);
    });

    if (visibleEntries.length === 0) {
        return "No additional details recorded.";
    }

    return visibleEntries
        .map(function ([key, value]) {
            return (
                escapeHTML(getFieldLabel(key)) +
                ": " +
                escapeHTML(formatAuditValue(value))
            );
        })
        .join("\n");
}

function formatComparisonFields(value) {
    const data = parseAuditData(value);

    const hiddenFields = [
        "operation",
        "archived_by_username",
        "deleted_by_username",
        "requested_by_username",
        "requestedbyusername"
    ];

    const entries = Object.entries(data).filter(function ([key]) {
        const normalized = String(key)
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .toLowerCase();

        return !hiddenFields.includes(normalized);
    });

    if (entries.length === 0) {
        return `
            <p class="history-comparison-empty">
                No details recorded.
            </p>
        `;
    }

    return `
        <div class="history-comparison-fields">
            ${entries.map(function ([key, value]) {
                return `
                    <div class="history-comparison-row">
                        <strong>
                            ${escapeHTML(getFieldLabel(key))}:
                        </strong>
                        <span>
                            ${escapeHTML(formatAuditValue(value))}
                        </span>
                    </div>
                `;
            }).join("")}
        </div>
    `;
}

function formatComparisonCard(title, data) {
    return `
        <section class="history-comparison-card">
            <div class="history-comparison-card-header">
                ${escapeHTML(title)}
            </div>

            <div class="history-comparison-card-body">
                ${formatComparisonFields(data)}
            </div>
        </section>
    `;
}

function formatComparisonCard(title, data) {
    return `
        <section class="history-comparison-card">
            <div class="history-comparison-card-header">
                ${escapeHTML(title)}
            </div>

            <div class="history-comparison-card-body">
                ${formatComparisonFields(data)}
            </div>
        </section>
    `;
}


function getArchiveReason(record) {
    const newData = parseAuditData(record.new_data);
    const oldData = parseAuditData(record.old_data);

    return (
        newData.archive_reason ||
        newData.captain_archive_reason ||
        oldData.archive_reason ||
        oldData.captain_archive_reason ||
        record.archive_reason ||
        ""
    );
}

function getActionActor(record, action) {
    const newData = parseAuditData(record.new_data);

    if (
        action === "ARCHIVE" &&
        (
            newData.archived_by_username ||
            newData.captain_archived_by
        )
    ) {
        return (
            newData.archived_by_username ||
            newData.captain_archived_by
        );
    }

    if (
        action === "DELETE" &&
        newData.deleted_by_username
    ) {
        return newData.deleted_by_username;
    }

    if (
        newData.action_by_username ||
        newData.approved_by_username ||
        newData.restored_by_username
    ) {
        return (
            newData.action_by_username ||
            newData.approved_by_username ||
            newData.restored_by_username
        );
    }

    return record.performed_by || "Unknown user";
}

function getHistorySummary(record, action) {
    const incidentId = record.incident_id || "this incident";
    const actor = getActionActor(record, action);
    const reason = getArchiveReason(record);
    const operation = getOperation(record);
    const newData = parseAuditData(record.new_data);

    if (operation === "SECRETARY_DELETE_REQUEST") {
        return `
            <p>
                <strong>${escapeHTML(actor)}</strong>
                requested deletion of incident
                <strong>${escapeHTML(incidentId)}</strong>.
                The request is waiting for Captain review.
            </p>

            <div class="history-data-block">
                <strong>Deletion Request Reason</strong>
                <pre>${escapeHTML(
                    newData.request_reason ||
                    newData.reason ||
                    "No deletion reason was recorded."
                )}</pre>
            </div>
        `;
    }

    switch (action) {
        case "CREATE":
            return `
                <p>
                    <strong>${escapeHTML(actor)}</strong>
                    created incident record
                    <strong>${escapeHTML(incidentId)}</strong>.
                    The new record was added to the system.
                </p>
            `;

        case "UPDATE":
            if (isRestorationAuditRecord(record)) {
                return `
                    <p>
                        <strong>${escapeHTML(actor)}</strong>
                        restored incident
                        <strong>${escapeHTML(incidentId)}</strong>
                        to the Secretary's active records.
                        This restoration was recorded in the audit history.
                    </p>
                `;
            }

            return `
                <p>
                    <strong>${escapeHTML(actor)}</strong>
                    updated incident record
                    <strong>${escapeHTML(incidentId)}</strong>.
                    Review the previous and updated details below
                    to understand what changed.
                </p>
            `;

        case "DELETE":
            return `
                <p>
                    <strong>${escapeHTML(actor)}</strong>
                    approved or performed removal of incident
                    <strong>${escapeHTML(incidentId)}</strong>
                    from the Secretary's active records.
                    The original record remains stored for audit purposes.
                </p>

                <div class="history-data-block">
                    <strong>Deletion Request Reason</strong>
                    <pre>${escapeHTML(
                        newData.request_reason ||
                        newData.reason ||
                        "No deletion reason was recorded."
                    )}</pre>
                </div>

                ${
                    newData.review_reason
                        ? `
                            <div class="history-data-block">
                                <strong>Captain's Review Reason</strong>
                                <pre>${escapeHTML(newData.review_reason)}</pre>
                            </div>
                        `
                        : ""
                }
            `;

        case "ARCHIVE":
            return `
                <p>
                    <strong>${escapeHTML(actor)}</strong>
                    archived incident record
                    <strong>${escapeHTML(incidentId)}</strong>.
                    The incident remains stored for accountability
                    and future reference.
                </p>

                <div class="history-data-block">
                    <strong>Reason for Archiving</strong>
                    <pre>${escapeHTML(
                        String(reason || "No archive reason was recorded.")
                    )}</pre>
                </div>
            `;

        case "UNARCHIVE":
            return `
                <p>
                    <strong>${escapeHTML(actor)}</strong>
                    unarchived incident
                    <strong>${escapeHTML(incidentId)}</strong>.
                    The incident was returned to active records.
                </p>
            `;

        default:
            return `
                <p>
                    An action was recorded for incident
                    <strong>${escapeHTML(incidentId)}</strong>.
                </p>
            `;
    }
}


function viewHistoryDetails(id) {
    const record = historyRecords.find(function (item) {
        return String(item.id) === String(id);
    });

    if (
        !record ||
        !historyModalTitle ||
        !historyModalBody ||
        !historyOverlay
    ) {
        return;
    }

    const action = normalizeAction(record);
    const oldData = parseAuditData(record.old_data);
    const newData = parseAuditData(record.new_data);
    const actor = getActionActor(record, action);
    const operation = getOperation(record);

    let title = "Activity";

    if (action === "CREATE") {
        title = "Incident Created";
    } else if (action === "DELETE") {
        title = "Incident Removed";
    } else if (action === "ARCHIVE") {
        title = "Incident Archived";
    } else if (action === "UNARCHIVE") {
        title = "Incident Unarchived";
    } else if (isRestorationAuditRecord(record)) {
        title = "Incident Restored";
    } else if (operation === "SECRETARY_DELETE_REQUEST") {
        title = "Deletion Requested";
    } else if (action === "UPDATE") {
        title = "Incident Updated";
    }

    historyModalTitle.textContent =
        `${title} - ${record.incident_id || "Unknown Incident"}`;

    const previousDataHTML = formatJSONData(oldData);
    const newDataHTML = formatJSONData(newData);
    const summaryHTML = getHistorySummary(record, action);

    let dataSectionsHTML = "";

    if (action === "CREATE") {
        dataSectionsHTML = `
            <div class="history-data-block">
                <strong>Incident Details Recorded</strong>
                <pre>${newDataHTML}</pre>
            </div>
        `;
    } else if (action === "UPDATE") {
        dataSectionsHTML = `
            <div class="history-data-block">
                <strong>Previous Incident Details</strong>
                <pre>${previousDataHTML}</pre>
            </div>

            <div class="history-data-block">
                <strong>${
                    isRestorationAuditRecord(record)
                        ? "Restoration Record"
                        : "Updated Incident Details"
                }</strong>
                <pre>${newDataHTML}</pre>
            </div>
        `;
    } else if (action === "DELETE") {
        dataSectionsHTML = `
            <div class="history-data-block">
                <strong>Incident Details Before Removal</strong>
                <pre>${previousDataHTML}</pre>
            </div>

            <div class="history-data-block">
                <strong>Removal Details</strong>
                <pre>${newDataHTML}</pre>
            </div>
        `;
    } else if (action === "ARCHIVE") {
        dataSectionsHTML = `
            <div class="history-data-block">
                <strong>Original Incident Details</strong>
                <pre>${previousDataHTML}</pre>
            </div>

            <div class="history-data-block">
                <strong>Archive Record</strong>
                <pre>${newDataHTML}</pre>
            </div>
        `;
    } else if (action === "UNARCHIVE") {
        dataSectionsHTML = `
            <div class="history-data-block">
                <strong>Previous Incident Details</strong>
                <pre>${previousDataHTML}</pre>
            </div>

            <div class="history-data-block">
                <strong>Unarchive Record</strong>
                <pre>${newDataHTML}</pre>
            </div>
        `;
    }

    const canRestore =
        isLatestDeletionForIncident(record);

    const canArchive =
        canArchiveIncidentFromHistory(record);

    const canUnarchive =
        canUnarchiveIncidentFromHistory(record);

    historyModalBody.innerHTML = `
        <div class="history-detail-row">
            <strong>Incident ID</strong>
            <span>${escapeHTML(record.incident_id || "-")}</span>
        </div>

        <div class="history-detail-row">
            <strong>Action</strong>
            <span>${actionBadge(action)}</span>
        </div>

        <div class="history-detail-row">
            <strong>Performed By</strong>
            <span>${escapeHTML(actor)}</span>
        </div>

        <div class="history-detail-row">
            <strong>Date &amp; Time</strong>
            <span>${formatDateTime(record.created_at)}</span>
        </div>

        <div class="history-data-block">
            <strong>Activity Summary</strong>
            <div class="history-summary">
                ${summaryHTML}
            </div>
        </div>

        ${dataSectionsHTML}

        ${
            canRestore
                ? `
                    <div class="history-data-block">
                        <strong>Restore Incident</strong>
                        <p>
                            Restore this incident to the Secretary's
                            active records. The restoration will be
                            recorded in History.
                        </p>

                        <button
                            type="button"
                            class="history-details-btn history-restore-btn"
                            data-incident-id="${escapeHTML(record.incident_id)}"
                        >
                            Restore Incident
                        </button>
                    </div>
                `
                : ""
        }

        ${
            canArchive
                ? `
                    <div class="history-data-block">
                        <strong>Archive Incident</strong>
                        <p>
                            Archive this incident. You will be asked
                            to provide a reason that will be saved
                            in the audit history.
                        </p>

                        <button
                            type="button"
                            class="history-details-btn history-archive-btn"
                            data-incident-id="${escapeHTML(record.incident_id)}"
                        >
                            Archive Incident
                        </button>
                    </div>
                `
                : ""
        }

        ${
            canUnarchive
                ? `
                    <div class="history-data-block">
                        <strong>Unarchive Incident</strong>
                        <p>
                            Return this archived incident to active
                            records. The action will be recorded
                            in the audit history.
                        </p>

                        <button
                            type="button"
                            class="history-details-btn history-unarchive-btn"
                            data-incident-id="${escapeHTML(record.incident_id)}"
                        >
                            Unarchive Incident
                        </button>
                    </div>
                `
                : ""
        }
    `;

    const modalRestoreButton =
        historyModalBody.querySelector(".history-restore-btn");

    if (modalRestoreButton) {
        modalRestoreButton.addEventListener("click", function () {
            restoreIncidentFromHistory(
                this.dataset.incidentId,
                this
            );
        });
    }


    const modalArchiveButton =
        historyModalBody.querySelector(".history-archive-btn");

    if (modalArchiveButton) {
        modalArchiveButton.addEventListener("click", function () {
            archiveIncidentFromHistory(
                this.dataset.incidentId,
                this
            );
        });
    }


    const modalUnarchiveButton =
        historyModalBody.querySelector(".history-unarchive-btn");

    if (modalUnarchiveButton) {
        modalUnarchiveButton.addEventListener("click", function () {
            unarchiveIncidentFromHistory(
                this.dataset.incidentId,
                this
            );
        });
    }

    historyModalBody.scrollTop = 0;
    historyOverlay.classList.add("show");
}

function closeModal() {
    if (historyOverlay) {
        historyOverlay.classList.remove("show");
    }
}

if (closeHistoryModal) {
    closeHistoryModal.addEventListener("click", closeModal);
}

if (closeHistoryModalBtn) {
    closeHistoryModalBtn.addEventListener("click", closeModal);
}

if (historyOverlay) {
    historyOverlay.addEventListener("click", function (event) {
        if (event.target === historyOverlay) {
            closeModal();
        }
    });
}


if (historySearch) {
    historySearch.addEventListener("input", displayHistory);
}


if (historyAction) {
    historyAction.addEventListener("change", displayHistory);
}


if (refreshHistory) {
    refreshHistory.addEventListener("click", loadHistory);
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

loadHistory();