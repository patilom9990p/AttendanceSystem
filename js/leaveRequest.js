import { db, ref, get, set, push } from "./firebase.js";

// Check Employee Login
if (sessionStorage.getItem("employeeLoggedIn") !== "true") {
    window.location.href = "employeeLogin.html";
}

const empID = sessionStorage.getItem("employeeID");

const leaveDate = document.getElementById("leaveDate");
const reason = document.getElementById("reason");
const submitBtn = document.getElementById("submitBtn");
const requestTable = document.getElementById("requestTable");

// Prevent selecting past dates
const today = new Date().toISOString().split("T")[0];
leaveDate.min = today;

// =============================
// Submit Leave Request
// =============================
submitBtn.onclick = async () => {

    if (leaveDate.value === "") {
        alert("Please select leave date.");
        return;
    }

    if (reason.value.trim() === "") {
        alert("Please enter reason.");
        return;
    }

    // Employee Details
    const empSnapshot = await get(ref(db, "employees/" + empID));

    if (!empSnapshot.exists()) {
        alert("Employee not found.");
        return;
    }

    const employee = empSnapshot.val();

    // Check Duplicate Leave Request
    const reqSnapshot = await get(ref(db, "leaveRequests/" + empID));

    if (reqSnapshot.exists()) {

        const requests = reqSnapshot.val();

        for (const id in requests) {

            if (requests[id].leaveDate === leaveDate.value) {

                alert("Leave request already submitted for this date.");

                return;
            }
        }
    }

    const requestRef = push(ref(db, "leaveRequests/" + empID));

    const now = new Date();

    await set(requestRef, {

        employeeId: employee.employeeId,
        name: employee.name,
        type: employee.type,

        leaveDate: leaveDate.value,

        reason: reason.value.trim(),

        status: "Pending",

        requestDate: now.toLocaleDateString(),

        requestTime: now.toLocaleTimeString(),

        timestamp: now.getTime()

    });

    alert("Leave Request Submitted Successfully.");

    leaveDate.value = "";
    reason.value = "";

    loadRequests();

};

// =============================
// Load Previous Requests
// =============================
async function loadRequests() {

    requestTable.innerHTML = "";

    const snapshot = await get(ref(db, "leaveRequests/" + empID));

    if (!snapshot.exists()) {

        requestTable.innerHTML =

        `<tr>
            <td colspan="3">No Leave Requests</td>
        </tr>`;

        return;

    }

    const requests = snapshot.val();

    const list = Object.values(requests);

    list.sort((a, b) => b.timestamp - a.timestamp);

    list.forEach(req => {

        let color = "orange";

        if (req.status === "Approved")
            color = "green";

        if (req.status === "Rejected")
            color = "red";

        requestTable.innerHTML += `

        <tr>

            <td>${req.leaveDate}</td>

            <td>${req.reason}</td>

            <td style="color:${color};font-weight:bold;">
                ${req.status}
            </td>

        </tr>

        `;

    });

}

loadRequests();