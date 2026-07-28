import {
    db,
    ref,
    get,
    remove
} from "./firebase.js";

const tableBody =
    document.getElementById("tableBody");

const selectedDate =
    document.getElementById("selectedDate");

const searchBox =
    document.getElementById("searchBox");

// ==============================
// SET TODAY'S DATE
// ==============================

selectedDate.value =
    new Date().toISOString().split("T")[0];

// ==============================
// PAGE EVENTS
// ==============================

loadAttendance();

selectedDate.addEventListener(
    "change",
    loadAttendance
);

searchBox.addEventListener(
    "keyup",
    searchEmployees
);

// ==============================
// SEARCH EMPLOYEE
// ==============================

function searchEmployees() {

    const search =
        searchBox.value
            .trim()
            .toLowerCase();

    const rows =
        tableBody.getElementsByTagName("tr");

    for (const row of rows) {

        if (row.cells.length < 4) {
            continue;
        }

        const employeeId =
            row.cells[0].innerText.toLowerCase();

        const employeeName =
            row.cells[1].innerText.toLowerCase();

        const employeeType =
            row.cells[2].innerText.toLowerCase();

        const employeeCompany =
            row.cells[3].innerText.toLowerCase();

        const matched =
            employeeId.includes(search) ||
            employeeName.includes(search) ||
            employeeType.includes(search) ||
            employeeCompany.includes(search);

        row.style.display =
            matched ? "" : "none";

    }

}

// ==============================
// LOAD ATTENDANCE
// ==============================

async function loadAttendance() {

    tableBody.innerHTML = `
        <tr>
            <td colspan="9">
                Loading attendance...
            </td>
        </tr>
    `;

    const date = selectedDate.value;

    try {

        // Read employees
        const empSnapshot = await get(
            ref(db, "employees")
        );

        if (!empSnapshot.exists()) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        No Employees Found
                    </td>
                </tr>
            `;

            return;

        }

        const employees = empSnapshot.val();

        // Read attendance
        const attSnapshot = await get(
            ref(db, "attendance")
        );

        const attendance =
            attSnapshot.exists()
                ? attSnapshot.val()
                : {};

        tableBody.innerHTML = "";

        // Sort IDs alphabetically
        const employeeIDs =
            Object.keys(employees).sort();

        for (const empID of employeeIDs) {

            const emp = employees[empID];

            let checkIn = "--";
            let checkOut = "--";
            let workingHours = "--";
            let status = "Absent";

            if (
                attendance[empID] &&
                attendance[empID][date]
            ) {

                const data =
                    attendance[empID][date];

                checkIn =
                    data.checkIn || "--";

                checkOut =
                    data.checkOut || "--";

                workingHours =
                    data.workingHours || "--";

                status =
                    data.status || "Present";

            }

            tableBody.innerHTML += `
                <tr>

                    <td>${escapeHTML(empID)}</td>

                    <td>
                        ${escapeHTML(emp.name || "--")}
                    </td>

                    <td>
                        ${escapeHTML(emp.type || "--")}
                    </td>

                    <td>
                        ${escapeHTML(emp.company || "--")}
                    </td>

                    <td>${escapeHTML(checkIn)}</td>

                    <td>${escapeHTML(checkOut)}</td>

                    <td>
                        ${escapeHTML(workingHours)}
                    </td>

                    <td>${escapeHTML(status)}</td>

                    <td>

                        <button
                            onclick="editEmployee('${empID}')"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            onclick="deleteEmployee('${empID}')"
                        >
                            🗑 Delete
                        </button>

                    </td>

                </tr>
            `;

        }

        searchEmployees();

    }
    catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Unable to load attendance.
                </td>
            </tr>
        `;

        alert(error.message);

    }

}

// ==============================
// EDIT EMPLOYEE
// ==============================

window.editEmployee = function (empID) {

    window.location.href =
        "editEmployee.html?id=" +
        encodeURIComponent(empID);

};

// ==============================
// DELETE EMPLOYEE
// ==============================

window.deleteEmployee =
async function (empID) {

    const confirmDelete = confirm(
        "Are you sure you want to delete " +
        empID +
        "?\n\n" +
        "Employee data, attendance, leave requests " +
        "and GPS attempt records will be deleted."
    );

    if (!confirmDelete) {
        return;
    }

    try {

        // Delete employee
        await remove(
            ref(db, "employees/" + empID)
        );

        // Delete attendance
        await remove(
            ref(db, "attendance/" + empID)
        );

        // Delete leave requests
        await remove(
            ref(db, "leaveRequests/" + empID)
        );

        // Delete unauthorized GPS attempts
        await remove(
            ref(
                db,
                "unauthorizedAttempts/" + empID
            )
        );

        alert(
            empID +
            " deleted successfully."
        );

        loadAttendance();

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to delete employee.\n\n" +
            error.message
        );

    }

};

// ==============================
// BASIC HTML PROTECTION
// ==============================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}
