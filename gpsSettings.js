import { db, ref, get, set } from "./firebase.js";

// =======================
// ADMIN SESSION
// =======================

if (sessionStorage.getItem("adminLoggedIn") !== "true") {

    window.location.href = "adminLogin.html";

}

// =======================
// LOAD SETTINGS
// =======================

async function loadGPS() {

    const snapshot = await get(ref(db, "gpsSettings"));

    if (snapshot.exists()) {

        const data = snapshot.val();

        document.getElementById("latitude").value = data.latitude;
        document.getElementById("longitude").value = data.longitude;
        document.getElementById("radius").value = data.radius;

    }

}

loadGPS();

// =======================
// SAVE SETTINGS
// =======================

document
.getElementById("saveBtn")
.addEventListener("click", saveGPS);

async function saveGPS() {

    const latitude =
        parseFloat(document.getElementById("latitude").value);

    const longitude =
        parseFloat(document.getElementById("longitude").value);

    const radius =
        parseFloat(document.getElementById("radius").value);

    if (
        isNaN(latitude) ||
        isNaN(longitude) ||
        isNaN(radius)
    ) {

        alert("Please enter valid GPS values.");

        return;

    }

    await set(ref(db, "gpsSettings"), {

        latitude: latitude,
        longitude: longitude,
        radius: radius

    });

    alert("GPS Settings Saved Successfully.");

}