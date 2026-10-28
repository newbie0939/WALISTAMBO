
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
    id="dashboardPage"
    class="page active-page"
>

    <div class="page-header">

        <div>

            <h2>
                Dashboard
            </h2>

            <p>
                Overview of Barangay Blotter and Incident records.
            </p>

        </div>

    </div>


    <div class="summary-grid">

        <div class="summary-card">

            <span>
                Total Incidents
            </span>

            <strong id="sumTotal">
                0
            </strong>

        </div>

        <div class="summary-card">
            <span>
                Pending
            </span>

            <strong id="sumPending">
                0
            </strong>
        </div>


        <div class="summary-card">

            <span>
                Ongoing
            </span>

            <strong id="sumOngoing">
                0
            </strong>

        </div>


        <div class="summary-card">

            <span>
                Resolved
            </span>

            <strong id="sumResolved">
                0
            </strong>

        </div>

    </div>


    <div class="card">

        <div class="card-header">

            <h3>
                Recently Added
            </h3>

        </div>


        <div class="table-container">

            <table>

                <thead>

                    <tr>

                        <th>
                            Incident ID
                        </th>

                        <th>
                            Date
                        </th>

                        <th>
                            Incident Type
                        </th>

                        <th>
                            Complainant
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody id="recentBody">

                </tbody>

            </table>

        </div>

    </div>





</section>

