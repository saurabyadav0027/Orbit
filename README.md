# Orbit 🛰️ - Real-Time Tracking Command Center

Orbit is a full-stack web dashboard designed to track, visualize, and manage real-time GPS telemetry. Currently configured as a Minimum Viable Product (MVP), the platform features a manually draggable map interface that simulates hardware movement, calculates geofence breaches, and triggers automated voice alerts with dynamic cooldowns.

This project is built as the software foundation for a physical IoT integration, ready to receive live coordinate data from an ESP32 microcontroller and GPS module.

## 🚀 Key Features

*   **Two-Tier Geofencing:** 
    *   **Yellow Zone:** Triggers a Level 1 alert.
    *   **Red Zone:** Triggers a maximum-priority alert.
*   **Automated Twilio Integration:** Calls the designated phone number upon zone breaches, utilizing a dynamic cooldown system (1-minute gap for the first two alerts, 10-minute gap for subsequent alerts) to prevent API spam.
*   **Live Database Sync:** Every ping is logged to a PostgreSQL database via the Supabase JS SDK, tracking latitude, longitude, distance from the center, alert status, and timestamps.
*   **Dark Mode UI:** A glass-morphic React dashboard using React-Leaflet with custom CSS inversion for a sleek, high-contrast command center aesthetic.

## 💻 Tech Stack

*   **Frontend:** React, Vite, Tailwind CSS, React-Leaflet
*   **Backend:** Node.js, Express, Supabase JS SDK, Twilio API
*   **Database:** PostgreSQL (Hosted on Supabase)

## 🔌 Hardware Integration Guide (For ESP32 / GPS)

The backend is fully configured to accept live telemetry from external microcontrollers. To integrate a physical GPS tracker, program the ESP32 to send an HTTP POST request to the local network or hosted backend URL with the following JSON payload:

**Endpoint:** `POST /update-location`
**Headers:** `Content-Type: application/json`
**Body:**
```json
{
  "latitude": 12.8404,
  "longitude": 77.6604
}
