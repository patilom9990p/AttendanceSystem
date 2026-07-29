import {
    db,
    ref,
    get
} from "./firebase.js";

// =============================
// CHECK ADMIN SESSION
// =============================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {

    alert("Please login first.");

    window.location.href =
        "adminLogin.html";

}

// =============================
// LOAD DASHBOARD
// =============================

loadDashboard();

async function loadDashboard() {

    try {

        // -----------------------------
        // Read Employees
        // -----------------------------

        const empSnapshot =
            await get(
                ref(db, "employees")
            );

        const empData =
            empSnapshot.exists()
                ? empSnapshot.val()
                : {};

        let totalEmployees = 0;
        let employees = 0;
        let interns = 0;
        let disabledAccounts = 0;

        // Store active employee IDs
        const activeEmployeeIDs =
            new Set();

        for (const id in empData) {

            const employee =
                empData[id];

            // Do not include disabled accounts
            if (employee.active === false) {

                disabledAccounts++;

                continue;

            }

            activeEmployeeIDs.add(id);

            totalEmployees++;

            const employeeType =
                String(
                    employee.type || ""
                )
                    .trim()
                    .toLowerCase();

            if (
                employeeType === "employee"
            ) {

                employees++;

            }
            else if (
                employeeType === "intern"
            ) {

                interns++;

            }

        }

        document.getElementById(
            "totalEmployees"
        ).innerHTML =
            "👥 Total Employees : " +
            totalEmployees;

        document.getElementById(
            "employeesCount"
        ).innerHTML =
            "💼 Employees : " +
            employees;

        document.getElementById(
            "internsCount"
        ).innerHTML =
            "🎓 Interns : " +
            interns;

        // Optional disabled account count
        const disabledCountElement =
            document.getElementById(
                "disabledCount"
            );

        if (disabledCountElement) {

            disabledCountElement.innerHTML =
                "🔒 Disabled Accounts : " +
                disabledAccounts;

        }

        // -----------------------------
        // Today's Attendance
        // -----------------------------

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const attSnapshot =
            await get(
                ref(db, "attendance")
            );

        const attendance =
            attSnapshot.exists()
                ? attSnapshot.val()
                : {};

        let present = 0;
        let totalSeconds = 0;
        let completedEmployees = 0;

        for (
            const employeeID
            of activeEmployeeIDs
        ) {

            const todayAttendance =
                attendance[employeeID] &&
                attendance[employeeID][today]
                    ? attendance[employeeID][today]
                    : null;

            if (!todayAttendance) {
                continue;
            }

            const status =
                String(
                    todayAttendance.status || ""
                )
                    .trim()
                    .toLowerCase();

            if (status === "present") {

                present++;

            }

            const workingHours =
                todayAttendance.workingHours;

            if (
                workingHours &&
                workingHours !== ""
            ) {

                const seconds =
                    workingHoursToSeconds(
                        workingHours
                    );

                if (seconds !== null) {

                    totalSeconds +=
                        seconds;

                    completedEmployees++;

                }

            }

        }

        // Only active accounts are counted as absent
        const absent =
            Math.max(
                0,
                totalEmployees - present
            );

        document.getElementById(
            "presentCount"
        ).innerHTML =
            "🟢 Present Today : " +
            present;

        document.getElementById(
            "absentCount"
        ).innerHTML =
            "🔴 Absent Today : " +
            absent;

        // -----------------------------
        // Average Working Hours
        // -----------------------------

        let average =
            "00:00:00";

        if (
            completedEmployees > 0
        ) {

            const averageSeconds =
                Math.floor(
                    totalSeconds /
                    completedEmployees
                );

            average =
                secondsToTime(
                    averageSeconds
                );

        }

        document.getElementById(
            "averageHours"
        ).innerHTML =
            "⏱ Average Working Hours : " +
            average;

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load dashboard.\n\n" +
            error.message
        );

    }

}

// =============================
// WORKING HOURS TO SECONDS
// =============================

function workingHoursToSeconds(
    workingHours
) {

    const parts =
        String(workingHours)
            .split(":")
            .map(Number);

    if (
        parts.length !== 3 ||
        parts.some(Number.isNaN)
    ) {

        return null;

    }

    const hours =
        parts[0];

    const minutes =
        parts[1];

    const seconds =
        parts[2];

    if (
        hours < 0 ||
        minutes < 0 ||
        minutes > 59 ||
        seconds < 0 ||
        seconds > 59
    ) {

        return null;

    }

    return (
        hours * 3600 +
        minutes * 60 +
        seconds
    );

}

// =============================
// SECONDS TO HH:MM:SS
// =============================

function secondsToTime(
    totalSeconds
) {

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (
                totalSeconds % 3600
            ) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        String(hours)
            .padStart(2, "0") +
        ":" +
        String(minutes)
            .padStart(2, "0") +
        ":" +
        String(seconds)
            .padStart(2, "0")
    );

}

// =============================
// LOGOUT
// =============================

document.getElementById(
    "logoutBtn"
).addEventListener(
    "click",
    function () {

        sessionStorage.clear();

        window.location.href =
            "adminLogin.html";

    }
);
