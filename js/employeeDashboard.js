import {
    db,
    ref,
    get,
    set,
    update,
    push
} from "./firebase.js";

// =====================================
// EMPLOYEE SESSION
// =====================================

const empID =
    sessionStorage.getItem("employeeID");

if (!empID) {

    window.location.href =
        "employeeLogin.html";

}

// =====================================
// HTML ELEMENTS
// =====================================

const checkInBtn =
    document.getElementById("checkInBtn");

const checkOutBtn =
    document.getElementById("checkOutBtn");

const logoutBtn =
    document.getElementById("logoutBtn");

// =====================================
// CURRENT EMPLOYEE DATA
// =====================================

let currentEmployee = null;

// =====================================
// CHECK EMPLOYEE ACCOUNT
// =====================================

async function verifyEmployeeAccount() {

    try {

        const snapshot = await get(
            ref(db, "employees/" + empID)
        );

        if (!snapshot.exists()) {

            alert(
                "Employee account not found."
            );

            logoutEmployee();

            return null;

        }

        const employee =
            snapshot.val();

        // Block disabled employees
        if (employee.active === false) {

            alert(
                "Your employee account has been disabled.\n\n" +
                "Please contact the administrator."
            );

            logoutEmployee();

            return null;

        }

        currentEmployee = employee;

        return employee;

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to verify employee account.\n\n" +
            error.message
        );

        return null;

    }

}

// =====================================
// LOGOUT EMPLOYEE
// =====================================

function logoutEmployee() {

    sessionStorage.removeItem("employeeID");

    sessionStorage.removeItem(
        "employeeLoggedIn"
    );

    window.location.href =
        "employeeLogin.html";

}

// =====================================
// CALCULATE GPS DISTANCE
// =====================================

function calculateDistance(
    lat1,
    lon1,
    lat2,
    lon2
) {

    const R = 6371000;

    const dLat =
        (lat2 - lat1) *
        Math.PI / 180;

    const dLon =
        (lon2 - lon1) *
        Math.PI / 180;

    const a =
        Math.sin(dLat / 2) *
        Math.sin(dLat / 2) +

        Math.cos(
            lat1 * Math.PI / 180
        ) *

        Math.cos(
            lat2 * Math.PI / 180
        ) *

        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c =
        2 *
        Math.atan2(
            Math.sqrt(a),
            Math.sqrt(1 - a)
        );

    return R * c;

}

// =====================================
// VERIFY OFFICE GPS LOCATION
// =====================================

async function verifyOfficeLocation(
    action
) {

    const employee =
        await verifyEmployeeAccount();

    if (!employee) {
        return null;
    }

    return new Promise((resolve) => {

        if (!navigator.geolocation) {

            alert(
                "Geolocation is not supported by this browser."
            );

            resolve(null);

            return;

        }

        navigator.geolocation.getCurrentPosition(

            async function (position) {

                try {

                    const gpsSnapshot =
                        await get(
                            ref(
                                db,
                                "gpsSettings"
                            )
                        );

                    if (!gpsSnapshot.exists()) {

                        alert(
                            "Office GPS settings not found."
                        );

                        resolve(null);

                        return;

                    }

                    const office =
                        gpsSnapshot.val();

                    const officeLatitude =
                        Number(
                            office.latitude
                        );

                    const officeLongitude =
                        Number(
                            office.longitude
                        );

                    const officeRadius =
                        Number(
                            office.radius
                        );

                    if (
                        Number.isNaN(
                            officeLatitude
                        ) ||
                        Number.isNaN(
                            officeLongitude
                        ) ||
                        Number.isNaN(
                            officeRadius
                        )
                    ) {

                        alert(
                            "Office GPS settings are invalid."
                        );

                        resolve(null);

                        return;

                    }

                    const userLatitude =
                        position.coords.latitude;

                    const userLongitude =
                        position.coords.longitude;

                    const distance =
                        calculateDistance(
                            officeLatitude,
                            officeLongitude,
                            userLatitude,
                            userLongitude
                        );

                    if (
                        distance >
                        officeRadius
                    ) {

                        await saveUnauthorizedAttempt(
                            action,
                            {
                                latitude:
                                    userLatitude,

                                longitude:
                                    userLongitude,

                                distance:
                                    distance
                            }
                        );

                        alert(
                            "Attendance Denied!\n\n" +
                            "You are outside the office area.\n\n" +
                            "Distance: " +
                            distance.toFixed(2) +
                            " metres.\n\n" +
                            "Your location has been recorded " +
                            "and sent to the administrator."
                        );

                        resolve(null);

                        return;

                    }

                    resolve({

                        latitude:
                            userLatitude,

                        longitude:
                            userLongitude,

                        distance:
                            distance

                    });

                }
                catch (error) {

                    console.error(error);

                    alert(
                        "Unable to verify office location.\n\n" +
                        error.message
                    );

                    resolve(null);

                }

            },

            function (error) {

                let message =
                    "Unable to access your location.";

                if (
                    error.code ===
                    error.PERMISSION_DENIED
                ) {

                    message =
                        "Location permission was denied.";

                }
                else if (
                    error.code ===
                    error.POSITION_UNAVAILABLE
                ) {

                    message =
                        "Your location is currently unavailable.";

                }
                else if (
                    error.code ===
                    error.TIMEOUT
                ) {

                    message =
                        "Location request timed out.";

                }

                alert(message);

                resolve(null);

            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }

        );

    });

}

