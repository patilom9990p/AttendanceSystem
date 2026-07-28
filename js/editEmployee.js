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
// GET COMPANY PREFIX
// ==============================

function getCompanyPrefix(company) {

    if (company === "WaveNxD") {
        return "WNX";
    }

    if (company === "Nexa Prime") {
        return "NXP";
    }

    return null;

}

// ==============================
// GET TYPE PREFIX
// ==============================

function getTypePrefix(type) {

    if (type === "Employee") {
        return "EMP";
    }

    if (type === "Intern") {
        return "INT";
    }

    return null;

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

        companyInput.value =
            data.company || "WaveNxD";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load employee.\n\n" +
            error.message
        );

    }

}

// ==============================
// UPDATE BUTTON
// ==============================

updateBtn.addEventListener(
    "click",
    updateEmployee
);

// ==============================
// UPDATE EMPLOYEE
// ==============================

async function updateEmployee() {

    const name = nameInput.value.trim();

    const college = collegeInput.value.trim();

    const newType = typeInput.value;

    const newCompany = companyInput.value;

    if (
        name === "" ||
        college === "" ||
        newType === "" ||
        newCompany === ""
    ) {

        alert("Please fill all fields.");

        return;

    }

    const companyPrefix =
        getCompanyPrefix(newCompany);

    const typePrefix =
        getTypePrefix(newType);

    if (!companyPrefix || !typePrefix) {

        alert("Invalid company or employee type.");

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

        const oldCompany =
            oldData.company || "WaveNxD";

        const typeChanged =
            oldData.type !== newType;

        const companyChanged =
            oldCompany !== newCompany;

        // ==================================
        // COMPANY AND TYPE ARE NOT CHANGED
        // ==================================

        if (!typeChanged && !companyChanged) {

            await update(
                ref(db, "employees/" + empID),
                {
                    name: name,

                    college: college,

                    type: newType,

                    company: newCompany,

                    password:
                        oldData.password || "123456",

                    active:
                        oldData.active !== undefined
                            ? oldData.active
                            : true,

                    updatedAt: Date.now()
                }
            );

            alert(
                "Employee Updated Successfully."
            );

            window.location.href =
                "viewAttendance.html";

            return;

        }

        // ==================================
        // COMPANY OR TYPE CHANGED
        // ==================================

        let changeMessage =
            "Employee information has changed.\n\n";

        if (companyChanged && typeChanged) {

            changeMessage +=
                "Company and employee type were changed.";

        } else if (companyChanged) {

            changeMessage +=
                "Employee company was changed.";

        } else {

            changeMessage +=
                "Employee type was changed.";

        }

        changeMessage +=
            "\n\nThe Employee ID will also change." +
            "\n\nDo you want to continue?";

        const confirmChange =
            confirm(changeMessage);

        if (!confirmChange) {

            return;

        }

        // ==================================
        // CREATE NEW PREFIX
        // ==================================

        const fullPrefix =
            companyPrefix + "-" + typePrefix;

        // Examples:
        // WNX-EMP
        // WNX-INT
        // NXP-EMP
        // NXP-INT

        // ==================================
        // READ ALL EMPLOYEES
        // ==================================

        const allEmpSnapshot = await get(
            ref(db, "employees")
        );

        const employees =
            allEmpSnapshot.exists()
                ? allEmpSnapshot.val()
                : {};

        let maxNumber = 0;

        for (const id in employees) {

            if (id.startsWith(fullPrefix)) {

                const numberPart =
                    id.substring(fullPrefix.length);

                const number =
                    parseInt(numberPart, 10);

                if (
                    !isNaN(number) &&
                    number > maxNumber
                ) {

                    maxNumber = number;

                }

            }

        }

        // ==================================
        // GENERATE NEW EMPLOYEE ID
        // ==================================

        const newID =
            fullPrefix +
            String(maxNumber + 1).padStart(3, "0");

        // Example:
        // WNX-EMP001
        // NXP-INT001

        // ==================================
        // CHECK NEW ID DOES NOT EXIST
        // ==================================

        const newEmployeeSnapshot = await get(
            ref(db, "employees/" + newID)
        );

        if (newEmployeeSnapshot.exists()) {

            alert(
                "Generated Employee ID already exists.\n\n" +
                "Please try again."
            );

            return;

        }

        // ==================================
        // CREATE NEW EMPLOYEE RECORD
        // ==================================

        await set(
            ref(db, "employees/" + newID),
            {
                employeeId: newID,

                name: name,

                college: college,

                type: newType,

                company: newCompany,

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
            ref(
                db,
                "unauthorizedAttempts/" + empID
            )
        );

        if (gpsAttemptSnapshot.exists()) {

            const attempts =
                gpsAttemptSnapshot.val();

            const updatedAttempts = {};

            for (const attemptID in attempts) {

                updatedAttempts[attemptID] = {
                    ...attempts[attemptID],

                    employeeId: newID,

                    name: name,

                    type: newType,

                    company: newCompany
                };

            }

            await set(
                ref(
                    db,
                    "unauthorizedAttempts/" + newID
                ),
                updatedAttempts
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
            "Old Employee ID: " + empID +
            "\nNew Employee ID: " + newID +
            "\n\nThe employee must use the new ID to log in."
        );

        window.location.href =
            "viewAttendance.html";

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

        updateBtn.textContent =
            "💾 Update Employee";

    }

}

// ==============================
// LOAD EMPLOYEE
// ==============================

loadEmployee();
