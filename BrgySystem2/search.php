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
    id="searchPage"
    class="page"
>

    <div class="page-header">

        <div>

            <h2>
                Search Records
            </h2>

            <p>
                Quickly find existing incident records.
            </p>

        </div>

    </div>


    <div class="card">

        <input
            type="text"
            id="searchInput"
            class="search-box"
            placeholder="Search by ID, complainant, respondent, type, location..."
        >


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
                            Respondent
                        </th>

                        <th>
                            Status
                        </th>

                    </tr>

                </thead>


                <tbody id="searchBody">

                </tbody>

            </table>

        </div>

    </div>

</section>