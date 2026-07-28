import { db, ref, set, get } from "./firebase.js";

const saveBtn = document.getElementById("saveBtn");

saveBtn.addEventListener("click", async () => {

    const name = document.getElementById("name").value.trim();
    const college = document.getElementById("college").value.trim();
    const type = document.getElementById("type").value;
    const company = document.getElementById("company").value;

    if (
        name === "" ||
        college === "" ||
        type === "" ||
        company === ""
    ) {
        alert("Please fill all fields.");
        return;
    }

    try {

        const snapshot = await get(ref(db, "employees"));

        const prefix = type === "Employee" ? "EMP" : "INT";

        let maxNumber = 0;

        if (snapshot.exists()) {

            const employees = snapshot.val();

            for (const id in employees) {

                if (id.startsWith(prefix)) {

                    const number = parseInt(id.substring(3));

                    if (!isNaN(number) && number > maxNumber) {

                        maxNumber = number;

                    }

                }

            }

        }

        const nextNumber = maxNumber + 1;

        const empId =
            prefix + String(nextNumber).padStart(3, "0");

        await set(ref(db, "employees/" + empId), {

            employeeId: empId,

            name: name,

            college: college,

            type: type,

            company: company,

            password: "123456",

            active: true

        });

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

        alert(error.message);

    }

});
