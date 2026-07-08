import { db, ref, get } from "./firebase.js";

// Check Login
if (sessionStorage.getItem("employeeLoggedIn") !== "true") {

    window.location.href = "employeeLogin.html";

}

const empID = sessionStorage.getItem("employeeID");

// Default month = current month
const monthPicker = document.getElementById("monthPicker");

monthPicker.value = new Date().toISOString().slice(0, 7);

document.getElementById("loadBtn").addEventListener("click", loadReport);

loadReport();

async function loadReport() {

    const month = monthPicker.value;

    const snapshot = await get(ref(db, "attendance/" + empID));

    if (!snapshot.exists()) {

        alert("No attendance found.");

        return;

    }

    const attendance = snapshot.val();

    let total = 0;
    let present = 0;
    let totalSeconds = 0;

    for (const date in attendance) {

        if (date.startsWith(month)) {

            total++;

            const data = attendance[date];

            if (data.status === "Present") {

                present++;

            }

            if (data.workingHours) {

                const parts = data.workingHours.split(":");

                if (parts.length === 3) {

                    totalSeconds +=
                        parseInt(parts[0]) * 3600 +
                        parseInt(parts[1]) * 60 +
                        parseInt(parts[2]);

                }

            }

        }

    }

    const absent = total - present;

    const percent =
        total === 0 ? 0 : ((present / total) * 100).toFixed(2);

    let average = "00:00:00";

    if (present > 0) {

        const avg = Math.floor(totalSeconds / present);

        const h = Math.floor(avg / 3600);
        const m = Math.floor((avg % 3600) / 60);
        const s = avg % 60;

        average =
            String(h).padStart(2, "0") + ":" +
            String(m).padStart(2, "0") + ":" +
            String(s).padStart(2, "0");

    }

    document.getElementById("workingDays").innerHTML =
        "Total Records : " + total;

    document.getElementById("presentDays").innerHTML =
        "Present : " + present;

    document.getElementById("absentDays").innerHTML =
        "Absent : " + absent;

    document.getElementById("attendancePercent").innerHTML =
        "Attendance : " + percent + "%";

    document.getElementById("averageHours").innerHTML =
        "Average Working Hours : " + average;

}