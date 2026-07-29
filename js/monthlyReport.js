import {
    db,
    ref,
    get
} from "./firebase.js";

// =====================================
// CHECK EMPLOYEE LOGIN
// =====================================

if (
    sessionStorage.getItem("employeeLoggedIn") !== "true"
) {
    window.location.href =
        "employeeLogin.html";
}

const empID =
    sessionStorage.getItem("employeeID");

if (!empID) {

    sessionStorage.clear();

    window.location.href =
        "employeeLogin.html";

}

// =====================================
// HTML ELEMENTS
// =====================================

const monthPicker =
    document.getElementById("monthPicker");

const loadBtn =
    document.getElementById("loadBtn");

const pdfBtn =
    document.getElementById("pdfBtn");

const reportTableBody =
    document.getElementById("reportTableBody");

const employeeNameElement =
    document.getElementById("employeeName");

const employeeIdElement =
    document.getElementById("employeeId");

const employeeTypeElement =
    document.getElementById("employeeType");

const employeeCompanyElement =
    document.getElementById("employeeCompany");

// =====================================
// STORED REPORT DATA
// =====================================

let currentEmployee = null;
let currentReportRows = [];
let currentReportSummary = null;

// =====================================
// DEFAULT MONTH
// =====================================

monthPicker.value =
    new Date()
        .toISOString()
        .slice(0, 7);

// =====================================
// PAGE EVENTS
// =====================================

loadBtn.addEventListener(
    "click",
    loadReport
);

pdfBtn.addEventListener(
    "click",
    generatePDF
);

monthPicker.addEventListener(
    "change",
    function () {

        pdfBtn.disabled = true;

        currentReportRows = [];
        currentReportSummary = null;

    }
);

// =====================================
// LOAD EMPLOYEE PROFILE
// =====================================

async function loadEmployeeProfile() {

    const snapshot =
        await get(
            ref(
                db,
                "employees/" +
                empID
            )
        );

    if (!snapshot.exists()) {

        alert(
            "Employee account not found."
        );

        sessionStorage.clear();

        window.location.href =
            "employeeLogin.html";

        return null;

    }

    const employee =
        snapshot.val();

    if (employee.active === false) {

        alert(
            "Your employee account has been disabled.\n\n" +
            "Please contact the administrator."
        );

        sessionStorage.clear();

        window.location.href =
            "employeeLogin.html";

        return null;

    }

    currentEmployee =
        employee;

    employeeNameElement.textContent =
        "Name : " +
        (employee.name || "--");

    employeeIdElement.textContent =
        "Employee ID : " +
        (
            employee.employeeId ||
            empID
        );

    employeeTypeElement.textContent =
        "Type : " +
        (employee.type || "--");

    employeeCompanyElement.textContent =
        "Company : " +
        (employee.company || "--");

    return employee;

}

// =====================================
// LOAD MONTHLY REPORT
// =====================================

