const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(cors());

const config = {
    authUrl: 'https://blktracksvc.dtdc.com/dtdc-api/api/dtdc/authenticate',
    trackingUrl: 'https://blktracksvc.dtdc.com/dtdc-api/rest/JSONCnTrk/getTrackDetails',
    username: 'WL1164_trk_json',
    password: 'i0RRZ'
};

// Authenticate with DTDC API
async function getAuthToken() {
    try {
        const response = await axios.get(`${config.authUrl}?username=${config.username}&password=${config.password}`);
        if (response.status === 200) {
            return response.data;
        }
        throw new Error('Failed to authenticate');
    } catch (error) {
        console.error('Error authenticating:', error.message);
        throw error;
    }
}

// Fetch tracking details
async function getTrackingDetails(token, trackingNumber) {
    try {
        const response = await axios.post(
            config.trackingUrl,
            {
                trkType: 'cnno',
                strcnno: trackingNumber,
                addtnlDtl: 'Y'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Access-Token': token
                }
            }
        );
        return response.data;
    } catch (error) {
        console.error('Error fetching tracking details:', error.message);
        throw error;
    }
}

// Proxy Route
app.get("/", (req, res)=>{
    res.status(200).json({
        status: true,
        message: "Welcome!"
    })
})
app.get('/track-order', async (req, res) => {
    const { trackingNumber } = req.query;
    res.setHeader('Access-Control-Allow-Origin', '*'); // Allow all origins
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS'); // Allow specific HTTP methods
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type'); // Allow specific headers

    if (req.method === 'OPTIONS') {
        // Handle preflight request for CORS
        res.status(200).end();
        return;
    }

    if (!trackingNumber) {
        return res.status(400).json({ error: 'Tracking number is required' });
    }

    try {
        const token = await getAuthToken();
        const trackingDetails = await getTrackingDetails(token, trackingNumber);

        res.json(trackingDetails);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch tracking details' });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});