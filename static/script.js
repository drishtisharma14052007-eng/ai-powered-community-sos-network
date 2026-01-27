let userLocation = null;
let currentId = null;

// --------------------- GET LOCATION ---------------------
function getLocation() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            userLocation = {
                lat: position.coords.latitude,
                lon: position.coords.longitude
            };

            document.getElementById("locationStatus").innerText = "📍 Location Enabled";
            document.getElementById("emergencyButtons").style.display = "block";
        },
        () => alert("Please enable location to use SOS")
    );
}

// --------------------- SEND SOS ---------------------
async function sendSOS(type) {
    if (!userLocation) {
        alert("Enable location first 🚫");
        return;
    }

    try {
        const res = await fetch("/send_alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                issue: type,
                location: userLocation,
                status: "active",
                time: new Date().toLocaleString()
            })
        });

        if (res.ok) {
            alert("SOS Sent Successfully 🚨");
            loadAlerts(); // update dashboard
        } else {
            throw new Error("Failed to send SOS");
        }
    } catch (err) {
        console.error(err);
        alert("Failed to send SOS ❌");
    }
}

// --------------------- POPUP ---------------------
function openPopup(card) {
    currentId = card.dataset.id;
    document.getElementById("popup").style.display = "flex";
}

function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// --------------------- RESOLVE / CANCEL ALERT ---------------------
async function resolveAlert() {
    if (!currentId) return alert("No alert selected");

    try {
        await fetch(`/resolve_alert/${currentId}`, { method: "POST" });
        moveAlertCard(currentId, "resolvedSection");
        closePopup();
    } catch (err) {
        console.error(err);
        alert("Failed to resolve alert ❌");
    }
}

async function cancelAlert() {
    if (!currentId) return alert("No alert selected");

    try {
        await fetch(`/cancel_alert/${currentId}`, { method: "POST" });
        moveAlertCard(currentId, "canceledSection");
        closePopup();
    } catch (err) {
        console.error(err);
        alert("Failed to cancel alert ❌");
    }
}

// --------------------- MOVE ALERT CARD ---------------------
function moveAlertCard(id, targetSectionId) {
    const card = document.querySelector(`.alert-card[data-id='${id}']`);
    if (!card) return;

    const targetSection = document.getElementById(targetSectionId);
    if (!targetSection) return;

    card.remove();
    targetSection.appendChild(card);
}

// --------------------- LOAD ALERTS ---------------------
async function loadAlerts() {
    try {
        const res = await fetch("/get_alerts");
        const data = await res.json();

        // Clear sections
        document.getElementById("activeSection").innerHTML = "";
        document.getElementById("resolvedSection").innerHTML = "";
        document.getElementById("canceledSection").innerHTML = "";

        // Populate sections
        data.active.forEach(alert => createAlertCard(alert, "activeSection"));
        data.resolved.forEach(alert => createAlertCard(alert, "resolvedSection"));
        data.canceled.forEach(alert => createAlertCard(alert, "canceledSection"));
    } catch (err) {
        console.error(err);
    }
}

// --------------------- CREATE ALERT CARD ---------------------
function createAlertCard(alert, sectionId) {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const card = document.createElement("div");
    card.className = "alert-card";
    card.dataset.id = alert.id;
    card.innerHTML = `
        <p><strong>Issue:</strong> ${alert.issue}</p>
        <p><strong>Time:</strong> ${alert.time || "N/A"}</p>
        <p><strong>Status:</strong> ${alert.status}</p>
        <button onclick="openPopup(this.parentElement)">Manage</button>
    `;
    section.appendChild(card);
}

// --------------------- AUTO REFRESH ---------------------
setInterval(loadAlerts, 10000); // refresh every 10s
window.onload = loadAlerts;      // initial load

