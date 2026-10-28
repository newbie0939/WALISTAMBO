const requestsList =
    document.getElementById("requestsList");

const statusFilter =
    document.getElementById("statusFilter");

const refreshButton =
    document.getElementById("refreshButton");

const sidebar =
    document.getElementById("sidebar");

const hamburger =
    document.getElementById("hamburger");

const closeMenu =
    document.getElementById("closeMenu");

const sidebarOverlay =
    document.getElementById("sidebarOverlay");

const logoutButton =
    document.getElementById("logoutButton");

const profileName =
    document.getElementById("profileName");


let editRequests = [];


const AUTO_REFRESH_INTERVAL = 3000;

let autoRefreshTimer = null;

let isLoadingRequests = false;


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

function formatFieldName(field) {

    const names = {

        id: "Incident ID",

        date: "Date",

        time: "Time",

        type: "Incident Type",

        location: "Location",

        complainant: "Complainant",

        respondent: "Respondent",

        description: "Description",

        status: "Status",

        recordedBy: "Recorded By",

        createdAt: "Date Recorded"

    };

    return names[field] || field;
}


function formatDateTime(value) {

    if (!value) {
        return "-";
    }

    const date =
        new Date(
            String(value).replace(" ", "T")
        );

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleString(
        "en-PH",
        {
            dateStyle: "medium",
            timeStyle: "short"
        }
    );
}


function normalizeIncidentData(data) {
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
}


function getIncidentField(data, field) {
    const aliases = {
        id: ["id", "incident_id"],
        date: ["date", "incident_date"],
        time: ["time", "incident_time"],
        type: ["type", "incident_type"],
        location: ["location"],
        complainant: ["complainant"],
        respondent: ["respondent"],
        description: ["description"],
        status: ["status"],
        recordedBy: ["recordedBy", "recorded_by"],
        createdAt: ["createdAt", "created_at"]
    };

    const keys = aliases[field] || [field];

    for (const key of keys) {
        if (
            Object.prototype.hasOwnProperty.call(data, key)
        ) {
            return data[key];
        }
    }

    return null;
}


function fieldHasChanged(originalValue, proposedValue) {
    const normalize = value => {
        if (value === null || value === undefined || value === "") {
            return "";
        }

        return String(value).trim();
    };

    return normalize(originalValue) !== normalize(proposedValue);
}


function renderData(data, comparisonData = null, side = "") {
    data = normalizeIncidentData(data);

    if (comparisonData !== null) {
        comparisonData = normalizeIncidentData(comparisonData);
    }

    const fields = [
        "id",
        "date",
        "time",
        "type",
        "location",
        "complainant",
        "respondent",
        "description",
        "status",
        "recordedBy",
        "createdAt"
    ];

    return fields.map(function(field) {
        let value = getIncidentField(data, field);

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            value = "-";
        }

        let changeClass = "";
        let changeLabel = "";

        if (comparisonData !== null) {
            const originalValue = getIncidentField(
                side === "original" ? data : comparisonData,
                field
            );

            const proposedValue = getIncidentField(
                side === "proposed" ? data : comparisonData,
                field
            );

            const changed = fieldHasChanged(
                originalValue,
                proposedValue
            );

            if (changed) {
                if (side === "original") {
                    changeClass = "field-original-changed";
                    changeLabel = "Original value";
                } else if (side === "proposed") {
                    changeClass = "field-proposed-changed";
                    changeLabel = "Proposed change";
                }
            }
        }

        return `
            <div class="data-row">

                <div class="data-label">
                    ${escapeHTML(formatFieldName(field))}
                </div>

                <div class="data-value ${changeClass}">
                    ${
                        changeLabel
                            ? `<span class="change-label">${changeLabel}</span>`
                            : ""
                    }
                    <div>${escapeHTML(value)}</div>
                </div>

            </div>
        `;
    }).join("");
}


function statusBadge(status) {

    const normalized =
        String(status || "")
            .toLowerCase();


    let className =
        "status-pending";


    if (normalized === "approved") {

        className =
            "status-approved";

    } else if (normalized === "rejected") {

        className =
            "status-rejected";

    }


    return `
        <span class="status-badge ${className}">
            ${escapeHTML(status || "-")}
        </span>
    `;
}


