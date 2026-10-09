require('dotenv').config();
const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json()); 

// Initialize Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Hardcoded Center Point
const CENTER_LAT = 12.8400; 
const CENTER_LNG = 77.6600;

// Global alert state variables
let alertCount = 0;
let lastAlertTime = 0;

const RED_RADIUS = 70;
const YELLOW_RADIUS = 50;

function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; 
    const rad = Math.PI / 180;
    const dLat = (lat2 - lat1) * rad;
    const dLon = (lon2 - lon1) * rad;
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * rad) * Math.cos(lat2 * rad) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; 
}

app.post('/update-location', async (req, res) => {
    const { lat, lng } = req.body;
    
    if (!lat || !lng) {
        return res.status(400).json({ error: "Missing latitude or longitude" });
    }

    const distanceInMeters = calculateDistance(CENTER_LAT, CENTER_LNG, lat, lng);
    const currentTime = Date.now();
    
    let alertStatus = "Safe";
    
    if (distanceInMeters > RED_RADIUS) {
        alertStatus = "Red Alert";
    } else if (distanceInMeters > YELLOW_RADIUS && distanceInMeters <= RED_RADIUS) {
        alertStatus = "Yellow Alert";
    }

    if (alertStatus !== "Safe") {
        const requiredGap = alertCount < 2 ? 60000 : 600000;
        
        if (currentTime - lastAlertTime >= requiredGap) {
            twilioClient.calls.create({
                url: 'http://demo.twilio.com/docs/voice.xml',
                from: process.env.TWILIO_PHONE_NUMBER,
                to: process.env.MY_PHONE_NUMBER
            }).then(call => console.log(`${alertStatus} Call Initiated! Call ID: ${call.sid}`))
              .catch(error => console.error(`Call Failed:`, error));
            
            alertCount++;
            lastAlertTime = currentTime;
        } else {
            const minutesLeft = Math.ceil((requiredGap - (currentTime - lastAlertTime)) / 60000);
            console.log(`${alertStatus} active. Next call allowed in ${minutesLeft} minutes.`);
        }
    }

    console.log(`Ping: [${lat}, ${lng}] | Distance: ${Math.round(distanceInMeters)}m | Status: ${alertStatus}`);
    
    try {
        const { error } = await supabase.from('location_pings').insert({
            latitude: parseFloat(lat),
            longitude: parseFloat(lng),
            distance_from_center: distanceInMeters,
            alert_status: alertStatus
        });
        
        if (error) {
            console.error("Supabase insert error:", error);
        }
    } catch (error) {
        console.error("Failed to save ping to database:", error);
    }
    
    res.json({ 
        distance_meters: Math.round(distanceInMeters),
        status: alertStatus
    });
});

app.listen(port, () => {
    console.log(`Orbit Backend is live on port ${port}`);
});
