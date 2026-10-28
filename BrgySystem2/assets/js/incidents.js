async function loadIncidents() {
    try {
        const response = await fetch(API_URL, {
            method: "GET",
            credentials: "same-origin"
        });

        if (checkUnauthorized(response)) {
            return;
        }

        if (!response.ok) {
            throw new Error("Server error: " + response.status);
        }

        const data = await response.json();

        console.log("Incidents loaded:", data);

        incidents = Array.isArray(data) ? data : [];

    } catch (error) {
        console.error("Failed to load incidents:", error);
        incidents = [];
    }

    refreshAll();
}



function resetIncidentForm() {
    editingId = null;
    incidentForm.reset();

    document.getElementById("editReasonGroup").style.display = "none";
    document.getElementById("f_editReason").required = false;
    document.getElementById("submitBtn").textContent = "Save Incident";

    document.getElementById("hiddenDate").value = "";
    document.getElementById("hiddenTime").value = "";
}




const passwordModal =
    document.getElementById("passwordVerificationModal");

const passwordForm =
    document.getElementById("passwordVerificationForm");

const passwordInput =
    document.getElementById("verificationPassword");

const passwordMessage =
    document.getElementById("passwordVerificationMessage");

const passwordCancelBtn =
    document.getElementById("cancelPasswordVerification");

let passwordVerificationResolver = null;

function requestPasswordVerification() {
    return new Promise(function(resolve) {
        passwordVerificationResolver = resolve;

        passwordInput.value = "";
        passwordMessage.textContent = "";
        passwordMessage.style.display = "none";

        passwordModal.style.display = "flex";
        passwordInput.focus();
    });
}

function closePasswordVerification(password = null) {
    passwordModal.style.display = "none";

    if (passwordVerificationResolver) {
        const resolve = passwordVerificationResolver;
        passwordVerificationResolver = null;
        resolve(password);
    }
}

passwordCancelBtn.addEventListener("click", function() {
    closePasswordVerification(null);
});

passwordModal.addEventListener("click", function(event) {
    if (event.target === passwordModal) {
        closePasswordVerification(null);
    }
});

passwordForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const password = passwordInput.value;

    if (!password) {
        passwordMessage.textContent = "Please enter your password.";
        passwordMessage.style.display = "block";
        passwordInput.focus();
        return;
    }

    closePasswordVerification(password);
});



incidentForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const type = document.getElementById("f_type").value.trim();
    const location = document.getElementById("f_location").value.trim();
    const complainant = document.getElementById("f_complainant").value.trim();
    const respondent = document.getElementById("f_respondent").value.trim();
    const description = document.getElementById("f_description").value.trim();
    const status = document.getElementById("f_status").value;
    const editReason = document.getElementById("f_editReason").value.trim();
    const submitBtn = document.getElementById("submitBtn");

    const isEditRequest = editingId !== null &&
        editingId !== undefined &&
        String(editingId) !== "";

    if (!type || !location || !complainant || !description) {
        alert("Please complete all required fields.");
        return;
    }

    if (isEditRequest && !editReason) {
        alert("Please provide a reason for requesting this edit.");
        document.getElementById("f_editReason").focus();
        return;
    }

    let verificationPassword = null;

    if (isEditRequest) {
        verificationPassword = await requestPasswordVerification();

        if (verificationPassword === null) {
            return;
        }
    }

    const originalButtonText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = isEditRequest
        ? "Submitting Request..."
        : "Saving Incident...";

    try {
        let response;

        if (isEditRequest) {
            response = await fetch("api/incident_edit_requests.php", {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    incident_id: editingId,
                    reason: editReason,
                    type: type,
                    location: location,
                    complainant: complainant,
                    respondent: respondent,
                    description: description,
                    status: status,
                    password: verificationPassword
                })
            });
        } else {
            response = await fetch(API_URL, {
                method: "POST",
                credentials: "same-origin",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    type: type,
                    location: location,
                    complainant: complainant,
                    respondent: respondent,
                    description: description,
                    status: status
                })
            });
        }

        if (checkUnauthorized(response)) {
            return;
        }

        const result = await response.json();

        if (!response.ok || result.success !== true) {
            throw new Error(
                result.message ||
                (isEditRequest
                    ? "Failed to submit the edit request."
                    : "Failed to save the incident.")
            );
        }

        if (isEditRequest) {
            alert(
                "Edit request submitted successfully. " +
                "It is now waiting for Barangay Captain approval."
            );
        } else {
            alert("Incident record saved successfully.");
        }

        resetIncidentForm();
        await loadIncidents();
        showPage("addIncidentPage");

    } catch (error) {
        console.error("Incident submission error:", error);

        alert(
            error.message ||
            "Unable to complete your request. Please try again."
        );

    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = editingId
            ? "Submit Edit Request"
            : "Save Incident";
    }
});



