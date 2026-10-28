<?php
if (
    isset($_SERVER['SCRIPT_FILENAME']) &&
    realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    header('Location: index.php');
    exit;
}
?>


<section id="editRequestPage" class="page">
    <div class="page-header">
        <h2>Edit Request Status</h2>
        <p>Monitor your edit requests and the Barangay Captain's decisions.</p>
    </div>

    <div class="card">
        <div class="card-header request-header">
            <div>
                <h3>My Edit Requests</h3>
                <p>Check pending, approved, and rejected requests.</p>
            </div>

            <button type="button" id="refreshRequestsBtn" class="btn primary">
                Refresh
            </button>
        </div>

        <div class="request-filters">
            <div class="request-filter-group">
                <label for="requestSearchInput">Search</label>
                <input
                    type="text"
                    id="requestSearchInput"
                    placeholder="Search incident ID or reason..."
                >
            </div>

            <div class="request-filter-group">
                <label for="requestStatusFilter">Status</label>
                <select id="requestStatusFilter">
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                </select>
            </div>
        </div>

        <p id="requestStatusMessage">Loading requests...</p>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Request ID</th>
                        <th>Incident ID</th>
                        <th>Reason</th>
                        <th>Status</th>
                        <th>Captain's Response</th>
                        <th>Reviewed At</th>
                    </tr>
                </thead>

                <tbody id="requestStatusBody">
                    <tr>
                        <td colspan="6">Loading requests...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</section>
