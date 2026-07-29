import {
    db,
    ref,
    get,
    update
} from "./firebase.js";

// =====================================
// CHECK ADMIN SESSION
// =====================================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "adminLogin.html";
}

// =====================================
// HTML ELEMENTS
// =====================================

const companyFilter =
    document.getElementById("companyFilter");

const employeeSelect =
    document.getElementById("employeeSelect");

const exitDate =
    document.getElementById("exitDate");

const exitReason =
    document.getElementById("exitReason");

const disableBtn =
    document.getElementById("disableBtn");

const statusMessage =
    document.getElementById("statusMessage");

const displayEmployeeId =
    document.getElementById("displayEmployeeId");

const displayName =
    document.getElementById("displayName");

const displayType =
    document.getElementById("displayType");

const displayCompany =
    document.getElementById("displayCompany");

const displayStatus =
    document.getElementById("displayStatus");

// =====================================
// LOCAL EMPLOYEE DATA
// =====================================

let allEmployees = {};

// =====================================
// SET TODAY AS DEFAULT EXIT DATE
// =====================================

exitDate.value =
    new Date().toISOString().split("T")[0];

// =====================================
// PAGE EVENTS
// =====================================

companyFilter.addEventListener(
    "change",
    loadCompanyEmployees
);

employeeSelect.addEventListener(
    "change",
    displaySelectedEmployee
);

disableBtn.addEventListener(
    "click",
    generatePdfAndDisable
);

// =====================================
// LOAD ALL EMPLOYEES
// =====================================

async function loadEmployees() {

    try {

        const snapshot = await get(
            ref(db, "employees")
        );

        if (!snapshot.exists()) {

            statusMessage.textContent =
                "No employees found.";

            return;
        }

        allEmployees =
            snapshot.val();

    }
    catch (error) {

        console.error(error);

        statusMessage.textContent =
            "Unable to load employees.";

        alert(
            "Unable to load employees.\n\n" +
            error.message
        );

    }

}

// =====================================
// LOAD EMPLOYEES BY COMPANY
// =====================================

function loadCompanyEmployees() {

    const selectedCompany =
        companyFilter.value;

    employeeSelect.innerHTML = "";

    clearEmployeeDetails();

    disableBtn.disabled = true;

    if (!selectedCompany) {

        employeeSelect.disabled = true;

        employeeSelect.innerHTML = `
            <option value="">
                First select a company
            </option>
        `;

        return;

    }

    employeeSelect.disabled = false;

    employeeSelect.innerHTML = `
        <option value="">
            Select Employee / Intern
        </option>
    `;

    const employeeIDs =
        Object.keys(allEmployees).sort();

    let employeeCount = 0;

    for (const employeeID of employeeIDs) {

        const employee =
            allEmployees[employeeID];

        const employeeCompany =
            employee.company || "WaveNxD";

        // Show only selected company
        if (
            employeeCompany !== selectedCompany
        ) {
            continue;
        }

        // Do not show already disabled accounts
        if (employee.active === false) {
            continue;
        }

        const option =
            document.createElement("option");

        option.value =
            employeeID;

        option.textContent =
            employeeID +
            " - " +
            (employee.name || "Unknown") +
            " (" +
            (employee.type || "Employee") +
            ")";

        employeeSelect.appendChild(option);

        employeeCount++;

    }

    if (employeeCount === 0) {

        employeeSelect.innerHTML = `
            <option value="">
                No active employees found
            </option>
        `;

        employeeSelect.disabled = true;

    }

}

// =====================================
// DISPLAY SELECTED EMPLOYEE
// =====================================

function displaySelectedEmployee() {

    const employeeID =
        employeeSelect.value;

    clearEmployeeDetails();

    if (
        !employeeID ||
        !allEmployees[employeeID]
    ) {

        disableBtn.disabled = true;

        return;

    }

    const employee =
        allEmployees[employeeID];

    displayEmployeeId.textContent =
        employeeID;

    displayName.textContent =
        employee.name || "--";

    displayType.textContent =
        employee.type || "--";

    displayCompany.textContent =
        employee.company || "--";

    displayStatus.textContent =
        employee.active === false
            ? "Disabled"
            : "Active";

    disableBtn.disabled =
        employee.active === false;

}

