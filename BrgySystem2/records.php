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
    id="recordsPage"
    class="page"
>

    <div class="page-header">

        <div>

            <h2>
                Incident Records
            </h2>

            <p>
                View and manage recorded incidents.
            </p>

        </div>

    </div>


    <div class="card">


        <div class="filters">

            <input
                type="text"
                id="filterSearch"
                placeholder="Search records..."
            >


            <select id="filterStatus">

                <option value="All">
                    All Status
                </option>

                <option value="Pending">
                    Pending
                </option>

                <option value="Ongoing">
                    Ongoing
                </option>

                <option value="Resolved">
                    Resolved
                </option>

            </select>

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

                        <th>
                            Action
                        </th>

                    </tr>

                </thead>


                <tbody id="recordsBody">

                </tbody>

            </table>

        </div>

    </div>

</section>