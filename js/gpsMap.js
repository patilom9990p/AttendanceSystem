import { db, ref, get } from "./firebase.js";

const lat = parseFloat(sessionStorage.getItem("mapLat"));
const lon = parseFloat(sessionStorage.getItem("mapLon"));
const distance = sessionStorage.getItem("mapDistance");

// Create Map
const map = L.map("map").setView([lat, lon], 17);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{

    maxZoom:19,

    attribution:"© OpenStreetMap"

}).addTo(map);

// Employee Marker
const employeeMarker = L.marker([lat,lon]).addTo(map);

employeeMarker.bindPopup(

"<b>Unauthorized Attempt</b><br>" +
"Distance : " + distance + " m"

).openPopup();

// Get Office GPS
const gpsSnapshot = await get(ref(db,"gpsSettings"));

if(gpsSnapshot.exists()){

    const office = gpsSnapshot.val();

    // Office Marker
    const officeMarker = L.marker([
        office.latitude,
        office.longitude
    ]).addTo(map);

    officeMarker.bindPopup("<b>Office</b>");

    // Draw Line
    L.polyline([
        [office.latitude,office.longitude],
        [lat,lon]
    ],{

        color:"red",

        weight:4

    }).addTo(map);

    // Fit Map
    map.fitBounds([
        [office.latitude,office.longitude],
        [lat,lon]
    ]);

}