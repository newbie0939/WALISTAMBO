<?php

require_once __DIR__ . '/api/session_check.php';

if (
    !isset($_SESSION['logged_in']) ||
    $_SESSION['logged_in'] !== true
) {
    header('Location: login.html');
    exit;
}

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
        Barangay Sta. Teresita - Blotter and Incident Tracking System
    </title>

    <link rel="stylesheet" href="assets/css/style.css">

</head>


<body>


<header class="topbar">

    <div class="brand">

        <div class="barangay-logo">

            <img src="assets/images/system.jpg" alt="Barangay logo">

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

            <strong id="loggedUser">
                <?= htmlspecialchars($_SESSION['username'] ?? 'Administrator', ENT_QUOTES, 'UTF-8') ?>
            </strong>

            <span>
                Administrator
            </span>

        </div>


        <button
            id="logoutBtn"
            class="logout-btn"
        >
            Logout
        </button>

    </div>

</header>


<nav class="navbar">

    <button
        class="nav-btn active"
        data-page="dashboardPage"
    >
        Dashboard
    </button>

    <button
        class="nav-btn"
        data-page="addIncidentPage"
    >
        Add Incident
    </button>

    <button
        class="nav-btn"
        data-page="recordsPage"
    >
        Incident Records
    </button>

    <button
        class="nav-btn"
        data-page="searchPage"
    >
        Search Records
    </button>

    <button
        class="nav-btn"
        data-page="reportsPage"
    >
        Reports
    </button>

    <button
        class="nav-btn"
        data-page="editRequestPage"
    >
        Edit Request Status
    </button>

</nav>



<main class="main-content">



<?php include 'dashboard.php'; ?>




<?php include 'add_incident.php'; ?>




<?php include 'records.php'; ?>




<?php include 'search.php'; ?>



<?php include 'reports.php'; ?>

<?php include 'edit_request.php'; ?>


</main>


<div
    id="viewOverlay"
    class="modal-overlay"
>

    <div class="modal">

        <div class="modal-header">

            <h2 id="viewTitle">
                Incident Details
            </h2>

            <button
                id="closeView"
                class="modal-close"
            >
                
            </button>

        </div>


        <div
            id="viewBody"
            class="modal-body"
        >

        </div>


        <div class="modal-actions">

            <button
                id="editRecordBtn"
                class="btn primary"
            >
                Request Edit
            </button>


            <button
                id="closeViewBtn"
                class="btn secondary"
            >
                Close
            </button>

        </div>

    </div>

</div>


<footer>

    <p>
        Barangay Sta. Teresita
        |
        Blotter and Incident Tracking System
    </p>

</footer>


<script src="assets/js/main.js"></script>
<script src="assets/js/incidents.js"></script>
<script src="assets/js/dashboard.js"></script>
<script src="assets/js/records.js"></script>
<script src="assets/js/search.js"></script>
<script src="assets/js/reports.js"></script>
<script src="assets/js/edit_request.js"></script>

</body>
</html>