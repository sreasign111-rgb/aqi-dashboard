// Fixed map initialization
let map = L.map('map').setView([20.5937, 78.9629], 5);

// Fixed tile layer URL
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors',
  maxZoom: 18
}).addTo(map);

// Major cities
const cities = [
  {name:"Delhi",lat:28.6139,lon:77.2090},
  {name:"Mumbai",lat:19.0760,lon:72.8777},
  {name:"Bangalore",lat:12.9716,lon:77.5946},
  {name:"Kolkata",lat:22.5726,lon:88.3639},
  {name:"Chennai",lat:13.0827,lon:80.2707},
  {name:"Pune",lat:18.5204,lon:73.8567}
];

cities.forEach(c => {
  fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${c.lat}&longitude=${c.lon}&hourly=pm2_5`)
    .then(r => r.json())
    .then(d => {
      const pm25 = d.hourly.pm2_5[0] || 0;
      const aqi = Math.round(Math.min(500, pm25 * 4.166));
      const color = aqi <= 50 ? "#00e400" : aqi <= 100 ? "#ffff00" : aqi <= 150 ? "#ff7e00" : 
                    aqi <= 200 ? "#ff0000" : aqi <= 300 ? "#8f3f97" : "#7e0023";

      L.circleMarker([c.lat, c.lon], {
        radius: 14, weight: 4, color: "#fff", fillColor: color, fillOpacity: 0.9
      }).addTo(map)
       .bindPopup(`<b class="text-white text-lg">${c.name}</b><br>AQI: <strong class="text-2xl">${aqi}</strong>`);
    });
});

// Search function - FIXED
document.getElementById("searchBtn").onclick = searchCity;
document.getElementById("cityInput").addEventListener("keypress", e => e.key === "Enter" && searchCity());

async function searchCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) return;

  try {
    const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`)
      .then(r => r.json());

    if (!geo.results || geo.results.length === 0) throw "Not found";

    const {latitude: lat, longitude: lon, name, admin1} = geo.results[0];
    const data = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&hourly=pm2_5,temperature_2m`)
      .then(r => r.json());

    const pm25 = data.hourly.pm2_5[0] || 0;
    const temp = data.hourly.temperature_2m[0]?.toFixed(1) || "N/A";
    const aqi = Math.round(Math.min(500, pm25 * 4.166));

    const advice = aqi <= 50 ? "Good" : aqi <= 100 ? "Moderate" : aqi <= 150 ? "Unhealthy for Sensitive" : 
                   aqi <= 200 ? "Unhealthy" : "Hazardous";

    const suggestions = aqi <= 50 ? ["Safe for all activities", "Open windows"] :
      aqi <= 150 ? ["Wear mask if sensitive", "Limit outdoor time"] :
      ["Stay indoors", "Use air purifier", "Wear N95 mask"];

    document.getElementById("cityName").textContent = name + (admin1 ? `, ${admin1}` : "");
    document.getElementById("aqiValue").textContent = aqi;
    document.getElementById("healthAdvice").textContent = advice;
    document.getElementById("pm25").textContent = pm25.toFixed(1);
    document.getElementById("temp").textContent = temp;

    const ul = document.getElementById("suggestions");
    ul.innerHTML = "";
    suggestions.forEach(s => {
      const li = document.createElement("li");
      li.innerHTML = `${s}`;
      ul.appendChild(li);
    });

    document.getElementById("result").classList.remove("hidden");
    document.getElementById("result").scrollIntoView({ behavior: "smooth" });

    map.setView([lat, lon], 11);

  } catch (err) {
    alert("City not found! Try: Delhi, Mumbai, Bangalore, Pune, Chennai");
  }
}