async function loadReport() {

    const month =
        monthPicker.value;

    if (!month) {

        alert(
            "Please select a month."
        );

        return;

    }

    loadBtn.disabled = true;
    pdfBtn.disabled = true;

    loadBtn.textContent =
        "Loading Report...";

    reportTableBody.innerHTML = `
        <tr>
            <td colspan="6">
                Loading monthly attendance...
            </td>
        </tr>
    `;

    try {

        const employee =
            await loadEmployeeProfile();

        if (!employee) {
            return;
        }

        const snapshot =
            await get(
                ref(
                    db,
                    "attendance/" +
                    empID
                )
            );

        const attendance =
            snapshot.exists()
                ? snapshot.val()
                : {};

        const [
            selectedYear,
            selectedMonth
        ] = month
            .split("-")
            .map(Number);

        const daysInMonth =
            new Date(
                selectedYear,
                selectedMonth,
                0
            ).getDate();

        const currentDate =
            new Date();

        const currentDateString =
            formatDateForDatabase(
                currentDate
            );

        currentReportRows = [];

        let totalDays = 0;
        let presentDays = 0;
        let absentDays = 0;
        let leaveDays = 0;
        let totalWorkingSeconds = 0;
        let completedWorkingDays = 0;

        reportTableBody.innerHTML = "";

        for (
            let day = 1;
            day <= daysInMonth;
            day++
        ) {

            const dateObject =
                new Date(
                    selectedYear,
                    selectedMonth - 1,
                    day
                );

            const date =
                formatDateForDatabase(
                    dateObject
                );

            /*
             * Do not include future days of the current
             * month in the attendance calculation.
             */
            if (
                date >
                currentDateString
            ) {
                continue;
            }

            totalDays++;

            const data =
                attendance[date] || null;

            let status =
                "Absent";

            let checkIn =
                "--";

            let checkOut =
                "--";

            let workingHours =
                "--";

            if (data) {

                status =
                    data.status ||
                    "Present";

                checkIn =
                    data.checkIn ||
                    "--";

                checkOut =
                    data.checkOut ||
                    "--";

                workingHours =
                    data.workingHours ||
                    "--";

            }

            const normalisedStatus =
                String(status)
                    .trim()
                    .toLowerCase();

            if (
                normalisedStatus ===
                "present"
            ) {

                presentDays++;

            }
            else if (
                normalisedStatus ===
                "leave"
            ) {

                leaveDays++;

            }
            else {

                absentDays++;

            }

            if (
                data &&
                data.workingHours
            ) {

                const seconds =
                    workingHoursToSeconds(
                        data.workingHours
                    );

                if (
                    seconds !== null
                ) {

                    totalWorkingSeconds +=
                        seconds;

                    completedWorkingDays++;

                }

            }

            const rowData = {

                date:
                    date,

                day:
                    getDayName(
                        dateObject
                    ),

                status:
                    status,

                checkIn:
                    checkIn,

                checkOut:
                    checkOut,

                workingHours:
                    workingHours

            };

            currentReportRows.push(
                rowData
            );

            reportTableBody.innerHTML += `
                <tr>

                    <td>
                        ${escapeHTML(date)}
                    </td>

                    <td>
                        ${escapeHTML(
                            rowData.day
                        )}
                    </td>

                    <td>
                        ${escapeHTML(status)}
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

                </tr>
            `;

        }

        if (
            currentReportRows.length === 0
        ) {

            reportTableBody.innerHTML = `
                <tr>
                    <td colspan="6">
                        No report days found for this month.
                    </td>
                </tr>
            `;

        }

        const attendancePercentage =
            totalDays === 0
                ? "0.00"
                : (
                    (
                        presentDays /
                        totalDays
                    ) *
                    100
                ).toFixed(2);

        let averageWorkingHours =
            "00:00:00";

        if (
            completedWorkingDays > 0
        ) {

            const averageSeconds =
                Math.floor(
                    totalWorkingSeconds /
                    completedWorkingDays
                );

            averageWorkingHours =
                secondsToTime(
                    averageSeconds
                );

        }

        currentReportSummary = {

            month:
                month,

            totalDays:
                totalDays,

            presentDays:
                presentDays,

            absentDays:
                absentDays,

            leaveDays:
                leaveDays,

            attendancePercentage:
                attendancePercentage,

            averageWorkingHours:
                averageWorkingHours

        };

        document.getElementById(
            "workingDays"
        ).textContent =
            "Total Days : " +
            totalDays;

        document.getElementById(
            "presentDays"
        ).textContent =
            "Present : " +
            presentDays;

        document.getElementById(
            "absentDays"
        ).textContent =
            "Absent : " +
            absentDays;

        const leaveDaysElement =
            document.getElementById(
                "leaveDays"
            );

        if (leaveDaysElement) {

            leaveDaysElement.textContent =
                "Leave : " +
                leaveDays;

        }

        document.getElementById(
            "attendancePercent"
        ).textContent =
            "Attendance : " +
            attendancePercentage +
            "%";

        document.getElementById(
            "averageHours"
        ).textContent =
            "Average Working Hours : " +
            averageWorkingHours;

        pdfBtn.disabled =
            currentReportRows.length === 0;

    }
    catch (error) {

        console.error(error);

        reportTableBody.innerHTML = `
            <tr>
                <td colspan="6">
                    Unable to load monthly report.
                </td>
            </tr>
        `;

        alert(
            "Unable to load monthly report.\n\n" +
            error.message
        );

    }
    finally {

        loadBtn.disabled = false;

        loadBtn.textContent =
            "View Report";

    }

}

