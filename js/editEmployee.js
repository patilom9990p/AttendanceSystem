import {
    db,
    ref,
    get,
    set,
    update,
    remove
} from "./firebase.js";

// ==============================
// GET EMPLOYEE ID FROM URL
// ==============================

const params = new URLSearchParams(window.location.search);
const empID = params.get("id");

const empIDInput = document.getElementById("empID");
const nameInput = document.getElementById("name");
const collegeInput = document.getElementById("college");
const typeInput = document.getElementById("type");
const companyInput = document.getElementById("company");
const updateBtn = document.getElementById("updateBtn");

// Check Employee ID

if (!empID) {

    alert("Employee ID is missing.");

    window.location.href = "viewAttendance.html";

} else {

    empIDInput.value = empID;

}

// ==============================
// LOAD EMPLOYEE DETAILS
// ==============================

async function loadEmployee() {

    try {

        const snapshot = await get(
            ref(db, "employees/" + empID)
        );

        if (!snapshot.exists()) {

            alert("Employee not found.");

            window.location.href = "viewAttendance.html";

            return;

        }

        const data = snapshot.val();

        nameInput.value = data.name || "";

        collegeInput.value = data.college || "";

        typeInput.value = data.type || "Employee";

        // Load company
        companyInput.value =
            data.company || "WaveNxD";

    }
    catch (error) {

        console.error(error);

        alert("Unable to load employee.\n\n" + error.message);

    }

}

// ==============================
// UPDATE BUTTON
// ==============================

updateBtn.addEventListener("click", updateEmployee);

// ==============================
// UPDATE EMPLOYEE
// ==============================

async function updateEmployee() {

    const name = nameInput.value.trim();

    const college = collegeInput.value.trim();

    const newType = typeInput.value;

    const company = companyInput.value;

    if (
        name === "" ||
        college === "" ||
        newType === "" ||
        company === ""
    ) {

        alert("Please fill all fields.");

        return;

    }

    updateBtn.disabled = true;
    updateBtn.textContent = "Updating...";

    try {

        const empSnapshot = await get(
            ref(db, "employees/" + empID)
        );

        if (!empSnapshot.exists()) {

            alert("Employee not found.");

            return;

        }

        const oldData = empSnapshot.val();

        // ==================================
        // SAME EMPLOYEE TYPE
        // ==================================

        if (oldData.type === newType) {

            await update(
                ref(db, "employees/" + empID),
                {
                    name: name,
                    college: college,
                    type: newType,
                    company: company,

                    // Preserve login details
                    password:
                        oldData.password || "123456",

                    active:
                        oldData.active !== undefined
                            ? oldData.active
                            : true
                }
            );

            alert("Employee Updated Successfully.");

            window.location.href = "viewAttendance.html";

            return;

        }

        // ==================================
        // EMPLOYEE TYPE CHANGED
        // ==================================

        const confirmChange = confirm(
            "Employee type has changed.\n\n" +
            "The Employee ID will also change.\n\n" +
            "Do you want to continue?"
        );

        if (!confirmChange) {

            updateBtn.disabled = false;
            updateBtn.textContent = "💾 Update Employee";

            return;

        }

        // Read all employees

        const allEmpSnapshot = await get(
            ref(db, "employees")
        );

        const employees =
            allEmpSnapshot.exists()
                ? allEmpSnapshot.val()
                : {};

        const prefix =
            newType === "Employee"
                ? "EMP"
                : "INT";

        let maxNumber = 0;

        for (const id in employees) {

            if (id.startsWith(prefix)) {

                const number = parseInt(
                    id.substring(3),
                    10
                );

                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }

        const newID =
            prefix +
            String(maxNumber + 1).padStart(3, "0");

        // ==================================
        // CREATE UPDATED EMPLOYEE RECORD
        // ==================================

        await set(
            ref(db, "employees/" + newID),
            {
                employeeId: newID,

                name: name,

                college: college,

                type: newType,

                company: company,

                password:
                    oldData.password || "123456",

                active:
                    oldData.active !== undefined
                        ? oldData.active
                        : true,

                createdAt:
                    oldData.createdAt || Date.now(),

                updatedAt: Date.now()
            }
        );

        // ==================================
        // MOVE ATTENDANCE RECORDS
        // ==================================

        const attendanceSnapshot = await get(
            ref(db, "attendance/" + empID)
        );

        if (attendanceSnapshot.exists()) {

            await set(
                ref(db, "attendance/" + newID),
                attendanceSnapshot.val()
            );

            await remove(
                ref(db, "attendance/" + empID)
            );

        }

        // ==================================
        // MOVE LEAVE REQUESTS
        // ==================================

        const leaveSnapshot = await get(
            ref(db, "leaveRequests/" + empID)
        );

        if (leaveSnapshot.exists()) {

            await set(
                ref(db, "leaveRequests/" + newID),
                leaveSnapshot.val()
            );

            await remove(
                ref(db, "leaveRequests/" + empID)
            );

        }

        // ==================================
        // MOVE UNAUTHORIZED GPS ATTEMPTS
        // ==================================

        const gpsAttemptSnapshot = await get(
            ref(db, "unauthorizedAttempts/" + empID)
        );

        if (gpsAttemptSnapshot.exists()) {

            await set(
                ref(
                    db,
                    "unauthorizedAttempts/" + newID
                ),
                gpsAttemptSnapshot.val()
            );

            await remove(
                ref(
                    db,
                    "unauthorizedAttempts/" + empID
                )
            );

        }

        // ==================================
        // DELETE OLD EMPLOYEE RECORD
        // ==================================

        await remove(
            ref(db, "employees/" + empID)
        );

        alert(
            "Employee Updated Successfully.\n\n" +
            "New Employee ID: " + newID
        );

        window.location.href = "viewAttendance.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to update employee.\n\n" +
            error.message
        );

    }
    finally {

        updateBtn.disabled = false;
        updateBtn.textContent = "💾 Update Employee";

    }

}

// Load employee details

loadEmployee();
