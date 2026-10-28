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

    <title>History - Captain | Barangay System</title>

    <link
        rel="stylesheet"
        href="../assets/css/admin_dashboard.css"
    >

    <link
        rel="stylesheet"
        href="../assets/css/admin_history.css"
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

        <a href="records.php" class="nav-btn">
            Incident Records
        </a>

        <a href="edit_requests.php" class="nav-btn">
            Edit Requests
        </a>

        <a href="reports.php" class="nav-btn">
            Reports
        </a>

        <a href="history.php" class="nav-btn active">
            History
        </a>

    </nav>

    <main class="main-content">

        <div class="page-header">
            <div>
                <h2>History</h2>
                <p>View system activity and audit history.</p>
            </div>
        </div>

        <section class="card history-filter-card">

            <div class="history-filter-header">

                <div>
                    <h3>Activity History</h3>
                    <p>Monitor actions performed on incident records.</p>
                </div>

                <button
                    type="button"
                    id="refreshHistory"
                    class="history-refresh-btn"
                >
                    Refresh
                </button>

            </div>

            <div class="history-filters">

                <div class="history-filter-group">

                    <label for="historySearch">Search</label>

                    <input
                        type="text"
                        id="historySearch"
                        placeholder="Search incident or user..."
                        autocomplete="off"
                    >

                </div>

                <div class="history-filter-group">

                    <label for="historyAction">Action</label>

                    <select id="historyAction">
                        <option value="All">All Actions</option>
                        <option value="CREATE">Create</option>
                        <option value="UPDATE">Update</option>
                        <option value="DELETE">Delete</option>
                        <option value="ARCHIVE">Archive</option>
                    </select>

                </div>

            </div>

        </section>

        <section class="card history-card">

            <div class="history-card-header">

                <div>
                    <h3>System Activity</h3>
                    <p>Recorded actions from the audit log.</p>
                </div>

                <div id="historyCount" class="history-count">
                    0 records
                </div>

            </div>

            <div class="history-table-container">

                <table class="history-table">

                    <thead>
                        <tr>
                            <th>Incident</th>
                            <th>Action</th>
                            <th>Performed By</th>
                            <th>Date &amp; Time</th>
                            <th>Details</th>
                        </tr>
                    </thead>

                    <tbody id="historyBody">
                        <tr>
                            <td colspan="5" class="history-loading">
                                Loading history...
                            </td>
                        </tr>
                    </tbody>

                </table>

            </div>

        </section>

    </main>

    <div
        id="historyOverlay"
        class="history-modal-overlay"
    >

        <div class="history-modal">

            <div class="history-modal-header">

                <div>
                    <h3 id="historyModalTitle">Activity Details</h3>
                    <p>Detailed information about this activity.</p>
                </div>

                <button
                    type="button"
                    id="closeHistoryModal"
                    class="history-modal-close"
                >
                    ×
                </button>

            </div>

            <div
                id="historyModalBody"
                class="history-modal-body"
            ></div>

            <div class="history-modal-footer">

                <button
                    type="button"
                    id="closeHistoryModalBtn"
                    class="history-close-btn"
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
        window.CAPTAIN_HISTORY_API =
            "../api/admin_history.php";

        window.CAPTAIN_LOGOUT_API =
            "../api/logout.php";
    </script>

    <script src="../assets/js/admin_history.js"></script>

</body>
</html>