// =====================================
// GENERATE PDF
// =====================================

function generatePDF() {

    if (
        !currentEmployee ||
        !currentReportSummary ||
        currentReportRows.length === 0
    ) {

        alert(
            "Please load the monthly report first."
        );

        return;

    }

    if (
        typeof window.jspdf ===
        "undefined"
    ) {

        alert(
            "PDF library is not loaded.\n\n" +
            "Please check your internet connection and refresh the page."
        );

        return;

    }

    const {
        jsPDF
    } = window.jspdf;

    const pdf =
        new jsPDF({
            orientation:
                "portrait",

            unit:
                "mm",

            format:
                "a4"
        });

    if (
        typeof pdf.autoTable !==
        "function"
    ) {

        alert(
            "PDF table library is not loaded."
        );

        return;

    }

    const pageWidth =
        pdf.internal
            .pageSize
            .getWidth();

    const companyName =
        currentEmployee.company ||
        "WaveNxD Technologies Pvt. Ltd.";

    const employeeDisplayID =
        currentEmployee.employeeId ||
        empID;

    const reportMonth =
        formatMonthName(
            currentReportSummary.month
        );

    // =====================================
    // TITLE
    // =====================================

    pdf.setFontSize(17);

    pdf.text(
        companyName,
        pageWidth / 2,
        15,
        {
            align: "center"
        }
    );

    pdf.setFontSize(14);

    pdf.text(
        "Monthly Attendance Report",
        pageWidth / 2,
        23,
        {
            align: "center"
        }
    );

    pdf.setFontSize(10);

    pdf.text(
        reportMonth,
        pageWidth / 2,
        30,
        {
            align: "center"
        }
    );

    pdf.line(
        14,
        34,
        pageWidth - 14,
        34
    );

    // =====================================
    // EMPLOYEE DETAILS
    // =====================================

    pdf.autoTable({

        startY: 39,

        head: [
            [
                "Employee Details",
                "Information"
            ]
        ],

        body: [
            [
                "Employee ID",
                employeeDisplayID
            ],
            [
                "Name",
                currentEmployee.name ||
                "--"
            ],
            [
                "Type",
                currentEmployee.type ||
                "--"
            ],
            [
                "Company",
                currentEmployee.company ||
                "--"
            ],
            [
                "College",
                currentEmployee.college ||
                "--"
            ],
            [
                "Report Month",
                reportMonth
            ]
        ],

        theme:
            "grid",

        styles: {
            fontSize: 9,
            cellPadding: 2
        },

        columnStyles: {
            0: {
                cellWidth: 45,
                fontStyle: "bold"
            }
        }

    });

    // =====================================
    // MONTHLY SUMMARY
    // =====================================

    let currentY =
        pdf.lastAutoTable.finalY + 8;

    pdf.setFontSize(12);

    pdf.text(
        "Monthly Summary",
        14,
        currentY
    );

    pdf.autoTable({

        startY:
            currentY + 4,

        head: [
            [
                "Total Days",
                "Present",
                "Absent",
                "Leave",
                "Attendance",
                "Average Hours"
            ]
        ],

        body: [
            [
                currentReportSummary.totalDays,
                currentReportSummary.presentDays,
                currentReportSummary.absentDays,
                currentReportSummary.leaveDays,
                currentReportSummary.attendancePercentage +
                "%",
                currentReportSummary.averageWorkingHours
            ]
        ],

        theme:
            "grid",

        styles: {
            fontSize: 8,
            halign: "center",
            cellPadding: 2
        }

    });

    // =====================================
    // DAILY ATTENDANCE TABLE
    // =====================================

    currentY =
        pdf.lastAutoTable.finalY + 8;

    pdf.setFontSize(12);

    pdf.text(
        "Daily Attendance Details",
        14,
        currentY
    );

    const attendanceRows =
        currentReportRows.map(
            function (row) {

                return [
                    row.date,
                    row.day,
                    row.status,
                    row.checkIn,
                    row.checkOut,
                    row.workingHours
                ];

            }
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
            attendanceRows,

        theme:
            "grid",

        styles: {
            fontSize: 7,
            cellPadding: 1.6,
            overflow: "linebreak",
            halign: "center"
        },

        columnStyles: {
            0: {
                cellWidth: 27
            },
            1: {
                cellWidth: 25
            },
            2: {
                cellWidth: 25
            },
            3: {
                cellWidth: 28
            },
            4: {
                cellWidth: 28
            },
            5: {
                cellWidth: 30
            }
        },

        didDrawPage:
            function () {

                addPageFooter(pdf);

            }

    });

    // =====================================
    // FINAL FOOTER
    // =====================================

    addPageFooterToAllPages(
        pdf
    );

    // =====================================
    // SAVE PDF
    // =====================================

    const fileName =
        safeFileName(
            employeeDisplayID
        ) +
        "_" +
        safeFileName(
            currentEmployee.name ||
            "Employee"
        ) +
        "_" +
        currentReportSummary.month +
        "_Attendance_Report.pdf";

    pdf.save(
        fileName
    );

}

