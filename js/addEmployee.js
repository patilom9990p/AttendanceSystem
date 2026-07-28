import { db, ref, set, get } from "./firebase.js";

const saveBtn = document.getElementById("saveBtn");

// ==============================
// COMPANY PREFIX
// ==============================

function getCompanyPrefix(company) {

    if (company === "WaveNxD") {
        return "WNX";
    }

    if (company === "Nexa Prime") {
        return "NXP";
    }

    return null;
}

// ==============================
// EMPLOYEE TYPE PREFIX
// ==============================

function getTypePrefix(type) {

    if (type === "Employee") {
        return "EMP";
    }

    if (type === "Intern") {
        return "INT";
    }

    return null;
}

// ==============================
// SAVE EMPLOYEE
// ==============================

saveBtn.addEventListener("click", async () => {

    const name =
        document.getElementById("name").value.trim();

    const college =
        document.getElementById("college").value.trim();

    const type =
        document.getElementById("type").value;

    const company =
        document.getElementById("company").value;

    if (
        name === "" ||
        college === "" ||
        type === "" ||
        company === ""
    ) {

        alert("Please fill all fields.");

        return;
    }

    const companyPrefix =
        getCompanyPrefix(company);

    const typePrefix =
        getTypePrefix(type);

    if (!companyPrefix || !typePrefix) {

        alert("Invalid company or employee type.");

        return;
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving...";

    try {

        const snapshot =
            await get(ref(db, "employees"));

        const fullPrefix =
            companyPrefix + "-" + typePrefix;

        let maxNumber = 0;

        if (snapshot.exists()) {

            const employees = snapshot.val();

            for (const id in employees) {

                if (id.startsWith(fullPrefix)) {

                    const numberPart =
                        id.substring(fullPrefix.length);

                    const number =
                        parseInt(numberPart, 10);

                    if (
                        !isNaN(number) &&
                        number > maxNumber
                    ) {

                        maxNumber = number;

                    }

                }

            }

        }

        const nextNumber =
            maxNumber + 1;

        const empId =
            fullPrefix +
            String(nextNumber).padStart(3, "0");

        await set(
            ref(db, "employees/" + empId),
            {
                employeeId: empId,

                name: name,

                college: college,

                type: type,

                company: company,

                password: "123456",

                active: true,

                createdAt: Date.now()
            }
        );

        alert(
            "Employee Added Successfully!\n\n" +
            "Employee ID : " + empId +
            "\nDefault Password : 123456"
        );

        document.getElementById("name").value = "";

        document.getElementById("college").value = "";

        document.getElementById("type").selectedIndex = 0;

        document.getElementById("company").selectedIndex = 0;

    }
    catch (error) {

        console.error(error);

        alert(
            "Unable to add employee.\n\n" +
            error.message
        );

    }
    finally {

        saveBtn.disabled = false;

        saveBtn.textContent = "Save Employee";

    }

});
