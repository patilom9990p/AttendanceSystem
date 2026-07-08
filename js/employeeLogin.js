import { db, ref, get } from "./firebase.js";

document.getElementById("loginBtn").addEventListener("click", login);

async function login() {

    const employeeId = document
        .getElementById("employeeId")
        .value
        .trim()
        .toUpperCase();

    const password = document
        .getElementById("password")
        .value
        .trim();

    if (employeeId === "" || password === "") {

        alert("Please fill all fields.");
        return;

    }

    try {

        const snapshot = await get(ref(db, "employees/" + employeeId));

        if (!snapshot.exists()) {

            alert("Employee not found.");
            return;

        }

        const employee = snapshot.val();

        // Account Disabled
        if (employee.active !== true) {

            alert("Your account is disabled.");
            return;

        }

        // Password Check
        if (String(employee.password).trim() !== String(password).trim()) {

            alert("Invalid Password.");
            return;

        }

        // Save Login Session
        sessionStorage.setItem("employeeLoggedIn", "true");
        sessionStorage.setItem("employeeID", employeeId);

        alert("Login Successful!");

        // Redirect
        window.location.href = "employeeDashboard.html";

    }
    catch (error) {

        alert(error.message);

    }

}