cancelBtn.addEventListener("click", function() {
    resetIncidentForm();
    showPage("dashboardPage");
});



function getIncidentId(incident) {
    if (!incident) {
        return null;
    }

    const id =
        incident.id ??
        incident.incident_id ??
        incident.database_id ??
        null;

    if (id === null || id === undefined || String(id).trim() === "") {
        return null;
    }

    return String(id).trim();
}





function viewIncident(id) {
    const incident = incidents.find(function(item) {
        return (
            String(getIncidentId(item)) === String(id) ||
            String(item.incident_number ?? item.reference_number ?? "") === String(id)
        );
    });

    if (!incident) {
        console.error("Incident not found:", id, incidents);
        alert("Unable to view this incident. Please refresh the page.");
        return;
    }

    const incidentId = getIncidentId(incident);

    selectedIncidentId = incidentId;

    const displayId =
        incident.incident_number ??
        incident.reference_number ??
        incidentId;

    viewTitle.textContent = "Incident " + displayId;

    viewBody.innerHTML = `
        <div class="report-row">
            <strong>Incident ID</strong>
            <span>${escapeHTML(displayId)}</span>
        </div>
        <div class="report-row">
            <strong>Date</strong>
            <span>${escapeHTML(incident.date ?? incident.incident_date ?? "-")}</span>
        </div>
        <div class="report-row">
            <strong>Time</strong>
            <span>${escapeHTML(incident.time ?? incident.incident_time ?? "-")}</span>
        </div>
        <div class="report-row">
            <strong>Incident Type</strong>
            <span>${escapeHTML(incident.type ?? incident.incident_type ?? "-")}</span>
        </div>
        <div class="report-row">
            <strong>Location</strong>
            <span>${escapeHTML(incident.location ?? "-")}</span>
        </div>
        <div class="report-row">
            <strong>Complainant</strong>
            <span>${escapeHTML(incident.complainant ?? "-")}</span>
        </div>
        <div class="report-row">
            <strong>Respondent</strong>
            <span>${escapeHTML(incident.respondent || "-")}</span>
        </div>
        <div class="report-row">
            <strong>Status</strong>
            <span>${statusBadge(incident.status)}</span>
        </div>
        <div class="report-row">
            <strong>Recorded By</strong>
            <span>${escapeHTML(incident.recordedBy ?? incident.recorded_by ?? "-")}</span>
        </div>
        <div style="margin-top:20px;">
            <strong>Description</strong>
            <p>${escapeHTML(incident.description ?? "-")}</p>
        </div>
    `;

    viewOverlay.classList.add("show");
}



function closeModal() {
    viewOverlay.classList.remove("show");
    selectedIncidentId = null;
}

closeView.addEventListener("click", closeModal);
closeViewBtn.addEventListener("click", closeModal);

viewOverlay.addEventListener("click", function(event) {
    if (event.target === viewOverlay) {
        closeModal();
    }
});



