// =========================
// DOM ELEMENTS
// =========================
const splEl = document.getElementById("spl");
const minEl = document.getElementById("min");
const maxEl = document.getElementById("max");
const avgEl = document.getElementById("avg");
const statusEl = document.getElementById("status");

// =========================
// STATE
// =========================
const MAX_POINTS = 30;

// =========================
// STATUS LOGIC
// =========================
function updateStatus(spl) {
  if (spl < 60) {
    statusEl.textContent = "STATUS: NORMAL";
    splEl.style.color = "#22C55E";
  } else if (spl < 80) {
    statusEl.textContent = "STATUS: WARNING";
    splEl.style.color = "#FACC15";
  } else {
    statusEl.textContent = "STATUS: DANGER";
    splEl.style.color = "#EF4444";
  }
}

function updateStats() {
  const data = splData.datasets[0].data;

  if (data.length === 0) return;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const sum = data.reduce((a, b) => a + b, 0);
  const avg = sum / data.length;

  minEl.textContent = min.toFixed(1);
  maxEl.textContent = max.toFixed(1);
  avgEl.textContent = avg.toFixed(1);
}

// =========================
// CHART SETUP
// =========================
const ctx = document.getElementById("splChart").getContext("2d");

const splData = {
  labels: [],
  datasets: [{
    label: "SPL (dB)",
    data: [],
    borderColor: "#22C55E",
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 2,
    tension: 0.3,
    fill: true,
    pointRadius: 1
  }]
};

const splChart = new Chart(ctx, {
  type: "line",
  data: splData,
  options: {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: {
        display: false
      },
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: "#94A3B8"
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

// =========================
// MQTT CONNECTION
// =========================
const client = mqtt.connect("ws://192.168.88.221:9001");

client.on("connect", () => {
  console.log("MQTT connected");
  statusEl.textContent = "STATUS: CONNECTED";
  client.subscribe("spl/data");
});

client.on("message", (topic, message) => {
  const data = JSON.parse(message.toString());
  const spl = data.spl;

  // Update main value
  splEl.textContent = spl.toFixed(1);

  // Update status
  updateStatus(spl);

  // Update chart
  const now = new Date().toLocaleTimeString();

  splData.labels.push(now);
  splData.datasets[0].data.push(spl);

  if (splData.labels.length > MAX_POINTS) {
    splData.labels.shift();
    splData.datasets[0].data.shift();
  }

  // Update stats (based on current window)
  updateStats();

  splChart.update();
});

client.on("error", (err) => {
  console.error("MQTT error:", err);
  statusEl.textContent = "STATUS: ERROR";
});

client.on("close", () => {
  console.warn("MQTT disconnected");
  statusEl.textContent = "STATUS: DISCONNECTED";
});
