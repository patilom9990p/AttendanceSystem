import { db, ref, get } from "./firebase.js";

const loginBtn = document.getElementById("loginBtn");
const employeeIdInput = document.getElementById("employeeId");
const passwordInput = document.getElementById("password");

loginBtn.addEventListener("click", login);

// Allow login by pressing Enter
passwordInput.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        login();
    }

});

async function login() {

    const employeeId = employeeIdInput
        .value
        .trim()
        .toUpperCase();

    const password = passwordInput
        .value
        .trim();

    if (employeeId === "" || password === "") {

        alert("Please fill all fields.");

        return;

    }

    // Validate the new ID format
    const employeeIdPattern =
        /^(WNX|NXP)-(EMP|INT)\d{3,}$/;

    if (!employeeIdPattern.test(employeeId)) {

        alert(
            "Invalid Employee ID format.\n\n" +
            "Examples:\n" +
            "WNX-EMP001\n" +
            "WNX-INT001\n" +
            "NXP-EMP001\n" +
            "NXP-INT001"
        );

        return;

    }

    loginBtn.disabled = true;
    loginBtn.textContent = "Logging In...";

    try {

        const snapshot = await get(
            ref(db, "employees/" + employeeId)
        );

        if (!snapshot.exists()) {

            alert("Employee not found.");

            return;

        }

        const employee = snapshot.val();

        // ==============================
        // ACCOUNT STATUS CHECK
        // ==============================

        if (employee.active !== true) {

            alert(
                "Your account is disabled.\n\n" +
                "Please contact the Administrator."
            );

            return;

        }

        // ==============================
        // PASSWORD CHECK
        // ==============================

        if (
            String(employee.password).trim() !==
            String(password).trim()
        ) {

            alert("Invalid Password.");

            return;

        }

        // ==============================
        // SAVE LOGIN SESSION
        // ==============================

        sessionStorage.setItem(
            "employeeLoggedIn",
            "true"
        );

        sessionStorage.setItem(
            "employeeID",
            employeeId
        );

        sessionStorage.setItem(
            "employeeName",
            employee.name || ""
        );

        sessionStorage.setItem(
            "employeeCompany",
            employee.company || ""
        );

        sessionStorage.setItem(
            "employeeType",
            employee.type || ""
        );

        alert(
            "Login Successful!\n\n" +
            "Welcome, " +
            (employee.name || employeeId)
        );

        window.location.href =
            "employeeDashboard.html";

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to login.\n\n" +
            error.message
        );

    }
    finally {

        loginBtn.disabled = false;
        loginBtn.textContent = "Login";

    }

}
