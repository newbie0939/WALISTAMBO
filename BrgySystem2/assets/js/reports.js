function displayReports() {

    const typeBody =
        document.getElementById(
            "reportTypeBody"
        );


    const statusBody =
        document.getElementById(
            "reportStatusBody"
        );


    typeBody.innerHTML = "";

    statusBody.innerHTML = "";


    const types = {};


    incidents.forEach(function(incident) {

        types[incident.type] =
            (types[incident.type] || 0) + 1;

    });


    Object.keys(types).forEach(function(type) {

        typeBody.innerHTML += `

            <div class="report-row">

                <span>
                    ${escapeHTML(type)}
                </span>

                <strong>
                    ${types[type]}
                </strong>

            </div>

        `;

    });


    if (Object.keys(types).length === 0) {

        typeBody.innerHTML =
            "<p>No data available.</p>";

    }


    const statuses = {

        Pending: 0,

        Ongoing: 0,

        Resolved: 0

    };


    incidents.forEach(function(incident) {

        if (
            statuses[incident.status] !== undefined
        ) {

            statuses[incident.status]++;

        }

    });


    Object.keys(statuses).forEach(function(status) {

        statusBody.innerHTML += `

            <div class="report-row">

                <span>
                    ${status}
                </span>

                <strong>
                    ${statuses[status]}
                </strong>

            </div>

        `;

    });

}