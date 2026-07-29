import {
    db,
    ref,
    get,
    remove
} from "./firebase.js";

// ==============================
// CHECK ADMIN SESSION
// ==============================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "adminLogin.html";
}

// ==============================
// HTML ELEMENTS
// ==============================

const tableBody =
    document.getElementById("tableBody");

const selectedDate =
    document.getElementById("selectedDate");

const searchBox =
    document.getElementById("searchBox");

const companyFilter =
    document.getElementById("companyFilter");

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

companyFilter.addEventListener(
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

        if (row.cells.length < 9) {
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

    const date =
        selectedDate.value;

    const selectedCompany =
        companyFilter.value;

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

        const employees =
            empSnapshot.val();

        // Read attendance
        const attSnapshot = await get(
            ref(db, "attendance")
        );

        const attendance =
            attSnapshot.exists()
                ? attSnapshot.val()
                : {};

        tableBody.innerHTML = "";

        const employeeIDs =
            Object.keys(employees).sort();

        let visibleEmployeeCount = 0;

        for (const empID of employeeIDs) {

            const emp =
                employees[empID];

            // ==========================
            // HIDE DISABLED EMPLOYEES
            // ==========================

            if (emp.active === false) {
                continue;
            }

            const employeeCompany =
                emp.company || "WaveNxD";

            // ==========================
            // COMPANY FILTER
            // ==========================

            if (
                selectedCompany !== "All" &&
                employeeCompany !== selectedCompany
            ) {
                continue;
            }

            visibleEmployeeCount++;

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

                    <td>
                        ${escapeHTML(empID)}
                    </td>

                    <td>
                        ${escapeHTML(
                            emp.name || "--"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            emp.type || "--"
                        )}
                    </td>

                    <td>
                        ${escapeHTML(
                            employeeCompany
                        )}
                    </td>

                    <td>
                        ${escapeHTML(checkIn)}
                    </td>

                    <td>
                        ${escapeHTML(checkOut)}
                    </td>

                    <td>
                        ${escapeHTML(
                            workingHours
                        )}
                    </td>

                    <td>
                        ${escapeHTML(status)}
                    </td>

                    <td>

                        <button
                            onclick="editEmployee('${escapeJavaScript(empID)}')"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            onclick="deleteEmployee('${escapeJavaScript(empID)}')"
                        >
                            🗑 Delete
                        </button>

                    </td>

                </tr>
            `;

        }

        if (visibleEmployeeCount === 0) {

            const companyMessage =
                selectedCompany === "All"
                    ? "No active employees found"
                    : "No active employees found for " +
                      selectedCompany;

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        ${escapeHTML(companyMessage)}
                    </td>
                </tr>
            `;

            return;

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

        alert(
            "Unable to load attendance.\n\n" +
            error.message
        );

    }

}

// ==============================
// EDIT EMPLOYEE
// ==============================

window.editEmployee =
function (empID) {

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
        "Are you sure you want to permanently delete " +
        empID +
        "?\n\n" +
        "Employee data, attendance, leave requests, " +
        "disabled employee records and GPS attempts " +
        "will be deleted.\n\n" +
        "Use Disable Employee Account instead when an " +
        "employee leaves the company."
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

        // Delete disabled employee archive reference
        await remove(
            ref(
                db,
                "disabledEmployees/" + empID
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

// ==============================
// JAVASCRIPT STRING PROTECTION
// ==============================

function escapeJavaScript(value) {

    return String(value)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");

}
