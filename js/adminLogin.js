document.getElementById("loginBtn").addEventListener("click", loginAdmin);

function loginAdmin() {

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    if (username === "" || password === "") {

        alert("Please enter Username and Password.");
        return;

    }

    if (username === "admin" && password === "admin123") {

        // Save Admin Session
        sessionStorage.setItem("adminLoggedIn", "true");

        window.location.href = "adminDashboard.html";

    }
    else {

        alert("Invalid Username or Password.");

    }

}
const togglePassword =
document.getElementById("togglePassword");

const password =
document.getElementById("password");

togglePassword.addEventListener("click", () => {

    if(password.type==="password"){

        password.type="text";

        togglePassword.classList.remove("fa-eye");

        togglePassword.classList.add("fa-eye-slash");

    }
    else{

        password.type="password";

        togglePassword.classList.remove("fa-eye-slash");

        togglePassword.classList.add("fa-eye");

    }

});