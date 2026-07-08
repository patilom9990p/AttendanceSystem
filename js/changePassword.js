import { db, ref, get, update } from "./firebase.js";

// Check Login
if (sessionStorage.getItem("employeeLoggedIn") !== "true") {

    alert("Please login first.");

    window.location.href = "employeeLogin.html";

}

const empID = sessionStorage.getItem("employeeID");

document.getElementById("changeBtn")
.addEventListener("click", changePassword);

async function changePassword() {

    const currentPassword =
        document.getElementById("currentPassword").value.trim();

    const newPassword =
        document.getElementById("newPassword").value.trim();

    const confirmPassword =
        document.getElementById("confirmPassword").value.trim();

    if (
        currentPassword === "" ||
        newPassword === "" ||
        confirmPassword === ""
    ) {

        alert("Please fill all fields.");

        return;

    }

    if (newPassword.length < 6) {

        alert("Password must be at least 6 characters.");

        return;

    }

    if (newPassword !== confirmPassword) {

        alert("New passwords do not match.");

        return;

    }

    try {

        const snapshot =
            await get(ref(db, "employees/" + empID));

        if (!snapshot.exists()) {

            alert("Employee not found.");

            return;

        }

        const employee = snapshot.val();

        if (
            String(employee.password).trim() !==
            String(currentPassword).trim()
        ) {

            alert("Current password is incorrect.");

            return;

        }

        await update(
            ref(db, "employees/" + empID),
            {
                password: newPassword
            }
        );

        alert("✅ Password changed successfully.");

        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";

        window.location.href = "employeeDashboard.html";

    }
    catch (error) {

        alert(error.message);

    }

}