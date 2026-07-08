import { db, ref, get } from "./firebase.js";

// Check Login
if (sessionStorage.getItem("employeeLoggedIn") !== "true") {

    alert("Please login first.");

    window.location.href = "employeeLogin.html";

}

const empID = sessionStorage.getItem("employeeID");

const tableBody = document.getElementById("historyBody");

loadHistory();

async function loadHistory() {

    tableBody.innerHTML = "";

    try {

        const snapshot = await get(ref(db, "attendance/" + empID));

        if (!snapshot.exists()) {

            tableBody.innerHTML =
                "<tr><td colspan='5'>No attendance found.</td></tr>";

            return;

        }

        const attendance = snapshot.val();

        // Latest date first
        const dates = Object.keys(attendance).sort().reverse();

        // Show only last 30 days
        const last30 = dates.slice(0, 30);

        for (const date of last30) {

            const data = attendance[date];

            tableBody.innerHTML += `

<tr>

<td>${date}</td>

<td>${data.checkIn || "--"}</td>

<td>${data.checkOut || "--"}</td>

<td>${data.workingHours || "--"}</td>

<td>${data.status || "Absent"}</td>

</tr>

`;

        }

    }
    catch (error) {

        alert(error.message);

    }

}