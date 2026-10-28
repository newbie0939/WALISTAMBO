function displaySearchResults() {

    searchBody.innerHTML = "";


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const results =
        incidents.filter(
            function(incident) {

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
                        (incident.location || "") +
                        " " +
                        (incident.description || "")
                    ).toLowerCase();


                return searchable.includes(
                    search
                );

            }
        );


    if (results.length === 0) {

        searchBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align:center;">
                    No matching records.
                </td>
            </tr>
        `;

        return;

    }


    results.forEach(function(incident) {

        const row =
            document.createElement("tr");


        row.innerHTML = `

            <td>
                ${escapeHTML(incident.id)}
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
                ${escapeHTML(incident.respondent || "-")}
            </td>

            <td>
                ${statusBadge(incident.status)}
            </td>

        `;


        searchBody.appendChild(row);

    });

}