// =====================================
// CLEAR EMPLOYEE DETAILS
// =====================================

function clearEmployeeDetails() {

    displayEmployeeId.textContent = "--";
    displayName.textContent = "--";
    displayType.textContent = "--";
    displayCompany.textContent = "--";
    displayStatus.textContent = "--";

}

// =====================================
// GENERATE PDF AND DISABLE
// =====================================

async function generatePdfAndDisable() {

    const employeeID =
        employeeSelect.value;

    const selectedExitDate =
        exitDate.value;

    const selectedReason =
        exitReason.value.trim();

    if (!employeeID) {

        alert(
            "Please select an employee."
        );

        return;

    }

    if (!selectedExitDate) {

        alert(
            "Please select the employee exit date."
        );

        return;

    }

    if (!selectedReason) {

        alert(
            "Please enter the reason for leaving."
        );

        return;

    }

    if (
        !allEmployees[employeeID]
    ) {

        alert(
            "Employee information not found."
        );

        return;

    }

    if (
        allEmployees[employeeID].active === false
    ) {

        alert(
            "This employee account is already disabled."
        );

        return;

    }

    if (
        typeof window.jspdf === "undefined"
    ) {

        alert(
            "PDF library is not loaded. " +
            "Please refresh the page."
        );

        return;

    }

    const confirmed = confirm(
        "Generate the complete PDF record and disable " +
        employeeID +
        "?\n\n" +
        "The employee will no longer be able to log in " +
        "or appear in active employee lists."
    );

    if (!confirmed) {
        return;
    }

    disableBtn.disabled = true;

    disableBtn.textContent =
        "⏳ Generating PDF...";

    statusMessage.textContent =
        "Collecting employee records...";

    try {

        const employee =
            allEmployees[employeeID];

        // Read attendance
        const attendanceSnapshot =
            await get(
                ref(
                    db,
                    "attendance/" +
                    employeeID
                )
            );

        const attendance =
            attendanceSnapshot.exists()
                ? attendanceSnapshot.val()
                : {};

        // Read leave requests
        const leaveSnapshot =
            await get(
                ref(
                    db,
                    "leaveRequests/" +
                    employeeID
                )
            );

        const leaveRequests =
            leaveSnapshot.exists()
                ? leaveSnapshot.val()
                : {};

        // Read GPS attempts
        const gpsSnapshot =
            await get(
                ref(
                    db,
                    "unauthorizedAttempts/" +
                    employeeID
                )
            );

        const gpsAttempts =
            gpsSnapshot.exists()
                ? gpsSnapshot.val()
                : {};

        statusMessage.textContent =
            "Generating employee PDF record...";

        generateEmployeePdf(
            employeeID,
            employee,
            attendance,
            leaveRequests,
            gpsAttempts,
            selectedExitDate,
            selectedReason
        );

        statusMessage.textContent =
            "Disabling employee account...";

        const disabledTime =
            new Date().toISOString();

        // Disable employee account
        await update(
            ref(
                db,
                "employees/" +
                employeeID
            ),
            {
                active: false,

                exitDate:
                    selectedExitDate,

                disabledReason:
                    selectedReason,

                disabledAt:
                    disabledTime,

                disabledBy:
                    "Admin",

                accountStatus:
                    "Disabled"
            }
        );

        // Keep a separate archived employee reference
        await update(
            ref(
                db,
                "disabledEmployees/" +
                employeeID
            ),
            {
                employeeId:
                    employeeID,

                name:
                    employee.name || "--",

                type:
                    employee.type || "--",

                company:
                    employee.company || "--",

                exitDate:
                    selectedExitDate,

                disabledReason:
                    selectedReason,

                disabledAt:
                    disabledTime,

                disabledBy:
                    "Admin"
            }
        );

        allEmployees[employeeID].active =
            false;

        allEmployees[employeeID].exitDate =
            selectedExitDate;

        allEmployees[employeeID].disabledReason =
            selectedReason;

        statusMessage.textContent =
            employeeID +
            " has been disabled successfully.";

        alert(
            "PDF generated and employee account " +
            "disabled successfully."
        );

        exitReason.value = "";

        loadCompanyEmployees();

    }
    catch (error) {

        console.error(error);

        statusMessage.textContent =
            "Unable to disable employee.";

        alert(
            "Unable to generate PDF or disable account.\n\n" +
            error.message
        );

    }
    finally {

        disableBtn.disabled = false;

        disableBtn.textContent =
            "📄 Generate PDF and Disable Account";

    }

}

