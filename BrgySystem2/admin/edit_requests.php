<?php

require_once __DIR__ . '/../api/session_check.php';


if (
    !isset($_SESSION['role']) ||
    !in_array($_SESSION['role'], ['Barangay Captain', 'Captain'], true)
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

    <title>Edit Requests - Captain | Barangay System</title>

    <link
        rel="stylesheet"
        href="../assets/css/admin_edit_requests.css"
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
        class="nav-btn active"
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

            <h2>
                Edit Requests
            </h2>

            <p>
                Review and manage incident edit requests submitted by the Secretary.
            </p>

        </div>





        <div class="card">

            <div class="card-header">

                <h3>
                    Incident Edit Requests
                </h3>

            </div>


            <div class="filter-area">

                <div class="filter-group">

                    <label for="statusFilter">
                        Status
                    </label>


                    <select id="statusFilter">

                        <option value="Pending">
                            Pending
                        </option>

                        <option value="Approved">
                            Approved
                        </option>

                        <option value="Rejected">
                            Rejected
                        </option>

                        <option value="All">
                            All Requests
                        </option>

                    </select>

                </div>


                <button
                    id="refreshButton"
                    class="btn secondary"
                    type="button"
                >
                    Refresh
                </button>

            </div>

        </div>





        <div
            id="requestsList"
            class="requests-list"
        >

            <div class="loading-message">

                Loading edit requests...

            </div>

        </div>


    </section>

</main>





<footer>

    Barangay Sta. Teresita |
    Blotter and Incident Tracking System

</footer>




<script>

    window.ADMIN_EDIT_REQUESTS_API =
        "../api/admin_edit_requests.php";

    window.REVIEW_EDIT_REQUEST_API =
        "../api/review_edit_request.php";

</script>


<script src="../assets/js/admin_edit_requests.js"></script>


</body>

</html>