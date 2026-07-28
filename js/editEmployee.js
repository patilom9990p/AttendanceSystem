import {
    db,
    ref,
    get,
    set,
    update,
    remove
} from "./firebase.js";

// ==========================================
// GET EMPLOYEE ID FROM URL
// ==========================================

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

// ==========================================
// GET COMPANY PREFIX
// ==========================================

function getCompanyPrefix(company) {

    if (company === "WaveNxD") {
        return "WNX";
    }

    if (company === "Nexa Prime") {
        return "NXP";
    }

    return null;

}

// ==========================================
// GET TYPE PREFIX
// ==========================================

function getTypePrefix(type) {

    if (type === "Employee") {
        return "EMP";
    }

    if (type === "Intern") {
        return "INT";
    }

    return null;

}

// ==========================================
// CHECK NEW EMPLOYEE ID FORMAT
// ==========================================

function isNewEmployeeId(employeeId) {

    const pattern =
        /^(WNX|NXP)-(EMP|INT)\d{3,}$/;

    return pattern.test(employeeId);

}

// ==========================================
// MOVE FIREBASE RECORD
// ==========================================

async function moveFirebaseRecord(
    databasePath,
    oldID,
    newID
) {

    const snapshot = await get(
        ref(db, databasePath + "/" + oldID)
    );

    if (!snapshot.exists()) {
        return;
    }

    await set(
        ref(db, databasePath + "/" + newID),
        snapshot.val()
    );

    await remove(
        ref(db, databasePath + "/" + oldID)
    );

}

// ==========================================
// LOAD EMPLOYEE DETAILS
// ==========================================

async function loadEmployee() {

    try {

        const snapshot = await get(
            ref(db, "employees/" + empID)
        );

        if (!snapshot.exists()) {

            alert("Employee not found.");

            window.location.href =
                "viewAttendance.html";

            return;

        }

        const data = snapshot.val();

        nameInput.value =
            data.name || "";

        collegeInput.value =
            data.college || "";

        typeInput.value =
            data.type || "Employee";

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

// ==========================================
// UPDATE BUTTON
// ==========================================

updateBtn.addEventListener(
    "click",
    updateEmployee
);

// ==========================================
// UPDATE EMPLOYEE
// ==========================================

async function updateEmployee() {

    const name =
        nameInput.value.trim();

    const college =
        collegeInput.value.trim();

    const newType =
        typeInput.value;

    const newCompany =
        companyInput.value;

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

        alert(
            "Invalid company or employee type."
        );

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

        const oldData =
            empSnapshot.val();

        const oldCompany =
            oldData.company || "WaveNxD";

        const oldType =
            oldData.type || "Employee";

        const typeChanged =
            oldType !== newType;

        const companyChanged =
            oldCompany !== newCompany;

        // Existing EMP001 or INT001 requires migration
        const oldIdNeedsMigration =
            !isNewEmployeeId(empID);

        // ======================================
        // NO TYPE/COMPANY CHANGE AND ID IS NEW
        // ======================================

        if (
            !typeChanged &&
            !companyChanged &&
            !oldIdNeedsMigration
        ) {

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

        // ======================================
        // CREATE CONFIRMATION MESSAGE
        // ======================================

        let changeMessage = "";

        if (oldIdNeedsMigration) {

            changeMessage =
                "This employee uses the old Employee ID format.\n\n" +
                "Old Employee ID: " + empID + "\n\n" +
                "It will be converted to the new ID format.";

        } else {

            changeMessage =
                "Employee information has changed.";

        }

        if (companyChanged && typeChanged) {

            changeMessage +=
                "\n\nCompany and employee type were changed.";

        } else if (companyChanged) {

            changeMessage +=
                "\n\nEmployee company was changed.";

        } else if (typeChanged) {

            changeMessage +=
                "\n\nEmployee type was changed.";

        }

        changeMessage +=
            "\n\nThe Employee ID will change." +
            "\n\nDo you want to continue?";

        const confirmChange =
            confirm(changeMessage);

        if (!confirmChange) {
            return;
        }

        // ======================================
        // CREATE NEW ID PREFIX
        // ======================================

        const fullPrefix =
            companyPrefix + "-" + typePrefix;

        // Examples:
        // WNX-EMP
        // WNX-INT
        // NXP-EMP
        // NXP-INT

        // ======================================
        // READ ALL EMPLOYEES
        // ======================================

        const allEmpSnapshot = await get(
            ref(db, "employees")
        );

        const employees =
            allEmpSnapshot.exists()
                ? allEmpSnapshot.val()
                : {};

        let maxNumber = 0;

        for (const id in employees) {

            if (!id.startsWith(fullPrefix)) {
                continue;
            }

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

        // ======================================
        // GENERATE NEW EMPLOYEE ID
        // ======================================

        const newID =
            fullPrefix +
            String(maxNumber + 1).padStart(
                3,
                "0"
            );

        // Examples:
        // WNX-EMP001
        // WNX-INT001
        // NXP-EMP001
        // NXP-INT001

        // ======================================
        // CHECK NEW ID
        // ======================================

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

        // ======================================
        // CREATE NEW EMPLOYEE RECORD
        // ======================================

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
                    oldData.createdAt ||
                    Date.now(),

                updatedAt:
                    Date.now()
            }
        );

        // ======================================
        // MOVE ATTENDANCE
        // ======================================

        await moveFirebaseRecord(
            "attendance",
            empID,
            newID
        );

        // ======================================
        // MOVE LEAVE REQUESTS
        // ======================================

        await moveFirebaseRecord(
            "leaveRequests",
            empID,
            newID
        );

        // ======================================
        // MOVE UNAUTHORIZED GPS ATTEMPTS
        // ======================================

        const gpsSnapshot = await get(
            ref(
                db,
                "unauthorizedAttempts/" + empID
            )
        );

        if (gpsSnapshot.exists()) {

            const attempts =
                gpsSnapshot.val();

            const updatedAttempts = {};

            for (const attemptID in attempts) {

                updatedAttempts[attemptID] = {

                    ...attempts[attemptID],

                    employeeId: newID,

                    name: name,

                    college: college,

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

        // ======================================
        // DELETE OLD EMPLOYEE RECORD
        // ======================================

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

// ==========================================
// LOAD EMPLOYEE
// ==========================================

loadEmployee();
