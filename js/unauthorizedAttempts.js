import { db, ref, get, remove } from "./firebase.js";

const tbody = document.querySelector("#attemptTable tbody");

loadAttempts();

async function loadAttempts() {

    tbody.innerHTML = "";

    try {

        const snapshot = await get(ref(db, "unauthorizedAttempts"));

        if (!snapshot.exists()) {

            tbody.innerHTML = `
                <tr>
                    <td colspan="8">No Unauthorized Attempts Found</td>
                </tr>
            `;

            return;

        }

        const employees = snapshot.val();

        for (const empID in employees) {

            const attempts = employees[empID];

            for (const key in attempts) {

                const a = attempts[key];

                tbody.innerHTML += `

                <tr>

                    <td>${a.employeeId}</td>

                    <td>${a.name}</td>

                    <td>${a.type}</td>

                    <td>${a.action}</td>

                    <td>${a.date}</td>

                    <td>${a.time}</td>

                    <td>${a.distance} m</td>

                    <td>
                        <button onclick="viewMap('${a.latitude}','${a.longitude}','${a.distance}')">
                            📍 View
                        </button>
                    </td>

                </tr>

                `;

            }

        }

    }
    catch (error) {

        alert(error.message);

    }

}

window.viewMap = function(lat, lon, distance){

    sessionStorage.setItem("mapLat", lat);
    sessionStorage.setItem("mapLon", lon);
    sessionStorage.setItem("mapDistance", distance);

    location.href = "gpsMap.html";

}
document.getElementById("clearAttemptsBtn").onclick = async () => {

    const confirmDelete = confirm(
        "Are you sure you want to delete ALL unauthorized GPS attempts?\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {

        await remove(ref(db, "unauthorizedAttempts"));

        alert("✅ All unauthorized GPS attempts have been deleted.");

        location.reload();

    }
    catch (error) {

        alert(error.message);

    }

};