// =====================================
// SAVE UNAUTHORISED ATTEMPT
// =====================================

async function saveUnauthorizedAttempt(
    action,
    gps
) {

    try {

        const employee =
            await verifyEmployeeAccount();

        if (!employee) {
            return;
        }

        const attemptRef =
            push(
                ref(
                    db,
                    "unauthorizedAttempts/" +
                    empID
                )
            );

        const now =
            new Date();

        await set(
            attemptRef,
            {

                employeeId:
                    employee.employeeId ||
                    empID,

                name:
                    employee.name ||
                    "--",

                type:
                    employee.type ||
                    "--",

                company:
                    employee.company ||
                    "--",

                action:
                    action,

                latitude:
                    gps.latitude,

                longitude:
                    gps.longitude,

                distance:
                    Number(
                        gps.distance.toFixed(2)
                    ),

                date:
                    now.toLocaleDateString(),

                time:
                    now.toLocaleTimeString(),

                timestamp:
                    now.getTime()

            }
        );

    }
    catch (error) {

        console.error(
            "Unable to save GPS attempt:",
            error
        );

    }

}

// =====================================
// LOAD EMPLOYEE PROFILE
// =====================================

async function loadProfile() {

    try {

        const employee =
            await verifyEmployeeAccount();

        if (!employee) {
            return;
        }

        document.getElementById(
            "empName"
        ).textContent =
            "Name : " +
            (employee.name || "--");

        document.getElementById(
            "empID"
        ).textContent =
            "Employee ID : " +
            (
                employee.employeeId ||
                empID
            );

        document.getElementById(
            "college"
        ).textContent =
            "College : " +
            (employee.college || "--");

        document.getElementById(
            "type"
        ).textContent =
            "Type : " +
            (employee.type || "--");

        document.getElementById(
            "company"
        ).textContent =
            "Company : " +
            (employee.company || "--");

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load profile.\n\n" +
            error.message
        );

    }

}

// =====================================
// CLOCK
// =====================================

function updateClock() {

    const now =
        new Date();

    document.getElementById(
        "currentDate"
    ).textContent =
        "Date : " +
        now.toLocaleDateString();

    document.getElementById(
        "currentTime"
    ).textContent =
        "Time : " +
        now.toLocaleTimeString();

}

// =====================================
// LOAD TODAY ATTENDANCE
// =====================================

async function loadTodayAttendance() {

    try {

        const employee =
            await verifyEmployeeAccount();

        if (!employee) {
            return;
        }

        const today =
            new Date()
                .toISOString()
                .split("T")[0];

        const snapshot =
            await get(
                ref(
                    db,
                    "attendance/" +
                    empID +
                    "/" +
                    today
                )
            );

        if (!snapshot.exists()) {

            document.getElementById(
                "todayCheckIn"
            ).textContent =
                "Check In : --";

            document.getElementById(
                "todayCheckOut"
            ).textContent =
                "Check Out : --";

            document.getElementById(
                "todayWorkingHours"
            ).textContent =
                "Working Hours : --";

            checkInBtn.disabled =
                false;

            checkOutBtn.disabled =
                true;

            return;

        }

        const data =
            snapshot.val();

        document.getElementById(
            "todayCheckIn"
        ).textContent =
            "Check In : " +
            (data.checkIn || "--");

        document.getElementById(
            "todayCheckOut"
        ).textContent =
            "Check Out : " +
            (data.checkOut || "--");

        document.getElementById(
            "todayWorkingHours"
        ).textContent =
            "Working Hours : " +
            (data.workingHours || "--");

        if (
            !data.checkOut
        ) {

            checkInBtn.disabled =
                true;

            checkOutBtn.disabled =
                false;

        }
        else {

            checkInBtn.disabled =
                true;

            checkOutBtn.disabled =
                true;

        }

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to load today's attendance.\n\n" +
            error.message
        );

    }

}

// =====================================
// CHECK IN
// =====================================

