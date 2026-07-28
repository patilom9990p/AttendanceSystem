import {
    db,
    ref,
    get
} from "./firebase.js";

// ==============================
// CHECK ADMIN LOGIN
// ==============================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "adminLogin.html";
}

// ==============================
// HTML ELEMENTS
// ==============================

const monthPicker =
    document.getElementById("monthPicker");

const companyFilter =
    document.getElementById("companyFilter");

const tableBody =
    document.getElementById("reportBody");

const loadBtn =
    document.getElementById("loadBtn");

const exportExcelBtn =
    document.getElementById("exportCSVBtn");

// ==============================
// CURRENT MONTH
// ==============================

monthPicker.value =
    new Date().toISOString().slice(0, 7);

// ==============================
// PAGE EVENTS
// ==============================

loadBtn.addEventListener(
    "click",
    loadReport
);

exportExcelBtn.addEventListener(
    "click",
    exportExcel
);

companyFilter.addEventListener(
    "change",
    loadReport
);

monthPicker.addEventListener(
    "change",
    loadReport
);

loadReport();

// ==============================
// LOAD MONTHLY REPORT
// ==============================

async function loadReport() {

    const month =
        monthPicker.value;

    const selectedCompany =
        companyFilter.value;

    if (!month) {

        alert("Please select a month.");

        return;
    }

    tableBody.innerHTML = `
        <tr>
            <td colspan="9">
                Loading report...
            </td>
        </tr>
    `;

    try {

        const empSnapshot = await get(
            ref(db, "employees")
        );

        const attSnapshot = await get(
            ref(db, "attendance")
        );

        if (!empSnapshot.exists()) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        No employees found.
                    </td>
                </tr>
            `;

            return;
        }

        const employees =
            empSnapshot.val();

        const attendance =
            attSnapshot.exists()
                ? attSnapshot.val()
                : {};

        const [year, monthNum] =
            month.split("-");

        const totalDays =
            new Date(
                Number(year),
                Number(monthNum),
                0
            ).getDate();

        tableBody.innerHTML = "";

        let employeeCount = 0;

        const employeeIDs =
            Object.keys(employees).sort();

        for (const empID of employeeIDs) {

            const emp =
                employees[empID];

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

            employeeCount++;

            let present = 0;
            let leave = 0;
            let totalSeconds = 0;

            for (
                let day = 1;
                day <= totalDays;
                day++
            ) {

                const date =
                    month +
                    "-" +
                    String(day).padStart(2, "0");

                if (
                    attendance[empID] &&
                    attendance[empID][date]
                ) {

                    const record =
                        attendance[empID][date];

                    const status =
                        record.status || "Present";

                    if (status === "Present") {

                        present++;

                        totalSeconds +=
                            workingHoursToSeconds(
                                record.workingHours
                            );

                    }
                    else if (status === "Leave") {

                        leave++;

                    }

                }

            }

            const absent =
                Math.max(
                    0,
                    totalDays - present - leave
                );

            const percent =
                (
                    (present / totalDays) *
                    100
                ).toFixed(2) + "%";

            const average =
                present > 0
                    ? secondsToTime(
                        Math.floor(
                            totalSeconds / present
                        )
                    )
                    : "--";

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

                    <td>${present}</td>

                    <td>${leave}</td>

                    <td>${absent}</td>

                    <td>
                        ${escapeHTML(percent)}
                    </td>

                    <td>
                        ${escapeHTML(average)}
                    </td>

                </tr>
            `;

        }

        if (employeeCount === 0) {

            const message =
                selectedCompany === "All"
                    ? "No employees found."
                    : "No employees found for " +
                      selectedCompany + ".";

            tableBody.innerHTML = `
                <tr>
                    <td colspan="9">
                        ${escapeHTML(message)}
                    </td>
                </tr>
            `;

        }

    }
    catch (error) {

        console.error(error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="9">
                    Unable to load monthly report.
                </td>
            </tr>
        `;

        alert(
            "Unable to load report.\n\n" +
            error.message
        );

    }

}

// ==============================
// EXPORT EXCEL
// ==============================

async function exportExcel() {

    const month =
        monthPicker.value;

    const selectedCompany =
        companyFilter.value;

    if (!month) {

        alert("Please select a month.");

        return;
    }

    if (typeof XLSX === "undefined") {

        alert(
            "Excel library is not loaded. " +
            "Please refresh the page."
        );

        return;
    }

    exportExcelBtn.disabled = true;
    exportExcelBtn.textContent =
        "⏳ Generating Excel...";

    try {

        const empSnapshot = await get(
            ref(db, "employees")
        );

        const attSnapshot = await get(
            ref(db, "attendance")
        );

        if (!empSnapshot.exists()) {

            alert("No employees found.");

            return;
        }

        const employees =
            empSnapshot.val();

        const attendance =
            attSnapshot.exists()
                ? attSnapshot.val()
                : {};

        const [year, monthNum] =
            month.split("-");

        const totalDays =
            new Date(
                Number(year),
                Number(monthNum),
                0
            ).getDate();

        const summaryData = [
            [
                "Employee ID",
                "Name",
                "Type",
                "Company",
                "Present Days",
                "Leave Days",
                "Absent Days",
                "Attendance %",
                "Average Working Hours"
            ]
        ];

        const dailyData = [
            [
                "Employee ID",
                "Name",
                "Type",
                "Company",
                "Date",
                "Day",
                "Status",
                "Check In",
                "Check Out",
                "Working Hours"
            ]
        ];

        let employeeCount = 0;

        const employeeIDs =
            Object.keys(employees).sort();

        for (const empID of employeeIDs) {

            const emp =
                employees[empID];

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

            employeeCount++;

            let present = 0;
            let leave = 0;
            let totalSeconds = 0;

            for (
                let day = 1;
                day <= totalDays;
                day++
            ) {

                const date =
                    month +
                    "-" +
                    String(day).padStart(2, "0");

                const jsDate =
                    new Date(
                        Number(year),
                        Number(monthNum) - 1,
                        day
                    );

                const dayName =
                    jsDate.toLocaleDateString(
                        "en-US",
                        {
                            weekday: "long"
                        }
                    );

                let status = "Absent";
                let checkIn = "--";
                let checkOut = "--";
                let workingHours = "--";

                if (
                    attendance[empID] &&
                    attendance[empID][date]
                ) {

                    const record =
                        attendance[empID][date];

                    status =
                        record.status || "Present";

                    checkIn =
                        record.checkIn || "--";

                    checkOut =
                        record.checkOut || "--";

                    workingHours =
                        record.workingHours || "--";

                    if (status === "Present") {

                        present++;

                        totalSeconds +=
                            workingHoursToSeconds(
                                record.workingHours
                            );

                    }
                    else if (status === "Leave") {

                        leave++;

                    }

                }

                dailyData.push([
                    empID,
                    emp.name || "--",
                    emp.type || "--",
                    employeeCompany,
                    date,
                    dayName,
                    status,
                    checkIn,
                    checkOut,
                    workingHours
                ]);

            }

            const absent =
                Math.max(
                    0,
                    totalDays - present - leave
                );

            const attendancePercent =
                (
                    (present / totalDays) *
                    100
                ).toFixed(2) + "%";

            const average =
                present > 0
                    ? secondsToTime(
                        Math.floor(
                            totalSeconds / present
                        )
                    )
                    : "--";

            summaryData.push([
                empID,
                emp.name || "--",
                emp.type || "--",
                employeeCompany,
                present,
                leave,
                absent,
                attendancePercent,
                average
            ]);

        }

        if (employeeCount === 0) {

            alert(
                selectedCompany === "All"
                    ? "No employees found."
                    : "No employees found for " +
                      selectedCompany + "."
            );

            return;
        }

        // ==========================
        // CREATE WORKBOOK
        // ==========================

        const workbook =
            XLSX.utils.book_new();

        // Summary sheet
        const summarySheet =
            XLSX.utils.aoa_to_sheet(
                summaryData
            );

        summarySheet["!cols"] = [
            { wch: 18 },
            { wch: 25 },
            { wch: 15 },
            { wch: 18 },
            { wch: 15 },
            { wch: 15 },
            { wch: 15 },
            { wch: 16 },
            { wch: 24 }
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            summarySheet,
            "Summary"
        );

        // Daily attendance sheet
        const dailySheet =
            XLSX.utils.aoa_to_sheet(
                dailyData
            );

        dailySheet["!cols"] = [
            { wch: 18 },
            { wch: 25 },
            { wch: 15 },
            { wch: 18 },
            { wch: 14 },
            { wch: 14 },
            { wch: 14 },
            { wch: 14 },
            { wch: 14 },
            { wch: 20 }
        ];

        XLSX.utils.book_append_sheet(
            workbook,
            dailySheet,
            "Daily Attendance"
        );

        // ==========================
        // FILE NAME
        // ==========================

        const companyFileName =
            selectedCompany === "All"
                ? "All_Companies"
                : selectedCompany
                    .replaceAll(" ", "_")
                    .replaceAll("/", "_");

        const fileName =
            companyFileName +
            "_Attendance_Report_" +
            month +
            ".xlsx";

        XLSX.writeFile(
            workbook,
            fileName
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to export Excel file.\n\n" +
            error.message
        );

    }
    finally {

        exportExcelBtn.disabled = false;

        exportExcelBtn.textContent =
            "📥 Export Excel";

    }

}

// ==============================
// WORKING HOURS TO SECONDS
// ==============================

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

// ==============================
// SECONDS TO HH:MM:SS
// ==============================

function secondsToTime(totalSeconds) {

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
