import { db, ref, get, update, remove } from "./firebase.js";

// ===========================
// CHECK ADMIN SESSION
// ===========================

if (sessionStorage.getItem("adminLoggedIn") !== "true") {

    window.location.href = "adminLogin.html";

}

// ===========================
// RESET ATTENDANCE
// ===========================

document.getElementById("resetAttendanceBtn")
.addEventListener("click", resetAttendance);

async function resetAttendance() {

    const yes = confirm(
        "Delete ALL attendance records?\n\nThis cannot be undone."
    );

    if (!yes) return;

    try {

        await remove(ref(db, "attendance"));

        alert("✅ Attendance reset successfully.");

    }
    catch (error) {

        alert(error.message);

    }

}

// ===========================
// RESET PASSWORDS
// ===========================

document.getElementById("resetPasswordBtn")
.addEventListener("click", resetPasswords);

async function resetPasswords() {

    const yes = confirm(
        "Reset everyone's password to 123456?"
    );

    if (!yes) return;

    try {

        const snapshot = await get(ref(db, "employees"));

        if (!snapshot.exists()) {

            alert("No employees found.");
            return;

        }

        const employees = snapshot.val();

        for (const id in employees) {

            await update(ref(db, "employees/" + id), {

                password: "123456"

            });

        }

        alert("✅ All passwords have been reset.");

    }
    catch (error) {

        alert(error.message);

    }

}

// ===========================
// ENABLE ALL ACCOUNTS
// ===========================

document.getElementById("enableAllBtn")
.addEventListener("click", enableAccounts);

async function enableAccounts() {

    const yes = confirm(
        "Enable all employee and intern accounts?"
    );

    if (!yes) return;

    try {

        const snapshot = await get(ref(db, "employees"));

        if (!snapshot.exists()) {

            alert("No employees found.");
            return;

        }

        const employees = snapshot.val();

        for (const id in employees) {

            await update(ref(db, "employees/" + id), {

                active: true

            });

        }

        alert("✅ All accounts enabled.");

    }
    catch (error) {

        alert(error.message);

    }

}

// ===========================
// FACTORY RESET
// ===========================

document.getElementById("factoryResetBtn")
.addEventListener("click", factoryReset);

async function factoryReset() {

    const text = prompt(
        "⚠ WARNING!\n\nThis will permanently delete ALL Employees, Interns and Attendance.\n\nType RESET to continue."
    );

    if (text !== "RESET") {

        alert("Factory Reset Cancelled.");

        return;

    }

    try {

        // Delete Attendance
        await remove(ref(db, "attendance"));

        // Delete Employees
        await remove(ref(db, "employees"));

        // Logout Admin
        sessionStorage.clear();

        alert("✅ Factory Reset Completed Successfully.");

        window.location.href = "adminLogin.html";

    }
    catch (error) {

        alert(error.message);

    }

}