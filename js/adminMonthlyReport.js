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

loadReport();
async function loadReport() {

    tableBody.innerHTML = "";

    const month = monthPicker.value;

    const empSnapshot = await get(ref(db, "employees"));
    const attSnapshot = await get(ref(db, "attendance"));

    if (!empSnapshot.exists()) return;

    const employees = empSnapshot.val();
    const attendance = attSnapshot.exists() ? attSnapshot.val() : {};

    const [year, monthNum] = month.split("-");
    const totalDays = new Date(parseInt(year), parseInt(monthNum), 0).getDate();

    for (const empID in employees) {

        const emp = employees[empID];

        let present = 0;
let leave = 0;
let totalSeconds = 0;

        for (let day = 1; day <= totalDays; day++) {

            const date =
                month + "-" + String(day).padStart(2, "0");

            if (attendance[empID] && attendance[empID][date]) {

                const record = attendance[empID][date];

               if (record.status === "Present") {

    present++;

    if (record.workingHours) {

        const p = record.workingHours.split(":");

        totalSeconds +=
            parseInt(p[0]) * 3600 +
            parseInt(p[1]) * 60 +
            parseInt(p[2]);

    }

}
else if (record.status === "Leave") {

    leave++;

}

            }

        }

        const absent = totalDays - present - leave;

        const percent =
            ((present / totalDays) * 100).toFixed(2) + "%";

        let average = "--";

        if (present > 0) {

            const avg = Math.floor(totalSeconds / present);

            average =
                String(Math.floor(avg / 3600)).padStart(2, "0") + ":" +
                String(Math.floor((avg % 3600) / 60)).padStart(2, "0") + ":" +
                String(avg % 60).padStart(2, "0");

        }

       tableBody.innerHTML += `
<tr>
    <td>${empID}</td>
    <td>${emp.name}</td>
    <td>${emp.type}</td>
    <td>${present}</td>
    <td>${leave}</td>
    <td>${absent}</td>
    <td>${percent}</td>
    <td>${average}</td>
</tr>`;
    }

}
document.getElementById("exportCSVBtn").addEventListener("click", exportExcel);

async function exportExcel() {

    const month = monthPicker.value;

    const empSnapshot = await get(ref(db, "employees"));
    const attSnapshot = await get(ref(db, "attendance"));

    if (!empSnapshot.exists()) {
        alert("No employees found.");
        return;
    }

    const employees = empSnapshot.val();
    const attendance = attSnapshot.exists() ? attSnapshot.val() : {};
    console.log("Employees:", employees);
console.log("Attendance:", attendance);
console.log("Month:", month);
    let summaryData = [];

    summaryData.push([
    "Employee ID",
    "Name",
    "Type",
    "Present Days",
    "Leave Days",
    "Absent Days",
    "Attendance %",
    "Average Working Hours"
]);

    let dailyData = [];

    dailyData.push([
        "Employee ID",
        "Name",
        "Type",
        "Date",
        "Day",
        "Status",
        "Check In",
        "Check Out",
        "Working Hours"
    ]);

    const [year, monthNum] = month.split("-");

    const totalDays =
        new Date(parseInt(year), parseInt(monthNum), 0).getDate();

    for (const empID in employees) {
        
    console.log("Checking Employee:", empID);
console.log(attendance[empID]);
        const emp = employees[empID];

        let present = 0;
let leave = 0;
let totalSeconds = 0;

        for (let day = 1; day <= totalDays; day++) {

            const date =
                month +
                "-" +
                String(day).padStart(2, "0");

            const jsDate = new Date(date);

            const dayName =
                jsDate.toLocaleDateString("en-US", {
                    weekday: "long"
                });

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

    if (record.workingHours) {

        const p = record.workingHours.split(":");

        totalSeconds +=
            parseInt(p[0]) * 3600 +
            parseInt(p[1]) * 60 +
            parseInt(p[2]);

    }

}
else if (status === "Leave") {

    leave++;

}

            }

            dailyData.push([
                empID,
                emp.name,
                emp.type,
                date,
                dayName,
                status,
                checkIn,
                checkOut,
                workingHours
            ]);

        }

        const absent =
    totalDays - present - leave;

        const attendancePercent =
            ((present / totalDays) * 100).toFixed(2) + "%";

        let average = "--";

        if (present > 0) {

            const avg =
                Math.floor(totalSeconds / present);

            const h =
                Math.floor(avg / 3600);

            const m =
                Math.floor((avg % 3600) / 60);

            const s =
                avg % 60;

            average =
                String(h).padStart(2, "0") + ":" +
                String(m).padStart(2, "0") + ":" +
                String(s).padStart(2, "0");

        }

       summaryData.push([
    empID,
    emp.name,
    emp.type,
    present,
    leave,
    absent,
    attendancePercent,
    average
]);

    }
        // Create Workbook
    const wb = XLSX.utils.book_new();

    // Summary Sheet
    const wsSummary =
        XLSX.utils.aoa_to_sheet(summaryData);

   wsSummary["!cols"] = [
    { wch: 15 }, // Employee ID
    { wch: 25 }, // Name
    { wch: 15 }, // Type
    { wch: 15 }, // Present
    { wch: 15 }, // Leave
    { wch: 15 }, // Absent
    { wch: 15 }, // Attendance %
    { wch: 22 }  // Average Hours
];

    XLSX.utils.book_append_sheet(
        wb,
        wsSummary,
        "Summary"
    );

    // Daily Attendance Sheet
    const wsDaily =
        XLSX.utils.aoa_to_sheet(dailyData);

    wsDaily["!cols"] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 18 }
    ];

    XLSX.utils.book_append_sheet(
        wb,
        wsDaily,
        "Daily Attendance"
    );

    // Download Excel File
    XLSX.writeFile(
        wb,
        `Attendance_Report_${month}.xlsx`
    );

}