// =====================================
// GENERATE EMPLOYEE PDF
// =====================================

function generateEmployeePdf(
    employeeID,
    employee,
    attendance,
    leaveRequests,
    gpsAttempts,
    selectedExitDate,
    selectedReason
) {

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: "a4"
        });

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    // =====================================
    // PDF TITLE
    // =====================================

    pdf.setFontSize(18);

    pdf.text(
        employee.company ||
        "Employee Attendance System",
        pageWidth / 2,
        15,
        {
            align: "center"
        }
    );

    pdf.setFontSize(14);

    pdf.text(
        "Employee Exit and Attendance Record",
        pageWidth / 2,
        23,
        {
            align: "center"
        }
    );

    pdf.setFontSize(9);

    pdf.text(
        "Generated: " +
        new Date().toLocaleString(),
        pageWidth / 2,
        29,
        {
            align: "center"
        }
    );

    pdf.line(
        14,
        33,
        pageWidth - 14,
        33
    );

    // =====================================
    // EMPLOYEE DETAILS
    // =====================================

    pdf.setFontSize(13);

    pdf.text(
        "Employee Details",
        14,
        41
    );

    const employeeDetails = [
        [
            "Employee ID",
            employeeID
        ],
        [
            "Name",
            employee.name || "--"
        ],
        [
            "Type",
            employee.type || "--"
        ],
        [
            "Company",
            employee.company || "--"
        ],
        [
            "College",
            employee.college || "--"
        ],
        [
            "Joining Date",
            employee.joiningDate ||
            employee.createdAt ||
            "--"
        ],
        [
            "Exit Date",
            selectedExitDate
        ],
        [
            "Reason for Leaving",
            selectedReason
        ],
        [
            "Account Status",
            "Disabled"
        ]
    ];

    pdf.autoTable({

        startY: 45,

        head: [
            [
                "Field",
                "Information"
            ]
        ],

        body:
            employeeDetails,

        theme:
            "grid",

        styles: {
            fontSize: 9,
            cellPadding: 2
        },

        headStyles: {
            fontStyle: "bold"
        },

        columnStyles: {
            0: {
                cellWidth: 45,
                fontStyle: "bold"
            }
        }

    });

    // =====================================
    // ATTENDANCE SUMMARY
    // =====================================

    const attendanceRecords =
        Object.keys(attendance)
            .map(date => ({
                date,
                ...attendance[date]
            }))
            .sort(
                (a, b) =>
                    a.date.localeCompare(b.date)
            );

    let presentDays = 0;
    let leaveDays = 0;
    let absentDays = 0;
    let totalWorkingSeconds = 0;

    for (const record of attendanceRecords) {

        const status =
            record.status || "Present";

        if (status === "Present") {

            presentDays++;

            totalWorkingSeconds +=
                workingHoursToSeconds(
                    record.workingHours
                );

        }
        else if (status === "Leave") {

            leaveDays++;

        }
        else if (status === "Absent") {

            absentDays++;

        }

    }

    let currentY =
        pdf.lastAutoTable.finalY + 9;

    pdf.setFontSize(13);

    pdf.text(
        "Attendance Summary",
        14,
        currentY
    );

    pdf.autoTable({

        startY:
            currentY + 4,

        head: [
            [
                "Total Records",
                "Present",
                "Leave",
                "Absent",
                "Total Working Hours"
            ]
        ],

        body: [
            [
                attendanceRecords.length,
                presentDays,
                leaveDays,
                absentDays,
                secondsToTime(
                    totalWorkingSeconds
                )
            ]
        ],

        theme:
            "grid",

        styles: {
            fontSize: 8,
            halign: "center"
        }

    });

    // =====================================
    // DAILY ATTENDANCE
    // =====================================

    currentY =
        pdf.lastAutoTable.finalY + 9;

    pdf.setFontSize(13);

    pdf.text(
        "Daily Attendance Records",
        14,
        currentY
    );

    const attendanceRows =
        attendanceRecords.map(
            record => [

                record.date || "--",

                getDayName(
                    record.date
                ),

                record.status ||
                "Present",

                record.checkIn ||
                "--",

                record.checkOut ||
                "--",

                record.workingHours ||
                "--"

            ]
        );

    pdf.autoTable({

        startY:
            currentY + 4,

        head: [
            [
                "Date",
                "Day",
                "Status",
                "Check In",
                "Check Out",
                "Working Hours"
            ]
        ],

        body:
            attendanceRows.length > 0
                ? attendanceRows
                : [
                    [
                        "--",
                        "--",
                        "No Attendance Records",
                        "--",
                        "--",
                        "--"
                    ]
                ],

        theme:
            "grid",

        styles: {
            fontSize: 7,
            cellPadding: 1.6,
            overflow: "linebreak"
        },

        headStyles: {
            fontStyle: "bold"
        },

        didDrawPage: function () {

            addPageNumber(pdf);

        }

    });

    // =====================================
    // LEAVE REQUESTS
    // =====================================

    currentY =
        pdf.lastAutoTable.finalY + 9;

    if (currentY > 260) {

        pdf.addPage();

        currentY = 18;

    }

    pdf.setFontSize(13);

    pdf.text(
        "Leave Request Records",
        14,
        currentY
    );

    const leaveRows =
        Object.keys(leaveRequests)
            .map(requestID => {

                const request =
                    leaveRequests[requestID];

                return [
                    request.leaveDate || "--",
                    request.reason || "--",
                    request.status || "Pending",
                    request.approvedTime ||
                    request.rejectedTime ||
                    "--"
                ];

            })
            .sort(
                (a, b) =>
                    String(a[0]).localeCompare(
                        String(b[0])
                    )
            );

    pdf.autoTable({

        startY:
            currentY + 4,

        head: [
            [
                "Leave Date",
                "Reason",
                "Status",
                "Decision Time"
            ]
        ],

        body:
            leaveRows.length > 0
                ? leaveRows
                : [
                    [
                        "--",
                        "No Leave Requests",
                        "--",
                        "--"
                    ]
                ],

        theme:
            "grid",

        styles: {
            fontSize: 7,
            cellPadding: 1.8,
            overflow: "linebreak"
        },

        columnStyles: {
            1: {
                cellWidth: 70
            }
        },

        didDrawPage: function () {

            addPageNumber(pdf);

        }

    });

    // =====================================
    // GPS ATTEMPTS
    // =====================================

    currentY =
        pdf.lastAutoTable.finalY + 9;

    if (currentY > 250) {

        pdf.addPage();

        currentY = 18;

    }

    pdf.setFontSize(13);

    pdf.text(
        "Unauthorised GPS Attempt Records",
        14,
        currentY
    );

    const gpsRows =
        createGpsRows(
            gpsAttempts
        );

    pdf.autoTable({

        startY:
            currentY + 4,

        head: [
            [
                "Date / Time",
                "Latitude",
                "Longitude",
                "Details"
            ]
        ],

        body:
            gpsRows.length > 0
                ? gpsRows
                : [
                    [
                        "--",
                        "--",
                        "--",
                        "No unauthorised GPS attempts"
                    ]
                ],

        theme:
            "grid",

        styles: {
            fontSize: 7,
            cellPadding: 1.8,
            overflow: "linebreak"
        },

        didDrawPage: function () {

            addPageNumber(pdf);

        }

    });

    // =====================================
    // FINAL DECLARATION
    // =====================================

    currentY =
        pdf.lastAutoTable.finalY + 10;

    if (currentY > 250) {

        pdf.addPage();

        currentY = 20;

    }

    pdf.setFontSize(10);

    const declaration =
        "This document contains the stored employment, " +
        "attendance, leave and security records of " +
        employeeID +
        ". The account was disabled after generation " +
        "of this report.";

    const declarationLines =
        pdf.splitTextToSize(
            declaration,
            pageWidth - 28
        );

    pdf.text(
        declarationLines,
        14,
        currentY
    );

    addPageNumber(pdf);

    // =====================================
    // DOWNLOAD PDF
    // =====================================

    const safeCompany =
        safeFileName(
            employee.company ||
            "Company"
        );

    const safeEmployeeID =
        safeFileName(
            employeeID
        );

    const safeName =
        safeFileName(
            employee.name ||
            "Employee"
        );

    const fileName =
        safeCompany +
        "_" +
        safeEmployeeID +
        "_" +
        safeName +
        "_Exit_Record.pdf";

    pdf.save(fileName);

}

