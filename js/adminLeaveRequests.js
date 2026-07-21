import { db, ref, get, update } from "./firebase.js";

// =============================
// Check Admin Login
// =============================
if (sessionStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "adminLogin.html";
}

const leaveTable = document.getElementById("leaveTable");

// =============================
// Load Leave Requests
// =============================
async function loadRequests() {

    leaveTable.innerHTML = "";

    const snapshot = await get(ref(db, "leaveRequests"));

    if (!snapshot.exists()) {

        leaveTable.innerHTML = `
        <tr>
            <td colspan="7">No Leave Requests Found</td>
        </tr>
        `;

        return;
    }

    const employees = snapshot.val();

    // Collect all requests into one array
    let allRequests = [];

    for (const empID in employees) {

        for (const requestID in employees[empID]) {

            allRequests.push({
                empID,
                requestID,
                ...employees[empID][requestID]
            });

        }

    }

    // Latest request first
    allRequests.sort((a, b) => b.timestamp - a.timestamp);

    allRequests.forEach(req => {

        let statusColor = "orange";

        if (req.status === "Approved")
            statusColor = "green";

        if (req.status === "Rejected")
            statusColor = "red";

        let actionButtons = "";

        if (req.status === "Pending") {

            actionButtons = `
                <button onclick="approveRequest('${req.empID}','${req.requestID}')">
                    ✅ Approve
                </button>

                <button onclick="rejectRequest('${req.empID}','${req.requestID}')">
                    ❌ Reject
                </button>
            `;

        } else {

            actionButtons = "-";

        }

        leaveTable.innerHTML += `

        <tr>

            <td>${req.employeeId}</td>

            <td>${req.name}</td>

            <td>${req.type}</td>

            <td>${req.leaveDate}</td>

            <td>${req.reason}</td>

            <td style="font-weight:bold;color:${statusColor};">
                ${req.status}
            </td>

            <td>${actionButtons}</td>

        </tr>

        `;

    });

}

// =============================
// Approve Leave
// =============================
window.approveRequest = async (empID, requestID) => {

  const requestSnapshot = await get(
    ref(db, "leaveRequests/" + empID + "/" + requestID)
);

const request = requestSnapshot.val();

await update(
    ref(db, "leaveRequests/" + empID + "/" + requestID),
    {
        status: "Approved",
        approvedBy: "Admin",
        approvedTime: new Date().toLocaleString()
    }
);

// Create Attendance Record
await update(
    ref(db, "attendance/" + empID + "/" + request.leaveDate),
    {
        status: "Leave",
        checkIn: "",
        checkOut: "",
        workingHours: "",
        leaveApproved: true
    }
);

alert("Leave Approved");

loadRequests();

    alert("Leave Approved");

    loadRequests();

};

// =============================
// Reject Leave
// =============================
window.rejectRequest = async (empID, requestID) => {

    await update(
        ref(db, "leaveRequests/" + empID + "/" + requestID),
        {
            status: "Rejected",
            approvedBy: "Admin",
            approvedTime: new Date().toLocaleString()
        }
    );

    alert("Leave Rejected");

    loadRequests();

};

// Load page
loadRequests();
