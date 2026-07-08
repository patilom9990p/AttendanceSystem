import { db, ref, get, child } from "./firebase.js";
// Live Date & Time
function updateClock() {

    const now = new Date();

    document.getElementById("currentDate").innerHTML =
        "Date : " + now.toLocaleDateString();

    document.getElementById("currentTime").innerHTML =
        "Time : " + now.toLocaleTimeString();

}

updateClock();

setInterval(updateClock,1000);
const searchBtn = document.getElementById("searchBtn");
window.currentEmployeeID = "";
searchBtn.addEventListener("click", async () => {

    const empID = document.getElementById("empID").value.trim().toUpperCase();

    if(empID === ""){
        alert("Please enter Employee ID");
        return;
    }

    try{

        const snapshot = await get(child(ref(db), "employees/" + empID));

        if(snapshot.exists()){
            window.currentEmployeeID = empID;
            window.dispatchEvent(
    new CustomEvent("employeeSelected")
);
            const data = snapshot.val();

            document.getElementById("empName").innerHTML =
                "Name : " + data.name;

            document.getElementById("college").innerHTML =
                "College : " + data.college + " | Type : " + data.type;

        }
        else{

            alert("Employee Not Found");

            document.getElementById("empName").innerHTML = "Name : --";
            document.getElementById("college").innerHTML = "College : --";

        }

    }
    catch(error){

        alert(error.message);

    }

});