import { set, update } from "./firebase.js";
import { db, ref, get } from "./firebase.js";



const empID = sessionStorage.getItem("employeeID");



async function loadProfile() {

    try {

        const snapshot = await get(ref(db, "employees/" + empID));

        

        if (!snapshot.exists()) {
            alert("Employee Not Found");
            return;
        }

        const employee = snapshot.val();

        

        document.getElementById("empName").textContent =
            "Name : " + employee.name;

        document.getElementById("empID").textContent =
            "Employee ID : " + employee.employeeId;

        document.getElementById("college").textContent =
            "College : " + employee.college;

        document.getElementById("type").textContent =
            "Type : " + employee.type;

    }
    catch (error) {

        alert(error.message);

    }

}

loadProfile();
setInterval(updateClock,1000);

updateClock();

function updateClock(){

    const now = new Date();

    document.getElementById("currentDate").innerHTML =
    "Date : " + now.toLocaleDateString();

    document.getElementById("currentTime").innerHTML =
    "Time : " + now.toLocaleTimeString();

}
loadTodayAttendance();

async function loadTodayAttendance(){

    const today = new Date().toISOString().split("T")[0];

    const snapshot = await get(
        ref(db,"attendance/"+empID+"/"+today)
    );

    if(!snapshot.exists()){

        document.getElementById("checkInBtn").disabled=false;
        document.getElementById("checkOutBtn").disabled=true;

        return;

    }

    const data = snapshot.val();

    document.getElementById("todayCheckIn").innerHTML =
    "Check In : " + data.checkIn;

    document.getElementById("todayCheckOut").innerHTML =
    "Check Out : " + (data.checkOut || "--");

    document.getElementById("todayWorkingHours").innerHTML =
    "Working Hours : " + (data.workingHours || "--");

    if(data.checkOut===""){

        checkInBtn.disabled=true;
        checkOutBtn.disabled=false;

    }else{

        checkInBtn.disabled=true;
        checkOutBtn.disabled=true;

    }

}

document.getElementById("logoutBtn").onclick = function () {

  

    sessionStorage.clear();

    location.href = "employeeLogin.html";

};


const checkInBtn = document.getElementById("checkInBtn");

checkInBtn.onclick = async () => {

    // Verify Office GPS
    const gps = await verifyOfficeLocation();

    if (!gps) return;

    const now = new Date();

    const today = now.toISOString().split("T")[0];

    await set(ref(db, "attendance/" + empID + "/" + today), {

        checkIn: now.toLocaleTimeString(),

        checkInTimestamp: now.getTime(),

        checkOut: "",

        checkOutTimestamp: 0,

        workingHours: "",

        status: "Present",

        // GPS Details
        latitude: gps.latitude,

        longitude: gps.longitude,

        distance: Number(gps.distance.toFixed(2)),

        gpsVerified: true

    });

    alert("Checked In Successfully");

    loadTodayAttendance();

};
const checkOutBtn = document.getElementById("checkOutBtn");

checkOutBtn.onclick = async () => {

    // Verify Office GPS
    const gps = await verifyOfficeLocation();

    if (!gps) return;

    const today = new Date().toISOString().split("T")[0];

    const snapshot = await get(
        ref(db, "attendance/" + empID + "/" + today)
    );

    if (!snapshot.exists()) {

        alert("No Check-In Record Found.");

        return;

    }

    const data = snapshot.val();

    const now = Date.now();

    const diff = now - data.checkInTimestamp;

    const h = Math.floor(diff / 3600000);

    const m = Math.floor((diff % 3600000) / 60000);

    const s = Math.floor((diff % 60000) / 1000);

    const workingHours =
        String(h).padStart(2, "0") + ":" +
        String(m).padStart(2, "0") + ":" +
        String(s).padStart(2, "0");

    await update(ref(db, "attendance/" + empID + "/" + today), {

        checkOut: new Date().toLocaleTimeString(),

        checkOutTimestamp: now,

        workingHours: workingHours,

        // GPS Details
        checkOutLatitude: gps.latitude,

        checkOutLongitude: gps.longitude,

        checkOutDistance: Number(gps.distance.toFixed(2))

    });

    alert("Checked Out Successfully");

    loadTodayAttendance();

};
loadAttendanceHistory();
