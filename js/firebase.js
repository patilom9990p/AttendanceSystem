// Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
    getDatabase,
    ref,
    set,
    get,
    child,
    update,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyALynQkI83Bv0eIoDaoYibeAxdHFI-S4dY",
    authDomain: "attendance-system-81fd8.firebaseapp.com",
    databaseURL: "https://attendance-system-81fd8-default-rtdb.firebaseio.com",
    projectId: "attendance-system-81fd8",
    storageBucket: "attendance-system-81fd8.firebasestorage.app",
    messagingSenderId: "897319529194",
    appId: "1:897319529194:web:6fefac37cd197e3a984593"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Database
const db = getDatabase(app);

// Export
export {
    db,
    ref,
    set,
    get,
    child,
    update,
    remove,
    push
};
export async function generateNextID(type) {

    const snapshot = await get(ref(db, "employees"));

    let highest = 0;

    const prefix = type === "Employee" ? "EMP" : "INT";

    if (snapshot.exists()) {

        const employees = snapshot.val();

        for (const id in employees) {

            if (id.startsWith(prefix)) {

                const number = parseInt(id.substring(3));

                if (!isNaN(number) && number > highest) {
                    highest = number;
                }

            }

        }

    }

    return prefix + String(highest + 1).padStart(3, "0");
}
