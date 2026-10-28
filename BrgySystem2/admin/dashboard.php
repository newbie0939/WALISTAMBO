<?php

require_once __DIR__ . '/../api/session_check.php';



if (
    !isset($_SESSION['role']) ||
    !in_array(
        $_SESSION['role'],
        ['Barangay Captain', 'Captain'],
        true
    )
) {
    header('Location: ../dashboard.php');
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

    <title>
        Dashboard - Captain | Barangay System
    </title>

    <link
        rel="stylesheet"
        href="../assets/css/admin_dashboard.css"
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

            <h1>
                BARANGAY STA. TERESITA
            </h1>

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

</div></div>


</header>



<nav class="navbar">


    <a
        href="dashboard.php"
        class="nav-btn active"
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
        class="nav-btn"
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


    <section class="page">


        <!-- Page Header -->

        <div class="page-header">

            <div>

                <h2>
                    Captain Dashboard
                </h2>

                <p>
                    Overview of barangay incident records and system activity.
                </p>

            </div>

        </div>



        <div class="summary-grid">


            <!-- Total Incidents -->

            <div class="summary-card">

                <div class="summary-icon">
                    #
                </div>

                <div class="summary-info">

                    <span>
                        Total Incidents
                    </span>

                    <strong id="totalIncidents">
                        0
                    </strong>

                </div>

            </div>




            <div class="summary-card">

                <div class="summary-icon">
                    !
                </div>

                <div class="summary-info">

                    <span>
                        Pending
                    </span>

                    <strong id="pendingIncidents">
                        0
                    </strong>

                </div>

            </div>



            <div class="summary-card">

                <div class="summary-icon">
                    ↻
                </div>

                <div class="summary-info">

                    <span>
                        Ongoing
                    </span>

                    <strong id="ongoingIncidents">
                        0
                    </strong>

                </div>

            </div>


            <div class="summary-card">

                <div class="summary-icon">
                    ✓
                </div>

                <div class="summary-info">

                    <span>
                        Resolved
                    </span>

                    <strong id="resolvedIncidents">
                        0
                    </strong>

                </div>

            </div>



            <div class="summary-card">

                <div class="summary-icon">
                    ✎
                </div>

                <div class="summary-info">

                    <span>
                        Pending Edit Requests
                    </span>

                    <strong id="pendingEditRequests">
                        0
                    </strong>

                </div>

            </div>


        </div>



        <div class="card">


            <div class="card-header">

                <div>

                    <h3>
                        Recent Incident Records
                    </h3>

                    <p>
                        Latest incidents recorded in the system.
                    </p>

                </div>


                <a
                    href="records.php"
                    class="view-all-btn"
                >
                    View All
                </a>

            </div>



            <div class="table-container">

                <table>

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
                                Location
                            </th>

                            <th>
                                Status
                            </th>

                        </tr>

                    </thead>


                    <tbody id="recentIncidentsBody">

                        <tr>

                            <td
                                colspan="6"
                                class="loading-cell"
                            >
                                Loading incident records...
                            </td>

                        </tr>

                    </tbody>

                </table>

            </div>


        </div>



        <div class="card">


            <div class="card-header">

                <div>

                    <h3>
                        Captain Actions
                    </h3>

                    <p>
                        Quickly access important system functions.
                    </p>

                </div>

            </div>



            <div class="quick-actions">


                <a
                    href="records.php"
                    class="quick-action"
                >

                    <span class="quick-action-icon">
                        #
                    </span>

                    <div>

                        <strong>
                            Incident Records
                        </strong>

                        <small>
                            View and search recorded incidents.
                        </small>

                    </div>

                </a>



                <a
                    href="edit_requests.php"
                    class="quick-action"
                >

                    <span class="quick-action-icon">
                        ✎
                    </span>

                    <div>

                        <strong>
                            Edit Requests
                        </strong>

                        <small>
                            Review Secretary edit requests.
                        </small>

                    </div>

                </a>



                <a
                    href="reports.php"
                    class="quick-action"
                >

                    <span class="quick-action-icon">
                        ▤
                    </span>

                    <div>

                        <strong>
                            Reports
                        </strong>

                        <small>
                            View incident summaries.
                        </small>

                    </div>

                </a>



                <a
                    href="history.php"
                    class="quick-action"
                >

                    <span class="quick-action-icon">
                        ↺
                    </span>

                    <div>

                        <strong>
                            History
                        </strong>

                        <small>
                            View system activity and audit history.
                        </small>

                    </div>

                </a>


            </div>


        </div>


    </section>


</main>


<footer>

    Barangay Sta. Teresita |
    Blotter and Incident Tracking System

</footer>


<script>

    window.CAPTAIN_INCIDENTS_API =
        "../api/incidents.php";

    window.CAPTAIN_EDIT_REQUESTS_API =
        "../api/admin_edit_requests.php";

</script>


<script src="../assets/js/admin_dashboard.js"></script>


</body>

</html>