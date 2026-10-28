<?php
if (
    isset($_SERVER['SCRIPT_FILENAME']) &&
    realpath($_SERVER['SCRIPT_FILENAME']) === realpath(__FILE__)
) {
    header('Location: index.php');
    exit;
}
?>


<section
    id="reportsPage"
    class="page"
>

    <div class="page-header">

        <div>

            <h2>
                Reports
            </h2>

            <p>
                Summary of recorded incidents.
            </p>

        </div>

    </div>


    <div class="reports-grid">


        <div class="card">

            <h3>
                Incidents by Type
            </h3>

            <div id="reportTypeBody">

            </div>

        </div>


        <div class="card">

            <h3>
                Incidents by Status
            </h3>

            <div id="reportStatusBody">

            </div>

        </div>


    </div>

</section>