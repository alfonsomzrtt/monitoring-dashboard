// =========================
// CONFIG
// =========================
const BROKER = "b8ae4809915f4027b2d18c7fc219b204.s1.eu.hivemq.cloud";
const PORT = 8884;
const USER = "esp32-v1";
const PASS = "RajaSawit_2026";

const TIMEOUT = 5000; // ms → dianggap offline

// =========================
// STATE
// =========================
const nodes = {}; 
// nodes[nodeId] = {
//   value,
//   lastUpdate,
//   el
// }

// =========================
// DOM
// =========================
const grid = document.getElementById("grid");

// =========================
// CREATE CARD (Living Card)
// =========================
function createCard(nodeId) {
  const el = document.createElement("div");
  el.className = "card offline";

  el.innerHTML = `
    <div class="node-title">${nodeId.toUpperCase()}</div>
    <div class="value">-- dBA</div>
    <div class="sub">OFFLINE</div>
  `;

  el.onclick = () => {
    window.location.href = `dashboard.html?node=${nodeId}`;
  };

  grid.appendChild(el);

  nodes[nodeId] = {
    value: null,
    lastUpdate: 0,
    el: el
  };
}

// =========================
// UPDATE CARD UI
// =========================
function updateCard(nodeId, value) {
  if (!nodes[nodeId]) {
    createCard(nodeId);
  }

  const node = nodes[nodeId];

  node.value = value;
  node.lastUpdate = Date.now();

  const isOnline = true;

  const valueEl = node.el.querySelector(".value");
  const statusEl = node.el.querySelector(".sub");

  valueEl.textContent = value.toFixed(1) + " dBA";
  statusEl.textContent = "ONLINE";

//   node.el.classList.remove("offline");
//   node.el.classList.add("online");

node.el.classList.remove("online", "warning", "danger", "offline");

if (value > 80) {
  node.el.classList.add("danger");
} else if (value > 60) {
  node.el.classList.add("warning");
} else {
  node.el.classList.add("online");
}

  // optional: threshold warna
  if (value > 80) {
    valueEl.style.color = "#EF4444";
  } else if (value > 60) {
    valueEl.style.color = "#FACC15";
  } else {
    valueEl.style.color = "#22C55E";
  }
}

// =========================
// OFFLINE WATCHDOG
// =========================
function checkOffline() {
  const now = Date.now();

  Object.keys(nodes).forEach(nodeId => {
    const node = nodes[nodeId];

    if (now - node.lastUpdate > TIMEOUT) {
      const statusEl = node.el.querySelector(".sub");

      statusEl.textContent = "OFFLINE";
      node.el.classList.remove("online", "warning", "danger");
      node.el.classList.add("offline");
    }
  });
}

setInterval(checkOffline, 2000);

// =========================
// MQTT SETUP (PAHO)
// =========================
const client = new Paho.MQTT.Client(
  BROKER,
  PORT,
  "overview_" + Math.random()
);

// connection lost
client.onConnectionLost = function (responseObject) {
  console.warn("MQTT lost:", responseObject.errorMessage);
};

// message handler
client.onMessageArrived = function (message) {
  const topic = message.destinationName;
  const payload = message.payloadString;

  // contoh topic: monitoring/gate1/db
  const parts = topic.split("/");
  const nodeId = parts[1];

  let value;

  // fleksibel parsing
  try {
    const data = JSON.parse(payload);
    value = data.spl ?? data.value ?? parseFloat(payload);
  } catch {
    value = parseFloat(payload);
  }

  if (isNaN(value)) return;

  updateCard(nodeId, value);
};

// connect
function onConnect() {
  console.log("MQTT connected (overview)");

  // wildcard → semua node
  client.subscribe("monitoring/+/db");
}

client.connect({
  userName: USER,
  password: PASS,
  useSSL: true,
  onSuccess: onConnect,
  // reconnect: true
});
