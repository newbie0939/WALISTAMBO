function displayRecentRecords() {

    recentBody.innerHTML = "";


    const recent =
        [...incidents]
            .sort(function(a, b) {

                return b.createdAt.localeCompare(
                    a.createdAt
                );

            })
            .slice(0, 5);


    if (recent.length === 0) {

        recentBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center;">
                    No incident records yet.
                </td>
            </tr>
        `;

        return;

    }


    recent.forEach(function(incident) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                <strong>
                    ${escapeHTML(incident.id)}
                </strong>
            </td>

            <td>
                ${escapeHTML(incident.date)}
            </td>

            <td>
                ${escapeHTML(incident.type)}
            </td>

            <td>
                ${escapeHTML(incident.complainant)}
            </td>

            <td>
                ${statusBadge(incident.status)}
            </td>

        `;


        recentBody.appendChild(row);

    });

}


function updateDashboard() {


    document.getElementById("sumTotal").textContent =
        incidents.length;

  
    document.getElementById("sumPending").textContent =
        incidents.filter(function(incident) {
            return incident.status === "Pending";
        }).length;


    document.getElementById("sumResolved").textContent =
        incidents.filter(function(incident) {
            return incident.status === "Resolved";
        }).length;


    document.getElementById("sumOngoing").textContent =
        incidents.filter(function(incident) {
            return incident.status === "Ongoing";
        }).length;
}
