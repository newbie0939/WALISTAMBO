<?php

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}


if (
    !isset($_SESSION['logged_in']) ||
    $_SESSION['logged_in'] !== true
) {
    header("Location: ../login.html");
    exit;
}

if (
    !isset($_SESSION['role']) ||
    !in_array($_SESSION['role'], ['Barangay Captain', 'Captain'], true)
) {
    header("Location: ../dashboard.php");
    exit;
}

$captainName = $_SESSION['username'] ?? 'Captain';

?>

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Incident Records - Captain | Barangay System</title>

    <link
        rel="stylesheet"
        href="../assets/css/admin_dashboard.css"
    >

    <link
        rel="stylesheet"
        href="../assets/css/admin_records.css"
    >
</head>

<body>

    <header class="topbar">

        <div class="brand">

            <div class="barangay-logo">
                <img
                    src="../assets/images/system.jpg"
                    alt="Barangay Sta. Teresita Logo"
                >
            </div>

            <div class="brand-text">
                <h1>BARANGAY STA. TERESITA</h1>
                <p>Blotter and Incident Tracking System</p>
            </div>

        </div>

        <div class="admin-area">

            <div class="user-logo">
                <svg
                   width="22"
                   height="22"
                   viewBox="0 0 24 24"
                   fill="none"
                   xmlns="http://www.w3.org/2000/svg"
                >
                   <circle
                       cx="12"
                       cy="8"
                       r="4"
                       stroke="currentColor"
                       stroke-width="2"
                    />

                    <path
                        d="M4 21C4.8 16.5 7.5 14 12 14C16.5 14 19.2 16.5 20 21"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />
                </svg>

            </div>

            <div class="admin-info">

                <strong id="profileName">
                    <?= htmlspecialchars($captainName) ?>
                </strong>

                <span>Barangay Captain</span>

            </div>

            <button
                id="logoutButton"
                class="logout-btn"
                type="button"
            >
                Logout
            </button>

        </div>

    </header>

    <nav class="navbar">

        <a href="dashboard.php" class="nav-btn">
            Dashboard
        </a>

        <a href="records.php" class="nav-btn active">
            Incident Records
        </a>

        <a href="edit_requests.php" class="nav-btn">
            Edit Requests
        </a>

        <a href="reports.php" class="nav-btn">
            Reports
        </a>

        <a href="history.php" class="nav-btn">
            History
        </a>

    </nav>

    <main class="main-content">

        <div class="page-header">

            <div>
                <h2>Incident Records</h2>
                <p>View and search recorded barangay incidents.</p>
            </div>

        </div>

        <section class="card records-filter-card">

            <div class="section-title">

                <div>
                    <h3>Incident Records</h3>
                    <p>Search and filter recorded incidents.</p>
                </div>

                <button
                    type="button"
                    id="refreshButton"
                    class="records-refresh-btn"
                >
                    Refresh
                </button>

            </div>

            <div class="records-filters">

                <div class="filter-group">

                    <label for="filterSearch">Search</label>

                    <input
                        type="text"
                        id="filterSearch"
                        placeholder="Search records..."
                        autocomplete="off"
                    >

                </div>

                <div class="filter-group">

                    <label for="filterStatus">Status</label>

                    <select id="filterStatus">

                        <option value="All">All Status</option>
                        <option value="Pending">Pending</option>
                        <option value="Ongoing">Ongoing</option>
                        <option value="Resolved">Resolved</option>

                    </select>

                </div>

                <div class="filter-group archived-filter-group">

                    <label for="showArchivedRecords">
                        Archived Records
                    </label>

                    <div class="archive-checkbox-row">

                        <input
                            type="checkbox"
                            id="showArchivedRecords"
                        >

                        <label for="showArchivedRecords">
                            Show archived records
                        </label>

                    </div>

                </div>

            </div>

        </section>

        <section class="card records-card">

            <div class="records-card-header">

                <div>
                    <h3>Recorded Incidents</h3>
                    <p>Latest incidents recorded in the system.</p>
                </div>

                <div id="recordCount" class="record-count">
                    0 records
                </div>

            </div>

            <div class="records-table-container">

                <table class="records-table">

                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Date</th>
                            <th>Type</th>
                            <th>Complainant</th>
                            <th>Location</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>

                    <tbody id="recordsBody">
                        <tr>
                            <td
                                colspan="7"
                                class="loading-cell"
                            >
                                Loading incident records...
                            </td>
                        </tr>
                    </tbody>

                </table>

            </div>

        </section>

    </main>

    <div
        id="viewOverlay"
        class="records-modal-overlay"
    >

        <div class="records-modal">

            <div class="records-modal-header">

                <div>
                    <h3 id="viewTitle">Incident Details</h3>
                    <p>View complete incident information.</p>
                </div>

                <button
                    type="button"
                    id="closeView"
                    class="modal-close"
                >
                    ×
                </button>

            </div>

            <div
                id="viewBody"
                class="records-modal-body"
            ></div>

            <div class="records-modal-footer">

                <button
                    type="button"
                    id="closeViewBtn"
                    class="records-close-btn"
                >
                    Close
                </button>

            </div>

        </div>

    </div>

    <footer class="footer">
        Barangay Sta. Teresita |
        Blotter and Incident Tracking System
    </footer>

    <script>
        window.CAPTAIN_INCIDENTS_API =
            "../api/incidents.php";

        window.CAPTAIN_LOGOUT_API =
            "../api/logout.php";
    </script>

    <script src="../assets/js/admin_records.js"></script>

</body>
</html>