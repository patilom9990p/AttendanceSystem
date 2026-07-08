import { db, ref, get, remove } from "./firebase.js";

const tableBody = document.getElementById("tableBody");
const selectedDate = document.getElementById("selectedDate");
const searchBox = document.getElementById("searchBox");

// Set today's date
selectedDate.value = new Date().toISOString().split("T")[0];

// Load attendance on page load
loadAttendance();

// Reload when date changes
selectedDate.addEventListener("change", loadAttendance);

// Search Employee
searchBox.addEventListener("keyup", function () {

    const search = searchBox.value.toLowerCase();

    const rows = tableBody.getElementsByTagName("tr");

    for (let row of rows) {

        const employeeId = row.cells[0].innerText.toLowerCase();
        const employeeName = row.cells[1].innerText.toLowerCase();

        if (
            employeeId.includes(search) ||
            employeeName.includes(search)
        ) {
            row.style.display = "";
        } else {
            row.style.display = "none";
        }

    }

});

// =======================
// LOAD ATTENDANCE
// =======================

async function loadAttendance() {

    tableBody.innerHTML = "";

    const date = selectedDate.value;

    try {

        // Read Employees
        const empSnapshot = await get(ref(db, "employees"));

        if (!empSnapshot.exists()) {
            tableBody.innerHTML =
                `<tr><td colspan="8">No Employees Found</td></tr>`;
            return;
        }

        const employees = empSnapshot.val();

        // Read Attendance
        const attSnapshot = await get(ref(db, "attendance"));

        let attendance = {};

        if (attSnapshot.exists()) {
            attendance = attSnapshot.val();
        }

        // Create Table
        for (let empID in employees) {

            const emp = employees[empID];

            let checkIn = "--";
            let checkOut = "--";
            let workingHours = "--";
            let status = "Absent";

            if (
                attendance[empID] &&
                attendance[empID][date]
            ) {

                const data = attendance[empID][date];

                checkIn = data.checkIn || "--";
                checkOut = data.checkOut || "--";
                workingHours = data.workingHours || "--";
                status = data.status || "Present";

            }

            tableBody.innerHTML += `
            <tr>

                <td>${empID}</td>

                <td>${emp.name}</td>

                <td>${emp.type}</td>

                <td>${checkIn}</td>

                <td>${checkOut}</td>

                <td>${workingHours}</td>

                <td>${status}</td>

               <td>
    <button onclick="editEmployee('${empID}')">
        ✏️ Edit
    </button>

    <button onclick="deleteEmployee('${empID}')">
        🗑 Delete
    </button>
</td>

            </tr>
            `;

        }

    }
    catch (error) {

        alert(error.message);

    }

}
window.editEmployee = function (empID) {

    window.location.href = "editEmployee.html?id=" + empID;

};

// =======================
// DELETE EMPLOYEE
// =======================

window.deleteEmployee = async function (empID) {

    const confirmDelete = confirm(
        "Are you sure you want to delete " + empID + " ?"
    );

    if (!confirmDelete) return;

    try {

        // Delete Employee
        await remove(ref(db, "employees/" + empID));

        // Delete Attendance
        await remove(ref(db, "attendance/" + empID));

        alert(empID + " deleted successfully.");

        // Refresh Table
        loadAttendance();

    }
    catch (error) {

        alert(error.message);

    }

};