// =====================================
// CREATE GPS TABLE ROWS
// =====================================

function createGpsRows(gpsAttempts) {

    const rows = [];

    function readAttempt(
        attempt,
        attemptID
    ) {

        if (
            !attempt ||
            typeof attempt !== "object"
        ) {
            return;
        }

        const dateTime =
            attempt.dateTime ||
            attempt.timestamp ||
            attempt.time ||
            attempt.date ||
            attemptID ||
            "--";

        const latitude =
            attempt.latitude ||
            attempt.lat ||
            "--";

        const longitude =
            attempt.longitude ||
            attempt.lng ||
            attempt.lon ||
            "--";

        const details =
            attempt.reason ||
            attempt.message ||
            attempt.details ||
            "Unauthorised attendance attempt";

        rows.push([
            formatTimestamp(dateTime),
            latitude,
            longitude,
            details
        ]);

    }

    for (const key in gpsAttempts) {

        const value =
            gpsAttempts[key];

        if (
            value &&
            typeof value === "object" &&
            (
                value.latitude !== undefined ||
                value.lat !== undefined ||
                value.timestamp !== undefined ||
                value.dateTime !== undefined
            )
        ) {

            readAttempt(
                value,
                key
            );

        }
        else if (
            value &&
            typeof value === "object"
        ) {

            for (const childKey in value) {

                readAttempt(
                    value[childKey],
                    childKey
                );

            }

        }

    }

    return rows;

}

