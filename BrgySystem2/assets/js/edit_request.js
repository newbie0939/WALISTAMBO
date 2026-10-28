
const requestStatusBody = document.getElementById("requestStatusBody");
const requestStatusMessage = document.getElementById("requestStatusMessage");
const refreshRequestsBtn = document.getElementById("refreshRequestsBtn");
const requestSearchInput = document.getElementById("requestSearchInput");
const requestStatusFilter = document.getElementById("requestStatusFilter");

let editRequests = [];

function escapeRequestHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderRequestStatuses() {
    const searchText = requestSearchInput.value.trim().toLowerCase();
    const selectedStatus = requestStatusFilter.value;

    const filteredRequests = editRequests.filter(request => {
        const matchesSearch =
            String(request.incident_id ?? "").toLowerCase().includes(searchText) ||
            String(request.reason ?? "").toLowerCase().includes(searchText) ||
            String(request.request_id ?? "").toLowerCase().includes(searchText);

        const matchesStatus =
            selectedStatus === "All" ||
            String(request.status ?? "").toLowerCase() === selectedStatus.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    if (filteredRequests.length === 0) {
        requestStatusBody.innerHTML =
            '<tr><td colspan="6">No matching requests found.</td></tr>';
        return;
    }

    requestStatusBody.innerHTML = filteredRequests.map(request => {
        const status = String(request.status || "Unknown");
        const statusClass = ["pending", "approved", "rejected"].includes(
            status.toLowerCase()
        ) ? status.toLowerCase() : "unknown";

        const captainResponse = request.review_reason ||
            (status.toLowerCase() === "pending"
                ? "Waiting for the Barangay Captain."
                : "No response provided.");

        return `
            <tr>
                <td>${escapeRequestHTML(request.request_id)}</td>
                <td>${escapeRequestHTML(request.incident_id)}</td>
                <td>${escapeRequestHTML(request.reason)}</td>
                <td>
                    <span class="request-status ${statusClass}">
                        ${escapeRequestHTML(status)}
                    </span>
                </td>
                <td>${escapeRequestHTML(captainResponse)}</td>
                <td>${escapeRequestHTML(request.reviewed_at || "Not reviewed")}</td>
            </tr>
        `;
    }).join("");
}

async function loadRequestStatuses() {
    requestStatusMessage.textContent = "Loading requests...";
    refreshRequestsBtn.disabled = true;

    try {
        const response = await fetch("api/secretary_edit_requests.php", {
            credentials: "same-origin",
            cache: "no-store"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Unable to load requests.");
        }

        editRequests = result.requests || [];
        renderRequestStatuses();

        requestStatusMessage.textContent =
            `${editRequests.length} request(s) found.`;

    } catch (error) {
        console.error("Request status error:", error);
        requestStatusMessage.textContent =
            "Could not load requests. Please check your login and API connection.";
        requestStatusBody.innerHTML =
            '<tr><td colspan="6">Unable to load requests.</td></tr>';

    } finally {
        refreshRequestsBtn.disabled = false;
    }
}

requestSearchInput.addEventListener("input", renderRequestStatuses);
requestStatusFilter.addEventListener("change", renderRequestStatuses);
refreshRequestsBtn.addEventListener("click", loadRequestStatuses);

loadRequestStatuses();
