import { db, ref, get } from "./firebase.js";

// Check Admin Login

if (sessionStorage.getItem("adminLoggedIn") !== "true") {

    window.location.href = "adminLogin.html";

}

const monthPicker = document.getElementById("monthPicker");

const tableBody = document.getElementById("reportBody");

// Current Month

monthPicker.value = new Date().toISOString().slice(0, 7);

document.getElementById("loadBtn").addEventListener("click", loadReport);
alert("loadReport() called");
loadReport();

async function loadReport() {

    tableBody.innerHTML = "";

    const month = monthPicker.value;

    const empSnapshot = await get(ref(db, "employees"));

    const attSnapshot = await get(ref(db, "attendance"));

    if (!empSnapshot.exists()) {

        return;

    }

    const employees = empSnapshot.val();

    const attendance = attSnapshot.exists() ? attSnapshot.val() : {};
    console.log("Employees:", employees);
console.log("Attendance:", attendance);
console.log("Selected Month:", month);

    for (const empID in employees) {

        const emp = employees[empID];

        let present = 0;

        let total = 0;

        let totalSeconds = 0;

        if (attendance[empID]) {

            for (const date in attendance[empID]) {

                if (date.startsWith(month)) {

                    total++;

                    const data = attendance[empID][date];

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

        }

        const absent = total - present;

        const percent = total === 0
            ? "0%"
            : ((present / total) * 100).toFixed(2) + "%";

        let average = "--";

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

        tableBody.innerHTML += `

<tr>

<td>${empID}</td>

<td>${emp.name}</td>

<td>${emp.type}</td>

<td>${present}</td>

<td>${absent}</td>

<td>${percent}</td>

<td>${average}</td>

</tr>

`;

    }

}
document.getElementById("exportCSVBtn").addEventListener("click", exportCSV);

function exportCSV() {

    let csv =
"Employee ID,Name,Type,Present Days,Absent Days,Attendance %,Average Working Hours\n";

    const rows = document.querySelectorAll("#reportBody tr");

    rows.forEach(row => {

        const cols = row.querySelectorAll("td");

        const rowData = [];

        cols.forEach(col => {

            rowData.push(col.innerText);

        });

        csv += rowData.join(",") + "\n";

    });

    const blob = new Blob([csv], {

        type: "text/csv;charset=utf-8;"

    });

    const link = document.createElement("a");

    const url = URL.createObjectURL(blob);

    link.href = url;

    link.download =
        "Attendance_Report_" + monthPicker.value + ".csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

}