async function loadEditRequests(
    showLoading = true
) {


    if (isLoadingRequests) {
        return;
    }


    isLoadingRequests = true;


    if (
        showLoading &&
        requestsList
    ) {

        requestsList.innerHTML = `
            <div class="loading-message">
                Loading edit requests...
            </div>
        `;

    }


    try {

        const response =
            await fetch(
                window.ADMIN_EDIT_REQUESTS_API,
                {
                    method: "GET",

                    credentials:
                        "same-origin",

                    cache:
                        "no-store"
                }
            );



        if (
            response.status === 401 ||
            response.status === 403
        ) {

            window.location.href =
                "../login.html";

            return;

        }


        if (!response.ok) {

            throw new Error(
                "Server error: " +
                response.status
            );

        }


        const result =
            await response.json();


        if (!result.success) {

            throw new Error(
                result.message ||
                "Failed to load edit requests."
            );

        }




        editRequests =
            Array.isArray(result.requests)
                ? result.requests
                : [];



        displayRequests();


    } catch (error) {

        console.error(
            "Failed to load edit requests:",
            error
        );



        if (
            showLoading &&
            requestsList
        ) {

            requestsList.innerHTML = `
                <div class="error-message">
                    Unable to load edit requests.
                </div>
            `;

        }

    } finally {

        isLoadingRequests = false;

    }

}



function displayRequests() {

    if (!requestsList) {
        return;
    }


    const selectedStatus =
        statusFilter
            ? statusFilter.value
            : "Pending";


    let filtered =
        [...editRequests];



    if (
        selectedStatus !== "All"
    ) {

        filtered =
            filtered.filter(
                function(request) {

                    return request.status ===
                        selectedStatus;

                }
            );

    }



    if (filtered.length === 0) {

        requestsList.innerHTML = `

            <div class="empty-message">

                No ${
                    selectedStatus === "All"
                        ? ""
                        : selectedStatus.toLowerCase() + " "
                }edit requests found.

            </div>

        `;

        return;

    }



    requestsList.innerHTML =
        filtered
            .map(
                function(request) {

                    return createRequestCard(
                        request
                    );

                }
            )
            .join("");

}



function createRequestCard(request) {

    const requester =
        request.requested_by_username ||
        "Unknown User";


    const reviewer =
        request.reviewed_by_username ||
        "-";


    const isPending =
        request.status === "Pending";


    return `

        <div
            class="request-card"
            data-request-id="${escapeHTML(
                request.request_id
            )}"
        >

            <!-- REQUEST HEADER -->

            <div class="request-header">

                <div>

                    <div class="request-title">

                        Edit Request 


                    </div>


                    <div class="request-meta">

                        Incident:

                        <strong>
                            ${escapeHTML(
                                request.incident_id
                            )}
                        </strong>

                        &nbsp; • &nbsp;

                        Requested by:

                        <strong>
                            ${escapeHTML(
                                requester
                            )}
                        </strong>

                        &nbsp; • &nbsp;

                        ${escapeHTML(
                            formatDateTime(
                                request.requested_at
                            )
                        )}

                    </div>

                </div>


                ${statusBadge(
                    request.status
                )}

            </div>


            <!-- REQUEST BODY -->

            <div class="request-body">


                <!-- REASON -->

                <div class="request-section">

                    <h3>
                        Reason for Edit
                    </h3>

                    <div class="request-reason">

                        ${escapeHTML(
                            request.reason ||
                            "-"
                        )}

                    </div>

                </div>


                <!-- DATA COMPARISON -->

                <div class="request-section">

                    <h3>
                        Original vs Proposed Data
                    </h3>


                    <div class="data-comparison">


                        <!-- ORIGINAL -->

                        <div class="data-box">

                            <h4>
                                Original Data
                            </h4>

                            <div class="data-content">

                                ${renderData(
                                    request.old_data,
                                    request.proposed_data,
                                    "original"
                                )}

                            </div>

                        </div>


                        <!-- PROPOSED -->

                        <div class="data-box">

                            <h4>
                                Proposed Data
                            </h4>

                            <div class="data-content">

                                ${renderData(
                                    request.proposed_data,
                                    request.old_data,
                                    "proposed"
                                )}

                            </div>

                        </div>


                    </div>

                </div>


                <!-- REVIEW INFORMATION -->

                ${
                    request.status !== "Pending"

                    ? `

                        <div class="request-section">

                            <h3>
                                Review Information
                            </h3>

                            <div class="request-reason">

                                <strong>
                                    Reviewed by:
                                </strong>

                                ${escapeHTML(
                                    reviewer
                                )}

                                <br>

                                <strong>
                                    Reviewed at:
                                </strong>

                                ${escapeHTML(
                                    formatDateTime(
                                        request.reviewed_at
                                    )
                                )}

                                <br>

                                <strong>
                                    Review reason:
                                </strong>

                                ${escapeHTML(
                                    request.review_reason ||
                                    "-"
                                )}

                            </div>

                        </div>

                    `

                    : ""
                }


            </div>


            <!-- ACTION BUTTONS -->

            ${
                isPending

                ? `

                    <div class="request-actions">

                        <button
                            type="button"
                            class="btn btn-approve"
                            onclick="
                                reviewRequest(
                                    ${Number(
                                        request.request_id
                                    )},
                                    'approve'
                                )
                            "
                        >
                            Approve
                        </button>


                        <button
                            type="button"
                            class="btn btn-reject"
                            onclick="
                                reviewRequest(
                                    ${Number(
                                        request.request_id
                                    )},
                                    'reject'
                                )
                            "
                        >
                            Reject
                        </button>

                    </div>

                `

                : ""
            }


        </div>

    `;

}


