
<section id="addIncidentPage" class="page">

    <div class="page-header">
        <div>
            <h2>Add New Incident</h2>
            <p>Record a new barangay incident.</p>
        </div>
    </div>

    <div class="card incident-form-card">
        <form id="incidentForm">

            <div class="form-grid">

                <!-- INCIDENT INFORMATION CARD -->
                <div class="incident-section-card incident-details-card">

<div class="incident-section-header">
    <div class="section-icon incident-icon">
        <i class="fa-solid fa-file-circle-exclamation"></i>
    </div>
    <div class="section-heading-text">
        <h3>Incident Information</h3>
        <p>Enter the details of the reported incident.</p>
    </div>
</div>

                    <div class="incident-fields-grid">

                        <div class="form-group">
                            <label for="f_type">Incident Type</label>
                            <select id="f_type" name="type" required>
                                <option value="" selected disabled>Select incident type</option>
                                <option value="Theft">Theft</option>
                                <option value="Physical Injury">Physical Injury</option>
                                <option value="Dispute / Quarrel">Dispute / Quarrel</option>
                                <option value="Noise Complaint">Noise Complaint</option>
                                <option value="Property Damage">Property Damage</option>
                                <option value="Trespassing">Trespassing</option>
                                <option value="Domestic Dispute">Domestic Dispute</option>
                                <option value="Others">Others</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="f_status">Status</label>
                            <select id="f_status">
                                <option value="Pending">Pending</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Resolved">Resolved</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="f_complainant">Complainant</label>
                            <input
                                type="text"
                                id="f_complainant"
                                placeholder="Enter complainant name"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="f_respondent">Respondent</label>
                            <input
                                type="text"
                                id="f_respondent"
                                placeholder="Enter respondent name"
                            >
                        </div>

                        <div class="form-group full-width">
                            <label for="f_location">Location</label>
                            <input
                                type="text"
                                id="f_location"
                                list="Location"
                                placeholder="Enter location"
                                required
                            >
                            <datalist id="Location"></datalist>
                        </div>

                    </div>
                </div>

                
                <div class="incident-section-card description-section-card">

<div class="incident-section-header">
    <div class="section-icon description-icon">
        <i class="fa-solid fa-file-lines"></i>
    </div>
    <div class="section-heading-text">
        <h3>Incident Description</h3>
        <p>Provide a clear description of what happened.</p>
    </div>
</div>

                    <div class="form-group description-group">
                        <label for="f_description">Description</label>
                        <textarea
                            id="f_description"
                            rows="5"
                            placeholder="Enter incident details..."
                            required
                        ></textarea>
                    </div>

                </div>

                
                <div class="incident-section-card record-section-card">

<div class="incident-section-header">
    <div class="section-icon record-icon">
        <i class="fa-solid fa-clipboard-check"></i>
    </div>
    <div class="section-heading-text">
        <h3>Record Information</h3>
        <p>Incident reporting details and recording information.</p>
    </div>
</div>

                    <div class="record-fields-grid">

                        <div class="record-info-box">
                            <label for="f_date">Date Reported</label>
                            <div class="record-info-value">
                                <input
                                    type="text"
                                    id="f_date"
                                    placeholder="Automatically recorded"
                                    readonly
                                    required
                                >
                            </div>
                            <input
                                type="date"
                                id="hiddenDate"
                                class="hidden-picker"
                                onchange="setDate(this.value)"
                            >
                        </div>

                        <div class="record-info-box">
                            <label for="f_time">Time Reported</label>
                            <div class="record-info-value">
                                <input
                                    type="text"
                                    id="f_time"
                                    placeholder="Automatically recorded"
                                    readonly
                                    required
                                >
                            </div>
                            <input
                                type="time"
                                id="hiddenTime"
                                class="hidden-picker"
                                onchange="setTime(this.value)"
                            >
                        </div>

                        <div class="record-info-box recorded-by-box">
                            <label for="f_recordedBy">Recorded By</label>
                            <div class="record-info-value">
                                <input
                                    type="text"
                                    id="f_recordedBy"
                                    value="<?= htmlspecialchars($_SESSION['username'] ?? '', ENT_QUOTES, 'UTF-8') ?>"
                                    readonly
                                >
                            </div>
                        </div>

                    </div>
                </div>

            </div>

            <div
                class="form-group description-group"
                id="editReasonGroup"
                style="display: none;"
            >
                <label for="f_editReason">Reason for Edit</label>
                <textarea
                    id="f_editReason"
                    rows="3"
                    placeholder="Explain why this incident needs to be edited"
                ></textarea>
            </div>

  
            <div class="form-actions">
                <button type="button" id="cancelBtn" class="btn secondary">
                    Cancel
                </button>
                <button type="submit" id="submitBtn" class="btn primary">
                    Save Incident
                </button>
            </div>

        </form>
    </div>
</section>



<div
    id="passwordVerificationModal"
    style="
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: rgba(0, 0, 0, 0.55);
        align-items: center;
        justify-content: center;
        padding: 20px;
    "
>
    <div
        class="card"
        style="width: 100%; max-width: 420px; padding: 24px;"
        role="dialog"
        aria-modal="true"
        aria-labelledby="passwordModalTitle"
    >
        <h3 id="passwordModalTitle">Verify Your Password</h3>

        <p>
            Enter your Secretary account password to submit this edit request.
        </p>

        <form id="passwordVerificationForm">
            <div class="form-group">
                <label for="verificationPassword">Password</label>
                <input
                    type="password"
                    id="verificationPassword"
                    autocomplete="current-password"
                    placeholder="Enter your password"
                    required
                    style="width: 100%;"
                >
            </div>

            <p
                id="passwordVerificationMessage"
                role="alert"
                style="display: none; color: #c62828;"
            ></p>

            <div class="form-actions">
                <button
                    type="button"
                    id="cancelPasswordVerification"
                    class="btn secondary"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    id="confirmPasswordVerification"
                    class="btn primary"
                >
                    Verify &amp; Submit
                </button>
            </div>
        </form>
    </div>
</div>
