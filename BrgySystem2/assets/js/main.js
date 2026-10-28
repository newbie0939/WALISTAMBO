const API_URL = "api/incidents.php";

const navButtons =
    document.querySelectorAll(".nav-btn");

const pages =
    document.querySelectorAll(".page");

const incidentForm =
    document.getElementById("incidentForm");

const cancelBtn =
    document.getElementById("cancelBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

const recordsBody =
    document.getElementById("recordsBody");

const recentBody =
    document.getElementById("recentBody");

const searchBody =
    document.getElementById("searchBody");

const searchInput = 
    document.getElementById("searchInput");

searchInput.addEventListener(
    "input",
    function() {
        displaySearchResults();
    }
);
 
const filterSearch = 
    document.getElementById("filterSearch");
const filterStatus =
    document.getElementById("filterStatus");

const viewOverlay =
    document.getElementById("viewOverlay");

const viewTitle =
    document.getElementById("viewTitle");

const viewBody =
    document.getElementById("viewBody");

const closeView =
    document.getElementById("closeView");

const closeViewBtn =
    document.getElementById("closeViewBtn");

const deleteRecordBtn =
    document.getElementById("deleteRecordBtn");

const editRecordBtn =
    document.getElementById("editRecordBtn");

let incidents = [];

let selectedIncidentId = null;

let editingId = null;


function checkUnauthorized(response) {

    if (response.status === 401) {

        window.location.href = "login.html";

        return true;
    }

    return false;
}



navButtons.forEach(function(button) {

    button.addEventListener("click", function() {

        const pageId = button.getAttribute("data-page");

        // Remember the selected page
        localStorage.setItem("secretaryActivePage", pageId);

        showPage(pageId);

        refreshAll();

    });

});


logoutBtn.addEventListener(
    "click",
    async function() {

        const confirmLogout =
            confirm("Are you sure you want to logout?");

        if (!confirmLogout) {
            return;
        }

        try {

            await fetch(
                "api/logout.php",
                {
                    method: "POST",
                    credentials: "same-origin"
                }
            );

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

        }

        window.location.href =
            "login.html";

    }
);



function showPage(pageId) {

    pages.forEach(function(page) {
        page.classList.remove("active-page");
    });

    navButtons.forEach(function(button) {
        button.classList.remove("active");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active-page");
    }

    const button = document.querySelector(
        `[data-page="${pageId}"]`
    );

    if (button) {
        button.classList.add("active");
    }

}


function statusBadge(status) {

    const className =
        status.toLowerCase();

    return `
        <span class="status ${className}">
            ${escapeHTML(status)}
        </span>
    `;

}


function escapeHTML(value) {

    return String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


function refreshAll() {

    updateDashboard();

    displayRecentRecords();

    displayRecords();

    displaySearchResults();

    displayReports();

}



window.addEventListener("DOMContentLoaded", function() {

    const savedPage = localStorage.getItem("secretaryActivePage");

    const pageExists = savedPage &&
        document.getElementById(savedPage);

    showPage(pageExists ? savedPage : "dashboardPage");

    loadIncidents();

});
