function displayRecords() {

    recordsBody.innerHTML = "";

    let filtered =
        [...incidents];


    const search =
        filterSearch.value
            .trim()
            .toLowerCase();



    const status =
        filterStatus.value;



    filtered =
        filtered.filter(
            function (incident) {

                const searchable =
                    (
                        incident.id +
                        " " +
                        incident.type +
                        " " +
                        incident.complainant +
                        " " +
                        (incident.respondent || "") +
                        " " +
                        incident.location
                    ).toLowerCase();


                const matchesSearch =
                    searchable.includes(
                        search
                    );


                const matchesStatus =
                    status === "All" ||
                    incident.status === status;


                return (
                    matchesSearch &&
                    matchesStatus
                );

            }
        );



    if (filtered.length === 0) {

        const row =
            document.createElement("tr");


        const cell =
            document.createElement("td");


        cell.colSpan = 7;

        cell.style.textAlign =
            "center";

        cell.textContent =
            "No records found.";


        row.appendChild(cell);

        recordsBody.appendChild(row);

        return;

    }



    filtered.sort(
        function (a, b) {

            return b.createdAt.localeCompare(
                a.createdAt
            );

        }
    );



    filtered.forEach(
        function (incident) {

            const row =
                document.createElement("tr");

            const idCell =
                document.createElement("td");


            const idStrong =
                document.createElement("strong");


            idStrong.textContent =
                incident.id;


            idCell.appendChild(
                idStrong
            );



            const dateCell =
                document.createElement("td");


            dateCell.textContent =
                incident.date;



            const typeCell =
                document.createElement("td");


            typeCell.textContent =
                incident.type;


            const complainantCell =
                document.createElement("td");


            complainantCell.textContent =
                incident.complainant;




            const locationCell =
                document.createElement("td");


            locationCell.textContent =
                incident.location;


            const statusCell =
                document.createElement("td");


            statusCell.innerHTML =
                statusBadge(
                    incident.status
                );



            const actionCell =
                document.createElement("td");



            const viewButton =
                document.createElement("button");


            viewButton.type =
                "button";


            viewButton.className =
                "btn primary";


            viewButton.textContent =
                "View";


            viewButton.addEventListener(
                "click",
                function () {

                    viewIncident(
                        incident.id
                    );

                }
            );



            const deleteButton =
                document.createElement("button");


            deleteButton.type =
                "button";


            deleteButton.className =
                "btn danger";


            deleteButton.textContent =
                "Delete";


            deleteButton.addEventListener(
                "click",
                function () {

                    deleteIncident(
                        incident.id
                    );

                }
            );


            actionCell.appendChild(
                viewButton
            );


            actionCell.appendChild(
                deleteButton
            );


            row.appendChild(
                idCell
            );

            row.appendChild(
                dateCell
            );

            row.appendChild(
                typeCell
            );

            row.appendChild(
                complainantCell
            );

            row.appendChild(
                locationCell
            );

            row.appendChild(
                statusCell
            );

            row.appendChild(
                actionCell
            );




            recordsBody.appendChild(
                row
            );

        }
    );

}




filterSearch.addEventListener(
    "input",
    displayRecords
);



filterStatus.addEventListener(
    "change",
    displayRecords
);


searchInput.addEventListener(
    "input",
    displaySearchResults
);


async function deleteIncident(id) {

    const incident =
        incidents.find(
            function (item) {

                return item.id === id;

            }
        );


    if (!incident) {

        return;

    }


    const confirmed =
        confirm(
            "Are you sure you want to delete incident " +
            incident.id +
            "?\n\n" +
            "The record will be removed from the Secretary panel " +
            "but will remain available to the Barangay Captain."
        );


    if (!confirmed) {

        return;

    }


    try {

        const response =
            await fetch(
                API_URL,
                {

                    method: "DELETE",

                    credentials:
                        "same-origin",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify({

                            id:
                                incident.id

                        })

                }
            );


        if (
            checkUnauthorized(
                response
            )
        ) {

            return;

        }

        const result =
            await response.json();

        if (!response.ok) {

            throw new Error(

                result.message ||
                "Failed to delete incident."

            );

        }


        if (!result.success) {

            throw new Error(

                result.message ||
                "Failed to delete incident."

            );

        }


        await loadIncidents();


        alert(
            "Incident " +
            incident.id +
            " was deleted from the Secretary panel."
        );


    } catch (error) {

        console.error(
            "Delete error:",
            error
        );


        alert(
            error.message ||
            "Failed to delete the incident. Please try again."
        );

    }

}