document.getElementById("loginBtn").addEventListener("click", function () {

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    if(username === "admin" && password === "admin123")
    {
        window.location.href = "admin.html";
    }
    else
    {
        alert("Invalid Username or Password");
    }

});