// =====================================
// WORKING HOURS TO SECONDS
// =====================================

function workingHoursToSeconds(
    workingHours
) {

    if (!workingHours) {
        return null;
    }

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
            (
                totalSeconds %
                3600
            ) /
            60
        );

    const seconds =
        totalSeconds %
        60;

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

// =====================================
// DATE TO YYYY-MM-DD
// =====================================

function formatDateForDatabase(
    date
) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );

    return (
        year +
        "-" +
        month +
        "-" +
        day
    );

}

// =====================================
// GET DAY NAME
// =====================================

function getDayName(
    date
) {

    return date.toLocaleDateString(
        "en-US",
        {
            weekday:
                "long"
        }
    );

}

// =====================================
// FORMAT MONTH NAME
// =====================================

function formatMonthName(
    monthValue
) {

    const parts =
        monthValue.split("-");

    const year =
        Number(parts[0]);

    const month =
        Number(parts[1]);

    const date =
        new Date(
            year,
            month - 1,
            1
        );

    return date.toLocaleDateString(
        "en-US",
        {
            month:
                "long",

            year:
                "numeric"
        }
    );

}

// =====================================
// PDF PAGE FOOTER
// =====================================

function addPageFooter(
    pdf
) {

    const pageWidth =
        pdf.internal
            .pageSize
            .getWidth();

    const pageHeight =
        pdf.internal
            .pageSize
            .getHeight();

    const pageNumber =
        pdf.internal
            .getNumberOfPages();

    pdf.setFontSize(8);

    pdf.text(
        "Generated on " +
        new Date()
            .toLocaleString(),
        14,
        pageHeight - 7
    );

    pdf.text(
        "Page " +
        pageNumber,
        pageWidth - 14,
        pageHeight - 7,
        {
            align:
                "right"
        }
    );

}

// =====================================
// ADD FOOTER TO ALL PDF PAGES
// =====================================

function addPageFooterToAllPages(
    pdf
) {

    const totalPages =
        pdf.internal
            .getNumberOfPages();

    const pageWidth =
        pdf.internal
            .pageSize
            .getWidth();

    const pageHeight =
        pdf.internal
            .pageSize
            .getHeight();

    for (
        let page = 1;
        page <= totalPages;
        page++
    ) {

        pdf.setPage(page);

        pdf.setFontSize(8);

        pdf.text(
            "Generated on " +
            new Date()
                .toLocaleString(),
            14,
            pageHeight - 7
        );

        pdf.text(
            "Page " +
            page +
            " of " +
            totalPages,
            pageWidth - 14,
            pageHeight - 7,
            {
                align:
                    "right"
            }
        );

    }

}

// =====================================
// SAFE FILE NAME
// =====================================

function safeFileName(
    value
) {

    return String(value)
        .trim()
        .replace(/\s+/g, "_")
        .replace(
            /[\\/:*?"<>|]/g,
            "_"
        );

}

// =====================================
// BASIC HTML PROTECTION
// =====================================

function escapeHTML(
    value
) {

    return String(value)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );

}

// =====================================
// INITIAL PAGE LOAD
// =====================================

loadReport();
