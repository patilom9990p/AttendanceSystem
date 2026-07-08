import { db, ref, get } from "./firebase.js";

// =============================
// CHECK ADMIN SESSION
// =============================

if (sessionStorage.getItem("adminLoggedIn") !== "true") {

    alert("Please login first.");

    window.location.href = "adminLogin.html";

}

// =============================
// LOAD DASHBOARD
// =============================

loadDashboard();

async function loadDashboard() {

    try {

        // -----------------------------
        // Employees
        // -----------------------------

        const empSnapshot = await get(ref(db, "employees"));

        let totalEmployees = 0;
        let employees = 0;
        let interns = 0;

        if (empSnapshot.exists()) {

            const empData = empSnapshot.val();

            totalEmployees = Object.keys(empData).length;

            for (const id in empData) {

                if (empData[id].type === "Employee") {

                    employees++;

                } else {

                    interns++;

                }

            }

        }

        document.getElementById("totalEmployees").innerHTML =
            "👥 Total Employees : " + totalEmployees;

        document.getElementById("employeesCount").innerHTML =
            "💼 Employees : " + employees;

        document.getElementById("internsCount").innerHTML =
            "🎓 Interns : " + interns;

        // -----------------------------
        // Today's Attendance
        // -----------------------------

        const today = new Date().toISOString().split("T")[0];

        const attSnapshot = await get(ref(db, "attendance"));

        let present = 0;
        let totalSeconds = 0;
        let completedEmployees = 0;

        if (attSnapshot.exists()) {

            const attendance = attSnapshot.val();

            for (const empID in attendance) {

                if (attendance[empID][today]) {

                    const data = attendance[empID][today];

                    if (data.status === "Present") {

                        present++;

                    }

                    if (data.workingHours && data.workingHours !== "") {

                        const parts = data.workingHours.split(":");

                        if (parts.length === 3) {

                            totalSeconds +=

                                parseInt(parts[0]) * 3600 +

                                parseInt(parts[1]) * 60 +

                                parseInt(parts[2]);

                            completedEmployees++;

                        }

                    }

                }

            }

        }

        const absent = totalEmployees - present;

        document.getElementById("presentCount").innerHTML =
            "🟢 Present Today : " + present;

        document.getElementById("absentCount").innerHTML =
            "🔴 Absent Today : " + absent;

        let average = "00:00:00";

        if (completedEmployees > 0) {

            const avg = Math.floor(totalSeconds / completedEmployees);

            const h = Math.floor(avg / 3600);
            const m = Math.floor((avg % 3600) / 60);
            const s = avg % 60;

            average =
                String(h).padStart(2, "0") + ":" +
                String(m).padStart(2, "0") + ":" +
                String(s).padStart(2, "0");

        }

        document.getElementById("averageHours").innerHTML =
            "⏱ Average Working Hours : " + average;

    }
    catch (error) {

        alert(error.message);

    }

}

// =============================
// LOGOUT
// =============================

document.getElementById("logoutBtn").addEventListener("click", function () {

    sessionStorage.removeItem("adminLoggedIn");

    window.location.href = "adminLogin.html";

});