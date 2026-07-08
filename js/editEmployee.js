import { db, ref, get, set, update, remove } from "./firebase.js";

// Get Employee ID from URL
const params = new URLSearchParams(window.location.search);
const empID = params.get("id");

// Show Employee ID
document.getElementById("empID").value = empID;

// =======================
// LOAD EMPLOYEE
// =======================

async function loadEmployee() {

    try {

        const snapshot = await get(ref(db, "employees/" + empID));

        if (!snapshot.exists()) {
            alert("Employee not found.");
            return;
        }

        const data = snapshot.val();

        document.getElementById("name").value = data.name;
        document.getElementById("college").value = data.college;
        document.getElementById("type").value = data.type;

    } catch (error) {

        alert(error.message);

    }

}

loadEmployee();

// =======================
// UPDATE BUTTON
// =======================

document.getElementById("updateBtn").addEventListener("click", updateEmployee);

// =======================
// UPDATE EMPLOYEE
// =======================

async function updateEmployee() {

    const name = document.getElementById("name").value.trim();
    const college = document.getElementById("college").value.trim();
    const newType = document.getElementById("type").value;

    if (name === "" || college === "") {
        alert("Please fill all fields.");
        return;
    }

    try {

        const empSnapshot = await get(ref(db, "employees/" + empID));

        if (!empSnapshot.exists()) {
            alert("Employee not found.");
            return;
        }

        const oldData = empSnapshot.val();

        // ==========================
        // SAME TYPE
        // ==========================

        if (oldData.type === newType) {

            await update(ref(db, "employees/" + empID), {

                name: name,
                college: college,
                type: newType

            });

            alert("Employee Updated Successfully");

            window.location.href = "viewAttendance.html";

            return;

        }

        // ==========================
        // TYPE CHANGED
        // ==========================

        const confirmChange = confirm(
            "Employee type changed.\n\nEmployee ID will also change.\n\nContinue?"
        );

        if (!confirmChange) return;

        // Read all employees
        const allEmpSnapshot = await get(ref(db, "employees"));

        const employees = allEmpSnapshot.val();

        let maxNumber = 0;

        const prefix = (newType === "Employee") ? "EMP" : "INT";

        for (let id in employees) {

            if (id.startsWith(prefix)) {

                const num = parseInt(id.substring(3));

                if (num > maxNumber)
                    maxNumber = num;

            }

        }

        const newID =
            prefix + String(maxNumber + 1).padStart(3, "0");

        // Create new employee

   // ==========================
// CREATE NEW EMPLOYEE / INTERN
// ==========================
console.log("Old Data:", oldData);
console.log("New ID:", newID);
console.log("Password:", oldData.password);
console.log("Active:", oldData.active);
await set(ref(db, "employees/" + newID), {

    employeeId: newID,
    name: name,
    college: college,
    type: newType,

    // Login Details
    password: oldData.password ? oldData.password : "123456",
    active: oldData.active !== undefined ? oldData.active : true

});

        // ==========================
        // MOVE ATTENDANCE
        // ==========================

        const attendanceSnapshot =
            await get(ref(db, "attendance/" + empID));

        if (attendanceSnapshot.exists()) {

            await set(
                ref(db, "attendance/" + newID),
                attendanceSnapshot.val()
            );

            await remove(ref(db, "attendance/" + empID));

        }

        // Delete old employee

        await remove(ref(db, "employees/" + empID));

        alert(
            "Employee Updated Successfully.\n\nNew Employee ID : " + newID
        );

        window.location.href = "viewAttendance.html";

    }
    catch (error) {

        alert(error.message);

    }

}
