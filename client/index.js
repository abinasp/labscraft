const modal = document.getElementById("trackingModal");
const closeBtn = document.getElementsByClassName("close")[0];
const trackingDetails = document.getElementById("trackingDetails");
const loadingDiv = document.getElementById("loading");

const API_URL = "https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate";
const TRACKING_API = "https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails";
const username = "WL1164_trk_json";
const password = "i0RRZ";

closeBtn.onclick = function () {
    modal.style.display = "none";
}

window.onclick = function (event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

async function trackOrder() {
    const trackingNumber = document.getElementById("trackingNumber").value;

    if (!trackingNumber) {
        alert("Please enter a tracking number");
        return;
    }

    // Validate tracking number format (first char alphabet, followed by 8 digits)
    const trackingRegex = /^[A-Za-z]\d{8}$/;
    if (!trackingRegex.test(trackingNumber)) {
        alert("Invalid tracking number format. It should be 1 alphabet followed by 8 digits.");
        return;
    }

    loadingDiv.style.display = "block";

    try {
        // Call the server API
        const response = await fetch(`${API_URL}?username=${username}&password=${password}`);
        const token = await response.text();

        if (!token) {
            throw new Error("Failed to fetch tracking details");
        }
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append('X-Access-Token', token);
        const trackDetails = await fetch(
            TRACKING_API,
            {
                method: "POST",
                headers: myHeaders,
                body: JSON.stringify({
                    trkType: 'cnno',
                    strcnno: trackingNumber,
                    addtnlDtl: 'Y'
                })
            },
            {

            }
        )
        const data = await trackDetails.json();

        if (data && data.trackDetails) {
            // Generate timeline HTML
            const timelineHtml = data.trackDetails.map((track, index) => `
                <div class="timeline-item">
                    <div class="timeline-content">
                        <div class="timeline-date">${formatDate(track.strActionDate)} ${formatTime(track.strActionTime)}</div>
                        <div class="timeline-action">${track.strAction}</div>
                        <div class="timeline-location">
                            ${track.strOrigin ? `Origin: ${track.strOrigin}` : ''}
                            ${track.strDestination ? ` | Destination: ${track.strDestination}` : ''}
                        </div>
                        ${track.sTrRemarks ? `<div class="timeline-remarks">${track.sTrRemarks}</div>` : ''}
                    </div>
                </div>
            `).reverse().join('');

            // Additional shipment details
            const headerDetails = `
                <div class="shipment-header">
                    <p><strong>Tracking Number:</strong> ${data.trackHeader.strShipmentNo}</p>
                    <p><strong>Current Status:</strong> ${data.trackHeader.strStatus}</p>
                    <p><strong>Origin:</strong> ${data.trackHeader.strOrigin}</p>
                    <p><strong>Destination:</strong> ${data.trackHeader.strDestination}</p>
                    <p><strong>Expected Delivery:</strong> ${formatDate(data.trackHeader.strExpectedDeliveryDate)}</p>
                </div>
            `;

            // Combine header and timeline
            trackingDetails.innerHTML = headerDetails +
                `<div class="tracking-timeline">${timelineHtml}</div>`;

            modal.style.display = "block";
        } else {
            alert("No tracking information found");
        }
    } catch (error) {
        alert("An error occurred while tracking your order. Please try again later.");
        console.error('Error:', error);
    } finally {
        loadingDiv.style.display = "none";
    }
}

function formatDate(dateString) {
    if (!dateString) return '';
    // Assuming format is DDMMYYYY
    return `${dateString.slice(0, 2)}/${dateString.slice(2, 4)}/${dateString.slice(4)}`;
}

function formatTime(timeString) {
    if (!timeString) return '';

    // Add colon to time string (2132 -> 21:32)
    const time = timeString.replace(/^(\d{2})(\d{2})$/, "$1:$2");

    // Convert to Date object for easy conversion
    const [hours, minutes] = time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));

    // Format to AM/PM
    return date.toLocaleString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    });
}