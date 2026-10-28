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

    <title>Reports - Captain | Barangay System</title>


    <link
        rel="stylesheet"
        href="../assets/css/admin_dashboard.css"
    >

    <link
        rel="stylesheet"
        href="../assets/css/admin_reports.css"
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

                <p>
                    Blotter and Incident Tracking System
                </p>

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

                <span>
                    Barangay Captain
                </span>

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

        <a
            href="dashboard.php"
            class="nav-btn"
        >
            Dashboard
        </a>

        <a
            href="records.php"
            class="nav-btn"
        >
            Incident Records
        </a>

        <a
            href="edit_requests.php"
            class="nav-btn"
        >
            Edit Requests
        </a>

        <a
            href="reports.php"
            class="nav-btn active"
        >
            Reports
        </a>

        <a
            href="history.php"
            class="nav-btn"
        >
            History
        </a>

    </nav>




    <main class="main-content">

        <!-- PAGE HEADER -->

        <div class="page-header">

            <div>

                <h2>
                    Reports
                </h2>

                <p>
                    View summaries and statistics of recorded incidents.
                </p>

            </div>

        </div>



        <section class="report-summary-grid">

            <div class="report-summary-card">

                <div class="summary-icon">
                    #
                </div>

                <div class="summary-content">

                    <span>
                        Total Incidents
                    </span>

                    <strong id="totalIncidents">
                        0
                    </strong>

                </div>

            </div>


            <div class="report-summary-card">

                <div class="summary-icon">
                    !
                </div>

                <div class="summary-content">

                    <span>
                        Pending
                    </span>

                    <strong id="pendingIncidents">
                        0
                    </strong>

                </div>

            </div>


            <div class="report-summary-card">

                <div class="summary-icon">
                    ↻
                </div>

                <div class="summary-content">

                    <span>
                        Ongoing
                    </span>

                    <strong id="ongoingIncidents">
                        0
                    </strong>

                </div>

            </div>


            <div class="report-summary-card">

                <div class="summary-icon">
                    ✓
                </div>

                <div class="summary-content">

                    <span>
                        Resolved
                    </span>

                    <strong id="resolvedIncidents">
                        0
                    </strong>

                </div>

            </div>

        </section>


        <section class="reports-grid">

            <!-- STATUS REPORT -->

            <div class="card report-card">

                <div class="report-card-header">

                    <div>

                        <h3>
                            Incidents by Status
                        </h3>

                        <p>
                            Current status of recorded incidents.
                        </p>

                    </div>

                </div>


                <div class="report-list">

                    <div class="report-item">

                        <div class="report-item-label">

                            <span class="report-dot pending-dot"></span>

                            Pending

                        </div>

                        <strong id="statusPending">
                            0
                        </strong>

                    </div>


                    <div class="report-item">

                        <div class="report-item-label">

                            <span class="report-dot ongoing-dot"></span>

                            Ongoing

                        </div>

                        <strong id="statusOngoing">
                            0
                        </strong>

                    </div>


                    <div class="report-item">

                        <div class="report-item-label">

                            <span class="report-dot resolved-dot"></span>

                            Resolved

                        </div>

                        <strong id="statusResolved">
                            0
                        </strong>

                    </div>

                </div>

            </div>



            <div class="card report-card">

                <div class="report-card-header">

                    <div>

                        <h3>
                            Incidents by Type
                        </h3>

                        <p>
                            Number of incidents grouped by type.
                        </p>

                    </div>

                </div>


                <div
                    id="incidentTypes"
                    class="report-list"
                >

                    <div class="report-empty">
                        Loading report...
                    </div>

                </div>

            </div>

        </section>


        <section class="card report-table-card">

            <div class="report-card-header">

                <div>

                    <h3>
                        Recent Incident Summary
                    </h3>

                    <p>
                        Latest incidents recorded in the system.
                    </p>

                </div>

                <button
                    type="button"
                    id="refreshReports"
                    class="report-refresh-btn"
                >
                    Refresh
                </button>

            </div>


            <div class="report-table-container">

                <table class="report-table">

                    <thead>

                        <tr>

                            <th>
                                ID
                            </th>

                            <th>
                                Date
                            </th>

                            <th>
                                Type
                            </th>

                            <th>
                                Complainant
                            </th>

                            <th>
                                Status
                            </th>

                        </tr>

                    </thead>

                    <tbody id="recentReportsBody">

                        <tr>

                            <td
                                colspan="5"
                                class="report-loading"
                            >
                                Loading reports...
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>

        </section>

    </main>



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

    <script
        src="../assets/js/admin_reports.js"
    ></script>

</body>

</html> 