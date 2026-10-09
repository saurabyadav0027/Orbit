import { useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet marker loading issues in React
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom icon for the moving tracker (red pin)
const trackerIcon = new L.Icon({
  iconUrl:
    "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function App() {
  const center = [12.84, 77.66];
  const [trackerPos, setTrackerPos] = useState([...center]);
  const [status, setStatus] = useState("SAFE");
  const [distance, setDistance] = useState(0);
  const [yellowZoneRadius, setYellowZoneRadius] = useState(50);
  const [redZoneRadius, setRedZoneRadius] = useState(70);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const handleDragEnd = (e) => {
    const marker = e.target;
    const position = marker.getLatLng();
    const newPos = [position.lat, position.lng];
    setTrackerPos(newPos);

    fetch("http://localhost:3000/update-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: newPos[0],
        lng: newPos[1],
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.status) setStatus(data.status);
        if (data && data.distance_meters !== undefined)
          setDistance(data.distance_meters);
      })
      .catch(console.error);
  };

  const isRedAlert = status === "Red Alert" || status === "RED_ALERT";
  const isYellowAlert = status === "Yellow Alert" || status === "YELLOW_ALERT";
  const statusColor = isRedAlert
    ? "text-red-500 bg-red-500/10 border-red-500/30"
    : isYellowAlert
      ? "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
      : "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";

  return (
    <div className="relative h-screen w-screen bg-slate-900 overflow-hidden font-sans text-slate-200">
      {/* Sleek Command Center Overlay */}
      <div className="absolute top-6 left-6 z-[1000] w-80 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 p-6 rounded-2xl shadow-2xl shadow-black/50 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-slate-700/50 pb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-inner">
            <svg
              className="w-5 h-5 text-indigo-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">
              Command Center
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Orbit Tracking System
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Status Indicator */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Live Status
            </span>
            <div
              className={`px-4 py-3 rounded-lg border flex items-center gap-3 transition-colors duration-500 ${statusColor}`}
            >
              <div className="relative flex h-3 w-3">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRedAlert ? "bg-red-400" : isYellowAlert ? "bg-yellow-400" : "bg-emerald-400"}`}
                ></span>
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${isRedAlert ? "bg-red-500" : isYellowAlert ? "bg-yellow-500" : "bg-emerald-500"}`}
                ></span>
              </div>
              <span className="font-bold tracking-wide">{status}</span>
            </div>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-1 shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Distance
              </span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-white">
                  {Number(distance).toFixed(1)}
                </span>
                <span className="text-xs text-slate-500 font-semibold">m</span>
              </div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 border border-slate-700/50 flex flex-col gap-1 shadow-inner">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Coordinates
              </span>
              <div className="flex flex-col mt-1">
                <span className="text-sm font-mono text-slate-300">
                  {trackerPos[0].toFixed(4)}
                </span>
                <span className="text-sm font-mono text-slate-300">
                  {trackerPos[1].toFixed(4)}
                </span>
              </div>
            </div>
          </div>

          {/* Geofence Controls */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Geofence Controls
            </span>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center">
                <label className="text-xs text-yellow-500 font-semibold">
                  Yellow Zone
                </label>
                <span className="text-xs font-mono text-slate-300">
                  {yellowZoneRadius}m
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="2000"
                value={yellowZoneRadius}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setYellowZoneRadius(val);
                  if (val >= redZoneRadius) {
                    setRedZoneRadius(val + 1);
                  }
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
            <div className="flex flex-col gap-1 mt-2">
              <div className="flex justify-between items-center">
                <label className="text-xs text-red-500 font-semibold">
                  Red Zone
                </label>
                <span className="text-xs font-mono text-slate-300">
                  {redZoneRadius}m
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="2000"
                value={redZoneRadius}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setRedZoneRadius(val);
                  if (val <= yellowZoneRadius) {
                    setYellowZoneRadius(val - 1);
                  }
                }}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
              />
            </div>
          </div>

          {/* Tracker Vitals */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-700/50">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Tracker Vitals
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 flex flex-col items-center justify-center gap-1 shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  Battery
                </span>
                <span className="text-sm font-bold text-emerald-400">84%</span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 flex flex-col items-center justify-center gap-1 shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  Speed
                </span>
                <span className="text-sm font-bold text-white flex items-baseline">
                  3.2
                  <span className="text-[9px] text-slate-500 font-medium ml-0.5">
                    km/h
                  </span>
                </span>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-2 border border-slate-700/50 flex flex-col items-center justify-center gap-1 shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold uppercase">
                  GPS
                </span>
                <span className="text-[11px] font-bold text-indigo-400">
                  Strong
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6 z-[1000]">
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="flex items-center justify-center w-12 h-12 bg-slate-900/90 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl shadow-black/50 text-slate-300 hover:text-white hover:bg-slate-800 transition-all duration-300"
          title="Toggle Dark Mode"
        >
          {isDarkMode ? (
            <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {/* Map Container */}
      <div className={`absolute inset-0 z-[1] ${isDarkMode ? 'dark-mode' : ''}`}>
        <MapContainer
          center={center}
          zoom={18}
          zoomControl={false}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />

          <Marker position={center}>
            <Popup>Base Station</Popup>
          </Marker>

          <Circle
            center={center}
            radius={yellowZoneRadius}
            pathOptions={{
              color: "#eab308",
              fillColor: "#fef08a",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "4",
            }}
          />
          <Circle
            center={center}
            radius={redZoneRadius}
            pathOptions={{
              color: "#ef4444",
              fillColor: "#fecaca",
              fillOpacity: 0.15,
              weight: 2,
              dashArray: "4",
            }}
          />

          <Marker
            position={trackerPos}
            icon={trackerIcon}
            draggable={true}
            eventHandlers={{ dragend: handleDragEnd }}
          >
            <Popup>Live Tracker</Popup>
          </Marker>
        </MapContainer>
      </div>
    </div>
  );
}

export default App;