editRecordBtn.addEventListener("click", function() {
    const incident = incidents.find(function(item) {
        return String(getIncidentId(item)) === String(selectedIncidentId);
    });

    if (!incident) {
        console.error("Selected ID:", selectedIncidentId, incidents);
        alert("Incident not found. Please close the window and open it again.");
        return;
    }

    const incidentId = getIncidentId(incident);

    if (!incidentId || !/^INC-\d+$/i.test(incidentId)) {
        console.error("Invalid incident ID:", incident);
        alert("This incident has an invalid ID.");
        return;
    }

    // Keep the original string ID, such as INC-00003.
    editingId = incidentId;

    document.getElementById("f_date").value =
        incident.date ?? incident.incident_date ?? "";

    document.getElementById("f_time").value =
        incident.time ?? incident.incident_time ?? "";

    document.getElementById("f_type").value =
        incident.type ?? incident.incident_type ?? "";

    document.getElementById("f_location").value =
        incident.location ?? "";

    document.getElementById("f_complainant").value =
        incident.complainant ?? "";

    document.getElementById("f_respondent").value =
        incident.respondent ?? "";

    document.getElementById("f_description").value =
        incident.description ?? "";

    document.getElementById("f_status").value =
        incident.status ?? "";

    document.getElementById("f_recordedBy").value =
        incident.recordedBy ?? incident.recorded_by ?? "";

    document.getElementById("editReasonGroup").style.display = "block";
    document.getElementById("f_editReason").value = "";
    document.getElementById("f_editReason").required = true;
    document.getElementById("submitBtn").textContent = "Submit Edit Request";

    closeModal();
    showPage("addIncidentPage");
});



function openDatePicker() {
    const dateInput = document.getElementById("hiddenDate");

    try {
        if (dateInput.showPicker) {
            dateInput.showPicker();
        } else {
            dateInput.click();
        }
    } catch (error) {
        dateInput.click();
    }
}

function openTimePicker() {
    const timeInput = document.getElementById("hiddenTime");

    try {
        if (timeInput.showPicker) {
            timeInput.showPicker();
        } else {
            timeInput.click();
        }
    } catch (error) {
        timeInput.click();
    }
}

function setDate(value) {
    if (!value) {
        return;
    }

    const parts = value.split("-");
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    document.getElementById("f_date").value =
        `${month}/${day}/${year}`;
}

function setTime(value) {
    if (!value) {
        return;
    }

    const parts = value.split(":");
    let hour = parseInt(parts[0], 10);
    const minutes = parts[1];

    const ampm = hour >= 12 ? "PM" : "AM";

    hour = hour % 12;

    if (hour === 0) {
        hour = 12;
    }

    document.getElementById("f_time").value =
        `${hour}:${minutes} ${ampm}`;
}



const dateField = document.getElementById("f_date");

dateField.addEventListener("input", function() {
    let value = dateField.value.replace(/\D/g, "");

    if (value.length > 8) {
        value = value.substring(0, 8);
    }

    if (value.length >= 5) {
        dateField.value =
            value.substring(0, 2) + "/" +
            value.substring(2, 4) + "/" +
            value.substring(4);
    } else if (value.length >= 3) {
        dateField.value =
            value.substring(0, 2) + "/" +
            value.substring(2);
    } else {
        dateField.value = value;
    }
});


const timeField = document.getElementById("f_time");

timeField.addEventListener("blur", function() {
    let value = timeField.value
        .toUpperCase()
        .replace(/\s/g, "")
        .replace(/:/g, "");

    const match = value.match(/^(\d{1,2})(\d{2})(AM|PM)$/);

    if (!match) {
        return;
    }

    const hour = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const ampm = match[3];

    if (hour < 1 || hour > 12 || minutes < 0 || minutes > 59) {
        return;
    }

    const formattedMinutes = String(minutes).padStart(2, "0");

    timeField.value = `${hour}:${formattedMinutes} ${ampm}`;
});