async function reviewRequest(
    requestId,
    action
) {

    const request =
        editRequests.find(
            function(item) {

                return Number(
                    item.request_id
                ) === Number(
                    requestId
                );

            }
        );


    if (!request) {

        alert(
            "Edit request could not be found."
        );

        return;

    }


    let reviewReason = "";




    if (action === "reject") {

        reviewReason =
            prompt(
                "Please provide a reason for rejecting this edit request:"
            );


        if (
            reviewReason === null
        ) {
            return;
        }


        reviewReason =
            reviewReason.trim();


        if (!reviewReason) {

            alert(
                "A reason is required when rejecting the edit request."
            );

            return;

        }

    }



    else {

        const confirmed =
            confirm(
                "Are you sure you want to approve this edit request? The proposed changes will be applied to the incident."
            );


        if (!confirmed) {
            return;
        }


        reviewReason =
            "Edit request approved.";

    }


    try {

        const response =
            await fetch(
                window.REVIEW_EDIT_REQUEST_API,
                {
                    method: "POST",

                    credentials:
                        "same-origin",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body:
                        JSON.stringify({

                            request_id:
                                requestId,

                            action:
                                action,

                            review_reason:
                                reviewReason

                        })

                }
            );


        if (
            response.status === 401 ||
            response.status === 403
        ) {

            window.location.href =
                "../login.html";

            return;

        }


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to review edit request."
            );

        }


        alert(
            result.message ||

            (
                action === "approve"

                    ? "Edit request approved successfully."

                    : "Edit request rejected successfully."
            )
        );




        await loadEditRequests(
            false
        );


    } catch (error) {

        console.error(
            "Review error:",
            error
        );


        alert(
            error.message ||
            "Unable to review the edit request."
        );

    }

}



if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        displayRequests
    );

}



if (refreshButton) {

    refreshButton.addEventListener(
        "click",
        function() {

            loadEditRequests(true);

        }
    );

}



if (hamburger) {

    hamburger.addEventListener(
        "click",
        function() {

            if (sidebar) {
                sidebar.classList.add(
                    "open"
                );
            }

            if (sidebarOverlay) {
                sidebarOverlay.classList.add(
                    "show"
                );
            }

        }
    );

}


if (closeMenu) {

    closeMenu.addEventListener(
        "click",
        function() {

            if (sidebar) {
                sidebar.classList.remove(
                    "open"
                );
            }

            if (sidebarOverlay) {
                sidebarOverlay.classList.remove(
                    "show"
                );
            }

        }
    );

}


if (sidebarOverlay) {

    sidebarOverlay.addEventListener(
        "click",
        function() {

            if (sidebar) {
                sidebar.classList.remove(
                    "open"
                );
            }

            sidebarOverlay.classList.remove(
                "show"
            );

        }
    );

}



if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function() {

            try {

                await fetch(
                    "../api/logout.php",
                    {
                        method: "POST",
                        credentials:
                            "same-origin"
                    }
                );

            } catch (error) {

                console.error(
                    "Logout error:",
                    error
                );

            }


            window.location.href =
                "../login.html";

        }
    );

}



function startAutoRefresh() {



    if (autoRefreshTimer) {

        clearInterval(
            autoRefreshTimer
        );

    }


    autoRefreshTimer =
        setInterval(
            function() {



                if (
                    document.hidden
                ) {
                    return;
                }




                loadEditRequests(
                    false
                );

            },
            AUTO_REFRESH_INTERVAL
        );

}


document.addEventListener(
    "visibilitychange",
    function() {

        if (
            !document.hidden
        ) {

            loadEditRequests(
                false
            );

        }

    }
);



window.addEventListener(
    "focus",
    function() {

        loadEditRequests(
            false
        );

    }
);



loadEditRequests(
    true
);


startAutoRefresh();