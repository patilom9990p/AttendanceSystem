import {
    db,
    ref,
    get,
    update,
    remove
} from "./firebase.js";

// ===========================
// CHECK ADMIN SESSION
// ===========================

if (
    sessionStorage.getItem("adminLoggedIn") !== "true"
) {
    window.location.href = "adminLogin.html";
}

// ===========================
// HTML ELEMENTS
// ===========================

const disableEmployeeBtn =
    document.getElementById("disableEmployeeBtn");

const resetAttendanceBtn =
    document.getElementById("resetAttendanceBtn");

const resetPasswordBtn =
    document.getElementById("resetPasswordBtn");

const enableAllBtn =
    document.getElementById("enableAllBtn");

const factoryResetBtn =
    document.getElementById("factoryResetBtn");

// ===========================
// DISABLE EMPLOYEE PAGE
// ===========================

if (disableEmployeeBtn) {

    disableEmployeeBtn.addEventListener(
        "click",
        function () {

            window.location.href =
                "disableEmployee.html";

        }
    );

}

// ===========================
// RESET ATTENDANCE
// ===========================

if (resetAttendanceBtn) {

    resetAttendanceBtn.addEventListener(
        "click",
        resetAttendance
    );

}

async function resetAttendance() {

    const confirmed = confirm(
        "Delete ALL attendance records?\n\n" +
        "This operation cannot be undone."
    );

    if (!confirmed) {
        return;
    }

    try {

        resetAttendanceBtn.disabled = true;

        resetAttendanceBtn.textContent =
            "Resetting Attendance...";

        await remove(
            ref(db, "attendance")
        );

        alert(
            "Attendance records reset successfully."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to reset attendance.\n\n" +
            error.message
        );

    }
    finally {

        resetAttendanceBtn.disabled = false;

        resetAttendanceBtn.textContent =
            "🟡 Reset Attendance";

    }

}

// ===========================
// RESET ALL PASSWORDS
// ===========================

if (resetPasswordBtn) {

    resetPasswordBtn.addEventListener(
        "click",
        resetPasswords
    );

}

async function resetPasswords() {

    const confirmed = confirm(
        "Reset the password of every employee " +
        "and intern to 123456?"
    );

    if (!confirmed) {
        return;
    }

    try {

        resetPasswordBtn.disabled = true;

        resetPasswordBtn.textContent =
            "Resetting Passwords...";

        const snapshot = await get(
            ref(db, "employees")
        );

        if (!snapshot.exists()) {

            alert("No employees found.");

            return;
        }

        const employees =
            snapshot.val();

        const updates = {};

        for (const employeeID in employees) {

            updates[
                "employees/" +
                employeeID +
                "/password"
            ] = "123456";

        }

        await update(
            ref(db),
            updates
        );

        alert(
            "All employee passwords have been reset to 123456."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to reset passwords.\n\n" +
            error.message
        );

    }
    finally {

        resetPasswordBtn.disabled = false;

        resetPasswordBtn.textContent =
            "🟠 Reset All Passwords";

    }

}

// ===========================
// ENABLE ALL ACCOUNTS
// ===========================

if (enableAllBtn) {

    enableAllBtn.addEventListener(
        "click",
        enableAccounts
    );

}

async function enableAccounts() {

    const confirmed = confirm(
        "Enable all employee and intern accounts?\n\n" +
        "Previously disabled employees will be able " +
        "to log in and appear in active employee lists."
    );

    if (!confirmed) {
        return;
    }

    try {

        enableAllBtn.disabled = true;

        enableAllBtn.textContent =
            "Enabling Accounts...";

        const snapshot = await get(
            ref(db, "employees")
        );

        if (!snapshot.exists()) {

            alert("No employees found.");

            return;
        }

        const employees =
            snapshot.val();

        const updates = {};

        for (const employeeID in employees) {

            updates[
                "employees/" +
                employeeID +
                "/active"
            ] = true;

            updates[
                "employees/" +
                employeeID +
                "/enabledAt"
            ] = new Date().toISOString();

            updates[
                "employees/" +
                employeeID +
                "/disabledAt"
            ] = null;

            updates[
                "employees/" +
                employeeID +
                "/disabledReason"
            ] = null;

            updates[
                "employees/" +
                employeeID +
                "/exitDate"
            ] = null;

        }

        await update(
            ref(db),
            updates
        );

        alert(
            "All employee and intern accounts have been enabled."
        );

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to enable accounts.\n\n" +
            error.message
        );

    }
    finally {

        enableAllBtn.disabled = false;

        enableAllBtn.textContent =
            "🟢 Enable All Accounts";

    }

}

// ===========================
// FACTORY RESET
// ===========================

if (factoryResetBtn) {

    factoryResetBtn.addEventListener(
        "click",
        factoryReset
    );

}

async function factoryReset() {

    const confirmationText = prompt(
        "WARNING!\n\n" +
        "This will permanently delete:\n\n" +
        "• All employees and interns\n" +
        "• All attendance records\n" +
        "• All leave requests\n" +
        "• All unauthorised GPS attempts\n\n" +
        "Type RESET to continue."
    );

    if (confirmationText !== "RESET") {

        alert("Factory Reset Cancelled.");

        return;
    }

    const finalConfirmation = confirm(
        "Are you completely sure?\n\n" +
        "Deleted records cannot be recovered."
    );

    if (!finalConfirmation) {
        return;
    }

    try {

        factoryResetBtn.disabled = true;

        factoryResetBtn.textContent =
            "Performing Factory Reset...";

        const updates = {

            employees: null,

            attendance: null,

            leaveRequests: null,

            unauthorizedAttempts: null

        };

        await update(
            ref(db),
            updates
        );

        sessionStorage.clear();

        alert(
            "Factory Reset Completed Successfully."
        );

        window.location.href =
            "adminLogin.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to complete factory reset.\n\n" +
            error.message
        );

        factoryResetBtn.disabled = false;

        factoryResetBtn.textContent =
            "🔴 Factory Reset";

    }

}
