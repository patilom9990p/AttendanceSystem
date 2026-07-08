import { db, ref, get, set, update } from "./firebase.js";

const checkInBtn = document.getElementById("checkInBtn");
const checkOutBtn = document.getElementById("checkOutBtn");
const attendanceStatus =
    document.getElementById("attendanceStatus");
    async function checkTodayAttendance(employeeID){

    const today = new Date().toISOString().split("T")[0];

    const attendanceRef = ref(
        db,
        "attendance/" + employeeID + "/" + today
    );

    const snapshot = await get(attendanceRef);

    // CASE 1
    if(!snapshot.exists()){

        checkInBtn.disabled = false;
        checkOutBtn.disabled = true;

        attendanceStatus.innerHTML = "";

        return;

    }

    const data = snapshot.val();

    // CASE 2
    if(data.checkOutTimestamp == 0){

        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;

        attendanceStatus.innerHTML =
        "🟡 Checked In";

    }

    // CASE 3
    else{

        checkInBtn.disabled = true;
        checkOutBtn.disabled = true;

        attendanceStatus.innerHTML =
        "✅ Attendance Completed";

    }

}

checkInBtn.addEventListener("click", async () => {

    if (!window.currentEmployeeID) {
        alert("Please search Employee ID first.");
        return;
    }

    const today = new Date().toISOString().split("T")[0];
    const now = new Date();

const currentTime = now.toLocaleTimeString();

const currentTimestamp = now.getTime();

    const attendanceRef = ref(db, "attendance/" + window.currentEmployeeID + "/" + today);

    try {

        const snapshot = await get(attendanceRef);

        // Already checked in today
        if (snapshot.exists()) {
            alert("You have already checked in today.");
            return;
        }

        // Save attendance
        await set(attendanceRef, {

    checkIn: currentTime,
    checkInTimestamp: currentTimestamp,

    checkOut: "",
    checkOutTimestamp: 0,

    workingHours: "",

    status: "Present"

});

        alert("✅ Check In Successful!");

        checkInBtn.disabled = true;
        checkOutBtn.disabled = false;

    }
    catch (error) {

        alert(error.message);

    }

});
// ======================
// CHECK OUT
// ======================

checkOutBtn.addEventListener("click", async () => {

    alert("Step 1: Check Out Clicked");

    if (!window.currentEmployeeID) {
        alert("Employee ID not found");
        return;
    }

    const today = new Date().toISOString().split("T")[0];

    alert("Today's Date: " + today);

    const attendanceRef = ref(db, "attendance/" + window.currentEmployeeID + "/" + today);

    const snapshot = await get(attendanceRef);

    if (!snapshot.exists()) {
        alert("Attendance record not found");
        return;
    }

    alert("Attendance Found");

    const data = snapshot.val();

    alert("CheckIn Timestamp = " + data.checkInTimestamp);

    const now = Date.now();

    const diff = now - data.checkInTimestamp;

    alert("Difference = " + diff);

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const workingHours =
        `${hours}:${minutes}:${seconds}`;

    await update(attendanceRef, {

        checkOut: new Date().toLocaleTimeString(),
        checkOutTimestamp: now,
        workingHours: workingHours

    });

    alert("SUCCESS");

});
window.addEventListener("employeeSelected", () => {

    checkTodayAttendance(window.currentEmployeeID);

});