// =====================================
// WORKING HOURS TO SECONDS
// =====================================

function workingHoursToSeconds(
    workingHours
) {

    if (!workingHours) {
        return 0;
    }

    const parts =
        String(workingHours)
            .split(":")
            .map(Number);

    if (
        parts.length < 2 ||
        parts.some(Number.isNaN)
    ) {
        return 0;
    }

    const hours =
        parts[0] || 0;

    const minutes =
        parts[1] || 0;

    const seconds =
        parts[2] || 0;

    return (
        hours * 3600 +
        minutes * 60 +
        seconds
    );

}

// =====================================
// SECONDS TO HH:MM:SS
// =====================================

function secondsToTime(
    totalSeconds
) {

    const hours =
        Math.floor(
            totalSeconds / 3600
        );

    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );

    const seconds =
        totalSeconds % 60;

    return (
        String(hours).padStart(2, "0") +
        ":" +
        String(minutes).padStart(2, "0") +
        ":" +
        String(seconds).padStart(2, "0")
    );

}

// =====================================
// GET DAY NAME
// =====================================

function getDayName(dateString) {

    if (!dateString) {
        return "--";
    }

    const parts =
        dateString.split("-");

    if (parts.length !== 3) {
        return "--";
    }

    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "--";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            weekday: "long"
        }
    );

}

// =====================================
// FORMAT TIMESTAMP
// =====================================

function formatTimestamp(value) {

    if (!value) {
        return "--";
    }

    if (
        typeof value === "number"
    ) {

        const date =
            new Date(value);

        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {
            return date.toLocaleString();
        }

    }

    return String(value);

}

// =====================================
// ADD PDF PAGE NUMBER
// =====================================

function addPageNumber(pdf) {

    const pageNumber =
        pdf.internal.getNumberOfPages();

    const pageWidth =
        pdf.internal.pageSize.getWidth();

    const pageHeight =
        pdf.internal.pageSize.getHeight();

    pdf.setFontSize(8);

    pdf.text(
        "Page " + pageNumber,
        pageWidth - 14,
        pageHeight - 8,
        {
            align: "right"
        }
    );

}

// =====================================
// SAFE FILE NAME
// =====================================

function safeFileName(value) {

    return String(value)
        .trim()
        .replaceAll(" ", "_")
        .replace(/[\\/:*?"<>|]/g, "_");

}

// =====================================
// INITIAL PAGE LOAD
// =====================================

loadEmployees();