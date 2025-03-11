require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Twilio Setup
const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Store emergency contact in memory (should use DB in production)
let emergencyContact = null;

/**
 * Route to set emergency contact number
 */
app.post('/set-contact', (req, res) => {
    const { phone } = req.body;
    if (!phone || !phone.match(/^\+?[1-9]\d{9,14}$/)) {
        return res.status(400).json({ error: 'Invalid phone number format!' });
    }
    emergencyContact = phone;
    console.log("✅ Emergency contact set:", emergencyContact);
    res.json({ message: 'Emergency contact saved successfully!', contact: emergencyContact });
});

/**
 * Route to send SOS alert
 */
app.post('/send-sos', (req, res) => {
    if (!emergencyContact) {
        return res.status(400).json({ error: 'Emergency contact not set! Please set it first.' });
    }

    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Location data is required!' });
    }

    const locationUrl = `https://maps.google.com/?q=${latitude},${longitude}`;
    const message = `🚨 Emergency Alert! Help needed. Location: ${locationUrl}`;

    console.log(`📩 Sending SOS to ${emergencyContact}:`, message);

    client.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: emergencyContact,
        body: message
    })
    .then((msg) => {
        console.log("✅ SMS Sent Successfully:", msg.sid);
        res.json({ message: 'SOS alert sent successfully!', sid: msg.sid });
    })
    .catch((err) => {
        console.error("❌ Error sending SMS:", err.message);
        res.status(500).json({ error: err.message });
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