checkInBtn.addEventListener(
    "click",
    async function () {

        const employee =
            await verifyEmployeeAccount();

        if (!employee) {
            return;
        }

        checkInBtn.disabled =
            true;

        try {

            const gps =
                await verifyOfficeLocation(
                    "Check In"
                );

            if (!gps) {

                checkInBtn.disabled =
                    false;

                return;

            }

            const now =
                new Date();

            const today =
                now
                    .toISOString()
                    .split("T")[0];

            const attendanceRef =
                ref(
                    db,
                    "attendance/" +
                    empID +
                    "/" +
                    today
                );

            const existingSnapshot =
                await get(
                    attendanceRef
                );

            if (
                existingSnapshot.exists()
            ) {

                alert(
                    "You have already checked in today."
                );

                await loadTodayAttendance();

                return;

            }

            await set(
                attendanceRef,
                {

                    checkIn:
                        now.toLocaleTimeString(),

                    checkInTimestamp:
                        now.getTime(),

                    checkOut:
                        "",

                    checkOutTimestamp:
                        0,

                    workingHours:
                        "",

                    status:
                        "Present",

                    latitude:
                        gps.latitude,

                    longitude:
                        gps.longitude,

                    distance:
                        Number(
                            gps.distance.toFixed(2)
                        ),

                    gpsVerified:
                        true

                }
            );

            alert(
                "Checked In Successfully"
            );

            await loadTodayAttendance();

            if (
                typeof loadAttendanceHistory ===
                "function"
            ) {

                loadAttendanceHistory();

            }

        }
        catch (error) {

            console.error(error);

            alert(
                "Unable to check in.\n\n" +
                error.message
            );

            checkInBtn.disabled =
                false;

        }

    }
);

// =====================================
// CHECK OUT
// =====================================

checkOutBtn.addEventListener(
    "click",
    async function () {

        const employee =
            await verifyEmployeeAccount();

        if (!employee) {
            return;
        }

        checkOutBtn.disabled =
            true;

        try {

            const gps =
                await verifyOfficeLocation(
                    "Check Out"
                );

            if (!gps) {

                checkOutBtn.disabled =
                    false;

                return;

            }

            const today =
                new Date()
                    .toISOString()
                    .split("T")[0];

            const attendanceRef =
                ref(
                    db,
                    "attendance/" +
                    empID +
                    "/" +
                    today
                );

            const snapshot =
                await get(
                    attendanceRef
                );

            if (!snapshot.exists()) {

                alert(
                    "No Check-In Record Found."
                );

                checkOutBtn.disabled =
                    true;

                return;

            }

            const data =
                snapshot.val();

            if (data.checkOut) {

                alert(
                    "You have already checked out today."
                );

                await loadTodayAttendance();

                return;

            }

            const checkInTimestamp =
                Number(
                    data.checkInTimestamp
                );

            if (
                !checkInTimestamp ||
                Number.isNaN(
                    checkInTimestamp
                )
            ) {

                alert(
                    "Check-in timestamp is invalid."
                );

                checkOutBtn.disabled =
                    false;

                return;

            }

            const now =
                Date.now();

            const difference =
                Math.max(
                    0,
                    now -
                    checkInTimestamp
                );

            const hours =
                Math.floor(
                    difference /
                    3600000
                );

            const minutes =
                Math.floor(
                    (
                        difference %
                        3600000
                    ) /
                    60000
                );

            const seconds =
                Math.floor(
                    (
                        difference %
                        60000
                    ) /
                    1000
                );

            const workingHours =
                String(hours)
                    .padStart(2, "0") +
                ":" +
                String(minutes)
                    .padStart(2, "0") +
                ":" +
                String(seconds)
                    .padStart(2, "0");

            await update(
                attendanceRef,
                {

                    checkOut:
                        new Date()
                            .toLocaleTimeString(),

                    checkOutTimestamp:
                        now,

                    workingHours:
                        workingHours,

                    checkOutLatitude:
                        gps.latitude,

                    checkOutLongitude:
                        gps.longitude,

                    checkOutDistance:
                        Number(
                            gps.distance.toFixed(2)
                        )

                }
            );

            alert(
                "Checked Out Successfully"
            );

            await loadTodayAttendance();

            if (
                typeof loadAttendanceHistory ===
                "function"
            ) {

                loadAttendanceHistory();

            }

        }
        catch (error) {

            console.error(error);

            alert(
                "Unable to check out.\n\n" +
                error.message
            );

            checkOutBtn.disabled =
                false;

        }

    }
);

// =====================================
// LOGOUT BUTTON
// =====================================

logoutBtn.addEventListener(
    "click",
    function () {

        sessionStorage.clear();

        window.location.href =
            "employeeLogin.html";

    }
);

// =====================================
// INITIAL PAGE LOAD
// =====================================

async function initializeDashboard() {

    checkInBtn.disabled =
        true;

    checkOutBtn.disabled =
        true;

    const employee =
        await verifyEmployeeAccount();

    if (!employee) {
        return;
    }

    await loadProfile();

    await loadTodayAttendance();

    if (
        typeof loadAttendanceHistory ===
        "function"
    ) {

        loadAttendanceHistory();

    }

    updateClock();

    setInterval(
        updateClock,
        1000
    );

    // Check account status every 30 seconds.
    // If the admin disables the account while the employee
    // dashboard is open, the employee is logged out.
    setInterval(
        verifyEmployeeAccount,
        30000
    );

}

initializeDashboard();
