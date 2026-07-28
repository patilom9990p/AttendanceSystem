import {
    db,
    ref,
    get,
    update
} from "./firebase.js";

// =============================
// CHECK ADMIN LOGIN
// =============================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "adminLogin.html";
}

// =============================
// HTML ELEMENTS
// =============================

const leaveTable =
    document.getElementById("leaveTable");

const companyFilter =
    document.getElementById("companyFilter");

// =============================
// FILTER EVENT
// =============================

companyFilter.addEventListener(
    "change",
    loadRequests
);

// =============================
// LOAD LEAVE REQUESTS
// =============================

async function loadRequests() {

    leaveTable.innerHTML = `
        <tr>
            <td colspan="8">
                Loading leave requests...
            </td>
        </tr>
    `;

    const selectedCompany =
        companyFilter.value;

    try {

        const leaveSnapshot =
            await get(
                ref(db, "leaveRequests")
            );

        const employeeSnapshot =
            await get(
                ref(db, "employees")
            );

        if (!leaveSnapshot.exists()) {

            leaveTable.innerHTML = `
                <tr>
                    <td colspan="8">
                        No Leave Requests Found
                    </td>
                </tr>
            `;

            return;
        }

        const leaveRequests =
            leaveSnapshot.val();

        const employees =
            employeeSnapshot.exists()
                ? employeeSnapshot.val()
                : {};

        const allRequests = [];

        // =============================
        // COLLECT ALL REQUESTS
        // =============================

        for (const empID in leaveRequests) {

            const employee =
                employees[empID] || {};

            const employeeCompany =
                employee.company ||
                leaveRequests[empID].company ||
                "WaveNxD";

            // Company filter
            if (
                selectedCompany !== "All" &&
                employeeCompany !== selectedCompany
            ) {
                continue;
            }

            for (
                const requestID in leaveRequests[empID]
            ) {

                const request =
                    leaveRequests[empID][requestID];

                // Skip invalid data
                if (
                    !request ||
                    typeof request !== "object"
                ) {
                    continue;
                }

                allRequests.push({

                    empID,

                    requestID,

                    employeeId:
                        request.employeeId ||
                        empID,

                    name:
                        request.name ||
                        employee.name ||
                        "--",

                    type:
                        request.type ||
                        employee.type ||
                        "--",

                    company:
                        request.company ||
                        employeeCompany ||
                        "--",

                    leaveDate:
                        request.leaveDate ||
                        "--",

                    reason:
                        request.reason ||
                        "--",

                    status:
                        request.status ||
                        "Pending",

                    timestamp:
                        request.timestamp ||
                        0

                });

            }

        }

        // =============================
        // NO REQUESTS FOR FILTER
        // =============================

        if (allRequests.length === 0) {

            const message =
                selectedCompany === "All"
                    ? "No Leave Requests Found"
                    : "No Leave Requests Found for " +
                      selectedCompany;

            leaveTable.innerHTML = `
                <tr>
                    <td colspan="8">
                        ${escapeHTML(message)}
                    </td>
                </tr>
            `;

            return;

        }

        // =============================
        // LATEST REQUEST FIRST
        // =============================

        allRequests.sort(
            (a, b) =>
                Number(b.timestamp) -
                Number(a.timestamp)
        );

        leaveTable.innerHTML = "";

        // =============================
        // DISPLAY REQUESTS
        // =============================

        for (const req of allRequests) {

            let statusColor = "orange";

            if (req.status === "Approved") {
                statusColor = "green";
            }

            if (req.status === "Rejected") {
                statusColor = "red";
            }

            let actionButtons = "-";

            if (req.status === "Pending") {

                actionButtons = `
                    <button
                        onclick="approveRequest(
                            '${escapeJavaScript(req.empID)}',
                            '${escapeJavaScript(req.requestID)}'
                        )"
                    >
                        ✅ Approve
                    </button>

                    <button
                        onclick="rejectRequest(
                            '${escapeJavaScript(req.empID)}',
                            '${escapeJavaScript(req.requestID)}'
                        )"
                    >
                        ❌ Reject
                    </button>
                `;

            }

            leaveTable.innerHTML += `
                <tr>

                    <td>
                        ${escapeHTML(req.employeeId)}
                    </td>

                    <td>
                        ${escapeHTML(req.name)}
                    </td>

                    <td>
                        ${escapeHTML(req.type)}
                    </td>

                    <td>
                        ${escapeHTML(req.company)}
                    </td>

                    <td>
                        ${escapeHTML(req.leaveDate)}
                    </td>

                    <td>
                        ${escapeHTML(req.reason)}
                    </td>

                    <td
                        style="
                            font-weight: bold;
                            color: ${statusColor};
                        "
                    >
                        ${escapeHTML(req.status)}
                    </td>

                    <td>
                        ${actionButtons}
                    </td>

                </tr>
            `;

        }

    }
    catch (error) {

        console.error(error);

        leaveTable.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to load leave requests.
                </td>
            </tr>
        `;

        alert(
            "Unable to load leave requests.\n\n" +
            error.message
        );

    }

}

// =============================
// APPROVE LEAVE
// =============================

window.approveRequest =
async function (
    empID,
    requestID
) {

    const confirmApprove = confirm(
        "Are you sure you want to approve this leave request?"
    );

    if (!confirmApprove) {
        return;
    }

    try {

        const requestSnapshot =
            await get(
                ref(
                    db,
                    "leaveRequests/" +
                    empID +
                    "/" +
                    requestID
                )
            );

        if (!requestSnapshot.exists()) {

            alert(
                "Leave request not found."
            );

            return;
        }

        const request =
            requestSnapshot.val();

        if (!request.leaveDate) {

            alert(
                "Leave date is missing."
            );

            return;
        }

        // Update leave request
        await update(
            ref(
                db,
                "leaveRequests/" +
                empID +
                "/" +
                requestID
            ),
            {
                status: "Approved",
                approvedBy: "Admin",
                approvedTime:
                    new Date().toLocaleString()
            }
        );

        // Create attendance leave record
        await update(
            ref(
                db,
                "attendance/" +
                empID +
                "/" +
                request.leaveDate
            ),
            {
                status: "Leave",
                checkIn: "",
                checkOut: "",
                workingHours: "",
                leaveApproved: true,
                leaveRequestId:
                    requestID
            }
        );

        alert(
            "Leave Approved Successfully"
        );

        loadRequests();

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to approve leave.\n\n" +
            error.message
        );

    }

};

// =============================
// REJECT LEAVE
// =============================

window.rejectRequest =
async function (
    empID,
    requestID
) {

    const confirmReject = confirm(
        "Are you sure you want to reject this leave request?"
    );

    if (!confirmReject) {
        return;
    }

    try {

        const requestSnapshot =
            await get(
                ref(
                    db,
                    "leaveRequests/" +
                    empID +
                    "/" +
                    requestID
                )
            );

        if (!requestSnapshot.exists()) {

            alert(
                "Leave request not found."
            );

            return;
        }

        await update(
            ref(
                db,
                "leaveRequests/" +
                empID +
                "/" +
                requestID
            ),
            {
                status: "Rejected",
                rejectedBy: "Admin",
                rejectedTime:
                    new Date().toLocaleString()
            }
        );

        alert(
            "Leave Rejected Successfully"
        );

        loadRequests();

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to reject leave.\n\n" +
            error.message
        );

    }

};

// =============================
// HTML PROTECTION
// =============================

function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

// =============================
// JAVASCRIPT STRING PROTECTION
// =============================

function escapeJavaScript(value) {

    return String(value)
        .replaceAll("\\", "\\\\")
        .replaceAll("'", "\\'");

}

// =============================
// LOAD PAGE
// =============================

loadRequests();
