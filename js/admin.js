import { db, ref, get, child } from "./firebase.js";

async function loadDashboard() {

    // Get Employees
    const employeeSnapshot = await get(child(ref(db), "employees"));

    if (!employeeSnapshot.exists()) {
        return;
    }

    const employees = employeeSnapshot.val();

    let totalEmployees = 0;
    let totalInterns = 0;

    for (let id in employees) {

        totalEmployees++;

        if (employees[id].type === "Intern") {
            totalInterns++;
        }

    }

    // Today's Date
    const today = new Date().toISOString().split("T")[0];

    // Get Attendance
    const attendanceSnapshot = await get(child(ref(db), "attendance"));

    let presentToday = 0;

    if (attendanceSnapshot.exists()) {

        const attendance = attendanceSnapshot.val();

        for (let empID in attendance) {

            if (attendance[empID][today]) {
                presentToday++;
            }

        }

    }

    const absentToday = totalEmployees - presentToday;

    // Update Dashboard
    document.getElementById("totalEmployees").innerHTML = totalEmployees;

    document.getElementById("totalInterns").innerHTML = totalInterns;

    document.getElementById("presentToday").innerHTML = presentToday;

    document.getElementById("absentToday").innerHTML = absentToday;

}

loadDashboard();